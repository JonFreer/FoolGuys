import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Asset } from "./Asset";
import { World } from "./World";
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

export class AssetLoader {

    private gltfLoader: GLTFLoader;
    private loadingTracker: LoadingTrackerEntry[] = [];
    private assets: { [id: string]: GLTF; } = {};

    constructor() {
        this.gltfLoader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/libs/draco/'); 
        this.gltfLoader.setDRACOLoader( dracoLoader );
            

    }

    public loadManifest(){
        const asset_manifest = [{name:"Asset_ChestBig",path:"assets/Asset_ChestBig.glb"}]

        for (let i =0; i< asset_manifest.length; i++){
            this.loadGLTF(asset_manifest[i].path, (gltf) => {
                this.assets[asset_manifest[i].name] = gltf; 
            })
        }
    }

    public add(asset_name:string,world_gltf:GLTF, world:World):void{
        if(this.assets[asset_name]==undefined){
            this.loadGLTF("assets/assets/"+asset_name+".glb", (gltf:GLTF) => {
                this.assets[asset_name] = gltf;

                //Iterate through world and add assets
                

                world_gltf.scene.traverse( (object:any) => {
                    if(object.userData.asset == asset_name){
                        let asset = new Asset(gltf);
                        console.log(asset_name,asset.object)
                        asset.object.scale.set(object.scale.x,object.scale.y,object.scale.y);
                        asset.object.position.set(object.position.x,object.position.y,object.position.z);
                        asset.object.quaternion.set(object.quaternion.x,object.quaternion.y,object.quaternion.z,object.quaternion.w)
                        world.graphicsWorld.add(asset.object)

                    }
                })
            })
        }
    }



    public loadGLTF(path: string, onLoadingFinished: (gltf: any) => void): void {
        // let trackerEntry = this.addLoadingEntry(path);

        this.gltfLoader.load(path,
            (gltf) => {
                onLoadingFinished(gltf);
                // this.doneLoading(trackerEntry);
            },
            (xhr) => {
                if (xhr.lengthComputable) {
                    // trackerEntry.progress = xhr.loaded / xhr.total;
                }
            },
            (error) => {
                console.error(error);
            });
    }

}

class LoadingTrackerEntry {
    public path: string;
    public progress: number = 0;
    public finished: boolean = false;

    constructor(path: string) {
        this.path = path;
    }
}