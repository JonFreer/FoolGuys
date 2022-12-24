use rapier3d::prelude::RigidBodySet;

use crate::{
    animation::{Animations},
    structs::ObjectUpdate,
};

use super::dynamic::DynamicObject;

pub struct LaunchPad {
    pub object: DynamicObject,
    animations: Animations,
}

impl LaunchPad {
    pub fn new(object: DynamicObject, animations: Animations) -> Self {
        Self { object, animations }
    }

    pub fn get_info(&mut self, rigid_body_set: &mut RigidBodySet) -> ObjectUpdate {
        self.object.get_info(rigid_body_set)
    }
}
