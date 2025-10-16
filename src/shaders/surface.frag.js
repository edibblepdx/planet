/* vim: set filetype=glsl : */

export const fragmentShaderSource = `#version 300 es
precision mediump float;

uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uCloudTexture;
uniform sampler2D uNormalMap;
uniform sampler2D uSpecularMap;
uniform vec3 uLightPos;
uniform vec3 uViewPos;

in vec3 texCoord;
in vec3 fragPos;
in mat3 TBN;

out vec4 outColor;

#define M_PI 3.1415926535897932384626433832795

float inverseLerp(float v, float minValue, float maxValue) {
  return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}

vec3 srgb_to_linear(vec3 color) {
    // gamma approximation
    return pow(color, vec3(2.2));
}

vec3 linear_to_srgb(vec3 color) {
    // gamma approximation
    return pow(color, vec3(1.0 / 2.2));
}

float saturate(float x) {
    return clamp(x, 0.0, 1.0);
}

void main()
{
    // spherical texture coordinates
    vec3 nTexCoord = normalize(texCoord);
    vec2 st = vec2(
        (atan(nTexCoord.x, nTexCoord.z) / M_PI + 1.0) * 0.5,
        asin(nTexCoord.y) / M_PI + 0.5
    );

    vec3 day = srgb_to_linear(texture(uDayTexture, st).rgb);
    vec3 night = srgb_to_linear(texture(uNightTexture, st).rgb);
    vec3 clouds = srgb_to_linear(texture(uCloudTexture, st).rgb);

    // normal
    vec3 sampledNormal = texture(uNormalMap, st).rgb * 2.0 - 1.0;
    vec3 normal = normalize(TBN * sampledNormal);

    // lighting
    vec3 lightDir = normalize(uLightPos - fragPos);
    vec3 viewDir = normalize(uViewPos - fragPos);

    // diffuse (day/night sample)
    float diff = saturate(dot(normal, lightDir));
    diff = smoothstep(0.0, 0.4, diff);

    // specular
    vec3 halfDir = normalize(viewDir + lightDir);
    float spec = pow(saturate(dot(normal, halfDir)), 32.0);
    vec3 specular = vec3(texture(uSpecularMap, st).r) * spec * 0.02;

    // color mixing
    vec3 color = mix(night, day, diff);
    color = mix(color, vec3(1.0), clouds.r * diff);
    color += specular;

    outColor = vec4(linear_to_srgb(color), 1.0);
}`;
