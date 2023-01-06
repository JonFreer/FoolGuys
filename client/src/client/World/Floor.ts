import * as THREE from "three";
import { UniformsLib, UniformsUtils } from 'three'
import { ShaderChunkLoader } from "../shaders/shader_chunks";

export class Floor {

    public object: THREE.Mesh;

    constructor(gltf: any) {
        const splatting_patterns = new THREE.TextureLoader().load("assets/SplattingPatterns.png");
        const splat_map = new THREE.TextureLoader().load("assets/SplatMap.png");
        splat_map.flipY = false;
        const noise = new THREE.TextureLoader().load("assets/noise_perlin.png");
        splatting_patterns.wrapS = THREE.RepeatWrapping;
        splatting_patterns.wrapT = THREE.RepeatWrapping;
        splatting_patterns.repeat.x = 200;
        splatting_patterns.repeat.y = 200;

        const vShader = /* glsl */`
            varying vec3 vViewPosition;

            #include <common>
            #include <uv_pars_vertex>
            #include <envmap_pars_vertex>
            #include <fog_pars_vertex>
            #include <normal_pars_vertex>
            #include <shadowmap_pars_vertex>
            varying vec4 vBigShadowDirectionalCoords;
            uniform mat4 bigShadowMatrix;

            #include <world_pos_pars>
            #include <uv_pars_vertex>
            varying vec2 vUv;
 
            void main() {

                vUv = vec2(uv.x,uv.y);
                #include <uv_vertex>
                #include <beginnormal_vertex>
                #include <defaultnormal_vertex>
                #include <normal_vertex>
                #include <begin_vertex>
                #include <project_vertex>
                vViewPosition=-mvPosition.xyz;

                #include <world_pos>
                vec4 worldPosition = vWorldPos;

                #include <envmap_vertex>
                #include <shadowmap_vertex>
                vec3 bigShadowWorldNormal = inverseTransformDirection(transformedNormal, viewMatrix);
                vec4 bigShadowWorldPosition = modelMatrix * vec4(transformed, 1.) + vec4(bigShadowWorldNormal * 0.05, 0);
                vBigShadowDirectionalCoords = bigShadowMatrix * bigShadowWorldPosition;

                #include <fog_vertex>

        }`

        const fShader = /* glsl */ `
        #include <common>
        #include <packing>
        #include <uv_pars_fragment>
        #include <map_pars_fragment>
        #include <alphatest_pars_fragment>
        #include <specularmap_pars_fragment>
        #include <cube_uv_reflection_fragment>
        #include <bsdfs>
        #include <lights_pars_begin>
        #include <normal_pars_fragment>
        #include <lights_phong_pars_fragment>
        #include <shadowmap_pars_fragment>
        #include <normalmap_pars_fragment>
        #include <world_pos_pars>
        #include <conditionals>
        #include <linear_step>
        #include <bg_fog_pars>
        #include <big_shadow_pars>

        varying vec2 vUv;
        uniform sampler2D splatting_patterns;
        uniform sampler2D splat_map;
        uniform sampler2D noise;

        uniform float time;
        uniform float waterProgress;

        const vec3 waterColor = WATER_COLOR;
        const vec3 waterTopColor = WATER_TOP_COLOR;

        uniform vec3 diffuse;
        uniform vec3 emissive;
        uniform vec3 specular;
        uniform float shininess;
        uniform float opacity;

        const vec3 darkerBaseTerrain = vec3(0.51, 0.9, 0.62);
        const vec3 grassColor = vec3(0.476, 0.678, 0.365);
        const vec3 paveColor = vec3(0.663, 0.639, 0.659);
        const vec3 sandLight = vec3(1., 0.976, 0.78);
        const vec3 sandDark = vec3(0.99, 0.836, 0.45);
        const vec3 roadLight = vec3(0.843, 0.82, 0.812) * 0.98;
        const float roadLighter = 0.05;
        const vec3 roadDark = roadLight * 0.91;
        uniform vec3 playerPos;

        void main() {
            vec4 diffuseColor =  vec4(1.0,1.0,0.0, 1.);// vec4(diffuse, 1.);
            // vec4 diffuse = vec4(1.0,0.0,0.0,0.0);
            vec4 splatting = texture2D(splat_map, vUv);
            float mPavement = splatting.r;
            float mGrass = splatting.g;
            float mRoad = splatting.b;
            float mSand = 1. - splatting.a;

            vec3 patterns = texture2D(splatting_patterns, vWorldPos.xz * 0.223).rgb;
            float tint = texture2D(noise, vWorldPos.xz * 0.004).r;

            float pattern = patterns.b;
            float pattern2 = patterns.g;
            float pattern3 = patterns.r;

            tint += smoothstep(3.2, -1., vWorldPos.y) * 3. + smoothstep(1.6, -0.5, vWorldPos.y) * 4.2;

            float tint2 = 1. - smoothstep(0., 0.67, tint);
            diffuseColor.rgb = mix(diffuse.rgb, diffuse.rgb * darkerBaseTerrain, tint2 * 0.7);

            float sand = smoothstep(0.1, 0.87, mSand);
            float sand2 = step(pattern2, smoothstep(0.5, 0.8, mSand));
            float sandPattern = smoothstep(0.1, 0.9, pattern2 * sand);
            vec3 sandColor = mix(sandLight, sandDark, tint * 0.2);
            diffuseColor.rgb = mix(diffuseColor.rgb, sandColor - sandPattern * 0.064, sand * sand2);

            
            float grass = smoothstep(0.1, 0.88, mGrass);
            float grass2 = step(pattern, smoothstep(0.1, 1., mGrass));
            float grassPattern = smoothstep(0.2, 1., pattern * grass);
            diffuseColor.rgb = mix(diffuseColor.rgb, grassColor + grassPattern * 0.1, grass * grass2);

            
            float pave = smoothstep(0.61, 0.62, mPavement);
            float pave2 = step(pattern3, smoothstep(0.6, 0.9, mPavement));
            float pavePattern = smoothstep(0.1, 1., pattern3 * pave);
            diffuseColor.rgb = mix(diffuseColor.rgb, paveColor + pavePattern * 0.075 - tint * 0.1, pave * pave2);

            vec3 roadColor = mix(roadLight, roadDark, tint2);
            float road = smoothstep(0.4, 0.41, smoothstep(0.2, 0.8, mRoad));
            vec3 roadPattern2 = (smoothstep(0., pattern, smoothstep(0.69, 0.4, mRoad)) * 0.05 + smoothstep(0.5, 0.49, mRoad) * 0.023) * vec3(1., 1., 0.6);
            float roadPattern = smoothstep(0., pattern, smoothstep(0.6, 1.1, mRoad)) * roadLighter;
            diffuseColor.rgb = mix(diffuseColor.rgb, roadColor + roadPattern * 2. - roadPattern2, road);

            // vec3 pLen = playerPos - vWorldPos.xyz;
            // float pFalloff = smoothstep(0.5, 0.2, abs(pLen.y));
            // float pDist = dot(pLen, pLen) * 2.;
            // float pS = smoothstep(1.4, -1., pDist) * 1.1 + smoothstep(0.6, -1.8, pDist) * 8.;
            // diffuseColor.rgb = mix(diffuseColor.rgb, (diffuseColor.rgb - 0.1) * 0.6, diffuseColor.rgb * pS * 0.08 * vec3(1.8, 1.8, 1.1) * pFalloff);

            #include <normal_fragment_begin>

            float specularStrength = 0.0;
            vec3 totalEmissiveRadiance = emissive;
            ReflectedLight reflectedLight = ReflectedLight(vec3(0.0), vec3(0.0), vec3(0.0), vec3(0.0));

            #include <lights_phong_fragment>
            #include <lights_fragment_begin>
            #include <lights_fragment_maps>
            #include <lights_fragment_end>

            vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.indirectSpecular + totalEmissiveRadiance;
            gl_FragColor = vec4(outgoingLight, diffuseColor.a);

            #include <bg_fog>
            #include <water_depth_frag>
        }
        `

        const uniforms = UniformsUtils.merge([
            UniformsLib.lights,
            UniformsLib.fog,
            UniformsLib.specularmap,
            UniformsLib.common,
            {
                time: { value: 0.0 },
                waterProgress: {value:0.0},
                splatting_patterns: { value: splatting_patterns },
                splat_map: { value: splat_map },
                noise: { value: noise },
                diffuse: { value: new THREE.Color(10150503).offsetHSL(0, -.3, .02) },
                emissive: { value: new THREE.Color(0) }, 
                specular: { value: new THREE.Color(1118481) },
                shininess: { value: 0 },
                opacity: {value:0},
                playerPos: { value: new THREE.Vector3() }
                
        },

    ]);

        const material = new THREE.ShaderMaterial({
            defines:ShaderChunkLoader.defines,
            vertexShader: vShader,
            fragmentShader: fShader,
            uniforms,
            lights: true
        });

        gltf.material = material;
        this.object = gltf;

    }


    update(time:number){
        (this.object.material as THREE.ShaderMaterial).uniforms.time.value =  time;
    }
}