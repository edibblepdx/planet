/**
 * @file shader.js
 * @author ethan dibble
 * @date 2025-2-5
 * @description GLSL ES 3.0 Shader Class
 */

export class Shader {
  constructor(gl, vertSource, fragSource) {
    this.ID = -1;
    this.gl = gl;
    this.uniformLocations = new Map();

    // vertex shader
    // -------------
    let vert = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vert, vertSource);
    gl.compileShader(vert);
    this.#checkCompileErrors(vert, "VERTEX");

    // fragment shader
    // ---------------
    let frag = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(frag, fragSource);
    gl.compileShader(frag);
    this.#checkCompileErrors(frag, "FRAGMENT");

    // shader program
    // --------------
    this.ID = gl.createProgram();
    gl.attachShader(this.ID, vert);
    gl.attachShader(this.ID, frag);
    gl.linkProgram(this.ID);
    gl.validateProgram(this.ID);
    this.#checkCompileErrors(this.ID, "PROGRAM");

    // delete shaders
    // --------------
    gl.deleteShader(vert);
    gl.deleteShader(frag);
  }
  delete() {
    this.gl.deleteProgram(this.ID);
  }
  use() {
    this.gl.useProgram(this.ID);
  }
  // -------------------------
  // Utility uniform functions
  // -------------------------
  getUniformLocation(name) {
    // cache uniform locations
    if (!this.uniformLocations.has(name)) {
      this.uniformLocations.set(name, this.gl.getUniformLocation(this.ID, name));
    }
    return this.uniformLocations.get(name)
  }
  // --------------------------------------------------
  setTexture2D(name, texture, unit) {
    this.gl.activeTexture(this.gl[`TEXTURE${unit}`]);
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.setInt(name, unit);
  }
  // ---------------------------------------------------------------------------
  setBool(name, value) {
    this.gl.uniform1i(this.getUniformLocation(name), +value);
  }
  setInt(name, value) {
    this.gl.uniform1i(this.getUniformLocation(name), value);
  }
  setFloat(name, value) {
    this.gl.uniform1f(this.getUniformLocation(name), value);
  }
  // ---------------------------------------------------------------------------
  setVec2(name, value) {
    this.gl.uniform2fv(this.getUniformLocation(name), value);
  }
  setVec3(name, value) {
    this.gl.uniform3fv(this.getUniformLocation(name), value);
  }
  setVec4(name, value) {
    this.gl.uniform4fv(this.getUniformLocation(name), value);
  }
  // ---------------------------------------------------------------------------
  setMat2(name, transpose, value) {
    this.gl.uniformMatrix2fv(this.getUniformLocation(name), transpose, value);
  }
  setMat3(name, transpose, value) {
    this.gl.uniformMatrix3fv(this.getUniformLocation(name), transpose, value);
  }
  setMat4(name, transpose, value) {
    this.gl.uniformMatrix4fv(this.getUniformLocation(name), transpose, value);
  }
  // --------------------
  // Check Compile Errors
  // --------------------
  #checkCompileErrors(shader, type) {
    if (type != "PROGRAM") {
      if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        console.error(`ERROR::SHADER::${type}::COMPILATION_FAILED\n`
          + this.gl.getShaderInfoLog(shader));
        this.gl.deleteShader(shader);
      }
    }
    else {
      if (!this.gl.getProgramParameter(shader, this.gl.LINK_STATUS)) {
        console.error("ERROR::SHADER::PROGRAM::LINKING_FAILED\n"
          + this.gl.getProgramInfoLog(shader));
        this.gl.deleteProgram(shader);
      }
      if (!this.gl.getProgramParameter(shader, this.gl.VALIDATE_STATUS)) {
        console.error("ERROR::SHADER::PROGRAM::VALIDATION_FAILED\n"
          + this.gl.getProgramInfoLog(shader));
        this.gl.deleteProgram(shader);
      }
    }
  }
}
