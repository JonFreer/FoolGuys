use serde_json::json;
use serde::{Deserialize, Serialize};
use serde_json::Result;

use crate::client::Client;


#[derive(Serialize, Deserialize)]
struct Join{
    name:String
}

pub struct Player {
    pub name: String,
    pub client: Client,
    canJump: bool,
}

impl Player {
    pub fn new(mut client: Client, num_players:usize) -> Self {


        let name = "Guest".to_string()+&num_players.to_string();

        let data = json!(&Join{name:name.clone()});
        client.send("join",data);

        // client.send(serde_json::to_string(Join{name:name.clone()}).unwrap());

        Self {
            name,
            client,
            canJump: true,
        }
    }
}

