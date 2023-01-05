import * as THREE from "three";


export class Asset {

    public object: THREE.Mesh;

    constructor(gltf:any){
        
        const noise_perlin = new THREE.TextureLoader().load( "assets/Assets_Gradients.png");

        this.object = gltf;
        gltf.scene.traverse( (object: any) => {
            console.log(object)
            if(object.name == "Mesh"){
                this.object = object;
                // console.log("MATERIAL",object.material);
                // (this.object.material as THREE.MeshBasicMaterial).map= noise_perlin;
                const material = new THREE.MeshBasicMaterial( { map: noise_perlin } );
                this.object.translateY(10);
                this.object.material = material;
                
            }

        })
    }


}