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
import { GUI } from 'dat.gui'
// const scene = new THREE.Scene()


const gltfLoader = new GLTFLoader()
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/libs/draco/');
gltfLoader.setDRACOLoader(dracoLoader);


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

    const gui = new GUI()
    var object4 = {
        GetDebugState: function () {
            socket.send(JSON.stringify(['get_debug', {
            }]))
        }
    };

    const debugFolder = gui.addFolder('Debug')
    // debugFolder.add(cube.rotation, 'x', 0, Math.PI * 2)
    gui.add(object4, 'GetDebugState');
    debugFolder.open()

}

const world = new World(socket, "assets/world.glb")
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
            if (data.players[id] == undefined) {
                world.removePlayer(id)
            }
        })
        // /dynamic_objects

        Object.keys(data.dynamic_objects).forEach((r) => {
            world.updateObstacle(r, data.dynamic_objects);

        });

        Object.keys(world.obstacles).forEach((id) => {
            if (data.dynamic_objects[id] == undefined) {
                world.removeObstacle(id)
            }
        })


    }

    if (msg["PhysicsUpdate"]) {
        let data = msg["PhysicsUpdate"].data

        let colliders = data.colliders.colliders.items

        let group = new THREE.Group;
        // console.log(colliders)
        for (let i = 0; i < colliders.length; i++) {

            let collider = colliders[i]
            if (collider.Occupied) {
                console.log(collider.Occupied.value.shape)
                if (collider.Occupied.value.shape.TriMesh) {
                    const geometry = new THREE.BufferGeometry();
                    //collider.Occupied.value.shape.TriMesh.vertices
                    
                    let vert_array =[]
                    for( let i =0; i< collider.Occupied.value.shape.TriMesh.vertices.length; i++){
                        vert_array.push(collider.Occupied.value.shape.TriMesh.vertices[i][0])
                        vert_array.push(collider.Occupied.value.shape.TriMesh.vertices[i][1])
                        vert_array.push(collider.Occupied.value.shape.TriMesh.vertices[i][2])
                    }
                    const vertices = new Float32Array(vert_array)

                    let indices_array =[]
                    for( let i =0; i< collider.Occupied.value.shape.TriMesh.indices.length; i++){
                        indices_array.push(collider.Occupied.value.shape.TriMesh.indices[i][0])
                        indices_array.push(collider.Occupied.value.shape.TriMesh.indices[i][1])
                        indices_array.push(collider.Occupied.value.shape.TriMesh.indices[i][2])
                    }
                    // const indices = new Float32Array(indices_array)
                    // const vertices = new Float32Array(collider.Occupied.value.shape.TriMesh.vertices);

                    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                    geometry.setIndex( indices_array );
                    const material = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 2 } );
                    const mesh = new THREE.LineSegments(geometry, material);
                    // mesh.position.set(1, 1, 1)
                    group.add(mesh)
                    console.log("trimesh")
                    console.log(collider.Occupied.value.shape.TriMesh)
                }

                if (collider.Occupied.value.shape.ConvexPolyhedron) {
                    const geometry = new THREE.BufferGeometry();
                    //collider.Occupied.value.shape.TriMesh.vertices
                    
                    let vert_array =[]
                    for( let i =0; i< collider.Occupied.value.shape.ConvexPolyhedron.points.length; i++){
                        vert_array.push(collider.Occupied.value.shape.ConvexPolyhedron.points[i][0])
                        vert_array.push(collider.Occupied.value.shape.ConvexPolyhedron.points[i][1])
                        vert_array.push(collider.Occupied.value.shape.ConvexPolyhedron.points[i][2])
                    }

                    let indices_array =[]
                    for( let i =0; i< collider.Occupied.value.shape.ConvexPolyhedron.vertices_adj_to_face.length; i++){
                        indices_array.push(collider.Occupied.value.shape.ConvexPolyhedron.vertices_adj_to_face[i])
                        // indices_array.push(collider.Occupied.value.shape.ConvexPolyhedron.vertices_adj_to_face[i][1])
                        // indices_array.push(collider.Occupied.value.shape.ConvexPolyhedron.vertices_adj_to_face[i][2])
                    }


                    const vertices = new Float32Array(vert_array)
                    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                    geometry.setIndex( indices_array );
                    const material = new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 4 } );
                    const mesh = new THREE.LineSegments(geometry, material);

                    let pos = collider.Occupied.value.pos.translation;
                    let rot = collider.Occupied.value.pos.rotation;
                    mesh.position.set(pos[0],pos[1],pos[2])
                    mesh.rotation.setFromQuaternion(new THREE.Quaternion(rot[0],rot[1],rot[2],rot[3]))
                    group.add(mesh)
                    console.log("trimesh")
                    console.log(collider.Occupied.value.pos)

                }
            }

        }

        world.graphicsWorld.add(group)




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
