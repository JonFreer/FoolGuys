import * as THREE from "three";

export class Obstacle {

    public mesh: THREE.Mesh;
    public animations: any[] = [];
    public mixer : THREE.AnimationMixer | undefined;

    constructor(mesh:THREE.Mesh) {
        this.mesh = mesh;
    }

    setAnimations(animations:any,mixer: any){
        this.animations=animations;
        this.mixer = new THREE.AnimationMixer(mixer);
    }

    public setAnimation(clipName: string, fadeIn: number): number
	{
		if (this.mixer !== undefined)
		{
			// gltf
			let clip = THREE.AnimationClip.findByName( this.animations, clipName );

			let action = this.mixer.clipAction(clip);
			if (action === null)
			{
				console.error(`Animation ${clipName} not found!`);
				return 0;
			}

			this.mixer.stopAllAction();
			action.fadeIn(fadeIn);
            // action.setLoop(THREE.LoopRepeat,100)
            // action.setLoop
			action.play();
            console.log(action.isRunning())
            // if (this.mixer !== undefined) this.mixer.update(0.5);
			return action.getClip().duration;
		}

        return -1
	}

    public update(timeStep:number, timestamp:number){
        if (this.mixer !== undefined) this.mixer.update(timeStep);
        if((this.mesh.material as THREE.ShaderMaterial).uniforms == undefined){
            return;
        }
        (this.mesh.material as THREE.ShaderMaterial).uniforms.u_time.value = timestamp;

    }

}