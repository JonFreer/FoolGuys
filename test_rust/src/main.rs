use std::{
    collections::HashMap,
    env,
    io::Error as IoError,
    net::SocketAddr,
    sync::{Arc, Mutex},
    thread, process::Command,
};

use futures_channel::mpsc::{unbounded, UnboundedReceiver, UnboundedSender};
use futures_util::{
    future, pin_mut,
    stream::{Collect, TryStreamExt},
    StreamExt,
};

use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::tungstenite;
use tungstenite::protocol::Message;

type Tx = UnboundedSender<Message>;
type PeerMap = Arc<Mutex<HashMap<SocketAddr, Client>>>;

pub struct Client {
    pub tx: UnboundedSender<Message>,
    pub rx: UnboundedReceiver<Message>,
}

async fn handle_connection(peer_map: PeerMap, raw_stream: TcpStream, addr: SocketAddr) {
    println!("Incoming TCP connection from: {}", addr);

    let ws_stream = tokio_tungstenite::accept_async(raw_stream)
        .await
        .expect("Error during the websocket handshake occurred");
    println!("WebSocket connection established: {}", addr);

    // Insert the write part of this peer to the peer map.
    let (tx, rx) = unbounded();
    let (tx_receive, rx_receive) = unbounded();

    peer_map.lock().unwrap().insert(
        addr,
        Client {
            tx: tx,
            rx: rx_receive,
        },
    );

    let (outgoing, incoming) = ws_stream.split();

    let broadcast_incoming = incoming.try_for_each(|msg| {
        println!(
            "Received a message from {}: {}",
            addr,
            msg.to_text().unwrap()
        );
        // let peers = peer_map.lock().unwrap();

        // // We want to broadcast the message to everyone except ourselves.
        // let broadcast_recipients = peers
        //     .iter()
        //     .filter(|(peer_addr, _)| peer_addr != &&addr)
        //     .map(|(_, ws_sink)| ws_sink);

        tx_receive.unbounded_send(msg.clone()).unwrap();
        // for recp in broadcast_recipients {
        //     recp.unbounded_send(msg.clone()).unwrap();
        // }

        future::ok(())
    });

    println!("aahhh"); //input nto tx to send a message {}

    let receive_from_others = rx.map(Ok).forward(outgoing);

    pin_mut!(broadcast_incoming, receive_from_others);
    future::select(broadcast_incoming, receive_from_others).await;

    println!("{} disconnected", &addr);
    peer_map.lock().unwrap().remove(&addr);
}

async fn sokcer_handler(peer_map: PeerMap, listener: TcpListener) {
    while let Ok((stream, addr)) = listener.accept().await {
        // println!("connection")
        tokio::spawn(handle_connection(peer_map.clone(), stream, addr));
    }
}

#[tokio::main]
async fn main() -> Result<(), IoError> {
    let addr = env::args()
        .nth(1)
        .unwrap_or_else(|| "127.0.0.1:8080".to_string());

    let mut state = PeerMap::new(Mutex::new(HashMap::new()));

    // Create the event loop and TCP listener we'll accept connections on.
    let try_socket = TcpListener::bind(&addr).await;
    let listener = try_socket.expect("Failed to bind");
    println!("Listening on: {}", addr);
    // sokcer_handler(state.clone(),listener).await;
    tokio::spawn(sokcer_handler(state.clone(), listener));

    loop {
        // println!("Hii");
        // let mut broadcast_recipients;
        let mut broadcast_recipients: Vec<&SocketAddr>;
        // {

        let mut addresses = Vec::new();

        let mut peers = state.lock().unwrap();
        for (key, value) in &*peers {
            addresses.push(key.clone());
        }

        for addr in addresses {
            let p =peers.get_mut(&addr).unwrap();
            loop {
                
                if let Ok(message) = p.rx.try_next() {
                    let m = message.unwrap();
                    println!("{}", m.to_string());
                    p.tx.unbounded_send(m);
                } else {
                    break;
                }
            }

            p.tx.unbounded_send(Message::Text("hiiiiiiiiiiii".to_string()));
       
        }
        // let mut child = Command::new("sleep").arg("0.02").spawn().unwrap();
        // let _result = child.wait().unwrap();
    }

    Ok(())
}

fn sayHi() {
    println!("Hiiiiii");
}
