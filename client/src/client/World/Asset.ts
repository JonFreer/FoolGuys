import * as THREE from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";

export class Asset {

    public object: THREE.Mesh ;

    constructor(gltf:GLTF){
        this.object = new THREE.Mesh();
        const noise_perlin = new THREE.TextureLoader().load( "assets/Assets_Gradients_Small.png");
        noise_perlin.flipY = false
        // this.object = gltf;
        gltf.scene.traverse( (object: any) => {
            console.log(object)
            if(object.name.includes("Mesh")){
                this.object = object.clone();
                const material = new THREE.MeshBasicMaterial( { map: noise_perlin } );
                
                this.object.material = material;
                
            }

        })
    }


}