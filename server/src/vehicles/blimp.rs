use std::net::SocketAddr;

use nalgebra::{Vector2, Vector3};
use rapier3d::prelude::{ColliderBuilder, ColliderHandle, RigidBodyBuilder, RigidBodyHandle};
use serde_json::Value;

use crate::{
    physics::Physics,
    structs::{Quat, Vec3, VehicleUpdate},
    world::World,
};

use super::vehicles::{GetInfo, SetOccupant, VehicleData};

pub struct Blimp {
    pub name: String,
    pub vehicle_data: VehicleData,
    pub occupant: Option<SocketAddr>,
    pub client_move_vec: Vector2<f32>, // pub player:
}

impl Blimp {
    pub fn new(physics_engine: &mut Physics) -> Self {
        let mut rigid_body = RigidBodyBuilder::dynamic().lock_rotations().build();

        rigid_body.set_translation(Vector3::new(0.0, 100.0, 0.0), true);

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
        }
    }

    pub fn update_physics(&mut self, physics_engine: &mut Physics) {
        let rot = physics_engine.get_rotation(self.vehicle_data.rigid_body_handle);
        let vec = rot * Vector3::new(1.0,0.0,0.0);
        println!("{:?}",vec);
    }

    pub fn update_messages(&mut self, physics_engine: &mut Physics, value: &Value) {
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
