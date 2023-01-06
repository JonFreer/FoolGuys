#ifdef USE_FOG
    float _fogNear=fogNear;
    float fogFactor=smoothstep(_fogNear * 1.1, fogFar, vFogDepth);
    float fogFactor2=smoothstep(_fogNear * 0.7, fogFar * 0.9, vFogDepth);
    fogFactor2*=1.-fogFactor;
    const vec3 fogColor=vec3(0.616, 0.949, 0.941);
    const vec3 fogColor2=vec3(0.725, 0.408, 0.651);
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor2, clamp(fogFactor2 * 1.1, 0., 1.));
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, clamp(fogFactor * 0.7, 0., 1.));
#endif