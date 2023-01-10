#ifndef HAS_WEBXR

    vec2 dpUV=(gl_FragCoord.xy * pixelRatio) * 0.15;
    dpUV.x += step(1., mod(dpUV.y, 2.)) * 0.5;
    dpUV=fract(dpUV);
    float add_x = max(abs(WindowSize.x/2.0-gl_FragCoord.x)/(WindowSize.x/2.0),0.1);
    float add_y = max(abs(WindowSize.y/2.0-gl_FragCoord.y)/(WindowSize.y/2.0),0.1);
    float dpLimit=smoothstep(0.3, 0.999, gl_FragCoord.w - add_x - add_y + 0.2);
    float dpMask=smoothstep(dpLimit - 0.2, dpLimit, length(dpUV - vec2(0.5)));
    // if(dpMask<0.5) {
    //     discard;
    // }
    // dpMask = dpMask * (abs(WindowSize.x/2.0-gl_FragCoord.x)/(WindowSize.x/2.0))*1.5;    ;
    // if(gl_FragCoord.x> WindowSize.x/4.0 && gl_FragCoord.x <WindowSize.x - WindowSize.x/4.0 ){
        if(dpMask<0.5) {
            discard;
        }
    // }

#endif