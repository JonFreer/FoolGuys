use gltf::{Node};
use nalgebra::{Vector3, Quaternion, UnitQuaternion};
use rapier3d::prelude::{RigidBodySet, RigidBodyBuilder, LockedAxes, ColliderSet, Collider};

use crate::{
    structs::ObjectUpdate,
};

use super::dynamic::DynamicObject;

pub struct PivotObject {
    pub object: DynamicObject,
}

impl PivotObject {
    pub fn new(pivot_dir: String, node: &Node , rigid_body_set: &mut RigidBodySet,mut collider : Collider,collider_set: &mut ColliderSet) -> Self {
        
        let pos = node.transform().decomposed().0;
        let rot = node.transform().decomposed().1;
        println!("pivot dir {}",pivot_dir.as_str());

        let  locked_axis = match pivot_dir.as_str(){
            "\"x\"" =>  LockedAxes::ROTATION_LOCKED_Y | LockedAxes::ROTATION_LOCKED_Z,
            "\"y\"" => LockedAxes::ROTATION_LOCKED_Z | LockedAxes::ROTATION_LOCKED_X,
            "\"z\"" => LockedAxes::ROTATION_LOCKED_Y | LockedAxes::ROTATION_LOCKED_X,
            e => {println!("{}",e); LockedAxes::TRANSLATION_LOCKED}
        } |  LockedAxes::TRANSLATION_LOCKED;


        let mut platform_body =
            RigidBodyBuilder::dynamic().locked_axes(locked_axis).build();
        // collider.set_restitution(0.7);
        platform_body
            .set_translation(Vector3::new(pos[0], pos[1], pos[2]), true);
        // platform_body.lock_rotations(locked, wake_up)
        platform_body.set_translation(Vector3::new(pos[0],pos[1],pos[2]), true);
        // let collider = &mut collider_set[collider_handle];
        collider.set_translation(Vector3::new(0.0,0.0,0.0));
        collider.set_mass(10.0);

        let rotation = UnitQuaternion::from_quaternion(Quaternion::new(
            rot[3], rot[0], rot[1], rot[2],
        ));

        let rigid_body_handle = rigid_body_set.insert(platform_body);
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
