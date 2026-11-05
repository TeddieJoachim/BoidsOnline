/* Renderer is responsible for a lot. In here, we will compile the shaders, link them into 
a shader program, create a vertex buffer, place vertices into it, tell WebGl how to 
interpret this data, then draw the shape. */

import { vertexShaderSource, fragmentShaderSource } from "./shaders.js";
import { createSphere, createCone } from "./primitives.js";


export class Renderer {
  constructor(canvas, boidDim) {
    this.gl = canvas.getContext("webgl2");

    if (!this.gl) {
      throw new Error("Ruh roh, renderer cannot load WebGl2");
    }

    const gl = this.gl;

    // compile shaders
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    this.program = gl.createProgram();

    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);

    // check if linking was succesful
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(this.program));
    }

    this.offsetLocation = gl.getUniformLocation(this.program, "uOffset");
    this.lightLocation = gl.getUniformLocation(this.program, "uLightDirection");
    // birds are just spheres for now
    const sphere = createSphere(0.025, 8, 8);
    //const cone = createCone(0.1, 0.2, 16);

    // vertex buffer creation. vao = vertex array object
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    // operations that target ARRAY_BUFFER will write to this buffer
    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, sphere.vertices, gl.STATIC_DRAW);

    // connect vertex data and aPosition. this function asks where is aPosition in the shader program
    // returns an int representing its attribute location 
    const positionLocation = gl.getAttribLocation(this.program, "aPosition");

    // causes webgl to feed vertex data to aPosition 
    gl.enableVertexAttribArray(positionLocation);

    // positionLocation -> aPosition receives data, boidDim -> boidDim values per vertex, gl.FLOAT -> they are floats, false -> don't normalize them, stride and start = 0.
    gl.vertexAttribPointer(positionLocation, boidDim, gl.FLOAT, false, 0, 0);

    // Create normal buffer
    this.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, sphere.normals, gl.STATIC_DRAW);

    // Connect normal data to aNormal
    const normalLocation = gl.getAttribLocation(this.program, "aNormal");

    gl.enableVertexAttribArray(normalLocation);
    gl.vertexAttribPointer(normalLocation, boidDim, gl.FLOAT, false, 0, 0);

    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);

    this.indexCount = sphere.indices.length;
    // unbind our vao. A VAO is a saved description of how vertex data is organized and connected to shader inputs. 
    // Unbinding it doesn't destroy that description it just stops making it the active configuration.
    gl.bindVertexArray(null);
  }

  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader));
    }

    return shader;
  }


  render(boidPositions, numBoids, boidDim) {
    const gl = this.gl;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(this.program);
    gl.uniform3f(this.lightLocation, 1.0, -1.0, -2.0);
    gl.bindVertexArray(this.vao);

    for (let i = 0; i < numBoids; i++) {
      // when i=0 we want 0,1,2. i=1 want 3,4,5 etc
      const x = boidPositions[i * boidDim];
      const y = boidPositions[i * boidDim + 1];
      const z = boidPositions[i * boidDim + 2];

      // Tell the shader where to position this sphere
      gl.uniform3f(this.offsetLocation, x, y, z);

      // Draw the sphere
      gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    }

    gl.bindVertexArray(null);
  }
}