import Physics from './physics'
import * as CANNON from 'cannon-es'
import Player from './player'
// import glTF
import * as THREE from "three";
import { Document, NodeIO } from '@gltf-transform/core';
// import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';

import { BoxCollider } from './physics/colliders/BoxCollider';
import { TrimeshCollider } from './physics/colliders/TrimeshCollider';
import { ConvexCollider } from './physics/colliders/ConvexCollider';
// import { DocumentView } from '@gltf-transform/view';
// const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);
// import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls'
// Patch global scope to imitate browser environment.

// import  {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
// require('three/examples/js/loaders/GLTFLoader.js');
// require('three/examples/js/loaders/GLTFLoader.js');
export default class Game{
    public players: { [id: string]: Player } = {}
    public physics: Physics
    private playerCount = 0

    constructor(io: any) {

        this.physics = new Physics(this, io)
        this.loadScene()
        io.on('connection', (socket: any) => {
            this.players[socket.id] = new Player()
            this.players[socket.id].canJump = true
            this.players[socket.id].screenName = 'Guest' + this.playerCount++
                        //console.log(this.players)
            console.log('a user connected : ' + socket.id)

            socket.emit(
                'joined',
                socket.id,
                this.players[socket.id].screenName
            )

            this.players[socket.id].bodyId = this.physics.createPlayer(socket.id)
            this.players[socket.id].body = this.physics.bodies[socket.id]

            socket.on('disconnect', () => {
                console.log('socket disconnected : ' + socket.id)
                if (this.players && this.players[socket.id]) {
                    console.log('deleting ' + socket.id)
                    delete this.players[socket.id]
                    this.physics.world.removeBody(this.physics.bodies[socket.id])
                    delete this.physics.bodies[socket.id]
                    io.emit('removePlayer', socket.id)
                }
            })

            socket.on('update', (message: any) => {
                if (this.players[socket.id]) {
                    this.players[socket.id].keyMap = message.keyMap
                }
            })

          


    })
    setInterval(() => {
                
    
        Object.keys(this.players).forEach((p) => {

            if(this.players[p].keyMap['w']){
                this.players[p].body.position.z+=0.1
            }
            if(this.players[p].keyMap['s']){
                this.players[p].body.position.z-=0.1
            }
            if(this.players[p].keyMap['a']){
                this.players[p].body.position.x+=0.1
            }
            if(this.players[p].keyMap['d']){
                this.players[p].body.position.x-=0.1
            }
            if(this.players[p].keyMap[' ']){
                if (this.players[p].canJump) {
                    this.players[p].canJump = false
                    this.physics.bodies[p].velocity.y += 10
                }
            }
        })
        this.physics.world.step(0.025)
        const player_info = {}
        Object.keys(this.players).forEach((p) => {
            // this.players[p].p = this.physics.bodies[p].position
            // this.players[p].q = this.physics.bodies[p].quaternion

            if(this.players[p].body.position.y<-5){
                this.players[p].resetPlayer()
            }

            player_info[p]= this.players[p].getInfo()

        })
        io.emit('players', player_info)
    }, 25)
}
public loadScene(): void{
    // const ob =new OrbitControls(null);
    // THREE.GLBufferAttribute
    const io = new NodeIO();
    // Read.
    // let document;
    io.read('dist/client/assets/world.glb').then((val)=>{
    // const documentView = new DocumentView(val);       
        // console.log(documentView)

        val.getRoot()
  .listNodes()
  .forEach((node) => {
        // console.log(node.getName()=="Ramp")
        if(node.getName().includes("Ramp")){
            // console.log(node.getMesh().listPrimitives()[0].getIndices())
            const geometry = new THREE.BufferGeometry();
            const vertices = new Float32Array(node.getMesh().listPrimitives()[0].getAttribute("POSITION").getArray());
            const indices = new Uint16Array( node.getMesh().listPrimitives()[0].getIndices().getArray())
            geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
            geometry.setIndex( new THREE.BufferAttribute(indices, 1 ) )
            const material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
            const mesh = new THREE.Mesh( geometry, material );
            // console.log(node.getScale())

            let phys = new ConvexCollider(vertices,indices,node.getScale(),mesh, {});

            phys.body.position =new CANNON.Vec3(node.getTranslation()[0], node.getTranslation()[1], node.getTranslation()[2])
            phys.body.quaternion =new CANNON.Quaternion(node.getRotation()[0], node.getRotation()[1], node.getRotation()[2], node.getRotation()[3])
            // console.log(phys.body.shapes[0])
            // console.log(phys.body.quaternion)
            // console.log(vertices)
            // console.log(indices)
            // phys.body.s

            // phys.body.position.x+=2;
            this.physics.world.addBody(phys.body);
            
        }
        else{
            let phys = new BoxCollider({size: new THREE.Vector3(node.getScale()[0]/2, node.getScale()[1]/2,node.getScale()[2]/2)});
            phys.body.position =new CANNON.Vec3(node.getTranslation()[0], node.getTranslation()[1], node.getTranslation()[2])
            phys.body.quaternion =new CANNON.Quaternion(node.getRotation()[0], node.getRotation()[1], node.getRotation()[2], node.getRotation()[3])
            this.physics.world.addBody(phys.body);
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
