import { Geometry, GeometryMemoryLayout } from "../GPUApiInterface";

interface GLGeometryCreateResult {
  vao: WebGLVertexArrayObject;
  vertexCount: number;
}

function getAttributeParameters(
  genericAttrib: GeometryMemoryLayout["attributes"][number]
): {
  type: GLenum;
  byteSize: number;
} {
  switch (genericAttrib.format) {
    case "int8":
      switch (genericAttrib.dimensions) {
        case 1:
          return {
            type: WebGL2RenderingContext.BYTE,
            byteSize: 1,
          };
        case 2:
          return {
            type: WebGL2RenderingContext.BYTE,
            byteSize: 2,
          };
        case 3:
          return {
            type: WebGL2RenderingContext.BYTE,
            byteSize: 3,
          };
        case 4:
          return {
            type: WebGL2RenderingContext.BYTE,
            byteSize: 4,
          };
      }
      break;
    case "uint8":
      switch (genericAttrib.dimensions) {
        case 1:
          return {
            type: WebGL2RenderingContext.UNSIGNED_BYTE,
            byteSize: 1,
          };
        case 2:
          return {
            type: WebGL2RenderingContext.UNSIGNED_BYTE,
            byteSize: 2,
          };
        case 3:
          return {
            type: WebGL2RenderingContext.UNSIGNED_BYTE,
            byteSize: 3,
          };
        case 4:
          return {
            type: WebGL2RenderingContext.UNSIGNED_BYTE,
            byteSize: 4,
          };
      }
      break;
    case "int16":
      switch (genericAttrib.dimensions) {
        case 1:
          return {
            type: WebGL2RenderingContext.SHORT,
            byteSize: 2,
          };
        case 2:
          return {
            type: WebGL2RenderingContext.SHORT,
            byteSize: 4,
          };
        case 3:
          return {
            type: WebGL2RenderingContext.SHORT,
            byteSize: 6,
          };
        case 4:
          return {
            type: WebGL2RenderingContext.SHORT,
            byteSize: 8,
          };
      }
      break;
    case "uint16":
      switch (genericAttrib.dimensions) {
        case 1:
          return {
            type: WebGL2RenderingContext.UNSIGNED_SHORT,
            byteSize: 2,
          };
        case 2:
          return {
            type: WebGL2RenderingContext.UNSIGNED_SHORT,
            byteSize: 4,
          };
        case 3:
          return {
            type: WebGL2RenderingContext.UNSIGNED_SHORT,
            byteSize: 6,
          };
        case 4:
          return {
            type: WebGL2RenderingContext.UNSIGNED_SHORT,
            byteSize: 8,
          };
      }
      break;
    case "int32":
      switch (genericAttrib.dimensions) {
        case 1:
          return {
            type: WebGL2RenderingContext.INT,
            byteSize: 4,
          };
        case 2:
          return {
            type: WebGL2RenderingContext.INT,
            byteSize: 8,
          };
        case 3:
          return {
            type: WebGL2RenderingContext.INT,
            byteSize: 12,
          };
        case 4:
          return {
            type: WebGL2RenderingContext.INT,
            byteSize: 16,
          };
      }
      break;
    case "uint32":
      switch (genericAttrib.dimensions) {
        case 1:
          return {
            type: WebGL2RenderingContext.UNSIGNED_INT,
            byteSize: 4,
          };
        case 2:
          return {
            type: WebGL2RenderingContext.UNSIGNED_INT,
            byteSize: 8,
          };
        case 3:
          return {
            type: WebGL2RenderingContext.UNSIGNED_INT,
            byteSize: 12,
          };
        case 4:
          return {
            type: WebGL2RenderingContext.UNSIGNED_INT,
            byteSize: 16,
          };
      }
      break;
    case "float16":
      switch (genericAttrib.dimensions) {
        case 1:
          return {
            type: WebGL2RenderingContext.HALF_FLOAT,
            byteSize: 2,
          };
        case 2:
          return {
            type: WebGL2RenderingContext.HALF_FLOAT,
            byteSize: 4,
          };
        case 3:
          return {
            type: WebGL2RenderingContext.HALF_FLOAT,
            byteSize: 6,
          };
        case 4:
          return {
            type: WebGL2RenderingContext.HALF_FLOAT,
            byteSize: 8,
          };
      }
      break;
    case "float32":
      switch (genericAttrib.dimensions) {
        case 1:
          return {
            type: WebGL2RenderingContext.FLOAT,
            byteSize: 4,
          };
        case 2:
          return {
            type: WebGL2RenderingContext.FLOAT,
            byteSize: 8,
          };
        case 3:
          return {
            type: WebGL2RenderingContext.FLOAT,
            byteSize: 12,
          };
        case 4:
          return {
            type: WebGL2RenderingContext.FLOAT,
            byteSize: 16,
          };
      }
      break;
  }
}

function createGeometry(
  gl: WebGL2RenderingContext,
  layout: GeometryMemoryLayout,
  data: ArrayBuffer
): GLGeometryCreateResult {
  const attribParameters = layout.attributes.map((x) =>
    getAttributeParameters(x)
  );
  let vertexByteSize = 0;
  for (const attrib of attribParameters) {
    vertexByteSize += attrib.byteSize;
  }

  if (data.byteLength % vertexByteSize !== 0) {
    throw new Error("invalid vertex data");
  }
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  let cursorByte = 0;
  for (let a = 0; a < layout.attributes.length; a++) {
    const attrib = layout.attributes[a];
    const params = attribParameters[a];
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(
      a,
      attrib.dimensions,
      params.type,
      attrib.normalize,
      vertexByteSize,
      cursorByte
    );

    cursorByte += params.byteSize;
  }

  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return {
    vao,
    vertexCount: data.byteLength / vertexByteSize,
  };
}

export class WebGLGeometry implements Geometry {
  private createdGeometry: GLGeometryCreateResult | null;

  public constructor(
    private readonly gl: WebGL2RenderingContext,
    layout: GeometryMemoryLayout,
    data: ArrayBuffer
  ) {
    this.createdGeometry = createGeometry(gl, layout, data);
  }

  public draw(): void {
    if (this.createdGeometry) {
      this.gl.bindVertexArray(this.createdGeometry.vao);
      this.gl.drawArrays(
        this.gl.TRIANGLES,
        0,
        this.createdGeometry.vertexCount
      );
    } else {
      throw new Error("Draw after free");
    }
  }

  public free(): void {
    if (this.createdGeometry) {
      this.gl.deleteVertexArray(this.createdGeometry.vao);
    }
    this.createdGeometry = null;
  }
}
