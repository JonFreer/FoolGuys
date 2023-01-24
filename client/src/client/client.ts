import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import Stats from 'three/examples/jsm/libs/stats.module'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'
import { io } from 'socket.io-client'
import { World } from './World/World'
import { Vector2 } from 'three'
import { win32 } from 'path'
import * as e from 'express'
import { Obstacle } from './World/obstacle'
import { UniformsLib, UniformsUtils } from 'three'
import { Asset } from './World/Asset'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { Floor } from './World/Floor'
// import { GUI } from 'dat.gui'
// const scene = new THREE.Scene()


const gltfLoader = new GLTFLoader()
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/libs/draco/'); 
gltfLoader.setDRACOLoader( dracoLoader );


loadGLTF("assets/character.glb", (gltf) => {
    world.loadCharacter(gltf);
    // console.log(gltf)
})
// loadGLTF("assets/Asset_ChestBig.glb", (gltf) => {
//     let asset = new Asset(gltf);
//     world.graphicsWorld.add(asset.object);
//     // console.log(gltf)
// })

let titleScreen = true;
let timestamp = 0


// const socket = io()
var hostname = location.hostname
// var socket
let socket: WebSocket;
console.log(hostname)
if (hostname != 'localhost') {
    socket = new WebSocket("wss://" + hostname + "/ws");
} else {
    socket = new WebSocket("ws://" + hostname + ":2865");
}

const world = new World(socket,"assets/world.glb")
// let time= Date.now()
socket.onmessage = function (event) {
    // console.log(event.data)
    let msg = JSON.parse(event.data)
    // console.log(msg)
    let data = msg[1]
    let type = msg[0]

    if (type == 'connect') {
        console.log('connect')
    }

    if (type == 'disconnect') {
        console.log('disconnect ' + msg)
    }

    if (msg["Join"]) {
        world.player_id = msg["Join"].id
    }

    if (type == 'removePlayer') {
        world.graphicsWorld.remove(world.graphicsWorld.getObjectByName(data.id) as THREE.Object3D)
    }

    if (msg["WorldUpdate"]) {
        let data = msg["WorldUpdate"]
        let pingStatsHtml = 'Socket Ping Stats<br/><br/>'


        // console.log("a",data.players)
        Object.keys(data.players).forEach((p) => {
            // console.log("b",data.players[p])
            // console.log(data.players[p].dir)
            timestamp = Date.now()
            // pingStatsHtml += p + ' ' + (timestamp - data[p].t) + 'ms<br/>'
            world.updatePlayer(p, data.players)

        });

        Object.keys(world.players).forEach((id) => {
            if(data.players[id]==undefined){
                world.removePlayer(id)
            }
        })
        // /dynamic_objects

        Object.keys(data.dynamic_objects).forEach((r) => {
            world.updateObstacle(r, data.dynamic_objects);

        });

        Object.keys(world.obstacles).forEach((id) => {
            if(data.dynamic_objects[id]==undefined){
                world.removeObstacle(id)
            }
        })


    }

    if (type == 'players') {
        let pingStatsHtml = 'Socket Ping Stats<br/><br/>'
        Object.keys(data.players).forEach((p) => {
            timestamp = Date.now()
            pingStatsHtml += p + ' ' + (timestamp - data.players[p].t) + 'ms<br/>'
            world.updatePlayer(p, data.players)

        });

        Object.keys(data.rollers).forEach((r) => {
            world.updateObstacle(r, data.rollers);
        });


        (document.getElementById('pingStats') as HTMLDivElement).innerHTML + pingStatsHtml



    }

    if (type == 'removeClient') { //NOTE::THIS IS REPEATED?
        world.graphicsWorld.remove(world.graphicsWorld.getObjectByName(data.id) as THREE.Object3D)
    }


    if (msg["Chat"]) {
        console.log(msg)
        world.chatManager.newMessage(msg["Chat"].name.slice(1, -1), msg["Chat"].message.slice(1, -1))

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
    if (throw_button){
        throw_button.onclick= ()=>{
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

    if(e.type == 'keydown'){
        if(e.key.toLowerCase() == 'p'){
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
