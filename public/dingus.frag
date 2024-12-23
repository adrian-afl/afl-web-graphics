#version 300 es
precision highp float;

uniform sampler2D colorTexture;

in vec2 uv;
in vec3 norm;

layout (location = 0) out vec4 outColor;

void main() {
  vec3 color = texture(colorTexture, uv).rgb;
  outColor = vec4(color, 1.0);
}
