use std::{collections::HashMap, net::SocketAddr};

use nalgebra::{Vector2, Vector3};
use rapier3d::prelude::{InteractionGroups, Point, QueryFilter, Ray};
use serde_json::{Error, Value};

use crate::{
    character::Character,
    physics::Physics,
    physics_objects::ragdoll::RagdollTemplate,
    structs::{self, message_prep, Client, GeneralActions, KeyBinding, PlayerUpdate},
    vehicles::blimp::Blimp,
    world::World, nav_mesh::{self, nav_mesh::NavMesh},
};

#[derive(Clone)]
pub struct Player {
    pub id: SocketAddr,
    pub name: String,
    pub view_vector: Vector3<f32>,
    pub client_move_vec: Vector2<f32>,
    pub speed: f32,
    pub key_map: HashMap<String, bool>,
    pub camera_distance: f32,
    pub chat_queue: Vec<String>,
    pub character: Character,
    pub vehicle: Option<String>,
    pub actions: GeneralActions,
}

impl Player {
    pub fn new(
        num_players: usize,
        spawn_points: &Vec<Vector3<f32>>,
        id: SocketAddr,
        physics_engine: &mut Physics,
        ragdoll_template: RagdollTemplate,
    ) -> Self {
        let name = "Guest".to_string() + &num_players.to_string();

        let character = Character::new(spawn_points, physics_engine, ragdoll_template);

        Self {
            id,
            name,
            view_vector: Vector3::new(0.0, 0.0, 0.0),
            client_move_vec: Vector2::new(0.0, 0.0),
            speed: 0.1,
            key_map: HashMap::new(),
            camera_distance: 4.0,
            chat_queue: Vec::new(),
            character,
            vehicle: None, //Some("Blimp".to_owned()),
            actions: GeneralActions::new(),
        }
    }

    pub fn remove_self(&mut self, physics_engine: &mut Physics) {
        self.character.remove_self(physics_engine);
    }

    pub fn read_messages(
        &mut self,
        c: &mut Client,
        physics_engine: &mut Physics,
        vehicles: &mut HashMap<String, Blimp>,
        nav_mesh: &Option<NavMesh>
    ) {
        loop {
            if let Ok(message) = c.rx.try_next() {
                let m = message.unwrap();
                // println!("{}", m.to_string());

                let msg_content: Result<Value, Error> = serde_json::from_str(&m.to_string()); //.unwrap();
                if let Ok(v) = msg_content {
                    // println!("{} {}", msg, v[0]);
                    match &self.vehicle {
                        Some(vehicle_name) => {
                            // let vehicle = vehicles.get(_vehicle)
                            let mut vehicle = vehicles.get_mut(vehicle_name).unwrap();
                            if vehicle.update_messages(physics_engine, &v) {
                                self.vehicle = None;
                                vehicle.controls.enter_passenger.justPressed = false;
                                self.character.exit_vehicle(physics_engine, vehicle);
                            }
                        }
                        None => {
                            if self.character.update_messages(physics_engine, &v) {
                                //check if we can enter the vehicle
                                self.character.actions.enter_passenger.justPressed = false;
                                if let Some(vehicle) =
                                    self.character.check_enter_vehicle(physics_engine, vehicles)
                                {
                                    self.vehicle = Some(vehicle);
                                }
                            }
                        }
                    }

                    if v[0] == "name" {
                        self.name = v[1].to_string();
                    }

                    if v[0] == "chat" {
                        self.chat_queue.push(v[1].to_string());
                    }

                    if v[0] == "update_view" {
                        let vec = v[1]["viewVector"].clone();
                        self.view_vector = Vector3::new(
                            vec["x"].as_f64().unwrap() as f32,
                            vec["y"].as_f64().unwrap() as f32,
                            vec["z"].as_f64().unwrap() as f32,
                        );
                    }

                    if v[0] == "update" {
                        let vec = v[1]["viewVector"].clone();
                        self.view_vector = Vector3::new(
                            vec["x"].as_f64().unwrap() as f32,
                            vec["y"].as_f64().unwrap() as f32,
                            vec["z"].as_f64().unwrap() as f32,
                        );

                        let key_map = v[1]["keyMap"].clone();
                        self.key_map = HashMap::new();

                        for (key, value) in key_map.as_object().unwrap() {
                            self.key_map
                                .insert(key.to_string(), value.as_bool().unwrap());
                        }
                    }

                    if v[0] == "get_debug" {
                        c.tx.unbounded_send(message_prep(structs::MessageType::PhysicsState {
                            data: physics_engine.get_state(),
                        }))
                        .unwrap();
                    }

                    if v[0] == "get_nav_mesh" {
                        println!("Sending Nav Mesh 1 ");
                        if let Some(nav_mesh) = nav_mesh{
                            println!("Sending Nav Mesh 2");
                            if let Some(nav_mesh_state) = nav_mesh.get_state(){
                                println!("Sending Nav Mesh 3");
                                c.tx.unbounded_send(message_prep(structs::MessageType::NavMesh {
                                    data: nav_mesh_state,
                                }))
                                .unwrap();
                            }
                        }
                   
                    }
                } else {
                    println!("Erorr unwrapping message");
                }
            } else {
                break;
            }
        }

        self.character.on_input_change();
    }

    pub fn update_physics(
        &mut self,
        world: &mut World,
        physics_engine: &mut Physics,
        players: &HashMap<SocketAddr, Player>,
    ) {
        match &self.vehicle {
            Some(_vehicle) => {
                // self.vehicle = None;
            }
            None => {
                self.character.update_physics(
                    world,
                    physics_engine,
                    players,
                    self.view_vector,
                    self.speed,
                );
            }
        }

        self.perform_camera_ray_cast(physics_engine);
    }

    pub fn get_info(&mut self, physics_engine: &mut Physics) -> PlayerUpdate {
        let mut update =
            self.character
                .get_info(physics_engine, self.name.clone(), self.camera_distance);
        update.vehicle = self.vehicle.clone();
        update
    }

    pub fn perform_camera_ray_cast(&mut self, physics_engine: &mut Physics) {
        let mut max_toi = 4.0;
        let solid = false;

        //first check for collision
        let filter = QueryFilter::default().exclude_rigid_body(self.character.rigid_body_handle);
        let origin = Point::from(self.character.get_translation(physics_engine))
            + Vector3::new(0.0, -0.3, 0.0);

        let group = InteractionGroups::new(0b0010.into(), 0b0010.into());

        let floor_filter = QueryFilter::new()
            .groups(group)
            .exclude_rigid_body(self.character.rigid_body_handle);

        let ray = Ray::new(origin, -self.view_vector);

        if let Some((_handle, toi)) = physics_engine.cast_ray(&ray, max_toi, solid, floor_filter) {
            max_toi = toi;
        }

        let point = origin + self.view_vector * -max_toi;

        if !physics_engine.intersections_with_point(&point, filter) {
            self.camera_distance = max_toi;
        } else {
            let ray = Ray::new(origin, -self.view_vector);

            if let Some((_handle, toi)) = physics_engine.cast_ray(&ray, max_toi, solid, filter) {
                self.camera_distance = toi;
            } else {
                self.camera_distance = max_toi;
            }
        }
    }
}
