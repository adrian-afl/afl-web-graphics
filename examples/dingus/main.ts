import { Matrix4, Quaternion, Vector3 } from "@aeroflightlabs/linear-math";
import {
  GPUApiInterface,
  ShaderSamplers,
  ShaderUniforms,
  WebGLApiImplementation
} from "../../dist";

async function initWebGL2(): Promise<void> {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  document.body.appendChild(canvas);
  const api = new WebGLApiImplementation() as GPUApiInterface;
  await api.initialize(canvas, 640, 480, true);

  const dingusGeometry = await api.loadGeometry("dingus.obj");
  const dingusTexture = await api.loadTexture2D("dingus.jpg", {});

  const uniforms = {
    modelMatrix: {
      type: "matrix",
      dimensions: 4,
      format: "float",
    },
  } satisfies ShaderUniforms;

  const samplers = {
    colorTexture: {
      type: "sampler2D",
    },
  } satisfies ShaderSamplers;

  const shader = await api.createShader(
    "dingus.vert",
    "dingus.frag",
    uniforms,
    samplers
  );

  const dingusOrientation = new Matrix4();

  await shader.use();

  await shader.bindSamplers({
    colorTexture: dingusTexture
  });

  const defaultFramebuffer = await api.getDefaultFramebuffer();
  await defaultFramebuffer.bind();
  await defaultFramebuffer.clear([0, 0, 0, 1]);

  const startTime = Date.now();
  const loop = async (): Promise<void> => {
    const now = Date.now();
    const elapsed = (now - startTime) / 1000.0;

    dingusOrientation.fromRotationTranslationScale(
      new Quaternion().setAxisAngle(new Vector3(0.0, 1.0, 0.0), elapsed),
      new Vector3(0, 0, 0),
      new Vector3(0.4, 0.4, 0.4)
    );

    await shader.setUniforms({
      modelMatrix: dingusOrientation
    });

    await dingusGeometry.draw();

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    requestAnimationFrame(loop);
  };

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  requestAnimationFrame(loop);
}

void initWebGL2();
