extern crate websocket;
use std::{
    collections::HashMap,
    env,
    io::Error as IoError,
    net::SocketAddr,
    sync::{Arc, Mutex},
    thread, process::Command,
};
use nalgebra::Vector3;
use structs::{Client, MessageType};
// use std::collections::HashMap;
// use std::sync::Arc;
// use std::thread;
use std::time::Instant;
use websocket::sync::Server;
use websocket::OwnedMessage;
mod client;
mod dynamic;
mod player;
mod structs;
mod world;
use rapier3d::{crossbeam, prelude::*};
// use std::sync::Arc;
use crate::player::Player;
use crate::structs::PlayerUpdate;
use crate::world::World;
// use std::process::Command;
use std::sync::RwLock;

use futures_channel::mpsc::{unbounded, UnboundedReceiver, UnboundedSender};
use futures_util::{
    future, pin_mut,
    stream::{Collect, TryStreamExt},
    StreamExt,
};

use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::tungstenite;
use tungstenite::protocol::Message;

type PeerMap = Arc<Mutex<HashMap<SocketAddr, Client>>>;



async fn handle_connection(peer_map: PeerMap, raw_stream: TcpStream, addr: SocketAddr) {
    println!("Incoming TCP connection from: {}", addr);

    let ws_stream = tokio_tungstenite::accept_async(raw_stream)
        .await
        .expect("Error during the websocket handshake occurred");
    println!("WebSocket connection established: {}", addr);

    // Insert the write part of this peer to the peer map.
    let (tx, rx) = unbounded();
    let (tx_receive, rx_receive) = unbounded();

    peer_map.lock().unwrap().insert(
        addr,
        Client {
            tx: tx,
            rx: rx_receive,
        },
    );

    let (outgoing, incoming) = ws_stream.split();

    let broadcast_incoming = incoming.try_for_each(|msg| {
        // println!(
        //     "Received a message from {}: {}",
        //     addr,
        //     msg.to_text().unwrap()
        // );

        tx_receive.unbounded_send(msg.clone()).unwrap();

        future::ok(())
    });

    let receive_from_others = rx.map(Ok).forward(outgoing);

    pin_mut!(broadcast_incoming, receive_from_others);
    future::select(broadcast_incoming, receive_from_others).await;

    println!("{} disconnected", &addr);
    peer_map.lock().unwrap().remove(&addr);
}

async fn sokcer_handler(peer_map: PeerMap, listener: TcpListener) {
    while let Ok((stream, addr)) = listener.accept().await {
        // println!("connection")
        tokio::spawn(handle_connection(peer_map.clone(), stream, addr));
    }
}


#[tokio::main]
async fn main() -> Result<(), IoError> {

    let path;
    let ip;
    if cfg!(debug_assertions) {
        println!("Running debug server");
        path = "../client/dist/client/assets/world.glb";
        ip = "127.0.0.1:2865";
    } else {
        println!("Running Prod Server");
        path = "/assets/world.glb";
        ip = "0.0.0.0:2865"
    }

    let addr = env::args()
    .nth(1)
    .unwrap_or_else(|| ip.to_string());

    let mut state = PeerMap::new(Mutex::new(HashMap::new()));

    let try_socket = TcpListener::bind(&addr).await;
    let listener = try_socket.expect("Failed to bind");
    println!("Listening on: {}", addr);
    // sokcer_handler(state.clone(),listener).await;
    tokio::spawn(sokcer_handler(state.clone(), listener));






    //RAPIER BOILERPLATE
    let mut world = World::new(path);
    let mut time_since_last = Instant::now();
    let mut wait_time = 0;
    // return;
    // let mut rigid_body_set = RigidBodySet::new();
    // let mut collider_set = ColliderSet::new();
    /* Create the ground. */
    // let collider = ColliderBuilder::cuboid(10.0, 0.1, 10.0).build();

    /* Create other structures necessary for the simulation. */
    let gravity = vector![0.0, -9.81, 0.0];
    let integration_parameters = IntegrationParameters::default();
    let mut physics_pipeline = PhysicsPipeline::new();
    let mut island_manager = IslandManager::new();
    let mut broad_phase = BroadPhase::new();
    let mut narrow_phase = NarrowPhase::new();
    let mut impulse_joint_set = ImpulseJointSet::new();
    let mut multibody_joint_set = MultibodyJointSet::new();
    let mut ccd_solver = CCDSolver::new();
    let physics_hooks = ();
    // let event_handler = ();

    let (collision_send, collision_recv) = crossbeam::channel::unbounded();
    let (contact_force_send, contact_force_recv) = crossbeam::channel::unbounded();



    let event_handler = ChannelEventCollector::new(collision_send, contact_force_send);

    // // let mut server = Server::bind(ip).unwrap();
    // let mut server = Server::bind(ip).unwrap();
    // server.set_nonblocking(true);

    // let mut players: Arc<RwLock<Vec<Player>>> = Arc::new(RwLock::new(Vec::new()));
    let mut players: HashMap<SocketAddr,Player> = HashMap::new();

    println!("HIIII");
    loop {

        if (Instant::now()-time_since_last).as_millis()>wait_time {
            
        let start_time = Instant::now();

        //Check for new clients

        let mut peers = state.lock().unwrap();

        for (key, value) in &*peers {
            if !players.contains_key(key){
                let player = Player::new(
                    // client2,
                    players.len(),
                    &mut world.rigid_body_set,
                    &mut world.collider_set,
                );

                value.tx.unbounded_send(MessagePrep(MessageType::Join {
                    name: player.name.to_string(),
                    id: key.to_string(),
                })).unwrap();

                players.insert(key.clone(), player);
            }
        }

        //Check for clients which no longer exist
        let mut players_to_remove = Vec::new();
        for p in players.iter_mut() {
            if !peers.contains_key(p.0){
                // world.collider_set.remove(value.collider_handle, &mut island_manager, &mut world.rigid_body_set, true);
                world.rigid_body_set.remove(p.1.rigid_body_handle,&mut island_manager,&mut world.collider_set,
                &mut impulse_joint_set,&mut multibody_joint_set,true);
                players_to_remove.push(p.0.clone());
                // players.remove(p.0);
            }
        }

        //Remove clients which no longer exist
        for p in players_to_remove{
            players.remove(&p);
            println!("Removed player");
        }

        let d_a  = Instant::now()-start_time;
        let b_start = Instant::now();
        // let mut players_unlocked = players.write().unwrap();

        for p in players.iter_mut() {
            let c =peers.get_mut(&p.0).unwrap();
            p.1.read_messages(c);


        }

       
        for p in players.iter_mut() {
            p.1.update_physics(
                &mut world.rigid_body_set,
                &mut world.collider_set,
                integration_parameters,
            );
        }

        let d_b  = Instant::now()-b_start;
        let c_start = Instant::now();
        // for player in players.iter_mut() {
        //     //send chat messages
        //     loop {
        //         if (player.1.chat_queue.len() == 0) {
        //             break;
        //         }

        //         let msg = player.1.chat_queue.pop();

        //         for p in players.iter() {


        //         }
        //     }
        // }

        for player in players.iter_mut() {
            loop {
                if player.1.chat_queue.len() == 0 {
                    break;
                }

                let msg = player.1.chat_queue.pop().unwrap();
                let name = player.1.name.clone();
                for (_, p) in &*peers {

                    p.tx.unbounded_send(MessagePrep(structs::MessageType::Chat {
                        name: name.clone(),
                        message: msg.clone(),
                    })).unwrap();

                }
            }
        }

        let d_c  = Instant::now()-c_start;
        let d_start = Instant::now();

        physics_pipeline.step(
            &gravity,
            &integration_parameters,
            &mut island_manager,
            &mut broad_phase,
            &mut narrow_phase,
            &mut world.rigid_body_set,
            &mut world.collider_set,
            &mut impulse_joint_set,
            &mut multibody_joint_set,
            &mut ccd_solver,
            &physics_hooks,
            &event_handler,
        );

        let d_d  = Instant::now()-d_start;
        let e_start = Instant::now();

        while let Ok(collision_event) = collision_recv.try_recv() {
  
            if collision_event.started() {
                let collider_handle1 = collision_event.collider1();
                let collider_handle2 = collision_event.collider2();

                if let Some(contact_pair) =
                    narrow_phase.contact_pair(collider_handle1, collider_handle2)
                {
                    if contact_pair.has_any_active_contact {
                        for manifold in &contact_pair.manifolds {
                            if manifold.data.normal.dot(&Vector3::new(0.0, 1.0, 0.0)) > 0.9 {
                                for player in players.iter_mut() {
                                // for (key, value) in &players {
                                    if player.1.collider_handle == collider_handle2 {
                                        player.1.can_jump = true;
                                    }
                                }
                            } else {
                            }
                            // println!("Local-space contact normal: {}", manifold.local_n1);
                            // println!("Local-space contact normal: {}", manifold.local_n2);
                            // println!("World-space contact normal: {}", manifold.data.normal);
                        }
                    } else {
                    }
                }
            }
        }

        let d_e  = Instant::now()-e_start;
        let f_start = Instant::now();



        // Sewnd players_info

        let mut players_info = HashMap::new();


        for player in players.iter_mut() {
            // let info  = players[i].get_info(&mut rigid_body_set);
            players_info.insert(
                player.0.to_string(),
                player.1.get_info(&mut world.rigid_body_set),
            );
        }



        let mut dynamic_objects_info = HashMap::new();
        for i in 0..world.dynamic_objects.len() {
            // let info  = players[i].get_info(&mut rigid_body_set);
            dynamic_objects_info.insert(
                world.dynamic_objects[i].name.clone(),
                world.dynamic_objects[i]
                    .get_info(&mut world.rigid_body_set, &mut world.collider_set),
            );
        }

        let player_update_message = structs::MessageType::WorldUpdate {
            players: players_info,
            dynamic_objects: dynamic_objects_info,
        };

        let d_f  = Instant::now()-f_start;
        let g_start = Instant::now();

        //send player_update to all players
        for (key, value) in &*peers {
            value.tx.unbounded_send(MessagePrep(player_update_message.clone())).unwrap();
        }

        let d_g  = Instant::now()-g_start;
        let h_start = Instant::now();

        let duration = Instant::now() - start_time;
        
        if duration.as_millis() < 16 {
            let wait_time = 16 - duration.as_millis();
            // println!("Update time {:?} {:?}",duration,wait_time);
            let wait_string = (wait_time as f64 / 1000.00).to_string();
            // println!(
            //     "Update time {:?} {:?} {:?}",
            //     duration, wait_time, wait_string
            // );
            println!("T: {:?} A: {:?} B: {:?} C: {:?} D: {:?} E: {:?} F: {:?} G: {:?}",duration,d_a,d_b,d_c,d_d,d_e,d_f,d_g);
            // let mut child = Command::new("sleep").arg(wait_string).spawn().unwrap();
            // let _result = child.wait().unwrap();
        }else{
            // println!("T: {:?} A: {:?} B: {:?} C: {:?} D: {:?} E: {:?} F: {:?} G: {:?}",duration,d_a,d_b,d_c,d_d,d_e,d_f,d_g);
        }
        time_since_last = Instant::now();
        wait_time = 15 - duration.as_millis().min(15);
        println!("{} {}",wait_time,duration.as_millis());
    }else{
        
    }
    
    }

    Ok(())
}

fn MessagePrep(msg: MessageType)->Message{
   Message::Text(serde_json::to_string(&msg).unwrap())
}