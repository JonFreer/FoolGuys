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
const CANNON = __importStar(require("cannon"));
const THREE = __importStar(require("three"));
const Utils = __importStar(require("../../core/FunctionLibrary"));
class ConvexCollider {
    constructor(mesh, options) {
        this.mesh = mesh.clone();
        let defaults = {
            mass: 0,
            position: mesh.position,
            friction: 0.3
        };
        options = Utils.setDefaults(options, defaults);
        this.options = options;
        let mat = new CANNON.Material('convMat');
        mat.friction = options.friction;
        // mat.restitution = 0.7;
        if (this.mesh.geometry.isBufferGeometry) {
            this.mesh.geometry = new THREE.Geometry().fromBufferGeometry(this.mesh.geometry);
        }
        let cannonPoints = this.mesh.geometry.vertices.map((v) => {
            return new CANNON.Vec3(v.x, v.y, v.z);
        });
        let cannonFaces = this.mesh.geometry.faces.map((f) => {
            return [f.a, f.b, f.c];
        });
        let shape = new CANNON.ConvexPolyhedron(cannonPoints, cannonFaces);
        // shape.material = mat;
        // Add phys sphere
        let physBox = new CANNON.Body({
            mass: options.mass,
            position: options.position,
            shape
        });
        physBox.material = mat;
        this.body = physBox;
    }
}
exports.ConvexCollider = ConvexCollider;
