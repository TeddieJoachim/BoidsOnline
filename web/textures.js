
export function loadTexture(gl, url) {
  const texture = gl.createTexture();

  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Temporary magenta pixel while the image loads
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([255, 0, 255, 255])
  );

  const image = new Image();

  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Flip image vertically to match WebGL UV coordinates
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      image
    );

    gl.generateMipmap(gl.TEXTURE_2D);

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR
    );

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MAG_FILTER,
      gl.LINEAR
    );

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_S,
      gl.REPEAT
    );

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_T,
      gl.REPEAT
    );
  };

  image.onerror = () => {
    console.error("Failed to load texture:", url);
  };

  image.src = url;

  return texture;
}
