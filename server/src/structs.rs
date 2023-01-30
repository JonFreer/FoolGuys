use std::collections::HashMap;
use ts_rs::TS;
use futures_channel::mpsc::UnboundedSender;
use serde::{Deserialize, Serialize};

use futures_channel::mpsc::UnboundedReceiver;
// use futures_util::stream;
// use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::tungstenite;
use tungstenite::protocol::Message;

use crate::{character_states::character_base::CharacterState, physics::PhysicsState};

pub fn message_prep(msg: MessageType) -> Message {
    Message::Text(serde_json::to_string(&msg).unwrap())
}


#[ts(export)]
#[serde(tag = "kind")]
#[derive(Clone)]
#[derive(Serialize, Deserialize,TS)]
pub enum MessageType{
    Join{name:String,id:String},
    Chat{name:String,message:String},
    WorldUpdate{players:HashMap<String,PlayerUpdate>,dynamic_objects:HashMap<String,ObjectUpdate>},
    PhysicsUpdate{data: PhysicsState}
}

#[ts(export)]
#[derive(Clone, Debug)]
#[derive(Serialize, Deserialize,TS)]
pub struct PlayerUpdate{
    pub name:String,
    pub p:Vec3,
    pub q:Quat,
    pub colour:Colour,
    pub state: CharacterState,
    pub dir: Vec3
}

#[ts(export)]
#[derive(Clone, Debug)]
#[derive(Serialize, Deserialize,TS)]
pub struct ObjectUpdate{
    pub name:String,
    pub p:Vec3,
    pub q:Quat,
    pub asset_name: String,
    pub scale:Vec3
}


#[ts(export)]
#[derive(Clone, Debug)]
#[derive(Serialize, Deserialize,TS)]
pub struct Vec3{
    pub x:f32,
    pub y:f32,
    pub z:f32
}

#[ts(export)]
#[derive(Clone, Debug)]
#[derive(Serialize, Deserialize,TS)]
pub struct Quat{
    pub i:f32,
   pub j:f32,
   pub  k:f32,
   pub w:f32
}

#[ts(export)]
#[derive(Clone, Debug)]
#[derive(Serialize, Deserialize,TS)]
pub struct Colour{
    pub r:u8,
    pub g:u8,
    pub b:u8
}

pub struct Client {
    pub tx: UnboundedSender<Message>,
    pub rx: UnboundedReceiver<Message>,
}