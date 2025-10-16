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
out mat3 TBN;

void main()
{
    fragPos = vec3(uModelMatrix * vec4(vertexPosition, 1.0));
    texCoord = vertexPosition;

    vec3 Y = normalize(vec3(uModelMatrix * vec4(0.0, 1.0, 0.0, 0.0)));
    vec3 N = normalize(vec3(uModelMatrix * vec4(vertexPosition, 0.0)));
    vec3 T = cross(Y, N);
    if(length(T) < 1e-5) {
      T = vec3(1.0, 0.0, 0.0);
    }
    T = normalize(vec3(uModelMatrix * vec4(T, 0.0)));
    vec3 B = normalize(cross(N, T));

    TBN = mat3(T, B, N);

    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(vertexPosition, 1.0);
}`;
