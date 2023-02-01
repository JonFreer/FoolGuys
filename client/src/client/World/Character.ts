import * as THREE from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { AssetLoader } from "./AssetLoader";
import { World } from "./World";
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'
import { Bone, Euler } from "three";
import { Body } from "cannon-es";
import { format } from "path";
import { GUI } from "dat.gui";

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
    public is_ragdoll: boolean = false;

    private state: State = State.Jumping;
    private rotation_offset : THREE.Euler = new THREE.Euler(180,0,0)
    // private: loaded
    // private action : any;

    constructor(player_data: any, assetLoader: AssetLoader, world: World) {

        assetLoader.loadGLTF('assets/character.glb', (model) => {

            console.log("Loaded Character Model")
            this.readCharacterData(model);
            this.gltf_scene = model.scene;

            const helper = new THREE.SkeletonHelper( model.scene );
            world.graphicsWorld.add(helper)
            world.graphicsWorld.add(model.scene);

        })

        console.log("creating character")

        const gui = new GUI()

        const debugFolder = gui.addFolder('Rotation')
        gui.add(this.rotation_offset, 'x');
        gui.add(this.rotation_offset, 'y');
        gui.add(this.rotation_offset, 'z');
        // debugFolder.open()

        this.name = player_data.name;

    }

    public setRagdoll(ragdoll_data: any) {

        // console.log(this.gltf_scene?.children)
        // this.setPosition(new THREE.Vector3(0,0,0))
        if (this.gltf_scene == undefined) {

            return
           
        }

        this.gltf_scene?.setRotationFromEuler(new THREE.Euler(0,0,0))
        this.gltf_scene.position.set(2,1.5,2)
        let keys : { [id: string] : string; }= {

            // "LeftLegLower": "Chara_Low_Rig:GameSkeletonKnee_L",
            // "RightLegLower": "Chara_Low_Rig:GameSkeletonKnee_R",
            "LeftLegUpper": "Chara_Low_RigGameSkeletonHip_L",
            "RightLegUpper": "Chara_Low_RigGameSkeletonHip_R",
            "Chest": "Chara_Low_RigGameSkeletonRoot_M",
            // "Head" : "Chara_Low_RigGameSkeletonHead_M"

        }

        

        for (let key in ragdoll_data) {
            let value = ragdoll_data[key];
            if( key in keys){
                
                    this.find_and_set(keys[key], this.gltf_scene, value)
                
            }
           
           
            // Use `key` and `value`
        }
    }

    find_and_set(name: String, node: any, data: any) {
        
        if (node.name == name) {
            // console.log("FOUND BONE" ,data.p.x, data.p.y, data.p.z)
            let bone = node as Bone;
            if(name == "Chara_Low_RigGameSkeletonRoot_M"){
                // bone.removeFromParent()
                // bone.scale.set(0.008,0.008,0.008)
                // this.gltf_scene?.add(bone)
                // bone.position.set(data.p.x, data.p.y, data.p.z)
                // let quat = new THREE.Quaternion(data.q.i, data.q.j, data.q.k, data.q.w).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI,0,Math.PI/2)));
                let quat = new THREE.Quaternion(data.q.i, data.q.j, data.q.k, data.q.w);//.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,Math.PI,Math.PI/2)));
                quat = quat.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI,0,Math.PI/2)))
                // quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0,Math.PI,0)).multiply(new THREE.Quaternion(data.q.i, data.q.j, data.q.k, data.q.w).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,Math.PI))));
                // quat = new THREE.Quaternion(0.00,-0.0,-0.0 )
                bone.rotation.setFromQuaternion(quat)
            }else{
                // console.log(bone.children)
                // let quat  =new THREE.Quaternion(data.q.i, data.q.j, data.q.k, data.q.w).invert()).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI,0,0)));
                // let quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,-Math.PI)).multiply(new THREE.Quaternion(data.q.i, data.q.j, data.q.k, data.q.w).invert()).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,0)));
                //x y z w // i j k w
                // let quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0,Math.PI,0)).multiply(new THREE.Quaternion(data.q.i, data.q.j, data.q.k, data.q.w).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,Math.PI))));

                // let euler  = new THREE.Euler(0,0,3.141).setFromQuaternion(quat) 

                // euler = euler.

                // if(euler.x > 0 ){
                //     euler.x = Math.PI/2 + Math.PI/2 - euler.x
                // }else{
                //     euler.x = -Math.PI/2 + (-Math.PI/2 - euler.x)
                // }
                // euler.z = euler.z + 3.141
                // euler.z = euler.z + 3.141
                // euler.x = euler.x + 3.141
                // console.log(1.7 - euler.x)

                // console.log(euler)
                // let quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI/2,0,0));
                // let quat = new THREE.Quaternion(data.q.i, data.q.j, data.q.k, data.q.w).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,0)));
                // let quat =new THREE.Quaternion().setFromEuler(new THREE.Euler(0,Math.PI/2,0)).multiply( new THREE.Quaternion(data.q.i, data.q.j, data.q.k, data.q.w));//.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,0)));
                
                let quat = new THREE.Quaternion(-data.q.k, -data.q.j, data.q.i, data.q.w);//.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(this.rotation_offset.x/(2*Math.PI),this.rotation_offset.y/(2*Math.PI),this.rotation_offset.z/(2*Math.PI))));
                // quat = new THREE.Quaternion(data.q.i, data.q.j, data.q.k, data.q.w);
                // let quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0,Math.PI,0)).multiply(new THREE.Quaternion(data.q.i, data.q.j, data.q.k, data.q.w).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,Math.PI))));
                
                // if(euler.x > 0 ){
                //     euler.x = Math.PI/2 + Math.PI/2 - euler.x
                // }else{
                //     euler.x = -Math.PI/2 + (-Math.PI/2 - euler.x)
                // }
                
                
                
                bone.rotation.setFromQuaternion(quat.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler((this.rotation_offset.x/360)*(2*Math.PI),
                (this.rotation_offset.y/360)*(2*Math.PI),
                (this.rotation_offset.z/360)*(2*Math.PI)))))
                // bone.rotation.set(euler.x,euler.y,euler.z)
            }
      
            // bone.position.set(data.p.x, data.p.y, data.p.z)
            // bone.position.set(0, 20, 0)
     
           

        } else {
            // console.log(node.name)
            for (let child in node.children) {
                // console.log(child)
                this.find_and_set(name, node.children[child], data)
            }
        }
    }

    public setPosition(position: THREE.Vector3): void {
        if (this.gltf_scene != undefined) {
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
        state = "Ragdoll"

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
            this.action.stop();
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
