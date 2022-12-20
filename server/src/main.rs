extern crate websocket;

use nalgebra::Vector3;
use std::collections::HashMap;
use std::sync::Arc;
use std::thread;
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
use std::process::Command;
use std::sync::RwLock;

fn main() {
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

    //RAPIER BOILERPLATE
    let mut world = World::new(path);

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

    // let mut server = Server::bind(ip).unwrap();
    let mut server = Server::bind(ip).unwrap();
    server.set_nonblocking(true);

    // let mut players: Arc<RwLock<Vec<Player>>> = Arc::new(RwLock::new(Vec::new()));
    let mut players: Vec<Player> = Vec::new();

    println!("HIIII");
    loop {
        let start_time = Instant::now();

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

        let d_a  = Instant::now()-start_time;
        let b_start = Instant::now();
        // let mut players_unlocked = players.write().unwrap();

        for player in players.iter_mut() {
            //parse socket messages
            player.read_messages();
        }

        for i in 0..players.len() {
            players[i].update_physics(
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
            // Handle the collision event.
            // println!("Received collision event: {:?}", collision_event);
            // collision_event.collider1()

            if collision_event.started() {
                let collider_handle1 = collision_event.collider1();
                let collider_handle2 = collision_event.collider2();

                if let Some(contact_pair) =
                    narrow_phase.contact_pair(collider_handle1, collider_handle2)
                {
                    if contact_pair.has_any_active_contact {
                        for manifold in &contact_pair.manifolds {
                            if manifold.data.normal.dot(&Vector3::new(0.0, 1.0, 0.0)) > 0.9 {
                                for i in 0..players.len() {
                                    if players[i].collider_handle == collider_handle2 {
                                        players[i].can_jump = true;
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

        // while let Ok(contact_force_event) = contact_force_recv.try_recv() {
        //     // Handle the contact force event.
        //     println!("Received contact force event: {:?}", contact_force_event);
        // }

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
        for i in 0..players.len() {
            players[i].client.send(player_update_message.clone());
        }

        let d_g  = Instant::now()-g_start;
        let h_start = Instant::now();

        let duration = Instant::now() - start_time;
        
        if duration.as_millis() < 16 {
            let wait_time = 16 - duration.as_millis();
            // println!("Update time {:?} {:?}",duration,wait_time);
            let wait_string = (wait_time as f64 / 1000.00).to_string();
            println!(
                "Update time {:?} {:?} {:?}",
                duration, wait_time, wait_string
            );
            println!("T: {:?} A: {:?} B: {:?} C: {:?} D: {:?} E: {:?} F: {:?} G: {:?}",duration,d_a,d_b,d_c,d_d,d_e,d_f,d_g);
            let mut child = Command::new("sleep").arg(wait_string).spawn().unwrap();
            let _result = child.wait().unwrap();
        }else{
            println!("T: {:?} A: {:?} B: {:?} C: {:?} D: {:?} E: {:?} F: {:?} G: {:?}",duration,d_a,d_b,d_c,d_d,d_e,d_f,d_g);
        }
    }
}
