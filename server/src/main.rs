
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
mod player;
mod structs;
mod world;
mod physics;

mod physics_objects {
    pub mod launchpad;
    pub mod spin;
    pub mod collision;
    pub mod pivot;
    pub mod rigid_body_parent;
    pub mod dynamic;
    pub mod asset;
}

mod character_states {
    pub mod character_base;
    pub mod idle;
    pub mod walk;
    pub mod jumpidle;
    pub mod falling;
}


use crate::{world::{World}, physics::Physics};
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

    // let (gltf, buffers, _) = gltf::import("../client/dist/client/assets/assets/Asset_Apple2.glb").unwrap();
    // Ok()
    // return;

    let path;
    let asset_path;
    let ip;
    if cfg!(debug_assertions) {
        println!("Running debug server");
        // path = "../client/dist/client/assets/world.glb";
        path = "../Blender/collision.glb";
        asset_path = "../client/dist/client/assets/unoptimized/";
        ip = "127.0.0.1:2865";
    } else {
        println!("Running Prod Server");
        path = "/assets/collision.glb";
        asset_path = "/assets_unoptimized/"; //TODO
        ip = "0.0.0.0:2865"
    }

    let addr = env::args().nth(1).unwrap_or_else(|| ip.to_string());

    let state = PeerMap::new(Mutex::new(HashMap::new()));

    let try_socket = TcpListener::bind(&addr).await;
    let listener = try_socket.expect("Failed to bind");
    println!("Listening on: {}", addr);
    // sokcer_handler(state.clone(),listener).await;
    tokio::spawn(sokcer_handler(state.clone(), listener));

    let mut physics_engine = Physics::new();

    let mut world = World::new(asset_path);

    world.load_world(path,&mut physics_engine);

    let mut time_since_last = Instant::now();
    let mut wait_time = 0;

    let mut players: HashMap<SocketAddr, Player> = HashMap::new();

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
                        &mut physics_engine.rigid_body_set,
                        &mut physics_engine.collider_set,
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
                    physics_engine.remove_from_rigid_body_set(p.1.rigid_body_handle);
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
                    &mut world,
                    &mut physics_engine
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

            
            physics_engine.update();



            

                //Update physics objects
            world.update(&mut players,&mut physics_engine);

          
            // Send players_info

            let mut players_info = HashMap::new();

            for player in players.iter_mut() {
                players_info.insert(
                    player.0.to_string(),
                    player.1.get_info(&mut physics_engine.rigid_body_set),
                );
            }

            let dynamic_objects_info: HashMap<String, ObjectUpdate> = world
                .dynamic_objects
                .iter_mut()
                .map(|x|
                     (x.name(), x.get_info(&mut physics_engine.rigid_body_set))
                    )
                .collect();

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
