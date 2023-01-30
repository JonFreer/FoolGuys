"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvexCollider = void 0;
const CANNON = __importStar(require("cannon-es"));
const THREE = __importStar(require("three"));
// import * as Utils from '../../core/FunctionLibrary';
const Utils = __importStar(require("../../utils/FuntionLibrary"));
const three_to_cannon_1 = require("three-to-cannon");
class ConvexCollider {
    constructor(vert, faces, scale, mesh, options) {
        // this.mesh = mesh.clone();
        // this.mesh = mesh.clone();
        let defaults = {
            mass: 0,
            // position: mesh.position,
            friction: 1
        };
        options = Utils.setDefaults(options, defaults);
        this.options = options;
        let mat = new CANNON.Material('convMat');
        mat.friction = options.friction;
        mat.restitution = 0;
        // if (this.mesh.geometry.isBufferGeometry)
        // {
        //     console.log("buffer")
        // 	// this.mesh.geometry = new THREE.Geometry().fromBufferGeometry(this.mesh.geometry);
        // }
        // let cannonPoints:CANNON.Vec3[] =[];
        let cannonPoints = [];
        for (let i = 0; i < vert.length; i += 3) {
            // cannonPoints.push(new CANNON.Vec3( vert[i]*scale[0], vert[i+1]*scale[1],vert[i+2]*scale[2]))
            cannonPoints.push(vert[i] * scale[0]);
            cannonPoints.push(vert[i + 1] * scale[1]);
            cannonPoints.push(vert[i + 2] * scale[2]);
            // console.log(i)
        }
        let facesPoints = [];
        for (let i = 0; i < faces.length; i += 3) {
            facesPoints.push([faces[i], faces[i + 1], faces[i + 2]]);
        }
        // facesPoints[11]= [facesPoints[11][0],facesPoints[11][2],facesPoints[11][1]] 
        // let cannonPoints = this.mesh.geometry.vertices.map((v: Vector3) => {
        // return new CANNON.Vec3( v.x, v.y, v.z );
        // });
        // let cannonFaces = this.mesh.geometry.faces.map((f: any) => {
        // 	return [f.a, f.b, f.c];
        // });
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cannonPoints), 3));
        geometry.setIndex(new THREE.BufferAttribute(faces, 1));
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        let shape = (0, three_to_cannon_1.threeToCannon)(this.mesh, { type: three_to_cannon_1.ShapeType.HULL });
        // Add phys sphere
        let physBox = new CANNON.Body({
            // mass: options.mass,
            // position: options.position,
            type: CANNON.BODY_TYPES.KINEMATIC,
            shape: shape.shape
        });
        physBox.material = mat;
        this.body = physBox;
    }
}
exports.ConvexCollider = ConvexCollider;
