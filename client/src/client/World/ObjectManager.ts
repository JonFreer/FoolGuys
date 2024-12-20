import * as THREE from "three";
import { ObjectUpdate } from "../../../../server/bindings/ObjectUpdate";
import { Asset } from "./Asset";
import { World } from "./World";
import TWEEN from '@tweenjs/tween.js'

export class ObjectManager{

    public obstacles: { [id: string]: Asset } = {}
    private world: World;

    constructor(world: World) {
        this.world = world;
    }

    public updateObstacles(updates: Record<string, ObjectUpdate>) {

        Object.keys(updates).forEach((r) => {
            this.updateObstacle(r, updates[r]);
        });

        Object.keys(this.obstacles).forEach((id) => {
            if (updates[id] == undefined) {
                this.removeObstacle(id)
            }
        })
    }


    private updateObstacle(id: string, update: ObjectUpdate) {
        // console.log(obstacles)
        if (this.obstacles[id] != undefined) {

            new TWEEN.Tween(this.obstacles[id].object.position)
                .to(
                    {
                        x: update.p.x,
                        y: update.p.y,
                        z: update.p.z,
                    },
                    0
                )
                .start()
            // this.obstacles[id].set
            // this.obstacles[id].position = new THREE.Vector3(obstacles[id].p.x,obstacles[id].p.y,obstacles[id].p.z)
            this.obstacles[id].object.setRotationFromQuaternion(new THREE.Quaternion(update.q.i, update.q.j, update.q.k, update.q.w))

            this.obstacles[id].object.scale.set(update.scale.x, update.scale.y, update.scale.z)
        } else {

            // let obstacle = obstacles[id];

            let name = update.asset_name.replaceAll('"', '');
            // console.log(obstacle,name)
            if (this.world.assets.assets[name] != undefined) {
                let asset = new Asset(this.world.assets.assets[name], this.world);
                this.obstacles[id] = asset;
                console.log("Loaded dynamic Object", id)
            }
        }
    }

    public removeObstacle(id: string) {
        if (this.obstacles[id].object != undefined) {
            this.world.graphicsWorld.remove(this.obstacles[id].object);
        }
        delete this.obstacles[id];
    }

}