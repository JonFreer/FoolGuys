use std::collections::HashMap;

// use futures_channel::mpsc::UnboundedReceiver;
use nalgebra::{Quaternion, Vector2, Vector3};
use rapier3d::control::KinematicCharacterController;
// use tokio_tungstenite::tungstenite::Message;
// use serde::{Deserialize, Serialize};
// use serde_json::{Result, Number};

use crate::structs::{MessageType, PlayerUpdate, Quat, Vec3, Client};
use rand::Rng;
use serde_json::{ Value};
// use websocket::OwnedMessage;

use rapier3d::prelude::*;

pub struct Player {
    pub name: String,
    // pub client: Client,
    pub can_jump: bool,
    pub chat_queue: Vec<String>,
    pub position: Vector3<f32>,
    pub rotation: Quaternion<f32>,
    pub view_vector: Vector3<f32>,
    pub client_move_vec: Vector2<f32>,
    pub speed: f32,
    pub rigid_body_handle: RigidBodyHandle,
    pub collider_handle: ColliderHandle,
    // pub id: String,
    pub key_map: HashMap<String, bool>,
    pub to_jump: bool,
}

impl Player {
    pub fn new(
        // mut client: Client,
        num_players: usize,
        rigid_body_set: &mut RigidBodySet,
        collider_set: &mut ColliderSet,
    ) -> Self {
        let name = "Guest".to_string() + &num_players.to_string();
        // let id = client.id.clone();
        // let data = json!(&Join { name: name.clone(),id:id.clone() });
        // client.send("join",data);
        // client.send(MessageType::Join {
        //     name: name.to_string(),
        //     id: id.clone(),
        // });
        // client.send(serde_json::to_string(Join{name:name.clone()}).unwrap());

        /* Create the bounding ball. */
        let rigid_body = RigidBodyBuilder::dynamic()
            .translation(vector![0.0, 10.0, 0.0])
            .build();
        let collider = ColliderBuilder::cuboid(0.5, 0.5, 0.5)
            .active_events(ActiveEvents::COLLISION_EVENTS)
            .restitution(0.7)
            .build();

        let rigid_body_handle = rigid_body_set.insert(rigid_body);
        let collider_handle =
            collider_set.insert_with_parent(collider, rigid_body_handle, rigid_body_set);

        Self {
            name,
            // client,
            can_jump: true,
            chat_queue: Vec::new(),
            position: Vector3::new(0.0, 0.0, 0.0),
            rotation: Quaternion::new(0.0, 0.0, 0.0, 0.0),
            view_vector: Vector3::new(0.0, 0.0, 0.0),
            client_move_vec: Vector2::new(0.0, 0.0),
            speed: 0.1,
            rigid_body_handle,
            collider_handle,
            // id,
            key_map: HashMap::new(),
            to_jump: false,
        }
    }

    // pub fn reset_player(&mut self) {
    //     // this.
    // }

    // private appplyVectorMatrixXZ(a: THREE.Vector3, b: THREE.Vector3): THREE.Vector3 {
    //     return new THREE.Vector3(
    //         (a.x * b.z + a.z * b.x),
    //         b.y,
    //         (a.z * b.z + -a.x * b.x)
    //     );
    // }

    fn appply_vector_matrix_x(a: Vector3<f32>, b: Vector3<f32>) -> Vector3<f32> {
        // let x =
        Vector3::new(a.x * b.z + a.z * b.x, b.y, a.z * b.z + -a.x * b.x)
    }

    pub fn update_physics(
        &mut self,
        rigid_body_set: &mut RigidBodySet,
        collider_set: &mut ColliderSet,
        integration_parameters: IntegrationParameters,
    ) {
        let rigid_body = &mut rigid_body_set[self.rigid_body_handle];

        if !(self.client_move_vec.x == 0.0 && self.client_move_vec.y == 0.0) {
            let mut rel_direction =
                Vector3::new(self.client_move_vec.x, 0.0, self.client_move_vec.y); //.normalize();
                                                                                   // if(self.)
            rel_direction = rel_direction.normalize();
            let rel_camera_movement =
                Player::appply_vector_matrix_x(self.view_vector, rel_direction) * self.speed;

            // let pos = rigid_body.translation() + rel_camera_movement;
            // println!("{}",rel_direction.x);
            // rigid_body.set_translation(pos, true);
            let pos = rel_camera_movement; //

            let character_controller = KinematicCharacterController::default();
            let collider_shape = collider_set[self.collider_handle].shape();
            let query_pipeline = QueryPipeline::new();
            let current_position = rigid_body.position().clone();
            let corrected_movement = character_controller.move_shape(
                integration_parameters.dt, // The timestep length (can be set to SimulationSettings::dt).
                &rigid_body_set,           // The RigidBodySet.
                &collider_set,             // The ColliderSet.
                &query_pipeline,           // The QueryPipeline.
                collider_shape,            // The character’s shape.
                &current_position,         // The character’s initial position.
                pos,
                QueryFilter::default()
                    // Make sure the the character we are trying to move isn’t considered an obstacle.
                    .exclude_rigid_body(self.rigid_body_handle),
                |_| {}, // We don’t care about events in this example.
            );
            let rigid_body = &mut rigid_body_set[self.rigid_body_handle];
            // rigid_body.set_linvel(corrected_movement.translation/integration_parameters.dt, true);
            
            // if(corrected_movement.grounded){
            //     self.can_jump = true;
            // }
            

            rigid_body.set_translation(
                rigid_body.translation() + corrected_movement.translation,
                true,
            );

            // rigid_body.set_linvel(rigid_body.linvel()+corrected_movement.translation, true);

            // if(rigid_body.linvel().x>1)

            // println!("Corrected movement {:?}",corrected_movement.translation);
        }
        let rigid_body = &mut rigid_body_set[self.rigid_body_handle];
        // println!("{}",self.key_map);
        if self.key_map.contains_key(" "){
            if self.key_map[" "] && self.can_jump {
                self.can_jump = false;
                rigid_body.set_linvel(rigid_body.linvel() + Vector3::new(0.0, 10.0, 0.0), true);
            }
        }

        if self.to_jump && self.can_jump{
            rigid_body.set_linvel(rigid_body.linvel() + Vector3::new(0.0, 10.0, 0.0), true);
            self.can_jump = false;
        }

        self.to_jump = false;

        if rigid_body.translation().y < (-5.0) {
            let mut rng = rand::thread_rng();
            rigid_body.set_linvel(Vector3::new(0.0, 0.0, 0.0), true);
            rigid_body.set_translation(
                Vector3::new(rng.gen_range(-5.0..5.0), 6.0, rng.gen_range(-5.0..5.0)),
                true,
            );
            rigid_body.set_angvel(Vector3::new(0.0, 0.0, 0.0), true);
        }
    }

    pub fn get_info(&mut self, rigid_body_set: &mut RigidBodySet) -> PlayerUpdate {
        let rigid_body = &rigid_body_set[self.rigid_body_handle];
        let pos = rigid_body.translation();
        let pos_vec = Vec3 {
            x: pos.x,
            y: pos.y,
            z: pos.z,
        };
        let rot = rigid_body.rotation();
        // rot.
        let rot_quat = Quat {
            i: rot.i,
            j: rot.j,
            k: rot.k,
            w: rot.w,
        };

        PlayerUpdate {
            name: self.name.to_string(),
            p: pos_vec,
            q: rot_quat,
        }
    }

    pub fn read_messages(&mut self,c:&mut Client) {
        // let mut client = self.client;

        // loop {
        //     if let Ok(message) = self.client.receiver_thread.try_recv() {

        loop {
        
            if let Ok(message) = c.rx.try_next() {
                let m = message.unwrap();
                // println!("{}", m.to_string());

                let v: Value = serde_json::from_str(&m.to_string()).unwrap();

                // println!("{} {}", msg, v[0]);
        
                if v[0] == "name" {
                    self.name = v[1].to_string();
                }
        
                if v[0] == "chat" {
                    self.chat_queue.push(v[1].to_string());
                }

                if v[0] == "update_view" {
                    let vec = v[1]["viewVector"].clone();
                    self.view_vector = Vector3::new(
                        vec["x"].as_f64().unwrap() as f32,
                        vec["y"].as_f64().unwrap() as f32,
                        vec["z"].as_f64().unwrap() as f32,
                    );
                }
        
                if v[0] == "update" {
                    let vec = v[1]["viewVector"].clone();
                    self.view_vector = Vector3::new(
                        vec["x"].as_f64().unwrap() as f32,
                        vec["y"].as_f64().unwrap() as f32,
                        vec["z"].as_f64().unwrap() as f32,
                    );
        
                    let move_vec = v[1]["moveVector"].clone();
                    self.client_move_vec = Vector2::new(
                        move_vec["x"].as_f64().unwrap() as f32,
                        move_vec["y"].as_f64().unwrap() as f32,
                    );
        
                    self.client_move_vec.x = self.client_move_vec.x.max(-1.0).min(1.0);
                    self.client_move_vec.y = self.client_move_vec.y.max(-1.0).min(1.0);
        
                    let key_map = v[1]["keyMap"].clone();
                    self.key_map = HashMap::new();
        
                    for (key, value) in key_map.as_object().unwrap() {
                        // println!("{}",key);
                        self.key_map
                            .insert(key.to_string(), value.as_bool().unwrap());
                    }
                }
        
                if v[0] == "update_move" {
                    let move_vec = v[1]["moveVector"].clone();
                    self.client_move_vec = Vector2::new(
                        move_vec["x"].as_f64().unwrap() as f32,
                        move_vec["y"].as_f64().unwrap() as f32,
                    );
        
                    self.client_move_vec.x = self.client_move_vec.x.max(-1.0).min(1.0);
                    self.client_move_vec.y = self.client_move_vec.y.max(-1.0).min(1.0);
                }
        
                if v[0] == "update_jump" {
                    self.to_jump = true;
                }

                // p.tx.unbounded_send(m);
            } else {
                break;
            }
        }


                // match message {
                //     OwnedMessage::Close(_) => {
                //         let message = OwnedMessage::Close(None);
                //         self.client.sender_thread.send(message).unwrap();
                //         println!("Client disconnected");
                //         break; //TODO::THIS WAS RETURN
                //     }
                //     OwnedMessage::Ping(ping) => {
                //         let message = OwnedMessage::Pong(ping);
                //         self.client.sender_thread.send(message).unwrap();
                //         // sender.send_message(&message).unwrap();
                //     }
                //     OwnedMessage::Text(msg) => {
                //         self.handle_message(msg);
                //     }
                //     _ => self.client.sender_thread.send(message).unwrap(),
                // }
            // } else {
            //     break;
            // }
        // }
    }

    // fn handle_message(&mut self, msg: String) {
    //     let v: Value = serde_json::from_str(&msg).unwrap();

    //     // println!("{} {}", msg, v[0]);

    //     if v[0] == "name" {
    //         self.name = v[1].to_string();
    //     }

    //     if v[0] == "chat" {
    //         self.chat_queue.push(v[1].to_string());
    //     }

    //     if v[0] == "update_view" {
    //         let vec = v[1]["viewVector"].clone();
    //         self.view_vector = Vector3::new(
    //             vec["x"].as_f64().unwrap() as f32,
    //             vec["y"].as_f64().unwrap() as f32,
    //             vec["z"].as_f64().unwrap() as f32,
    //         );
    //     }

    //     if v[0] == "update" {
    //         let vec = v[1]["viewVector"].clone();
    //         self.view_vector = Vector3::new(
    //             vec["x"].as_f64().unwrap() as f32,
    //             vec["y"].as_f64().unwrap() as f32,
    //             vec["z"].as_f64().unwrap() as f32,
    //         );

    //         let move_vec = v[1]["moveVector"].clone();
    //         self.client_move_vec = Vector2::new(
    //             move_vec["x"].as_f64().unwrap() as f32,
    //             move_vec["y"].as_f64().unwrap() as f32,
    //         );

    //         self.client_move_vec.x = self.client_move_vec.x.max(-1.0).min(1.0);
    //         self.client_move_vec.y = self.client_move_vec.y.max(-1.0).min(1.0);

    //         let key_map = v[1]["keyMap"].clone();
    //         self.key_map = HashMap::new();

    //         for (key, value) in key_map.as_object().unwrap() {
    //             // println!("{}",key);
    //             self.key_map
    //                 .insert(key.to_string(), value.as_bool().unwrap());
    //         }
    //     }

    //     if v[0] == "update_move" {
    //         let move_vec = v[1]["moveVector"].clone();
    //         self.client_move_vec = Vector2::new(
    //             move_vec["x"].as_f64().unwrap() as f32,
    //             move_vec["y"].as_f64().unwrap() as f32,
    //         );

    //         self.client_move_vec.x = self.client_move_vec.x.max(-1.0).min(1.0);
    //         self.client_move_vec.y = self.client_move_vec.y.max(-1.0).min(1.0);
    //     }

    //     if v[0] == "update_jump" {
    //         self.to_jump = true;
    //     }
    // }
}
