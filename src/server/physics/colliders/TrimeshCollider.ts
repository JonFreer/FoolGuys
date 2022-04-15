import * as CANNON from 'cannon-es';
import * as THREE from 'three';
// import * as Utils from '../../core/FunctionLibrary';
// import {ICollider} from '../../interfaces/ICollider';
import {Object3D} from 'three';
import * as Utils from '../../utils/FuntionLibrary';
// import * as Three2Mesh from '../../utils/three-to-cannon';
import { threeToCannon, ShapeType } from 'three-to-cannon';

export class TrimeshCollider 
{
	public mesh: any;
	public options: any;
	public body: CANNON.Body;
	public debugModel: any;

	constructor(mesh: Object3D, options: any)
	{
		this.mesh = mesh.clone();
		console.log( mesh.position)
		let defaults = {
			mass: 0,
			position: mesh.position,
			rotation: mesh.rotation,
			friction: 0.3
		};
		// this.mesh = mesh.getMesh()
		options = Utils.setDefaults(options, defaults);
		this.options = options;

		let mat = new CANNON.Material('triMat');
		mat.friction = options.friction;

	
		let shape = threeToCannon(this.mesh, {type: ShapeType.MESH});
		
		  

		// mat.restitution = 0.7;

		// let shape = Three2Mesh.threeToCannon(this.mesh, {type: Three2Mesh.threeToCannon.Type.MESH});
		// shape['material'] = mat;

		// console.log(shape)

		// Add phys sphere
		let physBox = new CANNON.Body({
			mass: options.mass,
			position: options.position,
			quaternion: options.rotation,
			shape: shape.shape
		});

		physBox.material = mat;

		this.body = physBox;
	}
}

