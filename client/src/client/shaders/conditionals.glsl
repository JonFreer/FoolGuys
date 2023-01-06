float between(float x, vec2 hit) {
    return min(1., smoothstep(hit.x + 0.25, hit.x - 0.25, x) + smoothstep(hit.y - 0.25, hit.y + 0.25, x));
}

float when_gt(float x, float y) {
    return max(sign(x - y), 0.0);
}

float when_lt(float x, float y) {
    return max(sign(y - x), 0.0);
}