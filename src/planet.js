/**
 * @file planet.js
 * @author ethan dibble
 * @date 2024-12-30
 * @description Recursively subdivided planet in WebGL2.
 */

import { mat4, vec3, glMatrix, quat } from 'gl-matrix';
import { createShader, createProgram, createTexture } from './webgl-utils';
import { Sphere } from './sphere';
import { vertexShaderSource } from './shader.vert';
import { fragmentShaderSource } from './shader.frag';

// link so that I can reference back about quaternion order and stuff
// https://stackoverflow.com/questions/9715776/using-quaternions-for-opengl-rotations

// enum class of wrapper functions for rotation
class Rotation {
    static #orientation = quat.create();
    static #speed = 60;

    static UP = (out, dt) => {
        let rotation = quat.create();
        quat.rotateY(rotation, rotation, dt * -glMatrix.toRadian(this.#speed));
        this.#applyRotation(out, rotation);
    };
    static DOWN = (out, dt) => {
        let rotation = quat.create();
        quat.rotateY(rotation, rotation, dt * glMatrix.toRadian(this.#speed));
        this.#applyRotation(out, rotation);
    };
    static LEFT = (out, dt) => {
        let rotation = quat.create();
        quat.rotateZ(rotation, rotation, dt * -glMatrix.toRadian(this.#speed));
        this.#applyRotation(out, rotation);
    };
    static RIGHT = (out, dt) => {
        let rotation = quat.create();
        quat.rotateZ(rotation, rotation, dt * glMatrix.toRadian(this.#speed));
        this.#applyRotation(out, rotation);
    };
    static RESET = () => {
        this.#orientation = quat.create();
    };
    static #applyRotation(out, rotation) {
        quat.multiply(this.#orientation, rotation, this.#orientation);
        mat4.fromQuat(out, this.#orientation);
    }
}
// default placeholder function
let rotate = () => { };

function planet() {
    /** @type {?HTMLCanvasElement} */
    const canvas = document.getElementById('myCanvas');
    const gl = canvas.getContext('webgl2');

    if (!gl) {
        console.error("ERROR::WEBGL2::INITIALIZATION_ERROR");
        return;
    }

    gl.clearColor(0.1, 0.1, 0.2, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // settings
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // textures
    const texture = createTexture(gl, "resources/8k_earth_daymap.jpg");
    const normalMap = createTexture(gl, "resources/8k_earth_normal_map.png");
    const specularMap = createTexture(gl, "resources/8k_earth_specular_map.png");

    // shader program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const shaderProgram = createProgram(gl, vertexShader, fragmentShader);

    // uniform locations
    const uModelViewMatrix = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
    const uProjectionMatrix = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
    const uTexture = gl.getUniformLocation(shaderProgram, "uTexture");
    const uNormalMap = gl.getUniformLocation(shaderProgram, "uNormalMap");
    const uSpecularMap = gl.getUniformLocation(shaderProgram, "uSpecularMap");
    const uLightPos = gl.getUniformLocation(shaderProgram, "uLightPos");
    const uViewPos = gl.getUniformLocation(shaderProgram, "uViewPos");
    if (!uModelViewMatrix || !uProjectionMatrix ||
        !uTexture || !uNormalMap || !uSpecularMap ||
        !uLightPos || !uViewPos) {
        console.error("ERROR::SHADER::PROGRAM::UNIFORM_LOCATION");
        return;
    }

    // planet

    // subdivide
    // just work with javascript arrays then convert to strict arrays after
    // ensure that edges are tracked
    let planet = new Sphere();
    planet.subdivide(4);

    // buffer data
    let planetVertices = new Float32Array(planet.vertices);
    let planetIndicies = new Uint16Array(planet.indices);

    // setup buffers
    const VAO = gl.createVertexArray();
    const VBO = gl.createBuffer();
    const EBO = gl.createBuffer();
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

    // draw the scene
    let lastFrameTime = performance.now();
    const lightPos = vec3.fromValues(10.0, -10.0, 5.0);
    const viewPos = vec3.fromValues(3.0, 0.0, 0.0);
    function render() {
        const thisFrameTime = performance.now();
        const dt = (thisFrameTime - lastFrameTime) / 1000;
        lastFrameTime = thisFrameTime;

        canvas.width = canvas.clientWidth * devicePixelRatio;
        canvas.height = canvas.clientHeight * devicePixelRatio;

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, canvas.width, canvas.height);

        gl.useProgram(shaderProgram);

        // textures
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uTexture, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, normalMap);
        gl.uniform1i(uNormalMap, 1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, specularMap);
        gl.uniform1i(uSpecularMap, 2);

        // matrix uniforms
        const matModel = mat4.create();
        const matView = mat4.create();
        const matModelView = mat4.create();
        const matProjection = mat4.create();

        rotate(matModel, dt),               // rotation quaternion
            mat4.lookAt(
                matView,
                viewPos,                    // eye
                vec3.fromValues(0, 0, 0),   // look at
                vec3.fromValues(0, 0, 1)    // up
            );
        mat4.perspective(
            matProjection,
            glMatrix.toRadian(45),          // fovy
            canvas.width / canvas.height,   // aspect ratio
            0.1, 100.0                      // near, far
        );

        mat4.multiply(matModelView, matView, matModel);
        gl.uniformMatrix4fv(uModelViewMatrix, false, matModelView);
        gl.uniformMatrix4fv(uProjectionMatrix, false, matProjection);

        let lp = vec3.create(); // transform light into view space
        vec3.transformMat4(lp, lightPos, matView);
        gl.uniform3fv(uLightPos, lp);

        let vp = vec3.create();
        vec3.transformMat4(vp, viewPos, matView);
        gl.uniform3fv(uViewPos, vp);

        gl.bindVertexArray(VAO);
        gl.drawElements(gl.TRIANGLES, planet.indices.length, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
            rotate = Rotation.UP;
            break;
        case 'ArrowDown':
            rotate = Rotation.DOWN;
            break;
        case 'ArrowLeft':
            rotate = Rotation.LEFT;
            break;
        case 'ArrowRight':
            rotate = Rotation.RIGHT;
            break;
        case ' ':
            rotate = Rotation.RESET;
            break;
        default:
            break;
    }
});

try {
    console.log('starting WebGL2');
    planet();
}
catch (e) {
    console.log(`ERROR::JS::EXCEPTION\n${e}`);
}
