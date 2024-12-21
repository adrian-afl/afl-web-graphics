#version 300 es
precision highp float;

uniform mat4 modelMatrix;

in vec3 inVertexPos;
in vec2 inUV;
in vec3 inNormal;
in vec4 inTangent;

out vec2 uv;

void main() {
  uv = inUV;
  gl_Position = vec4(modelMatrix * vec4(inVertexPos, 1.0));
}
