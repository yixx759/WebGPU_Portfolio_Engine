struct MATS {
  World : mat4x4f,
  View : mat4x4f,
  Pers : mat4x4f,
  camPos : vec4f,
}

struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) texcoord: vec2f,
  @location(1) norm: vec3f,
  @location(2) wpos: vec3f,
}

@group(0) @binding(0) var<uniform> mats: MATS;

fn inverse3x3(m: mat3x3<f32>) -> mat3x3<f32> {
    let a = m[0][0]; let b = m[1][0]; let c = m[2][0];
    let d = m[0][1]; let e = m[1][1]; let f = m[2][1];
    let g = m[0][2]; let h = m[1][2]; let i = m[2][2];

    let det = a*(e*i - f*h) - b*(d*i - f*g) + c*(d*h - e*g);

    let invDet = 1.0 / det;

    return mat3x3<f32>(
        vec3<f32>(  (e*i - f*h)*invDet, -(b*i - c*h)*invDet,  (b*f - c*e)*invDet ),
        vec3<f32>( -(d*i - f*g)*invDet,  (a*i - c*g)*invDet, -(a*f - c*d)*invDet ),
        vec3<f32>(  (d*h - e*g)*invDet, -(a*h - b*g)*invDet,  (a*e - b*d)*invDet )
    );
}

@vertex
fn vertex_main(@location(0) position: vec3f,
               @location(1) texcoord: vec2f,
               @location(2) normal: vec3f) -> VertexOut
{
  let texPos = texcoord;
  var output : VertexOut;

  output.wpos = ((mats.World) * vec4f(position,1)).xyz;
  output.position = (mats.Pers * mats.View) * vec4f(output.wpos,1);

  var worldToNormal : mat3x3<f32> = mat3x3<f32>(
      mats.World[0].xyz,  // first column's top 2 elements
      mats.World[1].xyz,   // second column's top 2 elements
      mats.World[2].xyz   // second column's top 2 elements
  );

  worldToNormal = transpose(inverse3x3(worldToNormal));

  output.texcoord = texPos;
  output.norm = worldToNormal * normal;
  return output;
}

const PI: f32 = 3.141592653589793;

@group(1) @binding(0) var ourSampler: sampler;
@group(1) @binding(1) var ourTexture: texture_2d<f32>;

fn SchlickFresnel(x : f32) -> f32 {
    var xtmp = saturate(1.0f - x);
    var x2 = xtmp * xtmp;

    return x2 * x2 * xtmp; // While this is equivalent to pow(1 - x, 5) it is two less mult instructions
}

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
{

  let view = normalize(vec3f(mats.camPos.xyz) - fragData.wpos);
  let texcoord = vec2f(fragData.texcoord.x, fragData.texcoord.y);

  // from point to light not light to point
  // Right
  let lightDir = normalize(-vec3f(-1, 0,0));

  let lightAmount = max(dot(lightDir, normalize(fragData.norm)) , 0);
  
  let res = vec4f(textureSample(ourTexture, ourSampler, texcoord) * lightAmount) ;

  let roughness = 0.2f;

  let h = normalize(lightDir + view);

  let thetad = max(0,dot(h, lightDir));
  let thetaL = max(0,dot(normalize(fragData.norm), lightDir));
  let thetav = max(0,dot(view, lightDir));
  let ndotv = max(0,dot(normalize(fragData.norm), view));

  let FL = SchlickFresnel(thetaL);
  let FV = SchlickFresnel(ndotv);

  let F90 = 0.5 + 2 * (roughness * thetad * thetad);

  let baseCol = textureSample(ourTexture, ourSampler, texcoord) / PI;
  let fd = mix(1.0, F90, FL) * mix(1.0, F90, FV);

  return vec4f((fd * baseCol).xyz ,1);
}