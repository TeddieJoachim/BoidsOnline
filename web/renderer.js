/* Renderer is responsible for a lot. In here, we will compile the shaders, link them into 
a shader program, create a vertex buffer, place vertices into it, tell WebGl how to 
interpret this data, then draw the shape. */

import { vertexShaderSource, fragmentShaderSource } from "./shaders.js";
import { createSphere, createCone, createDonut} from "./primitives.js";
import { loadTexture } from "./textures.js";

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

    // Texture uniforms
    this.textureLocation = gl.getUniformLocation(this.program, "uTexture");
    this.useTextureLocation = gl.getUniformLocation(this.program, "uUseTexture");

    // Load food and feather texture
    this.foodTexture = loadTexture(gl, "./textures/pumpkin.png");
    this.featherTexture = loadTexture(gl, "./textures/feathers2.png");
    this.normalTexture = loadTexture(gl, "./textures/texture2.jpg");
    this.normalMapLocation = gl.getUniformLocation(
    this.program, "uNormalMap");
    this.useNormalMapLocation = gl.getUniformLocation(this.program, "uUseNormalMap");
    this.heightTexture = loadTexture(gl, "./textures/bumps.png");

    this.heightMapLocation = gl.getUniformLocation(this.program, "uHeightMap");
    this.useBumpMapLocation = gl.getUniformLocation(this.program, "uUseBumpMap");
    this.bumpStrengthLocation = gl.getUniformLocation(this.program, "uBumpStrength");

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

    // UV buffer
    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.uvs, gl.STATIC_DRAW);

    const uvLocation = gl.getAttribLocation(this.program, "aUV");
    gl.enableVertexAttribArray(uvLocation);
    gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);


    const tangentData = calculateTangents(geometry);

    const tangentBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tangentBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, tangentData, gl.STATIC_DRAW);

    const tangentLocation = gl.getAttribLocation(this.program, "aTangent");

    gl.enableVertexAttribArray(tangentLocation);
    gl.vertexAttribPointer(tangentLocation, 4, gl.FLOAT, false,0,0);

    // Index buffer
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
    // unbind our vao. A VAO is a saved description of how vertex data is organized and connected to shader inputs. 
    // Unbinding it doesn't destroy that description it just stops making it the active configuration.
    return {vao, indexCount: geometry.indices.length};
  }

  drawGeometry(geometry, position, scale, rotation, texture = null, normalMap=null, heightMap = null) {
    const gl = this.gl;

    gl.uniform3fv(this.rotationAxisLocation, rotation.axis);
    gl.uniform1f(this.rotationAngleLocation, rotation.angle);

    gl.bindVertexArray(geometry.vao);

    gl.uniform3f(this.offsetLocation, position[0], position[1], position[2]);
    gl.uniform3f(this.scaleLocation, scale[0], scale[1], scale[2]);

    // Color texture texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(this.textureLocation, 0);
    gl.uniform1i(this.useTextureLocation, texture ? 1 : 0);

    // Normal map texture unit 1
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, normalMap);
    gl.uniform1i(this.normalMapLocation, 1);
    gl.uniform1i(this.useNormalMapLocation, normalMap ? 1 : 0);

    // Height map is final texture unit
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, heightMap);
    gl.uniform1i(this.heightMapLocation, 2);
    gl.uniform1i(this.useBumpMapLocation, heightMap ? 1 : 0);
    gl.uniform1f(this.bumpStrengthLocation, 3.0);

    gl.drawElements(
      gl.TRIANGLES,
      geometry.indexCount,
      gl.UNSIGNED_SHORT,
      0
    );
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
      this.drawGeometry(this.coneGeometry, [x,y,z], [0.025, 0.08, 0.025], rotation, this.featherTexture, null, null);
      // TODO use acceleration to point cone in bird direction
    }
    else if (type == "FOOD1") {
      this.drawGeometry(this.sphereGeometry, [x,y,z], [0.02, 0.02, 0.02], IDRot, this.foodTexture, this.normalTexture, this.heightTexture);
    }
    else {
      this.drawGeometry(this.donutGeometry, [x,y,z], [0.03, 0.03, 0.03], donutRotation, this.foodTexture, this.normalTexture, this.heightTexture);
    }

  }

  render(boidPositions, boidVelocities, numBoids, boidDim) {
    const spinAngle = performance.now() * 0.001;
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
    // so that you can see the texture more clearly
    this.drawGeometry(this.coneGeometry, [1.5,0.7,0.0], [0.15, 0.6, 0.15], { axis: [0, 1, 0], angle: spinAngle }, this.featherTexture, null);
    this.drawGeometry(this.sphereGeometry,[1.5, 0.1, 0.0], [0.25, 0.25, 0.25], { axis: [0, 1, 0], angle: spinAngle }, this.foodTexture, this.normalTexture, this.heightTexture);
    this.drawGeometry(this.donutGeometry, [1.5, -0.5, 0.0], [0.25, 0.25, 0.25], {axis: [1, 0, 0], angle: spinAngle}, this.foodTexture, this.normalTexture, this.heightTexture);
  }
}

function calculateTangents(geometry) {
  const { vertices, normals, uvs, indices } = geometry;

  const vertexCount = vertices.length / 3;
  const tangents = new Float32Array(vertexCount * 3);
  const bitangents = new Float32Array(vertexCount * 3);

  // Calculate tangent and bitangent for each triangle
  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i];
    const i1 = indices[i + 1];
    const i2 = indices[i + 2];

    const p0 = vertices.slice(i0 * 3, i0 * 3 + 3);
    const p1 = vertices.slice(i1 * 3, i1 * 3 + 3);
    const p2 = vertices.slice(i2 * 3, i2 * 3 + 3);

    const uv0 = uvs.slice(i0 * 2, i0 * 2 + 2);
    const uv1 = uvs.slice(i1 * 2, i1 * 2 + 2);
    const uv2 = uvs.slice(i2 * 2, i2 * 2 + 2);

    const edge1 = p1.map((v, k) => v - p0[k]);
    const edge2 = p2.map((v, k) => v - p0[k]);

    const du1 = uv1[0] - uv0[0];
    const dv1 = uv1[1] - uv0[1];
    const du2 = uv2[0] - uv0[0];
    const dv2 = uv2[1] - uv0[1];

    const denominator = du1 * dv2 - du2 * dv1;

    if (Math.abs(denominator) < 1e-8) continue;

    const f = 1.0 / denominator;

    const tangent = [
      f * (dv2 * edge1[0] - dv1 * edge2[0]),
      f * (dv2 * edge1[1] - dv1 * edge2[1]),
      f * (dv2 * edge1[2] - dv1 * edge2[2])
    ];

    const bitangent = [
      f * (-du2 * edge1[0] + du1 * edge2[0]),
      f * (-du2 * edge1[1] + du1 * edge2[1]),
      f * (-du2 * edge1[2] + du1 * edge2[2])
    ];

    for (const index of [i0, i1, i2]) {
      for (let k = 0; k < 3; k++) {
        tangents[index * 3 + k] += tangent[k];
        bitangents[index * 3 + k] += bitangent[k];
      }
    }
  }

  // Orthogonalize and normalize the tangent at each vertex
  const result = new Float32Array(vertexCount * 4);

  for (let i = 0; i < vertexCount; i++) {
    const n = normals.slice(i * 3, i * 3 + 3);
    let t = tangents.slice(i * 3, i * 3 + 3);

    const dot = n[0] * t[0] + n[1] * t[1] + n[2] * t[2];

    t = t.map((v, k) => v - dot * n[k]);

    let length = Math.hypot(...t);

    if (length < 1e-8) {
      t = Math.abs(n[1]) < 0.9 ? [-n[2], 0, n[0]] : [1, 0, 0];

      length = Math.hypot(...t);
    }

    t = t.map(v => v / length);

    const cross = [
      n[1] * t[2] - n[2] * t[1],
      n[2] * t[0] - n[0] * t[2],
      n[0] * t[1] - n[1] * t[0]
    ];

    const b = bitangents.slice(i * 3, i * 3 + 3);

    const handedness =
      cross[0] * b[0] + cross[1] * b[1] + cross[2] * b[2] < 0? -1 : 1;

    result.set([...t, handedness], i * 4);
  }

  return result;
}