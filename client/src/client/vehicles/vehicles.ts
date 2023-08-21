import * as THREE from "three";
import { VehicleUpdate } from "../../../../server/bindings/VehicleUpdate";
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'
import { Asset } from "../World/Asset";
import { World } from "../World/World";



export class Vehicles{

    public vehicles: { [id: string]: Asset } = {}
    private world: World;

    constructor(world: World) {
        this.world = world;
    }

    public updateVehicles(updates: Record<string, VehicleUpdate>) {

        Object.keys(updates).forEach((r) => {
            this.updateVehicle(r, updates[r]);
        });

        Object.keys(this.vehicles).forEach((id) => {
            if (updates[id] == undefined) {
                this.removeVehicle(id)
            }
        })
    }

    private updateVehicle(id: string, update: VehicleUpdate) {
        // console.log(obstacles)
        if (this.vehicles[id] != undefined) {

            new TWEEN.Tween(this.vehicles[id].object.position)
                .to(
                    {
                        x: update.p.x,
                        y: update.p.y,
                        z: update.p.z,
                    },
                    0
                )
                .start()

            this.vehicles[id].object.setRotationFromQuaternion(new THREE.Quaternion(update.q.i, update.q.j, update.q.k, update.q.w))
            this.vehicles[id].object.scale.set(10, 10, 10)
        } else {

            // let obstacle = obstacles[id];

            let name = update.asset_name.replaceAll('"', '');
            // console.log(obstacle,name)
            if (this.world.assets.assets[name] != undefined) {
                let asset = new Asset(this.world.assets.assets[name], this.world);
                this.vehicles[id] = asset;
                console.log("Loaded dynamic Object", id)
            }
        }
    }



    public removeVehicle(id: string) {
        if (this.vehicles[id].object != undefined) {
            this.world.graphicsWorld.remove(this.vehicles[id].object);
        }
    
        delete this.vehicles[id];
    }
}


