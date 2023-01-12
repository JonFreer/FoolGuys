use std::collections::HashMap;
use std::f32::consts::E;
use std::thread::spawn;

use gltf::{Document, Node};
use nalgebra::{Quaternion, Unit, UnitQuaternion, Vector2, Vector3};
use rapier3d::prelude::{ColliderSet, RigidBodySet};
use serde_json::Value;

use crate::physics_objects::asset::AssetBase;
use crate::physics_objects::collision;
use crate::physics_objects::dynamic::DynamicObject;
use crate::physics_objects::launchpad::LaunchPad;
use crate::physics_objects::pivot::PivotObject;
use crate::physics_objects::rigid_body_parent::Objects;
use crate::physics_objects::spin::SpinObject;

pub struct World {
    pub rigid_body_set: RigidBodySet,
    pub collider_set: ColliderSet,
    pub dynamic_objects: Vec<Objects>,
    pub spawn_points: Vec<Vector3<f32>>,
    assets: HashMap<String, AssetBase>,
    asset_path: String,
}

impl World {
    pub fn new(asset_path: &str) -> Self {
        let mut assets = HashMap::new();
        let mut rigid_body_set = RigidBodySet::new();
        let mut collider_set = ColliderSet::new();
        let mut dynamic_objects = Vec::new();

        println!("Created world");

        Self {
            rigid_body_set,
            collider_set,
            dynamic_objects,
            spawn_points: Vec::new(),
            assets,
            asset_path: asset_path.to_string(),
        }
    }

    pub fn load_world(&mut self, path: &str) {
        let (gltf, buffers, _) = gltf::import(path).unwrap();
        for scene in gltf.scenes() {
            for node in scene.nodes() {
                self.create_object(&node, &buffers, &gltf);
            }
        }

        self.load_spawn_points(&gltf);
    }

    pub fn add_dynamic_asset(
        &mut self,
        name: String,
        asset_name: String,
        scale: Vector3<f32>,
        translation: Vector3<f32>,
        roation: Unit<Quaternion<f32>>,
        recreate:bool //if this asset exists should it be recreated or a new one added
    ) { 

        if(recreate){

        }

        if !self.assets.contains_key(&asset_name) {
            let format = format!("{}{}{}", self.asset_path, asset_name, ".glb").replace('"', "");
            println!("Loading Asset {}", format);
            let asset = AssetBase::new(format);
            self.assets.insert(asset_name.clone(), asset);
        }

        let asset = self.assets.get(&asset_name).unwrap();

        let obj = DynamicObject::new(
            name + self.dynamic_objects.len().to_string().as_str(),
            &mut self.rigid_body_set,
            asset.get_collider(scale),
            &mut self.collider_set,
            asset_name,
            scale,
            roation,
            translation,
        );

        self.dynamic_objects.push(Objects::Dynamic(obj));
    }

    pub fn create_object(
        &mut self,
        node: &Node,
        buffers: &Vec<gltf::buffer::Data>,
        gltf: &Document,
    ) {
        if let Some(_) = node.mesh() {
            let collider_option = collision::new_collider(node, &buffers);
            if let Some(collider) = collider_option {
                let extras = node.extras().as_ref();
                if let Some(extras) = extras {
                    let extras: gltf::json::Value =
                        gltf::json::deserialize::from_str(extras.get()).unwrap();
                    println!("Launch {:?}", extras["launchpad"]);
                    if extras["dynamic"] != Value::Null {
                        let mut asset_name = "default".to_string();
                        if extras["asset"] != Value::Null {
                            asset_name = extras["asset"].to_string();
                        }

                        let pos = node.transform().decomposed().0;
                        let rot = node.transform().decomposed().1;

                        println!("dynamic object");
                        let obj = DynamicObject::new(
                            node.name().unwrap().to_string(),
                            &mut self.rigid_body_set,
                            collider,
                            &mut self.collider_set,
                            asset_name,
                            Vector3::new(1.0, 1.0, 1.0),
                            UnitQuaternion::from_quaternion(Quaternion::new(
                                rot[3], rot[0], rot[1], rot[2],
                            )),
                            Vector3::new(pos[0], pos[1], pos[2]),
                        );

                        self.dynamic_objects.push(Objects::Dynamic(obj));
                    } else if extras["spin"] != Value::Null {
                        let obj = SpinObject::new(
                            extras["spin"].to_string(),
                            &node,
                            &mut self.rigid_body_set,
                            collider,
                            &mut self.collider_set,
                        );
                        self.dynamic_objects.push(Objects::Spin(obj));
                    } else if extras["pivot"] != Value::Null {
                        let obj = PivotObject::new(
                            extras["pivot"].to_string(),
                            &node,
                            &mut self.rigid_body_set,
                            collider,
                            &mut self.collider_set,
                        );
                        self.dynamic_objects.push(Objects::Pivot(obj));
                    } else if extras["launchpad"] != Value::Null {
                        println!("Creating launchpad {:?}", extras["launchpad"]);
                        let obj = LaunchPad::new(
                            gltf.animations(),
                            &node,
                            &mut self.rigid_body_set,
                            collider,
                            &mut self.collider_set,
                            &buffers,
                            extras["launchpad"].to_string(),
                        );
                        self.dynamic_objects.push(Objects::LaunchPad(obj));
                    } else {
                        self.collider_set.insert(collider);
                    }
                } else {
                    self.collider_set.insert(collider);
                }
            }

            for child in node.children() {
                self.create_object(&child, buffers, gltf);
            }
        } else {
            //if item is an asset empty
            let extras = node.extras().as_ref();
            if let Some(extras) = extras {
                let extras: gltf::json::Value =
                    gltf::json::deserialize::from_str(extras.get()).unwrap();
                if extras["asset"] != Value::Null {
                    let s = node.transform().decomposed().2;
                    let pos = node.transform().decomposed().0;
                    let rot = node.transform().decomposed().1;

                    self.add_dynamic_asset(
                        node.name().unwrap().to_string(),
                        extras["asset"].to_string(),
                        Vector3::new(s[0], s[1], s[2]),
                        Vector3::new(pos[0], pos[1], pos[2]),
                        UnitQuaternion::from_quaternion(Quaternion::new(
                            rot[3], rot[0], rot[1], rot[2],
                        )),
                        false
                    );
                    // let name = extras["asset"].to_string();
                    // //check if asset is loaded, if not load the asset
                    // if !assets.contains_key(&name) {
                    //     let format = format!("{}{}{}", asset_path, name, ".glb").replace('"', "");
                    //     println!("Loading Asset {}", format);
                    //     let asset = AssetBase::new(format);
                    //     assets.insert(name.clone(), asset);
                    // }

                    // let mut asset = assets.get(&name).unwrap();

                    // let s = node.transform().decomposed().2;
                    // let scale = Vector3::new(s[0], s[1], s[2]);

                    // let obj = DynamicObject::new(
                    //     &node,
                    //     rigid_body_set,
                    //     asset.get_collider(scale),
                    //     collider_set,
                    //     name,
                    //     scale,
                    // );

                    // dynamic_objects.push(Objects::Dynamic(obj));
                }
            }
        }
    }

    fn load_spawn_points(&mut self, gltf: &Document) {
        let mut spawn_points = Vec::new();
        for scene in gltf.scenes() {
            for node in scene.nodes() {
                if let Some(extras) = node.extras() {
                    println!("{:?}", extras.get());
                    let extras: gltf::json::Value =
                        gltf::json::deserialize::from_str(extras.get()).unwrap();
                    if extras["spawn_point"] != Value::Null {
                        let translation = node.transform().decomposed().0;
                        spawn_points.push(Vector3::new(translation[0], translation[1], translation[2]));
                    }
                }
            }
        }
        self.spawn_points = spawn_points;
    }
    
}

