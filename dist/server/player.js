"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Player {
    constructor() {
        this.bodyId = -1;
        this.body = null;
        this.screenName = '';
        this.canJump = true;
        this.keyMap = {};
        this.p = { x: 0, y: 0, z: 0 }; //position
        this.q = { x: 0, y: 0, z: 0, w: 0 }; //quaternion
        this.t = -1; //ping timestamp
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
}
exports.default = Player;
