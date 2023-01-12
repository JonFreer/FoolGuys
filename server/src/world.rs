use std::collections::HashMap;
use std::f32::consts::E;
use std::thread::spawn;

use gltf::{Document, Node};
use nalgebra::{Vector2, Vector3};
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
    pub fn new(path: &str, asset_path: &str) -> Self {
        let mut assets = HashMap::new();
        let mut rigid_body_set = RigidBodySet::new();
        let mut collider_set = ColliderSet::new();
        let mut dynamic_objects = Vec::new();

        println!("Created world");

        let (gltf, buffers, _) = gltf::import(path).unwrap();
        for scene in gltf.scenes() {
            for node in scene.nodes() {
                create_object(
                    &node,
                    &buffers,
                    &mut dynamic_objects,
                    &mut rigid_body_set,
                    &mut collider_set,
                    &gltf,
                    &mut assets,
                    asset_path,
                );
            }
        }

        Self {
            rigid_body_set,
            collider_set,
            dynamic_objects,
            spawn_points: load_spawn_points(&gltf),
            assets,
            asset_path: asset_path.to_string(),
        }
    }
}

pub fn load_spawn_points(gltf: &Document) -> Vec<Vector3<f32>> {
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
    spawn_points
}

pub fn create_object(
    node: &Node,
    buffers: &Vec<gltf::buffer::Data>,
    dynamic_objects: &mut Vec<Objects>,
    rigid_body_set: &mut RigidBodySet,
    collider_set: &mut ColliderSet,
    gltf: &Document,
    assets: &mut HashMap<String, AssetBase>,
    asset_path: &str,
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

                    println!("dynamic object");
                    let obj = DynamicObject::new(
                        &node,
                        rigid_body_set,
                        collider,
                        collider_set,
                        asset_name,
                        Vector3::new(1.0,1.0,1.0)
                    );
                    dynamic_objects.push(Objects::Dynamic(obj));
                } else if extras["spin"] != Value::Null {
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
                    println!("Creating launchpad {:?}", extras["launchpad"]);
                    let obj = LaunchPad::new(
                        gltf.animations(),
                        &node,
                        rigid_body_set,
                        collider,
                        collider_set,
                        &buffers,
                        extras["launchpad"].to_string(),
                    );
                    dynamic_objects.push(Objects::LaunchPad(obj));
                } else {
                    collider_set.insert(collider);
                }
            } else {
                collider_set.insert(collider);
            }
        }

        for child in node.children() {
            create_object(
                &child,
                buffers,
                dynamic_objects,
                rigid_body_set,
                collider_set,
                gltf,
                assets,
                asset_path
            );
        }
    } else {
        //if item is an asset empty
        let extras = node.extras().as_ref();
        if let Some(extras) = extras {
            let extras: gltf::json::Value =
                gltf::json::deserialize::from_str(extras.get()).unwrap();
            if extras["asset"] != Value::Null {
                let name = extras["asset"].to_string();
                //check if asset is loaded, if not load the asset
                if !assets.contains_key(&name) {
                    let format = format!("{}{}{}", asset_path, name, ".glb").replace('"', "");
                    println!("Loading Asset {}", format);
                    let asset = AssetBase::new(format);
                    assets.insert(name.clone(), asset);
                }

                let mut asset = assets.get(&name).unwrap();

                let s = node.transform().decomposed().2;
                let scale = Vector3::new(s[0],s[1],s[2]);

                let obj = DynamicObject::new(
                    &node,
                    rigid_body_set,
                    asset.get_collider(scale),
                    collider_set,
                    name,
                    scale
                );

                dynamic_objects.push(Objects::Dynamic(obj));
            }
        }
    }
}
