/**
 * @file main.js
 * @author ethan dibble
 * @date 2024-12-30
 * @description Recursively subdivided planet in WebGL2.
 */

import { mat4, vec3, glMatrix, quat } from 'gl-matrix';
import { Planet } from './planet';

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

function main() {
    // --------------------
    // Setup WebGL2 Context
    // --------------------
    /** @type {?HTMLCanvasElement} */
    const canvas = document.getElementById('myCanvas');
    const gl = canvas.getContext('webgl2');

    if (!gl) {
        console.error("ERROR::WEBGL2::INITIALIZATION_ERROR");
        return;
    }

    gl.clearColor(0.01, 0.01, 0.01, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // settings
    // --------
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // ------------------
    // initialize planets
    // ------------------
    Planet.initialize(gl);

    // earth
    // -----
    const earthTexturePaths = {
        base: "resources/8k_earth_daymap.jpg",
        clouds: "resources/8k_earth_clouds.jpg",
        normal: "resources/8k_earth_normal_map.png",
        specular: "resources/8k_earth_specular_map.png",
    };
    let earth = new Planet(gl, earthTexturePaths);

    // --------------
    // draw the scene
    // --------------
    const lightPos = vec3.fromValues(50.0, -50.0, 5.0);
    const viewPos = vec3.fromValues(3.0, 0.0, 0.0);

    let lastFrameTime = performance.now();
    function render() {
        // delta time
        // ----------
        const thisFrameTime = performance.now();
        const dt = (thisFrameTime - lastFrameTime) / 1000;
        lastFrameTime = thisFrameTime;

        // canvas
        // ------
        canvas.width = canvas.clientWidth * devicePixelRatio;
        canvas.height = canvas.clientHeight * devicePixelRatio;

        // framebuffer
        // -----------
        gl.clearColor(0.01, 0.01, 0.01, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, canvas.width, canvas.height);

        // transformation matrices
        // -----------------------
        const matModel = mat4.create();
        const matView = mat4.create();
        const matModelView = mat4.create();
        const matProjection = mat4.create();

        rotate(matModel, dt);               // rotation quaternion

        mat4.lookAt(
            matView,
            viewPos,                        // eye
            vec3.fromValues(0, 0, 0),       // look at
            vec3.fromValues(0, 0, 1)        // up
        );
        mat4.perspective(
            matProjection,
            glMatrix.toRadian(45),          // fovy
            canvas.width / canvas.height,   // aspect ratio
            0.1, 100.0                      // near, far
        );

        mat4.multiply(matModelView, matView, matModel);

        // light position
        // --------------
        let lp = vec3.create(); // transform light into view space
        vec3.transformMat4(lp, lightPos, matView);

        // view position
        // --------------
        let vp = vec3.create();
        vec3.transformMat4(vp, viewPos, matView);

        // draw planet
        // -----------
        earth.draw(matModelView, matProjection, lp, vp);

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
    main();
}
catch (e) {
    console.log(`ERROR::JS::EXCEPTION\n${e}`);
}
