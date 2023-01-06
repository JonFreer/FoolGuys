import * as THREE from 'three';
import { UniformsLib, UniformsUtils } from 'three';
import { World } from './World';
import {MeshSurfaceSampler} from 'three/examples/jsm/math/MeshSurfaceSampler';
export class Grass{

    public object: THREE.InstancedMesh;
    private ss_lower: number = 0.13;
    private ss_upper: number = 0.15;
    private dummy: THREE.Object3D = new THREE.Object3D();
    private count : number = 100000;

    constructor(world:World){

        const noise_perlin = new THREE.TextureLoader().load( "assets/noise_perlin.png");
        noise_perlin.wrapS = THREE.RepeatWrapping;
        noise_perlin.wrapT = THREE.RepeatWrapping;
        noise_perlin.repeat.x = 200;
        noise_perlin.repeat.y = 200;
        // const gui = new GUI()
        // const cubeFolder = gui.addFolder('Cube')
        // cubeFolder.add(this, 'ss_lower', 0, 1).onChange((value) =>{
        //     (this.object.material as THREE.ShaderMaterial).uniforms.ss_lower.value = value;
        // })
        // cubeFolder.add(this, 'ss_upper', 0, 1).onChange((value) =>{
        //     (this.object.material as THREE.ShaderMaterial).uniforms.ss_upper.value = value;
        // })
        

     


        const waterVertexShader = /* glsl */`
                uniform float u_time;
                varying vec2 v_uv;  
                varying vec4 world_pos;  
                uniform vec3 camera_position;
                uniform sampler2D noise_texture;
                 void main() {
                    float speed = 2.0;
                    
                    
                    world_pos =   vec4(position,1.0);

                    vec4 target_pos = instanceMatrix * vec4(0.0,0.0,0.0,1.0);

                    vec2 v_uv_time =  vec2(target_pos.x+ u_time/speed,target_pos.z+ u_time/speed) /100.0;

                    vec4 noise = texture2D(noise_texture, v_uv_time)-0.5;
                    float delta = 3.141/2.0+atan(target_pos.z-camera_position.z, target_pos.x-camera_position.x); 

                    v_uv = v_uv_time;
                 
                    // VERTEX POSITION
                    vec3 p = position.xyz;

                    float new_x = p.x*cos(delta) - p.z*sin(delta);
                    float new_z = p.z*cos(delta) + p.x*sin(delta);

                    vec4 mvPosition =  vec4(new_x, p.y, new_z, 1.0);

                    if(p.y>0.0){
                        mvPosition.x = mvPosition.x + noise.x;
                        mvPosition.z = mvPosition.z + noise.z;
                    }

                    #ifdef USE_INSTANCING
                        mvPosition = instanceMatrix * mvPosition;
                    #endif


                    
                    // // DISPLACEMENT
                    
                    // // here the displacement is made stronger on the blades tips.
                    // float dispPower = 1.0 - cos( uv.y * 3.1416 / 2.0 );
                    
                    // float displacement = sin( mvPosition.z + time * 10.0 ) * ( 0.1 * dispPower );
                    // mvPosition.z += displacement;
                    
                    // //
                    
                    vec4 modelViewPosition = modelViewMatrix * mvPosition;
                    gl_Position = projectionMatrix * modelViewPosition;
                
                    
                }
        `
        const waterFragmentShader = /* glsl */`
            varying vec2 v_uv;  
            varying vec4 world_pos;  
            uniform sampler2D noise_texture;
            void main() {

                    gl_FragColor = mix(vec4(0.29,0.8,0.16, 1.0),vec4(0.6,1.0,0.6, 1.0),world_pos.y*2.0).rgba;
                    // gl_FragColor =texture2D(noise_texture,v_uv);
                
            }
        `

        const uniforms =  UniformsUtils.merge([{
            u_time: { value: 0.0 },
            camera_position: {value:new THREE.Vector3()},
            noise_texture: { value:  noise_perlin},
        },]);

        const material = new THREE.ShaderMaterial({
            vertexShader: waterVertexShader,
            fragmentShader: waterFragmentShader,
            uniforms,
            transparent: true,
            
        });

        const points = [
            new THREE.Vector3(-0.15, 0, 0),//c
            new THREE.Vector3(0.15, 0, 0),//b
            new THREE.Vector3(0, 0.5, 0),//a  
        ];

        let geometry = new THREE.BufferGeometry()
        geometry.setFromPoints(points)
        geometry.computeVertexNormals()
        
        console.log("Atributes", geometry.attributes)

        // const count = 100;

        // geometry.rotateX
        // const material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
        const mesh = new THREE.InstancedMesh( geometry, material ,this.count);
        mesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
        // mesh.rotateX( - Math.PI / 2);
        // plane.translateZ(10);
        this.object = mesh;

       

        // this.object.s
        world.graphicsWorld.add(this.object);

    }

    update(time:number, camera_position:THREE.Vector3) {
        // console.log(delta);
        (this.object.material as THREE.ShaderMaterial).uniforms.camera_position.value =  camera_position;
        (this.object.material as THREE.ShaderMaterial).uniforms.u_time.value =  time;
     
    }

    updateGrass(land_mesh:THREE.Mesh){
        const sampler = new MeshSurfaceSampler( land_mesh )
        .setWeightAttribute( 'color' )
        .build();

        console.log(land_mesh.geometry.attributes);

        const _position = new THREE.Vector3();

        for( let i = 0; i < this.count; i++){

            sampler.sample( _position);

            // this.dummy.position.set(( Math.random() - 0.5 ) * 10 -20,
            // 0,
            // ( Math.random() - 0.5 ) * 10 
            //  );

             const rand = Math.random()/2+0.8*3;
             this.dummy.position.copy( _position );
             this.dummy.scale.set(rand,rand,rand)
             this.dummy.updateMatrix();
             this.object.setMatrixAt( i, this.dummy.matrix );
        }
        this.object.instanceMatrix.needsUpdate = true;
    }
   

}