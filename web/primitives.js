
// Essentially taken from slides/previous assignments, with the addition of 
// surface normals for lighting (which are just the surface coordinates of a unit sphere)
export function createSphere(radius, latitudeBands, longitudeBands) {
  const vertices = [];
  const normals = [];
  const indices = [];

  // Generate vertices and normals
  for (let lat = 0; lat <= latitudeBands; lat++) {
    const theta = lat * Math.PI / latitudeBands;

    for (let lon = 0; lon <= longitudeBands; lon++) {
      const phi = lon * 2 * Math.PI / longitudeBands;

      // Unit sphere coordinates (also the surface normal)
      const nx = Math.sin(theta) * Math.cos(phi);
      const ny = Math.cos(theta);
      const nz = Math.sin(theta) * Math.sin(phi);

      // Scale position by radius
      vertices.push(
        radius * nx,
        radius * ny,
        radius * nz
      );

      // Normals must remain unit length
      normals.push(nx, ny, nz);
    }
  }

  // Generate triangle indices
  for (let lat = 0; lat < latitudeBands; lat++) {
    for (let lon = 0; lon < longitudeBands; lon++) {
      const first = lat * (longitudeBands + 1) + lon;
      const second = first + longitudeBands + 1;

      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  return {
    vertices: new Float32Array(vertices),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices)
  };
}

export function createCone(radius, height, segments) {
  const vertices = [];
  const normals = [];
  const indices = [];

  const halfHeight = height / 2;
  const normalLength = Math.sqrt(height * height + 4 * radius * radius);

  // Tip of cone
  vertices.push(0, halfHeight, 0);
  normals.push(0, 1, 0);

  // Side base vertices
  for (let i = 0; i < segments; i++) {
    const theta = (2 * Math.PI * i) / segments;

    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);

    vertices.push(x, -halfHeight, z);

    // Side normal
    normals.push(
      (height * Math.cos(theta)) / normalLength,
      (2 * radius) / normalLength,
      (height * Math.sin(theta)) / normalLength
    );
  }

  // Side triangles
  for (let i = 0; i < segments; i++) {
    const current = 1 + i;
    const next = 1 + (i + 1) % segments;

    indices.push(0, current, next);
  }

  // Base center
  const baseCenter = vertices.length / 3;
  vertices.push(0, -halfHeight, 0);
  normals.push(0, -1, 0);

  // Duplicate base ring with downward normals
  const baseStart = vertices.length / 3;

  for (let i = 0; i < segments; i++) {
    const theta = (2 * Math.PI * i) / segments;

    vertices.push(radius * Math.cos(theta), -halfHeight, radius * Math.sin(theta));

    normals.push(0, -1, 0);
  }

  // Base triangles
  for (let i = 0; i < segments; i++) {
    const current = baseStart + i;
    const next = baseStart + (i + 1) % segments;

    indices.push(baseCenter, next, current);
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices),
    normals: new Float32Array(normals)
  };
}


// TODO CREATE DONUT!!
