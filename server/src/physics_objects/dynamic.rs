use super::rigid_body_parent::RigidBodyData;

use gltf::{Node, json::asset};
use nalgebra::{Quaternion, UnitQuaternion, Vector3, Unit};
use rapier3d::prelude::{Collider, ColliderSet, LockedAxes, RigidBodyBuilder, RigidBodySet};

use crate::structs::ObjectUpdate;

pub struct DynamicObject {
    pub object: RigidBodyData,
}

impl DynamicObject {
    pub fn new(
        name:String,
        rigid_body_set: &mut RigidBodySet,
        mut collider: Collider,
        collider_set: &mut ColliderSet,
        asset_name: String,
        scale:Vector3<f32>,
        rotation: Unit<Quaternion<f32>>,
        translation: Vector3<f32>
    ) -> Self {

        let mut platform_body = RigidBodyBuilder::dynamic().build();

        platform_body.set_translation(translation, true);
        
        collider.set_translation(Vector3::new(0.0, 0.0, 0.0));

        let rigid_body_handle = rigid_body_set.insert(platform_body);

        let collider_handle =
            collider_set.insert_with_parent(collider, rigid_body_handle, rigid_body_set);

        let object = RigidBodyData::new_with_scale(
            name, //node.name().unwrap().to_string()
            rigid_body_handle,
            collider_handle,
            rotation,
            asset_name,
            scale
        );

        Self { object }
    }

    pub fn get_info(&mut self, rigid_body_set: &mut RigidBodySet) -> ObjectUpdate {
        self.object.get_info(rigid_body_set)
    }
}
