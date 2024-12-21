import {
  MaybePromise,
  ShaderProgram,
  ShaderSamplerBind,
  ShaderUniformArrayMatrixBind,
  ShaderUniformArrayScalarBind,
  ShaderUniformArrayVectorBind,
  ShaderUniformFormat,
  ShaderUniformSingleMatrixBind,
  ShaderUniformSingleScalarBind,
  ShaderUniformSingleVectorBind,
  ShaderUniformsLayout,
  ShaderUniformVectorArrayFormat,
} from "../GPUApiInterface";

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

export class WebGLShaderProgram<Layout extends ShaderUniformsLayout>
  implements ShaderProgram<Layout>
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
    private readonly uniformLayout: Layout
  ) {
    this.handle = compileProgram(gl, vertexShaderSource, fragmentShaderSource);
    for (const key in uniformLayout.single.scalars) {
      const location = gl.getUniformLocation(this.handle, key);
      if (!location) {
        console.warn(`Cannot find the location of uniform ${key}`);
      }
      this.uniformsLocationsMap.set(key, location);
    }
    for (const key in uniformLayout.single.vectors) {
      const location = gl.getUniformLocation(this.handle, key);
      if (!location) {
        console.warn(`Cannot find the location of uniform ${key}`);
      }
      this.uniformsLocationsMap.set(key, location);
    }
    for (const key in uniformLayout.single.matrices) {
      const location = gl.getUniformLocation(this.handle, key);
      if (!location) {
        console.warn(`Cannot find the location of uniform ${key}`);
      }
      this.uniformsLocationsMap.set(key, location);
    }
    for (const key in uniformLayout.arrays.scalars) {
      const location = gl.getUniformLocation(this.handle, key);
      if (!location) {
        console.warn(`Cannot find the location of uniform ${key}`);
      }
      this.uniformsLocationsMap.set(key, location);
    }
    for (const key in uniformLayout.arrays.vectors) {
      const location = gl.getUniformLocation(this.handle, key);
      if (!location) {
        console.warn(`Cannot find the location of uniform ${key}`);
      }
      this.uniformsLocationsMap.set(key, location);
    }
    for (const key in uniformLayout.arrays.matrices) {
      const location = gl.getUniformLocation(this.handle, key);
      if (!location) {
        console.warn(`Cannot find the location of uniform ${key}`);
      }
      this.uniformsLocationsMap.set(key, location);
    }
    for (const key in uniformLayout.samplers) {
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

  public setSampler(
    activeTextureIndex: number,
    bind: ShaderSamplerBind<Layout, Extract<keyof Layout["samplers"], string>>
  ): void {
    this.gl.activeTexture(this.gl.TEXTURE0 + activeTextureIndex);
    this.gl.bindTexture(
      this.gl.TEXTURE_2D,
      bind.texture.getHandle() as WebGLTexture
    );
    this.gl.uniform1i(this.getUniformLocation(bind.name), activeTextureIndex);
  }

  public setSamplersArray(
    binds: ShaderSamplerBind<
      Layout,
      Extract<keyof Layout["samplers"], string>
    >[]
  ): void {
    for (let i = 0; i < binds.length; i++) {
      this.gl.activeTexture(this.gl.TEXTURE0 + i);
      this.gl.bindTexture(
        this.gl.TEXTURE_2D,
        binds[i].texture.getHandle() as WebGLTexture
      );
      this.gl.uniform1i(this.getUniformLocation(binds[i].name), i);
    }
  }

  public setUniforms(uniforms: {
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
  }): MaybePromise<void> {
    if (uniforms.single) {
      if (uniforms.single.scalars) {
        for (const uniform of uniforms.single.scalars) {
          this.setUniform1(
            uniform.name,
            this.uniformLayout.single.scalars[uniform.name].format,
            uniform.value
          );
        }
      }
      if (uniforms.single.vectors) {
        for (const uniform of uniforms.single.vectors) {
          switch (this.uniformLayout.single.vectors[uniform.name].dimensions) {
            case 2:
              if (uniform.value.length !== 2) {
                throw new Error("Vector4 dimensions mismatch");
              }
              this.setUniform2(
                uniform.name,
                this.uniformLayout.single.vectors[uniform.name].format,
                uniform.value[0],
                uniform.value[1]
              );
              break;
            case 3:
              if (uniform.value.length !== 3) {
                throw new Error("Vector4 dimensions mismatch");
              }
              this.setUniform3(
                uniform.name,
                this.uniformLayout.single.vectors[uniform.name].format,
                uniform.value[0],
                uniform.value[1],
                uniform.value[2]
              );
              break;
            case 4:
              if (uniform.value.length !== 4) {
                throw new Error("Vector4 dimensions mismatch");
              }
              this.setUniform4(
                uniform.name,
                this.uniformLayout.single.vectors[uniform.name].format,
                uniform.value[0],
                uniform.value[1],
                uniform.value[2],
                uniform.value[3]
              );
              break;
          }
        }
      }
      if (uniforms.single.matrices) {
        for (const uniform of uniforms.single.matrices) {
          const dimensions =
            this.uniformLayout.single.matrices[uniform.name].dimensions;
          if (uniform.value.length !== dimensions * dimensions) {
            throw new Error("Matrix dimensions mismatch");
          }
          this.setUniformMatrixArray(
            uniform.name,
            dimensions,
            uniform.transpose ?? false,
            uniform.value
          );
        }
      }
    }
    if (uniforms.arrays) {
      if (uniforms.arrays.scalars) {
        for (const uniform of uniforms.arrays.scalars) {
          this.setUniform1Array(
            uniform.name,
            this.uniformLayout.single.scalars[uniform.name].format,
            uniform.values
          );
        }
      }
      if (uniforms.arrays.vectors) {
        for (const uniform of uniforms.arrays.vectors) {
          switch (this.uniformLayout.single.vectors[uniform.name].dimensions) {
            case 2:
              if (uniform.values.length % 3 !== 0) {
                throw new Error("Vector2 array dimensions mismatch");
              }
              this.setUniform2Array(
                uniform.name,
                this.uniformLayout.single.vectors[uniform.name].format,
                uniform.values
              );
              break;
            case 3:
              if (uniform.values.length % 3 !== 0) {
                throw new Error("Vector3 array dimensions mismatch");
              }
              this.setUniform3Array(
                uniform.name,
                this.uniformLayout.single.vectors[uniform.name].format,
                uniform.values
              );
              break;
            case 4:
              if (uniform.values.length % 4 !== 0) {
                throw new Error("Vector4 array dimensions mismatch");
              }
              this.setUniform4Array(
                uniform.name,
                this.uniformLayout.single.vectors[uniform.name].format,
                uniform.values
              );
              break;
          }
        }
      }
      if (uniforms.arrays.matrices) {
        for (const uniform of uniforms.arrays.matrices) {
          const dimensions =
            this.uniformLayout.single.matrices[uniform.name].dimensions;
          if (uniform.values.length % (dimensions * dimensions) !== 0) {
            throw new Error("Matrix array dimensions mismatch");
          }
          this.setUniformMatrixArray(
            uniform.name,
            dimensions,
            uniform.transpose ?? false,
            uniform.values
          );
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
