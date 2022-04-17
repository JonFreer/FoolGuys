import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'
import { io } from 'socket.io-client'
import { World } from './World/World'

// const scene = new THREE.Scene()

const world = new World()

const gltfLoader = new GLTFLoader()


loadGLTF("assets/world.glb", (gltf) =>
            {
                loadScene(gltf);
                // console.log(gltf)
            })


let myId = ''
let timestamp = 0

const socket = io()
socket.on('connect', function () {
    console.log('connect')
})
socket.on('disconnect', function (message: any) {
    console.log('disconnect ' + message)
})
socket.on('joined', (id: any,name:string) => {
    world.player_id = id

})

socket.on("removePlayer",(id:string)=>{
    world.graphicsWorld.remove(world.graphicsWorld.getObjectByName(id) as THREE.Object3D)
})
socket.on('players', (players: any) => {
    let pingStatsHtml = 'Socket Ping Stats<br/><br/>'
    Object.keys(players).forEach((p) => {
        timestamp = Date.now()
        pingStatsHtml += p + ' ' + (timestamp - players[p].t) + 'ms<br/>'
        world.updatePlayer(p,players)
        
    })
    ;(document.getElementById('pingStats') as HTMLDivElement).innerHTML =
        pingStatsHtml
})
socket.on('removeClient', (id: string) => {
    world.graphicsWorld.remove(world.graphicsWorld.getObjectByName(id) as THREE.Object3D)
})



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
const keyMap : { [id: string]: boolean } = {}

world.animate()


function onDocumentKey (e: KeyboardEvent) {
    console.log("keymap")
    keyMap[e.key] = e.type === 'keydown'

    socket.emit('update', {
        t: Date.now(),
        keyMap:keyMap
    })

}

function loadGLTF(path: string, onLoadingFinished: (gltf: any) => void): void
	{
		// let trackerEntry = this.addLoadingEntry(path);

		gltfLoader.load(path,
		(gltf)  =>
		{
			onLoadingFinished(gltf);
			// this.doneLoading(trackerEntry);
		},
		(xhr) =>
		{
			if ( xhr.lengthComputable )
			{
				// trackerEntry.progress = xhr.loaded / xhr.total;
			}
		},
		(error)  =>
		{
			console.error(error);
		});
	}

    function loadScene(gltf: any){
        const floor_material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
        gltf.scene.traverse( function ( object:any ) {
            if ( object.isMesh ) {
                object.castShadow = true;
                object.receiveShadow = true;
                // object.geometry.computeVertexNormals(true)
                // object.material.flatShading = true;
                object.geometry.computeVertexNormals(true)
                // object.material = floor_material
                console.log(object.material.flatShading)
            }   
        
        } );
        world.graphicsWorld.add(gltf.scene);
    }