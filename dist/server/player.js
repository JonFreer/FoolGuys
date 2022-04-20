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
const THREE = __importStar(require("three"));
class Player {
    constructor() {
        this.bodyId = -1;
        this.body = null;
        this.screenName = '';
        this.canJump = true;
        this.keyMap = {};
        this.p = { x: 0, y: 0, z: 0 }; //position
        this.q = { x: 0, y: 0, z: 0, w: 0 }; //quaternion
        this.speed = 0.1;
        this.t = -1; //ping timestamp
        this.viewVector = new THREE.Vector3(0, 0, 0);
        this.clientMoveVec = new THREE.Vector2(0, 0);
    }
    resetPlayer() {
        this.body.position.x = Math.random() * 10 - 5;
        this.body.position.y = 3;
        this.body.position.z = Math.random() * 10 - 5;
        this.body.velocity.x = 0;
        this.body.velocity.y = 0;
        this.body.velocity.z = 0;
    }
    getInfo() {
        return ({
            screenName: this.screenName,
            p: this.body.position,
            q: this.body.quaternion
        });
    }
    setMoveVec(moveVec) {
        console.log(moveVec);
        this.clientMoveVec = moveVec;
        this.clientMoveVec.x = Math.min(Math.max(this.clientMoveVec.x, -1), 1);
        this.clientMoveVec.y = Math.min(Math.max(this.clientMoveVec.y, -1), 1);
    }
}
exports.default = Player;
