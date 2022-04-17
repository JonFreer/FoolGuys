"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const physics_1 = __importDefault(require("./physics"));
const CANNON = __importStar(require("cannon-es"));
const player_1 = __importDefault(require("./player"));
// import glTF
const THREE = __importStar(require("three"));
const core_1 = require("@gltf-transform/core");
// import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
const BoxCollider_1 = require("./physics/colliders/BoxCollider");
const ConvexCollider_1 = require("./physics/colliders/ConvexCollider");
const roller_1 = require("./physics/obstacle/roller");
// import { DocumentView } from '@gltf-transform/view';
// const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);
// import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls'
// Patch global scope to imitate browser environment.
// import  {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
// require('three/examples/js/loaders/GLTFLoader.js');
// require('three/examples/js/loaders/GLTFLoader.js');
class Game {
    constructor(io) {
        this.players = {};
        this.rollers = {};
        this.playerCount = 0;
        this.physics = new physics_1.default(this, io);
        this.loadScene();
        io.on('connection', (socket) => {
            this.players[socket.id] = new player_1.default();
            this.players[socket.id].canJump = true;
            this.players[socket.id].screenName = 'Guest' + this.playerCount++;
            //console.log(this.players)
            console.log('a user connected : ' + socket.id);
            socket.emit('joined', socket.id, this.players[socket.id].screenName);
            this.players[socket.id].bodyId = this.physics.createPlayer(socket.id);
            this.players[socket.id].body = this.physics.bodies[socket.id];
            socket.on('disconnect', () => {
                console.log('socket disconnected : ' + socket.id);
                if (this.players && this.players[socket.id]) {
                    console.log('deleting ' + socket.id);
                    delete this.players[socket.id];
                    this.physics.world.removeBody(this.physics.bodies[socket.id]);
                    delete this.physics.bodies[socket.id];
                    io.emit('removePlayer', socket.id);
                }
            });
            socket.on('update', (message) => {
                if (this.players[socket.id]) {
                    this.players[socket.id].keyMap = message.keyMap;
                }
            });
        });
        setInterval(() => {
            Object.keys(this.rollers).forEach((r) => {
                this.rollers[r].update(0.025);
            });
            Object.keys(this.players).forEach((p) => {
                if (this.players[p].keyMap['w']) {
                    this.players[p].body.position.z += 0.1;
                }
                if (this.players[p].keyMap['s']) {
                    this.players[p].body.position.z -= 0.1;
                }
                if (this.players[p].keyMap['a']) {
                    this.players[p].body.position.x += 0.1;
                }
                if (this.players[p].keyMap['d']) {
                    this.players[p].body.position.x -= 0.1;
                }
                if (this.players[p].keyMap[' ']) {
                    if (this.players[p].canJump) {
                        this.players[p].canJump = false;
                        this.physics.bodies[p].velocity.y += 10;
                    }
                }
            });
            this.physics.world.step(0.025);
            const player_info = {};
            const roller_info = {};
            Object.keys(this.players).forEach((p) => {
                if (this.players[p].body.position.y < -5) {
                    this.players[p].resetPlayer();
                }
                player_info[p] = this.players[p].getInfo();
            });
            Object.keys(this.rollers).forEach((r) => {
                roller_info[r] = this.rollers[r].getInfo();
            });
            io.emit('players', { players: player_info, rollers: roller_info });
        }, 25);
    }
    loadScene() {
        // const ob =new OrbitControls(null);
        // THREE.GLBufferAttribute
        const io = new core_1.NodeIO();
        // Read.
        // let document;
        io.read('dist/client/assets/world.glb').then((val) => {
            // const documentView = new DocumentView(val);       
            // console.log(documentView)
            val.getRoot()
                .listNodes()
                .forEach((node) => {
                // console.log(node.getName()=="Ramp")
                let phys;
                if (node.getExtras()['physics'] == 'hull') {
                    // console.log(node.getMesh().listPrimitives()[0].getIndices())
                    const geometry = new THREE.BufferGeometry();
                    const vertices = new Float32Array(node.getMesh().listPrimitives()[0].getAttribute("POSITION").getArray());
                    const indices = new Uint16Array(node.getMesh().listPrimitives()[0].getIndices().getArray());
                    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
                    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                    const mesh = new THREE.Mesh(geometry, material);
                    // console.log(node.getScale())
                    if (node.getName().includes("Hull")) {
                        console.log(indices);
                    }
                    phys = new ConvexCollider_1.ConvexCollider(vertices, indices, node.getScale(), mesh, {});
                    phys.body.position = new CANNON.Vec3(node.getTranslation()[0], node.getTranslation()[1], node.getTranslation()[2]);
                    phys.body.quaternion = new CANNON.Quaternion(node.getRotation()[0], node.getRotation()[1], node.getRotation()[2], node.getRotation()[3]);
                    this.physics.world.addBody(phys.body);
                }
                else {
                    phys = new BoxCollider_1.BoxCollider({ size: new THREE.Vector3(node.getScale()[0] / 2, node.getScale()[1] / 2, node.getScale()[2] / 2) });
                    phys.body.position = new CANNON.Vec3(node.getTranslation()[0], node.getTranslation()[1], node.getTranslation()[2]);
                    phys.body.quaternion = new CANNON.Quaternion(node.getRotation()[0], node.getRotation()[1], node.getRotation()[2], node.getRotation()[3]);
                    this.physics.world.addBody(phys.body);
                }
                if (node.getName().includes("Hull")) {
                    console.log(node.getExtras()['physics']);
                    // this.
                }
                if (node.getExtras()['spin'] != undefined) {
                    let rollAxis;
                    if (node.getExtras()['spin'] == 'x') {
                        rollAxis = new CANNON.Vec3(1, 0, 0);
                    }
                    else if (node.getExtras()['spin'] == 'y') {
                        rollAxis = new CANNON.Vec3(0, 1, 0);
                    }
                    else if (node.getExtras()['spin'] == 'z') {
                        rollAxis = new CANNON.Vec3(0, 0, 1);
                    }
                    this.rollers[node.getName()] = new roller_1.Roller(phys.body, rollAxis);
                    // const roller = 
                    console.log('spin');
                }
                // console.log(node.getTranslation);
            });
        }); // → Document
        // console.log(document)
        // document =  io.readBinary(glb);   // Uint8Array → Document
        // loader.load(
        //     // resource URL
        //     'assets/world.glb',
        //     // called when the resource is loaded
        //     function ( gltf ) {
        //         // scene.add( gltf.scene );
        //         gltf.animations; // Array<THREE.AnimationClip>
        //         gltf.scene; // THREE.Group
        //         gltf.scenes; // Array<THREE.Group>
        //         gltf.cameras; // Array<THREE.Camera>
        //         gltf.asset; // Object
        //     },
        //     // called while loading is progressing
        //     function ( xhr ) {
        //         console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        //     },
        //     // called when loading has errors
        //     function ( error ) {
        //         console.log( 'An error happened' );
        //     }
        // );
    }
}
exports.default = Game;
