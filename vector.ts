type Vector = number[];

export type Vector2 = [number, number];
export type Vector3 = [number, number, number];
export type Vector4 = [number, number, number, number];

export function addVectors(v1: Vector, v2: Vector): Vector {
  return v1.map((val, index) => val + v2[index]);
}

export function subtractVectors(v1: Vector, v2: Vector): Vector {
  return v1.map((val, index) => val - v2[index]);
}

export function multiplyVectorByScalar(v: Vector, s: number): Vector {
  return v.map((val) => val * s);
}

export function dotProduct(v1: Vector, v2: Vector): number {
  return v1.reduce((sum, val, index) => sum + val * v2[index], 0);
}

export function magnitude(v: Vector): number {
  return Math.sqrt(v.reduce((sum, val) => sum + val ** 2, 0));
}

export function normalize(v: Vector): Vector {
  const mag = magnitude(v);
  return v.map((val) => val / mag);
}
