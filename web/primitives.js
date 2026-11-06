
// Essentially taken from slides/previous assignments, with the addition of 
// surface normals for lighting (which are just the surface coordinates of a unit sphere)
export function createSphere(radius, latitudeBands, longitudeBands) {
  const vertices = [];
  const normals = [];
  const indices = [];
  const uvs = [];

  // Generate vertices and normals
  for (let lat = 0; lat <= latitudeBands; lat++) {
    const theta = lat * Math.PI / latitudeBands;

    for (let lon = 0; lon <= longitudeBands; lon++) {
      const phi = lon * 2 * Math.PI / longitudeBands;

      // Unit sphere coordinates (also the surface normal)
      const nx = Math.sin(theta) * Math.cos(phi);
      const ny = Math.cos(theta);
      const nz = Math.sin(theta) * Math.sin(phi);

      const u = lon / longitudeBands;
      const v = lat / latitudeBands;

      uvs.push(u, v);

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
    indices: new Uint16Array(indices),
    uvs: new Float32Array(uvs)
  };
}


export function createCone(radius, height, segments) {
  const vertices = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  const halfHeight = height / 2;
  const normalLength = Math.sqrt(height * height + 4 * radius * radius);

  // Side tip
  vertices.push(0, halfHeight, 0);
  normals.push(0, 1, 0);
  uvs.push(0.5, 1.0);

  // Side base vertices, including duplicated seam vertex
  for (let i = 0; i <= segments; i++) {
    const theta = (2 * Math.PI * i) / segments;

    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);

    vertices.push(x, -halfHeight, z);

    normals.push(
      (height * Math.cos(theta)) / normalLength,
      (2 * radius) / normalLength,
      (height * Math.sin(theta)) / normalLength
    );

    const u = i / segments;
    uvs.push(u, 0.0);
  }

  // Side triangles
  for (let i = 0; i < segments; i++) {
    const tip = 0;
    const current = 1 + i;
    const next = 1 + i + 1;

    indices.push(tip, current, next);
  }

  // Base center
  const baseCenter = vertices.length / 3;
  vertices.push(0, -halfHeight, 0);
  normals.push(0, -1, 0);
  uvs.push(0.5, 0.5);

  // Duplicate base ring with downward normals
  const baseStart = vertices.length / 3;

  for (let i = 0; i <= segments; i++) {
    const theta = (2 * Math.PI * i) / segments;

    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);

    vertices.push(x, -halfHeight, z);
    normals.push(0, -1, 0);

    // Planar UV mapping
    const u = 0.5 + 0.5 * Math.cos(theta);
    const v = 0.5 + 0.5 * Math.sin(theta);
    uvs.push(u, v);
  }

  // Base triangles
  for (let i = 0; i < segments; i++) {
    const current = baseStart + i;
    const next = baseStart + i + 1;

    indices.push(baseCenter, next, current);
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs)
  };
}




export function createDonut(majorRadius, minorRadius, majorSegments, minorSegments) {
  const vertices = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= majorSegments; i++) {
    const theta = (2 * Math.PI * i) / majorSegments;

    for (let j = 0; j <= minorSegments; j++) {
      const phi = (2 * Math.PI * j) / minorSegments;

      // Normal direction
      const nx = Math.cos(theta) * Math.cos(phi);
      const ny = Math.sin(phi);
      const nz = Math.sin(theta) * Math.cos(phi);

      normals.push(nx, ny, nz);

      // Vertex position
      const x = (majorRadius + minorRadius * Math.cos(phi)) * Math.cos(theta);
      const y = minorRadius * Math.sin(phi);
      const z = (majorRadius + minorRadius * Math.cos(phi)) * Math.sin(theta);

      vertices.push(x, y, z);

      // UV coordinates
      const u = i / majorSegments;
      const v = j / minorSegments;

      uvs.push(u, v);
    }
  }

  // Connect neighboring vertices into triangles
  for (let i = 0; i < majorSegments; i++) {
    for (let j = 0; j < minorSegments; j++) {
      const current = i * (minorSegments + 1) + j;
      const next = current + minorSegments + 1;

      indices.push(
        current, next, current + 1,
        current + 1, next, next + 1
      );
    }
  }

  return {
    vertices: new Float32Array(vertices),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    uvs: new Float32Array(uvs)
  };
}

