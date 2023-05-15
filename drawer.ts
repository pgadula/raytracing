import { Vector2, Vector4 } from './vector';

export type PixelShaderFn = (
  fragColor: Vector4,
  fragCoord: Vector2,
  viewport: Vector2,
  mouse: Vector2
) => Vector4;

const drawSphereFactor =
  (pixels: Uint8ClampedArray, size: Vector2) =>
  (radius: number, center: Vector2, color: Vector4) => {
    for (let y = 0; y < size[1]; y++) {
      const dy = y - center[1];
      const dySqrt = dy * dy;
      for (let x = 0; x < size[0]; x++) {
        const dx = x - center[0];
        const dxSqrt = dx * dx;
        const index = (y * size[0] + x) * 4;
        const d = dxSqrt + dySqrt;
        if (d < radius * radius) {
          pixels[index] = color[0];
          pixels[index + 1] = color[1];
          pixels[index + 2] = color[2];
          pixels[index + 3] = color[3];
        }
      }
    }
  };
function fragmentProgramFactor(
  pixels: Uint8ClampedArray,
  size: Vector2,
  mouse: Vector2
) {
  return (fn: PixelShaderFn) => {
    for (let y = 0; y < size[1]; y++) {
      for (let x = 0; x < size[0]; x++) {
        if (x === 0) {
        }
        const index = (y * size[0] + x) * 4;

        const fragColor: Vector4 = [
          pixels[index],
          pixels[index + 1],
          pixels[index + 2],
          pixels[index + 3],
        ];

        const fragCoord: Vector2 = [x, y];
        const result = fn(fragColor, fragCoord, size, mouse);
        pixels[index] = result[0];
        pixels[index + 1] = result[1];
        pixels[index + 2] = result[2];
        pixels[index + 3] = 255;
      }
    }
  };
}

export const createDrawer = (
  pixels: Uint8ClampedArray,
  size: Vector2,
  mouse: Vector2
) => ({
  drawSphere: drawSphereFactor(pixels, size),
  shader: fragmentProgramFactor(pixels, size, mouse),
});
