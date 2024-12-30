import { mat4, vec3, glMatrix } from 'gl-matrix';

console.log('starting WebGL2');

const vertexShaderSource = `#version 300 es
precision mediump float;

layout (location = 0) in vec3 vertexPosition;
layout (location = 1) in vec2 vertexTexture;

out vec2 st;
out vec3 normal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

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

function planet() {
    /** @type {HTMLCanvasElement|null} */
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

    // texture
    const texture = gl.createTexture();
    texture.is_loaded = false;
    const image = new Image();
    image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        console.log("texture loaded");
        texture.is_loaded = true;
    }
    image.src = "earthmap1k.jpg";

    // vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error("ERROR::SHADER::VERTEX::COMPILATION_FAILED\n"
            + gl.getShaderInfoLog(vertexShader));
        return;
    }
    // fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error("ERROR::SHADER::FRAGMENT::COMPILATION_FAILED\n"
            + gl.getShaderInfoLog(fragmentShader));
        return;
    }
    // link shaders
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error("ERROR::SHADER::PROGRAM::LINKING_FAILED\n"
            + gl.getProgramInfoLog(shaderProgram));
        return;
    }
    // validate shader program
    gl.validateProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.VALIDATE_STATUS)) {
        console.error("ERROR::SHADER::PROGRAM::VALIDATION_FAILED\n"
            + gl.getProgramInfoLog(shaderProgram));
        return;
    }
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
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 
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

    // draw the scene
    function render(dt) {
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
            vec3.fromValues(-4, -4, 0),   // eye
            vec3.fromValues(0, 0, 0),   // look at
            vec3.fromValues(0, 0, 1)    // up
        );
        mat4.perspective(
            matProjection,
            glMatrix.toRadian(45),          // fovy
            canvas.width / canvas.height,   // aspect ratio
            0.1, 100.0                      // near, far
        );

        gl.uniformMatrix4fv(uModelViewMatrix, false, matModelView);
        gl.uniformMatrix4fv(uProjectionMatrix, false, matProjection);

        gl.bindVertexArray(VAO);
        gl.drawElements(gl.TRIANGLES, 24, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function subdivide() {

}

try {
    planet();
}
catch (e) {
    console.log(`ERROR::JS::EXCEPTION\n${e}`);
}