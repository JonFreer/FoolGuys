import * as THREE from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { AssetLoader } from "./AssetLoader";
import { World } from "./World";
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'
import { Bone, Euler, Quaternion } from "three";
import { Body } from "cannon-es";
import { format } from "path";
import { GUI } from "dat.gui";
import { PlayerUpdate } from "backend";

enum State {
    Idle,
    Jumping,
    Walking,
    Falling,
    Ragdoll
}

export class Character {

    public mesh: THREE.Mesh | undefined;
    public animations: any[] = [];
    public mixer: THREE.AnimationMixer | undefined;
    public action: any | undefined;
    public gltf_scene: THREE.Group | undefined;
    public name: String;
    // public ragdoll : THREE.Group
    public is_ragdoll: boolean = false;

    private state: State = State.Jumping;
    private rotation_offset : THREE.Euler = new THREE.Euler(0,0,270)
    private rotation_offset_2 : THREE.Euler = new THREE.Euler(180,0,0)
    // private arrowHelper : THREE.ArrowHelper;
    // private arrowHelper2 : THREE.ArrowHelper;

    private ragdoll = new THREE.Group
    // private: loaded
    // private action : any;

    constructor(player_data: any, assetLoader: AssetLoader, world: World) {

        assetLoader.loadGLTF('assets/character.glb', (gltf:GLTF) => {

            console.log("Loaded Character Model")
            this.readCharacterData(gltf);

            this.gltf_scene = gltf.scene;

            world.graphicsWorld.add(gltf.scene);

        })

        assetLoader.loadGLTF('assets/character.glb', (gltf:GLTF) => {
            this.ragdoll = gltf.scene;
            gltf.scene.traverse((object: any) => {

                if (object.isMesh && object.name == "Body") {
    
                    object.castShadow = true;
                    object.receiveShadow = true;
                    object.material.side = THREE.FrontSide;
                    object.geometry.computeVertexNormals(true)
                }
    
            });
            // const helper = new THREE.SkeletonHelper(this.ragdoll);
            // world.graphicsWorld.add(helper)
            world.graphicsWorld.add(this.ragdoll)
        })

        console.log("creating character")

        // const gui = new GUI()

        // const debugFolder = gui.addFolder('Rotation')
        // gui.add(this.rotation_offset, 'x');
        // gui.add(this.rotation_offset, 'y');
        // gui.add(this.rotation_offset, 'z');
        // gui.add(this.rotation_offset_2, 'x');
        // gui.add(this.rotation_offset_2, 'y');
        // gui.add(this.rotation_offset_2, 'z');
        // // debugFolder.open()

        this.name = player_data.name;


        // const dir = new THREE.Vector3( 0  , 1, 0 );

        // //normalize the direction vector (convert to vector of length 1)
        // dir.normalize();

        // const origin = new THREE.Vector3( 116,2,79 );
        // const length = 1;
        // let hex = 0xff0000;

        // this.arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );

        // world.graphicsWorld.add(this.arrowHelper)

  

        // //normalize the direction vector (convert to vector of length 1)
       
        // hex = 0xFF00;


        // this.arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );

        // world.graphicsWorld.add(this.arrowHelper)

        // hex = 0x0000FF;


        // this.arrowHelper2 = new THREE.ArrowHelper( dir, origin, length, hex );

        // world.graphicsWorld.add(this.arrowHelper2)
    }

    public setRagdoll(ragdoll_data: any) {  
        console.log(ragdoll_data)
        if (this.ragdoll == undefined) {

            return
           
        }

        this.ragdoll?.setRotationFromEuler(new THREE.Euler(0,0,0))

        let keys : { [id: string] : string; }= {

            "LeftLegLower": "Chara_Low_RigGameSkeletonKnee_L",
            "RightLegLower": "Chara_Low_RigGameSkeletonKnee_R",
            "LeftLegUpper": "Chara_Low_RigGameSkeletonHip_L",
            "RightLegUpper": "Chara_Low_RigGameSkeletonHip_R",

            "LeftArmUpper": "Chara_Low_RigGameSkeletonShoulder_L",
            "RightArmUpper": "Chara_Low_RigGameSkeletonShoulder_R",
            "LeftArmLower": "Chara_Low_RigGameSkeletonElbow_L",
            "RightArmLower": "Chara_Low_RigGameSkeletonElbow_R",

            "Chest": "Chara_Low_RigGameSkeletonRoot_M",
            // "Head" : "Chara_Low_RigGameSkeletonChest_M"

        }

        

        for (let key in ragdoll_data) {
            let value = ragdoll_data[key];
            let quat = new THREE.Quaternion(ragdoll_data["Chest"].q.i, ragdoll_data["Chest"].q.j, ragdoll_data["Chest"].q.k, ragdoll_data["Chest"].q.w);
            if( key in keys){
                    this.find_and_set(keys[key], this.ragdoll, value,quat)
            }

        }
    }

    find_and_set(name: String, node: any, data: any,parent_quat:Quaternion) {
        
        if (node.name == name) {
            console.log("FOUND BONE,", name ,data.p.x, data.p.y, data.p.z)
            let bone = node as Bone;
      
            if(name == "Chara_Low_RigGameSkeletonRoot_M"){
                bone.removeFromParent()
                bone.scale.set(0.005,0.005,0.005)
                this.ragdoll?.add(bone)
                bone.position.set(0, 0, 0)
                let quat = new THREE.Quaternion(data.q.i, data.q.j, data.q.k, data.q.w);
                quat = quat.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI,0,Math.PI/2)))
                bone.rotation.setFromQuaternion(quat)
                 
            }
            
            // else if(name == "Chara_Low_RigGameSkeletonElbow_L"){

            // }

            
            else{
               
                
                bone.removeFromParent()
                this.ragdoll?.add(bone)
                bone.scale.set(0.005,0.005,0.005)
                bone.position.set(data.p.x, data.p.y, data.p.z)
                let custom_rot = new THREE.Quaternion().setFromEuler(new THREE.Euler((this.rotation_offset.x/360)*(2*Math.PI),
                (this.rotation_offset.y/360)*(2*Math.PI),
                (this.rotation_offset.z/360)*(2*Math.PI)))

                let quat = new THREE.Quaternion(data.q.i, data.q.j, data.q.k, data.q.w);
                bone.rotation.setFromQuaternion(quat.multiply(custom_rot));
 
            }
      

     
           

        } else {
            // console.log(node.name)
            for (let child in node.children) {
                // console.log(child)
                this.find_and_set(name, node.children[child], data,parent_quat)
            }
        }
    }

    public updateCharacter(update:PlayerUpdate){

        this.is_ragdoll = update.is_ragdoll;

        this.name = update.name.slice(1, -1);

        if (update.p) {
            this.setPosition(new THREE.Vector3(update.p.x,update.p.y,update.p.z))
        }
        if (update.q) {
            this.setRotation(update.q)
        }

        this.setLookVector(new THREE.Vector3(update.dir.x,update.dir.y,update.dir.z))
   
       
        this.setState(update.state)
        console.log(update.state)
        

        if(this.is_ragdoll){
            this.setRagdoll(update.ragdoll_info)
            if(this.gltf_scene){
                this.gltf_scene.visible = false;
            }
            this.ragdoll.visible = true;
        }else{
            if(this.gltf_scene){
                this.gltf_scene.visible = true;
            }
            this.ragdoll.visible = false;
        }
        
    }

    public setPosition(position: THREE.Vector3): void {
        let offset = 0.5

        if(this.is_ragdoll){
            offset = 0.0
            new TWEEN.Tween(this.ragdoll.position)
                .to(
                    {
                        x: position.x,
                        y: position.y - offset,
                        z: position.z,
                    },
                    0
                )
                .start()
            return
        }

        if (this.gltf_scene != undefined) {
            new TWEEN.Tween(this.gltf_scene.position)
                .to(
                    {
                        x: position.x,
                        y: position.y - offset,
                        z: position.z,
                    },
                    0
                )
                .start()
        }
    }

    public setRotation(quaternion: any): void {
        if (this.gltf_scene != undefined) {
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

    public setLookVector(dir: THREE.Vector3) {
        if (this.gltf_scene != undefined) {
            let look_vector = new THREE.Vector3(
                this.gltf_scene.position.x - dir.x,
                this.gltf_scene.position.y + dir.y,
                this.gltf_scene.position.z - dir.z
            )
            this.gltf_scene.lookAt(look_vector);
        }
    }

    public setState(state: any): void {
        // state = "Ragdoll"

        if (this.gltf_scene == undefined) {
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

        if (state == "Ragdoll" && this.state != State.Ragdoll) {
            this.state = State.Ragdoll
            // this.action.stop();
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

