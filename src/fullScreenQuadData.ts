import { GeometryMemoryLayout } from "./GPUApiInterface";

export const fullScreenQuad: {
  data: Float32Array;
  layout: GeometryMemoryLayout;
} = {
  data: new Float32Array([
    1,
    -1,
    1,
    0, // v1

    -1,
    1,
    0,
    1, // v2

    -1,
    -1,
    0,
    0, // v3

    1,
    -1,
    1,
    0, // v4

    1,
    1,
    1,
    1, // v5

    -1,
    1,
    0,
    1,
  ]), // v6

  layout: {
    attributes: [
      { dimensions: 2, normalize: false, format: "float32" }, // vertex
      { dimensions: 2, normalize: false, format: "float32" }, // uv
    ],
  },
};
