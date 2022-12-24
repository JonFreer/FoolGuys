use gltf::{Node};
use nalgebra::{Vector3, Quaternion, UnitQuaternion};
use rapier3d::prelude::{RigidBodySet, RigidBodyBuilder, Collider, ColliderSet};

use crate::{
    structs::ObjectUpdate,
};

use super::dynamic::DynamicObject;

pub struct SpinObject {
    pub object: DynamicObject,
}

impl SpinObject {
    pub fn new(spin_dir: String, node: &Node , rigid_body_set: &mut RigidBodySet, mut collider :  Collider, collider_set : &mut ColliderSet) -> Self {

        let pos = node.transform().decomposed().0;
        let rot = node.transform().decomposed().1;

        collider.set_translation(Vector3::new(0.0,0.0,0.0));
        
        let roll_axis = match spin_dir.as_str(){
            "\"x\""=>Vector3::new(1.0, 0.0, 0.0),
            "\"y\""=>Vector3::new(0.0, 1.0, 0.0),
            "\"z\""=>Vector3::new(0.0, 0.0, 1.0),
            _ =>Vector3::new(0.0,0.0,0.0)
        };
     
        let mut platform_body =
            RigidBodyBuilder::kinematic_velocity_based()
                .angvel(roll_axis)
                // .translation(Vector3::new(pos[0], pos[1], pos[2]))
                .build();

        platform_body
            .set_translation(Vector3::new(pos[0], pos[1], pos[2]), true);

        let rigid_body_handle = rigid_body_set.insert(platform_body);
                
        let rotation = UnitQuaternion::from_quaternion(Quaternion::new(
            rot[3], rot[0], rot[1], rot[2],
        ));

        collider.set_mass(0.0);

        let collider_handle = collider_set.insert_with_parent(
            collider,
            rigid_body_handle,
            rigid_body_set,
        );

        let object = DynamicObject::new(
            node.name().unwrap().to_string(),
            rigid_body_handle,
            collider_handle,
            rotation,
        );

        Self { object }
    }

    pub fn get_info(&mut self, rigid_body_set: &mut RigidBodySet) -> ObjectUpdate {
        self.object.get_info(rigid_body_set)
    }
}
