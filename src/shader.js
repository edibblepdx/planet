export class Shader {
    constructor(gl, vertSource, fragSource) {
        this.ID = -1;
        this.gl = gl;

        // vertex shader
        // -------------
        let vert = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vert, vertSource);
        gl.compileShader(vert);

        // fragment shader
        // ---------------
        let frag = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(frag, fragSource);
        gl.compileShader(frag);

        // shader program
        // --------------
        this.ID = gl.createProgram();
        gl.attachShader(this.ID, vert);
        gl.attachShader(this.ID, frag);
        gl.linkProgram(this.ID);
        //gl.validateProgram(shaderProgram);

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
}
