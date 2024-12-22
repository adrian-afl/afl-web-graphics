import {
  Matrix2,
  Matrix3,
  Matrix4,
  Vector2,
  Vector3,
  Vector4,
} from "@aeroflightlabs/linear-math";

export type MaybePromise<T> = Promise<T> | T;

export type ShaderUniformFormat = "int" | "uint" | "float";
export interface ShaderUniformVectorArrayFormat {
  int: Int32List;
  uint: Uint32List;
  float: Float32List;
}

export interface TextureInput2DParameters {
  width: number;
  height: number;
  mipmap?: boolean;
  dimensions: 1 | 2 | 3 | 4;
  format:
    | "int8"
    | "uint8"
    | "int16"
    | "uint16"
    | "int32"
    | "uint32"
    | "float16"
    | "float32";
  minFilter?: "nearest" | "linear" | "mipmap-linear";
  magFilter?: "nearest" | "linear";
  wrapX?: "clamp" | "repeat" | "mirrored-repeat";
  wrapY?: "clamp" | "repeat" | "mirrored-repeat";
}

export interface LoadTextureInput2D {
  mipmap?: boolean;
  minFilter?: "nearest" | "linear" | "mipmap-linear";
  magFilter?: "nearest" | "linear";
  wrapX?: "clamp" | "repeat" | "mirrored-repeat";
  wrapY?: "clamp" | "repeat" | "mirrored-repeat";
}

export interface GeometryMemoryLayout {
  attributes: {
    format:
      | "int8"
      | "uint8"
      | "int16"
      | "uint16"
      | "int32"
      | "uint32"
      | "float16"
      | "float32";
    normalize: boolean; // causes int values to be cast to -1 to 1 or 0 to 1 floats in shaders
    dimensions: 1 | 2 | 3 | 4;
  }[];
}

export interface Geometry {
  draw(): MaybePromise<void>;
  free(): MaybePromise<void>;
}

export interface DefaultFramebuffer {
  clear(color: number[] & { length: 4 }, depth?: number): MaybePromise<void>;
  bind(): MaybePromise<void>;
  resize(width: number, height: number): MaybePromise<void>;
  getSize(): MaybePromise<{ width: number; height: number }>;
}

export interface Framebuffer extends DefaultFramebuffer {
  setAttachments(textures: Texture2D[]): MaybePromise<void>;
  readPixels(
    x: number,
    y: number,
    width: number,
    height: number,
    slot: number,
    destination: ArrayBufferView,
    destinationOffset: number
  ): void;
}

export interface Texture2D {
  getHandle(): MaybePromise<unknown>;
  getParameters(): MaybePromise<TextureInput2DParameters>;
  getByteSize(): number;
  free(): MaybePromise<void>;
}

export interface ShaderUniformsScalar {
  type: "scalar";
  format: ShaderUniformFormat;
  isArray?: boolean;
}

export interface ShaderUniformsVector {
  type: "vector";
  format: ShaderUniformFormat;
  dimensions: 2 | 3 | 4;
  isArray?: boolean;
}

export interface ShaderUniformsMatrix {
  type: "matrix";
  format: ShaderUniformFormat;
  dimensions: 2 | 3 | 4;
  transpose?: boolean;
  isArray?: boolean;
}

export type SamplerType =
  | "sampler1D"
  | "sampler2D"
  | "sampler3D"
  | "samplerCube";

export interface ShaderUniformsSampler {
  type: SamplerType;
  isArray?: boolean;
}

export type ShaderUniforms = Readonly<{
  [K: string]:
    | ShaderUniformsScalar
    | ShaderUniformsVector
    | ShaderUniformsMatrix
    | ShaderUniformsSampler;
}>;

export type ShaderSamplers = Readonly<{
  [K: string]: ShaderUniformsSampler;
}>;

export interface ShaderProgram<
  Uniforms extends ShaderUniforms,
  Samplers extends ShaderSamplers,
> {
  use(): MaybePromise<void>;

  bindSamplers(binds: {
    [K in Extract<keyof Samplers, string>]: Texture2D;
  }): MaybePromise<void>;

  bindSampler(
    activeTextureIndex: number,
    name: Extract<keyof Samplers, string>,
    texture: Texture2D
  ): MaybePromise<void>;

  setUniforms(
    binds: Record<
      Extract<keyof Uniforms, string>,
      | number
      | number[]
      | Vector2
      | Vector3
      | Vector4
      | Matrix2
      | Matrix3
      | Matrix4
      | Vector2[]
      | Vector3[]
      | Vector4[]
      | Matrix2[]
      | Matrix3[]
      | Matrix4[]
    >
  ): MaybePromise<void>;
}

export interface GPUApiInterface {
  initialize(
    canvas: HTMLCanvasElement,
    outputWidth: number,
    outputHeight: number,
    withDepth: boolean
  ): MaybePromise<void>;

  setBlending(blending: "none" | "add"): MaybePromise<void>;
  setCullFace(blending: "none" | "front" | "back"): MaybePromise<void>;

  createGeometry(
    layout: GeometryMemoryLayout,
    data: ArrayBuffer
  ): MaybePromise<Geometry>;
  loadGeometry(file: string): MaybePromise<Geometry>;

  createShader<
    Uniforms extends ShaderUniforms,
    Samplers extends ShaderSamplers,
  >(
    vertex: string,
    fragment: string,
    uniforms: Uniforms,
    samplers: Samplers
  ): MaybePromise<ShaderProgram<Uniforms, Samplers>>;

  createTexture2D(
    params: TextureInput2DParameters,
    data?: ArrayBufferView | null
  ): MaybePromise<Texture2D>;
  loadTexture2D(
    file: string,
    params: LoadTextureInput2D
  ): MaybePromise<Texture2D>;

  getDefaultFramebuffer(): MaybePromise<DefaultFramebuffer>;
  resizeDefaultFramebuffer(width: number, height: number): MaybePromise<void>;
  createFramebuffer(
    width: number,
    height: number,
    withDepth: boolean
  ): MaybePromise<Framebuffer>;
}
