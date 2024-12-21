import {
  GPUApiInterface,
  WebGLApiImplementation,
} from "../../dist";

async function initWebGL2(): Promise<void> {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  document.body.appendChild(canvas);
  const api = new WebGLApiImplementation() as GPUApiInterface;
  await api.initialize(canvas, 640, 480, true);
}

void initWebGL2();
