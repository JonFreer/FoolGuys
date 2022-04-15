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
exports.CapsuleCollider = void 0;
const CANNON = __importStar(require("cannon"));
const Utils = __importStar(require("../../core/FunctionLibrary"));
class CapsuleCollider {
    // public visual: THREE.Mesh;
    constructor(options) {
        let defaults = {
            mass: 0,
            position: new CANNON.Vec3(),
            height: 0.5,
            radius: 0.3,
            segments: 8,
            friction: 0.3
        };
        options = Utils.setDefaults(options, defaults);
        this.options = options;
        let mat = new CANNON.Material('capsuleMat');
        mat.friction = options.friction;
        let capsuleBody = new CANNON.Body({
            mass: options.mass,
            position: options.position
        });
        // Compound shape
        let sphereShape = new CANNON.Sphere(options.radius);
        // Materials
        capsuleBody.material = mat;
        // sphereShape.material = mat;
        capsuleBody.addShape(sphereShape, new CANNON.Vec3(0, 0, 0));
        capsuleBody.addShape(sphereShape, new CANNON.Vec3(0, options.height / 2, 0));
        capsuleBody.addShape(sphereShape, new CANNON.Vec3(0, -options.height / 2, 0));
        this.body = capsuleBody;
    }
}
exports.CapsuleCollider = CapsuleCollider;
