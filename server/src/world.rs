use gltf::{Node, Document};
use gltf::iter::Animations;
// use gltf::json::Node;
use rapier3d::prelude::{ColliderSet, RigidBodySet};
use serde_json::Value;

use crate::physics_objects::collision;
use crate::physics_objects::dynamic::Objects;
use crate::physics_objects::launchpad::LaunchPad;
use crate::physics_objects::pivot::PivotObject;
use crate::physics_objects::spin::SpinObject;

pub struct World {
    pub rigid_body_set: RigidBodySet,
    pub collider_set: ColliderSet,
    pub dynamic_objects: Vec<Objects>,
}

impl World {
    pub fn new(path: &str) -> Self {
        let mut rigid_body_set = RigidBodySet::new();
        let mut collider_set = ColliderSet::new();
        let mut dynamic_objects = Vec::new();

        println!("Created world");

        let (gltf, buffers, _) = gltf::import(path).unwrap();
        for scene in gltf.scenes() {
            for node in scene.nodes() {
                create_object(&node,&buffers,&mut dynamic_objects,&mut rigid_body_set, &mut collider_set,&gltf);
            }
        }

        Self {
            rigid_body_set,
            collider_set,
            dynamic_objects,
        }
    }
}

pub fn create_object(
    node: &Node,
    buffers: &Vec<gltf::buffer::Data>,
    dynamic_objects: &mut Vec<Objects>,
    rigid_body_set: &mut RigidBodySet,
    collider_set: &mut ColliderSet,
    gltf : &Document
) {
    if let Some(_) = node.mesh() {
        let collider_option = collision::new_collider(node, &buffers);
        if let Some(collider) = collider_option {
            let extras = node.extras().as_ref();
            if let Some(extras) = extras {
                let extras: gltf::json::Value =
                    gltf::json::deserialize::from_str(extras.get()).unwrap();
                println!("Launch {:?}", extras["launchpad"]);
                if extras["spin"] != Value::Null {
                    let obj = SpinObject::new(
                        extras["spin"].to_string(),
                        &node,
                        rigid_body_set,
                        collider,
                         collider_set,
                    );
                    dynamic_objects.push(Objects::Spin(obj));
                } else if extras["pivot"] != Value::Null {
                    let obj = PivotObject::new(
                        extras["pivot"].to_string(),
                        &node,
                        rigid_body_set,
                        collider,
                        collider_set,
                    );
                    dynamic_objects.push(Objects::Pivot(obj));
                } else if extras["launchpad"] != Value::Null {
                    println!("Creating launchpad {:?}",extras["launchpad"]);
                    let obj = LaunchPad::new(
                        gltf.animations(),
                        &node,
                        rigid_body_set,
                        collider,
                        collider_set,
                        &buffers,
                        extras["launchpad"].to_string()
                    );
                    dynamic_objects.push(Objects::LaunchPad(obj));
                } else {
                    collider_set.insert(collider);
                }
            } else {
                collider_set.insert(collider);
            }
        }
        
        for child in node.children(){
            create_object(&child, buffers, dynamic_objects, rigid_body_set, collider_set, gltf);
        }
    }
}
