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
  format: ShaderUniformFormat;
}

export interface ShaderUniformsVector {
  format: ShaderUniformFormat;
  dimensions: 2 | 3 | 4;
}

export interface ShaderUniformsMatrix {
  format: ShaderUniformFormat;
  dimensions: 2 | 3 | 4;
}

export interface ShaderUniformsSampler {
  dimensions: TextureInput2DParameters["dimensions"];
  format: TextureInput2DParameters["format"];
}

export interface ShaderUniformsLayout {
  single: {
    scalars: Record<string, ShaderUniformsScalar>;
    vectors: Record<string, ShaderUniformsVector>;
    matrices: Record<string, ShaderUniformsMatrix>;
  };
  arrays: {
    scalars: Record<string, ShaderUniformsScalar>;
    vectors: Record<string, ShaderUniformsVector>;
    matrices: Record<string, ShaderUniformsMatrix>;
  };
  samplers: Record<string, ShaderUniformsSampler>;
}

// samplers binds

export interface ShaderSamplerBind<
  Layout extends ShaderUniformsLayout,
  Name extends Extract<keyof Layout["samplers"], string>,
> {
  name: Name;
  texture: Texture2D;
}

// single binds

export interface ShaderUniformSingleScalarBind<
  Layout extends ShaderUniformsLayout,
  Name extends Extract<keyof Layout["single"]["scalars"], string>,
> {
  name: Name;
  value: number;
}

export interface ShaderUniformSingleVectorBind<
  Layout extends ShaderUniformsLayout,
  Name extends Extract<keyof Layout["single"]["vectors"], string>,
> {
  name: Name;
  value: number[];
}

export interface ShaderUniformSingleMatrixBind<
  Layout extends ShaderUniformsLayout,
  Name extends Extract<keyof Layout["single"]["matrices"], string>,
> {
  name: Name;
  transpose?: boolean;
  value: number[];
}

// array binds

export interface ShaderUniformArrayScalarBind<
  Layout extends ShaderUniformsLayout,
  Name extends Extract<keyof Layout["arrays"]["scalars"], string>,
> {
  name: Name;
  values: number[];
}

export interface ShaderUniformArrayVectorBind<
  Layout extends ShaderUniformsLayout,
  Name extends Extract<keyof Layout["arrays"]["vectors"], string>,
> {
  name: Name;
  values: number[];
}

export interface ShaderUniformArrayMatrixBind<
  Layout extends ShaderUniformsLayout,
  Name extends Extract<keyof Layout["arrays"]["matrices"], string>,
> {
  name: Name;
  transpose?: boolean;
  values: number[];
}

export interface ShaderProgram<Layout extends ShaderUniformsLayout> {
  use(): MaybePromise<void>;

  setSamplersArray(
    binds: ShaderSamplerBind<
      Layout,
      Extract<keyof Layout["samplers"], string>
    >[]
  ): MaybePromise<void>;

  setSampler(
    activeTextureIndex: number,
    bind: ShaderSamplerBind<Layout, Extract<keyof Layout["samplers"], string>>
  ): MaybePromise<void>;

  setUniforms(uniforms: {
    single?: {
      scalars?: ShaderUniformSingleScalarBind<
        Layout,
        Extract<keyof Layout["single"]["scalars"], string>
      >[];
      vectors?: ShaderUniformSingleVectorBind<
        Layout,
        Extract<keyof Layout["single"]["vectors"], string>
      >[];
      matrices?: ShaderUniformSingleMatrixBind<
        Layout,
        Extract<keyof Layout["single"]["matrices"], string>
      >[];
    };
    arrays?: {
      scalars?: ShaderUniformArrayScalarBind<
        Layout,
        Extract<keyof Layout["arrays"]["scalars"], string>
      >[];
      vectors?: ShaderUniformArrayVectorBind<
        Layout,
        Extract<keyof Layout["arrays"]["vectors"], string>
      >[];
      matrices?: ShaderUniformArrayMatrixBind<
        Layout,
        Extract<keyof Layout["arrays"]["matrices"], string>
      >[];
    };
  }): MaybePromise<void>;
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

  createShader<Layout extends ShaderUniformsLayout>(
    vertex: string,
    fragment: string,
    uniformLayout: Layout
  ): MaybePromise<ShaderProgram<Layout>>;

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
