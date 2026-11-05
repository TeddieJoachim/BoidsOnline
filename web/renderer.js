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

    this.scaleLocation = gl.getUniformLocation(this.program, "uScale");
    this.offsetLocation = gl.getUniformLocation(this.program, "uOffset");
    this.lightLocation = gl.getUniformLocation(this.program, "uLightDirection");
    // birds are cones, these values will be scaled later
    const food = createSphere(1.0, 16, 16);
    const bird = createCone(1.0, 1.0, 16);

    this.sphereGeometry = this.createGeometry(food, boidDim);
    this.coneGeometry = this.createGeometry(bird, boidDim);
  }

  createGeometry(geometry) {
    const gl = this.gl;

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Position buffer
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(this.program, "aPosition");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    // Normal buffer
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.normals, gl.STATIC_DRAW);

    const normalLocation = gl.getAttribLocation(this.program, "aNormal");
    gl.enableVertexAttribArray(normalLocation);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

    // Index buffer
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
    // unbind our vao. A VAO is a saved description of how vertex data is organized and connected to shader inputs. 
    // Unbinding it doesn't destroy that description it just stops making it the active configuration.
    return {vao, indexCount: geometry.indices.length};
  }

  drawGeometry(geometry, position, scale) {
    const gl = this.gl;

    gl.bindVertexArray(geometry.vao);

    // Set position and scale
    gl.uniform3f(this.offsetLocation, position[0], position[1], position[2]);

    gl.uniform3f(this.scaleLocation, scale[0], scale[1], scale[2]);

    gl.drawElements(gl.TRIANGLES, geometry.indexCount, gl.UNSIGNED_SHORT, 0);
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

  drawObject(position, acceleration, type) {
    const [x, y, z] = position;
    const [delX, delY, delZ] = acceleration;

    if (type == "BIRD") {
      //this.drawGeometry(this.sphereGeometry, [x,y,z], [0.018, 0.018, 0.07])
      this.drawGeometry(this.coneGeometry, [x,y,z], [0.05, 0.05, 1.0]);
      // TODO use acceleration to point cone in bird direction
    }
    else if (type == "FOOD1") {
      this.drawGeometry(this.sphereGeometry, [x,y,z], [0.025, 0.025, 0.025])
    }
    else {
      console.log("MAKE DONUTS!!!")
    }

  }

  render(boidPositions, boidAccelerations, numBoids, boidDim) {
    const gl = this.gl;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(this.program);
    gl.uniform3f(this.lightLocation, 1.0, -1.0, -2.0);

    for (let i = 0; i < numBoids; i++) {
      // when i=0 we want 0,1,2. i=1 want 3,4,5 etc
      const x = boidPositions[i * boidDim];
      const y = boidPositions[i * boidDim + 1];
      const z = boidPositions[i * boidDim + 2];

      const delX = boidAccelerations[i * boidDim];
      const delY = boidAccelerations[i * boidDim + 1];
      const delZ = boidAccelerations[i * boidDim + 2];

      if (i > 0 && i % 10 == 0) {
        this.drawObject([x,y,z], [0,0,0], "FOOD");
      }
      else if (i > 0 && i % 11 == 0) {
        this.drawObject([x,y,z], [0,0,0], "FOOD1");
      }
      else this.drawObject([x,y,z], [delX,delY,delZ], "BIRD");
    }
  }
}