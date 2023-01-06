import { Socket } from 'socket.io-client';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'
import { CameraOperator } from './CameraOperator';
import { InputManager } from './InputManager';
import { Sky } from './Sky'
import { Labels } from './Labels'
import { MobileControls } from './MobileControls';
import { ChatManager } from './Chat';
import { Obstacle } from './obstacle';
import { Character } from './Character';
import { Sea } from './Sea';
import { Grass } from './Grass';
import { ShaderChunkLoader } from '../shaders/shader_chunks' 
import { Floor } from './Floor';
import { ToonSky } from './ToonSky';

export class World {

    // ShaderChunkLoader.load_shader_chunks();
    
    public renderer: THREE.WebGLRenderer;
    public camera: THREE.PerspectiveCamera;
    public graphicsWorld: THREE.Scene;
    public clientCubes: { [id: string]: THREE.Mesh } = {}
    public players: { [id: string]: Character } = {}
    public obstacles: { [id: string]: Obstacle } = {}

    public player_id: string = '';
    // public controls: OrbitControls;
    private stats;
    public sky: Sky;
    public cameraOperator: CameraOperator;
    public inputManager: InputManager;
    public socket: WebSocket;
    public labels: Labels;
    public mobileControls: MobileControls;
    public chatManager: ChatManager;
    public sea: Sea;
    public grass: Grass;
    public floor: Floor | undefined;

    private global_time :number = 0;

    private characterGLTF: any;

    constructor(socket: WebSocket) {

        ShaderChunkLoader.load_shader_chunks();
        
        const scope = this;
        this.socket = socket;
        this.renderer = new THREE.WebGLRenderer({ antialias: true })
        this.renderer.shadowMap.enabled = true;
        // renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
        this.renderer.setClearColor(0xa8eeff, 1);
        this.renderer.setSize(window.innerWidth, window.innerHeight)

        window.addEventListener('resize', onWindowResize, false)
        function onWindowResize() {
            scope.camera.aspect = window.innerWidth / window.innerHeight
            scope.camera.updateProjectionMatrix()
            scope.renderer.setSize(window.innerWidth, window.innerHeight)
            scope.labels.setSize(window.innerWidth, window.innerHeight)
            // render()
        }

        this.labels = new Labels(this)
        document.body.append(this.labels.dom)
        this.labels.setSize(window.innerWidth, window.innerHeight)

        this.mobileControls = new MobileControls(this);
        this.chatManager = new ChatManager(this.socket);

        this.stats = Stats()
        // document.body.appendChild(this.stats.dom)

        this.graphicsWorld = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            2000000
        )
        this.inputManager = new InputManager(this, this.renderer.domElement);
        this.cameraOperator = new CameraOperator(this, this.camera, this.socket, 0.3);
        document.body.appendChild(this.renderer.domElement)

        // this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.sky = new Sky(this);
        new ToonSky(this);
        this.sea = new Sea(this);

        this.grass = new Grass(this);
       
        


        // const floor_geometry = new THREE.BoxGeometry(10, 1, 10);
        // const floor_material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
        // const floor = new THREE.Mesh(floor_geometry, floor_material);


        // floor.receiveShadow = true;
        // this.graphicsWorld.add(floor);
        // floor.position.y = -1;

        //ambient
        // const ambient_light = new THREE.AmbientLight(0x404040, 2); // soft white light
        // this.graphicsWorld.add(ambient_light);

        // const light = new THREE.PointLight(0xffffff, 1)
        // // const light = new THREE.DirectionalLight( 0xffffff, 1 );
        // light.position.set(10, 10, 10)
        // light.castShadow = true
        // this.graphicsWorld.add(light)

        // //Set up shadow properties for the light
        // light.shadow.mapSize.width = 1024; // default
        // light.shadow.mapSize.height = 1024; // default
        // light.shadow.camera.near = 0.5; // default
        // light.shadow.camera.far = 500; // default

        //Create a helper for the shadow camera (optional)
        // const helper = new THREE.CameraHelper(light.shadow.camera);
        // this.graphicsWorld.add(helper);

        const myObject3D = new THREE.Object3D()
        myObject3D.position.x = Math.random() * 4 - 2
        myObject3D.position.z = Math.random() * 4 - 2

        const gridHelper = new THREE.GridHelper(15, 15)
        gridHelper.position.y = -0.5
        // scene.add(gridHelper)

        // this.graphicsWorld.position.z = 0
    }

    public updatePlayer(client_id: string, players: any) {
        if(!this.players[client_id]){

            let character = new Character(this.characterGLTF,players[client_id]);

            if(character.mesh != undefined){
                this.graphicsWorld.add(character.gltf);
                this.players[client_id]= character;
            }
        }else{
            this.players[client_id].name = players[client_id].name.slice(1, -1);

            if (players[client_id].p) {
                new TWEEN.Tween(this.players[client_id].gltf.position)
                    .to(
                        {
                            x: players[client_id].p.x,
                            y: players[client_id].p.y-0.5,
                            z: players[client_id].p.z,
                        },
                        0
                    )
                    .start()
            }
            if (players[client_id].q) {
                this.players[client_id].gltf.setRotationFromQuaternion(new THREE.Quaternion(players[client_id].q.i, players[client_id].q.j, players[client_id].q.k, players[client_id].q.w),)
            }

            let look_vector = new THREE.Vector3(
                this.players[client_id].gltf.position.x - players[client_id].dir.x,
                this.players[client_id].gltf.position.y + players[client_id].dir.y,
                this.players[client_id].gltf.position.z - players[client_id].dir.z
            ) 


            this.players[client_id].gltf.lookAt(look_vector);
            this.players[client_id].setState(players[client_id].state)
        }

        if (!this.clientCubes[client_id]) {

         

            

            // let labelsDiv = document.querySelector('#labels');
            const geometry = new THREE.BoxGeometry();

            let col = players[client_id].colour
            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color("rgb(" + col.r + "," + col.g + "," + col.b + ")"),
                wireframe: false,
                roughness: 0.1
            })

            this.clientCubes[client_id] = new THREE.Mesh(geometry, material)
            this.clientCubes[client_id].name = players[client_id].name.slice(1, -1)
            this.clientCubes[client_id].castShadow = true
            this.clientCubes[client_id].receiveShadow = true
            // this.graphicsWorld.add(this.clientCubes[client_id])


        } else {


            this.clientCubes[client_id].name = players[client_id].name.slice(1, -1)
            if (players[client_id].p) {
                new TWEEN.Tween(this.clientCubes[client_id].position)
                    .to(
                        {
                            x: players[client_id].p.x,
                            y: players[client_id].p.y,
                            z: players[client_id].p.z,
                        },
                        0//50
                    )
                    .start()

                // this.clientCubes[client_id].set
            }
            if (players[client_id].q) {
                // new TWEEN.Tween(clientCubes[p].rotation)
                //     .to(
                //         new THREE.Quaternion(players[p].q.x,players[p].q.y,players[p].q.z,players[p].q.w),
                //         50
                //     )
                //     .start()


                this.clientCubes[client_id].setRotationFromQuaternion(new THREE.Quaternion(players[client_id].q.i, players[client_id].q.j, players[client_id].q.k, players[client_id].q.w),)
            }

            // if (players[client_id].p) {

            let look_vector = new THREE.Vector3(
                this.clientCubes[client_id].position.x +players[client_id].dir.x,
                this.clientCubes[client_id].position.y + players[client_id].dir.y,
                this.clientCubes[client_id].position.z + players[client_id].dir.z
            )


            this.clientCubes[client_id].lookAt(look_vector);



        }
    }

    public updateObstacle(id: string, obstacles: any) {
        if (this.obstacles[id] != undefined) {

            new TWEEN.Tween(this.obstacles[id].mesh.position)
                .to(
                    {
                        x: obstacles[id].p.x,
                        y: obstacles[id].p.y,
                        z: obstacles[id].p.z,
                    },
                    0
                )
                .start()
            // this.obstacles[id].set
            // this.obstacles[id].position = new THREE.Vector3(obstacles[id].p.x,obstacles[id].p.y,obstacles[id].p.z)
            this.obstacles[id].mesh.setRotationFromQuaternion(new THREE.Quaternion(obstacles[id].q.i, obstacles[id].q.j, obstacles[id].q.k, obstacles[id].q.w))
        } else {
            console.log("Cannot find obstacle", id)
        }
    }



    public animate() {
        requestAnimationFrame(() => {
            this.animate();
        });

        // this.controls.update()
        this.sky.update()
        TWEEN.update()
        this.global_time += 0.016;

        for (const [key, value] of Object.entries(this.obstacles)) {
            value.update(0.016,this.global_time);
        }

        for (const [key, value] of Object.entries(this.players)) {
            value.update(0.016);
        }

        this.sea.update(this.global_time);
        this.grass.update(this.global_time, this.cameraOperator.camera.position);

        if(this.floor != undefined){
            this.floor.update(this.global_time);
        }
        // if (this.clientCubes[this.player_id]) {
        //     // this.controls.target.set(this.clientCubes[this.player_id].position.x,this.clientCubes[this.player_id].position.y,this.clientCubes[this.player_id].position.z)
        //     // controls.
        //     // this.camera.lookAt(this.clientCubes[this.player_id].position)
        // }
        this.inputManager.update(0.1, 0.1)
        if (this.clientCubes[this.player_id] != undefined) {
            this.cameraOperator.setTarget(this.clientCubes[this.player_id].position)
            this.cameraOperator.update(0.1);
        }
        this.render()
        this.labels.update()
        this.stats.update()
    }

    public render() {
        this.renderer.render(this.graphicsWorld, this.camera)
    }

    public loadCharacter(gltf:any){
        this.characterGLTF = gltf;
    }

 

    // public registerUpdatable(registree: IUpdatable): void
    // {
    // 	this.updatables.push(registree);
    // 	this.updatables.sort((a, b) => (a.updateOrder > b.updateOrder) ? 1 : -1);
    // }
}