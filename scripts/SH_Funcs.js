// FROM: https://gpfault.net/posts/sph.html

// Having these constants makes writing down the basis functions easier.
const RECIP_PI = 1/Math.PI;
const C = [
  Math.sqrt(RECIP_PI) * 0.5,
  Math.sqrt(3 * RECIP_PI) * 0.5,
  Math.sqrt(15 * RECIP_PI) * 0.5,
  Math.sqrt(5 * RECIP_PI) * 0.25,
  Math.sqrt(15 * RECIP_PI) * 0.25,
  Math.sqrt(70 * RECIP_PI) * 0.125,
  Math.sqrt(105 * RECIP_PI) * 0.5,
  Math.sqrt(42 * RECIP_PI) * 0.125,
  Math.sqrt(7 * RECIP_PI) * 0.25,
  Math.sqrt(105 * RECIP_PI) * 0.25];
  
// SH basis functions up to degree l=3. 
// Source for SH basis function definitions:
// "Stupid Spherical Harmonics Tricks", Peter-Pike Sloan, 2008
function y00(x,y,z) { return C[0]; }
function y_11(x,y,z) { return C[1] * y; }
function y01(x,y,z) { return C[1] * z; }
function y11(x,y,z) { return C[1] * x; }
function y_22(x,y,z) { return C[2] * y * x; }
function y_12(x,y,z) { return C[2] * y * z; }
function y02(x,y,z) { return C[3] * (3 * z * z - 1.0); }
function y12(x,y,z) { return C[2] * x * z; }
function y22(x,y,z) { return C[4] * (x*x - y*y); }
function y_33(x,y,z) { return C[5] * y * (3*x*x - y*y); }
function y_23(x,y,z) { return C[6] * z * (y*x); }
function y_13(x,y,z) { return C[7] * y * (5*z*z -1); }
function y03(x,y,z) { return C[8] * z * (5*z*z - 3); }
function y13(x,y,z) { return C[7] * x * (5 * z * z - 1); }
function y23(x,y,z) { return C[9] * z * (x*x - y*y); }
function y33(x,y,z) { return C[5] * x * (x*x - 3*y*y); }

// Evaluates SH basis functions with degrees up to and including l for the
// given direction d, returning the result as a Float32 array where each
// element is the value of the corresponding basis function.
// Only supports values of l <= 3.
function evalSHBasis(d, l) { 
  const x = d[0];
  const y = d[1];
  const z = d[2];
  switch(l) {
  case 0: return new Float32Array([y00(x,y,z)]);
  case 1: return new Float32Array([
    y00(x,y,z), // l = 0
    y_11(x,y,z), // l = 1
    y01(x,y,z),
    y11(x,y,z)]);
  case 2: return new Float32Array([
    y00(x,y,z), // l = 0
    y_11(x,y,z), // l = 1
    y01(x,y,z),
    y11(x,y,z),
    y_22(x,y,z), // l = 2
    y_12(x,y,z),
    y02(x,y,z),
    y12(x,y,z),
    y22(x,y,z)]);
  default: return new Float32Array([
    y00(x,y,z), // l = 0
    y_11(x,y,z), // l = 1
    y01(x,y,z),
    y11(x,y,z),
    y_22(x,y,z), // l = 2
    y_12(x,y,z),
    y02(x,y,z),
    y12(x,y,z),
    y22(x,y,z),
    y_33(x,y,z), // l = 3
    y_23(x,y,z),
    y_13(x,y,z),
    y03(x,y,z),
    y13(x,y,z),
    y23(x,y,z),
    y33(x,y,z)]);
  }
}

// Helper to multiply SH coefficients by a scalar value.
function mulScalarBySHCoeffs(scalar, coeffs) {
  return coeffs.map(function(c){return scalar*c;});
}

// Helper to add together two packs of SH coefficients.
function addSHCoeffs(coeffs0, coeffs1) {
  return coeffs1.map(function(c,i){
    return c + (coeffs0.length==0 ? 0 : coeffs0[i]);
  });
}

// Uses simple Monte-Carlo integration to verify that the basis functions
// are orthonormal.
function testBasisFunctions() {
  const numSamples = 100000;
  const numBasisFuncs = 16; // we support l up to and including 3, so 16 funcs.
  
  // innerProducts[i] contains the inner products of the i-th 
  // SH basis function with every SH basis function, including itself.
  var innerProducts = [];
  for (var b = 0; b < numBasisFuncs; ++b) {
    // these arrays will be initialized to 0.
    innerProducts.push(new Float32Array(numBasisFuncs));
  }
  
  for (var s = 0; s < numSamples;) {
    // Generate a random point on a sphere using simple rejection sampling: 
    // * Generate a point within the [-1,-1,-1] - [1,1,1] cube;
    // * If the point is inside the unit sphere, normalize and use it;
    // * Otherwise, try again.
    var xr = Math.random()*2.0-1.0;
    var yr = Math.random()*2.0-1.0;
    var zr = Math.random()*2.0-1.0;
    var n = Math.sqrt(xr*xr+yr*yr+zr*zr);
    if (n>1) continue;
    s++;
    var d = new Float32Array([xr/n, yr/n, zr/n]);
    
    // Evaluate every SH basis function on the generated sample point,
    // compute the partial inner products and add them to the running totals.
    const basisFunctionValues = evalSHBasis(d, 3);
    for (var b = 0; b < numBasisFuncs; ++b) {
      const bv = basisFunctionValues[b];
      const partialInnerProducts = 
        basisFunctionValues.map(function(v) { return v * bv; });
      innerProducts[b] = addSHCoeffs(innerProducts[b], partialInnerProducts);
    }
  }
  
  // Final step in Monte-Carlo integration: multiply by the measure of the 
  // integration domain (4pi in the unit sphere case) divided by number of
  // samples.
  for (var b = 0; b < numBasisFuncs; ++b) {
    innerProducts[b] = 
      mulScalarBySHCoeffs(4*Math.PI/numSamples, innerProducts[b]);
  }
  
  // innerProducts[i][j] should be very close to 1 if j==i and very close to 0 
  // otherwise.
  console.log(innerProducts);
}

const CUBE_DIM = 128;
const TEXEL_SIZE = 1.0 / CUBE_DIM; // texel size in UV space.
const HALF_TEXEL_SIZE = 0.5 * TEXEL_SIZE;

// Projects a given cube map to spherical harmonics of degrees up to 
// and including maxDegree.
function projectCubemapToSH(cube, maxDegree, gammaCorrection = false) { 
  // Computes the solid angle subtended by the given texel.
  // Derivation:
  // https://www.rorydriscoll.com/2012/01/15/cubemap-texel-solid-angle/
  function calcTexelWeight(x,y) {
    const x0 = x - TEXEL_SIZE;
    const y0 = y - TEXEL_SIZE;
    const x1 = x + TEXEL_SIZE;
    const y1 = y + TEXEL_SIZE;
    function areaElement(a, b) {
      return Math.atan2(a*b, Math.sqrt(a*a + b*b + 1));
    }
    return areaElement(x0, y0) - areaElement(x0, y1) - areaElement(x1, y0) 
          + areaElement(x1, y1);
  }
  
  // We treat each of the red, green and  blue channels as a separate
  // function to approximate.
  // Thus, our output will be three sets of SH coefficients:
  // for red, green and blue respectively.
  var shRgb = [ 
  [],[],[]
  ];
  
  for(var face = 0; face < 6; ++face) {
    for (var col = 0; col < CUBE_DIM; ++col) {
      for (var row = 0; row < CUBE_DIM; ++row) {
        const texelColor = cube[face].data.slice(
            4*(col + row * CUBE_DIM),
            4*(col + row * CUBE_DIM) + 4);
        // UV (0,0) is the top-left corner of the image.
        // UV (1,1) is the bottom-right.
        const faceCoords = cubemapFaceCoords(col, row);
        const d = cubemapCoordsToDirection(face, faceCoords);
        const texelWeight = calcTexelWeight(faceCoords[0], faceCoords[1]);
        const sh = evalSHBasis(d, maxDegree, 1);
        const texelColorf_raw = new Float32Array([
          texelColor[0]/255.0,
          texelColor[1]/255.0,
          texelColor[2]/255.0])
        const texelColorf = 
          gammaCorrection ? srgbToLinear(texelColorf_raw) : texelColorf_raw;
        const shRed = mulScalarBySHCoeffs(texelWeight * texelColorf[0], sh);
        const shGreen = mulScalarBySHCoeffs(texelWeight * texelColorf[1], sh);
        const shBlue = mulScalarBySHCoeffs(texelWeight * texelColorf[2], sh);
        shRgb[0] = addSHCoeffs(shRgb[0], shRed);
        shRgb[1] = addSHCoeffs(shRgb[1], shGreen);
        shRgb[2] = addSHCoeffs(shRgb[2], shBlue);        
      }
    }
  }   
  return shRgb;
}

export function sampleToSH(dir, texelColor, maxDegree, shRgb) {
  
  // We treat each of the red, green and  blue channels as a separate
  // function to approximate.
  // Thus, our output will be three sets of SH coefficients:
  // for red, green and blue respectively.

    // var shRgb = [ 
    // [],[],[]
    // ];

    const d = dir;
    const sh = evalSHBasis(d, maxDegree);
    const texelColorf_raw = new Float32Array([
        texelColor[0]/255.0,
        texelColor[1]/255.0,
        texelColor[2]/255.0]);
    const texelColorf = texelColorf_raw;

    const shRed = mulScalarBySHCoeffs(texelColorf[0], sh);
    const shGreen = mulScalarBySHCoeffs(texelColorf[1], sh);
    const shBlue = mulScalarBySHCoeffs(texelColorf[2], sh);

    shRgb[0] = addSHCoeffs(shRgb[0], shRed);
    shRgb[1] = addSHCoeffs(shRgb[1], shGreen);
    shRgb[2] = addSHCoeffs(shRgb[2], shBlue);        
     
    return shRgb;
}

// Evaluates the given SH representation of a function projected onto 
// l-band basis in the given direction.
function evalSHRepresentation(coeffs, d, l) {
  // evaluate each basis function for the given direction.
  const basis = evalSHBasis(d, l);
  
  // multiply the values of the basis functions in the given direction
  // with the respective SH coefficients.
  const basis_coefs = coeffs.map(function(c,i) { return c * basis[i]; });
  
  // add up the results.
  return basis_coefs.reduce(function(a, v) { return a+v; }, 0.0);  
}