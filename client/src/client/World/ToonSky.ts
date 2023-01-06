import * as THREE from "three";
import { ShaderChunkLoader } from "../shaders/shader_chunks";
import { World } from "./World";

export class ToonSky {

    public object: THREE.Mesh;

    constructor(world:World) {
        const clouds = new THREE.TextureLoader().load("assets/clouds.png")
        clouds.flipY=false;
        clouds.wrapS = THREE.RepeatWrapping;
        clouds.repeat.x = 10;

        const vShader = /*glsl*/`
        varying vec2 vUv;
        void main(){
            vUv = uv;
            gl_Position=projectionMatrix * modelViewMatrix * vec4(position, 1.);
        }`;

        const fShader = /*glsl*/`
        varying vec2 vUv;
        const vec3 skyBottom = SKY_BOTTOM_COLOR;
        const vec3 skyTop = SKY_TOP_COLOR;
        const vec3 waterColor = WATER_COLOR;
        uniform float time;
        uniform sampler2D clouds;
        void main(){
            float skyProgress = smoothstep(0., 1., (vUv.y * 2. - 1.) * 4.) * 1.5;
            vec3 skyColor = mix(skyBottom, skyTop, skyProgress);
            float waterProgress = 1. - smoothstep(0.502, 0.5, vUv.y);
            vec3 watColor = mix(waterColor, SKY_BOTTOM_COLOR, smoothstep(0.49, 0.502, vUv.y) * 0.5);
            skyColor = mix(watColor, skyColor, waterProgress);
            vec2 cuv = vec2(0.);
            cuv.y = 1. - clamp(max(0., vUv.y - 0.5) * 18., 0., 1.);
            cuv.x = vUv.x * 4. - time * 0.002;
            vec4 c = texture2D(clouds, cuv).rgba;
            c.rgb /= (c.a + 0.001);
            float alpha = smoothstep(0.4 + cuv.y * 0.5, 0.9, c.a);
            skyColor = mix(skyColor, c.rgb, alpha * waterProgress * step(0.01, cuv.y) * 0.75 * (1. - cuv.y));
            gl_FragColor = vec4(skyColor, 1.);
        } `

        const uniforms = { 
            time: {value:0.0},
            clouds: { value: clouds }
        }

            
        const material = new THREE.ShaderMaterial({
            defines:ShaderChunkLoader.defines,
            vertexShader: vShader,
            fragmentShader: fShader,
            uniforms:uniforms
        });

        const geometry = new THREE.SphereBufferGeometry(1, 32, 15).scale(-1, 1, 1); //turn shere inside out
        // const material = new THREE.MeshBasicMaterial();
        this.object = new THREE.Mesh(geometry,material);
        this.object.scale.setScalar(800);
        world.graphicsWorld.add(this.object);
    }

   

}