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
interface Sphere {
  pos: Vector3;
  radius: number;
  emission: Vector3;
  reflectivity: Vector3;
  roughness: number;
}
interface Intersection {
  point: Vector3;
  normal: Vector3;
}

interface Camera {
  pos: Vector3;
  fov: number;
  focalLength: number;
}

const maxDepth = 55;
const scale = 100;
const spheres: Sphere[] = [
  {
    pos: [1, 10, 20],
    radius: 0.3,
    emission: [1, 1, 1],
    reflectivity: [1, 1, 1],
    roughness: 1,
  },
  {
    pos: [0, 0, 1],
    radius: 0.2,
    emission: [0, 0, 0],
    reflectivity: [0.3, 0.1, 0.1],
    roughness: 55,
  },
];
const camera: Camera = {
  pos: [0, 0, -1],
  fov: 60,
  focalLength: 0.55,
};
export const shaderFn: PixelShaderFn = (color, coord, resolution, mouse) => {
  const max_x = resolution[0] - 1;
  const max_y = resolution[1] - 1;
  const aspectRatio = resolution[0] / resolution[1];

  // Calculate the normalized device coordinates (NDC) within the range [-1, 1]
  const ndcX = (coord[0] / max_x) * 2 - 1;
  const ndcY = (coord[1] / max_y) * 2 - 1;

  // Convert FOV to radians and calculate the half-width and half-height of the near plane
  const fovRadians = (camera.fov * Math.PI) / 180;
  const halfHeight = Math.tan(fovRadians / 2);
  const halfWidth = aspectRatio * halfHeight;

  // Calculate the direction vector
  const direction = normalize([
    ndcX * halfWidth,
    ndcY * halfHeight,
    -camera.focalLength,
  ]) as Vector3;

  const tracedColor = trace(camera.pos, direction, maxDepth, spheres);
  const newColor = multiplyVectorByScalar(tracedColor, 1 / scale) as Vector3;
  return addVectors(color, newColor) as Vector3;
};
function trace(orgin: Vector3, direction: Vector3, depth, spheres): Vector3 {
  for (let sphere of spheres) {
    const intersectionResult = sphereIntersection(orgin, direction, sphere);
    if (intersectionResult) {
      let emission = sphere.emission;
      if (depth >= 0) {
        const newdir = intersectionResult.normal;
        const reflectedColor = multiply(
          trace(
            intersectionResult.point,
            newdir,
            depth - 1,
            spheres.filter((x) => x != sphere)
          ),
          sphere.reflectivity
        );
        emission = addVectors(emission, reflectedColor) as Vector3;
      }

      return emission;
    }
  }

  return [0, 0, 0];
}

function sphereIntersection(
  orgin: Vector3,
  dir: Vector3,
  sphere: Sphere
): Intersection | null {
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
  ) as Vector3;
  let roughness = multiplyVectorByScalar(
    getRandomUnitVector(),
    sphere.roughness
  ) as Vector3;
  let normal = normalize(subtractVectors(intersection, orgin)) as Vector3;
  normal = addVectors(normal, roughness) as Vector3;
  return {
    point: intersection,
    normal,
  };
}
function getRandomUnitVector() {
  const x = Math.random() * 2 - 1;
  const y = Math.random() * 2 - 1;
  const z = Math.random() * 2 - 1;
  const vector = [x, y, z];
  return normalize(vector);
}
