/* vim: set filetype=glsl : */

export const vertexShaderSource = `#version 300 es
precision mediump float;

layout (location = 0) in vec3 vertexPosition;
layout (location = 1) in vec2 vertexTexture;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

out vec3 fragPos;
out vec3 texCoord;
out mat3 TBN;

void main() 
{
    fragPos = vec3(uModelViewMatrix * vec4(vertexPosition, 1.0));
    texCoord = vertexPosition;

    vec3 Z = normalize(vec3(uModelViewMatrix * vec4(0.0, 0.0, 1.0, 0.0)));
    vec3 N = normalize(vec3(uModelViewMatrix * vec4(vertexPosition, 0.0)));
    vec3 T = normalize(cross(Z, N));
    vec3 B = normalize(cross(N, T));    // normalization of the bitangent should not be necessary
    TBN = mat3(T, B, N);

    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(vertexPosition, 1.0);
}`;
