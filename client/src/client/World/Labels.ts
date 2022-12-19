import * as THREE from "three";
import { World } from "./World";

export class Labels {

    public dom: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D | null;
    public world: World;
    public enabled: boolean = false;
    constructor(world: World) {
        this.world = world;
        this.dom = <HTMLCanvasElement>document.createElement("canvas");
        this.ctx = this.dom.getContext("2d");
        this.dom.setAttribute("id", "labels_canvas");
    }

    public setSize(width: number, height: number) {
        this.dom.width = width;
        this.dom.height = height;
    }

    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
        if (!enabled) {
            document.getElementById("button_labels")?.classList.add("off");
            if (this.ctx) {
                this.ctx.clearRect(0, 0, this.dom.width, this.dom.height);
            }
        }else{
            document.getElementById("button_labels")?.classList.remove("off");
        }
    }

    public toggle(that: Labels){

        that.setEnabled(!that.enabled);
       
    }

    public update() {
        if (this.enabled) {
            if (this.ctx != null) {
                this.ctx.clearRect(0, 0, this.dom.width, this.dom.height);

                Object.keys(this.world.clientCubes).forEach((c) => {
                    let tempV = new THREE.Vector3()
                    this.world.clientCubes[c].updateWorldMatrix(true, false);
                    this.world.clientCubes[c].getWorldPosition(tempV)

                    // convert the normalized position to CSS coordinates
                    tempV.project(this.world.camera);
                    const x = (tempV.x * .5 + .5) * this.dom.clientWidth;
                    const y = (tempV.y * -.5 + .5) * this.dom.clientHeight - 60;


                    // move the elem to that position
                    // this.labels[c].style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
                    if (this.ctx) {
                        this.ctx.textAlign = "center";
                        this.ctx.fillStyle = "#ffffff";
                        this.ctx.font = "20px Titan One";
                        this.ctx.strokeStyle = 'black';
                        this.ctx.lineWidth = 3;
                        // this.ctx.shadowColor="black";
                        // this.ctx.shadowBlur=7;  
                        this.ctx.strokeText(this.world.clientCubes[c].name, x+1, y+1    );
                        this.ctx.fillText(this.world.clientCubes[c].name, x, y);

                    }

                })
            }
        }
    }

}