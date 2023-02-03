use gltf::{ Node};
use nalgebra::{Vector3};
use rapier3d::prelude::{
    Collider, GenericJointBuilder, JointAxesMask, Point, RigidBodyBuilder,
    RigidBodyHandle, ImpulseJointHandle,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use ts_rs::TS;

use crate::{
    physics::Physics,
    structs::{Quat, Vec3},
};

use super::collision;

#[derive(Clone)]
pub struct Ragdoll {
    parts: HashMap<String, RagdollPart>,
    joints: HashMap<String, ImpulseJointHandle>
}

#[derive(Clone)]
struct RagdollPart {
    rigid_body_handle: RigidBodyHandle,
    parent_name: Option<String>,
    joint: Option<ImpulseJointHandle>
}



impl Ragdoll {
    pub fn new(template : RagdollTemplate , position: Vector3<f32>,lin_vel:Vector3<f32> , physics_engine: &mut Physics ) -> Self {

        let mut parts: HashMap<String, RagdollPart> = HashMap::new();
        let mut joints: HashMap<String, ImpulseJointHandle> = HashMap::new();
        //Create and place rigid bodies

        for (name,template_part) in template.parts{
            let rigid_body = RigidBodyBuilder::dynamic()
            .translation(Vector3::new(
                position.x + template_part.translation.x,
                position.y + template_part.translation.y,
                position.z + template_part.translation.z,
            )).linvel(lin_vel)
            .build();

            let rigid_body_handle = physics_engine.rigid_body_set.insert(rigid_body);
            let _collider_handle = physics_engine.collider_set.insert_with_parent(
                template_part.collider.clone(),
                rigid_body_handle,
                &mut physics_engine.rigid_body_set,
            );

            parts.insert(name, RagdollPart { rigid_body_handle, parent_name: template_part.parent_name, joint:None });
        }

        for (_joint_name,joint_info) in template.joints{
            let joint = GenericJointBuilder::new(
                JointAxesMask::LOCKED_SPHERICAL_AXES | JointAxesMask::ANG_X,
            )
            .local_anchor1(joint_info.anchor_pos_parent.unwrap())
            .local_anchor2(joint_info.anchor_pos_child.unwrap());
            let parent_name  = joint_info.name_parent.unwrap();

            let impulse_joint_handle = physics_engine.impulse_joint_set.insert(
                parts[&parent_name].rigid_body_handle,
                parts[&joint_info.name_child.unwrap()].rigid_body_handle,
                joint,
                true,
            );

            let impulse_joint = physics_engine.impulse_joint_set.get(impulse_joint_handle).unwrap();

            let local_anchor = impulse_joint.data.local_anchor1();

            let translation = physics_engine.get_rigid_body(parts["Chest"].rigid_body_handle).position().to_matrix();//.mul_to(rhs, out);
            // let new_point  = local_anchor.coords.to_homogeneous()*translation;
            let pos = physics_engine.get_rigid_body(parts["Chest"].rigid_body_handle);

            let p =  pos.position().to_matrix()*local_anchor.xyz().to_homogeneous();

            println!("coords joint: {:?} {:?} {:?}",local_anchor.xyz(),translation,p);
            
            joints.insert(parent_name, impulse_joint_handle);

        }

        Self { parts,joints }
    }

    pub fn get_pos(&self, physics_engine: &mut Physics) -> Vector3<f32> {
        physics_engine.get_translation(self.parts["Chest"].rigid_body_handle)
    }

    pub fn get_info(&self, physics_engine: &mut Physics) -> RagdollUpdate {
        let mut update: RagdollUpdate = HashMap::new();


        //find master
        let master_pos = physics_engine.get_translation(self.parts["Chest"].rigid_body_handle);
        let master_rot = physics_engine.get_rotation(self.parts["Chest"].rigid_body_handle);

        update.insert(
            "Chest".to_string(),
            Translation {
                p: Vec3 {
                    x: master_pos.x,
                    y: master_pos.y,
                    z: master_pos.z,
                },
                q: Quat {
                    i: master_rot.i,
                    j: master_rot.j,
                    k: master_rot.k,
                    w: master_rot.w,
                },
            },
        );
        

        //TODO::If the rigid body does not have a master, send the location of that rigid body. Idea: Mark in blender

        for (name,impulse_joint_handle) in &self.joints{

            let joint = physics_engine.impulse_joint_set.get(*impulse_joint_handle).unwrap();

            let rigid_body_handle = joint.body1;
            let joint_loc = joint.data.local_anchor1().xyz().to_homogeneous();

            let joint_world_loc = physics_engine.get_rigid_body(rigid_body_handle).position().to_matrix() * joint_loc;

            let rot = physics_engine.get_rigid_body(rigid_body_handle).rotation();

            let pos = joint_world_loc.xyz() - master_pos;

            update.insert(
                name.to_string(),
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

    pub fn remove_self(&mut self, physics_engine: &mut Physics) {
        for (_name, part) in &self.parts {
            physics_engine.remove_from_rigid_body_set(part.rigid_body_handle);
        }
    }
}

#[ts(export)]
#[derive(Serialize, Deserialize, Clone, Debug, TS)]
pub struct Translation {
    pub p: Vec3,
    pub q: Quat,
}

// #[ts(export)]
// #[derive(Serialize, Deserialize, Clone, Debug,TS)]
pub type RagdollUpdate = HashMap<String, Translation>;

#[derive(Clone)]
pub struct RagdollTemplate {
    joints: HashMap<String, JointInfo>,
    parts: HashMap<String, RagdollTemplatePart>,
}

#[derive(Clone)]
pub struct RagdollTemplatePart {
    collider: Collider,
    translation: Vector3<f32>,
    scale: Vector3<f32>,
    parent_name:Option<String>
}

#[derive(Clone)]
struct JointInfo {
    name_parent: Option<String>,
    anchor_pos_parent: Option<Point<f32>>,
    name_child: Option<String>,
    anchor_pos_child: Option<Point<f32>>,
}


impl RagdollTemplate {
    pub fn new(path: String) -> Self {
        let (gltf, buffers, _) = gltf::import(path).unwrap();

        let mut joints: HashMap<String, JointInfo> = HashMap::new();
        let mut parts: HashMap<String, RagdollTemplatePart> = HashMap::new();

        for scene in gltf.scenes() {
            for node in scene.nodes() {
                // if let Some(_) = node.mesh() {
                    RagdollTemplate::recursive_add_part(
                        None,
                        &node,
                        &buffers,
                        None,
                        &mut joints,
                        &mut parts,
                    );
                // }
            }
        }

        Self { joints, parts }
    }

    fn recursive_add_part(
        parent_node:Option<&Node>,
        node: &Node,
        buffers: &Vec<gltf::buffer::Data>,
        parent_name: Option<String>,
        joints: &mut HashMap<String, JointInfo>,
        parts: &mut HashMap<String, RagdollTemplatePart>,
    ) {
        if let Some(_) = node.mesh() {
            if let Some(mut collider) = collision::new_collider(&node, &buffers) {
                
                println!("New Collider, {:?}", collider.position());

                collider.set_translation(Vector3::new(0.0, 0.0, 0.0));

                let t = node.transform().decomposed().0;
                let s = node.transform().decomposed().2;


                //If the current mesh has a parent, this is a joint. Offset the position of the collider with repect to this joint
                if let Some(parent) = parent_node{
                    if let Some(extras) = parent.extras() {

                        let extras: gltf::json::Value =
                            gltf::json::deserialize::from_str(extras.get()).unwrap();
                        if extras["joint"] != Value::Null {
                            let translation = parent.transform().decomposed().0;
                            if joints.contains_key(&extras["joint"].to_string()) {
                                let mut joint =  joints[&extras["joint"].to_string()].clone();

                                joint.name_parent = Some(node.name().unwrap().to_string());
                                joint.anchor_pos_parent = Some(Point::new(
                                    translation[0] * s[0],
                                    translation[1] * s[1],
                                    translation[2] * s[2],
                                ));

                                joints.insert(extras["joint"].to_string() , joint);

                            } else {
                                joints.insert(
                                    extras["joint"].clone().to_string(),
                                    JointInfo {
                                        name_parent: Some(node.name().unwrap().to_string()),
                                        anchor_pos_parent: Some(Point::new(
                                            translation[0] * s[0],
                                            translation[1] * s[1],
                                            translation[2] * s[2],
                                        )),
                                        name_child: None,
                                        anchor_pos_child: None,
                                    },
                                );
                            }

                            collider.set_translation(Vector3::new(translation[0],translation[1],translation[2]));

                        }
                    }
                }

                parts.insert(
                    node.name().unwrap().to_string(),
                    RagdollTemplatePart {
                        collider,
                        translation: Vector3::new(t[0], t[1], t[2]),
                        scale: Vector3::new(s[0], s[1], s[2]),
                        parent_name
                    },
                );



                //TODO:: Check if parent is an empty and make that cheif joint also offset collider

                for child in node.children() {
              

                    if let Some(extras) = child.extras() {
                        let extras: gltf::json::Value =
                            gltf::json::deserialize::from_str(extras.get()).unwrap();
                        if extras["joint"] != Value::Null {
                            let translation = child.transform().decomposed().0;
                            if joints.contains_key(&extras["joint"].to_string()) {
                                let mut joint =  joints[&extras["joint"].to_string()].clone();

                                joint.name_child = Some(node.name().unwrap().to_string());
                                joint.anchor_pos_child = Some(Point::new(
                                    translation[0] * s[0],
                                    translation[1] * s[1],
                                    translation[2] * s[2],
                                ));

                                joints.insert(extras["joint"].to_string() , joint);
                            } else {
                                joints.insert(
                                    extras["joint"].clone().to_string(),
                                    JointInfo {
                                        name_child: Some(node.name().unwrap().to_string()),
                                        anchor_pos_child: Some(Point::new(
                                            translation[0] * s[0],
                                            translation[1] * s[1],
                                            translation[2] * s[2],
                                        )),
                                        name_parent: None,
                                        anchor_pos_parent: None,
                                    },
                                );
                            }
                        }
                    }
                }

            }
        }

        for child in node.children() {
            RagdollTemplate::recursive_add_part(
                Some(node),
                &child,
                buffers,
                Some(node.name().unwrap().to_string()),
                joints,
                parts,
            );
        }
    }
}
