import { ShaderChunk } from 'three';
import * as THREE from 'three';

import water_depth_frag from './water_depth_frag.glsl';
import world_pos_pars from './world_pos_pars.glsl';
import world_pos from './world_pos.glsl';
import conditionals from './conditionals.glsl';
import linear_step from './linear_step.glsl';
import bg_fog_pars from './bg_fog_pars.glsl';
import big_shadow_pars from './big_shadow_pars.glsl';
import bg_fog from './bg_fog.glsl';
import depth_dither from './depth_dither.glsl';
import luma from './luma.glsl';
import blend_modes from './blend_modes.glsl';



export class ShaderChunkLoader {

    static load_shader_chunks(){
        console.log(water_depth_frag);
       ShaderChunk["water_depth_frag" ] = water_depth_frag;
       ShaderChunk["world_pos_pars"] = world_pos_pars;
       ShaderChunk["world_pos"] = world_pos;
       ShaderChunk["conditionals"] = conditionals;
       ShaderChunk["linear_step"] = linear_step;
       ShaderChunk["bg_fog_pars"] = bg_fog_pars;
       ShaderChunk["big_shadow_pars"] = big_shadow_pars;
       ShaderChunk["bg_fog"] = bg_fog;
       ShaderChunk["depth_dither"] = depth_dither;
       ShaderChunk["luma"] = luma;
       ShaderChunk["blend_modes"] = blend_modes;
 
    }

    static defines = {
        SKY_TOP_COLOR: this.glsl_parse(new THREE.Color("#3fdefa")),
        SKY_BOTTOM_COLOR: this.glsl_parse(new THREE.Color("#cafced")),
        WATER_TOP_COLOR: this.glsl_parse(new THREE.Color("#A9D6FB").offsetHSL(-.02, .2, -.2)),
        WATER_COLOR: this.glsl_parse(new THREE.Color("#6DAFE5").offsetHSL(-.01, 0, 0)),
        WATER_BASE_LEVEL: "0.0",
        WATER_MAX_DEPTH: "-4.0",
        WATER_FOAM_HEIGHT: .15,
        BASE_TRANSITION_COLOR: this.glsl_parse(new THREE.Color(.222, .222, .467)),
        ROAD_GROUND_COLOR: this.glsl_parse(new THREE.Color(203 / 255, 237 / 255, 229 / 255))
    }


    static glsl_parse(vec:THREE.Vector3 | THREE.Color){
        switch(vec.constructor) {
            case THREE.Vector3:
                vec = vec.clone() as THREE.Vector3;
                return 'vec3(' + vec.x.toFixed(3) + "," + vec.y.toFixed(3)  + "," + vec.z.toFixed(3) +")";
            case THREE.Color:
                vec = vec as THREE.Color
                return 'vec3(' + vec.r.toFixed(3) + "," + vec.g.toFixed(3)  + "," + vec.b.toFixed(3) +")";
        }
    }

    
}