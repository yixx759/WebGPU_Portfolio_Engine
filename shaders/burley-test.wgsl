struct MATS {
  World : mat4x4f,
  View : mat4x4f,
  Pers : mat4x4f,
  camPos : vec4f,
}

struct PARAM {
ROUGHNESS: f32,
ROUGHNESS_SQUARED: f32, // ROUGHNESS * ROUGHNESS
SUBSURFACE: f32 ,
ANISOTROPIC: f32 ,
CLEARCOAT: f32 , // 0 - 0.25
CLEARCOAT_GLOSS: f32 ,
SPECULAR: f32, // 0 - 0.08 dont change coeffucent mult 0 - 1 by 0.08f
SPECULAR_TINT: f32 ,
METALLIC: f32 ,
SHEEN: f32 ,
SHEEN_TINT: f32 ,
}

struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) texcoord: vec2f,
  @location(1) norm: vec3f,
  @location(2) wpos: vec3f
}

@group(0) @binding(0) var<uniform> mats: MATS;
@group(0) @binding(1) var<uniform> params: PARAM;

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
  return ONE_OVER_PI * (1 / (alpha_x * alpha_y)) * (1 / pow(((h_x * h_x) / (alpha_x * alpha_x) + (h_y * h_y) / (alpha_y * alpha_y) + (h_n * h_n)), 2.0));
}

fn GTR_1_ISO(alpha: f32, h_n:f32 ) -> f32
{
  let square_alpha = alpha * alpha;

  return (square_alpha - 1.0f) / (PI * log(square_alpha) * (1 + (square_alpha - 1) * h_n * h_n));
}

fn G_GGX(alpha : f32, angle: f32) -> f32
{
  let alpha_scaled = alpha + 1;
  let k = (alpha_scaled * alpha_scaled) / 8.0f;
  return angle / (angle * (1.0f - k) + k);
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
const ONE_OVER_PI: f32 = 0.31830988618;

@group(1) @binding(0) var ourSampler: sampler;
@group(1) @binding(1) var ourTexture: texture_2d<f32>;

fn SchlickFresnel(x : f32) -> f32 {
    var xtmp = saturate(1.0f - x);
    var x2 = xtmp * xtmp;
    // acerola
    return x2 * x2 * xtmp; // While this is equivalent to pow(1 - x, 5) it is two less mult instructions
}

fn get_tangent(position: vec4f, texcoord: vec2f, normal: vec3f) -> vec3f 
{
  let der_x = dpdx(position);
  let der_y = dpdy(position);

  let der_uv_x = dpdx(texcoord);
  let der_uv_y = dpdy(texcoord);

  let f = 1.0f / (der_uv_x.x * der_uv_y.y - der_uv_y.x * der_uv_x.y);
  var T_4 = normalize(f * (der_uv_y.y * der_x - der_uv_x.y * der_y));
  var T = vec3f(T_4.x, T_4.y, T_4.z);

  let norm = normalize(normal);

  T = normalize(T - dot(T, norm) * norm);

  return T;
}


struct Light_Info {
 base_col: vec4f, 
 light_dir: vec3f, 
 ndotv: f32, 
 view: vec3f, 
 norm: vec3f, 
 T: vec3f,
 bitangent: vec3f,
}

fn burley_brdf_dir(light_info :Light_Info) -> vec4f
{
  let h = normalize(light_info.light_dir + light_info.view);

  let h_n = dot(h, light_info.norm);
  let h_x = dot(h, light_info.T);
  let h_y = dot(h, light_info.bitangent);

  let thetad = max(0,dot(h, light_info.light_dir));
  let thetaL = max(0,dot(normalize(light_info.norm), light_info.light_dir));

  let FV = SchlickFresnel(light_info.ndotv);

  let FL = SchlickFresnel(thetaL);

  let F90 = (params.ROUGHNESS * thetad * thetad);
  let FD90 = 0.5f + 2 * F90;

  let specular_col = mix(params.SPECULAR * mix(vec4f(1.0f), light_info.base_col, params.SPECULAR_TINT), light_info.base_col, params.METALLIC);

  let fd = mix(1.0, FD90, FL) * mix(1.0, FD90, FV);

  let fss_mid = mix(1.0, F90, FL) * mix(1.0, F90, FV);
  let fss = (1 / (thetaL * light_info.ndotv) - 0.5f) * fss_mid + 0.5;

  let aspect = sqrt(1 - 0.9f * params.ANISOTROPIC);
  let aniso_x = params.ROUGHNESS_SQUARED / aspect;
  let aniso_y = params.ROUGHNESS_SQUARED * aspect;
 
  let main_spec = GTR_2_ANISO(aniso_x, aniso_y, h_x, h_y, h_n);
 
  let clear_coat_spec = GTR_1_ISO(params.ROUGHNESS_SQUARED, h_n);

  let D_Specular = main_spec;
  let d_clear = GTR_1_ISO(mix(0.1f, 0.001f, params.CLEARCOAT_GLOSS), h_n);

  let SCHLICK_THETAD = SchlickFresnel(thetad);

  let schlick = mix(specular_col, vec4f(1.0f), SCHLICK_THETAD);
  let schlickClear = mix(0.04, 1.0f, SCHLICK_THETAD);

  let g_spec = G_GGX(params.ROUGHNESS, light_info.ndotv) * G_GGX(params.ROUGHNESS, thetaL);
  let g_clear = G_GGX(0.25f, light_info.ndotv) * G_GGX(0.25f, thetaL);

  let sheen_colour = mix(vec4f(1.0f), light_info.base_col, params.SHEEN_TINT);
  let sheen = SCHLICK_THETAD * params.SHEEN * sheen_colour;

  // TO DO: Should only have one devide 
  let overall_spec = ((D_Specular * schlick * g_spec) / (4 * (thetaL) * (light_info.ndotv))) ;
  let overall_clear = ((schlickClear * g_clear * d_clear) * params.CLEARCOAT) / (4 * (thetaL) * (light_info.ndotv));

  let tmp_res = overall_clear; // D_Specular / (4 * (thetaL) * (ndotv));
  // return vec4f(sheen.xyz, 1);
  // return vec4f(tmp_res,tmp_res,tmp_res,1f);
  return vec4f(((mix(fd, fss, params.SUBSURFACE) * light_info.base_col + sheen).xyz * (1 - params.METALLIC)) + vec3f(overall_clear) + overall_spec.xyz, 1);


}

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
{
  // To DO: remove reduncant nromalize funcs
  let T = get_tangent(fragData.position, fragData.texcoord, normalize(fragData.norm));
  let bitangent = cross(fragData.norm, T);

  let view = normalize(vec3f(mats.camPos.xyz) - fragData.wpos);
  let texcoord = vec2f(fragData.texcoord.x, fragData.texcoord.y);

  // from point to light not light to point
  // Right
  let light_dir = normalize(vec3f(0, 0, 1));

  let base_col = textureSample(ourTexture, ourSampler, texcoord) * ONE_OVER_PI;

  let ndotv = max(0,dot(normalize(fragData.norm), view));

  let light_info:Light_Info = Light_Info(base_col, light_dir, ndotv, view, fragData.norm, T, bitangent);

  return burley_brdf_dir(light_info);

  }