
// Runs once per vertex. aPosition is the bird cordinate in x,y,z.
// uOffset is given to us by renderer and is based on birds coordinates (where to put bird!)
// aNormal is supplied by renderer and is the per vertex normal. this will be passed to the 
// fragment shader to be interpolated 
export const vertexShaderSource = `#version 300 es
  in vec3 aPosition;
  in vec3 aNormal;

  uniform vec3 uOffset;

  out vec3 vNormal;

  void main() {
    vec3 position = aPosition + uOffset;

    vNormal = aNormal;

    gl_Position = vec4(position.x * 0.75, position.y, position.z, 1.0);
  }
`;


// Runs for fragments generated from rasterizing triangles between vertices
export const fragmentShaderSource = `#version 300 es
  precision highp float;

  in vec3 vNormal;

  uniform vec3 uLightDirection;

  out vec4 fragColor;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightDirection);

    // Diffuse lighting
    float diffuse = max(dot(normal, lightDir), 0.0);

    // Ambient illumination
    float ambient = 0.2;

    float lighting = ambient + 0.8 * diffuse;

    vec3 objectColor = vec3(1.0, 0.0, 0.0);

    fragColor = vec4(objectColor * lighting, 1.0);
  }
`;