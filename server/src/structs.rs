use futures_channel::mpsc::UnboundedSender;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use ts_rs::TS;

use futures_channel::mpsc::UnboundedReceiver;
use tokio_tungstenite::tungstenite;
use tungstenite::protocol::Message;

use crate::{
    character_states::character_base::CharacterState,
    physics::{PhysicsState, PhysicsStateUpdate},
    physics_objects::ragdoll::Translation,
};

pub fn message_prep(msg: MessageType) -> Message {
    Message::Text(serde_json::to_string(&msg).unwrap())
}

#[ts(export)]
#[serde(tag = "kind")]
#[derive(Clone, Serialize, Deserialize, TS)]
pub enum MessageType {
    Join {
        name: String,
        id: String,
    },
    Chat {
        name: String,
        message: String,
    },
    WorldUpdate {
        players: HashMap<String, PlayerUpdate>,
        dynamic_objects: HashMap<String, ObjectUpdate>,
        vehicles: HashMap<String, VehicleUpdate>,
    },
    PhysicsState {
        data: PhysicsState,
    },
    NavMesh {
        data: oxidized_navigation::tiles::NavMeshTiles,
    },
    PhysicsUpdate {
        data: PhysicsStateUpdate,
    },
}

#[ts(export)]
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct PlayerUpdate {
    pub name: String,
    pub p: Vec3,
    pub q: Quat,
    pub colour: Colour,
    pub state: CharacterState,
    pub dir: Vec3,
    pub is_ragdoll: bool,
    pub ragdoll_info: HashMap<String, Translation>,
    pub camera_distance: f32,
    pub vehicle: Option<String>,
}

#[ts(export)]
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct ObjectUpdate {
    pub name: String,
    pub p: Vec3,
    pub q: Quat,
    pub asset_name: String,
    pub scale: Vec3,
}

#[ts(export)]
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct VehicleUpdate {
    pub name: String,
    pub p: Vec3,
    pub q: Quat,
    pub asset_name: String,
}

#[ts(export)]
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct Vec3 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

#[ts(export)]
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct Quat {
    pub i: f32,
    pub j: f32,
    pub k: f32,
    pub w: f32,
}

#[ts(export)]
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct Colour {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}

pub struct Client {
    pub tx: UnboundedSender<Message>,
    pub rx: UnboundedReceiver<Message>,
}

#[derive(Clone, Debug)]
pub struct KeyBinding {
    // pub eventCodes: String,
    pub isPressed: bool,
    pub justPressed: bool,
    pub justReleased: bool,
}

impl KeyBinding {
    pub fn new(value: &Value) -> KeyBinding {
        Self {
            isPressed: value["isPressed"].as_bool().unwrap(),
            justPressed: value["isPressed"].as_bool().unwrap(),
            justReleased: value["isPressed"].as_bool().unwrap(),
        }
    }

    pub fn default() -> KeyBinding {
        Self {
            isPressed: false,
            justPressed: false,
            justReleased: false,
        }
    }
}

impl Default for KeyBinding {
    fn default() -> Self {
        Self {
            isPressed: false,
            justPressed: false,
            justReleased: false,
        }
    }
}

pub struct BlimpControls {
    pub up: KeyBinding,
    pub down: KeyBinding,
    pub enter_passenger: KeyBinding
}

impl BlimpControls {
    pub fn new() -> Self {
        Self {
            up: KeyBinding::default(),
            down: KeyBinding::default(),
            enter_passenger: KeyBinding::default()
        }
    }
}

#[derive(Clone)]
pub struct CharacterControls {
    pub enter_passenger: KeyBinding,
}

impl CharacterControls {
    pub fn new() -> Self {
        Self {
            enter_passenger: KeyBinding::default()
        }
    }
}

#[derive(Clone)]
pub struct GeneralActions {
    pub enter_passenger: KeyBinding,
}

impl GeneralActions {
    pub fn new() -> Self {
        Self {
            enter_passenger: KeyBinding::default()
        }
    }
}
