/* vim: set filetype=glsl : */

export const fragmentShaderSource = `#version 300 es
precision mediump float;

uniform sampler2D uStarTexture;

in vec3 texCoord;
in vec3 fragPos;

out vec4 outColor;

#define M_PI 3.1415926535897932384626433832795

void main()
{
    // spherical texture coordinates
    vec3 nTexCoord = normalize(texCoord);
    vec2 st = vec2(
        (atan(nTexCoord.x, nTexCoord.z) / M_PI + 1.0) * 0.5,
        asin(nTexCoord.y) / M_PI + 0.5
    );

    outColor = texture(uStarTexture, st);
}`;
