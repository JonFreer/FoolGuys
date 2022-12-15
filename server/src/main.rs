extern crate websocket;

use std::thread;
use websocket::sync::Server;
use websocket::OwnedMessage;
mod client;
mod player;
use std::sync::Arc;
use std::sync::RwLock;

use crate::player::Player;
fn main() {
    let mut server = Server::bind("127.0.0.1:2794").unwrap();
    server.set_nonblocking(true);

    // let mut players: Arc<RwLock<Vec<Player>>> = Arc::new(RwLock::new(Vec::new()));
    let mut players: Vec<Player> = Vec::new();
    // let clients_c = clients.clone();

    // println!("{}", clients.read().unwrap().len());
    // thread::spawn(move ||{
    // for request in server.filter_map(Result::ok) {

    //     if !request.protocols().contains(&"rust-websocket".to_string()) {
    //         request.reject().unwrap();
    //         return;
    //     }

    //     let mut client = request.use_protocol("rust-websocket").accept().unwrap();

    //     let mut client2 = client::Client::new(client);

    //         println!("creating client");

    //     clients_c.write().unwrap().push(client2);
    // }
    // });

    println!("HIIII");
    loop {
        let result = match server.accept() {
            Ok(wsupgrade) => {
                if !wsupgrade.protocols().contains(&"rust-websocket".to_string()) {
                    wsupgrade.reject().unwrap();
                    return;
                }

                let mut client = wsupgrade.use_protocol("rust-websocket").accept().unwrap();

                let mut client2 = client::Client::new(client);

                println!("creating client");

                
                let mut player = Player::new(client2,players.len());
                // players.write().unwrap().push(player);
                players.push(player);
            }
            _ => {
                // Nobody tried to connect, move on.
            }
        };

        // let mut players_unlocked = players.write().unwrap();

        for player in players.iter_mut(){
            player.client.read_messages();
            println!("{}",player.name);
        }
        
    }
}
