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
mod player;
mod physics;
mod character;
mod structs;
mod world;

mod physics_objects {
    pub mod asset;
    pub mod collision;
    pub mod dynamic;
    pub mod launchpad;
    pub mod pivot;
    pub mod ragdoll;
    pub mod rigid_body_parent;
    pub mod spin;
}

mod vehicles{
    pub mod blimp;
    pub mod vehicles;
}

mod nav_mesh{
    pub mod nav_mesh;
}

mod character_states {
    pub mod character_base;
    pub mod falling;
    pub mod idle;
    pub mod jumpidle;
    pub mod walk;
}

use crate::{
    physics::Physics, structs::{message_prep, VehicleUpdate}, world::World, vehicles::vehicles::GetInfo, player::Player,
};
use crate::structs::ObjectUpdate;

use futures_channel::mpsc::unbounded;
use futures_util::{future, pin_mut, stream::TryStreamExt, StreamExt};

use tokio::net::{TcpListener, TcpStream};

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

async fn socket_handler(peer_map: PeerMap, listener: TcpListener) {
    while let Ok((stream, addr)) = listener.accept().await {
        tokio::spawn(handle_connection(peer_map.clone(), stream, addr));
    }
}

#[tokio::main]
async fn main() -> Result<(), IoError> {
    let path;
    let asset_path;
    let ip;
    let debug: bool;
    if cfg!(debug_assertions) {
        debug = true;
        println!("Running debug server");
        // path = "../client/dist/client/assets/world.glb";
        path = "../Blender/";
        asset_path = "../client/dist/client/assets/unoptimized/";
        ip = "127.0.0.1:2865";
    } else {
        debug = false;
        println!("Running Prod Server");
        path = "/assets/"; //collision.glb"
        asset_path = "/assets_unoptimized/"; //TODO
        ip = "0.0.0.0:2865"
    }

    let addr = env::args().nth(1).unwrap_or_else(|| ip.to_string());

    let state = PeerMap::new(Mutex::new(HashMap::new()));

    let try_socket = TcpListener::bind(&addr).await;
    let listener = try_socket.expect("Failed to bind");
    println!("Listening on: {}", addr);
    // sokcer_handler(state.clone(),listener).await;
    tokio::spawn(socket_handler(state.clone(), listener));

    let mut physics_engine = Physics::new();

    let mut world = World::new(asset_path, path);

    world.load_world(path, &mut physics_engine);

    // let ragdoll =

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
                        players.len(),
                        &world.spawn_points,
                        key.clone(),
                        &mut physics_engine,
                        world.character_ragdoll_template.clone(),
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
            for (socket, player) in players.iter_mut() {
                //set the grounded to false
                // p.1.on_ground = false;

                if !peers.contains_key(socket) {
                    player.remove_self(&mut physics_engine);
                    // world.collider_set.remove(value.collider_handle, &mut island_manager, &mut world.rigid_body_set, true);

                    players_to_remove.push(socket.clone());
                }
            }

            //Remove clients which no longer exist
            for p in players_to_remove {
                players.remove(&p);
                println!("Removed player");
            }

            for (socket, player) in players.iter_mut() {
                let client = peers.get_mut(&socket).unwrap();
                player.read_messages(client, &mut physics_engine, &mut world.vehicles, &world.nav_mesh);
            }

            let players_clone = players.clone();

            for (_socket, player) in players.iter_mut() {
                player.update_physics(&mut world, &mut physics_engine, &players_clone);
            }

            for (vehicles) in world.vehicles.iter_mut(){
                vehicles.1.update_physics(&mut physics_engine);
            }

            //Send chat messages
            for (_socket, player) in players.iter_mut() {
                loop {
                    if player.chat_queue.len() == 0 {
                        break;
                    }

                    let msg = player.chat_queue.pop().unwrap();
                    let name = player.name.clone();
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
            world.update(&mut players, &mut physics_engine);

            // Send players_info

            let mut players_info = HashMap::new();

            for (socket, player) in players.iter_mut() {
                players_info.insert(socket.to_string(), player.get_info(&mut physics_engine));
            }

            let dynamic_objects_info: HashMap<String, ObjectUpdate> = world
                .dynamic_objects
                .iter_mut()
                .map(|x| (x.name(), x.get_info(&mut physics_engine.rigid_body_set)))
                .collect();

            let vehicles_info: HashMap<String,VehicleUpdate> = world.vehicles.iter_mut().map(|(_,x)| (x.name.clone(), x.get_info(&mut physics_engine.rigid_body_set))).collect();

            // let ragdoll_info = ragdoll.get_info(&mut physics_engine);

            let player_update_message = structs::MessageType::WorldUpdate {
                players: players_info,
                dynamic_objects: dynamic_objects_info,
                vehicles: vehicles_info
                // ragdolls : ragdoll_info
            };

            //send player_update to all players
            for (_, value) in &*peers {
                value
                    .tx
                    .unbounded_send(message_prep(player_update_message.clone()))
                    .unwrap();
            }

            if debug {
                for (_, value) in &*peers {
                    value
                        .tx
                        .unbounded_send(message_prep(structs::MessageType::PhysicsUpdate {
                            data: physics_engine.get_state_update(),
                        }))
                        .unwrap();
                }
            }

            let duration = Instant::now() - start_time;

            time_since_last = Instant::now();
            wait_time = 15 - duration.as_millis().min(15);
        }
    }

    // Ok(())
}
