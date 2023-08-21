use std::net::SocketAddr;

use rapier3d::prelude::{RigidBodyHandle, ColliderHandle, RigidBodySet};

use crate::structs::VehicleUpdate;

pub struct VehicleData{
    pub rigid_body_handle: RigidBodyHandle,
    pub collider_handle: ColliderHandle,
}

pub trait SetOccupant{
    fn set_occupant(&mut self, id: SocketAddr);
}
pub trait GetInfo{
    fn get_info(&mut self,  rigid_body_set: &mut RigidBodySet) -> VehicleUpdate ;
}