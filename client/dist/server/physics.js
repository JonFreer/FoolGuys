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
const CANNON = __importStar(require("cannon-es"));
class Physics {
    // public jewelBody: CANNON.Body = new CANNON.Body()
    constructor(game, io) {
        this.world = new CANNON.World();
        this.bodies = {};
        this.game = game;
        this.world.gravity.set(0, -9.82, 0);
        this.groundMaterial = new CANNON.Material('groundMaterial');
        this.groundMaterial.friction = 0.15;
        this.groundMaterial.restitution = 0.25;
        this.slipperyMaterial = new CANNON.Material('slipperyMaterial');
        this.slipperyMaterial.friction = 0.15;
        this.slipperyMaterial.restitution = 0.25;
        const groundShape = new CANNON.Box(new CANNON.Vec3(5, 0.5, 5));
        const groundBody = new CANNON.Body({
            mass: 0,
            material: this.groundMaterial,
        });
        groundBody.addShape(groundShape);
        groundBody.position.x = 0;
        groundBody.position.y = -1;
        groundBody.position.z = 0;
        this.world.addBody(groundBody);
    }
    createPlayer(id) {
        const sphereShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
        const sphereBody = new CANNON.Body({
            mass: 1,
            material: this.slipperyMaterial,
            angularDamping: .9
        });
        sphereBody.addShape(sphereShape);
        sphereBody.addEventListener('collide', (e) => {
            // console.log("collide",e.contact.ni.dot(new CANNON.Vec3(0, 1, 0)))
            if (e.contact.ni.dot(new CANNON.Vec3(0, 1, 0)) < -0.5 || e.contact.ni.dot(new CANNON.Vec3(0, 1, 0)) > 0.99) {
                // console.log("collide")
                this.game.players[id].canJump = true;
            }
        });
        sphereBody.position.x = Math.random() * 10 - 5;
        sphereBody.position.y = 3;
        sphereBody.position.z = Math.random() * 10 - 5;
        this.world.addBody(sphereBody);
        this.bodies[id] = sphereBody;
        return sphereBody.id;
    }
}
exports.default = Physics;
