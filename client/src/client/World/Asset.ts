import * as THREE from "three";
import { TextureLoader } from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { ShaderChunkLoader } from "../shaders/shader_chunks";
import { UniformsLib, UniformsUtils } from 'three'
import { World } from "./World";
export class Asset {

    public object: THREE.Mesh ;

    constructor(gltf:GLTF, world: World){
        this.object = new THREE.Mesh();
        const texture_map = new THREE.TextureLoader().load( "assets/Assets_Gradients.png");
        texture_map.flipY = false;
        const data_map = new THREE.TextureLoader().load( "assets/Assets_Data.png");
        data_map.flipY = false;
        const vShader = /* glsl */`

varying vec3 vViewPosition;

    #include <common>
    #include <uv_pars_vertex>
    #include <envmap_pars_vertex>
    #include <fog_pars_vertex>
    #include <normal_pars_vertex>
    #include <shadowmap_pars_vertex>
    #include <world_pos_pars>
    uniform float time;
    uniform sampler2D data;
    varying vec2 vData;
    varying vec4 vBigShadowDirectionalCoords;
    uniform mat4 bigShadowMatrix;
    varying vec2 vGradient;
    varying vec2 vUv;
    uniform float effectMult;
    uniform float noLight;
    void main(){
        vUv = uv;
        #include <uv_vertex>
        #include <beginnormal_vertex>
        #include <defaultnormal_vertex>
        #include <normal_vertex>
        #include <begin_vertex>
        vec3 dataTexel = texture2D(data, vUv).rgb;
        vData = dataTexel.rg;
        vec3 offset;
        if (dataTexel.b > 0.2) {float mult2 = smoothstep(0.05, 0.46, dataTexel.b);
        float flagmult = mix(1., 8., smoothstep(0.5, 1., dataTexel.b));
        float mult = effectMult;
            offset.xyz = vec3(cos(time * 3. + transformed.x * 0.4 + transformed.y * 0.3) * 0.06 * mult2 * flagmult, 0., sin(time * 0.8 + transformed.z * -3. + transformed.x * 0.6) * -0.04) * mult;
            transformed += offset;
        } else if (dataTexel.b > 0.1) {
            transformed.y += sin(time) * 0.08 + 0.08;
        }
        #include <project_vertex>
        vViewPosition=-mvPosition.xyz;
        vWorldPos = modelMatrix * vec4(transformed - offset, 1.);
        vec4 worldPosition = vWorldPos;
        vec3 UP = vec3(0., 1., 0.);
        vec3 N = normal;
        vec3 T = normalize(cross(UP, normal));
        vec3 B = cross(normal, UP);
        mat3 tsb = mat3(normalize(T), normalize(B), normalize(N));
        vec4 t = vec4(10., 10., 10., 1.) * viewMatrix;
        vec3 absCam = abs(cameraPosition);
        float m = 0.25;
        vGradient.x = (position * tsb).r + worldPosition.y + length(worldPosition.xyz - cameraPosition) * -0.2 * m + (t.x + t.y + t.z) * 0.2 * m + (max(absCam.x, max(absCam.y, absCam.z))) * 0.3 * m;
        vGradient.y = smoothstep(50., 5., length(worldPosition.xyz - cameraPosition)) * 0.06 * vNormal.z;

        #include <envmap_vertex>
        #include <shadowmap_vertex>
        vec3 bigShadowWorldNormal = inverseTransformDirection(transformedNormal, viewMatrix);
        vec4 bigShadowWorldPosition = worldPosition + vec4(bigShadowWorldNormal * 0.05, 0);
        vBigShadowDirectionalCoords = bigShadowMatrix * bigShadowWorldPosition;

        #include <fog_vertex>
}`

        const fShader = /*glsl*/`
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
            #include <luma>
            #include <blend_modes>
            #include <bg_fog_pars>
            #include <big_shadow_pars>
            uniform float pixelRatio;
            uniform vec3 specular;
            uniform float shininess;
            uniform float time;
            varying vec2 vData;
            varying vec2 vGradient;
            uniform float waterProgress;
            const vec3 waterColor = WATER_COLOR;
            const vec3 waterTopColor = WATER_TOP_COLOR;
            uniform sampler2D noise;
            uniform sampler2D map;
            uniform float effectMult;
            uniform vec3 playerPos;
            uniform vec2 WindowSize;

            varying vec2 vUv;
            void main(){
                // #include <depth_dither>
                vec4 diffuseColor = vec4(1.);
                vec3 diffuseTexel = texture2D(map, vUv * vec2(0.5, 1.)).rgb;
                diffuseColor.rgb *= diffuseTexel;
                vec3 pLen = playerPos - vWorldPos.xyz;
                float pFalloff = smoothstep(0.5, 0.2, abs(pLen.y));
                float pDist = dot(pLen, pLen) * 2.;
                float pS = smoothstep(1.0, -2.5, pDist) * 8.2;
                diffuseColor.rgb = mix(diffuseColor.rgb, (diffuseColor.rgb - 0.2) * 0.5, diffuseColor.rgb * pS * 0.08 * vec3(1.8, 1.8, 1.1) * pFalloff);

                // #include < clouds >
                #include <normal_fragment_begin>

                float rimLightPower = 1.6;
                float rimLightStrength = .19;
                vec3 rimColor = vec3(1., 0., 0.);
                float rightLight = rimLightPower * abs(dot(vNormal, normalize(vViewPosition)));
                rightLight = 1. - smoothstep(.0, 1., rightLight);
                diffuseColor.rgb += vec3(rightLight * rimLightStrength) * vec3(0.9, 1., 0.4);
                vec3 totalEmissiveRadiance = diffuseTexel * vData.g;
                float specularStrength = 0.0;
                ReflectedLight reflectedLight = ReflectedLight(vec3(.0), vec3(.0), vec3(.0), vec3(.0));

                #include <lights_phong_fragment>
                #include <lights_fragment_begin>
                #include <lights_fragment_maps>
                #include <lights_fragment_end>
                vec3 color = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

                #ifndef HAS_WEBXR
                    if (vData.r > 0.1875) {vec3 viewDir = normalize(vViewPosition);
                        vec3 x = normalize(vec3(viewDir.z, 0.0, -viewDir.x));
                        vec3 y = cross(viewDir, x);
                        vec2 matcapUV = vec2(dot(x, normal), dot(y, normal)) * 0.499 + 0.5;
                        matcapUV.y = 1. - matcapUV.y;
                        matcapUV.x = matcapUV.x * 0.5 + 0.5;
                        vec3 matcap = texture2D(map, matcapUV).rgb;
                        vec3 lMatcapColor = matcap * smoothstep(0., 0.1, (luma(reflectedLight.directDiffuse)));
                        vec3 shadeMatcapColor = mix(lMatcapColor, matcap, 0.4 + 0.4 * smoothstep(0., 0.4, luma(matcap))) + reflectedLight.directSpecular;
                        color = mix(color, shadeMatcapColor, 0.30);
                        color += (0. + smoothstep(0.99, 0.995, cos(vGradient.x)) + smoothstep(0.8, 0.81, cos(vGradient.x - 1.1)) + smoothstep(0.93, 0.94, cos(vGradient.x + 3.))) * vGradient.y * 2.1 * smoothstep(1., 0.7, matcap.r) * step(0.32, vData.r) * effectMult;
                    }
                #endif
                gl_FragColor = vec4(color, diffuseColor.a);
                // gl_FragColor = vec4(diffuseColor.rgb, diffuseColor.a);
                #include <bg_fog>
                #include <water_depth_frag>
            }
        `
        const size = new THREE.Vector2();

        const uniforms = UniformsUtils.merge([
            UniformsLib.lights,
            UniformsLib.fog,
            UniformsLib.specularmap,
            UniformsLib.common,
            {
                time: { value: 0.0 },
                waterProgress: {value:0.0},
                diffuse: { value: new THREE.Color(10150503).offsetHSL(0, -.3, .02) },
                emissive: { value: new THREE.Color(0) }, 
                specular: { value: new THREE.Color(1118481) },
                shininess: { value: 0 },
                opacity: {value:0},
                playerPos: { value: new THREE.Vector3() },
                map : {value:texture_map},
                data : {value:data_map},
                pixelRatio : {value:1.0},
                WindowSize : {value: world.renderer.getSize(size)}
                
        },
        ]);

        const material = new THREE.ShaderMaterial({
            defines:ShaderChunkLoader.defines,
            vertexShader: vShader,
            fragmentShader: fShader,
            uniforms,
            lights: true
        });



        // this.object = gltf;
        gltf.scene.traverse( (object: any) => {
            // console.log(object)
            if(object.name.includes("Mesh")){
                this.object = object.clone();
                this.object.castShadow = true;
                this.object.receiveShadow = true;
                this.object.geometry.computeVertexNormals()
                // const material = new THREE.MeshLambertMaterial( { map: noise_perlin } );
                
                this.object.material = material;
                
            }

        })

        world.graphicsWorld.add(this.object);
        world.updatables.push(this);
    }

    public update(time:number){
        (this.object.material as THREE.ShaderMaterial).uniforms.time.value =  time;
    }




}