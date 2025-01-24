/* vim: set filetype=glsl : */

export const vertexShaderSource = `#version 300 es
precision mediump float;

layout (location = 0) in vec3 vertexPosition;
layout (location = 1) in vec2 vertexTexture;

out vec3 texCoord;
out vec3 normal;
out vec3 fragPos;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() 
{
    texCoord = vertexPosition;
    fragPos = vec3(uModelViewMatrix * vec4(vertexPosition, 1.0)); 
    normal = vec3(uModelViewMatrix * vec4(vertexPosition, 0.0)); 
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(vertexPosition, 1.0);
}`;
