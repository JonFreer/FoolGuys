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
exports.TrimeshCollider = void 0;
const CANNON = __importStar(require("cannon-es"));
const Utils = __importStar(require("../../utils/FuntionLibrary"));
// import * as Three2Mesh from '../../utils/three-to-cannon';
const three_to_cannon_1 = require("three-to-cannon");
class TrimeshCollider {
    constructor(mesh, options) {
        this.mesh = mesh.clone();
        console.log(mesh.position);
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
        let shape = (0, three_to_cannon_1.threeToCannon)(this.mesh, { type: three_to_cannon_1.ShapeType.MESH });
        // var bbox = new THREE.Box3().setFromObject(mesh);
        console.log("SHAPPE");
        console.log(mesh.position);
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
exports.TrimeshCollider = TrimeshCollider;
