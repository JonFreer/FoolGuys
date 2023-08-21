import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'
import { CameraOperator } from './CameraOperator';
import { InputManager } from './InputManager';
import { Sky } from './Sky'
import { Labels } from './Labels'
import { MobileControls } from './MobileControls';
import { ChatManager } from './Chat';
import { Character } from './Character';
import { Sea } from './Sea';
import { Grass } from './Grass';
import { ShaderChunkLoader } from '../shaders/shader_chunks'
import { Floor } from './Floor';
import { ToonSky } from './ToonSky';
import { AssetLoader } from './AssetLoader';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Asset } from './Asset';
import { Debug } from './Debug';
import { ObjectUpdate, PlayerUpdate, Translation, VehicleUpdate } from 'backend';
import { Vehicles } from '../vehicles/vehicles';
import { ObjectManager } from './ObjectManager';
import { PlayerManager } from './PlayerManager';

export class World {

    // ShaderChunkLoader.load_shader_chunks();

    public assets: AssetLoader = new AssetLoader();
    public renderer: THREE.WebGLRenderer;
    public camera: THREE.PerspectiveCamera;
    public graphicsWorld: THREE.Scene;
    public clientCubes: { [id: string]: THREE.Mesh } = {}
    // public players: { [id: string]: Character } = {}
    public obstacles: { [id: string]: Asset } = {}

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
    public updatables: Asset[] = [];
    public debug: Debug;
    public vehicles: Vehicles;
    public objectManager: ObjectManager;
    public playerManager: PlayerManager;
    private global_time: number = 0;

    private characterGLTF: any;

    constructor(socket: WebSocket, path: string) {

        ShaderChunkLoader.load_shader_chunks();
        this.loadWorld(path);


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
        document.body.appendChild(this.stats.dom)

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

        this.sky = new Sky(this);
        new ToonSky(this);
        this.sea = new Sea(this);

        this.grass = new Grass(this);

        this.debug = new Debug(this);

        this.vehicles = new Vehicles(this);

        this.objectManager = new ObjectManager(this);
        
        this.playerManager = new PlayerManager(this);

        const myObject3D = new THREE.Object3D()
        myObject3D.position.x = Math.random() * 4 - 2
        myObject3D.position.z = Math.random() * 4 - 2

        const gridHelper = new THREE.GridHelper(15, 15)
        gridHelper.position.y = -0.5
        // scene.add(gridHelper)

    }

    public loadWorld(path: string) {



        this.assets.loadGLTF(path, (gltf: GLTF) => {
            gltf.scene.traverse((object: any) => {
                if (object.isMesh) {
                    if (object.name.includes("land")) {
                        console.log("landdddddd")
                        this.grass.updateGrass(object);
                        this.floor = new Floor(object);
                        this.graphicsWorld.add(this.floor.object);
                    } else {
                        // this.obstacles[object.name] = new Obstacle(object);
                    }
                }
                if (object.type == "Object3D") {
                    // let asset_name = object.userData.asset
                    this.assets.add(object.userData.asset, gltf, this);
                    // console.log(asset_name)
                }
                console.log("object", object)
            });

        })

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
            value.update(0.016);//,this.global_time);
        }

        for (const [key, value] of Object.entries(this.playerManager.players)) {
            value.update(0.016);
        }

        this.sea.update(this.global_time);

        this.grass.update(this.global_time, this.cameraOperator.camera.position);

        if (this.floor != undefined) {
            this.floor.update(this.global_time);
        }

        for (let i = 0; i < this.updatables.length; i++) {
            this.updatables[i].update(this.global_time);
        }
   
        this.inputManager.update(0.1, 0.1)

        if (this.playerManager.players[this.player_id] != undefined) {
            this.cameraOperator.setTarget(this.playerManager.players[this.player_id].get_position())
            this.cameraOperator.update(0.1);
        }
        this.render()

        this.labels.update()
        this.stats.update()
    }

    public render() {
        this.renderer.render(this.graphicsWorld, this.camera)
    }

    public loadCharacter(gltf: any) {
        this.characterGLTF = gltf;
    }



    // public registerUpdatable(registree: IUpdatable): void
    // {
    // 	this.updatables.push(registree);
    // 	this.updatables.sort((a, b) => (a.updateOrder > b.updateOrder) ? 1 : -1);
    // }
}