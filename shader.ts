import { PixelShaderProgram } from './drawer';
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
  Cube,
  IntersectionResult,
  Object3d,
  Plane,
  Ray,
  Sphere,
} from './definitions';
import { intetarion } from '.';

const maxDepth = 3;
const scale = intetarion;
const planes: Plane[] = [
  {
    type: 'plane',
    pos: [0, 1, 0],
    normal: [0, -1, 0],
    emission: [0, 0, 0],
    reflectivity: [1, 1, 1],
    roughness: 1,
    reflectionStrength: 0.5,
  },
];
const spheres: Sphere[] = [
  {
    type: 'sphere',
    pos: [-0.5, 0, 0],
    radius: 0.2,
    emission: [0.3, 0, 0],
    reflectivity: [0.5, 0.5, 0.5],
    roughness: 1,
    reflectionStrength: 0.5,
  },
  {
    type: 'sphere',
    pos: [0, 0, 0],
    radius: 0.2,
    emission: [0, 0, 0],
    reflectivity: [0.5, 0, 0],
    roughness: 1,
    reflectionStrength: 0.3,
  },
  {
    type: 'sphere',
    pos: [0, 8, 10],
    radius: 0.3,
    emission: [1, 1, 1],
    reflectivity: [1, 1, 1],
    roughness: 1,
    reflectionStrength: 0.3,
  },
];

const cubes: Cube[] = [
  {
    type: 'cube',
    pos: [0, 0, 5],
    size: [0.4, 4, -5],
    emission: [0, 0.3, 0],
    reflectivity: [1, 1, 1],
    roughness: 1,
    reflectionStrength: 1,
  },
];
const objects3d: Array<Object3d> = [
  ...spheres.sort((a, b) => b.pos[2] - a.pos[2]),
  ...planes,
  ...cubes,
];
const camera: Camera = {
  pos: [0, 0, -1],
  fov: 90,
  focalLength: 0.5,
};
export const shaderFn: PixelShaderProgram = (
  color,
  coord,
  resolution,
  mouse
) => {
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
      case 'cube':
        intersectionResult = cubeIntersection(ray, object);
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

function cubeIntersection(ray: Ray, cube: Cube): IntersectionResult {
  const [originX, originY, originZ] = ray.origin;
  const [directionX, directionY, directionZ] = ray.direction;
  const [cubePosX, cubePosY, cubePosZ] = cube.pos;
  const [sizeX, sizeY, sizeZ] = cube.size;

  // Calculate the minimum and maximum intersection distances for each axis
  const tMinX = (cubePosX - originX) / directionX;
  const tMaxX = (cubePosX + sizeX - originX) / directionX;
  const tMinY = (cubePosY - originY) / directionY;
  const tMaxY = (cubePosY + sizeY - originY) / directionY;
  const tMinZ = (cubePosZ - originZ) / directionZ;
  const tMaxZ = (cubePosZ + sizeZ - originZ) / directionZ;

  // Calculate the minimum and maximum intersection distances overall
  const tMin = Math.max(
    Math.max(Math.min(tMinX, tMaxX), Math.min(tMinY, tMaxY)),
    Math.min(tMinZ, tMaxZ)
  );
  const tMax = Math.min(
    Math.min(Math.max(tMinX, tMaxX), Math.max(tMinY, tMaxY)),
    Math.max(tMinZ, tMaxZ)
  );

  // Check if there is a valid intersection
  if (tMax < 0 || tMin > tMax) {
    return null;
  }

  // Calculate the intersection point
  const intersectionPoint = addVectors(
    ray.origin,
    multiplyVectorByScalar(ray.direction, tMin)
  ) as Vector3;

  // Calculate the normal at the intersection point
  let normal: Vector3 = [0, 0, 0];
  if (Math.abs(intersectionPoint[0] - cubePosX) < 0.0001) {
    normal = [-1, 0, 0];
  } else if (Math.abs(intersectionPoint[0] - (cubePosX + sizeX)) < 0.0001) {
    normal = [1, 0, 0];
  } else if (Math.abs(intersectionPoint[1] - cubePosY) < 0.0001) {
    normal = [0, -1, 0];
  } else if (Math.abs(intersectionPoint[1] - (cubePosY + sizeY)) < 0.0001) {
    normal = [0, 1, 0];
  } else if (Math.abs(intersectionPoint[2] - cubePosZ) < 0.0001) {
    normal = [0, 0, -1];
  } else if (Math.abs(intersectionPoint[2] - (cubePosZ + sizeZ)) < 0.0001) {
    normal = [0, 0, 1];
  }

  return {
    point: intersectionPoint,
    normal: normalize(normal) as Vector3,
  };
}
