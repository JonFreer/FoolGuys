use std::{net::SocketAddr, ops::Mul};

use nalgebra::{Vector2, Vector3};
use rapier3d::prelude::{ColliderBuilder, ColliderHandle, RigidBodyBuilder, RigidBodyHandle};
use serde_json::Value;

use crate::{
    physics::Physics,
    structs::{Quat, Vec3, VehicleUpdate, KeyBinding, BlimpControls},
    world::World,
};

use super::vehicles::{GetInfo, SetOccupant, VehicleData};

pub struct Blimp {
    pub name: String,
    pub vehicle_data: VehicleData,
    pub occupant: Option<SocketAddr>,
    pub client_move_vec: Vector2<f32>, // pub player:
    pub controls: BlimpControls
    // pub
}

impl Blimp {
    pub fn new(physics_engine: &mut Physics) -> Self {
        let mut rigid_body = RigidBodyBuilder::dynamic().lock_rotations().build();

        rigid_body.set_translation(Vector3::new(116.59255, 2.4971805, 79.82746), true);
        rigid_body.set_angular_damping(1.0);
        let rigid_body_handle = physics_engine.rigid_body_set.insert(rigid_body);

        let collider = ColliderBuilder::capsule_y(0.3, 0.3).build();

        let collider_handle = physics_engine.collider_set.insert_with_parent(
            collider,
            rigid_body_handle,
            &mut physics_engine.rigid_body_set,
        );

        Self {
            name: "Blimp".to_string(),
            vehicle_data: VehicleData {
                rigid_body_handle,
                collider_handle,
            },
            occupant: None,
            client_move_vec: Vector2::new(0.0, 0.0),
            controls: BlimpControls::new()
        }
    }

    pub fn update_physics(&mut self, physics_engine: &mut Physics) {
        let rot = physics_engine.get_rotation(self.vehicle_data.rigid_body_handle);
        let vec = rot * Vector3::new(0.1,0.0,0.0);
        let velocity = vec * self.client_move_vec.y;

        let current_velocity = physics_engine.get_rigid_body(self.vehicle_data.rigid_body_handle).linvel();
        let scaled_velocity = current_velocity * 0.99;
        let mut new_veolcity = scaled_velocity + velocity;

        new_veolcity.y += 9.81/60.0;
        if self.controls.up.isPressed{
            println!("{:?}",self.controls.up);

            new_veolcity.y += 0.1;
        }

        if self.controls.down.isPressed{
            new_veolcity.y -= 0.1;
        }

        physics_engine
                .get_rigid_body(self.vehicle_data.rigid_body_handle)
                .set_linvel(new_veolcity, true);


        if self.client_move_vec.x != 0.0{
        let angular_velocity = physics_engine.get_rigid_body(self.vehicle_data.rigid_body_handle).angvel();

            let new_velocity = angular_velocity + Vector3::new(0.0,0.01,0.0)* self.client_move_vec.x;

            physics_engine
            .get_rigid_body(self.vehicle_data.rigid_body_handle).set_angvel(new_velocity, true);
        }
      
        // println!("{:?}",vec * self.client_move_vec.y);
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

        if value[0] == "update_blimp" {
            let actions: Value = value[1]["actions"].clone();
            self.controls = BlimpControls{
                up: KeyBinding::new(&actions["up"]),
                down : KeyBinding::new(&actions["down"]),
                enter_passenger: KeyBinding::new(&actions["enter_passenger"])
            };
        }

        self.controls.enter_passenger.justPressed

    }
}

impl SetOccupant for Blimp {
    fn set_occupant(&mut self, id: SocketAddr) {
        if self.occupant == None {
            self.occupant = Some(id);
        }
    }
}

impl GetInfo for Blimp {
    fn get_info(&mut self, rigid_body_set: &mut rapier3d::prelude::RigidBodySet) -> VehicleUpdate {
        let rigid_body = &rigid_body_set[self.vehicle_data.rigid_body_handle];

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

        VehicleUpdate {
            name: self.name.clone(),
            p: pos_vec,
            q: rot_quat,
            asset_name: "Asset_BoatA".to_string(),
        }
    }
}
