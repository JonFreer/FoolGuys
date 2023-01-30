import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { World } from './World/World'
import { Vector2 } from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { GUI } from 'dat.gui'
import {MessageType} from 'backend'

const gltfLoader = new GLTFLoader()
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('three/examples/jsm/libs/draco')
gltfLoader.setDRACOLoader(dracoLoader);

loadGLTF("assets/character.glb", (gltf) => {
    world.loadCharacter(gltf);
})

let titleScreen = true;
let timestamp = 0

var hostname = location.hostname
let socket: WebSocket;

if (hostname != 'localhost') {
    socket = new WebSocket("wss://" + hostname + "/ws");
} else {
    socket = new WebSocket("ws://" + hostname + ":2865");

    const gui = new GUI()
    var object4 = {
        GetDebugState: function () {
            socket.send(JSON.stringify(['get_debug', {
            }]))
        }
    };

    const debugFolder = gui.addFolder('Debug')
    gui.add(object4, 'GetDebugState');
    debugFolder.open()

}

const world = new World(socket, "assets/world.glb")

socket.onmessage = function (event) {

    const msg = JSON.parse(event.data) as MessageType
 
    if (msg.kind == 'Join') {
        world.player_id = msg.id
    }

    if (msg.kind == 'WorldUpdate') {

        const data = msg

        Object.keys(data.players).forEach((p) => {

            timestamp = Date.now()
            world.updatePlayer(p, data.players[p])

        });

        Object.keys(world.players).forEach((id) => {
            if (data.players[id] == undefined) {
                world.removePlayer(id)
            }
        })

        world.updateObstacles(data.dynamic_objects);
     
    }

    if (msg.kind == 'Chat'){
        world.chatManager.newMessage(msg.name.slice(1, -1), msg.message.slice(1, -1))
    }
}

document.addEventListener('keydown', onDocumentKey, false)
document.addEventListener('keyup', onDocumentKey, false)

let join_button = document.getElementById("join");
if (join_button) {
    join_button.onclick = join
}
// document.querySelector("#join")?.addEventListener("click", async function (){
//     // await world.renderer.domElement.requestFullscreen({ navigationUI: 'hide' })
//     // screen.orientation.lock('landscape')
// })

function join() {
    //get the name inputed 
    let name_input = document.getElementById("settings_input") as HTMLInputElement;
    if (name_input) {
        socket.send(JSON.stringify(["name", name_input.value]))
    }
    titleScreen = false
    let settings_holder = document.getElementById("settings_holder") as HTMLDivElement;
    if (settings_holder) {

        settings_holder.style.display = "none";

    }
    // document.documentElement.requestFullscreen({ navigationUI: 'hide' }).then(() => { screen.orientation.lock('landscape') })
    world.mobileControls.enable()

    let throw_button = document.getElementById("button_throw") as HTMLDivElement;
    if (throw_button) {
        throw_button.onclick = () => {
            socket.send(JSON.stringify(['throw', {
            }]))
        };
    }


}

const keyMap: { [id: string]: boolean } = {}

world.animate()


function onDocumentKey(e: KeyboardEvent) {
    keyMap[e.key.toLowerCase()] = e.type === 'keydown'
    let movement = new Vector2(0, 0)
    if (keyMap['w'] || keyMap["W"]) {
        movement.y += 1
    }
    if (keyMap['s'] || keyMap["S"]) {
        movement.y -= 1
    }
    if (keyMap['a'] || keyMap["A"]) {
        movement.x += 1
    }
    if (keyMap['d'] || keyMap["D"]) {
        movement.x -= 1
    }

    sendUpdate(movement)

    if (e.key === 'Tab') {
        world.labels.setEnabled(e.type === 'keydown')
        e.preventDefault()
    }

    if (e.type == 'keydown') {
        if (e.key.toLowerCase() == 'p') {
            socket.send(JSON.stringify(['throw', {
            }]))
        }
    }

}

function sendUpdate(movement: THREE.Vector2) {
    if (!titleScreen) {
        socket.send(JSON.stringify(['update', {
            t: Date.now(),
            moveVector: movement,
            keyMap: keyMap,
            viewVector: world.cameraOperator.viewVector
        }]))
    }
}



function loadGLTF(path: string, onLoadingFinished: (gltf: any) => void): void {
    // let trackerEntry = this.addLoadingEntry(path);

    gltfLoader.load(path,
        (gltf) => {
            onLoadingFinished(gltf);
            // this.doneLoading(trackerEntry);
        },
        (xhr) => {
            if (xhr.lengthComputable) {
                // trackerEntry.progress = xhr.loaded / xhr.total;
            }
        },
        (error) => {
            console.error(error);
        });
}
