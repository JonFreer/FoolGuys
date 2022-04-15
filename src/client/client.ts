import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'
import { io } from 'socket.io-client'

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
const gltfLoader = new GLTFLoader()
const renderer = new THREE.WebGLRenderer()
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
renderer.setClearColor( 0xa8eeff, 1);
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)

const geometry = new THREE.BoxGeometry()
const material = new THREE.MeshStandardMaterial({
    color: 0x5555ff,
    wireframe: false,
    roughness:0.1
})

const floor_geometry = new THREE.BoxGeometry( 10, 1, 10 );
const floor_material = new THREE.MeshStandardMaterial( {color: 0xaaaaaa} );
const floor = new THREE.Mesh( floor_geometry, floor_material );
floor.receiveShadow=true;
scene.add( floor );
floor.position.y=-1;

//ambient
const ambient_light = new THREE.AmbientLight( 0x404040,2 ); // soft white light
scene.add( ambient_light );

const light = new THREE.PointLight(0xffffff, 1)
// const light = new THREE.DirectionalLight( 0xffffff, 1 );
light.position.set(10, 10, 10)
light.castShadow = true
scene.add(light)

//Set up shadow properties for the light
light.shadow.mapSize.width = 1024; // default
light.shadow.mapSize.height = 1024; // default
light.shadow.camera.near = 0.5; // default
light.shadow.camera.far = 500; // default

const geometry_2 = new THREE.BufferGeometry();

const indices = new Float32Array([
           0,  3,  9,  0,  9,  6,  8, 10, 21,
          8, 21, 19, 20, 23, 17, 20, 17, 14,
           13, 15,  4, 13,  4,  2,  7, 18, 12,
           7, 12,  1, 22, 11,  5, 22,  5, 16
        ].reverse())
const vertices = new Float32Array( [
                        -0.5, -0.5,               0.5,
                        -0.5, -0.5,               0.5,
                        -0.5, -0.5,               0.5, 
                        -0.5,  0.5,               0.5,
                        -0.5,  0.5,               0.5,
                        -0.5,  0.5,               0.5,              
                        -0.5, -0.5,             -0.5,
                        -0.5, -0.5,              -0.5,
                        -0.5, -0.5,              -0.5,              
                        -0.5, 2.073551654815674, -0.5,              
                        -0.5, 2.073551654815674, -0.5, 
                        -0.5, 2.073551654815674, -0.5,
                        0.5, -0.5,               0.5,              
                        0.5, -0.5,  0.5,             
                        0.5, -0.5, 0.5,  
                        0.5, 0.5, 0.5,
                         0.5,  0.5,               0.5,               0.5,
                         0.5,  0.5,               0.5,              -0.5,
                        -0.5,  0.5,              -0.5,              -0.5,
                         0.5, -0.5,              -0.5,               0.5,
           2.073551654815674, -0.5,               0.5, 2.073551654815674,
                        -0.5,  0.5, 2.073551654815674,              -0.5
         ] );

// const vertices = new Float32Array([0.5,0.5,0.5,0.5,0.5,0.5,-0.5,-0.5,-0.5,-0.5,-0.5,-0.5,0.5,0.5,0.5,0.5,0.5,0.5,-0.5,-0.5,-0.5,-0.5,-0.5,-0.5-0.5,-0.5,-0.5,0.5,0.5,0.5,-0.5,-0.5,-0.5,2.073551654815674,2.073551654815674,2.073551654815674,-0.5,-0.5,-0.5,0.5,0.5,0.5,-0.5,-0.5,-0.5,2.073551654815674,2.073551654815674,2.073551654815674,-0.5,-0.5,-0.5,-0.5,-0.5,-0.5,-0.5,-0.5,-0.5,-0.5,-0.5,-0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5])

geometry_2.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
geometry_2.setIndex( new THREE.BufferAttribute(indices, 1 ) )
const material_2 = new THREE.MeshStandardMaterial( { color: 0x00ff00 ,wireframe:false, side:THREE.BackSide} );
const mesh = new THREE.Mesh( geometry_2, material_2 );
// mesh.position.y =  -0.5
// mesh.position.z =  -17.409343719482422 
mesh.setRotationFromQuaternion(new THREE.Quaternion(0,  1,  0,  -1.6292068494294654e-7))
console.log(mesh)
console.log(floor)
scene.add( mesh )

//Create a helper for the shadow camera (optional)
const helper = new THREE.CameraHelper( light.shadow.camera );
scene.add( helper );

const myObject3D = new THREE.Object3D()
myObject3D.position.x = Math.random() * 4 - 2
myObject3D.position.z = Math.random() * 4 - 2

const gridHelper = new THREE.GridHelper(15, 15)
gridHelper.position.y = -0.5
// scene.add(gridHelper)

camera.position.z = 4

loadGLTF("assets/world.glb", (gltf) =>
            {
                loadScene(gltf);
                // console.log(gltf)
            })

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

let myId = ''
let timestamp = 0
const clientCubes: { [id: string]: THREE.Mesh } = {}
const socket = io()
socket.on('connect', function () {
    console.log('connect')
})
socket.on('disconnect', function (message: any) {
    console.log('disconnect ' + message)
})
socket.on('joined', (id: any,name:string) => {
    myId = id

})

socket.on("removePlayer",(id:string)=>{
    scene.remove(scene.getObjectByName(id) as THREE.Object3D)
})
socket.on('players', (players: any) => {
    let pingStatsHtml = 'Socket Ping Stats<br/><br/>'
    Object.keys(players).forEach((p) => {
        timestamp = Date.now()
        pingStatsHtml += p + ' ' + (timestamp - players[p].t) + 'ms<br/>'
        if (!clientCubes[p]) {
            clientCubes[p] = new THREE.Mesh(geometry, material)
            clientCubes[p].name = p
            clientCubes[p].castShadow=true
            clientCubes[p].receiveShadow=true
            scene.add(clientCubes[p])
            

        } else {
            if (players[p].p) {
                new TWEEN.Tween(clientCubes[p].position)
                    .to(
                        {
                            x: players[p].p.x,
                            y: players[p].p.y,
                            z: players[p].p.z,
                        },
                        50
                    )
                    .start()
            }
            if (players[p].r) {
                new TWEEN.Tween(clientCubes[p].rotation)
                    .to(
                        {
                            x: players[p].r._x,
                            y: players[p].r._y,
                            z: players[p].r._z,
                        },
                        50
                    )
                    .start()
            }
        }
    })
    ;(document.getElementById('pingStats') as HTMLDivElement).innerHTML =
        pingStatsHtml
})
socket.on('removeClient', (id: string) => {
    scene.remove(scene.getObjectByName(id) as THREE.Object3D)
})

const stats = Stats()
document.body.appendChild(stats.dom)

const gui = new GUI()
const cubeFolder = gui.addFolder('Cube')
const cubePositionFolder = cubeFolder.addFolder('Position')
cubePositionFolder.add(myObject3D.position, 'x', -5, 5)
cubePositionFolder.add(myObject3D.position, 'z', -5, 5)
cubePositionFolder.open()
const cubeRotationFolder = cubeFolder.addFolder('Rotation')
cubeRotationFolder.add(myObject3D.rotation, 'x', 0, Math.PI * 2, 0.01)
cubeRotationFolder.add(myObject3D.rotation, 'y', 0, Math.PI * 2, 0.01)
cubeRotationFolder.add(myObject3D.rotation, 'z', 0, Math.PI * 2, 0.01)
cubeRotationFolder.open()
cubeFolder.open()

const animate = function () {
    requestAnimationFrame(animate)

    controls.update()

    TWEEN.update()


    if (clientCubes[myId]) {
        controls.target.set(clientCubes[myId].position.x,clientCubes[myId].position.y,clientCubes[myId].position.z)
        // controls.
        camera.lookAt(clientCubes[myId].position)
    }

    render()

    stats.update()
}

const render = function () {
    renderer.render(scene, camera)
}

document.addEventListener('keydown', onDocumentKey, false)
document.addEventListener('keyup', onDocumentKey, false)
const keyMap : { [id: string]: boolean } = {}

animate()


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
        scene.add(gltf.scene);
    }