// Import stylesheets
import './style.css';
import { createDrawer } from './drawer';
import { shaderFn } from './shader';
import { Cube, Object3d, Plane, Sphere } from './definitions';
const height = 250;
const width = 250;
const canvas: HTMLCanvasElement = document.getElementById(
  'canvas'
) as HTMLCanvasElement;
const fpsElement: HTMLSpanElement = document.getElementById(
  'fps'
) as HTMLSpanElement;
const renderButton: HTMLButtonElement = document.getElementById(
  'render'
) as HTMLButtonElement;
//setup
canvas.height = height;
canvas.width = width;
let ms = [0, 0];
renderButton.addEventListener('click', () => {
  shaderRunner(shaderFn);
});
canvas.addEventListener('mousemove', (m) => {
  const x = (m.x / width) * -4 - 1;
  const y = (m.y / height) * -4 - 1;
  ms[0] = x;
  ms[1] = y;
});

const ctx: CanvasRenderingContext2D = canvas.getContext('2d');
const image = new ImageData(height, width);
const drawer = createDrawer(image.data, [width, height], ms);

let start,
  previousTimeStamp,
  frames = 0;
start = 0;
previousTimeStamp = 0;

const planes: Plane[] = [
  {
    emission: [0, 0, 0],
    normal: [0, 1, 0],
    pos: [0, 5, 0],
    reflectionStrength: 1,
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
    pos: [1.5, 1, 0],
    radius: 0.5,
    emission: [0, 0, 0],
    reflectivity: [0.5, 0.5, 0.5],
    roughness: 0.001,
    reflectionStrength: 1,
  },
  {
    type: 'sphere',
    pos: [0, 1, 1],
    radius: 0.3,
    emission: [0, 0, 0],
    reflectivity: [0.2, 0.6, 1],
    roughness: 0.001,
    reflectionStrength: 1,
  },
  {
    type: 'sphere',
    pos: [0, 0, -2],
    radius: 0.5,
    emission: [1, 1, 1],
    reflectivity: [1, 1, 1],
    roughness: 0.01,
    reflectionStrength: 1,
  },
];
const cubes: Cube[] = [];
const objects3d: Array<Object3d> = [...spheres, ...planes, ...cubes].sort(
  (a, b) => b.pos[2] - a.pos[2]
);

let shaderRunner = drawer.shader(objects3d);
function animate() {}
function step(timestampMs: number) {
  const elapsed = timestampMs - start;
  previousTimeStamp = elapsed;
  ctx.putImageData(image, 0, 0);
  animate();

  frames++;
  if (elapsed >= 1000) {
    // 1 second
    const fps = frames / (elapsed / 1000);
    fpsElement.innerHTML = `${fps.toFixed(2)}`;
    frames = 0;
    start = timestampMs;
  }

  requestAnimationFrame(step);
}
requestAnimationFrame(step);
