use std::collections::HashMap;

use futures_util::future::TryMaybeDone;
use gltf::json::scene::UnitQuaternion;
use nalgebra::{Vector3, Rotation, Quaternion};
use rapier3d::prelude::{
    Collider, FixedJointBuilder, Point, RigidBodyBuilder, RigidBodyHandle, SphericalJointBuilder,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::{
    physics::Physics,
    structs::{Quat, Vec3},
};

use super::collision;

pub struct Ragdoll {
    parts: HashMap<String, RigidBodyHandle>,
}
struct JointInfo {
    rigid_body_handle: RigidBodyHandle,
    anchor_pos: Point<f32>,
}
impl Ragdoll {
    pub fn new(path: String, physics_engine: &mut Physics) -> Self {
        let (gltf, buffers, _) = gltf::import(path).unwrap();

        let mut joints: HashMap<String, JointInfo> = HashMap::new();
        let mut parts: HashMap<String, RigidBodyHandle> = HashMap::new();

        for scene in gltf.scenes() {
            for node in scene.nodes() {
                if let Some(_) = node.mesh() {
                    println!("{:?}", node.name());
                    if let Some(mut collider) = collision::new_collider(&node, &buffers) {
                        println!("New Collider, {:?}", collider.position());

                        collider.set_translation(Vector3::new(0.0, 0.0, 0.0));
                        let parent_trans = node.transform().decomposed().0;
                        let parent_scale = node.transform().decomposed().2;

                        let mut rigid_body = RigidBodyBuilder::dynamic()
                        .translation(Vector3::new(
                            116.5 + parent_trans[0],
                            2.0 + parent_trans[1],
                            79.8 + parent_trans[2],
                        ))
                        .build();
                        if node.name().unwrap() == "Chest"{
                            rigid_body = RigidBodyBuilder::fixed()
                            .translation(Vector3::new(
                                116.5 + parent_trans[0],
                                2.0 + parent_trans[1],
                                79.8 + parent_trans[2],
                            ))
                            .rotation(Vector3::new(0.0,0.0,-1.7))
                            .build();
                        }

                       
                        let rigid_body_handle = physics_engine.rigid_body_set.insert(rigid_body);
                        let collider_handle = physics_engine.collider_set.insert_with_parent(
                            collider,
                            rigid_body_handle,
                            &mut physics_engine.rigid_body_set,
                        );

                        parts.insert(node.name().unwrap().to_string(), rigid_body_handle);

                        for child in node.children() {
                            if let Some(extras) = child.extras() {
                                let extras: gltf::json::Value =
                                    gltf::json::deserialize::from_str(extras.get()).unwrap();
                                if extras["joint"] != Value::Null {
                                    println!(
                                        "Child name: {:?} {:?}",
                                        child.name(),
                                        extras["joint"]
                                    );
                                    let translation = child.transform().decomposed().0;
                                    if (joints.contains_key(&extras["joint"].to_string())) {
                                        println!("FOUND JOINT {:?}", translation);
                                        let other_joint = &joints[&extras["joint"].to_string()];

                                        let joint = SphericalJointBuilder::new()
                                            .local_anchor1(other_joint.anchor_pos)
                                            .local_anchor2(Point::new(
                                                translation[0] * parent_scale[0],
                                                translation[1] * parent_scale[1],
                                                translation[2] * parent_scale[2],
                                            ));

                                        println!("Joint {:?}", joint);
                                        physics_engine.impulse_joint_set.insert(
                                            other_joint.rigid_body_handle,
                                            rigid_body_handle,
                                            joint,
                                            true,
                                        );
                                    } else {
                                        joints.insert(
                                            extras["joint"].clone().to_string(),
                                            JointInfo {
                                                rigid_body_handle,
                                                // anchor_pos:Point::new(translation[0]-parent_trans[0],translation[1]-parent_trans[1],translation[2]-parent_trans[2])
                                                anchor_pos: Point::new(
                                                    translation[0] * parent_scale[0],
                                                    translation[1] * parent_scale[1],
                                                    translation[2] * parent_scale[2],
                                                ),
                                            },
                                        );
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

        Self { parts }
    }

    pub fn get_info(& self, physics_engine: &mut Physics) -> RagdollUpdate {
        let mut update: RagdollUpdate = HashMap::new();


        let master_pos = physics_engine.get_translation(self.parts["Chest"]);
       
        let master_rot = physics_engine.get_rotation(self.parts["Chest"]);
        
        for (key, value) in &self.parts {

            let mut pos = physics_engine.get_translation(*value);

            pos = pos - master_pos;

            // let rotation = Rotation::from(master_rot);

            // pos = rotation * pos;

            // let mut rot = nalgebra::UnitQuaternion::from_euler_angles(3.141, 3.141, 0.0);//physics_engine.get_rotation(*value)*master_rot.conjugate();

            let mut rot = physics_engine.get_rotation(*value)*master_rot.conjugate();
            // let mut rot = master_rot.conjugate() * physics_engine.get_rotation(*value);
            if key == "Chest"{
                rot = physics_engine.get_rotation(*value);
            }
            

            update.insert(
                key.to_string(),
                Translation {
                    p: Vec3 {
                        x: pos.x,
                        y: pos.y,
                        z: pos.z,
                    },
                    q: Quat {
                        i: rot.i,
                        j: rot.j,
                        k: rot.k,
                        w: rot.w,
                    },
                },
            );
        }

        update
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Translation {
    pub p: Vec3,
    pub q: Quat,
}

pub type RagdollUpdate = HashMap<String, Translation>;
