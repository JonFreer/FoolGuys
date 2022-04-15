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
exports.RelativeSpringSimulator = void 0;
const THREE = __importStar(require("three"));
const SimulatorBase_1 = require("./SimulatorBase");
const FunctionLibrary_1 = require("../../core/FunctionLibrary");
class RelativeSpringSimulator extends SimulatorBase_1.SimulatorBase {
    constructor(fps, mass, damping, startPosition = 0, startVelocity = 0) {
        // Construct base
        super(fps, mass, damping);
        // Simulated values
        this.position = startPosition;
        this.velocity = startVelocity;
        // Simulation parameters
        this.target = 0;
        // Last lerped position for relative output
        this.lastLerp = 0;
        // Initialize cache by pushing two frames
        this.cache = []; // At least two frames
        for (let i = 0; i < 2; i++) {
            this.cache.push({
                position: startPosition,
                velocity: startVelocity,
            });
        }
    }
    /**
     * Advances the simulation by given time step
     * @param {number} timeStep
     */
    simulate(timeStep) {
        this.generateFrames(timeStep);
        // SpringR lerping
        // Lerp from 0 to next frame
        let lerp = THREE.MathUtils.lerp(0, this.cache[1].position, this.offset / this.frameTime);
        // Substract last lerp from current to make output relative
        this.position = (lerp - this.lastLerp);
        this.lastLerp = lerp;
        this.velocity = THREE.MathUtils.lerp(this.cache[0].velocity, this.cache[1].velocity, this.offset / this.frameTime);
    }
    /**
     * Gets another simulation frame
     */
    getFrame(isLastFrame) {
        let newFrame = Object.assign({}, this.lastFrame());
        if (isLastFrame) {
            // Reset position
            newFrame.position = 0;
            // Transition to next frame
            this.lastLerp = this.lastLerp - this.lastFrame().position;
        }
        return (0, FunctionLibrary_1.spring)(newFrame.position, this.target, newFrame.velocity, this.mass, this.damping);
    }
}
exports.RelativeSpringSimulator = RelativeSpringSimulator;
