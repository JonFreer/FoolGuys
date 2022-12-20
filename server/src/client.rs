use crate::player::Player;
use crate::structs::MessageType;
use serde::{Deserialize, Serialize};
use std::net::TcpStream;
use std::sync::mpsc::{channel, Sender};
use std::thread;
use websocket::sync::Writer;
use websocket::OwnedMessage;

pub struct Client {
    pub sender_thread: std::sync::mpsc::Sender<OwnedMessage>,
    pub receiver_thread: std::sync::mpsc::Receiver<OwnedMessage>,
    pub id: String,
}

#[derive(Serialize, Deserialize)]
struct Message {
    tag: String,
    data: serde_json::Value,
}

impl Client {
    pub fn new(mut client: websocket::sync::Client<std::net::TcpStream>) -> Self {
        println!("Created client");
        let ip = client.peer_addr().unwrap();
        // let message = OwnedMessage::Text("Hello".to_string());

        let (sender_thread, receiver_thread) = channel();
        let (tx, rx) = channel();

        // client.send_message(&message).unwrap();

        let (mut receiver, mut sender) = client.split().unwrap();

        println!("Connection from {}", ip.to_string());

        thread::spawn(move || {
            loop {
                if let Ok(message) = rx.try_recv() {
                    sender.send_message(&message);
                }
            }
            // for let Ok(message) in rx.recv(){
            //     sender.send_message(&message);
            // }
        });

        thread::spawn(move || {
            for message in receiver.incoming_messages() {
                // let message = message.unwrap();
                // sender_thread.send(message);
                match message {
                    Ok(m) => {
                        sender_thread.send(m);
                    }
                    Err(e) => {

                        // println!("{}",e.to_string());
                    }
                };
            }
        });

        println!("End of constructor");

        Self {
            sender_thread: tx,
            receiver_thread,
            id: ip.to_string(),
        }
        // Self{}
    }

    pub fn send(&mut self, msg: MessageType) {
        // let message = OwnedMessage::Text(serde_json::to_string(&Message{tag:tag.to_string(),data:data}).unwrap());
        let message = OwnedMessage::Text(serde_json::to_string(&msg).unwrap());
        let res = self.sender_thread.send(message);
        // let res = self.sender.send_message(&message); //TODO::ERROR CHECK HERE
    }

    pub fn read_messages(&mut self, player: &&mut Player) {
        // player.name= "jim".to_string();
        loop {
            if let Ok(message) = self.receiver_thread.try_recv() {
                match message {
                    OwnedMessage::Close(_) => {
                        let message = OwnedMessage::Close(None);
                        self.sender_thread.send(message);
                        // self.sender.send_message(&message).unwrap();
                        println!("Client disconnected");
                        break; //TODO::THIS WAS RETURN
                    }
                    OwnedMessage::Ping(ping) => {
                        let message = OwnedMessage::Pong(ping);
                        self.sender_thread.send(message);
                        // self.sender.send_message(&message).unwrap();
                        // sender.send_message(&message).unwrap();
                    }
                    OwnedMessage::Text(msg) => {
                        // self.handleMessage(msg,player);
                    }
                    _ => {
                        self.sender_thread.send(message);
                    } //self.sender.send_message(&message).unwrap(),
                }
            } else {
                break;
            }
        }
    }

    // fn handleMessage(&self, msg :String,player: &&mut Player){
    //     let v: Value = serde_json::from_str(&msg).unwrap();

    //     println!("{} {}",msg, v[0]);

    //     if(v[0] == "name"){

    //     }
    // }
}
