import { PixelShaderProgram } from './drawer';
import { sign, Vector3 } from './vector';
import {
  Camera,
  Cube,
  IntersectionResult,
  Object3d,
  Plane,
  Ray,
  Sphere,
} from './definitions';
import { Vec3, vec3 } from 'wgpu-matrix';

const maxDepth = 26;
const numberOfRays = 3;

const camera: Camera = {
  pos: [0, 0, -1],
  fov: 80,
  focalLength: 0.55,
};
const planes: Plane[] = [
  {
    emission: [0, 0, 0],
    normal: [0, -1, 0],
    pos: [0, 5, 0],
    reflectionStrength: 0.5,
    reflectivity: [1, 1, 1],
    roughness: 0.01,
    type: 'plane',
  },
];
const spheres: Sphere[] = [
  {
    type: 'sphere',
    pos: [-1.5, 1, 0.5],
    radius: 0.5,
    emission: [1, 0, 1],
    reflectivity: [1, 1, 1],
    roughness: 0.01,
    reflectionStrength: 1,
  },
  {
    type: 'sphere',
    pos: [2, -1, 2],
    radius: 0.5,
    emission: [0, 0, 0],
    reflectivity: [0, 0, 1],
    roughness: 0.01,
    reflectionStrength: 1,
  },
  {
    type: 'sphere',
    pos: [0, -1, 2],
    radius: 0.5,
    emission: [0, 1, 1],
    reflectivity: [1, 0, 1],
    roughness: 0.001,
    reflectionStrength: 1,
  },
  {
    type: 'sphere',
    pos: [0, 0.5, 0.5],
    radius: 0.3,
    emission: [1, 1, 1],
    reflectivity: [1, 1, 1],
    roughness: 0.01,
    reflectionStrength: 1,
  },
];
const cubes: Cube[] = [];
const objects3d: Array<Object3d> = [...spheres, ...planes, ...cubes].sort(
  (a, b) => a.pos[2] - b.pos[2]
);

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
  const direction = vec3.normalize([
    ndcX * halfWidth,
    ndcY * halfHeight,
    -camera.focalLength,
  ]);
  const ray: Ray = {
    direction,
    origin: camera.pos,
  };
  const results = [];
  for (let i = 0; i < numberOfRays; i++) {
    const tracedColor = trace(ray, maxDepth, objects3d);
    results.push(tracedColor);
  }
  const newColor = results.reduce((c, p) => vec3.add(c, p), [0, 0, 0]);
  return vec3.divScalar(newColor, numberOfRays);
};
function trace(ray: Ray, depth: number, objects: Object3d[]): Vec3 {
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
        let reflectedColor = vec3.multiply(
          trace(
            newRay,
            depth - 1,
            objects3d.filter((x) => x != object)
          ),
          object.reflectivity
        );
        reflectedColor = vec3.mulScalar(
          reflectedColor,
          object.reflectionStrength
        );
        emission = vec3.add(emission, reflectedColor);
      }

      return emission;
    }
  }

  return [0, 0, 0];
}

function sphereIntersection(ray: Ray, sphere: Sphere): IntersectionResult {
  const sphereToOrigin = vec3.sub(ray.origin, sphere.pos);
  const projection = vec3.dot(sphereToOrigin, ray.direction);
  const distance = vec3.len(sphereToOrigin) - projection;

  const radiusSquared = sphere.radius * sphere.radius;
  if (distance > radiusSquared) {
    return null;
  }

  const offset = Math.sqrt(radiusSquared - distance * distance);
  const intersection = vec3.add(
    ray.origin,
    vec3.mulScalar(ray.direction, projection - offset)
  );
  let roughness = vec3.mulScalar(
    getRandomUnitVector(ray.direction),
    sphere.roughness
  );
  let normal = vec3.normalize(vec3.sub(intersection, ray.origin));
  normal = vec3.add(normal, roughness);
  return {
    point: intersection,
    normal,
  };
}

function planeIntersection(ray: Ray, plane: Plane): IntersectionResult {
  const dotProductResult = vec3.dot(plane.normal, ray.direction);

  if (Math.abs(dotProductResult) < 0.01) {
    return null;
  }

  const t =
    vec3.dot(vec3.sub(plane.pos, ray.origin), plane.normal) /
    vec3.dot(ray.direction, plane.normal);

  if (t < 0) {
    return null; // Intersection point is behind the ray's origin
  }

  const intersectionPoint = vec3.add(
    ray.origin,
    vec3.mulScalar(ray.direction, t)
  ) as Vec3;
  let roughness = vec3.mulScalar(
    getRandomUnitVector(ray.direction),
    plane.roughness
  );
  let normal = vec3.normalize(vec3.sub(intersectionPoint, ray.origin));
  normal = vec3.add(normal, roughness);

  return {
    point: intersectionPoint,
    normal: normal,
  };
}

function getRandomUnitVector(normal) {
  const x = Math.random() * 2 - 1;
  const y = Math.random() * 2 - 1;
  const z = Math.random() * 2 - 1;

  let direction = vec3.random();
  const d = vec3.dot(normal, direction);
  const s = sign(d);
  direction = vec3.mul(normal, vec3.mulScalar(direction, s));
  return vec3.normalize(direction);
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
  const intersectionPoint = vec3.add(
    ray.origin,
    vec3.mulScalar(ray.direction, tMin)
  );

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
    normal: vec3.normalize(normal) as Vector3,
  };
}
