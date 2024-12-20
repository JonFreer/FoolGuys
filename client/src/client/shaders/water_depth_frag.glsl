vec3 wColor = gl_FragColor.xyz;
float wpy = vWorldPos.y;
float waterDepth = 1. - linearstep(WATER_MAX_DEPTH, WATER_BASE_LEVEL, wpy);
float foamY = cos((vWorldPos.z + vWorldPos.x) * 0.9 + time * 1.4) * 0.015 - 0.0075;
float waterProgress = cos(time)/10.0;
float waterLevel = WATER_BASE_LEVEL + waterProgress + foamY;
float wetBaseLevel = WATER_BASE_LEVEL - waterLevel * 0.1;
float wet = max(0.2, sin(time - PI * 0.5)) * smoothstep(wetBaseLevel + 0.43, wetBaseLevel + 0.3, wpy) * when_gt(wpy, waterLevel);
wColor -= wet * 0.09;
float hasFoam = when_gt(wpy, waterLevel) * when_lt(wpy, waterLevel + WATER_FOAM_HEIGHT);
float hasWater = when_lt(wpy, waterLevel);
vec3 underwaterColor = (wColor * waterTopColor) * 0.8 + 0.4;
wColor = mix(wColor, underwaterColor, hasWater * 0.8);
wColor = mix(wColor, waterColor, hasWater * waterDepth);
wColor = mix(wColor, vec3(1.), hasFoam * 1.);
gl_FragColor.xyz = vec3(wColor);