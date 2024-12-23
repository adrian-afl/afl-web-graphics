import {
  Matrix4,
  Quaternion,
  Vector3,
  Vector4,
} from "@aeroflightlabs/linear-math";
import {
  GPUApiInterface,
  ShaderSamplers,
  ShaderUniforms,
  WebGLApiImplementation,
} from "../../dist";
import { ShaderProgram } from "../../src";

async function initWebGL2(): Promise<void> {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 240;
  document.body.appendChild(canvas);
  const api = new WebGLApiImplementation() as GPUApiInterface;
  await api.initialize(canvas, 320, 240, true);

  const dingusResponse = await fetch("dingus.raw");
  const dingusGeometryBuffer = await dingusResponse.arrayBuffer();

  const dingusGeometry = await api.createGeometry({
    "attributes": [
      { "dimensions": 3, "normalize": false, "format": "float32" },
      { "dimensions": 3, "normalize": false, "format": "float32" },
      { "dimensions": 2, "normalize": false, "format": "float32" },
    ],
  }, dingusGeometryBuffer);
  const dingusTexture = await api.loadTexture2D("dingus.jpg", {});

  const modelUniforms = {
    modelMatrix: {
      type: "matrix",
      dimensions: 4,
      format: "float",
    },
  } satisfies ShaderUniforms;

  const cameraUniforms = {
    projectionMatrix: {
      type: "matrix",
      dimensions: 4,
      format: "float",
    },
  } satisfies ShaderUniforms;

  const uniforms = {
    ...modelUniforms, ...cameraUniforms,
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
    samplers,
  );

  const dingusOrientation = new Matrix4();

  const projectionMatrix = new Matrix4().perspective(70.0, 1.0, 0.1, 100.0);

  async function setProjectionMatrixUniform(shader: ShaderProgram<typeof cameraUniforms>): Promise<void> {
    await shader.setUniforms({
      projectionMatrix,
    });
  }

  await shader.use();

  await shader.bindSamplers({
    colorTexture: dingusTexture,
  });

  const defaultFramebuffer = await api.getDefaultFramebuffer();
  await defaultFramebuffer.bind();

  const startTime = Date.now();
  const loop = async (): Promise<void> => {
    const now = Date.now();
    const elapsed = (now - startTime) / 1000.0;

    dingusOrientation.fromRotationTranslationScale(
      new Quaternion().setAxisAngle(new Vector3(0.0, 1.0, 0.0), -elapsed),
      new Vector3(0, -0.3, -2),
      new Vector3(0.4, 0.4, 0.4),
    );

    await shader.setUniforms({
      modelMatrix: dingusOrientation,
    });

    await setProjectionMatrixUniform(shader);

    await defaultFramebuffer.clear({color: new Vector4(1.0, 1.0, 0.0, 1.0), depth: 1.0});
    await dingusGeometry.draw();

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    requestAnimationFrame(loop);
  };

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  requestAnimationFrame(loop);
}

void initWebGL2();
