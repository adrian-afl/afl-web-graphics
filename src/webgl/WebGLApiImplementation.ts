import {
  DefaultFramebuffer,
  Framebuffer,
  Geometry,
  GeometryMemoryLayout,
  GPUApiInterface,
  LoadTextureInput2D,
  MaybePromise,
  ShaderProgram,
  ShaderUniformsLayout,
  Texture2D,
  TextureInput2DParameters,
} from "../GPUApiInterface";
import { loadAndResolveShaderSource } from "./loadAndResolveShaderSource";
import { loadObjFileAsSingleGeometry } from "./objLoader/loadObjFile";
import {
  WebGLDefaultFramebuffer,
  WebGLFramebufferClass,
} from "./WebGLFramebuffer";
import { WebGLGeometry } from "./WebGLGeometry";
import { WebGLShaderProgram } from "./WebGLShaderProgram";
import { genericToWebGLMappers, WebGLTexture2D } from "./WebGLTexture2D";

export class WebGLApiImplementation implements GPUApiInterface {
  private defaultFramebuffer!: WebGLDefaultFramebuffer;
  private gl!: WebGL2RenderingContext;

  public initialize(
    canvas: HTMLCanvasElement,
    outputWidth: number,
    outputHeight: number,
    withDepth: boolean
  ): void {
    const gl = canvas.getContext("webgl2");

    if (!gl) {
      throw new Error("No WEBGL2 support");
    }
    this.gl = gl;

    if (!this.gl.getExtension("EXT_color_buffer_float")) {
      throw new Error("Rendering to floating point textures not supported");
    }
    console.log(
      "MAX_VERTEX_UNIFORM_VECTORS",
      gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS)
    );
    console.log(
      "MAX_TEXTURE_IMAGE_UNITS",
      gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)
    );
    console.log(
      "MAX_COMBINED_TEXTURE_IMAGE_UNITS",
      gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS)
    );
    console.log(
      "MAX_ARRAY_TEXTURE_LAYERS",
      gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS)
    );
    console.log(
      "MAX_COLOR_ATTACHMENTS",
      gl.getParameter(gl.MAX_COLOR_ATTACHMENTS)
    );
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);
    this.defaultFramebuffer = new WebGLDefaultFramebuffer(
      this.gl,
      outputWidth,
      outputHeight,
      withDepth
    );
  }

  public setBlending(blending: "none" | "add"): void {
    if (blending === "none") {
      this.gl.disable(this.gl.BLEND);
    }
    if (blending === "add") {
      this.gl.enable(this.gl.BLEND);
      this.gl.blendEquation(this.gl.FUNC_ADD);
    }
  }

  public setCullFace(blending: "none" | "front" | "back"): void {
    if (blending === "none") {
      this.gl.disable(this.gl.CULL_FACE);
    }
    if (blending === "front") {
      this.gl.enable(this.gl.CULL_FACE);
      this.gl.cullFace(this.gl.FRONT);
    }
    if (blending === "back") {
      this.gl.enable(this.gl.CULL_FACE);
      this.gl.cullFace(this.gl.BACK);
    }
  }

  public createGeometry(
    layout: GeometryMemoryLayout,
    data: ArrayBuffer
  ): MaybePromise<Geometry> {
    return new WebGLGeometry(this.gl, layout, data);
  }

  public async loadGeometry(file: string): Promise<Geometry> {
    const fileRequest = await fetch(file);
    if (fileRequest.headers.get("Content-type") === "text/html") {
      throw new Error(`Failed loading mesh ${file}, got html`);
    }
    if (file.endsWith(".obj")) {
      const fileContent = await fileRequest.text();

      const objFileData = loadObjFileAsSingleGeometry(fileContent);
      const vao = objFileData.intermediate.getVertexArray();
      return this.createGeometry(vao.layout, vao.data);
    } else if (file.endsWith(".raw")) {
      const fileContent = await fileRequest.arrayBuffer();
      return this.createGeometry(
        {
          // placeholder for now
          attributes: [
            { dimensions: 3, normalize: false, format: "float32" },
            { dimensions: 2, normalize: false, format: "float32" },
            { dimensions: 3, normalize: false, format: "float32" },
            { dimensions: 4, normalize: false, format: "float32" },
          ],
        },
        fileContent
      );
    } else {
      throw new Error(`Unsupported model type for file ${file}`);
    }
  }

  public async createShader<Layout extends ShaderUniformsLayout>(
    vertex: string,
    fragment: string,
    uniformLayout: Layout
  ): Promise<ShaderProgram<Layout>> {
    const vertexSrc = await loadAndResolveShaderSource(vertex);
    const fragmentSrc = await loadAndResolveShaderSource(fragment);

    return new WebGLShaderProgram(
      this.gl,
      vertexSrc,
      fragmentSrc,
      uniformLayout
    );
  }

  public createTexture2D(
    params: TextureInput2DParameters,
    data?: ArrayBufferView | null
  ): MaybePromise<Texture2D> {
    const mappedFormats = genericToWebGLMappers.format(
      params.dimensions,
      params.format
    );
    return new WebGLTexture2D(this.gl, params, {
      data: data ?? null,
      width: params.width,
      height: params.height,
      mipmap: params.mipmap ?? false,
      internalFormat: mappedFormats.internalFormat,
      type: mappedFormats.type,
      format: mappedFormats.format,
      magFilter: genericToWebGLMappers.magFilter(params.magFilter ?? "nearest"),
      minFilter: genericToWebGLMappers.minFilter(params.minFilter ?? "nearest"),
      wrapS: genericToWebGLMappers.wrapX(params.wrapX ?? "clamp"),
      wrapT: genericToWebGLMappers.wrapY(params.wrapY ?? "clamp"),
    });
  }

  public loadTexture2D(
    file: string,
    params: LoadTextureInput2D
  ): MaybePromise<Texture2D> {
    const webglParams = {
      mipmap: params.mipmap ?? true,
      magFilter: genericToWebGLMappers.magFilter(params.magFilter ?? "linear"),
      minFilter: genericToWebGLMappers.minFilter(params.minFilter ?? "linear"),
      wrapS: genericToWebGLMappers.wrapX(params.wrapX ?? "repeat"),
      wrapT: genericToWebGLMappers.wrapY(params.wrapY ?? "repeat"),
    };
    return new Promise<WebGLTexture2D>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const texture = new WebGLTexture2D(
          this.gl,
          {
            ...params,
            width: image.width,
            height: image.height,
            dimensions: 4,
            format: "uint8",
          },
          {
            format: this.gl.RGBA,
            type: this.gl.UNSIGNED_BYTE,
            internalFormat: this.gl.RGBA,
            ...webglParams,
            data: image,
          }
        );
        resolve(texture);
      };
      image.onerror = reject;
      image.src = file;
    });
  }

  public getDefaultFramebuffer(): MaybePromise<DefaultFramebuffer> {
    return this.defaultFramebuffer;
  }

  public resizeDefaultFramebuffer(width: number, height: number): void {
    this.defaultFramebuffer.resize(width, height);
  }

  public createFramebuffer(
    width: number,
    height: number,
    withDepth: boolean
  ): MaybePromise<Framebuffer> {
    return new WebGLFramebufferClass(this.gl, width, height, withDepth);
  }
}