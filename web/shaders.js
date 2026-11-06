
// Runs once per vertex. aPosition is the bird cordinate in x,y,z.
// uOffset is given to us by renderer and is based on birds coordinates (where to put bird!)
// aNormal is supplied by renderer and is the per vertex normal. this will be passed to the 
// fragment shader to be interpolated 
export const vertexShaderSource = `#version 300 es
  in vec3 aPosition;
  in vec3 aNormal;
  in vec2 aUV;

  uniform vec3 uOffset;
  uniform vec3 uScale;
  uniform vec3 uRotationAxis;
  uniform float uRotationAngle;

  out vec3 vNormal;
  out vec2 vUV;

  vec3 rotateVector(vec3 v, vec3 axis, float angle) {
    float c = cos(angle);
    float s = sin(angle);

    return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
  }
  void main() {
    vUV = aUV;
    vec3 scaledPosition = aPosition * uScale;

    vec3 rotatedPosition = rotateVector(scaledPosition, uRotationAxis, uRotationAngle);

    vec3 position = rotatedPosition + uOffset;

    vNormal = normalize(rotateVector(aNormal / uScale, uRotationAxis, uRotationAngle));

    gl_Position = vec4(position.x * 0.75, position.y, position.z, 1.0);
  }
`;


// Runs for fragments generated from rasterizing triangles between vertices

export const fragmentShaderSource = `#version 300 es
  precision highp float;

  in vec3 vNormal;
  in vec2 vUV;

  uniform sampler2D uTexture;
  uniform bool uUseTexture;

  uniform vec3 uLightDirection;

  out vec4 fragColor;

  void main() {
    // Surface normal and light direction
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightDirection);

    // Diffuse lighting
    float diffuse = max(dot(normal, lightDir), 0.0);

    // Ambient illumination
    float ambient = 0.6;

    float lighting = ambient + 0.6 * diffuse;

    // Select texture or fallback object color
    vec4 texColor;

    if (uUseTexture) {
      texColor = texture(uTexture, vUV);
    } else {
      texColor = vec4(1.0, 0.0, 0.0, 1.0);
    }

    // Apply lighting to object color
    fragColor = vec4(texColor.rgb * lighting, texColor.a);
  }
`;
