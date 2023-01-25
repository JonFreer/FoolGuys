use std::collections::HashMap;

use nalgebra::Vector3;
use rapier3d::prelude::{Collider, RigidBodyHandle, Point, RigidBodyBuilder, SphericalJointBuilder};
use serde_json::Value;

use crate::physics::Physics;

use super::collision;

pub struct Ragdoll {}
struct JointInfo{
    rigid_body_handle: RigidBodyHandle,
    anchor_pos: Point<f32>
}
impl Ragdoll {
    pub fn new(path: String, physics_engine: &mut Physics) -> Self {
        let (gltf, buffers, _) = gltf::import(path).unwrap();

        // let mut shapes = Vec::new();
        let mut joints : HashMap<String, JointInfo> = HashMap::new();
        for scene in gltf.scenes() {
            for node in scene.nodes() {
                if let Some(_) = node.mesh() {
                    println!("{:?}", node.name());
                    if let Some(mut collider) = collision::new_collider(&node, &buffers) {
                        println!("New Collider, {:?}",collider.position());

                        collider.set_translation(Vector3::new(0.0,0.0,0.0));

                        let rigid_body = RigidBodyBuilder::dynamic().translation(Vector3::new(116.5, 5.0,-79.8)).build();
                        let rigid_body_handle = physics_engine.rigid_body_set.insert(rigid_body);
                        let collider_handle = physics_engine.collider_set.insert_with_parent(collider, rigid_body_handle, &mut physics_engine.rigid_body_set);
                        
                        let parent_trans = node.transform().decomposed().0;

                        

                        for child in node.children() {
                            if let Some(extras) = child.extras() {
                                let extras: gltf::json::Value =
                                    gltf::json::deserialize::from_str(extras.get()).unwrap();
                                if extras["joint"] != Value::Null {
                                    println!("Child name: {:?} {:?}", child.name(),extras["joint"]);
                                        let translation = node.transform().decomposed().0;
                                        if(joints.contains_key(&extras["joint"].to_string())){
                                            println!("FOUND JOINT");
                                            let other_joint = &joints[&extras["joint"].to_string()]; 

                                            let joint = SphericalJointBuilder::new()
                                                .local_anchor1(other_joint.anchor_pos)
                                                .local_anchor2(Point::new(translation[0],translation[1],translation[2]));

                                            physics_engine.impulse_joint_set.insert(other_joint.rigid_body_handle, rigid_body_handle, joint, true);

                                        }else{
                                            joints.insert(extras["joint"].clone().to_string(), JointInfo{
                                                rigid_body_handle,
                                                // anchor_pos:Point::new(translation[0]-parent_trans[0],translation[1]-parent_trans[1],translation[2]-parent_trans[2])
                                                anchor_pos:Point::new(translation[0],translation[1],translation[2])
                                            });
                                        }

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
