/**
 * @file planet.js
 * @author ethan dibble
 * @date 2025-2-5
 * @description WebGL2 Planet Class
 */

import { createTexture } from './webgl-utils';
import { Sphere } from './sphere';
import { Shader } from './shader';
import { vertexShaderSource as surfaceVert } from './shaders/surface.vert';
import { fragmentShaderSource as surfaceFrag } from './shaders/surface.frag';
import { vertexShaderSource as atmosphereVert } from './shaders/atmosphere.vert';
import { fragmentShaderSource as atmosphereFrag } from './shaders/atmosphere.frag';

// 1 set of buffers: VAO, VBO, EBO
// 2 shaders: surface, atmosphere
// 4 surface textures: base, cloud, normal, specular
// 1 atmosphere texture: base
// 2 culling faces: front, back
// 2 radiuses: surface, atmosphere -- I think make atmosphere 1.05 or something of the base radius
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
    this.day =
      texturePaths.day ? createTexture(gl, texturePaths.day) : null;
    this.night =
      texturePaths.night ? createTexture(gl, texturePaths.night) : null;
    this.clouds =
      texturePaths.clouds ? createTexture(gl, texturePaths.clouds) : null;
    this.normal =
      texturePaths.normal ? createTexture(gl, texturePaths.normal) : null;
    this.specular =
      texturePaths.specular ? createTexture(gl, texturePaths.specular) : null;

    // initialize buffers and shaders only once
    if (!Planet.initialized) Planet.initialize(gl);
  }
  static initialize(gl) {
    // Shader programs
    // ---------------
    this.surfaceShader = new Shader(gl, surfaceVert, surfaceFrag);
    this.atmosphereShader = new Shader(gl, atmosphereVert, atmosphereFrag);

    // Vertex data
    // -----------
    let sphere = new Sphere();
    sphere.subdivide(4);
    this.size = sphere.indices.length

    let vertices = new Float32Array(sphere.vertices);
    let indicies = new Uint16Array(sphere.indices);

    // Buffers
    // -------
    this.VAO = gl.createVertexArray();
    this.VBO = gl.createBuffer();
    this.EBO = gl.createBuffer();

    gl.bindVertexArray(this.VAO);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.EBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indicies, gl.STATIC_DRAW);

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
  draw(Model, View, Projection, LightPos, ViewPos) {
    if (!Planet.initialized) return;

    this.gl.enable(this.gl.BLEND)
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    // draw atmosphere
    // ---------------
    //this.gl.cullFace(this.gl.BACK);
    this.gl.cullFace(this.gl.FRONT);

    // use atmosphere shader
    Planet.atmosphereShader.use();

    // Model, View, and Projection matrices
    Planet.atmosphereShader.setMat4("uModelMatrix", false, Model);
    Planet.atmosphereShader.setMat4("uViewMatrix", false, View);
    Planet.atmosphereShader.setMat4("uProjectionMatrix", false, Projection);

    // light and view positions
    Planet.atmosphereShader.setVec3("uLightPos", LightPos);
    Planet.atmosphereShader.setVec3("uViewPos", ViewPos);

    // draw elements
    this.gl.bindVertexArray(Planet.VAO);
    this.gl.drawElements(
      this.gl.TRIANGLES, Planet.size, this.gl.UNSIGNED_SHORT, 0);

    // draw surface
    // ------------
    this.gl.cullFace(this.gl.BACK);

    // use surface shader
    Planet.surfaceShader.use();

    // surface textures
    Planet.surfaceShader.setTexture2D("uDayTexture", this.day, 0);
    Planet.surfaceShader.setTexture2D("uNightTexture", this.night, 1);
    Planet.surfaceShader.setTexture2D("uCloudTexture", this.clouds, 2);
    Planet.surfaceShader.setTexture2D("uNormalMap", this.normal, 3);
    Planet.surfaceShader.setTexture2D("uSpecularMap", this.specular, 4);

    // Model, View, and Projection matrices
    Planet.surfaceShader.setMat4("uModelMatrix", false, Model);
    Planet.surfaceShader.setMat4("uViewMatrix", false, View);
    Planet.surfaceShader.setMat4("uProjectionMatrix", false, Projection);

    // light and view positions
    Planet.surfaceShader.setVec3("uLightPos", LightPos);
    Planet.surfaceShader.setVec3("uViewPos", ViewPos);

    // draw elements
    this.gl.bindVertexArray(Planet.VAO);
    this.gl.drawElements(
      this.gl.TRIANGLES, Planet.size, this.gl.UNSIGNED_SHORT, 0);
  }
}
