import { Vector2 } from "three";
import { World } from "./World";

export class MobileControls {

    public supported: boolean;
    public enabled: boolean = false;
    // public dom:HTMLCanvasElement;
    // public ctx: CanvasRenderingContext2D | null;
    private tpMove: Touch | undefined;
    private tpLook: Touch | undefined;
    private world: World;
    public sensitivity: number = 2;
    private tapedTwice = false;

    constructor(world: World) {
        this.world = world;
        this.supported = "ontouchstart" in document.documentElement
        
        let label_button = document.getElementById("button_labels");
        if(label_button!=null){
            label_button.onclick =((ev: MouseEvent) =>this.world.labels.toggle(this.world.labels))
        }

        let fullscreen_button = document.getElementById("button_fullscreen");
        if(fullscreen_button!=null){
            fullscreen_button.onclick =((ev: MouseEvent) =>{
                if(document.fullscreenElement){
                    document.exitFullscreen();
                }else{
                    document.documentElement.requestFullscreen({ navigationUI: 'hide' }).then(()=>{screen.orientation.lock('landscape')})
                }

            })
        }
        // this.dom = <HTMLCanvasElement>document.createElement("canvas");
        // this.ctx = this.dom.getContext("2d");
        // this.dom.setAttribute("id", "mobile_controls");
    }

    public enable() {
        if (this.enabled) {
            return
        }

        document.ontouchstart = ((ev: TouchEvent) => this.touchStart(this, ev))
        document.ontouchmove = ((ev: TouchEvent) => this.touchMove(this, ev))
        document.ontouchend = ((ev: TouchEvent) => this.touchEnd(this, ev))
        let dom = document.getElementById("mobile_button_holder");
        if(dom!=null){
            dom.style.visibility='visible';
        }
    }

    private touchStart(that: MobileControls, ev: TouchEvent) {
        ev.preventDefault();
        for (var i = 0; i < ev.targetTouches.length; i++) {
            // this.tpCache.push(ev.targetTouches[i]);
            if (ev.targetTouches[i].identifier != that.tpLook?.identifier && ev.targetTouches[i].identifier != that.tpMove?.identifier) {
                if (ev.targetTouches[i].clientX < window.innerWidth / 2) {
                    that.tpMove = ev.targetTouches[i];
                } else {
                    that.tpLook = ev.targetTouches[i];
                }
            }
            if (ev.targetTouches[i].clientX > window.innerWidth / 2) {
                if(!that.tapedTwice) {
                    that.tapedTwice = true;
                    setTimeout( function() { that.tapedTwice = false; }, 300 );
                    return false;
                }
                that.world.socket.emit("update_jump")
                ev.preventDefault();
        }
        }
    }


    private touchMove(that: MobileControls, ev: TouchEvent) {
        // console.log(motionControls)
        ev.preventDefault();
        for (var i = 0; i < ev.targetTouches.length; i++) {
            if (ev.targetTouches[i].identifier === that.tpMove?.identifier) {
                let diff_x = that.tpMove.clientX - ev.targetTouches[i].clientX;
                let diff_y = that.tpMove.clientY - ev.targetTouches[i].clientY;
                console.log(diff_x, diff_y, this.tpMove?.identifier)
                that.world.socket.emit('update_move', {
                    moveVector: new Vector2(diff_x / 50, diff_y / 50)
                })
            }
            if (ev.targetTouches[i].identifier === that.tpLook?.identifier) {
                let diff_x = -(that.tpLook.clientX - ev.targetTouches[i].clientX) * that.sensitivity;
                let diff_y = -(that.tpLook.clientY - ev.targetTouches[i].clientY) * that.sensitivity;
                // console.log(this)
                that.world.cameraOperator.move(diff_x, diff_y)
                that.tpLook = ev.targetTouches[i]
            }
        }

    }

    private touchEnd(that: MobileControls, ev: TouchEvent) {
        let contains_move = false
        let contains_look = false
        for (var i = 0; i < ev.targetTouches.length; i++) {
            //check if 
            if (ev.targetTouches[i].identifier === that.tpMove?.identifier) {
                contains_move = true
            }
            if (ev.targetTouches[i].identifier === that.tpLook?.identifier) {
                contains_look = true
            }

        }
        if (!contains_move) {
            console.log("removing move")
            that.tpMove = undefined;
            that.world.socket.emit('update_move', {
                moveVector: new Vector2(0, 0)
            })
        }
        if (!contains_look) {
            console.log("removing move")
            that.tpLook = undefined;
        }
    }
}