import { createShader, createProgram, createTexture } from './webgl-utils';
import { Sphere } from './sphere';
import { vertexShaderSource } from './shader.vert';
import { fragmentShaderSource } from './shader.frag';

// 1 set of buffers: VAO, VBO, EBO
// 2 shaders: surface, atmosphere
// 4 surface textures: base, cloud, normal, specular
// 1 atmosphere texture: base
// 2 culling faces: front, back
// 2 radiuses: surface, atmosphere
// 1 webgl context

export class Planet {
    // all planets share buffers and shaders
    static initialized = false;
    static VAO = null;
    static VBO = null;
    static EBO = null;
    static surfaceShader = null;
    static atmosphereShader = null;

    constructor(gl, radius, texturePaths) {
        /** @type {?HTMLCanvasElement} */
        this.gl = gl;
        this.radius = radius;

        // initialize buffers and shaders only once
        if (!Planet.initialized) Planet.#initialize(gl);
    }
    static #initialize(gl) {
        // shader programs
        // ---------------
        const surfaceVS = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const surfaceFS = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.surfaceShader = createProgram(gl, surfaceVS, surfaceFS);

        // !!! fix this when shader is written
        const atmosphereVS = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const atmosphereFS = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.atmosphereShader = createProgram(gl, atmosphereVS, atmosphereFS);

        // vertex data
        // -----------
        let sphere = new Sphere();
        sphere.subdivide(4);

        let planetVertices = new Float32Array(sphere.vertices);
        let planetIndicies = new Uint16Array(sphere.indices);

        // buffers
        // -------
        this.VAO = gl.createVertexArray();
        this.VBO = gl.createBuffer();
        this.EBO = gl.createBuffer();

        gl.bindVertexArray(this.VAO);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);
        gl.bufferData(gl.ARRAY_BUFFER, planetVertices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.EBO);
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

        // 'this' is used within a static method
        this.initialized = true;
    }
    draw(ModelView, Projection) {
        if (!Planet.initialized) return;

        // draw atmosphere
        // ---------------

        // draw surface
        // ------------
    }
}
