import * as THREE from "three";
import { World } from "./World";

export class Debug{

    public debug_group: THREE.Group;
    public colliders : (THREE.LineSegments|null)[] = [];

    constructor(world:World){

        this.debug_group= new THREE.Group()
        world.graphicsWorld.add(this.debug_group)

    }

    public load_state(data:any){
        this.debug_group.clear()

        let colliders = data.colliders.colliders.items
        
        for (let i = 0; i < colliders.length; i++) {
            let collider = colliders[i]

            if (collider.Occupied) {
                console.log(collider.Occupied.value.shape)
                if (collider.Occupied.value.shape.TriMesh) {
                    const geometry = new THREE.BufferGeometry();
                    
                    let vert_array =[]
                    for( let i =0; i< collider.Occupied.value.shape.TriMesh.vertices.length; i++){
                        vert_array.push(collider.Occupied.value.shape.TriMesh.vertices[i][0])
                        vert_array.push(collider.Occupied.value.shape.TriMesh.vertices[i][1])
                        vert_array.push(collider.Occupied.value.shape.TriMesh.vertices[i][2])
                    }
                    const vertices = new Float32Array(vert_array)

                    let indices_array =[]
                    for( let i =0; i< collider.Occupied.value.shape.TriMesh.indices.length; i++){
                        indices_array.push(collider.Occupied.value.shape.TriMesh.indices[i][0])
                        indices_array.push(collider.Occupied.value.shape.TriMesh.indices[i][1])
                        indices_array.push(collider.Occupied.value.shape.TriMesh.indices[i][2])
                    }

                    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                    geometry.setIndex( indices_array );
                    const material = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 2 } );
                    const mesh = new THREE.LineSegments(geometry, material);
                    
                    this.debug_group.add(mesh)
                    this.colliders.push(mesh)
     
                }else if (collider.Occupied.value.shape.ConvexPolyhedron) {
                    const geometry = new THREE.BufferGeometry();
                    //collider.Occupied.value.shape.TriMesh.vertices
                    
                    let vert_array =[]
                    for( let i =0; i< collider.Occupied.value.shape.ConvexPolyhedron.points.length; i++){
                        vert_array.push(collider.Occupied.value.shape.ConvexPolyhedron.points[i][0])
                        vert_array.push(collider.Occupied.value.shape.ConvexPolyhedron.points[i][1])
                        vert_array.push(collider.Occupied.value.shape.ConvexPolyhedron.points[i][2])
                    }

                    let indices_array =[]
                    for( let i =0; i< collider.Occupied.value.shape.ConvexPolyhedron.vertices_adj_to_face.length; i++){
                        indices_array.push(collider.Occupied.value.shape.ConvexPolyhedron.vertices_adj_to_face[i])
                    }


                    const vertices = new Float32Array(vert_array)
                    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                    geometry.setIndex( indices_array );
                    const material = new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 4 } );
                    const mesh = new THREE.LineSegments(geometry, material);

                    let pos = collider.Occupied.value.pos.translation;
                    let rot = collider.Occupied.value.pos.rotation;
                    mesh.position.set(pos[0],pos[1],pos[2])
                    mesh.rotation.setFromQuaternion(new THREE.Quaternion(rot[0],rot[1],rot[2],rot[3]))
                    this.debug_group.add(mesh)
                    this.colliders.push(mesh)
                    // console.log("trimesh")
                    // console.log(collider.Occupied.value.pos)

                } else if (collider.Occupied.value.shape.Capsule) {
                    let capsule = collider.Occupied.value.shape.Capsule
                    const geometry = new THREE.CapsuleGeometry( capsule.radius, capsule.segment.b[0]*2, 4, 10 );
                    console.log(collider.Occupied)
                    const material = new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 4 } );
                    const mesh = new THREE.LineSegments( geometry, material );

                    let pos = collider.Occupied.value.pos.translation;

                    console.log(pos)

                    let rot = collider.Occupied.value.pos.rotation;
                    mesh.position.set(pos[0],pos[1],pos[2])
                    mesh.rotation.setFromQuaternion(new THREE.Quaternion(rot[0],rot[1],rot[2],rot[3]))

                    this.debug_group.add(mesh)
                    this.colliders.push(mesh)
                }else if (collider.Occupied.value.shape.Cuboid) {
                    let capsule = collider.Occupied.value.shape.Cuboid
                    const geometry = new THREE.CapsuleGeometry( 1, 1, 4, 10 );
                    console.log(collider.Occupied)
                    const material = new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 4 } );
                    const mesh = new THREE.LineSegments( geometry, material );

                    let pos = collider.Occupied.value.pos.translation;

                    console.log(pos)

                    let rot = collider.Occupied.value.pos.rotation;
                    mesh.position.set(pos[0],pos[1],pos[2])
                    mesh.rotation.setFromQuaternion(new THREE.Quaternion(rot[0],rot[1],rot[2],rot[3]))

                    this.debug_group.add(mesh)
                    this.colliders.push(mesh)
                }else{
                    this.colliders.push(null)
                }


            }

        }

    }

    public update_state(data:any){
        let bodies = data.bodies.bodies.items
        // console.log(bodies)
        for (let i = 0; i < bodies.length; i++) {
            let body = bodies[i]

            if (body.Occupied) {
                // console.log(body.Occupied.value)
                let pos = body.Occupied.value.pos.position

                let collider = this.colliders[body.Occupied.value.colliders[0].index]
                // console.log(body.Occupied.value.colliders[0])
                if(collider){
                    collider.position.set(pos.translation[0],pos.translation[1],pos.translation[2])
                    collider.rotation.setFromQuaternion(new THREE.Quaternion(pos.rotation[0],pos.rotation[1],pos.rotation[2],pos.rotation[3]))
                    console.log("set pos")
                }

            }
        }

    }
}