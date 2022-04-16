import * as CANNON from 'cannon-es';
import * as THREE from 'three';
// import * as Utils from '../../core/FunctionLibrary';
import * as Utils from '../../utils/FuntionLibrary';
import {Mesh, Vector3} from 'three';
import {Object3D} from 'three';
import { threeToCannon, ShapeType } from 'three-to-cannon';

export class ConvexCollider 
{
	public mesh: any;
	public options: any;
	public body: CANNON.Body;
	public debugModel: any;

	constructor(vert: any,faces:any,scale:any,mesh:Object3D, options: any)
	{
		// this.mesh = mesh.clone();
        // this.mesh = mesh.clone();
		let defaults = {
			mass: 0,
			// position: mesh.position,
			friction: 0.3
		};
		options = Utils.setDefaults(options, defaults);
		this.options = options;

		let mat = new CANNON.Material('convMat');
		mat.friction = options.friction;
		// mat.restitution = 0.7;

		// if (this.mesh.geometry.isBufferGeometry)
		// {
        //     console.log("buffer")
		// 	// this.mesh.geometry = new THREE.Geometry().fromBufferGeometry(this.mesh.geometry);
		// }

        // let cannonPoints:CANNON.Vec3[] =[];
        let cannonPoints:any[] =[];
        for(let i = 0; i<vert.length;i+=3){
            // cannonPoints.push(new CANNON.Vec3( vert[i]*scale[0], vert[i+1]*scale[1],vert[i+2]*scale[2]))
            cannonPoints.push( vert[i]*scale[0])
            cannonPoints.push(    vert[i+1]*scale[1])
            cannonPoints.push(    vert[i+2]*scale[2])
            // console.log(i)
        }

        let facesPoints: number[][] =[];
        for(let i = 0; i<faces.length;i+=3){
            facesPoints.push([faces[i], faces[i+1],faces[i+2]])
        }

      

        // facesPoints[11]= [facesPoints[11][0],facesPoints[11][2],facesPoints[11][1]] 
		// let cannonPoints = this.mesh.geometry.vertices.map((v: Vector3) => {
			// return new CANNON.Vec3( v.x, v.y, v.z );
		// });
		
		// let cannonFaces = this.mesh.geometry.faces.map((f: any) => {
		// 	return [f.a, f.b, f.c];
		// });

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array(cannonPoints), 3 ) );
        geometry.setIndex( new THREE.BufferAttribute(faces, 1 ) )
        const material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
        this.mesh = new THREE.Mesh( geometry, material );

        let shape = threeToCannon(this.mesh, {type: ShapeType.HULL}); 
  
		// Add phys sphere
		let physBox = new CANNON.Body({
			mass: options.mass,
			// position: options.position,
			shape:shape.shape
		});

		physBox.material = mat;

		this.body = physBox;
	}
}