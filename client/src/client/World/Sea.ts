import * as THREE from 'three';
import { UniformsLib, UniformsUtils } from 'three';
import { World } from './World';
import { GUI } from 'dat.gui'

export class Sea{

    public object: THREE.Mesh;
    private ss_lower: number = 0.13;
    private ss_upper: number = 0.15;


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
                #include <common>
                #include <world_pos_pars>

                uniform float u_time;
                varying vec2 v_uv;  
                
                void main() {
                 v_uv = uv;
                 
                 #include <begin_vertex>
                 #include <world_pos>
                 gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x,position.y,position.z+cos(u_time)/10.0, 1.0);
                }
        `
        const waterFragmentShader = /* glsl */`
            uniform float u_time;
            uniform float ss_upper_rings;
            uniform float ss_lower_rings;
            uniform float ss_upper_specks;
            uniform float ss_lower_specks;
            uniform sampler2D noise_texture;
            varying vec2 v_uv;
            #include <world_pos_pars>
            void main() {
                
                    float scale = 100.0;
                    vec2 uv = vWorldPos.xz / scale;

                    vec2 v_uv_time =  vec2(uv.x + u_time/500.0,uv.y+ u_time/500.0);
                    vec2 v_uv_time_2 =  vec2(uv.x - u_time/500.0,uv.y - u_time/2000.0);
                    float noise_val_ring = (texture2D(noise_texture, v_uv_time)*texture2D(noise_texture, v_uv_time_2)/2.0).x;

                    if(noise_val_ring > ss_lower_rings && noise_val_ring < ss_upper_rings){
                        noise_val_ring = 1.0;
                    }else{
                        noise_val_ring = 0.0;
                    }
             
                    vec2 v_uv2 = vec2(v_uv_time.x*10.0,v_uv_time.y*10.0);

                    vec2 v_uv3 = vec2(v_uv_time_2.x*10.0,v_uv_time_2.y*10.0);


                    float cos_theta = 0.707;
                    float sin_theta = 0.8509;

                    vec2 v_uv3_rotated = vec2((v_uv3.x * cos_theta - v_uv3.y * sin_theta)*8.0, v_uv3.x * sin_theta + v_uv3.y * cos_theta);
                    
                    float noise_val_speck = (texture2D(noise_texture, v_uv3_rotated) * texture2D(noise_texture, v_uv2)).x;


                    if(noise_val_speck>ss_lower_specks && noise_val_speck < ss_upper_specks){
                        noise_val_speck = 1.0;
                    }else{
                        noise_val_speck = 0.0;
                    }

                    if(noise_val_speck>0.9){
                        gl_FragColor = vec4(1.0,1.0,1.0, 1.0).rgba;
                    }else{
                        if(noise_val_ring>0.1){
                            gl_FragColor = vec4(0.5,0.85,1.0, 0.6).rgba;
                        }else{
                            gl_FragColor = vec4(0.33333,0.7882,1.0, 0.6).rgba;
                        }
                        
                    }

                    // gl_FragColor = vec4(noise_val_speck,noise_val_speck,noise_val_speck, 1.0).rgba;

                
            }
        `

        const uniforms =  UniformsUtils.merge([{
            u_time: { value: 0.0 },
            ss_lower_rings : {value : this.ss_lower},
            ss_upper_rings : {value:this.ss_upper},
            ss_lower_specks : {value : 0.06},
            ss_upper_specks : {value:0.1},
            noise_texture: { value:  noise_perlin},
        },]);

        const material = new THREE.ShaderMaterial({
            vertexShader: waterVertexShader,
            fragmentShader: waterFragmentShader,
            uniforms,
            transparent: true,
            
        });

		const geometry = new THREE.PlaneGeometry( 1000, 1000 );
        geometry.rotateX
        // const material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
        const plane = new THREE.Mesh( geometry, material );
        plane.rotateX( - Math.PI / 2);
        this.object = plane;

        world.graphicsWorld.add(this.object);

    }

    update(time:number) {
        (this.object.material as THREE.ShaderMaterial).uniforms.u_time.value = time;
    }

}