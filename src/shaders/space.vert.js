/* vim: set filetype=glsl : */

export const vertexShaderSource = `#version 300 es
precision mediump float;

layout (location = 0) in vec3 vertexPosition;
layout (location = 1) in vec2 vertexTexture;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec3 fragPos;
out vec3 texCoord;

void main()
{
    fragPos = vertexPosition;
    texCoord = vertexPosition;
    vec4 worldPos = uModelMatrix * vec4(vertexPosition * 10.0, 1.0);

    gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}`;
