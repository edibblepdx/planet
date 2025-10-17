/* vim: set filetype=glsl : */

export const vertexShaderSource = `#version 300 es
precision mediump float;

layout (location = 0) in vec3 vertexPosition;
layout (location = 1) in vec2 vertexTexture;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec3 fragPos;

void main()
{
    vec3 modifiedPosition = 1.6 * vertexPosition;
    fragPos = vec3(uModelMatrix * vec4(modifiedPosition, 1.0));

    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(modifiedPosition, 1.0);
}`;
