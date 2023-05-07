// Import stylesheets
import './style.css';
import { createDrawer } from './drawer.ts';
import { shaderFn } from './shader';
const height = 250;
const width = 250;

const canvas: HTMLCanvasElement = document.getElementById(
  'canvas'
) as HTMLCanvasElement;
const fpsElement: HTMLSpanElement = document.getElementById(
  'fps'
) as HTMLSpanElement;
//setup
canvas.height = height;
canvas.width = width;

const ctx: CanvasRenderingContext2D = canvas.getContext('2d');
const image = new ImageData(height, width);
const drawer = createDrawer(image.data, [width, height]);

let start,
  previousTimeStamp,
  frames = 0;
start = 0;
previousTimeStamp = 0;
function animate() {
  drawer.shader(shaderFn);
}
animate();

function step(timestampMs: number) {
  const elapsed = timestampMs - start;
  previousTimeStamp = elapsed;
  ctx.putImageData(image, 0, 0);

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

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
