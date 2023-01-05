import * as THREE from "three";
import { UniformsUtils } from "three";

export class Floor {

    public object: THREE.Mesh;

    constructor(gltf: any) {
        const splatting_patterns = new THREE.TextureLoader().load("assets/SplattingPatterns.png");
        const splat_map = new THREE.TextureLoader().load("assets/SplatMap.png");
        splatting_patterns.wrapS = THREE.RepeatWrapping;
        splatting_patterns.wrapT = THREE.RepeatWrapping;
        splatting_patterns.repeat.x = 200;
        splatting_patterns.repeat.y = 200;

        const vShader = /* glsl */`
            #include <common>
            #include <fog_pars_vertex>
            #include <shadowmap_pars_vertex>
        
            varying vec2 v_uv;  
            varying vec4 world_pos;  
            void main() {
            v_uv = uv;
            world_pos =   vec4(position,1.0);
        
            #include <beginnormal_vertex>
            #include <morphnormal_vertex>
            #include <skinbase_vertex>
            #include <skinnormal_vertex>
            #include <defaultnormal_vertex>
            #include <begin_vertex>
            #include <morphtarget_vertex>
            #include <skinning_vertex>
            #include <project_vertex>
            #include <worldpos_vertex>
            #include <shadowmap_vertex>
            #include <fog_vertex>
        }`

        const fShader = /* glsl */ `

    
        #include <common>
        #include <packing>
        #include <fog_pars_fragment>
        #include <bsdfs>
        #include <lights_pars_begin>
        #include <shadowmap_pars_fragment>
        #include <shadowmask_pars_fragment>
        #include <dithering_pars_fragment>

        varying vec2 v_uv;
        uniform sampler2D splatting_patterns;
        uniform sampler2D splat_map;

        // varying vec4 world_pos;  
        // uniform vec2 u_mouse;
        // uniform vec2 u_resolution;
        // uniform vec3 pos;
        
        // uniform float u_time;

        void main() {

            // vec2 uv_vec = vec2(mod(v_uv.x*20.0,1.0),mod(v_uv.y*20.0,1.0));
            vec2 uv_vec = vec2(v_uv.x*30.0,v_uv.y*30.0);

            vec4 splat_val = texture2D(splat_map, v_uv);
            vec4 pattern_val = texture2D(splatting_patterns, uv_vec);
            gl_FragColor = vec4(1.0,0.0,0.0,1.0).rgba; // pattern_val.rgba;

            if(splat_val.x>0.9){
                float val = pattern_val.x/15.0;
                gl_FragColor = vec4(val,val,val,1.0)+ vec4(0.5,0.5,0.5,1.0).rgba ;
            }
            if(splat_val.z>0.9){
                float val = 0.5-pattern_val.y/1.0;
                gl_FragColor =  vec4(val,val,val,1.0)+ vec4(1.0,0.86,0.04,1.0).rgba;
            }
            #include <fog_fragment>
            #include <dithering_fragment>

        }
        `

        const uniforms =  UniformsUtils.merge([{
            u_time: { value: 0.0 },
            splatting_patterns: { value:  splatting_patterns},
            splat_map : {value:splat_map}
        },]);

        const material = new THREE.ShaderMaterial({
            vertexShader: vShader,
            fragmentShader: fShader,
            uniforms,
            transparent: true,
            
        });

        gltf.material = material;
        this.object= gltf;
    }
}