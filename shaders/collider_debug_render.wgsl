struct MATS {
  World : mat4x4f,
  View : mat4x4f,
  Pers : mat4x4f,
  camPos : vec4f,
}

struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
  @location(1) bary : vec3f
}

@group(0) @binding(0) var<uniform> mats: MATS;

@vertex
fn vertex_main(
  @location(0) position: vec3f, 
  @builtin(vertex_index) vIdx : u32
  ) -> VertexOut
{
  var output : VertexOut;

  output.position = (mats.Pers * mats.View) * vec4f(position,1);
  output.color = vec4f(1,0,0,1);

  var bary_centric_vals = array<vec3f, 3>(
    vec3f(1.0, 0.0, 0.0),
    vec3f(0.0, 1.0, 0.0),
    vec3f(0.0, 0.0, 1.0),
  );

  output.bary = bary_centric_vals[vIdx % 3u];

  return output;
}

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
{
  var clear = vec4f(0,0,0,0);

  var min_element = min(min(fragData.bary.x, fragData.bary.y), fragData.bary.z) > 0.01;

  return mix(fragData.color, clear, f32(min_element));
}