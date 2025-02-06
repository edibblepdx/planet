/**
 * @file planet.js
 * @author ethan dibble
 * @date 2025-2-5
 * @description WebGL2 Planet Class
 */

import { createTexture } from './webgl-utils';
import { Sphere } from './sphere';
import { Shader } from './shader';
import { vertexShaderSource } from './shaders/surface.vert';
import { fragmentShaderSource } from './shaders/surface.frag';

// 1 set of buffers: VAO, VBO, EBO
// 2 shaders: surface, atmosphere
// 4 surface textures: base, cloud, normal, specular
// 1 atmosphere texture: base
// 2 culling faces: front, back
// 2 radiuses: surface, atmosphere -- I think make atmospher 1.05 or something of the base radius
// 1 webgl context

export class Planet {
    // all planets share static values
    static initialized = false;
    static size = 0;

    // buffers
    static VAO = null;
    static VBO = null;
    static EBO = null;

    // shaders
    static surfaceShader = null;
    static atmosphereShader = null;

    constructor(gl, texturePaths = {}) {
        /** @type {?HTMLCanvasElement} */
        this.gl = gl;

        // textures
        this.base = texturePaths.base ? createTexture(gl, texturePaths.base) : null;
        this.clouds = texturePaths.clouds ? createTexture(gl, texturePaths.clouds) : null;
        this.normal = texturePaths.normal ? createTexture(gl, texturePaths.normal) : null;
        this.specular = texturePaths.specular ? createTexture(gl, texturePaths.specular) : null;

        // initialize buffers and shaders only once
        if (!Planet.initialized) Planet.initialize(gl);
    }
    static initialize(gl) {
        // Shader programs
        // ---------------
        this.surfaceShader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
        // !!! fix this when shader is written
        //this.atmosphereShader = new Shader(gl, vertexShaderSource, fragmentShaderSource);

        // Uniform locations
        // -----------------
        // !! GLSL es 3.0 does not support interface blocks based on my testing
        //this.surfaceUniforms.ModelView = gl.getUniformLocation(this.surfaceShader.ID, "uModelViewMatrix");
        //this.surfaceUniforms.Projection = gl.getUniformLocation(this.surfaceShader.ID, "uProjectionMatrix");
        //this.surfaceUniforms.Texture = gl.getUniformLocation(this.surfaceShader.ID, "uTexture");
        //this.surfaceUniforms.Clouds = gl.getUniformLocation(this.surfaceShader.ID, "uClouds");
        //this.surfaceUniforms.Normal = gl.getUniformLocation(this.surfaceShader.ID, "uNormalMap");
        //this.surfaceUniforms.Specular = gl.getUniformLocation(this.surfaceShader.ID, "uSpecularMap");
        //this.surfaceUniforms.LightPos = gl.getUniformLocation(this.surfaceShader.ID, "uLightPos");
        //this.surfaceUniforms.ViewPos = gl.getUniformLocation(this.surfaceShader.ID, "uViewPos");

        // Vertex data
        // -----------
        let sphere = new Sphere();
        sphere.subdivide(4);
        this.size = sphere.indices.length

        let planetVertices = new Float32Array(sphere.vertices);
        let planetIndicies = new Uint16Array(sphere.indices);

        // Buffers
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
    draw(ModelView, Projection, LightPos, ViewPos) {
        if (!Planet.initialized) return;

        // draw atmosphere
        // ---------------
        this.gl.cullFace(this.gl.FRONT);

        // draw surface
        // ------------
        this.gl.cullFace(this.gl.BACK);

        // use surface shader
        Planet.surfaceShader.use();

        // surface textures
        Planet.surfaceShader.setTexture2D("uTexture", this.base, 0);
        Planet.surfaceShader.setTexture2D("uNormalMap", this.normal, 1);
        Planet.surfaceShader.setTexture2D("uSpecularMap", this.specular, 2);
        Planet.surfaceShader.setTexture2D("uClouds", this.clouds, 3);

        // ModelView & Projection matrices
        Planet.surfaceShader.setMat4("uModelViewMatrix", false, ModelView);
        Planet.surfaceShader.setMat4("uProjectionMatrix", false, Projection);

        // light and view positions
        Planet.surfaceShader.setVec3("uLightPos", LightPos);
        Planet.surfaceShader.setVec3("uViewPos", ViewPos);

        // draw elements
        this.gl.bindVertexArray(Planet.VAO);
        this.gl.drawElements(this.gl.TRIANGLES, Planet.size, this.gl.UNSIGNED_SHORT, 0);
    }
}
