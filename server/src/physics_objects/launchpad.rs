use std::{net::SocketAddr, collections::HashMap};

use gltf::Node;
use nalgebra::{Quaternion, UnitQuaternion, Vector3};
use rapier3d::prelude::{Collider, ColliderSet, RigidBodyBuilder, RigidBodySet};

use crate::{
    animation::{Animations, NodesKeyFrame, PlaybackMode},
    structs::ObjectUpdate, player::Player, physics::Physics,
};

use super::rigid_body_parent::RigidBodyData;

// use super::rigid_body_parent::RigidBodyData;

pub struct LaunchPad {
    pub object: RigidBodyData,
    animations: Animations,
    launch_dir: Vector3<f32>
}

impl LaunchPad {
    pub fn new(
        gltf_animation: gltf::iter::Animations,
        node: &Node,
        rigid_body_set: &mut RigidBodySet,
        mut collider: Collider,
        collider_set: &mut ColliderSet,
        buffers: &Vec<gltf::buffer::Data>,
        launch_vec: String
    ) -> Self {

        //Extract vecotr from string
        let mut v = launch_vec.split_at(1).1;
        v = v.split_at(v.len()-1).0;
        let v2 = v.replace(&[ '\\'][..], "");
        let v3= v2.as_str();
        let v3 =["{",v3, "}"].join("");

        let json:gltf::json::Value =
        gltf::json::deserialize::from_str(&v3).unwrap();

        let launch_dir = Vector3::new(json["x"].as_f64().unwrap() as f32,json["y"].as_f64().unwrap() as f32,json["z"].as_f64().unwrap() as f32);
        
        println!("Vector {:?} ",launch_dir);
        let mut animations =
            Animations::new(gltf_animation, node.name().unwrap().to_string(), buffers);

        let rot = node.transform().decomposed().1;
        let pos = node.transform().decomposed().0;

        let rotation =
            UnitQuaternion::from_quaternion(Quaternion::new(rot[3], rot[0], rot[1], rot[2]));

        let mut platform_body = RigidBodyBuilder::kinematic_position_based().build();

        platform_body.set_translation(Vector3::new(pos[0], pos[1], pos[2]), true);

        collider.set_translation(Vector3::new(0.0, 0.0, 0.0));
        collider.set_mass(0.0);

        let rigid_body_handle = rigid_body_set.insert(platform_body);
        let collider_handle =
            collider_set.insert_with_parent(collider, rigid_body_handle, rigid_body_set);

        let object = RigidBodyData::new(
            node.name().unwrap().to_string(),
            rigid_body_handle,
            collider_handle,
            rotation,
            "todo".to_string()
        );

        // animations.playback_state.
        animations.set_playback_mode(PlaybackMode::Once);
        animations.set_current(0);

        Self { object, animations, launch_dir:launch_dir }
    }

    pub fn get_info(&mut self, rigid_body_set: &mut RigidBodySet ) -> ObjectUpdate {
        self.object.get_info(rigid_body_set)
    }

    pub fn update(
        &mut self,
        players: &mut HashMap<SocketAddr, Player>,
        physics_enigne: &mut Physics
        
    ) {

        // let mut collisions = Vec::new();
        let  mut launched = false;
        for c in physics_enigne.collision_vec.clone().iter(){

            let mut handle= None;

            if c.collider1() == self.object.collider_handle{
                handle = Some(c.collider2());
            }else if c.collider2() == self.object.collider_handle{
                handle = Some(c.collider1());
            }

            if let Some(handle) = handle{
                for player in players.iter_mut(){
                    if player.1.collider_handle == handle{
                        //player 
                        player.1.launch(physics_enigne,self.launch_dir);
                        launched = true;
                    }
                }
            }
        }

        if launched == true && self.animations.get_playback_state().paused {
            self.animations.start();
        }
        // for player in players.iter_mut(){
        //     if player.1.collider_handle == 
        // }

        // let players =
        // let p = players.iter().filter(|p|);
        // for player in players.iter_mut(){
        //     // player
        // }
        // let c2 = collisions.map(|x| players.map())

        let NodesKeyFrame(translation, rotation, scale) = self.animations.update(physics_enigne.get_time_step());

        match translation {
            Some(translation) => {
                physics_enigne.get_rigid_body(self.object.rigid_body_handle).set_translation(translation, true)
            }
            None => {}
        }

        match rotation {
            Some(rotation) => physics_enigne.get_rigid_body(self.object.rigid_body_handle)
                .set_rotation(UnitQuaternion::from_quaternion(rotation), true),
            None => {}
        }
        // TODO::SET SCALE
        // match scale{
        //     // Some(scale) => rigid_body_set[self.object.rigid_body_handle].set_s(scale, true),
        //     None => {},
        // }
        // println!("Update {:?}",self.animations.update(delta_time));
    }
}
