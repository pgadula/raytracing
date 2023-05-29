import { Vec3 } from 'wgpu-matrix';

export interface Plane {
  type: 'plane';
  pos: Vec3;
  emission: Vec3;
  reflectivity: Vec3;
  roughness: number;
  normal: Vec3;
  reflectionStrength: number;
}

export interface Sphere {
  type: 'sphere';
  pos: Vec3;
  radius: number;
  emission: Vec3;
  reflectivity: Vec3;
  roughness: number;
  reflectionStrength: number;
}

export interface Cube {
  type: 'cube';
  pos: Vec3;
  size: Vec3;
  emission: Vec3;
  reflectivity: Vec3;
  roughness: number;
  reflectionStrength: number;
}
export type Object3d = Sphere | Plane | Cube;

interface Intersection {
  point: Vec3;
  normal: Vec3;
}
export type IntersectionResult = Intersection | null;
export interface Camera {
  pos: Vec3;
  fov: number;
  focalLength: number;
}

export type Ray = {
  direction: Vec3;
  origin: Vec3;
};
