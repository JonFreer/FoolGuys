use std::{collections::HashMap};
use nalgebra::{ Vector1, Vector2, Vector3};
use crate::{structs::{Client, Colour, PlayerUpdate, Quat, Vec3}, character_states::{character_base::CharacterState, idle::IdleState, walk::WalkState, jumpidle::JumpIdleState, falling::FallingState}, world::World, physics::Physics};
use rand::Rng;
use serde_json::{Value, Error};


use rapier3d::prelude::*;

pub struct Player {
    pub name: String,
    pub can_jump: bool,
    pub chat_queue: Vec<String>,
    pub position: Vector3<f32>,
    // pub rotation: Quaternion<f32>,
    pub view_vector: Vector3<f32>,
    pub client_move_vec: Vector2<f32>,
    pub speed: f32,
    pub rigid_body_handle: RigidBodyHandle,
    pub collider_handle: ColliderHandle,
    pub key_map: HashMap<String, bool>,
    pub to_jump: bool,
    pub to_throw: bool,
    pub colour: Colour,
    pub on_ground: bool,
    // pub on_ground_2: bool,
    pub acrade_veloicty_influencer: Vector3<f32>, // pub lin_vel: Vector3<f32>,
    pub character_state : CharacterState,
    pub just_jumped : bool,
    pub look_at: Vector3<f32>,
    pub target_look_at: Vector<f32>
}

impl Player {
    pub fn new(
        num_players: usize,
        rigid_body_set: &mut RigidBodySet,
        collider_set: &mut ColliderSet,
        spawn_points: &Vec<Vector3<f32>>
    ) -> Self {
        let name = "Guest".to_string() + &num_players.to_string();

        /* Create the bounding ball. */
        let mut rigid_body = RigidBodyBuilder::dynamic()
            // .translation(vector![0.0, 30.0, 0.0])
            .ccd_enabled(true)
            .lock_rotations()
            .build();

        Player::respawn(spawn_points, &mut rigid_body);
        // let collider = ColliderBuilder::cuboid(0.5, 0.5, 0.5)
        //     .active_events(ActiveEvents::COLLISION_EVENTS)
        //     .restitution(0.7)
        //     .build();

        // let rigid_body_handle = rigid_body_set.insert(rigid_body);
        // let collider_handle =
        //     collider_set.insert_with_parent(collider, rigid_body_handle, rigid_body_set);

        // let rigid_body =
        // RigidBodyBuilder::kinematic_position_based().translation(vector![-3.0, 5.0, 0.0]);

        // rigid_body.set_locked_axes(LockedAxes::ROTATION_LOCKED, true);

        let rigid_body_handle = rigid_body_set.insert(rigid_body);

        let collider = ColliderBuilder::cuboid(0.5, 0.5, 0.5)
            //  ColliderBuilder::capsule_y(0.3, 0.15)
            .active_events(ActiveEvents::COLLISION_EVENTS)
            // .friction(1.0)
            // .restitution(0.7)
            // .mass(10.0)
            .build();

        let collider_handle =
            collider_set.insert_with_parent(collider, rigid_body_handle, rigid_body_set);

        let mut rng = rand::thread_rng();

        let colour = Colour {
            r: rng.gen::<u8>(),
            g: rng.gen::<u8>(),
            b: rng.gen::<u8>(),
        };

        Self {
            name,
            can_jump: true,
            chat_queue: Vec::new(),
            position: Vector3::new(0.0, 0.0, 0.0),
            // rotation: Quaternion::new(0.0, 0.0, 0.0, 0.0),
            view_vector: Vector3::new(0.0, 0.0, 0.0),
            client_move_vec: Vector2::new(0.0, 0.0),
            speed: 0.1,
            rigid_body_handle,
            collider_handle,
            key_map: HashMap::new(),
            to_jump: false,
            to_throw:false,
            colour: colour,
            on_ground:false,
            // on_ground_2: false,
            acrade_veloicty_influencer: Vector3::new(0.2, 0.0, 0.2), // lin_vel: Vector3::new(0.0, 0.0, 0.0),
            character_state: CharacterState::Idle(IdleState { }),
            just_jumped:false,
            look_at: Vector3::new(1.0,0.0,0.0),
            target_look_at: Vector3::new(1.0,0.0,0.0)
        }
    }

    fn appply_vector_matrix_x(a: Vector3<f32>, b: Vector3<f32>) -> Vector3<f32> {
        Vector3::new(a.x * b.z + a.z * b.x, b.y, a.z * b.z + -a.x * b.x)
    }

    pub fn respawn(spawn_points: &Vec<Vector3<f32>> , rigid_body :&mut RigidBody){
        rigid_body.set_translation(spawn_points[0], true);
        rigid_body.set_linvel(Vector3::new(0.0, 0.0, 0.0), true);
        rigid_body.set_angvel(Vector3::new(0.0, 0.0, 0.0), true);
    }


    pub fn update_physics(
        &mut self,

        // integration_parameters: IntegrationParameters,
        // query_pipeline: &QueryPipeline,
        world: &mut World,
        physics_engine: &mut Physics
    ) {
        self.just_jumped = false;


        //Example.rs
        // let rigid_body = &mut physics_engine.rigid_body_set[self.rigid_body_handle];// get_rigid_body(self.rigid_body_handle);
        // let dt = physics_engine.get_time_step();

        //Physics.rs
        // pub fn get_rigid_body(&mut self, rigid_body_handle: RigidBodyHandle) -> &mut RigidBody {
        //     &mut self.rigid_body_set[rigid_body_handle]
        // }
    
        // pub fn get_time_step(& self) -> f32 {
        //     self.integration_parameters.dt
        // }

        let simulated_velocity = physics_engine.get_rigid_body(self.rigid_body_handle).linvel().clone();

        let mut arcade_velocity = Vector3::new(0.0, 0.0, 0.0);

        if !(self.client_move_vec.x == 0.0 && self.client_move_vec.y == 0.0) {
            let mut rel_direction =
                Vector3::new(self.client_move_vec.x, 0.0, self.client_move_vec.y);

            rel_direction = rel_direction.normalize();
            let rel_camera_movement =
                Player::appply_vector_matrix_x(self.view_vector, rel_direction) * self.speed;

            self.target_look_at = rel_camera_movement.normalize().clone();

            arcade_velocity = rel_camera_movement / physics_engine.get_time_step();
        }

        let mut new_velocity;// = Vector3::new(0.0, 0.0, 0.0);
        let add = true;
        if add {
            // newVelocity.copy(simulatedVelocity);
            new_velocity = simulated_velocity.clone();

            let add = arcade_velocity.component_mul(&self.acrade_veloicty_influencer);

            if simulated_velocity.x.abs() < arcade_velocity.x.abs() || simulated_velocity.x * arcade_velocity.x < 0.0
            {
                new_velocity.x += add.x;
            }

            if simulated_velocity.y.abs() < arcade_velocity.y.abs() || simulated_velocity.y * arcade_velocity.y < 0.0
            {
                new_velocity.y += add.y;
            }

            if simulated_velocity.z.abs() < arcade_velocity.z.abs() || simulated_velocity.z * arcade_velocity.z < 0.0
            {
                new_velocity.z += add.z;
            }
        } else {
            new_velocity = Vector3::new(
                Vector1::new(simulated_velocity.x)
                    .lerp(
                        &Vector1::new(arcade_velocity.x),
                        self.acrade_veloicty_influencer.x,
                    )
                    .x,
                Vector1::new(simulated_velocity.y)
                    .lerp(
                        &Vector1::new(arcade_velocity.y),
                        self.acrade_veloicty_influencer.y,
                    )
                    .x,
                Vector1::new(simulated_velocity.z)
                    .lerp(
                        &Vector1::new(arcade_velocity.z),
                        self.acrade_veloicty_influencer.z,
                    )
                    .x,
            );
        }

        // println!(
        //     "{:?} {:?} {:?}",
        //     simulated_velocity, new_velocity, arcade_velocity
        // );


        if self.on_ground {
            physics_engine.get_rigid_body(self.rigid_body_handle).set_linvel(new_velocity, true);
            self.acrade_veloicty_influencer = Vector3::new(0.05, 0.0, 0.05);
        } else {
            physics_engine.get_rigid_body(self.rigid_body_handle).set_linvel(new_velocity, true);
            self.acrade_veloicty_influencer = Vector3::new(0.01, 0.0, 0.01);
        }

        

        // let collider = &world.collider_set[self.collider_handle];
 

      
        // character_controller.snap_to_ground = Some(CharacterLength::Absolute(0.5));
        let mut collisions = vec![];
        let corrected_movement = physics_engine.update_characet_controller(self.collider_handle, self.rigid_body_handle, &mut collisions); 


        if corrected_movement.grounded {
            self.can_jump = true;
            self.on_ground = true;
        } else {
            self.on_ground = false;
        }

        let rigid_body =physics_engine.get_rigid_body(self.rigid_body_handle);
        

        if self.to_jump && self.can_jump {
            rigid_body.set_linvel(rigid_body.linvel() + Vector3::new(0.0, 7.0, 0.0), true);
            self.can_jump = false;
            self.just_jumped = true;
            
        }

        self.to_jump = false;

        if rigid_body.translation().y < (-10.0) {
            // let mut rng = rand::thread_rng();
            // rigid_body.set_linvel(Vector3::new(0.0, 0.0, 0.0), true);
            // rigid_body.set_translation(
            //     Vector3::new(rng.gen_range(-5.0..5.0), 6.0, rng.gen_range(-5.0..5.0)),
            //     true,
            // );
            // rigid_body.set_angvel(Vector3::new(0.0, 0.0, 0.0), true);
            Player::respawn(&world.spawn_points,rigid_body);
        }

        self.look_at = self.look_at.lerp(&self.target_look_at, 0.05);


        //update char state

        match self.character_state.clone(){
            CharacterState::JumpIdle(_) => JumpIdleState::update(self, physics_engine.get_time_step()),
            CharacterState::Falling => FallingState::update(self,physics_engine.get_time_step()),
            _ => {}
        }

        if self.to_throw{

            println!("THROWING {:?}",self.view_vector);

            let rigid_body = physics_engine.get_rigid_body(self.rigid_body_handle);

            world.add_dynamic_asset("asset_id".to_string(),
             "Asset_Apple".to_string(),
              Vector3::new(1.0,1.0,1.0)*0.2, 
              rigid_body.translation()+Vector3::new(1.0,2.0,1.0), 
              *rigid_body.rotation(),
                true,
                self.view_vector * 10.0 + Vector::new(0.0,10.0,0.0),
                20.0,
                physics_engine
                // Vector3::new(10.0,5.0,0.0)
            );

            self.to_throw = false;
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

        let look_at = Vec3{
            x:self.look_at.x,
            y:self.look_at.y,
            z:self.look_at.z
        };

        PlayerUpdate {
            name: self.name.to_string(),
            p: pos_vec,
            q: rot_quat,
            colour: self.colour.clone(),
            state:self.character_state.clone(),
            dir:look_at
        }

    }


    pub fn read_messages(&mut self, c: &mut Client) {
        loop {
            if let Ok(message) = c.rx.try_next() {
                let m = message.unwrap();
                // println!("{}", m.to_string());
                
                let msg_content:Result<Value,Error> = serde_json::from_str(&m.to_string()); //.unwrap();
                if let Ok(v) = msg_content{
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
                        self.key_map
                            .insert(key.to_string(), value.as_bool().unwrap());
                    }

                    if self.key_map.contains_key(" ") {
                        if self.key_map[" "]{
                            self.to_jump = true;
                        }
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

                if v[0] == "throw" {
                    self.to_throw = true;
                }
            }else{
                println!("Erorr unwrapping message");
            }

                // p.tx.unbounded_send(m);
            } else {
                break;
            }
        }

        self.on_input_change();

    }

    pub fn launch(&mut self, physics_engine: &mut Physics, launch_dir: Vector3<f32>) {
        let body = physics_engine.get_rigid_body(self.rigid_body_handle);
        let velocity = launch_dir;
        body.set_linvel(velocity, true);
    }

    pub fn on_input_change(&mut self){

        match self.character_state.clone(){
            CharacterState::Idle(_) => IdleState::on_input_change(self),
            CharacterState::Walk => WalkState::on_input_change(self),
            _ => {}
        }
    }

}
