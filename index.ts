// Import stylesheets
import './style.css';
import { createDrawer } from './drawer';
import { shaderFn } from './shader';
const height = 300;
const width = 300;
const canvas: HTMLCanvasElement = document.getElementById(
  'canvas'
) as HTMLCanvasElement;
const fpsElement: HTMLSpanElement = document.getElementById(
  'fps'
) as HTMLSpanElement;
//setup
canvas.height = height;
canvas.width = width;
let ms = [0, 0];

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
function animate() {
  // drawer.shader(shaderFn);
}
drawer.shader(shaderFn);

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
