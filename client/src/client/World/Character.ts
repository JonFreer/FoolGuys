import * as THREE from "three";

enum State {
    Idle,
    Jumping,
    Walking,
    Falling,
  }

export class Character {

    public mesh: THREE.Mesh | undefined;
    public animations: any[] = [];
    public mixer : THREE.AnimationMixer | undefined;
    public action : any | undefined;
    public gltf : any;
    public name: String;

    private state: State = State.Jumping;
    // private action : any;

    constructor(gltf:any, player_data:any) {
        // this.mesh = mesh;
        let col = player_data.colour
        this.readCharacterData(gltf);
        this.name = player_data.name;
        
    }

    public setState(state:any){
        // console.log(state["Walk"],state)

        if( state["Idle"] != undefined && this.state != State.Idle){
            this.state = State.Idle;
            let idle_clip =  THREE.AnimationUtils.subclip(this.animations[0],'', 65,90);
            this.setAnimation(idle_clip);
        }

        if( state == "Walk" && this.state != State.Walking){
            this.state = State.Walking;
            // let walk_clip =  THREE.AnimationUtils.subclip(this.animations[0],'', 3,30);
            let walk_clip =  THREE.AnimationUtils.subclip(this.animations[0],'', 35,60);
            this.setAnimation(walk_clip);
        }
        
    }

    public setAnimation(clip:any){
        console.log("setting animation")
        if(this.mixer != undefined){

            if(this.action != undefined){
            this.action.fadeOut(0.5);
            // this.action.stop();
            }

            this.action = this.mixer.clipAction(clip);
            this.action.fadeIn(0.5);
            // this.mixer.stopAllAction();
            this.action.play();
        }
    }

    public readCharacterData(gltf: any): void
	{
        console.log("read char data")

        if(gltf == undefined){
            return;
        }

        gltf.scene.traverse( (object: any) => {

            if (object.isMesh && object.name == "Body") {

                object.castShadow = true;
                object.receiveShadow = true;
                object.material.side = THREE.FrontSide;
                object.geometry.computeVertexNormals(true)
                this.mesh = object;
            }

        });
        this.gltf = gltf.scene;
        
        for (let i=0; i< gltf.animations.length;i++){
            let animation = gltf.animations[i];
            let name = animation.name.slice(0,-6);
            console.log(animation,name,animation.name);
            
            // world.obstacles[name].setAnimations(gltf.animations,gltf.scene);
            // console.log(world.obstacles[name].setAnimation(animation.name,0));
    
        }
        this.animations = gltf.animations;
        this.mixer = new THREE.AnimationMixer(gltf.scene);
        
        // let clip = THREE.AnimationClip.findByName( this.animations, 'All_anims_Armature' );
        let run_clip =  THREE.AnimationUtils.subclip(this.animations[0],'', 35,60);
        let idle_clip =  THREE.AnimationUtils.subclip(this.animations[0],'', 35,60);
        var idleAction = this.mixer.clipAction(run_clip);
        console.log(idleAction)
        idleAction.play();
        console.log(idleAction.isRunning())
        this.action = idleAction;
        this.mixer.stopAllAction();
	}

    public update(timeStep:number){
        if (this.mixer !== undefined) this.mixer.update(timeStep);
        // if (this.action !== undefined) console.log(this.action.isRunning());
    }



}