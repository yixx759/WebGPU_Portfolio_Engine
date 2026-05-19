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
  @location(2) tangent: vec3f,
  @location(3) wpos: vec3f,
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

fn GTR_2_ANISO(alpha_x: f32, alpha_y: f32, h_x: f32, h_y: f32, h_n:f32 ) -> f32
{
  return ONE_OVER_PI * (1 / (alpha_x * alpha_y)) * (1 / pow(((h_x * h_x) / (alpha_x * alpha_x) + (h_y * h_y) / (alpha_y * alpha_y) + (h_n * h_n)) , 2));
}

@vertex
fn vertex_main(@location(0) position: vec3f,
               @location(1) texcoord: vec2f,
               @location(2) normal: vec3f,
               @location(3) tangent: vec3f) -> VertexOut
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
  output.tangent = worldToNormal * tangent;
  return output;
}

const PI: f32 = 3.141592653589793;
const ONE_OVER_PI: f32 = 0.31830988618;

const PARAM_ROUGHNESS: f32 = 0.1;
const PARAM_ROUGHNESS_SQUARED: f32 = PARAM_ROUGHNESS * PARAM_ROUGHNESS;
const PARAM_SUBSURFACE: f32 = 0.1;
const PARAM_ANISOTROPIC: f32 = 0.1;

@group(1) @binding(0) var ourSampler: sampler;
@group(1) @binding(1) var ourTexture: texture_2d<f32>;

fn SchlickFresnel(x : f32) -> f32 {
    var xtmp = saturate(1.0f - x);
    var x2 = xtmp * xtmp;
    // acerola
    return x2 * x2 * xtmp; // While this is equivalent to pow(1 - x, 5) it is two less mult instructions
}

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
{

  let view = normalize(vec3f(mats.camPos.xyz) - fragData.wpos);
  let texcoord = vec2f(fragData.texcoord.x, fragData.texcoord.y);

  // from point to light not light to point
  // Right
  let lightDir = normalize(vec3f(0, 0, 1));

  let lightAmount = max(dot(lightDir, normalize(fragData.norm)) , 0);
  
  let res = vec4f(textureSample(ourTexture, ourSampler, texcoord) * lightAmount) ;

  let h = normalize(lightDir + view);
  
  let norm = normalize(fragData.norm);
  let tangent = normalize(fragData.tangent);
  let bitangent = cross(norm, tangent);

  let h_n = dot(h, norm);
  let h_x = dot(h, tangent);
  let h_y = dot(h, bitangent);

  let thetad = max(0,dot(h, lightDir));
  let thetaL = max(0,dot(normalize(fragData.norm), lightDir));
  let thetav = max(0,dot(view, lightDir));
  let ndotv = max(0,dot(normalize(fragData.norm), view));

  let FL = SchlickFresnel(thetaL);
  let FV = SchlickFresnel(ndotv);
  
  let F90 = (PARAM_ROUGHNESS * thetad * thetad);
  let FD90 = 0.5f + 2 * F90;

  let baseCol = textureSample(ourTexture, ourSampler, texcoord) * ONE_OVER_PI;
  let fd = mix(1.0, FD90, FL) * mix(1.0, FD90, FV);

  let fss_mid = mix(1.0, F90, FL) * mix(1.0, F90, FV);
  let fss = (1 / (thetaL * ndotv) - 0.5f) * fss_mid + 0.5;

  let aspect = sqrt(1 - 0.9f * PARAM_ANISOTROPIC);
  let aniso_x = PARAM_ROUGHNESS_SQUARED / aspect;
  let aniso_y = PARAM_ROUGHNESS_SQUARED * aspect;

  let main_spec = GTR_2_ANISO(aniso_x, aniso_y, h_x, h_y, h_n);

  return vec4(main_spec,main_spec,main_spec,1);
  return vec4f((mix(fd, fss, PARAM_SUBSURFACE) * baseCol).xyz ,1);
}