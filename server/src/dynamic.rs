use gltf::json::scene::UnitQuaternion;
use nalgebra::{Unit, Quaternion};
use rapier3d::prelude::*;

use crate::structs::{Quat, Vec3, PlayerUpdate};

pub struct DynamicObject {
    pub name:String,
    pub rigid_body_handle: RigidBodyHandle,
    pub collider_handle: ColliderHandle,
    pub original_rotation: Unit<Quaternion<f32>>

}

impl DynamicObject {
    pub fn new(name:String,rigid_body_handle: RigidBodyHandle, collider_handle: ColliderHandle,original_rotation:Unit<Quaternion<f32>>) -> Self {


        Self {name,rigid_body_handle,collider_handle,original_rotation}
    }

    pub fn get_info(&mut self, rigid_body_set: &mut RigidBodySet) -> PlayerUpdate {
        let rigid_body = &rigid_body_set[self.rigid_body_handle];
        let pos = rigid_body.translation();
        let pos_vec = Vec3 {
            x: pos.x,
            y: pos.y,
            z: pos.z,
        };
        let rot = rigid_body.rotation() * self.original_rotation;
        // rot.
        let rot_quat = Quat {
            i: rot.i,
            j: rot.j,
            k: rot.k,
            w: rot.w,
        };

        PlayerUpdate {
            name:self.name.clone(),
            p: pos_vec,
            q: rot_quat,
        }
    }
}
