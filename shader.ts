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
    pos: [1, 0, 4],
    radius: 0.5,
    material: [255, 0, 0, 255],
  },
  {
    pos: [0, 0, 2],
    radius: 1.0,
    material: [0, 255, 0, 255],
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
    const intersection = sphereIntersection(orgin, direction, sphere);
    if (intersection) {
      let color = sphere.material;
      if (depth >= 0) {
        const newdir = normalize(
          subtractVectors(intersection, orgin)
        ) as Vector3;
        const reflectedColor = trace(intersection, newdir, depth - 1);
        color = addVectors(color, reflectedColor) as Vector4;
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
function sphereIntersection(
  orgin: Vector3,
  dir: Vector3,
  sphere: Sphere
): Vector3 {
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

  return intersection as Vector3;
}
