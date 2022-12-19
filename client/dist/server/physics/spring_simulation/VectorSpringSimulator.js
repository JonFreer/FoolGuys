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
exports.VectorSpringSimulator = void 0;
const THREE = __importStar(require("three"));
const SimulatorBase_1 = require("./SimulatorBase");
const SimulationFrameVector_1 = require("./SimulationFrameVector");
const FunctionLibrary_1 = require("../../core/FunctionLibrary");
class VectorSpringSimulator extends SimulatorBase_1.SimulatorBase {
    constructor(fps, mass, damping) {
        // Construct base
        super(fps, mass, damping);
        this.init();
    }
    init() {
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.target = new THREE.Vector3();
        // Initialize cache by pushing two frames
        this.cache = [];
        for (let i = 0; i < 2; i++) {
            this.cache.push(new SimulationFrameVector_1.SimulationFrameVector(new THREE.Vector3(), new THREE.Vector3()));
        }
    }
    /**
     * Advances the simulation by given time step
     * @param {number} timeStep
     */
    simulate(timeStep) {
        // Generate new frames
        this.generateFrames(timeStep);
        // Return interpolation
        this.position.lerpVectors(this.cache[0].position, this.cache[1].position, this.offset / this.frameTime);
        this.velocity.lerpVectors(this.cache[0].velocity, this.cache[1].velocity, this.offset / this.frameTime);
    }
    /**
     * Gets another simulation frame
     */
    getFrame(isLastFrame) {
        // Deep clone data from previous frame
        let newSpring = new SimulationFrameVector_1.SimulationFrameVector(this.lastFrame().position.clone(), this.lastFrame().velocity.clone());
        // Calculate new Spring
        (0, FunctionLibrary_1.springV)(newSpring.position, this.target, newSpring.velocity, this.mass, this.damping);
        // Return new Spring
        return newSpring;
    }
}
exports.VectorSpringSimulator = VectorSpringSimulator;
