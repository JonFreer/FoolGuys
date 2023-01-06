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

loadGLTF("assets/world.glb", (gltf) => {
    loadScene(gltf);
    // console.log(gltf)
})

loadGLTF("assets/character.glb", (gltf) => {
    world.loadCharacter(gltf);
    // console.log(gltf)
})
loadGLTF("assets/Asset_ChestBig.glb", (gltf) => {
    let asset = new Asset(gltf);
    world.graphicsWorld.add(asset.object);
    // console.log(gltf)
})

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

const world = new World(socket)
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

        // /dynamic_objects

        Object.keys(data.dynamic_objects).forEach((r) => {
            world.updateObstacle(r, data.dynamic_objects);

        });


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
    // document.documentElement.requestFullscreen({ navigationUI: 'hide' }).then(() => { screen.orientation.lock('landscape') })
    world.mobileControls.enable()


}

const keyMap: { [id: string]: boolean } = {}

world.animate()


function onDocumentKey(e: KeyboardEvent) {
    keyMap[e.key] = e.type === 'keydown'
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



function loadScene(gltf: any) {

    const vShader = /* glsl */`
    #include <common>
    #include <fog_pars_vertex>
    #include <shadowmap_pars_vertex>

    varying vec2 v_uv;  
    varying vec4 world_pos;  
    void main() {
     v_uv = uv;
     world_pos =   vec4(position,1.0);
    //  gl_Position = projectionMatrix * modelViewMatrix *    vec4(position, 1.0);

    #include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`

    const fShader = /* glsl */ `

    
        #include <common>
        #include <packing>
        #include <fog_pars_fragment>
        #include <bsdfs>
        #include <lights_pars_begin>
        #include <shadowmap_pars_fragment>
        #include <shadowmask_pars_fragment>
        #include <dithering_pars_fragment>

        varying vec2 v_uv;
        varying vec4 world_pos;  
        uniform vec2 u_mouse;
        uniform vec2 u_resolution;
        uniform vec3 pos;
        uniform sampler2D t;
        uniform float u_time;

        void main() {

            vec4 helmet = texture2D(t, v_uv);
            vec3 shadowColor = vec3(0, 0, 0);
            float shadowPower = 0.5;

            // vec3 coord = vec3(gl_FragCoord.z / gl_FragCoord.w,gl_FragCoord.z / gl_FragCoord.w,gl_FragCoord.z / gl_FragCoord.w);
            // float f = 8.0f;

            vec3 col = vec3(helmet.x,helmet.y,helmet.z);

            float wave_height =  cos(u_time)/10.0;
            float max_wave_height = 1.0/10.0;

            float position = pos.y + world_pos.y;
            float sin_val =  -sin(u_time);

            vec4 target_col = vec4( mix(col, shadowColor, (1.0 - getShadowMask() ) * shadowPower), 1.0);
            if(position > max_wave_height + 0.1){ //above the wake
                gl_FragColor = target_col;
            }
            else if (position < wave_height +0.1 && position > wave_height ){ //the wake
    
                gl_FragColor = vec4(1.0,1,1, 1.0).rgba;
            
        }else if(position>wave_height+0.1){
            // if(sin_val>0.0f){
            //     gl_FragColor = mix(target_col, vec4(0.0,0.0,0.0,1.0), cos(u_time)/14.0);
            // }else{
            //     gl_FragColor = target_col;
            // }

            if(sin_val <0.0f){
                float factor = min(max(1.0-((wave_height+max_wave_height)*3.0-position),0.0),1.0);
                gl_FragColor = mix(vec4(0.0,0.0,0.0,1.0), target_col, factor);
                // gl_FragColor = vec4(1.0-((wave_height+max_wave_height)*10.0-position),0.0,0.0,1.0);
            }else{
                float factor = min(max(1.0-((0.0)*3.0-position),0.0),1.0);
                gl_FragColor = mix(vec4(0.0,0.0,0.0,1.0), target_col, factor);
                // gl_FragColor = target_col;
            }
            
        }
            else{ //below the sea
                gl_FragColor = vec4( mix(col, shadowColor, (1.0 - getShadowMask() ) * shadowPower), 1.0);

                gl_FragColor = mix(gl_FragColor, vec4(0.33333,0.7882, 1.0, 0.8), -(position)/3.0);
            }
           
            #include <fog_fragment>
            #include <dithering_fragment>

        }
        `

    

    const floor_material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    gltf.scene.traverse(function (object: any) {

        // console.log(object.ma)


        if (object.isMesh) {

            if (object.material.map != null) {
                const uniforms =  UniformsUtils.merge([{
                    pos: { value: object.position },
                    t: { value: object.material.map },
                    u_time:{value:0.0}
                },
                UniformsLib.lights,
            
            ]);

                const material = new THREE.ShaderMaterial({
                    vertexShader: vShader,
                    fragmentShader: fShader,
                    uniforms,
                    lights: true
                });

                // object.geometry.computeVertexNormals(true)
                object.material.side = THREE.FrontSide;
                console.log(object.material.map)

                object.material = material;
            }


            // if(object.name == "sea"){
         

            //     object.material = material;

            // }

            console.log(object.material);
            object.geometry.computeVertexNormals(true)
            object.castShadow = true;
            object.receiveShadow = true;

            if(object.name == "land" ){
                world.grass.updateGrass(object);
                world.floor = new Floor(object);
                world.graphicsWorld.add(world.floor.object);
            }else{
                world.obstacles[object.name] = new Obstacle(object);
            }

           


            // object.material = floor_material
        }
        // if (object.userData.hasOwnProperty('spin')) {

        //     world.obstacles[object.name] = new Obstacle(object);
        // }else if (object.userData.hasOwnProperty('pivot')) {
        //     world.obstacles[object.name] = new Obstacle(object);
        // }


    });


    world.graphicsWorld.add(gltf.scene);

    for (let i = 0; i < gltf.animations.length; i++) {
        let animation = gltf.animations[i];
        let name = animation.name.slice(0, -6);
        console.log(animation, name);
        // world.obstacles[name].setAnimations(gltf.animations,gltf.scene);
        // console.log(world.obstacles[name].setAnimation(animation.name,0));

    }
    // gltf.animation
    // for ){

    // }
    // gltf.animation.traverse(function(animation:any){
    //     console.log(animation);
    // })

}