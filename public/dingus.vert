#version 300 es
precision highp float;

uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;

in vec3 inVertexPos;
in vec3 inNormal;
in vec2 inUV;

out vec2 uv;
out vec3 norm;

void main() {
  uv = inUV;
  norm = inNormal;
  gl_Position = vec4(projectionMatrix * modelMatrix * vec4(inVertexPos, 1.0));
}
