use super::rigid_body_parent::RigidBodyData;

use gltf::{Node, json::asset};
use nalgebra::{Quaternion, UnitQuaternion, Vector3, Unit};
use rapier3d::prelude::{Collider, ColliderSet, LockedAxes, RigidBodyBuilder, RigidBodySet};

use crate::{structs::ObjectUpdate, world::World, physics::Physics};

pub struct DynamicObject {
    pub object: RigidBodyData,
    lifetime: f32,
    pub alive: bool
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
        translation: Vector3<f32>,
        initial_velcoity: Vector3<f32>,
        lifetime:f32
    ) -> Self {

        let mut platform_body = RigidBodyBuilder::dynamic().build();

        platform_body.set_translation(translation, true);

        platform_body.set_linvel(initial_velcoity, true);

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
            scale,
        );

        Self { object , lifetime, alive:true}
    }

    pub fn get_info(&mut self, rigid_body_set: &mut RigidBodySet) -> ObjectUpdate {
        self.object.get_info(rigid_body_set)
    }

    pub fn update(&mut self, physics_engine: &mut Physics){
        if self.lifetime == 0.0 || !self.alive{
            return;
        }

        self.lifetime = self.lifetime - physics_engine.get_time_step();

        //decompose if life is over
        if self.lifetime <= 0.0 || self.get_translation(physics_engine).y < -10.0{
            physics_engine.remove_from_rigid_body_set(self.object.rigid_body_handle);
            self.alive = false;
            // world.rigid_body_set.remove(self.object.rigid_body_handle,&mut world.island_manager,&mut world.collider_set,&mut )
        }
    }

    pub fn get_translation(& self, physics_engine: &mut Physics ) -> Vector3<f32>{
        physics_engine.get_translation(self.object.rigid_body_handle)
    }

    pub fn remove(& self, physics_engine: &mut Physics){
        
    }
}
