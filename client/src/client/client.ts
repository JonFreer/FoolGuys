import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'
import { io } from 'socket.io-client'
import { World } from './World/World'
import { Vector2 } from 'three'
import { win32 } from 'path'

// const scene = new THREE.Scene()



const gltfLoader = new GLTFLoader()


loadGLTF("assets/world.glb", (gltf) => {
    loadScene(gltf);
    // console.log(gltf)
})


let titleScreen = true;
let timestamp = 0


// const socket = io()
var hostname =location.hostname 

var socket = new WebSocket("ws://"+hostname+"/ws", "rust-websocket");

const world = new World(socket)

socket.onmessage = function (event) {
    // console.log(event.data)
    let msg = JSON.parse(event.data)
    // console.log(msg)
    let data = msg[1]
    let type = msg[0]
    // console.log("ytest")
    // console.log(msg["Join"])

    if(type == 'connect'){
        console.log('connect')
    }

    if(type == 'disconnect'){
        console.log('disconnect ' + msg)
    }

    if(msg["Join"]){
        world.player_id = msg["Join"].id
    }

    if(type == 'removePlayer'){
        world.graphicsWorld.remove(world.graphicsWorld.getObjectByName(data.id) as THREE.Object3D)
    }

    if(msg["WorldUpdate"]){
        let data = msg["WorldUpdate"]
        let pingStatsHtml = 'Socket Ping Stats<br/><br/>'
        // console.log("a",data.players)
        Object.keys(data.players).forEach((p) => {
            // console.log("b",data.players[p])
            timestamp = Date.now()
            // pingStatsHtml += p + ' ' + (timestamp - data[p].t) + 'ms<br/>'
            world.updatePlayer(p, data.players)
    
        });

        // /dynamic_objects
    
        Object.keys(data.dynamic_objects).forEach((r) => {
            world.updateObstacle(r, data.dynamic_objects);
            console.log(r)
            if(r=="rotation"){
                console.log(data.dynamic_objects[r])
            }
        });
    }

    if(type == 'players'){
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

    if(type == 'removeClient'){ //NOTE::THIS IS REPEATED?
        world.graphicsWorld.remove(world.graphicsWorld.getObjectByName(data.id) as THREE.Object3D)
    }


    if(msg["Chat"]){ 
        world.chatManager.newMessage(msg["Chat"].name,msg["Chat"].message)
    }

    


}

// socket.on('connect', function () {
//     console.log('connect')
// })
// socket.on('disconnect', function (message: any) {
//     console.log('disconnect ' + message)
// })
// socket.on('joined', (id: any, name: string) => {
//     world.player_id = id

// })

// socket.on("removePlayer", (id: string) => {
//     world.graphicsWorld.remove(world.graphicsWorld.getObjectByName(id) as THREE.Object3D)
// })
// socket.on('players', (data: any) => {
//     // console.log(data)
//     let pingStatsHtml = 'Socket Ping Stats<br/><br/>'
//     Object.keys(data.players).forEach((p) => {
//         timestamp = Date.now()
//         pingStatsHtml += p + ' ' + (timestamp - data.players[p].t) + 'ms<br/>'
//         world.updatePlayer(p, data.players)

//     });

//     Object.keys(data.rollers).forEach((r) => {
//         world.updateObstacle(r, data.rollers);
//     });


//     (document.getElementById('pingStats') as HTMLDivElement).innerHTML + pingStatsHtml
// })
// socket.on('removeClient', (id: string) => {
//     world.graphicsWorld.remove(world.graphicsWorld.getObjectByName(id) as THREE.Object3D)
// })

// socket.on('chat',(msg:any)=>{
//     world.chatManager.newMessage(msg.name,msg.message)
// })


// const gui = new GUI()
// const cubeFolder = gui.addFolder('Cube')
// const cubePositionFolder = cubeFolder.addFolder('Position')
// cubePositionFolder.add(myObject3D.position, 'x', -5, 5)
// cubePositionFolder.add(myObject3D.position, 'z', -5, 5)
// cubePositionFolder.open()
// const cubeRotationFolder = cubeFolder.addFolder('Rotation')
// cubeRotationFolder.add(myObject3D.rotation, 'x', 0, Math.PI * 2, 0.01)
// cubeRotationFolder.add(myObject3D.rotation, 'y', 0, Math.PI * 2, 0.01)
// cubeRotationFolder.add(myObject3D.rotation, 'z', 0, Math.PI * 2, 0.01)
// cubeRotationFolder.open()
// cubeFolder.open()



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
    document.documentElement.requestFullscreen({ navigationUI: 'hide' }).then(()=>{screen.orientation.lock('landscape')})
    world.mobileControls.enable()


}

const keyMap: { [id: string]: boolean } = {}

world.animate()


function onDocumentKey(e: KeyboardEvent) {
    keyMap[e.key] = e.type === 'keydown'
    let movement = new Vector2(0,0)
    if(keyMap['w'] || keyMap["W"]){
        movement.y+=1
    }
    if(keyMap['s'] || keyMap["S"]){
        movement.y-=1
    }
    if(keyMap['a'] || keyMap["A"]){
        movement.x+=1
    }
    if(keyMap['d'] || keyMap["D"]){
        movement.x-=1
    }

    sendUpdate(movement)

    if (e.key === 'Tab') {
        world.labels.setEnabled(e.type === 'keydown')
        e.preventDefault()
    }

}

function sendUpdate(movement:THREE.Vector2) {
    if (!titleScreen) {
        socket.send(JSON.stringify(['update', {
            t: Date.now(),
            moveVector: movement,
            keyMap:keyMap,
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

function loadScene(gltf: any) {

    // const floor_material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    gltf.scene.traverse(function (object: any) {
        if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
            // object.geometry.computeVertexNormals(true)
            object.material.side = THREE.FrontSide;
            object.geometry.computeVertexNormals(true)
            // object.material = floor_material
            console.log(object.material.side)
        }
        if (object.userData.hasOwnProperty('spin')) {
            world.obstacles[object.name] = object
        }else if (object.userData.hasOwnProperty('pivot')) {
            world.obstacles[object.name] = object
            console.log("pivot name ",object.name)
        }

    });
    world.graphicsWorld.add(gltf.scene);
}