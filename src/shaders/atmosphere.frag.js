/* vim: set filetype=glsl : */

export const fragmentShaderSource = `#version 300 es
precision mediump float;

uniform vec3 uLightPos;
uniform vec3 uViewPos;

in vec3 fragPos;
in mat3 TBN;

#define M_PI 3.1415926535897932384626433832795

out vec4 outColor;

float inverseLerp(float v, float minValue, float maxValue) {
  return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}

float saturate(float x) {
    return clamp(x, 0.0, 1.0);
}

void main()
{
    vec3 glowColor = vec3(0.05, 0.3, 0.9);

    // lighting
    vec3 lightDir = normalize(uLightPos - fragPos);
    vec3 normal = normalize(fragPos);

    // diffuse
    float wrap = 0.5;
    float ndotl = dot(normal, lightDir);
    float diff = saturate((ndotl + wrap) / (1.0 + wrap));
    diff = smoothstep(-0.15, 0.4, diff);

    float r = length(fragPos.xy);
    float density = smoothstep(1.6, 1.0, r);
    density = pow(density, 2.0) * diff;

    outColor = vec4(glowColor, density);
}`;
