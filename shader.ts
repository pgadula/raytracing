import { PixelShaderFn } from './drawer';
import {
  addVectors,
  dotProduct,
  magnitude,
  multiply,
  multiplyVectorByScalar,
  normalize,
  sign,
  subtractVectors,
  Vector3,
  Vector4,
} from './vector';
import {
  Camera,
  IntersectionResult,
  Object3d,
  Plane,
  Ray,
  Sphere,
} from './definitions';

const maxDepth = 5;
const scale = 10;
const planes: Plane[] = [
  // {
  //   type: 'plane',
  //   pos: [0, 1, 0],
  //   normal: [0, -1, 0],
  //   emission: [0, 0, 0],
  //   reflectivity: [0.5, 0.5, 0.5],
  //   roughness: 1,
  //   reflectionStrength: 0.5,
  // },
];
const spheres: Sphere[] = [
  {
    type: 'sphere',
    pos: [-0.5, 0, 0],
    radius: 0.2,
    emission: [0, 0, 0],
    reflectivity: [0.8, 0.5, 0.5],
    roughness: 1,
    reflectionStrength: 0.9,
  },
  {
    type: 'sphere',
    pos: [0, 0, 0],
    radius: 0.2,
    emission: [0, 0, 0],
    reflectivity: [0.5, 0.5, 0.5],
    roughness: 1,
    reflectionStrength: 0.9,
  },
  {
    type: 'sphere',
    pos: [0, 8, 10],
    radius: 0.3,
    emission: [1, 0.5, 0.5],
    reflectivity: [1, 1, 1],
    roughness: 1,
    reflectionStrength: 0.5,
  },
];
const objects3d: Array<Object3d> = [
  ...spheres.sort((a, b) => b.pos[2] - a.pos[2]),
  ...planes,
];
const camera: Camera = {
  pos: [0, 0, -1],
  fov: 90,
  focalLength: 0.5,
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
  const ray: Ray = {
    direction,
    origin: camera.pos,
  };
  const tracedColor = trace(ray, maxDepth, objects3d);
  const newColor = multiplyVectorByScalar(tracedColor, 1 / scale) as Vector3;
  return addVectors(color, newColor) as Vector3;
};
function trace(ray: Ray, depth: number, objects: Object3d[]): Vector3 {
  for (let object of objects) {
    let intersectionResult: IntersectionResult;
    switch (object.type) {
      case 'sphere':
        intersectionResult = sphereIntersection(ray, object);
        break;
      case 'plane':
        intersectionResult = planeIntersection(ray, object);
        break;
    }

    if (intersectionResult) {
      let emission = object.emission;
      if (depth >= 0) {
        const newRay: Ray = {
          origin: intersectionResult.point,
          direction: intersectionResult.normal,
        };
        let reflectedColor = multiply(
          trace(
            newRay,
            depth - 1,
            objects3d.filter((x) => x != object)
          ),
          object.reflectivity
        );
        reflectedColor = multiplyVectorByScalar(
          reflectedColor,
          object.reflectionStrength
        );
        emission = addVectors(emission, reflectedColor) as Vector3;
      }

      return emission;
    }
  }

  return [0, 0, 0];
}

function sphereIntersection(ray: Ray, sphere: Sphere): IntersectionResult {
  const sphereToOrigin = subtractVectors(ray.origin, sphere.pos);
  const projection = dotProduct(sphereToOrigin, ray.direction);
  const distance = magnitude(sphereToOrigin) - projection;

  const radiusSquared = sphere.radius * sphere.radius;
  if (distance > radiusSquared) {
    return null;
  }

  const offset = Math.sqrt(radiusSquared - distance * distance);
  const intersection = addVectors(
    ray.origin,
    multiplyVectorByScalar(ray.direction, projection - offset)
  ) as Vector3;
  let roughness = multiplyVectorByScalar(
    getRandomUnitVector(ray.direction),
    sphere.roughness
  ) as Vector3;
  let normal = normalize(subtractVectors(intersection, ray.origin)) as Vector3;
  normal = addVectors(normal, roughness) as Vector3;
  return {
    point: intersection,
    normal,
  };
}

function planeIntersection(ray: Ray, plane: Plane): IntersectionResult {
  const dotProductResult = dotProduct(plane.normal, ray.direction);

  if (Math.abs(dotProductResult) < 0.01) {
    return null;
  }

  const t =
    dotProduct(subtractVectors(plane.pos, ray.origin), plane.normal) /
    dotProduct(ray.direction, plane.normal);

  if (t < 0) {
    return null; // Intersection point is behind the ray's origin
  }

  const intersectionPoint = addVectors(
    ray.origin,
    multiplyVectorByScalar(ray.direction, t)
  ) as Vector3;
  let roughness = multiplyVectorByScalar(
    getRandomUnitVector(ray.direction),
    plane.roughness
  ) as Vector3;
  let normal = normalize(
    subtractVectors(intersectionPoint, ray.origin)
  ) as Vector3;
  normal = addVectors(normal, roughness) as Vector3;

  return {
    point: intersectionPoint,
    normal: normal,
  };
}

function getRandomUnitVector(normal) {
  const x = Math.random() * 2 - 1;
  const y = Math.random() * 2 - 1;
  const z = Math.random() * 2 - 1;
  let direction = [x, y, z];
  const d = dotProduct(normal, direction);
  const s = sign(d);
  direction = multiply(normal, multiplyVectorByScalar(direction, s));
  return normalize(direction);
}
