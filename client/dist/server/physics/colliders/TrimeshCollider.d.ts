import * as CANNON from 'cannon-es';
import { Object3D } from 'three';
export declare class TrimeshCollider {
    mesh: any;
    options: any;
    body: CANNON.Body;
    debugModel: any;
    constructor(mesh: Object3D, options: any);
}
