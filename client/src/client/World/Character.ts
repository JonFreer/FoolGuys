import * as THREE from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { AssetLoader } from "./AssetLoader";
import { World } from "./World";
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'

enum State {
    Idle,
    Jumping,
    Walking,
    Falling,
}

export class Character {

    public mesh: THREE.Mesh | undefined;
    public animations: any[] = [];
    public mixer: THREE.AnimationMixer | undefined;
    public action: any | undefined;
    public gltf_scene: THREE.Group | undefined;
    public name: String;

    private state: State = State.Jumping;
    // private: loaded
    // private action : any;

    constructor(player_data: any, assetLoader: AssetLoader, world: World) {

        assetLoader.loadGLTF('assets/character.glb', (model) => {

            console.log("Loaded Character Model")
            this.readCharacterData(model);
            this.gltf_scene = model.scene;
            world.graphicsWorld.add(model.scene);
        })

        this.name = player_data.name;

    }

    public setPosition(position: THREE.Vector3): void {
        if( this.gltf_scene != undefined){
            new TWEEN.Tween(this.gltf_scene.position)
                .to(
                    {
                        x: position.x,
                        y: position.y - 0.5,
                        z: position.z,
                    },
                    0
                )
                .start()
        }
    }

    public setRotation(quaternion: any): void {
        if( this.gltf_scene != undefined){
            this.gltf_scene.setRotationFromQuaternion(
                new THREE.Quaternion(
                    quaternion.i,
                    quaternion.j, 
                    quaternion.k, 
                    quaternion.w
                )
            )
        }
    }

    public setLookVector(dir: THREE.Vector3){
        if( this.gltf_scene != undefined){
            let look_vector = new THREE.Vector3(
                this.gltf_scene.position.x - dir.x,
                this.gltf_scene.position.y + dir.y,
                this.gltf_scene.position.z - dir.z
            ) 
            this.gltf_scene.lookAt(look_vector);
        }
    }

    public setState(state: any): void {

        if(this.gltf_scene == undefined){
            return
        }
        // console.log(state["Walk"],state)

        if (state["Idle"] != undefined && this.state != State.Idle) {
            this.state = State.Idle;
            let idle_clip = THREE.AnimationUtils.subclip(this.animations[0], '', 65, 90);
            this.setAnimation(idle_clip);
        }

        if (state == "Walk" && this.state != State.Walking) {
            this.state = State.Walking;
            // let walk_clip =  THREE.AnimationUtils.subclip(this.animations[0],'', 3,30);
            let walk_clip = THREE.AnimationUtils.subclip(this.animations[0], '', 35, 60);
            this.setAnimation(walk_clip);
        }

    }

    public setAnimation(clip: any) {
        console.log("setting animation")
        if (this.mixer != undefined) {

            if (this.action != undefined) {
                this.action.fadeOut(0.5);
                // this.action.stop();
            }

            this.action = this.mixer.clipAction(clip);
            this.action.fadeIn(0.5);
            // this.mixer.stopAllAction();
            this.action.play();
        }
    }



    public readCharacterData(gltf: GLTF): void {


        console.log("read char data")

        if (gltf == undefined) {
            return;
        }

        // gltf =  gltf.scene.clone();

        gltf.scene.traverse((object: any) => {

            if (object.isMesh && object.name == "Body") {

                object.castShadow = true;
                object.receiveShadow = true;
                object.material.side = THREE.FrontSide;
                object.geometry.computeVertexNormals(true)
                this.mesh = object;//.clone();
            }

        });

        // this.gltf = gltf.scene;

        for (let i = 0; i < gltf.animations.length; i++) {
            let animation = gltf.animations[i];
            let name = animation.name.slice(0, -6);
            console.log(animation, name, animation.name);

            // world.obstacles[name].setAnimations(gltf.animations,gltf.scene);
            // console.log(world.obstacles[name].setAnimation(animation.name,0));

        }
        this.animations = gltf.animations;
        this.mixer = new THREE.AnimationMixer(gltf.scene);

        // let clip = THREE.AnimationClip.findByName( this.animations, 'All_anims_Armature' );
        let run_clip = THREE.AnimationUtils.subclip(this.animations[0], '', 35, 60);
        let idle_clip = THREE.AnimationUtils.subclip(this.animations[0], '', 35, 60);
        var idleAction = this.mixer.clipAction(run_clip);
        console.log(idleAction)
        idleAction.play();
        console.log(idleAction.isRunning())
        this.action = idleAction;
        this.mixer.stopAllAction();
    }

    public update(timeStep: number) {
        if (this.mixer !== undefined) this.mixer.update(timeStep);
        // if (this.action !== undefined) console.log(this.action.isRunning());
    }
}
