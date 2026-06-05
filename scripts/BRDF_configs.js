//   * BRDF Parameters *
//   float32 ROUGHNESS
//   float32 ROUGHNESS_SQUARED - This is the above squared ROUGHNESS * ROUGHNESS
//   float32 SUBSURFACE
//   float32 ANISOTROPIC
//   float32 CLEARCOAT - 0 - 0.25
//   float32 CLEARCOAT_GLOSS
//   float32 SPECULAR - 0 - 0.08 dont change coeffucent mult 0 - 1 by 0.08f
//   float32 SPECULAR_TINT
//   float32 METALLIC
//   float32 SHEEN
//   float32 SHEEN_TINT

const NUMBER_OF_CONFIGS = 2;


export const BASIC_INDEX = 0;
export const BASIC = new Float32Array([1.0, 1.0, 0, 0.1, 0, 0, 0.01, 0, 0, 0, 0]);

export const SHINY_INDEX = 1;
export const SHINY = new Float32Array([0.6, (0.6*0.6), 0, 0.5, 0, 0, 0 * 0.08, 0, 0, 0, 0]);

export const BRDF_config = [BASIC, SHINY];