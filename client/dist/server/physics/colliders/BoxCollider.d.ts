import * as CANNON from 'cannon-es';
import * as THREE from 'three';
export declare class BoxCollider {
    options: any;
    body: CANNON.Body;
    debugModel: THREE.Mesh;
    constructor(options: any);
}
