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
exports.Roller = void 0;
const CANNON = __importStar(require("cannon-es"));
class Roller {
    constructor(body, rollAxis) {
        this.speed = 1;
        this.angle = 0.01;
        this.body = body;
        this.rollAxis = rollAxis;
    }
    update(timestep) {
        // console.log(this.angle)
        // console.log(this.body.quaternion)
        var quatY = new CANNON.Quaternion();
        quatY.setFromAxisAngle(this.rollAxis, this.angle);
        this.body.quaternion = quatY.mult(this.body.quaternion);
        this.body.angularVelocity.set(this.rollAxis.x, this.rollAxis.y, this.rollAxis.z);
        // console.log(this.body.quaternion)
        // this.angle +=0.1
    }
    getInfo() {
        return ({
            q: this.body.quaternion
        });
    }
}
exports.Roller = Roller;
