
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

