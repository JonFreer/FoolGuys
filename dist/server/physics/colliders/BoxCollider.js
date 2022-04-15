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
exports.BoxCollider = void 0;
const CANNON = __importStar(require("cannon-es"));
const THREE = __importStar(require("three"));
const Utils = __importStar(require("../../utils/FuntionLibrary"));
// import { ICollider } from '../../interfaces/ICollider';
class BoxCollider {
    constructor(options) {
        let defaults = {
            mass: 0,
            position: new THREE.Vector3(),
            size: new THREE.Vector3(0.3, 0.3, 0.3),
            friction: 0.3
        };
        options = Utils.setDefaults(options, defaults);
        this.options = options;
        options.position = new CANNON.Vec3(options.position.x, options.position.y, options.position.z);
        options.size = new CANNON.Vec3(options.size.x, options.size.y, options.size.z);
        let mat = new CANNON.Material('boxMat');
        mat.friction = options.friction;
        // mat.restitution = 0.7;
        let shape = new CANNON.Box(options.size);
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
exports.BoxCollider = BoxCollider;
