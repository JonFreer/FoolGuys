use nalgebra::{Quaternion, Unit};
use rapier3d::prelude::*;

use crate::structs::{ObjectUpdate, Quat, Vec3};

use super::{launchpad::LaunchPad, pivot::PivotObject, spin::SpinObject, dynamic::DynamicObject};

pub enum Objects {
    Spin(SpinObject),
    Pivot(PivotObject),
    LaunchPad(LaunchPad),
    Dynamic(DynamicObject),
}

impl Objects {
    pub fn name(&self) -> String {
        match &*self {
            Objects::Spin(obj) => obj.object.name.clone(),
            Objects::Pivot(obj) => obj.object.name.clone(),
            Objects::LaunchPad(obj) => obj.object.name.clone(),
            Objects::Dynamic(obj) => obj.object.name.clone(),
        }
    }

    pub fn get_info(&mut self, rigid_body_set: &mut RigidBodySet) -> ObjectUpdate {
        match &mut *self {
            Objects::Spin(obj) => obj.get_info(rigid_body_set),
            Objects::Pivot(obj) => obj.get_info(rigid_body_set),
            Objects::LaunchPad(obj) => obj.get_info(rigid_body_set),
            Objects::Dynamic(obj) => obj.get_info(rigid_body_set),
        }
    }
}



pub struct RigidBodyData {
    pub name: String,
    pub rigid_body_handle: RigidBodyHandle,
    pub collider_handle: ColliderHandle,
    pub original_rotation: Unit<Quaternion<f32>>,
    pub asset_name : String
}

impl RigidBodyData {
    pub fn new(
        name: String,
        rigid_body_handle: RigidBodyHandle,
        collider_handle: ColliderHandle,
        original_rotation: Unit<Quaternion<f32>>,
        asset_name:String
    ) -> Self {
        Self {
            name,
            rigid_body_handle,
            collider_handle,
            original_rotation,
            asset_name
        }
    }

    pub fn get_info(&mut self, rigid_body_set: &mut RigidBodySet) -> ObjectUpdate {
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

        ObjectUpdate {
            name: self.name.clone(),
            p: pos_vec,
            q: rot_quat,
            asset_name: self.asset_name.clone()
        }
    }
}
