/* vim: set filetype=glsl : */

export const fragmentShaderSource = `#version 300 es
precision mediump float;

in vec3 texCoord;
in vec3 normal;
in vec3 fragPos;

out vec4 outColor;

uniform sampler2D uTexture;
uniform sampler2D uBump;
uniform vec3 uLightPos;

#define M_PI 3.1415926535897932384626433832795

void main() 
{
    vec2 st = vec2(
        (atan(texCoord.y, texCoord.x) / M_PI + 1.0) * 0.5, 
        asin(texCoord.z) / M_PI + 0.5
    );

    vec3 norm = normalize(normal);
    vec3 lightDir = normalize(uLightPos - fragPos);

    // lighting
    vec3 ambient = vec3(0.3, 0.4, 0.5);
    vec3 lightColor = vec3(1.0, 1.0, 1.0);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = vec3(diff);

    vec4 texel = texture(uTexture, st);
    outColor = vec4((ambient + diffuse) * texel.rgb, 1.0);
}`;
