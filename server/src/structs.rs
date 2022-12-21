use std::collections::HashMap;

use futures_channel::mpsc::UnboundedSender;
use nalgebra::{Quaternion, Vector3};
use serde::{Deserialize, Serialize};

use crate::dynamic::DynamicObject;

use futures_channel::mpsc::{unbounded, UnboundedReceiver};
use futures_util::{
    future, pin_mut,
    stream::{Collect, TryStreamExt},
    StreamExt,
};

use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::tungstenite;
use tungstenite::protocol::Message;

pub struct ChatMessage{
    name:String,
    msg:String
}

#[derive(Clone, Debug)]
#[derive(Serialize, Deserialize)]
pub enum MessageType{
    Join{name:String,id:String},
    Chat{name:String,message:String},
    WorldUpdate{players:HashMap<String,PlayerUpdate>,dynamic_objects:HashMap<String,PlayerUpdate>}
}

// #[derive(Serialize, Deserialize)]
// pub struct Join{
//     pub name:String,
//     pub id:String
// }

#[derive(Serialize, Deserialize)]
#[derive(Clone, Debug)]
pub struct PlayerUpdate{
    pub name:String,
    pub p:Vec3,
    pub q:Quat
}

#[derive(Clone, Debug)]
#[derive(Serialize, Deserialize)]
pub struct Vec3{
    pub x:f32,
    pub y:f32,
    pub z:f32
}

#[derive(Serialize, Deserialize)]
#[derive(Clone, Debug)]
pub struct Quat{
    pub i:f32,
   pub j:f32,
   pub  k:f32,
   pub w:f32
}

// #[derive(Serialize, Deserialize)]
// pub struct UpdateView {
//     pub viewVector: Vec3
// }

pub struct Client {
    pub tx: UnboundedSender<Message>,
    pub rx: UnboundedReceiver<Message>,
}