/* Renderer is responsible for a lot. In here, we will compile the shaders, link them into 
a shader program, create a vertex buffer, place vertices into it, tell WebGl how to 
interpret this data, then draw the shape. */

import { vertexShaderSource, fragmentShaderSource } from "./shaders.js";
import { createSphere, createCone, createDonut} from "./primitives.js";


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

    this.rotationAxisLocation = gl.getUniformLocation(this.program, "uRotationAxis");
    this.rotationAngleLocation = gl.getUniformLocation(this.program, "uRotationAngle");
    this.scaleLocation = gl.getUniformLocation(this.program, "uScale");
    this.offsetLocation = gl.getUniformLocation(this.program, "uOffset");
    this.lightLocation = gl.getUniformLocation(this.program, "uLightDirection");
    // birds are cones, these values will be scaled later
    const food = createSphere(1.0, 16, 16);
    const bird = createCone(1.0, 1.0, 16);
    const donut = createDonut(0.7, 0.3, 24, 12);

    this.donutGeometry = this.createGeometry(donut);
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

  drawGeometry(geometry, position, scale, rotation) {
    const gl = this.gl;
    
    gl.uniform3fv(this.rotationAxisLocation, rotation.axis);
    gl.uniform1f(this.rotationAngleLocation, rotation.angle);

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

  drawObject(position, rotation, type) {
    const [x, y, z] = position;
    const IDRot = { axis: [1, 0, 0], angle: 0 };
    const donutRotation = {axis: [1, 0, 0], angle: Math.PI / 2};
    if (type == "BIRD") {
      //this.drawGeometry(this.sphereGeometry, [x,y,z], [0.018, 0.018, 0.07])
      this.drawGeometry(this.coneGeometry, [x,y,z], [0.025, 0.08, 0.025], rotation);
      // TODO use acceleration to point cone in bird direction
    }
    else if (type == "FOOD1") {
      this.drawGeometry(this.sphereGeometry, [x,y,z], [0.015, 0.015, 0.015], IDRot);
    }
    else {
      this.drawGeometry(this.donutGeometry, [x,y,z], [0.02, 0.02, 0.02], donutRotation);
    }

  }

  render(boidPositions, boidVelocities, numBoids, boidDim) {
    const gl = this.gl;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(this.program);
    gl.uniform3f(this.lightLocation, 1.0, -2.0, -1.0);

    for (let i = 0; i < numBoids; i++) {
      // when i=0 we want 0,1,2. i=1 want 3,4,5 etc
      const x = boidPositions[i * boidDim];
      const y = boidPositions[i * boidDim + 1];
      const z = boidPositions[i * boidDim + 2];

      const delX = boidVelocities[i * boidDim];
      const delY = boidVelocities[i * boidDim + 1];
      const delZ = boidVelocities[i * boidDim + 2];

      if (i > 0 && i % 10 == 0) {
        this.drawObject([x,y,z], null, "FOOD");
      }
      else if (i > 0 && i % 11 == 0) {
        this.drawObject([x,y,z], null, "FOOD1");
      }
      else {
        const mag = Math.hypot(delX, delY, delZ);
        // Default to no rotation
        let rotation = { axis: [1, 0, 0], angle: 0 };

        if (mag > 1e-6) {
          const direction = [delX / mag, delY / mag, delZ / mag];

          // Original cone direction: positive Y
          const axis = [direction[2], 0, -direction[0]];
          const axisMag = Math.hypot(...axis);

          if (axisMag < 1e-6) {
            rotation.angle = direction[1] >= 0 ? 0 : Math.PI;
          } else {
            rotation.axis = axis.map(v => v / axisMag);
            rotation.angle = Math.acos(Math.max(-1, Math.min(1, direction[1])));
          }
        }

        // Always draw the bird
        this.drawObject([x, y, z], rotation, "BIRD");
      }
    }
  }
}