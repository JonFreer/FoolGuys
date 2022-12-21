// use std::primitive;
// use std::ptr::null;

// use gltf::Gltf;
use nalgebra::{Vector3, Quaternion, UnitQuaternion};
use rapier3d::prelude::*;
use rapier3d::prelude::{ColliderSet, RigidBodySet};
use serde_json::Value;

use crate::dynamic::DynamicObject;

pub struct World {
    pub rigid_body_set: RigidBodySet,
    pub collider_set: ColliderSet,
    pub dynamic_objects: Vec<DynamicObject>
}

impl World {
    pub fn new(path:&str) -> Self {
        let mut rigid_body_set = RigidBodySet::new();
        let mut collider_set = ColliderSet::new();
        let mut dynamic_objects = Vec::new();
        println!("Created world");
        // let gltf = Gltf::open("../dist/client/assets/world.glb").unwrap();
        let (gltf, buffers, _) = gltf::import(path).unwrap();
        // println!("{:#?}", gltf);
        for scene in gltf.scenes() {
            // let extras = scene.extras().as_ref().unwrap();

            println!("Extras {:?}", scene.extras());
            for node in scene.nodes() {
                let child = node.children();
                let name = node.name().unwrap();

                let extras = node.extras().as_ref();
                if let Some(extras) = extras {
                    let extras: gltf::json::Value =
                        gltf::json::deserialize::from_str(extras.get()).unwrap();
                    println!("Extras {:?} {:?}", extras["physics"], extras["physics2"]);

                    if extras["physics"] == "hull" {
                        if let Some(mesh) = node.mesh() {
                            let scale = node.transform().decomposed().2;
                            let mut points_vec = Vec::new();
                            let primitive = mesh.primitives().next().unwrap();
                            let reader = primitive.reader(|buffer| Some(&buffers[buffer.index()]));
                            if let Some(iter) = reader.read_positions() {
                                for vertex_position in iter {
                                    points_vec.push(Point::new(
                                        vertex_position[0] *scale[0],
                                        vertex_position[1] *scale[1],
                                        vertex_position[2] *scale[2],
                                    ));
                                }
                            }

                            let pos = node.transform().decomposed().0;
                            
                            let rot =  node.transform().decomposed().1;
                            let mut collider =
                                ColliderBuilder::convex_hull(&points_vec).unwrap().build();
                            // collider.set_translation(Vector3::new(pos[0], pos[1], pos[2]));
                            let rotation = UnitQuaternion::from_quaternion(Quaternion::new(rot[3],rot[0],rot[1],rot[2]));
                            collider.set_mass(0.0);

                            collider.set_rotation(rotation);
                            
                            if extras["spin"] != Value::Null{
                                let mut roll_axis = Vector3::new(0.0,0.0,0.0);
                                if extras["spin"] == "x"{
                                    roll_axis = Vector3::new(1.0,0.0,0.0);
                                }else if extras["spin"] == "y"{
                                    roll_axis = Vector3::new(0.0,1.0,0.0);
                                }else if extras["spin"] == "z"{
                                    roll_axis = Vector3::new(0.0,0.0,1.0);
                                }

                                let mut platform_body = RigidBodyBuilder::kinematic_velocity_based().angvel(roll_axis).build();
                                platform_body.set_translation(Vector3::new(pos[0], pos[1], pos[2]), true);
                                
                                let rigid_body_handle = rigid_body_set.insert(platform_body);
                                let collider_handle = collider_set.insert_with_parent(collider, rigid_body_handle, &mut rigid_body_set);

                                let obj = DynamicObject::new(node.name().unwrap().to_string(),rigid_body_handle,collider_handle,rotation);
                                
                                dynamic_objects.push(obj);
                            }else if extras["pivot"] != Value::Null{

                                println!("Pivot!!!");
                                let mut locked_axis = LockedAxes::TRANSLATION_LOCKED ;

                                if extras["pivot"] == "x"{
                                    locked_axis |= LockedAxes::ROTATION_LOCKED_Y | LockedAxes::ROTATION_LOCKED_Z;
                                }else if extras["pivot"] == "y"{
                                    locked_axis |=LockedAxes::ROTATION_LOCKED_Z| LockedAxes::ROTATION_LOCKED_X;
                                }else if extras["pivot"] == "z"{
                                    locked_axis |= LockedAxes::ROTATION_LOCKED_Y| LockedAxes::ROTATION_LOCKED_X;
                                }

                                let mut platform_body = RigidBodyBuilder::dynamic().locked_axes(locked_axis).build();
                                // collider.set_restitution(0.7);
                                platform_body.set_translation(Vector3::new(pos[0], pos[1], pos[2]), true);
                                // platform_body.lock_rotations(locked, wake_up)
                                
                                collider.set_mass(10.0);
                                // collider.
                                let rigid_body_handle = rigid_body_set.insert(platform_body);
                                let collider_handle = collider_set.insert_with_parent(collider, rigid_body_handle, &mut rigid_body_set);

                                let obj = DynamicObject::new(node.name().unwrap().to_string(),rigid_body_handle,collider_handle,rotation);
                                
                                dynamic_objects.push(obj);
                            }else{
                                collider.set_translation(Vector3::new(pos[0], pos[1], pos[2]));
                                let collider_handler = collider_set.insert(collider);
                                
                            }

                            



                        } else {
                            println!("No mesh on node");
                        }
                    }
                } else {
                    let pos = node.transform().decomposed().0;
                    let scale = node.transform().decomposed().2;
                    let mut collider =
                        ColliderBuilder::cuboid(scale[0] / 2.0, scale[1] / 2.0, scale[2] / 2.0)
                            .build();
                    collider.set_translation(Vector3::new(pos[0], pos[1], pos[2]));
                    collider_set.insert(collider);
                }
                // child.

                // let json: gltf::json::Value = gltf::json::deserialize::from_str(extras).unwrap();
                // let m = node.
                // extras.
                // println!("Extras {:?}",extras);
                // if node.extras()["physics"] == "hull"{
                //     println!("Huuuuullll");
                // }
                // if (node.getExtras()['physics'] == 'hull') {

                // }
                println!(
                    "Node #{} has {} {} children",
                    node.index(),
                    node.children().count(),
                    name
                );
            }
        }
        Self {
            rigid_body_set,
            collider_set,
            dynamic_objects
        }
    }
}
