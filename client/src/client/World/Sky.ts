// import { SkyShader } from './SkyShader';
import * as THREE from 'three';
import { World } from './World';
const SkyShader = require('./SkyShader').SkyShader;
import { CSM } from 'three/examples/jsm/csm/CSM'
import { CSMHelper } from 'three/examples/jsm/csm/CSMHelper'

export class Sky extends THREE.Object3D
{
	public updateOrder: number = 5;

	public sunPosition: THREE.Vector3 = new THREE.Vector3();
	// public csm: CSM;
	// public csmHelper: CSMHelper;
	set theta(value: number) {
		this._theta = value;
		this.refreshSunPosition();
	}

	set aphi(value: number) {
		this._phi = value;
		this.refreshSunPosition();
		this.refreshHemiIntensity();
	}

	private _phi: number = 50;
	private _theta: number = 145;

	private hemiLight: THREE.HemisphereLight;
	private maxHemiIntensity: number = 0.9*Math.PI;
	private minHemiIntensity: number = 0.3*Math.PI;

	private skyMesh: THREE.Mesh;
	private skyMaterial: THREE.ShaderMaterial;

	private world: World;

	constructor(world:World)
	{
		super();

		this.world = world;
		
		// Sky material
		this.skyMaterial = new THREE.ShaderMaterial({
			uniforms: THREE.UniformsUtils.clone(SkyShader.uniforms),
			fragmentShader: SkyShader.fragmentShader,
			vertexShader: SkyShader.vertexShader,
			side: THREE.DoubleSide,
			// glslVersion: THREE.GLSL3,
		});

		// console.log(SkyShader.SkyShader)

		// Mesh
		this.skyMesh = new THREE.Mesh(
			new THREE.SphereGeometry(1, 32, 15),
			this.skyMaterial
		);
		this.skyMesh.scale.setScalar(450000)
		this.attach(this.skyMesh);

		// Ambient light
		this.hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 1.0*Math.PI );
		this.refreshHemiIntensity();
		this.hemiLight.color.setHSL( 0.59, 0.4, 0.6 );
		this.hemiLight.groundColor.setHSL( 0.095, 0.2, 0.75 );
		this.hemiLight.position.set( 0, 50, 0 );
		
		this.world.graphicsWorld.add( this.hemiLight );

		const light = new THREE.DirectionalLight( 0xffffff, 1*Math.PI );
		light.position.set( 100, 100, 100 ); //default; light shining from top
		light.castShadow = true; // default false
		this.world.graphicsWorld.add( light );

		//Set up shadow properties for the light
		light.shadow.mapSize.width = 4096; // default
		light.shadow.mapSize.height = 4096; // default
		light.shadow.camera.near = 0.05; // default
		light.shadow.camera.far = 400; // default
		// light.shadow.camera.visible = true;
		light.shadow.camera.bottom=100
		light.shadow.camera.left=100
		light.shadow.camera.right=-100
		light.shadow.camera.top = -100

		
		// light.shadow.camera.
		// light.shadow.camera
		// light.shadow.bias= -0.0005

		const helper = new THREE.CameraHelper( light.shadow.camera );
		// this.world.graphicsWorld.add( helper );
		// CSM
		// New version
		let splitsCallback = (amount:any, near:any, far:any, target:any) =>
		{
			for (let i = amount - 1; i >= 0; i--)
			{
				target.push(Math.pow(1 / 3, i));
			}
		};

		// Legacy
		// let splitsCallback = (amount:any, near:any, far:any) =>
		// {
		// 	let arr = [];

		// 	for (let i = amount - 1; i >= 0; i--)
		// 	{
		// 		arr.push(Math.pow(1 / 4, i));
		// 	}

		// 	return arr;
		// };

		// this.csm = new CSM({
		// 	// fade: true,
		// 	maxFar: 400,
		// 	lightNear:1,
		// 	cascades: 4,
		// 	shadowMapSize: 4096,
		// 	shadowBias:-0.0001,
		// 	lightDirection: new THREE.Vector3(-1, -1, -1),
		// 	camera: this.world.camera,
		// 	parent: this.world.graphicsWorld,
		// 	lightIntensity: 0.3
		// })
		// this.csm.fade = true;
		// console.log(this.csm)  

		// this.csmHelper = new CSMHelper(this.csm)
		// this.csmHelper.displayFrustum = true
		// this.csmHelper.displayPlanes = true
		// this.csmHelper.displayShadowBounds = true
		// this.world.graphicsWorld.add(this.csmHelper as any)

		this.refreshSunPosition();
		
		// world.graphicsWorld.add(this);
		// world.registerUpdatable(this);
	}

	public update(): void
	{
		// console.log("update")
		this.position.copy(this.world.camera.position);
		this.refreshSunPosition();
		// this.csm.update()
    	// this.csmHelper.update()

		// this.csm.update(this.world.camera.matrix);
		// this.csm.lightDirection = new THREE.Vector3(-this.sunPosition.x, -this.sunPosition.y, -this.sunPosition.z).normalize();
	}

	public refreshSunPosition(): void
	{
		const sunDistance = 10;

		this.sunPosition.x = sunDistance * Math.sin(this._theta * Math.PI / 180) * Math.cos(this._phi * Math.PI / 180);
		this.sunPosition.y = sunDistance * Math.sin(this._phi * Math.PI / 180);
		this.sunPosition.z = sunDistance * Math.cos(this._theta * Math.PI / 180) * Math.cos(this._phi * Math.PI / 180);

		this.skyMaterial.uniforms.sunPosition.value.copy(this.sunPosition);
		this.skyMaterial.uniforms.cameraPos.value.copy(this.world.camera.position);
	}

	public refreshHemiIntensity(): void
	{
		this.hemiLight.intensity = this.minHemiIntensity + Math.pow(1 - (Math.abs(this._phi - 90) / 90), 0.25) * (this.maxHemiIntensity - this.minHemiIntensity);
	}
}