use std::{collections::HashMap, ops::Mul, rc::Rc, cell::RefCell};

// use futures_channel::mpsc::UnboundedReceiver;
use nalgebra::{Quaternion, Vector1, Vector2, Vector3};
use rapier3d::control::{CharacterLength, KinematicCharacterController};
// use tokio_tungstenite::tungstenite::Message;
// use serde::{Deserialize, Serialize};
// use serde_json::{Result, Number};

use crate::{structs::{Client, Colour, PlayerUpdate, Quat, Vec3}, character_states::{character_base::CharacterState, idle::IdleState, walk::WalkState, jumpidle::JumpIdleState, falling::FallingState}};
use rand::Rng;
use serde_json::Value;
// use websocket::OwnedMessage;

use rapier3d::prelude::*;

pub struct Player {
    pub name: String,
    pub can_jump: bool,
    pub chat_queue: Vec<String>,
    pub position: Vector3<f32>,
    pub rotation: Quaternion<f32>,
    pub view_vector: Vector3<f32>,
    pub client_move_vec: Vector2<f32>,
    pub speed: f32,
    pub rigid_body_handle: RigidBodyHandle,
    pub collider_handle: ColliderHandle,
    pub key_map: HashMap<String, bool>,
    pub to_jump: bool,
    pub colour: Colour,
    pub on_ground: Vec<ColliderHandle>,
    pub on_ground_2: bool,
    pub arcadeVelocityInfluence: Vector3<f32>, // pub lin_vel: Vector3<f32>,
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
    ) -> Self {
        let name = "Guest".to_string() + &num_players.to_string();

        /* Create the bounding ball. */
        let rigid_body = RigidBodyBuilder::dynamic()
            .translation(vector![0.0, 10.0, 0.0])
            .ccd_enabled(true)
            .lock_rotations()
            .build();
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
            rotation: Quaternion::new(0.0, 0.0, 0.0, 0.0),
            view_vector: Vector3::new(0.0, 0.0, 0.0),
            client_move_vec: Vector2::new(0.0, 0.0),
            speed: 0.1,
            rigid_body_handle,
            collider_handle,
            key_map: HashMap::new(),
            to_jump: false,
            colour: colour,
            on_ground: Vec::new(),
            on_ground_2: false,
            arcadeVelocityInfluence: Vector3::new(0.2, 0.0, 0.2), // lin_vel: Vector3::new(0.0, 0.0, 0.0),
            character_state: CharacterState::Idle(IdleState { }),
            just_jumped:false,
            look_at: Vector3::new(1.0,0.0,0.0),
            target_look_at: Vector3::new(1.0,0.0,0.0)
        }
    }

    fn appply_vector_matrix_x(a: Vector3<f32>, b: Vector3<f32>) -> Vector3<f32> {
        Vector3::new(a.x * b.z + a.z * b.x, b.y, a.z * b.z + -a.x * b.x)
    }

    pub fn update_physics(
        &mut self,
        rigid_body_set: &mut RigidBodySet,
        collider_set: &mut ColliderSet,
        integration_parameters: IntegrationParameters,
        query_pipeline: &QueryPipeline,
    ) {
        self.just_jumped = false;



        let rigid_body = &mut rigid_body_set[self.rigid_body_handle];

        let simulated_velocity = rigid_body.linvel().clone();

        let mut arcade_velocity = Vector3::new(0.0, 0.0, 0.0);

        if !(self.client_move_vec.x == 0.0 && self.client_move_vec.y == 0.0) {
            let mut rel_direction =
                Vector3::new(self.client_move_vec.x, 0.0, self.client_move_vec.y);

            rel_direction = rel_direction.normalize();
            let mut rel_camera_movement =
                Player::appply_vector_matrix_x(self.view_vector, rel_direction) * self.speed;

            self.target_look_at = rel_camera_movement.normalize().clone();

            arcade_velocity = rel_camera_movement / integration_parameters.dt;
        }

        let mut new_velocity = Vector3::new(0.0, 0.0, 0.0);
        let add = true;
        if add {
            // newVelocity.copy(simulatedVelocity);
            new_velocity = simulated_velocity.clone();

            let add = arcade_velocity.component_mul(&self.arcadeVelocityInfluence);

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
                        self.arcadeVelocityInfluence.x,
                    )
                    .x,
                Vector1::new(simulated_velocity.y)
                    .lerp(
                        &Vector1::new(arcade_velocity.y),
                        self.arcadeVelocityInfluence.y,
                    )
                    .x,
                Vector1::new(simulated_velocity.z)
                    .lerp(
                        &Vector1::new(arcade_velocity.z),
                        self.arcadeVelocityInfluence.z,
                    )
                    .x,
            );
        }

        println!(
            "{:?} {:?} {:?}",
            simulated_velocity, new_velocity, arcade_velocity
        );

        // new_velocity = Vector3::new(
        //     simulatedVelocity.x, arcadeVelocity.x, character.arcadeVelocityInfluence.x),
        //     THREE.MathUtils.lerp(simulatedVelocity.y, arcadeVelocity.y, character.arcadeVelocityInfluence.y),
        //     THREE.MathUtils.lerp(simulatedVelocity.z, arcadeVelocity.z, character.arcadeVelocityInfluence.z),
        // );

        // println!("{:?}",integration_parameters);

        // let rigid_body = &mut rigid_body_set[self.rigid_body_handle];

        // let predicted_movement = rigid_body.linvel().clone()*integration_parameters.dt;

        // let mut pos = predicted_movement;//.component_mul(&Vector::new(0.95,1.0,0.95)) ;

        // if !(self.client_move_vec.x == 0.0 && self.client_move_vec.y == 0.0) {
        //     let mut rel_direction =
        //         Vector3::new(self.client_move_vec.x, 0.0, self.client_move_vec.y); //.normalize();
        //                                                                            // if(self.)
        //     rel_direction = rel_direction.normalize();
        //     let mut rel_camera_movement =
        //         Player::appply_vector_matrix_x(self.view_vector, rel_direction) * self.speed;

        //     pos = rel_camera_movement;//*integration_parameters.dt; //
        // }

        if self.on_ground_2 {
            rigid_body.set_linvel(new_velocity, true);
            self.arcadeVelocityInfluence = Vector3::new(0.05, 0.0, 0.05);
        } else {
            rigid_body.set_linvel(new_velocity, true);
            self.arcadeVelocityInfluence = Vector3::new(0.01, 0.0, 0.01);
        }

        let mut character_controller = KinematicCharacterController::default();
        // character_controller.offset = CharacterLength::Relative(0.01);

        // let collider_shape = collider_set[self.collider_handle].shape();
        let collider = &collider_set[self.collider_handle];
        // rigid_body.

        // collider_shape.clone()

        // let query_pipeline = QueryPipeline::new();
        // let current_position = rigid_body.position().clone();

        // character_controller.
        let pos = Vector3::new(0.0, 0.0, 0.0);
        character_controller.snap_to_ground = Some(CharacterLength::Absolute(0.5));
        let mut collisions = vec![];
        let corrected_movement = character_controller.move_shape(
            integration_parameters.dt, // The timestep length (can be set to SimulationSettings::dt).
            &rigid_body_set,           // The RigidBodySet.
            &collider_set,             // The ColliderSet.
            query_pipeline,            // The QueryPipeline.
            collider.shape(),          // The character’s shape.
            &collider.position(),      // The character’s initial position.
            pos.cast::<Real>(),
            QueryFilter::default()
                // Make sure the the character we are trying to move isn’t considered an obstacle.
                .exclude_rigid_body(self.rigid_body_handle),
            |c| collisions.push(c), // We don’t care about events in this example.
        );

        // let rigid_body = &mut rigid_body_set[self.rigid_body_handle];

        if corrected_movement.grounded {
            println!("on gorund");
            self.can_jump = true;
            self.on_ground_2 = true;
        } else {
            println!("not on ground");
            self.on_ground_2 = false;
        }

        // let mut calc_vel = corrected_movement.translation / integration_parameters.dt ;

        // let mut vel = rigid_body.linvel().clone();
        // println!("{:?}",vel);
        // if !self.on_ground_2 {
        //     vel.y += -9.81*integration_parameters.dt;

        // }
        // rigid_body.set_linvel(pos/integration_parameters.dt, true);
        // if self.on_ground {

        // let calc_vel = corrected_movement.translation/integration_parameters.dt;
        // if calc_vel.x > 0.0 && calc_vel.x > vel.x {
        //     vel.x = calc_vel.x;
        // } else if calc_vel.x < 0.0 && calc_vel.x < vel.x {
        //     vel.x = calc_vel.x;
        // }

        // if calc_vel.z > 0.0 && calc_vel.z > vel.z {
        //     vel.z = calc_vel.z;
        // } else if calc_vel.z < 0.0 && calc_vel.z < vel.z {
        //     vel.z = calc_vel.z;
        // }

        // if vel.x > 0.01 && pos.x < 0.0{
        //     vel.x = vel.x *0.99;
        // }

        // if vel.x < -0.01 && pos.x > 0.0{
        //     vel.x = vel.x * 0.99;
        // }

        // if vel.z > 0.01 && pos.z < 0.0{
        //     vel.z = vel.z *0.99;
        // }

        // if vel.z < -0.01 && pos.z > 0.0{
        //     vel.z = vel.z * 0.99;
        // }

        // rigid_body.set_linvel(vel, true);

        // if calc_vel.y > vel.y {
        //     vel.y += calc_vel.y;
        // }

        // vel.y += calc_vel.y;
        // }

        // rigid_body.set_translation(rigid_body.translation()+pos,true);

        // character_controller.solve_character_collision_impulses(
        //     dt,
        //     &mut bodies,
        //     &colliders,
        //     &queries,
        //     character_shape,
        //     character_mass,
        //     &collisions,
        //     filter,
        // );

        let rigid_body = &mut rigid_body_set[self.rigid_body_handle];
        // println!("{}",self.key_map);
        // if self.key_map.contains_key(" ") {
        //     if self.key_map[" "]{
        //         self.to_jump = true;
        //     }
        // }

        if self.to_jump && self.can_jump {
            rigid_body.set_linvel(rigid_body.linvel() + Vector3::new(0.0, 10.0, 0.0), true);
            self.can_jump = false;
            self.just_jumped = true;
            
        }

        self.to_jump = false;

        if rigid_body.translation().y < (-10.0) {
            let mut rng = rand::thread_rng();
            rigid_body.set_linvel(Vector3::new(0.0, 0.0, 0.0), true);
            rigid_body.set_translation(
                Vector3::new(rng.gen_range(-5.0..5.0), 6.0, rng.gen_range(-5.0..5.0)),
                true,
            );
            rigid_body.set_angvel(Vector3::new(0.0, 0.0, 0.0), true);
        }

        self.look_at = self.look_at.lerp(&self.target_look_at, 0.05);


        //update char state

        match self.character_state.clone(){
            CharacterState::JumpIdle(state) => JumpIdleState::update(self, integration_parameters.dt),
            CharacterState::Falling => FallingState::update(self,integration_parameters.dt),
            // CharacterState::Idle(state) => {},
            // CharacterState::Walk => {},
            // CharacterStat
            _ => {}
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

                // p.tx.unbounded_send(m);
            } else {
                break;
            }
        }

        self.on_input_change();

    }

    pub fn launch(&mut self, rigid_body_set: &mut RigidBodySet, launch_dir: Vector3<f32>) {
        let mut body = &mut rigid_body_set[self.rigid_body_handle];
        let mut velocity = launch_dir;
        body.set_linvel(velocity, true);
    }

    pub fn on_input_change(&mut self){

        // let c = RefCell::new(Rc::new(self));
        
        // if let CharacterState::Idle(state) = &self.character_state{
        //     state.on_input_change(self);
        // }
        // self.character_state

        // let char_state =self.
        match self.character_state.clone(){
            CharacterState::Idle(state) => IdleState::on_input_change(self),
            CharacterState::Walk => WalkState::on_input_change(self),
            _ => {}
        }
    }

}
