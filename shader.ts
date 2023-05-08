import { PixelShaderFn } from './drawer';
import {
  addVectors,
  dotProduct,
  magnitude,
  multiplyVectorByScalar,
  normalize,
  subtractVectors,
  Vector3,
  Vector4,
} from './vector';
const focalLength = 55;
const spheres: Sphere[] = [
  {
    pos: [1, 0, 2],
    radius: 0.5,
    material: [255, 0, 0, 255],
  },
  {
    pos: [0, 0, 2],
    radius: 0.5,
    material: [255, 255, 0, 255],
  },
];

export const shaderFn: PixelShaderFn = (color, coord, resolution) => {
  const max_x = resolution[0] - 1;
  const max_y = resolution[1] - 1;
  const x = (coord[0] / max_x) * 2 - 1;
  const y = (coord[1] / max_y) * 2 - 1;
  const direction = normalize([x, y, -focalLength / 100]) as Vector3;

  return trace([0, 0, 0], direction);
};

function trace(orgin: Vector3, direction: Vector3, depth = 4): any {
  for (let sphere of spheres) {
    const intersection = sphereIntersection(
      orgin,
      direction,
      sphere
    ) as Vector3;
    if (intersection) {
      let color = sphere.material;
      if (depth > 0) {
        const ndir = normalize(subtractVectors(orgin, intersection)) as Vector3;
        const nColor = trace(intersection, ndir, depth - 1);
        color = addVectors(color, nColor) as Vector4;
      }

      return color;
    }
  }

  return [0, 0, 0, 255];
}

interface Sphere {
  pos: Vector3;
  radius: number;
  material: Vector4;
}
function sphereIntersection(orgin: Vector3, dir: Vector3, sphere: Sphere) {
  const sphereToOrigin = subtractVectors(orgin, sphere.pos);
  const projection = dotProduct(sphereToOrigin, dir);
  const distance = magnitude(sphereToOrigin) - projection;

  const radiusSquared = sphere.radius * sphere.radius;
  if (distance > radiusSquared) {
    return null;
  }

  const offset = Math.sqrt(radiusSquared - distance * distance);
  const intersection = addVectors(
    orgin,
    multiplyVectorByScalar(dir, projection - offset)
  );

  return intersection;
}
