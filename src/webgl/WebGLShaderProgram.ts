import {
  MaybePromise,
  ShaderProgram,
  ShaderSamplers,
  ShaderUniformFormat,
  ShaderUniforms,
  ShaderUniformVectorArrayFormat,
  Texture2D,
} from "../GPUApiInterface";
import {
  Matrix2,
  Matrix3,
  Matrix4,
  Vector2,
  Vector3,
  Vector4,
} from "@aeroflightlabs/linear-math";

function compileShader(
  gl: WebGL2RenderingContext,
  type: GLenum,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("createShader failed");
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS) as boolean;
  if (!status) {
    console.log(gl.getShaderInfoLog(shader));
  }

  return status ? shader : null;
}

function compileProgram(
  gl: WebGL2RenderingContext,
  vertexShaderSource: string,
  fragmentShaderSource: string
): WebGLProgram {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );
  if (!vertexShader || !fragmentShader) {
    throw new Error("compiling shaders failed");
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const status = gl.getProgramParameter(program, gl.LINK_STATUS) as boolean;
  if (!status) {
    console.log(gl.getProgramInfoLog(program));
    throw new Error("program linking failed failed");
  }

  return program;
}

export class WebGLShaderProgram<
  Uniforms extends ShaderUniforms,
  Samplers extends ShaderSamplers,
> implements ShaderProgram<Uniforms, Samplers>
{
  public readonly handle: WebGLProgram;
  private readonly uniformsLocationsMap: Map<
    string,
    WebGLUniformLocation | null
  > = new Map<string, WebGLUniformLocation | null>();

  public constructor(
    private readonly gl: WebGL2RenderingContext,
    vertexShaderSource: string,
    fragmentShaderSource: string,
    private readonly uniforms: Uniforms,
    samplers: Samplers
  ) {
    this.handle = compileProgram(gl, vertexShaderSource, fragmentShaderSource);
    for (const key in uniforms) {
      const location = gl.getUniformLocation(this.handle, key);
      if (!location) {
        console.warn(`Cannot find the location of uniform ${key}`);
      }
      this.uniformsLocationsMap.set(key, location);
    }
    for (const key in samplers) {
      const location = gl.getUniformLocation(this.handle, key);
      if (!location) {
        console.warn(`Cannot find the location of uniform ${key}`);
      }
      this.uniformsLocationsMap.set(key, location);
    }
  }

  public use(): void {
    this.gl.useProgram(this.handle);
  }

  private getUniformLocation(name: string): WebGLUniformLocation | null {
    return this.uniformsLocationsMap.get(name) ?? null;
  }

  public bindSampler(
    activeTextureIndex: number,
    name: Extract<keyof Samplers, string>,
    texture: Texture2D
  ): void {
    this.gl.activeTexture(this.gl.TEXTURE0 + activeTextureIndex);
    const glHandle = texture.getHandle() as {
      handle: WebGLTexture;
      target: GLenum;
    };
    this.gl.bindTexture(glHandle.target, glHandle.handle);
    this.gl.uniform1i(this.getUniformLocation(name), activeTextureIndex);
  }

  public bindSamplers(binds: {
    [K in Extract<keyof Samplers, string>]: Texture2D;
  }): void {
    const entries = Object.entries(binds);
    for (let i = 0; i < entries.length; i++) {
      const name = entries[i][0];
      const texture = entries[i][1];
      const glHandle = texture.getHandle() as {
        handle: WebGLTexture;
        target: GLenum;
      };
      this.gl.activeTexture(this.gl.TEXTURE0 + i);
      this.gl.bindTexture(glHandle.target, glHandle.handle);
      this.gl.uniform1i(this.getUniformLocation(name), i);
    }
  }

  public setUniforms(
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
  ): MaybePromise<void> {
    const entries = Object.entries(binds);
    for (let i = 0; i < entries.length; i++) {
      const name = entries[i][0];
      const value = entries[i][1];
      const definition = this.uniforms[name];
      if (definition.isArray !== true) {
        if (definition.type === "scalar") {
          if (!(typeof value === "number")) {
            throw new Error(
              `Scalar uniform value mismatch, expected scalar for name ${name}`
            );
          }
          this.setUniform1(name, definition.format, value);
        } else if (definition.type === "vector") {
          const arrayValue: number[] = [];
          if (typeof value === "object") {
            if ("x" in value) {
              arrayValue.push(value.x);
            }
            if ("y" in value) {
              arrayValue.push(value.y);
            }
            if ("z" in value) {
              arrayValue.push(value.z);
            }
            if ("w" in value) {
              arrayValue.push(value.w);
            }
          } else if (Array.isArray(value)) {
            arrayValue.push(...value);
          }
          switch (definition.dimensions) {
            case 2:
              if (arrayValue.length !== 2) {
                throw new Error("Vector4 uniform dimensions mismatch");
              }
              this.setUniform2(
                name,
                definition.format,
                arrayValue[0],
                arrayValue[1]
              );
              break;
            case 3:
              if (arrayValue.length !== 3) {
                throw new Error("Vector4 uniform dimensions mismatch");
              }
              this.setUniform3(
                name,
                definition.format,
                arrayValue[0],
                arrayValue[1],
                arrayValue[2]
              );
              break;
            case 4:
              if (arrayValue.length !== 4) {
                throw new Error("Vector4 uniform dimensions mismatch");
              }
              this.setUniform4(
                name,
                definition.format,
                arrayValue[0],
                arrayValue[1],
                arrayValue[2],
                arrayValue[3]
              );
              break;
          }
        } else if (definition.type === "matrix") {
          if (typeof value === "number") {
            throw new Error(
              `Matrix uniform value mismatch, expected array or matrix for name ${name}`
            );
          }
          let arrayValue: number[] = [];
          if (typeof value === "object") {
            if ("array" in value && Array.isArray(value.array)) {
              arrayValue = value.array;
            }
          } else if (Array.isArray(value)) {
            arrayValue = value;
          }
          if (
            arrayValue.length !==
            definition.dimensions * definition.dimensions
          ) {
            throw new Error("Matrix dimensions mismatch");
          }
          this.setUniformMatrixArray(
            name,
            definition.dimensions,
            definition.transpose ?? false,
            arrayValue
          );
        }
      } else {
        if (!Array.isArray(value)) {
          throw new Error(
            `Scalar array uniform value mismatch, expected array for name ${name}`
          );
        }
        const firstValue = value[0];
        if (definition.type === "scalar") {
          if (!(typeof firstValue === "number")) {
            throw new Error(
              `Scalar array uniform value mismatch, expected array of numbers for name ${name}`
            );
          }
          this.setUniform1Array(name, definition.format, value as number[]);
        } else if (definition.type === "vector") {
          const arrayValue: number[] = [];
          for (let x = 0; x < value.length; x++) {
            const v = value[x];
            if (typeof v === "object") {
              if ("x" in v) {
                arrayValue.push(v.x);
              }
              if ("y" in v) {
                arrayValue.push(v.y);
              }
              if ("z" in v) {
                arrayValue.push(v.z);
              }
              if ("w" in v) {
                arrayValue.push(v.w);
              }
            } else if (typeof v === "number") {
              arrayValue.push(v);
            }
          }
          switch (definition.dimensions) {
            case 2:
              if (arrayValue.length % 3 !== 0) {
                throw new Error("Vector2 array dimensions mismatch");
              }
              this.setUniform2Array(name, definition.format, arrayValue);
              break;
            case 3:
              if (arrayValue.length % 3 !== 0) {
                throw new Error("Vector3 array dimensions mismatch");
              }
              this.setUniform3Array(name, definition.format, arrayValue);
              break;
            case 4:
              if (arrayValue.length % 4 !== 0) {
                throw new Error("Vector4 array dimensions mismatch");
              }
              this.setUniform4Array(name, definition.format, arrayValue);
              break;
          }
        } else if (definition.type === "matrix") {
          const arrayValue: number[] =
            typeof value[0] === "number" ? (value as number[]) : [];
          if (typeof value[0] === "object") {
            for (let x = 0; x < value.length; x++) {
              const v = value[x];
              if (
                typeof v === "object" &&
                "array" in v &&
                Array.isArray(v.array)
              ) {
                arrayValue.push(...v.array);
              }
            }
            if (
              (arrayValue.length % definition.dimensions) *
                definition.dimensions !==
              0
            ) {
              throw new Error("Matrix dimensions mismatch");
            }
            this.setUniformMatrixArray(
              name,
              definition.dimensions,
              definition.transpose ?? false,
              arrayValue
            );
          }
        }
      }
    }
  }

  private setUniform1(
    name: string,
    format: ShaderUniformFormat,
    value: number
  ): void {
    switch (format) {
      case "float":
        this.gl.uniform1f(this.getUniformLocation(name), value);
        break;
      case "int":
        this.gl.uniform1i(this.getUniformLocation(name), value);
        break;
      case "uint":
        this.gl.uniform1ui(this.getUniformLocation(name), value);
        break;
    }
  }

  private setUniform2(
    name: string,
    format: ShaderUniformFormat,
    x: number,
    y: number
  ): void {
    switch (format) {
      case "float":
        this.gl.uniform2f(this.getUniformLocation(name), x, y);
        break;
      case "int":
        this.gl.uniform2i(this.getUniformLocation(name), x, y);
        break;
      case "uint":
        this.gl.uniform2ui(this.getUniformLocation(name), x, y);
        break;
    }
  }

  private setUniform3(
    name: string,
    format: ShaderUniformFormat,
    x: number,
    y: number,
    z: number
  ): void {
    switch (format) {
      case "float":
        this.gl.uniform3f(this.getUniformLocation(name), x, y, z);
        break;
      case "int":
        this.gl.uniform3i(this.getUniformLocation(name), x, y, z);
        break;
      case "uint":
        this.gl.uniform3ui(this.getUniformLocation(name), x, y, z);
        break;
    }
  }

  private setUniform4(
    name: string,
    format: ShaderUniformFormat,
    x: number,
    y: number,
    z: number,
    w: number
  ): void {
    switch (format) {
      case "float":
        this.gl.uniform4f(this.getUniformLocation(name), x, y, z, w);
        break;
      case "int":
        this.gl.uniform4i(this.getUniformLocation(name), x, y, z, w);
        break;
      case "uint":
        this.gl.uniform4ui(this.getUniformLocation(name), x, y, z, w);
        break;
    }
  }

  private setUniform1Array<TV extends ShaderUniformFormat>(
    name: string,
    format: TV,
    values: ShaderUniformVectorArrayFormat[TV]
  ): void {
    switch (format) {
      case "float":
        this.gl.uniform1fv(
          this.getUniformLocation(name),
          values as Float32List
        );
        break;
      case "int":
        this.gl.uniform1iv(this.getUniformLocation(name), values as Int32List);
        break;
      case "uint":
        this.gl.uniform1uiv(
          this.getUniformLocation(name),
          values as Uint32List
        );
        break;
    }
  }

  private setUniform2Array<TV extends ShaderUniformFormat>(
    name: string,
    format: TV,
    values: ShaderUniformVectorArrayFormat[TV]
  ): void {
    switch (format) {
      case "float":
        this.gl.uniform2fv(
          this.getUniformLocation(name),
          values as Float32List
        );
        break;
      case "int":
        this.gl.uniform2iv(this.getUniformLocation(name), values as Int32List);
        break;
      case "uint":
        this.gl.uniform2uiv(
          this.getUniformLocation(name),
          values as Uint32List
        );
        break;
    }
  }

  private setUniform3Array<TV extends ShaderUniformFormat>(
    name: string,
    format: TV,
    values: ShaderUniformVectorArrayFormat[TV]
  ): void {
    switch (format) {
      case "float":
        this.gl.uniform3fv(
          this.getUniformLocation(name),
          values as Float32List
        );
        break;
      case "int":
        this.gl.uniform3iv(this.getUniformLocation(name), values as Int32List);
        break;
      case "uint":
        this.gl.uniform3uiv(
          this.getUniformLocation(name),
          values as Uint32List
        );
        break;
    }
  }

  private setUniform4Array<TV extends ShaderUniformFormat>(
    name: string,
    format: TV,
    values: ShaderUniformVectorArrayFormat[TV]
  ): void {
    switch (format) {
      case "float":
        this.gl.uniform4fv(
          this.getUniformLocation(name),
          values as Float32List
        );
        break;
      case "int":
        this.gl.uniform4iv(this.getUniformLocation(name), values as Int32List);
        break;
      case "uint":
        this.gl.uniform4uiv(
          this.getUniformLocation(name),
          values as Uint32List
        );
        break;
    }
  }

  private setUniformMatrixArray(
    name: string,
    dimensionsBoth: 2 | 3 | 4,
    transpose: boolean,
    values: Float32List
  ): void {
    switch (dimensionsBoth) {
      case 2:
        this.gl.uniformMatrix2fv(
          this.getUniformLocation(name),
          transpose,
          values
        );
        break;
      case 3:
        this.gl.uniformMatrix3fv(
          this.getUniformLocation(name),
          transpose,
          values
        );
        break;
      case 4:
        this.gl.uniformMatrix4fv(
          this.getUniformLocation(name),
          transpose,
          values
        );
        break;
    }
  }
}
