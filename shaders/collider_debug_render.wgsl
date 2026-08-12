struct MATS {
  World : mat4x4f,
  View : mat4x4f,
  Pers : mat4x4f,
  camPos : vec4f,
}

struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
}

@group(0) @binding(0) var<uniform> mats: MATS;

@vertex
fn vertex_main(@location(0) position: vec3f) -> VertexOut
{
  var output : VertexOut;

  output.position = (mats.Pers * mats.View) * vec4f(position,1);
  output.color = vec4f(1,0,0,1);

  return output;
}

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
{
  return fragData.color;
}