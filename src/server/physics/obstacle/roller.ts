import * as CANNON from 'cannon-es'

export class Roller 
{
    public body: CANNON.Body
    public rollAxis:CANNON.Vec3
    public speed:number= 0.5;
    public angle:number= 0.01

    constructor(body:CANNON.Body,rollAxis:CANNON.Vec3){
        this.body=body
        this.rollAxis=rollAxis
    }

    public update(timestep:number){
        // console.log(this.angle)
        // console.log(this.body.quaternion)

        var quatY = new CANNON.Quaternion();
        quatY.setFromAxisAngle(this.rollAxis,this.angle)
        this.body.quaternion = quatY.mult(this.body.quaternion)
        this.body.interpolatedQuaternion= quatY.mult(this.body.quaternion)

        this.body.angularVelocity.set(this.rollAxis.x*this.speed,this.rollAxis.y*this.speed,this.rollAxis.z*this.speed);
        
        // console.log(this.body.quaternion)
        // this.angle +=0.1
    }

    public getInfo(){
        return({
            q:this.body.quaternion
        })
    }


}