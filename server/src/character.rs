use std::{collections::HashMap, net::SocketAddr};
// use nalgebra::{ Vector1, Vector2, Vector3};
use crate::{
    character_states::{
        character_base::CharacterState, falling::FallingState, idle::IdleState,
        jumpidle::JumpIdleState, walk::WalkState,
    },
    physics::Physics,
    physics_objects::{
        ragdoll::{Ragdoll, RagdollTemplate, RagdollUpdate},
        rigid_body_parent::Objects,
    },
    player::Player,
    structs::{CharacterControls, Colour, KeyBinding, PlayerUpdate, Quat, Vec3},
    vehicles::blimp::Blimp,
    world::World,
};
use nalgebra::{Isometry3, Quaternion, Unit, Vector1, Vector2, Vector3};
use rand::Rng;
use serde_json::Value;

use rapier3d::prelude::*;

#[derive(Clone)]
pub struct Character {
    pub can_jump: bool,
    pub position: Vector3<f32>,
    pub rotation: Unit<Quaternion<f32>>,
    pub rigid_body_handle: RigidBodyHandle,
    pub collider_handle: ColliderHandle,
    pub to_jump: bool,
    pub to_throw: bool,
    pub colour: Colour,
    pub on_ground: bool,
    pub acrade_veloicty_influencer: Vector3<f32>, // pub lin_vel: Vector3<f32>,
    pub character_state: CharacterState,
    pub just_jumped: bool,
    pub look_at: Vector3<f32>,
    pub target_look_at: Vector<f32>,
    pub is_ragdoll: bool,
    pub client_move_vec: Vector2<f32>,
    ragdoll: Option<Ragdoll>,
    ragdoll_template: RagdollTemplate,
    pub actions: CharacterControls,
}

impl Character {
    pub fn new(
        spawn_points: &Vec<Vector3<f32>>,
        physics_engine: &mut Physics,
        ragdoll_template: RagdollTemplate,
    ) -> Self {
        let mut rigid_body = RigidBodyBuilder::dynamic()
            .ccd_enabled(true)
            .lock_rotations()
            .build();

        Character::respawn(spawn_points, &mut rigid_body);

        let rigid_body_handle = physics_engine.rigid_body_set.insert(rigid_body);

        let collider = ColliderBuilder::capsule_y(0.3, 0.3)
            .active_events(ActiveEvents::COLLISION_EVENTS | ActiveEvents::CONTACT_FORCE_EVENTS)
            // .friction(1.0)
            // .restitution(0.7)
            // .mass(10.0)
            .build();

        let collider_handle = physics_engine.collider_set.insert_with_parent(
            collider,
            rigid_body_handle,
            &mut physics_engine.rigid_body_set,
        );

        let mut rng = rand::thread_rng();

        let colour = Colour {
            r: rng.gen::<u8>(),
            g: rng.gen::<u8>(),
            b: rng.gen::<u8>(),
        };

        Self {
            can_jump: true,
            position: Vector3::new(0.0, 0.0, 0.0),
            rotation: Unit::from_quaternion(Quaternion::new(0.0, 0.0, 0.0, 0.0)),
            rigid_body_handle,
            collider_handle,
            to_jump: false,
            to_throw: false,
            colour: colour,
            on_ground: false,
            acrade_veloicty_influencer: Vector3::new(0.2, 0.0, 0.2), // lin_vel: Vector3::new(0.0, 0.0, 0.0),
            character_state: CharacterState::Idle(IdleState {}),
            just_jumped: false,
            look_at: Vector3::new(1.0, 0.0, 0.0),
            target_look_at: Vector3::new(1.0, 0.0, 0.0),
            is_ragdoll: false,
            ragdoll_template,
            ragdoll: None,
            client_move_vec: Vector2::new(0.0, 0.0),
            actions: CharacterControls::new(),
        }
    }

    fn appply_vector_matrix_x(a: Vector3<f32>, b: Vector3<f32>) -> Vector3<f32> {
        Vector3::new(a.x * b.z + a.z * b.x, b.y, a.z * b.z + -a.x * b.x)
    }

    pub fn respawn(spawn_points: &Vec<Vector3<f32>>, rigid_body: &mut RigidBody) {
        rigid_body.set_translation(spawn_points[0], true);
        rigid_body.set_linvel(Vector3::new(0.0, 0.0, 0.0), true);
        rigid_body.set_angvel(Vector3::new(0.0, 0.0, 0.0), true);
    }

    pub fn update_messages(&mut self, physics_engine: &mut Physics, value: &Value) -> bool {
        if value[0] == "update" {
            let move_vec = value[1]["moveVector"].clone();
            self.client_move_vec = Vector2::new(
                move_vec["x"].as_f64().unwrap() as f32,
                move_vec["y"].as_f64().unwrap() as f32,
            );

            self.client_move_vec.x = self.client_move_vec.x.max(-1.0).min(1.0);
            self.client_move_vec.y = self.client_move_vec.y.max(-1.0).min(1.0);

            let actions: Value = value[1]["actions"].clone();

            self.actions = CharacterControls {
                enter_passenger: KeyBinding::new(&actions["enter_passenger"]),
            };
        }

        if value[0] == "update_move" {
            let move_vec = value[1]["moveVector"].clone();
            self.client_move_vec = Vector2::new(
                move_vec["x"].as_f64().unwrap() as f32,
                move_vec["y"].as_f64().unwrap() as f32,
            );

            self.client_move_vec.x = self.client_move_vec.x.max(-1.0).min(1.0);
            self.client_move_vec.y = self.client_move_vec.y.max(-1.0).min(1.0);
        }

        if value[0] == "update_jump" {
            self.to_jump = true;
        }

        if value[0] == "throw" {
            self.to_throw = true;
        }

        if value[0] == "is_ragdoll" {
            self.toggle_ragdoll(physics_engine);
        }

        self.actions.enter_passenger.justPressed
    }

    pub fn update_physics(
        &mut self,
        world: &mut World,
        physics_engine: &mut Physics,
        players: &HashMap<SocketAddr, Player>,
        view_vector: Vector3<f32>,
        speed: f32,
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

        let simulated_velocity = physics_engine
            .get_rigid_body(self.rigid_body_handle)
            .linvel()
            .clone();

        let mut arcade_velocity = Vector3::new(0.0, 0.0, 0.0);

        if !(self.client_move_vec.x == 0.0 && self.client_move_vec.y == 0.0) {
            let mut rel_direction =
                Vector3::new(self.client_move_vec.x, 0.0, self.client_move_vec.y);

            rel_direction = rel_direction.normalize();
            let rel_camera_movement =
                Character::appply_vector_matrix_x(view_vector, rel_direction) * speed;

            self.target_look_at = rel_camera_movement.normalize().clone();

            let t = self.target_look_at;

            // let r = Isometry3::look_at_rh(&Point::new(0.0,0.0,0.0),&Point::new(t.x,t.y,t.z),&Vector3::new(0.0,0.0,0.0)).rotation;

            // let v2 = Vector3::new(0.0,1.0,0.0);
            // let mut v1   = self.target_look_at;
            // // v2.y = 1.0;
            // let c = v1.cross(&v2);
            // let w = v1.dot(&v2);
            // let r= Quaternion::new(w,c.x,c.y,c.z);

            // self.rotation = r.rotation;

            arcade_velocity = rel_camera_movement / physics_engine.get_time_step();
        }

        let mut new_velocity; // = Vector3::new(0.0, 0.0, 0.0);
        let add = true;
        if add {
            // newVelocity.copy(simulatedVelocity);
            new_velocity = simulated_velocity.clone();

            let add = arcade_velocity.component_mul(&self.acrade_veloicty_influencer);

            if simulated_velocity.x.abs() < arcade_velocity.x.abs()
                || simulated_velocity.x * arcade_velocity.x < 0.0
            {
                new_velocity.x += add.x;
            }

            if simulated_velocity.y.abs() < arcade_velocity.y.abs()
                || simulated_velocity.y * arcade_velocity.y < 0.0
            {
                new_velocity.y += add.y;
            }

            if simulated_velocity.z.abs() < arcade_velocity.z.abs()
                || simulated_velocity.z * arcade_velocity.z < 0.0
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
            physics_engine
                .get_rigid_body(self.rigid_body_handle)
                .set_linvel(new_velocity, true);
            self.acrade_veloicty_influencer = Vector3::new(0.05, 0.0, 0.05);
        } else {
            physics_engine
                .get_rigid_body(self.rigid_body_handle)
                .set_linvel(new_velocity, true);
            self.acrade_veloicty_influencer = Vector3::new(0.01, 0.0, 0.01);
        }

        // let collider = &world.collider_set[self.collider_handle];

        // character_controller.snap_to_ground = Some(CharacterLength::Absolute(0.5));
        let mut collisions = vec![];

        let corrected_movement = physics_engine.update_character_controller(
            self.collider_handle,
            self.rigid_body_handle,
            &mut collisions,
        );

        // println!("{:?}",collisions.len());
        // for collision in collisions{
        //     println!("C {:?}",collision);
        // }

        let contacts = physics_engine.get_contact_force_with(self.collider_handle);

        for contact in contacts {
            if contact.total_force_magnitude > 200.0 {
                self.toggle_ragdoll(physics_engine);
            }
        }

        // println!("{:?}",self.view_vector);

        if corrected_movement.grounded {
            self.can_jump = true;
            self.on_ground = true;
        } else {
            self.on_ground = false;
        }

        let rigid_body = physics_engine.get_rigid_body(self.rigid_body_handle);

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
            Character::respawn(&world.spawn_points, rigid_body);
        }

        self.look_at = self.look_at.lerp(&self.target_look_at, 0.05);

        //update char state

        match self.character_state.clone() {
            CharacterState::JumpIdle(_) => {
                JumpIdleState::update(self, physics_engine.get_time_step())
            }
            CharacterState::Falling => FallingState::update(self, physics_engine.get_time_step()),
            _ => {}
        }

        if self.to_throw {
            println!("THROWING {:?}", view_vector);

            let rigid_body = physics_engine.get_rigid_body(self.rigid_body_handle);

            world.add_dynamic_asset(
                "asset_id".to_string(),
                "Asset_Apple".to_string(),
                Vector3::new(1.0, 1.0, 1.0) * 0.2,
                rigid_body.translation() + Vector3::new(0.0, 0.5, 0.0),
                *rigid_body.rotation(),
                true,
                view_vector * 15.0 + Vector::new(0.0, 5.0, 0.0),
                20.0,
                physics_engine, // Vector3::new(10.0,5.0,0.0)
            );

            self.to_throw = false;
        }

        self.check_attack(players, physics_engine, view_vector);
    }

    pub fn check_enter_vehicle(
        &mut self,
        physics_engine: &mut Physics,
        vehicles: &HashMap<String, Blimp>,
    ) -> Option<String> {
        // when we enter a vehicle we should:
        // 2) Check if there is a vehicle for us to enter.
        // Q: are we doing this based on view direction or
        // 1) Remove the physics body

        let current_translation = physics_engine.get_translation(self.rigid_body_handle);

        let dist = vehicles
            .iter()
            .map(|(key, vehicle)| {
                let target_translation =
                    physics_engine.get_translation(vehicle.vehicle_data.rigid_body_handle);
                let dist = (target_translation.x - current_translation.x).abs()
                    + (target_translation.y - current_translation.y).abs()
                    + (target_translation.z - current_translation.z).abs();
                (dist, key.to_owned())
            })
            .max_by(|a, b| b.0.partial_cmp(&a.0).unwrap())
            .unwrap();

        println!("The nearest vehicle is {:?}", dist);
        if dist.0 < 20.0 {
            let rigid_body = physics_engine.get_rigid_body(self.rigid_body_handle);
            rigid_body.set_enabled(false);
            self.actions.enter_passenger.justPressed = false;
            Some(dist.1)
        } else {
            None
        }
    }

    pub fn exit_vehicle(&mut self, physics_engine: &mut Physics, vehicle: &Blimp) {
        // when we enter a vehicle we should:
        // 1) Remove the physics body
        let mut target_translation =
            physics_engine.get_translation(vehicle.vehicle_data.rigid_body_handle);
        target_translation.y += 1.0;

        let rigid_body = physics_engine.get_rigid_body(self.rigid_body_handle);
        rigid_body.set_enabled(true);
        rigid_body.set_translation(target_translation, true);
        rigid_body.set_linvel(Vector3::new(0.0, 0.0, 0.0), true);
    }

    pub fn get_info(
        &mut self,
        physics_engine: &mut Physics,
        name: String,
        camera_distance: f32,
    ) -> PlayerUpdate {
        let mut pos = physics_engine.get_translation(self.rigid_body_handle);

        let mut ragdoll_info: RagdollUpdate = HashMap::new();

        if self.is_ragdoll {
            if let Some(ragdoll) = &self.ragdoll {
                //get the position of center
                pos = ragdoll.get_pos(physics_engine);

                ragdoll_info = ragdoll.get_info(physics_engine);
            }
        }

        let pos_vec = Vec3 {
            x: pos.x,
            y: pos.y,
            z: pos.z,
        };
        // let rot = physics_engine.get_rotation(self.rigid_body_handle);
        // rot.

        let rot = self.get_rotation();

        let rot_quat = Quat {
            i: rot.i,
            j: rot.j,
            k: rot.k,
            w: rot.w,
        };

        let look_at = Vec3 {
            x: self.look_at.x,
            y: self.look_at.y,
            z: self.look_at.z,
        };

        let mut state = self.character_state.clone();
        if self.is_ragdoll {
            state = CharacterState::Ragdoll;
        }

        PlayerUpdate {
            name: name.to_string(),
            p: pos_vec,
            q: rot_quat,
            colour: self.colour.clone(),
            state: state,
            dir: look_at,
            is_ragdoll: self.is_ragdoll,
            ragdoll_info,
            camera_distance: camera_distance,
            vehicle: None,
        }
    }

    pub fn toggle_ragdoll(&mut self, physics_engine: &mut Physics) {
        self.is_ragdoll = !self.is_ragdoll;

        if self.is_ragdoll {
            let mut rigid_body = physics_engine.get_rigid_body(self.rigid_body_handle);
            rigid_body.set_enabled(false);

            self.ragdoll = Some(Ragdoll::new(
                self.ragdoll_template.clone(),
                physics_engine.get_translation(self.rigid_body_handle),
                self.get_rotation(),
                physics_engine.get_linvel(self.rigid_body_handle),
                physics_engine,
            ));
        } else {
            if let Some(ragdoll) = &mut self.ragdoll {
                let pos = ragdoll.get_pos(physics_engine);

                ragdoll.remove_self(physics_engine);

                let mut rigid_body = physics_engine.get_rigid_body(self.rigid_body_handle);
                rigid_body.set_translation(pos, true);
                rigid_body.set_linvel(Vector3::new(0.0, 0.0, 0.0), true);
                rigid_body.set_enabled(true);

                self.ragdoll = None;
            }
        }
    }

    pub fn launch(&mut self, physics_engine: &mut Physics, launch_dir: Vector3<f32>) {
        let body = physics_engine.get_rigid_body(self.rigid_body_handle);
        let velocity = launch_dir;
        body.set_linvel(velocity, true);
    }

    pub fn on_input_change(&mut self) {
        match self.character_state.clone() {
            CharacterState::Idle(_) => IdleState::on_input_change(self),
            CharacterState::Walk => WalkState::on_input_change(self),
            _ => {}
        }
    }

    pub fn get_translation(&self, physics_engine: &mut Physics) -> Vector3<f32> {
        physics_engine.get_translation(self.rigid_body_handle)
    }

    pub fn check_attack(
        &mut self,
        players: &HashMap<SocketAddr, Player>,
        physics_engine: &mut Physics,
        view_vector: Vector3<f32>,
    ) {
        let ray = Ray::new(
            Point::from(self.get_translation(physics_engine)),
            view_vector,
        );

        let max_toi = 4.0;
        let solid = false;
        let filter = QueryFilter::default().exclude_rigid_body(self.rigid_body_handle);

        if let Some((handle, toi)) = physics_engine.cast_ray(&ray, max_toi, solid, filter) {
            let hit_point = ray.point_at(toi); // Same as: `ray.origin + ray.dir * toi`

            for (_id, player) in players.iter() {
                if player.character.collider_handle == handle {
                    // println!("Collider {:?} hit at point {}", handle, hit_point);
                }
            }

            // ray.point_at(toi)
        }
    }

    pub fn check_interact(&mut self, interactables: &Vec<Objects>, physics_engine: &mut Physics) {
        let max_toi = 4.0;
        let solid = false;
        let filter = QueryFilter::default().exclude_rigid_body(self.rigid_body_handle);

        // if let Some((handle, toi)) = physics_engine.cast_ray(&ray, max_toi, solid, filter) {

        // }
    }

    pub fn remove_self(&mut self, physics_engine: &mut Physics) {
        if let Some(ragdoll) = &mut self.ragdoll {
            ragdoll.remove_self(physics_engine);
        }

        physics_engine.remove_from_rigid_body_set(self.rigid_body_handle);
    }

    pub fn get_rotation(&self) -> Unit<Quaternion<f32>> {
        Isometry3::look_at_rh(
            &Point::new(0.0, 0.0, 0.0),
            &Point::new(self.look_at.x, self.look_at.y, self.look_at.z),
            &Vector3::new(0.0, 1.0, 0.0),
        )
        .rotation
        .inverse()
    }
}
