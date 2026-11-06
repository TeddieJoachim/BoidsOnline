
// Runs once per vertex. aPosition is the bird cordinate in x,y,z.
// uOffset is given to us by renderer and is based on birds coordinates (where to put bird!)
// aNormal is supplied by renderer and is the per vertex normal. this will be passed to the 
// fragment shader to be interpolated 

export const vertexShaderSource = `#version 300 es
  in vec3 aPosition;
  in vec3 aNormal;
  in vec2 aUV;
  in vec4 aTangent;

  uniform vec3 uOffset;
  uniform vec3 uScale;
  uniform vec3 uRotationAxis;
  uniform float uRotationAngle;

  out vec3 vNormal;
  out vec3 vTangent;
  out float vTangentSign;
  out vec2 vUV;

  vec3 rotateVector(vec3 v, vec3 axis, float angle) {
    float c = cos(angle);
    float s = sin(angle);

    return v * c + cross(axis, v) * s
      + axis * dot(axis, v) * (1.0 - c);
  }

  void main() {
    vUV = aUV;

    vec3 scaledPosition = aPosition * uScale;
    vec3 rotatedPosition = rotateVector(scaledPosition, uRotationAxis, uRotationAngle);

    vec3 position = rotatedPosition + uOffset;

    // Transform the normal using inverse scale
    vec3 N = normalize(rotateVector(aNormal / uScale, uRotationAxis, uRotationAngle));

    // Transform tangent using regular scale
    vec3 T = rotateVector(aTangent.xyz * uScale, uRotationAxis, uRotationAngle);

    // Make tangent perpendicular to normal
    T = normalize(T - dot(T, N) * N);

    vNormal = N;
    vTangent = T;
    vTangentSign = aTangent.w;

    gl_Position = vec4(position.x * (600.0 / 1200.0), position.y, position.z, 1.0);
  }
`;


// Runs for fragments generated from rasterizing triangles between vertices

export const fragmentShaderSource = `#version 300 es
  precision highp float;

  in vec3 vNormal;
  in vec3 vTangent;
  in float vTangentSign;
  in vec2 vUV;

  uniform sampler2D uHeightMap;
  uniform bool uUseBumpMap;
  uniform float uBumpStrength;

  uniform sampler2D uTexture;
  uniform sampler2D uNormalMap;

  uniform bool uUseTexture;
  uniform bool uUseNormalMap;

  uniform vec3 uLightDirection;

  out vec4 fragColor;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 T = normalize(vTangent);
    vec3 B = normalize(cross(N, T)) * vTangentSign;

    // Construct tangent-to-world transformation
    mat3 TBN = mat3(T, B, N);

    // Sample normal map and convert from [0,1] to [-1,1]
    vec3 normal = N;

    if (uUseNormalMap) {
      vec3 sampledNormal = texture(uNormalMap, vUV).rgb;
      sampledNormal = sampledNormal * 2.0 - 1.0;

      normal = normalize(TBN * sampledNormal);
    }
    if (uUseBumpMap) {
      vec2 texelSize = 1.0 / vec2(textureSize(uHeightMap, 0));

      float hLeft = texture(uHeightMap, vUV - vec2(texelSize.x, 0.0)).r;

      float hRight = texture(uHeightMap, vUV + vec2(texelSize.x, 0.0)).r;

      float hDown = texture(uHeightMap, vUV - vec2(0.0, texelSize.y)).r;

      float hUp = texture(uHeightMap, vUV + vec2(0.0, texelSize.y)).r;

      vec3 bumpNormal = normalize(vec3(-(hRight - hLeft) * uBumpStrength,-(hUp - hDown) * uBumpStrength,1.0));

      normal = normalize(TBN * bumpNormal);
  }

    vec3 lightDir = normalize(uLightDirection);

    float diffuse = max(dot(normal, lightDir), 0.0);
    float ambient = 0.6;
    float lighting = ambient + 0.6 * diffuse;

    vec4 texColor;

    if (uUseTexture) {
      texColor = texture(uTexture, vUV);
    } else {
      texColor = vec4(1.0, 0.0, 0.0, 1.0);
    }

    fragColor = vec4(texColor.rgb * lighting, texColor.a);
  }
`;
