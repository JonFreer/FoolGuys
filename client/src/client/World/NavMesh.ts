import * as THREE from "three";
import { World } from "./World";

export class NavMesh{

    public nav_mesh_group: THREE.Group;
    public colliders : (THREE.LineSegments|null|THREE.Group)[] = [];

    constructor(world:World){

        this.nav_mesh_group= new THREE.Group()
        console.log("location.hostname",location.hostname)


        if (location.hostname == 'localhost') {
            console.log("adding nav mesh")
            world.graphicsWorld.add(this.nav_mesh_group)
        }

    }

    public load_nav_mesh(data: any){
        console.log(data)
        let colours = [0xffff00,0xffffff,0x00ff00,0x00ffff,0xff00ff,0x0000ff,0x00ffff]
        const geometry = new THREE.BoxGeometry( 1, 1, 1 ); 
        const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} ); 
        const cube = new THREE.Mesh( geometry, material ); 
        cube.position.y = 100
        this.nav_mesh_group.add( cube );
        let index = 0;
        for (const [coordinate, tile] of Object.entries(data)) {
            // console.log(`${key}: ${value}`);
            
            const geometry = new THREE.BufferGeometry();
            let vertices_data = (tile as any)["vertices"].flat();
            let polygons_data = (tile as any)["polygons"].map((x: any)=> x["indices"]).flat();

            const vertices = new Float32Array(vertices_data);
            const indices = polygons_data;

            geometry.setIndex( indices );
            geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );  

            const material = new THREE.LineBasicMaterial( { color: colours[index%colours.length], linewidth: 2 } );

            const mesh = new THREE.LineSegments( geometry, material);

            this.nav_mesh_group.add(mesh)

            console.log(vertices,indices);
            index +=1;


        }
    }
       
}