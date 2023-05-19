import { Vector3 } from './vector';

export interface Plane {
  type: 'plane';
  pos: Vector3;
  emission: Vector3;
  reflectivity: Vector3;
  roughness: number;
  normal: Vector3;
  reflectionStrength: number;
}

export interface Sphere {
  type: 'sphere';
  pos: Vector3;
  radius: number;
  emission: Vector3;
  reflectivity: Vector3;
  roughness: number;
  reflectionStrength: number;
}
export type Object3d = Sphere | Plane;

interface Intersection {
  point: Vector3;
  normal: Vector3;
}
export type IntersectionResult = Intersection | null;
export interface Camera {
  pos: Vector3;
  fov: number;
  focalLength: number;
}

export type Ray = {
  direction: Vector3;
  origin: Vector3;
};
