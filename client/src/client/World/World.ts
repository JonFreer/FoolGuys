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
import { ObjectUpdate, PlayerUpdate, Translation } from 'backend';

export class World {

    // ShaderChunkLoader.load_shader_chunks();
    
    public assets: AssetLoader = new AssetLoader();
    public renderer: THREE.WebGLRenderer;
    public camera: THREE.PerspectiveCamera;
    public graphicsWorld: THREE.Scene;
    public clientCubes: { [id: string]: THREE.Mesh } = {}
    public players: { [id: string]: Character } = {}
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
    public updatables : Asset[] = [];
    public debug : Debug;

    private global_time :number = 0;

    private characterGLTF: any;

    constructor(socket: WebSocket,path:string) {

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

        // this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.sky = new Sky(this);
        new ToonSky(this);
        this.sea = new Sea(this);

        this.grass = new Grass(this);
        
        this.debug = new Debug(this);
        


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

    }

    public loadWorld(path: string){



        this.assets.loadGLTF(path, (gltf:GLTF) => {
            gltf.scene.traverse( (object:any) => {
                if (object.isMesh) {
                    if(object.name.includes("land") ){
                        console.log("landdddddd")
                        this.grass.updateGrass(object);
                        this.floor = new Floor(object);
                        this.graphicsWorld.add(this.floor.object);
                    }else{
                        // this.obstacles[object.name] = new Obstacle(object);
                    }
                }
                if(object.type == "Object3D"){
                    // let asset_name = object.userData.asset
                    this.assets.add(object.userData.asset,gltf,this);
                    // console.log(asset_name)
                }
                    console.log("object",object)
            });
            
        })
    
    }

    public updatePlayer(client_id: string, update: PlayerUpdate) {

        // const update = players[client_id];

        if(!this.players[client_id]){

            this.players[client_id]= new Character(update,this.assets,this);
           
        }else{

            // const update = players[client_id];



            this.players[client_id].updateCharacter(update)
        }

        

        if (!this.clientCubes[client_id]) {

            // let labelsDiv = document.querySelector('#labels');
            const geometry = new THREE.BoxGeometry();

            let col = update.colour
            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color("rgb(" + col.r + "," + col.g + "," + col.b + ")"),
                wireframe: false,
                roughness: 0.1
            })

            this.clientCubes[client_id] = new THREE.Mesh(geometry, material)
            this.clientCubes[client_id].name = update.name.slice(1, -1)
            this.clientCubes[client_id].castShadow = true
            this.clientCubes[client_id].receiveShadow = true
            // this.graphicsWorld.add(this.clientCubes[client_id])


        } else {


            this.clientCubes[client_id].name = update.name.slice(1, -1)
            if (update.p) {
                new TWEEN.Tween(this.clientCubes[client_id].position)
                    .to(
                        {
                            x: update.p.x,
                            y: update.p.y,
                            z: update.p.z,
                        },
                        0//50
                    )
                    .start()

                // this.clientCubes[client_id].set
            }
            if (update.q) {
                // new TWEEN.Tween(clientCubes[p].rotation)
                //     .to(
                //         new THREE.Quaternion(players[p].q.x,players[p].q.y,players[p].q.z,players[p].q.w),
                //         50
                //     )
                //     .start()


                this.clientCubes[client_id].setRotationFromQuaternion(new THREE.Quaternion(update.q.i, update.q.j, update.q.k, update.q.w),)
            }


            let look_vector = new THREE.Vector3(
                this.clientCubes[client_id].position.x + update.dir.x,
                this.clientCubes[client_id].position.y + update.dir.y,
                this.clientCubes[client_id].position.z + update.dir.z
            )

            this.clientCubes[client_id].lookAt(look_vector);

        }
    }

    public removePlayer(id:string){
        if(this.players[id].gltf_scene != undefined){
            this.graphicsWorld.remove(this.players[id].gltf_scene as THREE.Group);
        }

        delete this.players[id];
        
    }

    public removeObstacle(id:string){
        if(this.obstacles[id].object != undefined){
            this.graphicsWorld.remove(this.obstacles[id].object);
        }

        delete this.obstacles[id];
        
    }

    public updateObstacles(updates:Record<string, ObjectUpdate>){

        Object.keys(updates).forEach((r) => {
            this.updateObstacle(r, updates[r]);
        });

        Object.keys(this.obstacles).forEach((id) => {
            if (updates[id] == undefined) {
                this.removeObstacle(id)
            }
        })
    }

    private updateObstacle(id: string, update: ObjectUpdate) {
        // console.log(obstacles)
        if (this.obstacles[id] != undefined) {

            new TWEEN.Tween(this.obstacles[id].object.position)
                .to(
                    {
                        x: update.p.x,
                        y: update.p.y,
                        z: update.p.z,
                    },
                    0
                )
                .start()
            // this.obstacles[id].set
            // this.obstacles[id].position = new THREE.Vector3(obstacles[id].p.x,obstacles[id].p.y,obstacles[id].p.z)
            this.obstacles[id].object.setRotationFromQuaternion(new THREE.Quaternion(update.q.i, update.q.j, update.q.k, update.q.w))

            this.obstacles[id].object.scale.set(update.scale.x,update.scale.y,update.scale.z)
        } else {
            
            // let obstacle = obstacles[id];
            
            let name = update.asset_name.replaceAll('"','');
            // console.log(obstacle,name)
            if(this.assets.assets[name] != undefined){
                let asset = new Asset(this.assets.assets[name],this);
                this.obstacles[id]=asset;
                console.log("Loaded dynamic Object", id)
            }
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
            value.update(0.016);//,this.global_time);
        }

        for (const [key, value] of Object.entries(this.players)) {
            value.update(0.016);
        }

        this.sea.update(this.global_time);
        this.grass.update(this.global_time, this.cameraOperator.camera.position);

        if(this.floor != undefined){
            this.floor.update(this.global_time);
        }

        for (let i = 0; i< this.updatables.length; i++){
            this.updatables[i].update(this.global_time);
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