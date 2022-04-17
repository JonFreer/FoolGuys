import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'
import {Sky} from './Sky'
export class World {
    public renderer: THREE.WebGLRenderer;
    public camera: THREE.PerspectiveCamera;
    public graphicsWorld: THREE.Scene;
    public clientCubes: { [id: string]: THREE.Mesh } = {}
    public player_id:string='';
    public controls: OrbitControls;
    private stats
    public sky: Sky
    constructor() {
        const scope = this;

        this.renderer = new THREE.WebGLRenderer()
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
            // render()
        }

        this.stats = Stats()
        document.body.appendChild(this.stats.dom)

        this.graphicsWorld = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            2000000
        )

        document.body.appendChild(this.renderer.domElement)

        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.sky = new Sky(this);


        const floor_geometry = new THREE.BoxGeometry(10, 1, 10);
        const floor_material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
        const floor = new THREE.Mesh(floor_geometry, floor_material);


        floor.receiveShadow = true;
        this.graphicsWorld.add(floor);
        floor.position.y = -1;

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

        this.graphicsWorld.position.z = 4
    }

    public updatePlayer(client_id: string, players: any) {
        if (!this.clientCubes[client_id]) {

            const geometry = new THREE.BoxGeometry()
            const material = new THREE.MeshStandardMaterial({
                color: 0x5555ff,
                wireframe: false,
                roughness: 0.1
            })

            this.clientCubes[client_id] = new THREE.Mesh(geometry, material)
            this.clientCubes[client_id].name = client_id
            this.clientCubes[client_id].castShadow = true
            this.clientCubes[client_id].receiveShadow = true
            this.graphicsWorld.add(this.clientCubes[client_id])


        } else {
            if (players[client_id].p) {
                new TWEEN.Tween(this.clientCubes[client_id].position)
                    .to(
                        {
                            x: players[client_id].p.x,
                            y: players[client_id].p.y,
                            z: players[client_id].p.z,
                        },
                        50
                    )
                    .start()
            }
            if (players[client_id].q) {
                // new TWEEN.Tween(clientCubes[p].rotation)
                //     .to(
                //         new THREE.Quaternion(players[p].q.x,players[p].q.y,players[p].q.z,players[p].q.w),
                //         50
                //     )
                //     .start()
                this.clientCubes[client_id].setRotationFromQuaternion(new THREE.Quaternion(players[client_id].q.x, players[client_id].q.y, players[client_id].q.z, players[client_id].q.w),)
            }
        }
    }

    public animate(){
        requestAnimationFrame(() =>
		{
			this.animate();
		});
    
        this.controls.update()
        this.sky.update()
        TWEEN.update()
    
    
        if (this.clientCubes[this.player_id]) {
            this.controls.target.set(this.clientCubes[this.player_id].position.x,this.clientCubes[this.player_id].position.y,this.clientCubes[this.player_id].position.z)
            // controls.
            this.camera.lookAt(this.clientCubes[this.player_id].position)
        }
    
        this.render()
    
        this.stats.update()
    }
    
    public render() {
        this.renderer.render(this.graphicsWorld, this.camera)
    }

    // public registerUpdatable(registree: IUpdatable): void
	// {
	// 	this.updatables.push(registree);
	// 	this.updatables.sort((a, b) => (a.updateOrder > b.updateOrder) ? 1 : -1);
	// }
}