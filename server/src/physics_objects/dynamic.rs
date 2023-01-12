use super::rigid_body_parent::RigidBodyData;

use gltf::{Node, json::asset};
use nalgebra::{Quaternion, UnitQuaternion, Vector3};
use rapier3d::prelude::{Collider, ColliderSet, LockedAxes, RigidBodyBuilder, RigidBodySet};

use crate::structs::ObjectUpdate;

pub struct DynamicObject {
    pub object: RigidBodyData,
}

impl DynamicObject {
    pub fn new(
        node: &Node,
        rigid_body_set: &mut RigidBodySet,
        mut collider: Collider,
        collider_set: &mut ColliderSet,
        asset_name: String,
        scale:Vector3<f32>
    ) -> Self {
        let pos = node.transform().decomposed().0;
        let rot = node.transform().decomposed().1;

        let rotation =
            UnitQuaternion::from_quaternion(Quaternion::new(rot[3], rot[0], rot[1], rot[2]));

        let mut platform_body = RigidBodyBuilder::dynamic().build();

        platform_body.set_translation(Vector3::new(pos[0], pos[1], pos[2]), true);
        collider.set_translation(Vector3::new(0.0, 0.0, 0.0));

        let rigid_body_handle = rigid_body_set.insert(platform_body);
        let collider_handle =
            collider_set.insert_with_parent(collider, rigid_body_handle, rigid_body_set);

        let object = RigidBodyData::new_with_scale(
            node.name().unwrap().to_string(),
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
