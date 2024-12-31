/**
 * @file planet.js
 * @author ethan dibble
 * @date 2024-12-30
 * @description Recursively subdivided planet in WebGL2.
 */

import { mat4, vec3, glMatrix } from 'gl-matrix';
import { createShader, createProgram, createTexture } from './webgl-utils';

const vertexShaderSource = `#version 300 es
precision mediump float;

layout (location = 0) in vec3 vertexPosition;
layout (location = 1) in vec2 vertexTexture;

out vec2 st;
out vec3 normal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform sampler2D uBump;

void main() 
{
    st = vertexTexture;
    normal = vec3(uProjectionMatrix * uModelViewMatrix * vec4(vertexPosition, 0.0));
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(vertexPosition, 1.0);
}`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

in vec2 st;
in vec3 normal;

out vec4 outColor;

uniform sampler2D uTexture;

void main() 
{
    vec4 texel = texture(uTexture, st);
    outColor = texel;
}`;

class Planet {
    constructor(texPath, bmpPath) {
        this.texPath = texPath;
        this.bmpPath = bmpPath;
        this.radius = 1.0;
    }
};

const octahedronVertices = [
    // position             // texture
     0.0,   0.0,   1.0,     0.5,  1.0,
     0.0,   0.0,  -1.0,     0.5,  0.0,
     0.71,  0.71,  0.0,     0.0,  0.5,
     0.71, -0.71,  0.0,     0.75, 0.5,
    -0.71,  0.71,  0.0,     0.25, 0.5,
    -0.71, -0.71,  0.0,     0.5,  0.5,
];

const octahedronIndices = [
    0, 2, 4,
    0, 4, 5,
    0, 5, 3,
    0, 3, 2,
    1, 4, 2,
    1, 5, 4,
    1, 3, 5,
    1, 2, 3,
];

function planet () {
    /** @type {?HTMLCanvasElement} */
    const canvas = document.getElementById('myCanvas');
    const gl = canvas.getContext('webgl2');

    if (!gl) {
        console.error("ERROR::WEBGL2::INITIALIZATION_ERROR");
        return;
    }

    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // textures
    const texture = createTexture(gl, "earthmap1k.jpg");
    const bump    = createTexture(gl, "earthbump1k.jpg");

    // shader program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const shaderProgram = createProgram(gl, vertexShader, fragmentShader);

    // uniform locations
    const uModelViewMatrix = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
    const uProjectionMatrix = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
    const uTexture = gl.getUniformLocation(shaderProgram, "uTexture");
    if (!uModelViewMatrix || !uProjectionMatrix || !uTexture) {
        console.error("ERROR::SHADER::PROGRAM::UNIFORM_LOCATION");
        return;
    }

    // planet
    let planetVertices = new Float32Array(octahedronVertices);
    let planetIndicies = new Uint16Array(octahedronIndices);

    const VAO = gl.createVertexArray();
    const VBO = gl.createBuffer();
    const EBO = gl.createBuffer();
    VAO.is_loaded = false;
    gl.bindVertexArray(VAO);

    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(gl.ARRAY_BUFFER, planetVertices, gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, EBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, planetIndicies, gl.STATIC_DRAW);

    // position attribute
    gl.vertexAttribPointer(
        0, 3, gl.FLOAT, false, 
        5 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(0);

    // texture attribute
    gl.vertexAttribPointer(
        1, 2, gl.FLOAT, false, 
        5 * Float32Array.BYTES_PER_ELEMENT, 
        3 * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(1);

    gl.bindVertexArray(null);
    VAO.is_loaded = true;

    let rotation = 0;
    let lastFrameTime = performance.now();
    const maxRotation = 2 * Math.PI;
    // draw the scene
    function render() {
        const thisFrameTime = performance.now();
        const dt = (thisFrameTime - lastFrameTime) / 1000;
        lastFrameTime = thisFrameTime;

        rotation += dt * glMatrix.toRadian(20);
        if (rotation >= maxRotation) rotation -= maxRotation;

        canvas.width = canvas.clientWidth * devicePixelRatio;
        canvas.height = canvas.clientHeight * devicePixelRatio;

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, canvas.width, canvas.height);

        gl.useProgram(shaderProgram);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uTexture, 0);

        // matrix uniforms
        const matModelView  = mat4.create();
        const matProjection = mat4.create();

        mat4.lookAt(
            matModelView,
            vec3.fromValues(5, 0, 0),   // eye
            vec3.fromValues(0, 0, 0),   // look at
            vec3.fromValues(0, 0, 1)    // up
        );
        mat4.perspective(
            matProjection,
            glMatrix.toRadian(45),          // fovy
            canvas.width / canvas.height,   // aspect ratio
            0.1, 100.0                      // near, far
        );

        // rotate planet
        mat4.rotateZ(matModelView, matModelView, rotation);

        gl.uniformMatrix4fv(uModelViewMatrix, false, matModelView);
        gl.uniformMatrix4fv(uProjectionMatrix, false, matProjection);

        gl.bindVertexArray(VAO);
        gl.drawElements(gl.TRIANGLES, 24, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function subdivide () {

}

try {
    console.log('starting WebGL2');
    planet();
}
catch (e) {
    console.log(`ERROR::JS::EXCEPTION\n${e}`);
}
