extern crate websocket;

use nalgebra::Vector3;
use std::collections::HashMap;
use std::sync::Arc;
use std::thread;
use websocket::sync::Server;
use websocket::OwnedMessage;
mod client;
mod player;
mod structs;
mod world;
mod dynamic;
use rapier3d::{crossbeam, prelude::*};
// use std::sync::Arc;
use crate::player::Player;
use crate::structs::PlayerUpdate;
use crate::world::World;
use std::process::Command;
use std::sync::RwLock;

fn main() {
    //RAPIER BOILERPLATE
    let mut world = World::new();
 
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

    let mut server = Server::bind("127.0.0.1:2865").unwrap();
    server.set_nonblocking(true);

    // let mut players: Arc<RwLock<Vec<Player>>> = Arc::new(RwLock::new(Vec::new()));
    let mut players: Vec<Player> = Vec::new();

    // let mut chat_queue: Vec<ChatMessage> = Vec::new();
    // let clients_c = clients.clone();

    // println!("{}", clients.read().unwrap().len());
    // thread::spawn(move ||{
    // for request in server.filter_map(Result::ok) {

    //     if !request.protocols().contains(&"rust-websocket".to_string()) {
    //         request.reject().unwrap();
    //         return;
    //     }

    //     let mut client = request.use_protocol("rust-websocket").accept().unwrap();

    //     let mut client2 = client::Client::new(client);

    //         println!("creating client");

    //     clients_c.write().unwrap().push(client2);
    // }
    // });

    println!("HIIII");
    loop {
        let result = match server.accept() {
            Ok(wsupgrade) => {

                println!("packet");

                if !wsupgrade
                    .protocols()
                    .contains(&"rust-websocket".to_string())
                {
                    wsupgrade.reject().unwrap();
                    return;
                }

                let mut client = wsupgrade.use_protocol("rust-websocket").accept().unwrap();
                // let id = client.
                let mut client2 = client::Client::new(client);

                println!("creating client");

                let player = Player::new(
                    client2,
                    players.len(),
                    &mut world.rigid_body_set,
                    &mut world.collider_set,
                );

                // players.write().unwrap().push(player);
                players.push(player);
            }
            _ => {
                // println!("blahh");
                // Nobody tried to connect, move on.
            }
        };

        // let mut players_unlocked = players.write().unwrap();

        for player in players.iter_mut() {
            //parse socket messages
            player.read_messages();
        }

        for i in 0..players.len() {
            players[i].update_physics(&mut world.rigid_body_set,&mut world.collider_set,integration_parameters);
        }
        // for player in players.iter_mut() {
        //     //send chat messages
        //     loop {
        //         if (player.chat_queue.len() == 0) {
        //             break;
        //         }

        //         let msg = player.chat_queue.pop();

        //         for p in players.iter() {}
        //     }
        // }

        for i in 0..players.len() {
            loop {
                if players[i].chat_queue.len() == 0 {
                    break;
                }

                let msg = players[i].chat_queue.pop().unwrap();
                let name = players[i].name.clone();
                for p in players.iter_mut() {
                    p.client.send(structs::MessageType::Chat {
                        name: name.clone(),
                        message: msg.clone(),
                    })
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

        while let Ok(collision_event) = collision_recv.try_recv() {
            // Handle the collision event.
            println!("Received collision event: {:?}", collision_event);
            // collision_event.collider1()

            if collision_event.started() {
                let collider_handle1 = collision_event.collider1();
                let collider_handle2 = collision_event.collider2();

                if let Some(contact_pair) =
                    narrow_phase.contact_pair(collider_handle1, collider_handle2)
                {
                    if contact_pair.has_any_active_contact {
                        println!("Active contacts");
                        for manifold in &contact_pair.manifolds {
                            if manifold.data.normal.dot(&Vector3::new(0.0, 1.0, 0.0)) > 0.9 {
                                for i in 0..players.len() {
                                    if players[i].collider_handle == collider_handle2 {
                                        players[i].can_jump = true;
                                        println!("reset jump");
                                    }
                                }

                                println!("reset jump");
                            }else{

                            }
                            // println!("Local-space contact normal: {}", manifold.local_n1);
                            // println!("Local-space contact normal: {}", manifold.local_n2);
                            // println!("World-space contact normal: {}", manifold.data.normal);
                        }
                    }else{
                        println!("No active contanct");
                    }
                }
            }

            // if collision_event.started() {
            //     for i in 0..players.len() {
            //         if (players[i].collider_handle == collision_event.collider1()
            //             || players[i].collider_handle == collision_event.collider2())
            //         {
            //             if let Some(contact_pair) =
            //                 narrow_phase.contact_pair(collider_handle1, collider_handle2)
            //             {
            //                 // println!("{:?}" ,contact_pair);
            //             }
            //         }
            //     }
            // }
        }

        while let Ok(contact_force_event) = contact_force_recv.try_recv() {
            // Handle the contact force event.
            println!("Received contact force event: {:?}", contact_force_event);
        }

        // if players.len() != 0 {
        //     let ball_body = &rigid_body_set[players[0].rigid_body_handle];
        //     // println!("Ball altitude: {}", ball_body.translation().y);
        // }

        // Sewnd players_info

        let mut players_info = HashMap::new();
        for i in 0..players.len() {
            // let info  = players[i].get_info(&mut rigid_body_set);
            players_info.insert(
                players[i].id.clone(),
                players[i].get_info(&mut world.rigid_body_set),
            );
        }

        let mut dynamic_objects_info = HashMap::new();
        for i in 0..world.dynamic_objects.len() {
            // let info  = players[i].get_info(&mut rigid_body_set);
            dynamic_objects_info.insert(
                world.dynamic_objects[i].name.clone(),
                world.dynamic_objects[i].get_info(&mut world.rigid_body_set, &mut world.collider_set),
            );
        }

        let PlayerUpdateMessage = structs::MessageType::WorldUpdate { players: players_info, dynamic_objects: dynamic_objects_info } ;

        //send player_update to all players
        for i in 0..players.len() {
            players[i].client.send(PlayerUpdateMessage.clone());
        }

        let mut child = Command::new("sleep").arg("0.015").spawn().unwrap();
        let _result = child.wait().unwrap();
    }
}
