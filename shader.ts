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
const focalLength = 95;
const spheres: Sphere[] = [
  {
    pos: [1, 0, 1],
    radius: 0.5,
    emission: [255, 0, 0],
    reflectivity: [0.5, 1, 1],
  },
  {
    pos: [-1, 0, 2],
    radius: 0.5,
    emission: [155, 50, 0],
    reflectivity: [0.5, 0, 0],
  },
  {
    pos: [1, -1, 2],
    radius: 0.5,
    emission: [255, 255, 255],
    reflectivity: [0.1, 0.1, 0.1],
  },
  {
    pos: [1, 1.5, 2],
    radius: 0.5,
    emission: [0, 0, 255],
    reflectivity: [1, 0.5, 1],
  },
];

export const shaderFn: PixelShaderFn = (color, coord, resolution, mouse) => {
  spheres[0].pos[0] = mouse[0];
  spheres[0].pos[1] = mouse[1];
  const max_x = resolution[0] - 1;
  const max_y = resolution[1] - 1;
  const x = (coord[0] / max_x) * 2 - 1;
  const y = (coord[1] / max_y) * 2 - 1;
  const direction = normalize([x, y, -focalLength / 100]) as Vector3;

  return trace([0, 0, -2], direction);
};

function trace(orgin: Vector3, direction: Vector3, depth = 8): any {
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
