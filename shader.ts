import { PixelShaderFn } from './drawer';
import {
  addVectors,
  dotProduct,
  magnitude,
  multiply,
  multiplyVectorByScalar,
  normalize,
  subtractVectors,
  Vector3,
  Vector4,
} from './vector';
const focalLength = 1;
const maxDepth = 50;
const spheres: Sphere[] = [
  {
    pos: [-1, 1, -3],
    radius: 0.5,
    emission: [1, 0, 0],
    reflectivity: [1, 1, 1],
  },
  {
    pos: [6, 5, 9],
    radius: 0.9,
    emission: [0, 1, 1],
    reflectivity: [1, 1, 1],
  },
  {
    pos: [-2, -1, 2],
    radius: 0.2,
    emission: [0, 0, 0],
    reflectivity: [0.1, 0.1, 0.1],
  },
  {
    pos: [-0.8, -1, 2],
    radius: 0.2,
    emission: [0, 0, 0],
    reflectivity: [0.1, 0.1, 0.1],
  },
];

export const shaderFn: PixelShaderFn = (color, coord, resolution, mouse) => {
  const max_x = resolution[0] - 1;
  const max_y = resolution[1] - 1;
  const x = (coord[0] / max_x) * 2 - 1;
  const y = (coord[1] / max_y) * 2 - 1;
  const aspectRatio = resolution[0] / resolution[1];
  const direction = normalize([x * aspectRatio, y, -focalLength]) as Vector3;

  return trace([0, 0, -1], direction, maxDepth);
};

function trace(orgin: Vector3, direction: Vector3, depth): any {
  for (let sphere of spheres) {
    const intersection = sphereIntersection(orgin, direction, sphere);
    if (intersection) {
      let emission = sphere.emission;
      if (depth >= 0) {
        const newdir = normalize(
          subtractVectors(intersection, orgin)
        ) as Vector3;
        const reflectedColor = multiply(
          trace(intersection, newdir, depth - 1),
          sphere.reflectivity
        );
        emission = addVectors(emission, reflectedColor) as Vector3;
      }

      return emission;
    }
  }

  return [0, 0, 0, 255];
}

interface Sphere {
  pos: Vector3;
  radius: number;
  emission: Vector3;
  reflectivity: Vector3;
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
