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

  console.log(await api.createTexture2D({
    width: 128,
    height: 128,
    format: "int8",
    dimensions: 1,
  }));

  console.log(await api.createTexture2D({
    width: 128,
    height: 128,
    format: "uint8",
    dimensions: 1,
  }));

  console.log(await api.createTexture2D({
    width: 128,
    height: 128,
    format: "uint8-normalized",
    dimensions: 1,
  }));

  console.log(api);
}

void initWebGL2();
