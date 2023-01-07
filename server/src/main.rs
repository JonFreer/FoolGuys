
use std::{
    collections::HashMap,
    env,
    io::Error as IoError,
    net::SocketAddr,
    sync::{Arc, Mutex},
};
use structs::{Client, MessageType};

use std::time::Instant;

mod animation;
mod client;
// mod dynamic;
mod player;
mod structs;
mod world;
mod physics_objects {
    pub mod launchpad;
    pub mod spin;
    pub mod collision;
    pub mod pivot;
    pub mod dynamic;
}

mod character_states {
    pub mod character_base;
    pub mod idle;
    pub mod walk;
    pub mod jumpidle;
    pub mod falling;
}

use rapier3d::{crossbeam, prelude::*};

use crate::{world::{World}, physics_objects::dynamic::Objects};
use crate::{player::Player, structs::ObjectUpdate};

use futures_channel::mpsc::unbounded;
use futures_util::{future, pin_mut, stream::TryStreamExt, StreamExt};

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
        // path = "../client/dist/client/assets/world.glb";
        path = "../Blender/collision.glb";
        ip = "127.0.0.1:2865";
    } else {
        println!("Running Prod Server");
        path = "/assets/world.glb";
        ip = "0.0.0.0:2865"
    }

    let addr = env::args().nth(1).unwrap_or_else(|| ip.to_string());

    let state = PeerMap::new(Mutex::new(HashMap::new()));

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
    let mut query_pipline= QueryPipeline::new();

    // let f = query_pipline.flags;
    // let event_handler = ();

    let (collision_send, collision_recv) = crossbeam::channel::unbounded();
    let (contact_force_send, _contact_force_recv) = crossbeam::channel::unbounded();

    let event_handler = ChannelEventCollector::new(collision_send, contact_force_send);

    // // let mut server = Server::bind(ip).unwrap();
    // let mut server = Server::bind(ip).unwrap();
    // server.set_nonblocking(true);

    // let mut players: Arc<RwLock<Vec<Player>>> = Arc::new(RwLock::new(Vec::new()));
    let mut players: HashMap<SocketAddr, Player> = HashMap::new();

    println!("HIIII");
    loop {
        if (Instant::now() - time_since_last).as_millis() > wait_time {
            let start_time = Instant::now();

            //Check for new clients

            let mut peers = state.lock().unwrap();

            for (key, value) in &*peers {
                if !players.contains_key(key) {
                    let player = Player::new(
                        // client2,
                        players.len(),
                        &mut world.rigid_body_set,
                        &mut world.collider_set,
                        &world.spawn_points
                    );

                    value
                        .tx
                        .unbounded_send(message_prep(MessageType::Join {
                            name: player.name.to_string(),
                            id: key.to_string(),
                        }))
                        .unwrap();

                    players.insert(key.clone(), player);
                }
            }

            //Check for clients which no longer exist
            let mut players_to_remove = Vec::new();
            for p in players.iter_mut() {

                //set the grounded to false
                // p.1.on_ground = false;

                if !peers.contains_key(p.0) {
                    // world.collider_set.remove(value.collider_handle, &mut island_manager, &mut world.rigid_body_set, true);
                    world.rigid_body_set.remove(
                        p.1.rigid_body_handle,
                        &mut island_manager,
                        &mut world.collider_set,
                        &mut impulse_joint_set,
                        &mut multibody_joint_set,
                        true,
                    );
                    players_to_remove.push(p.0.clone());
                    // players.remove(p.0);
                }
            }

            //Remove clients which no longer exist
            for p in players_to_remove {
                players.remove(&p);
                println!("Removed player");
            }

            for p in players.iter_mut() {
                let c = peers.get_mut(&p.0).unwrap();
                p.1.read_messages(c);
            }

            for p in players.iter_mut() {
                p.1.update_physics(
                    &mut world.rigid_body_set,
                    &mut world.collider_set,
                    integration_parameters,
                    &query_pipline,
                    &world.spawn_points
                );
            }

            //Send chat messages
            for player in players.iter_mut() {
                loop {
                    if player.1.chat_queue.len() == 0 {
                        break;
                    }

                    let msg = player.1.chat_queue.pop().unwrap();
                    let name = player.1.name.clone();
                    for (_, p) in &*peers {
                        p.tx.unbounded_send(message_prep(structs::MessageType::Chat {
                            name: name.clone(),
                            message: msg.clone(),
                        }))
                        .unwrap();
                    }
                }
            }

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

            query_pipline.update( &island_manager,&world.rigid_body_set, &world.collider_set);



            // physics_pipeline.step(
            //     &gravity,
            //     &integration_parameters,
            //     &mut island_manager,
            //     &mut broad_phase,
            //     &mut narrow_phase,
            //     &mut world.rigid_body_set,
            //     &mut world.collider_set,
            //     &mut impulse_joint_set,
            //     &mut multibody_joint_set,
            //     &mut ccd_solver,
            //     &physics_hooks,
            //     &event_handler,
            // );

            let mut collision_vec = Vec::new();
            
            while let Ok(collision_event) = collision_recv.try_recv() {
                collision_vec.push(collision_event as CollisionEvent);
            }



            // for collision_event in collision_vec.iter(){
            //     // if collision_event.started() {
            //         // collision_event.
            //         let collider_handle1 = collision_event.collider1();
            //         let collider_handle2 = collision_event.collider2();

            //         if collision_event.stopped() {
            //             for player in players.iter_mut() {
            //                 // for (key, value) in &players {
            //                 let mut index = None;
            //                 if player.1.collider_handle == collider_handle2 {
            //                     index = player.1.on_ground.iter().position(|x| *x == collider_handle1);
            //                 }else if player.1.collider_handle == collider_handle1{
            //                    index = player.1.on_ground.iter().position(|x| *x == collider_handle2);
            //                 }

            //                 if let Some(index) = index{
            //                     player.1.on_ground.remove(index);
            //                 }
            //             }
            //         }


            //         else if let Some(contact_pair) =
            //             narrow_phase.contact_pair(collider_handle1, collider_handle2)
            //         {
            //             if contact_pair.has_any_active_contact {
            //                 for manifold in &contact_pair.manifolds {
            //                     if manifold.data.normal.dot(&Vector3::new(0.0, 1.0, 0.0)) > 0.9 {
            //                         for player in players.iter_mut() {
            //                             // for (key, value) in &players {
            //                             if player.1.collider_handle == collider_handle2 {
            //                                 // if collision_event.started() {
            //                                     player.1.can_jump = true;
            //                                     player.1.on_ground.push(collider_handle1);
                                                
            //                                 // }
            //                                 //  if collision_event.stopped(){
            //                                     // player.1.on_ground = false;
            //                                 // }
            //                             }
            //                         }
            //                     }
            //                     println!("{:?}",manifold.data.normal.dot(&Vector3::new(0.0, 1.0, 0.0)));
            //                 }
            //             }
            //         // }
            //     }

                
            // }

                //Update physics objects
                for object in world.dynamic_objects.iter_mut() {
                match object{
                    Objects::LaunchPad(object)=>{
                        object.update(1.0/60.0,&mut world.rigid_body_set,&collision_vec, &mut players);
                    },
                    _=>{}
                }
            }

          
            // Send players_info

            let mut players_info = HashMap::new();

            for player in players.iter_mut() {
                players_info.insert(
                    player.0.to_string(),
                    player.1.get_info(&mut world.rigid_body_set),
                );
            }

            let dynamic_objects_info: HashMap<String, ObjectUpdate> = world
                .dynamic_objects
                .iter_mut()
                .map(|x|
                     (x.name(), x.get_info(&mut world.rigid_body_set))
                    )
                .collect();

                // let dynamic_objects_info: HashMap<String, ObjectUpdate> = world
                // .dynamic_objects
                // .iter_mut()
                // .map(|x| 
                //      (unpat!(x).name.clone(), x.get_info(&mut world.rigid_body_set))
                //     )
                // .collect();

            // let mut dynamic_objects_info = HashMap::new();
            // for i in 0..world.dynamic_objects.len() {
            //     dynamic_objects_info.insert(
            //         world.dynamic_objects[i].name.clone(),
            //         world.dynamic_objects[i]
            //             .get_info(&mut world.rigid_body_set),
            //     );
            // }

            let player_update_message = structs::MessageType::WorldUpdate {
                players: players_info,
                dynamic_objects: dynamic_objects_info,
            };

            //send player_update to all players
            for (_, value) in &*peers {
                value
                    .tx
                    .unbounded_send(message_prep(player_update_message.clone()))
                    .unwrap();
            }

            let duration = Instant::now() - start_time;

            time_since_last = Instant::now();
            wait_time = 15 - duration.as_millis().min(15);
        }
    }

    // Ok(())
}

fn message_prep(msg: MessageType) -> Message {
    Message::Text(serde_json::to_string(&msg).unwrap())
}
