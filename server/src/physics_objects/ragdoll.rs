use rapier3d::prelude::Collider;
use serde_json::Value;

use super::collision;

pub struct Ragdoll {}

impl Ragdoll {
    pub fn new(path: String) -> Self {
        let (gltf, buffers, _) = gltf::import(path).unwrap();

        // let mut shapes = Vec::new();

        for scene in gltf.scenes() {
            for node in scene.nodes() {
                if let Some(_) = node.mesh() {
                    println!("{:?}", node.name());
                    if let Some(collider) = collision::new_collider(&node, &buffers) {
                        println!("New Collider");

                        for child in node.children() {
                            if let Some(extras) = child.extras() {
                                let extras: gltf::json::Value =
                                    gltf::json::deserialize::from_str(extras.get()).unwrap();
                                if extras["joint"] != Value::Null {
                                    println!("Child name: {:?} {:?}", child.name(),extras["joint"]);
                                }
                            }
                        }
                    }
                    // if let Some(extras) = node.extras() {
                    //     let extras: gltf::json::Value =
                    //         gltf::json::deserialize::from_str(extras.get()).unwrap();
                    //         println!("{:?}",extras);

                    // }
                    // println!("{:?}",node);
                }
            }
        }

        Self {}
    }
}
