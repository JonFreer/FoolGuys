use websocket::OwnedMessage;
use websocket::receiver::Receiver;
use websocket::sync::Writer;
use std::net::TcpStream;
use std::sync::Arc;
use std::sync::RwLock;
use std::thread;
use serde_json::json;
use serde::{Deserialize, Serialize};
use serde_json::Result;
use std::sync::mpsc::channel;
use crate::player::Player;

pub struct Client{
    sender:Writer<TcpStream>,
    receiver_thread:std::sync::mpsc::Receiver<OwnedMessage>

}

#[derive(Serialize, Deserialize)]
struct Message{
    tag: String,
    data: serde_json::Value
}

impl Client{

    pub fn new(mut client:websocket::sync::Client<std::net::TcpStream>)->Self{
        println!("Created client");
        let ip = client.peer_addr().unwrap();
        let message = OwnedMessage::Text("Hello".to_string());

        let (sender_thread, receiver_thread) = channel();

        // client.send_message(&message).unwrap();

        let (mut receiver, mut sender) = client.split().unwrap();

        println!("Connection from {}", ip);


        thread::spawn(move ||{

            for message in receiver.incoming_messages() {
                let message = message.unwrap();

                sender_thread.send(message);
            }
        });


        println!("End of constructor");
       
        Self {sender,receiver_thread}
        // Self{}
    }

    pub fn send(&mut self,tag:&str, data:serde_json::Value){


        let message = OwnedMessage::Text(serde_json::to_string(&Message{tag:tag.to_string(),data:data}).unwrap());
        self.sender.send_message(&message).unwrap();
    }

    pub fn read_messages(&mut self){
        loop{
            if let Ok(message) = self.receiver_thread.try_recv(){
                      match message {
                    OwnedMessage::Close(_) => {
                        let message = OwnedMessage::Close(None);
                        self.sender.send_message(&message).unwrap();
                        println!("Client disconnected");
                        break; //TODO::THIS WAS RETURN
                    }
                    OwnedMessage::Ping(ping) => {
                        let message = OwnedMessage::Pong(ping);
                        self.sender.send_message(&message).unwrap();
                        // sender.send_message(&message).unwrap();
                    }
                    _ => self.sender.send_message(&message).unwrap(),
                }
        
            }else{
                break;
            }
        
        }
        

    }

}