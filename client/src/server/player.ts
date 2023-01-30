import * as THREE from "three";

export default class Player {
    public bodyId = -1
    public body = null
    public screenName = ''
    public canJump = true
    public viewVector:THREE.Vector3;
    public clientMoveVec:THREE.Vector2;
    public keyMap:{ [id: string]: boolean } = {};
    public p = { x: 0, y: 0, z: 0 } //position
    public q = { x: 0, y: 0, z: 0, w: 0 } //quaternion
    public speed = 0.1

    public t = -1 //ping timestamp

    constructor() {
        this.viewVector=new THREE.Vector3(0,0,0);
        this.clientMoveVec=new THREE.Vector2(0,0);
    }

    public resetPlayer(){
        this.body.position.x = Math.random() * 10 - 5
        this.body.position.y = 3
        this.body.position.z = Math.random() * 10 - 5
        this.body.velocity.x=0
        this.body.velocity.y=0
        this.body.velocity.z=0
    }

    public getInfo(){
        return({
            screenName:this.screenName,
            p:this.body.position,
            q:this.body.quaternion
        })
    }

    public setMoveVec(moveVec:THREE.Vector2){
        this.clientMoveVec=moveVec;
        this.clientMoveVec.x = Math.min(Math.max(this.clientMoveVec.x,-1),1)
        this.clientMoveVec.y = Math.min(Math.max(this.clientMoveVec.y,-1),1)
    }
}