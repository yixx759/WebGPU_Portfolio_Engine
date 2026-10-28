import { debugLog } from './Render.js'
import * as test_funcs from './Test_Funcs.js'
import assert from './Assert.js'

export const BIG_NUMBER = 10 ** 1000;

export const DIR_FORWARD = new Float32Array([0,0,-1]);
export const WORLD_UP_VECTOR= new Float32Array([0,1,0]);

export const ZEROS = new Float32Array([0, 0, 0]);

export const ZEROS_MATRIX = new Float32Array([0, 0, 0, 0
                                            , 0, 0, 0, 0
                                            , 0, 0, 0, 0
                                            , 0, 0, 0, 0]);

export const ONE_OVER_PI = 0.31830988618;

export const BIT_FIELD_CHEST_ITEM = (1 << 2); 
export const BIT_FIELD_ENEMY= (1 << 0); 

export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

export let DT = 0.001;

const TEST_FUNCS = false;

if (TEST_FUNCS)
{
  test_funcs.vectorTestPrints();
}

function get_matrix_coloumn_major_index(column_index, row_index)
{
    return ((column_index) * 4) + (row_index);
}

function get_matrix_row_major_index(column_index, row_index)
{
    return column_index + (row_index * 4);
}

export function multiply_float32_matrices(A, B) {
  
  const num_rows = 4;
  const num_cols = 4;

    let C = new Float32Array(num_rows * num_cols);
    
    for (let i = 0; i < num_rows; i++) {
        for (let j = 0; j < num_cols; j++) {
            let sum = 0.0;
            for (let k = 0; k < num_cols; k++) {
                sum += A[i * num_cols + k] * B[k * num_cols + j];
            }
            C[i * num_cols + j] = sum;
        }
    }
    
    return C;
}

// TO DO: Experiment wth & aligh -1 option
export function align(x, align)
{
  return Math.ceil(x / align) * align;
}

export function get_rotation_matrix(angleRotX, angleRotY, angleRotZ)
{
 // from angle to radians

  angleRotX = angleRotX * Math.PI / 180;
  angleRotY = angleRotY * Math.PI / 180;
  angleRotZ = angleRotZ * Math.PI / 180;
  
  var rotX = new Float32Array([
    1.0, 0.0, 0.0, 0.0,
    0.0, Math.cos(angleRotX), -Math.sin(angleRotX), 0.0,
    0.0, Math.sin(angleRotX), Math.cos(angleRotX), 0.0,
    0.0, 0.0, 0.0, 1.0,
    ]);

    var rotY = new Float32Array([
    Math.cos(angleRotY), 0.0, Math.sin(angleRotY), 0.0,
    0.0, 1, 0, 0.0,
    -Math.sin(angleRotY), 0, Math.cos(angleRotY), 0.0,
    0.0, 0.0, 0.0, 1.0,
    ]);

    var rotZ = new Float32Array([
    Math.cos(angleRotZ), -Math.sin(angleRotZ), 0.0, 0.0,
    Math.sin(angleRotZ), Math.cos(angleRotZ), 0.0,  0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0,
    ]);

    console.log(rotX);
    console.log(rotY);
    console.log(rotZ);

    return multiply_float32_matrices(multiply_float32_matrices(rotZ,rotY),rotX);
};

export function get_inv_rotation_matrix(angleRotX, angleRotY, angleRotZ)
{
 // from angle to radians

  angleRotX = -angleRotX * Math.PI / 180;
  angleRotY = -angleRotY * Math.PI / 180;
  angleRotZ = -angleRotZ * Math.PI / 180;
  
  var rotX = new Float32Array([
    1.0, 0.0, 0.0, 0.0,
    0.0, Math.cos(angleRotX), -Math.sin(angleRotX), 0.0,
    0.0, Math.sin(angleRotX), Math.cos(angleRotX), 0.0,
    0.0, 0.0, 0.0, 1.0,
    ]);

    var rotY = new Float32Array([
    Math.cos(angleRotY), 0.0, Math.sin(angleRotY), 0.0,
    0.0, 1, 0, 0.0,
    -Math.sin(angleRotY), 0, Math.cos(angleRotY), 0.0,
    0.0, 0.0, 0.0, 1.0,
    ]);

    var rotZ = new Float32Array([
    Math.cos(angleRotZ), -Math.sin(angleRotZ), 0.0, 0.0,
    Math.sin(angleRotZ), Math.cos(angleRotZ), 0.0,  0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0,
    ]);

    console.log(rotX);
    console.log(rotY);
    console.log(rotZ);

    return multiply_float32_matrices(multiply_float32_matrices(rotX,rotY),rotZ);
};

export function get_world_matrix(posX,posY,posZ,angleRotX, angleRotY, angleRotZ, scale)
{
 var transformMatrix = new Float32Array([
    1,0,0,0,
    0,1,0,0,
    0,0,1,0,
    posX,posY,posZ,1
  ])


  var scaleMatrix = new Float32Array([
    scale,0,0,0,
    0,scale,0,0,
    0,0,scale,0,
    0,0,0,1
  ])

  // from angle to radians

  angleRotX = angleRotX * Math.PI / 180;
  angleRotY = angleRotY * Math.PI / 180;
  angleRotZ = angleRotZ * Math.PI / 180;

  const rotX = new Float32Array([
    1.0, 0.0,           0.0,          0.0,
    0.0, Math.cos(angleRotX),  Math.sin(angleRotX), 0.0,
    0.0, -Math.sin(angleRotX), Math.cos(angleRotX), 0.0,
    0.0, 0.0,           0.0,          1.0,
  ]);

  const rotY = new Float32Array([
    Math.cos(angleRotY), 0.0, -Math.sin(angleRotY), 0.0,
    0.0,          1.0, 0.0,           0.0,
    Math.sin(angleRotY), 0.0, Math.cos(angleRotY),  0.0,
    0.0,          0.0, 0.0,           1.0,
  ]);

  const rotZ = new Float32Array([
    Math.cos(angleRotZ),  Math.sin(angleRotZ), 0.0, 0.0,
    -Math.sin(angleRotZ), Math.cos(angleRotZ), 0.0, 0.0,
    0.0,           0.0,          1.0, 0.0,
    0.0,           0.0,          0.0, 1.0,
  ]);

    let rotationMatrix = multiply_float32_matrices(multiply_float32_matrices(rotX,rotY),rotZ);

    return multiply_float32_matrices(multiply_float32_matrices(scaleMatrix, rotationMatrix), transformMatrix);

};

export function get_world_matrix_array(position, angleRotation, scale)
{
 var transformMatrix = new Float32Array([
    1,0,0,0,
    0,1,0,0,
    0,0,1,0,
    position[0], position[1], position[2], 1
  ])


  var scaleMatrix = new Float32Array([
    scale,0,0,0,
    0,scale,0,0,
    0,0,scale,0,
    0,0,0,1
  ])

  // from angle to radians

  angleRotation[0] = angleRotation[0] * Math.PI / 180;
  angleRotation[1] = angleRotation[1] * Math.PI / 180;
  angleRotation[2] = angleRotation[2] * Math.PI / 180;

  var rotX = new Float32Array([
    1.0, 0.0, 0.0, 0.0,
    0.0, Math.cos(angleRotation[0]), -Math.sin(angleRotation[0]), 0.0,
    0.0, Math.sin(angleRotation[0]), Math.cos(angleRotation[0]), 0.0,
    0.0, 0.0, 0.0, 1.0,
    ]);

    var rotY = new Float32Array([
    Math.cos(angleRotation[1]), 0.0, Math.sin(angleRotation[1]), 0.0,
    0.0, 1, 0, 0.0,
    -Math.sin(angleRotation[1]), 0, Math.cos(angleRotation[1]), 0.0,
    0.0, 0.0, 0.0, 1.0,
    ]);

    var rotZ = new Float32Array([
    Math.cos(angleRotation[2]), -Math.sin(angleRotation[2]), 0.0, 0.0,
    Math.sin(angleRotation[2]), Math.cos(angleRotation[2]), 0.0,  0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0,
    ]);

    let rotationMatrix = multiply_float32_matrices(multiply_float32_matrices(rotZ,rotY),rotX);

    return multiply_float32_matrices(multiply_float32_matrices(rotationMatrix,transformMatrix),scaleMatrix);
};

export function vector_3_equality(A, B)
{
    return ((A[0] == B[0]) && (A[1] == B[1]) && (A[2] == B[2]));
}

export function vector_4_equality(A, B)
{
    return ((A[0] == B[0]) && (A[1] == B[1]) && (A[2] == B[2]) && (A[3] == B[3]));
}

export function negate_vertex(inpVec)
{
  let vec = new Float32Array([...inpVec]);

  for (let i = 0; i < vec.length; i++) {
    vec[i] = -vec[i];
  }
  return vec;
}

export function vector_add(A, B, is_point = false)
{
  if (!is_point)
  {
    return new Float32Array([A[0]+B[0], A[1]+B[1],A[2]+B[2], 0]);
  }
  else
  {
    return new Float32Array([A[0]+B[0], A[1]+B[1],A[2]+B[2], 1]);
  }
}

export function vector_3_add_into(A, B)
{
  A[0] += B[0];
  A[1] += B[1];
  A[2] += B[2];

  return A;
}

export function vector_mult(A, mag_vector){
  return new Float32Array([A[0]*mag_vector[0], A[1]*mag_vector[1],A[2]*mag_vector[2], 0]);
}

export function vector_mult_scalar(A, mag_scalar){
  return new Float32Array([A[0]*mag_scalar, A[1]*mag_scalar, A[2]*mag_scalar, 0]);
}

export function vector_mult_scalar_into(A, mag_scalar){
  A[0] *= mag_scalar;
  A[1] *= mag_scalar;
  A[2] *= mag_scalar;
  return A;
}

export function qut_mult_scalar_into(A, mag_scalar){
  vector_mult_scalar_into(A, mag_scalar);
  A[3] *= mag_scalar;
  return A;
}

function inverse_qut(quaternion)
{
  quaternion[0] = -quaternion[0];
  quaternion[1] = -quaternion[1];
  quaternion[2] = -quaternion[2];
  quaternion[3] = -quaternion[3];

  return quaternion;
}


export function vector_div_scalar(A, mag_scalar){
  return new Float32Array([A[0]/mag_scalar, A[1]/mag_scalar, A[2]/mag_scalar, 0]);
}

export function vector_div_scalar_into(A, mag_scalar){
  A[0] /= mag_scalar;
  A[1] /= mag_scalar;
  A[2] /= mag_scalar;

  return A;
}

export function vector_add_cam(A, X, Z){
  A[0] += X;
  A[2] += Z;
}

export function vector_debug_add_cam(A, X, Y, Z){
  A[0] += X;
  A[1] += Y;
  A[2] += Z;
}

export function vector_assign_cam(A,B){
  A[0] = B[0];
  A[1] = B[1];
  A[2] = B[2];
  A[3] = B[3];
}


export function vector_add_non_float(A, B){
  return new [A[0]+B[0], A[1]+B[1],A[2]+B[2], 0];
}

export function vector_subtract(A, B){
  return new Float32Array([A[0]-B[0], A[1]-B[1],A[2]-B[2]]);
}

export function vector_subtract_into_first_param(A, B){
  A[0] -= B[0];
  A[1] -= B[1];
  A[2] -= B[2];

  return A;
}

export function abs_vector_subtract(A, B){
  return new Float32Array([Math.abs(A[0]-B[0]), Math.abs(A[1]-B[1]), Math.abs(A[2]-B[2])]);
}

export function vector_abs_into(A)
{
  A[0] = Math.abs(A[0])
  A[1] = Math.abs(A[1])
  A[2] = Math.abs(A[2])
}

export function vector_abs(A)
{
  return new Float32Array([Math.abs(A[0]), Math.abs(A[1]), Math.abs(A[2])]);
}

export function vector_dot(A, B){
  return A[0]*B[0]+ A[1]*B[1] + A[2]*B[2];
}

export function qut_dot(A, B){
  return A[0]*B[0]+ A[1]*B[1] + A[2]*B[2] + A[3]*B[3];
}

export function vector_cross(A, B){
  return [A[1]*B[2] - A[2]*B[1], A[2]*B[0] - A[0]*B[2] ,A[0]*B[1] - A[1]*B[0]];
}

export function vector_mag(A){
  return Math.sqrt(A[0]*A[0] + A[1]*A[1] + A[2]*A[2]);
}

export function vector_mag_sqr(A){
  assert(arguments.length == 1, "SHould be only one argument");
  assert(A instanceof Float32Array, "SHould be float32 not sent in");
  return A[0]*A[0] + A[1]*A[1] + A[2]*A[2];
}

export function quat_mag(A){
  return Math.sqrt(A[0]*A[0] + A[1]*A[1] + A[2]*A[2] + A[3]*A[3]);
}

export function vector_norm(A){
  const mag = vector_mag(A);
  return [A[0]/mag, A[1]/mag, A[2]/mag];
}

export function vector_norm_into(A){
  const mag = vector_mag(A);
  A[0] /= mag;
  A[1] /= mag;
  A[2] /= mag;

  return A;
}

export function vector_reflect(V, N)
{
  const V_d_N = vector_dot(V, N) * 2;
  const R = vector_mult_scalar(N, V_d_N);

  // \(\vec{R} = \vec{V} - 2(\vec{V} \cdot \vec{N})\vec{N}\)
  return vector_subtract(V, R);
}

function qut_conjugate(quaternion)
{
  return new Float32Array([-quaternion[0], -quaternion[1], -quaternion[2],quaternion[3]]);
}

export function euler_to_quaternion(euler)
{
  const x = euler[0] * DEG_TO_RAD;
  const y = euler[1] * DEG_TO_RAD;
  const z = euler[2] * DEG_TO_RAD;

  const cos_x_h = Math.cos(x * 0.5)
  const sin_x_h = Math.sin(x * 0.5)  
  const cos_y_h = Math.cos(y * 0.5)
  const sin_y_h = Math.sin(y * 0.5) 
  const cos_z_h = Math.cos(z * 0.5)
  const sin_z_h = Math.sin(z * 0.5)

  let quaternion = new Float32Array(4);
  quaternion[0] = (sin_x_h*cos_y_h*cos_z_h) - (cos_x_h*sin_y_h*sin_z_h)
  quaternion[1] = (cos_x_h*sin_y_h*cos_z_h) + (sin_x_h*cos_y_h*sin_z_h)
  quaternion[2] = (cos_x_h*cos_y_h*sin_z_h) - (sin_x_h*sin_y_h*cos_z_h)
  quaternion[3] = (cos_x_h*cos_y_h*cos_z_h) + (sin_x_h*sin_y_h*sin_z_h)
  
  return normalize_quaternion(quaternion);
}

export function matrix_to_quaternion(matrix)
{
  const m00 = matrix[get_matrix_row_major_index(0,0)];
  const m01 = matrix[get_matrix_row_major_index(0,1)];
  const m02 = matrix[get_matrix_row_major_index(0,2)];
  const m10 = matrix[get_matrix_row_major_index(1,0)];
  const m11 = matrix[get_matrix_row_major_index(1,1)];
  const m12 = matrix[get_matrix_row_major_index(1,2)];
  const m20 = matrix[get_matrix_row_major_index(2,0)];
  const m21 = matrix[get_matrix_row_major_index(2,1)];
  const m22 = matrix[get_matrix_row_major_index(2,2)];
  const m30 = matrix[get_matrix_row_major_index(3,0)];
  const m31 = matrix[get_matrix_row_major_index(3,1)];
  const m32 = matrix[get_matrix_row_major_index(3,2)];
  const m33 = matrix[get_matrix_row_major_index(3,3)];

  const t = m00 + m11 + m22;

  if (t > 0)
  {
    const s = (0.5 / Math.sqrt(t + 1));
    const w = 0.25 / s;
    const x = (m21 - m12) * s;
    const y = (m02 - m20) * s;
    const z = (m10 - m01) * s;

    return new Float32Array([x,y,z,w]);
  }
  if (m00 > m11 && m00 > m22)
  {
    const s = (Math.sqrt(m00 - m11 - m22 + m33)) * 2;
    const w = (m21 - m12) / s;
    const x = s * 0.25;
    const y = (m01 + m10) / s;
    const z = (m02 + m20) / s;

    return new Float32Array([x,y,z,w]);
  }
  if (m11 > m22)
  {
    const s = (Math.sqrt(-m00 + m11 - m22 + m33)) * 2;
    const w = (m02 - m20) / s;
    const x = (m01 + m10) / s;
    const y = s  * 0.25;
    const z = (m12 + m21) / s;

    return new Float32Array([x,y,z,w]);
  }
  else
  {
    const s = (Math.sqrt(-m00 - m11 + m22 + m33)) * 2;
    const w = (m10 - m01) / s;
    const x = (m02 + m20) / s;
    const y = (m12 + m21) / s;
    const z = s * 0.25;

    return new Float32Array([x,y,z,w]);
  }
   // Trace = m00 + m11 + m22 if > 0 use w
   // If m00 > m11 & m22 thewn caluclate 4qx^2 make into qx then find other componets from that.
   // same for ither siezes
}

export function normalize_quaternion(quaternion)
{
  const mag = quat_mag(quaternion);
  quaternion[0] /= mag;
  quaternion[1] /= mag;
  quaternion[2] /= mag;
  quaternion[3] /= mag;

  return quaternion;
}

export function dir_vector_to_matrix(x, y, z)
{
  const rot_matrix = new Float32Array([
    x[0], x[1], x[2], 0,
    y[0], y[1], y[2], 0,
    z[0], z[1], z[2], 0,
    0, 0, 0, 1
  ]);

  return rot_matrix;
}

export function dir_vector_to_quaternion(z, y)
{
  z = vector_norm_into(z)
  let x = vector_norm_into(vector_cross(y, z));
  y = vector_cross(z, x);

  let rot_matrix = dir_vector_to_matrix(x, y, z);
  let quaternion_from_matrix = matrix_to_quaternion(rot_matrix);
  
  // Normalize
  return normalize_quaternion(quaternion_from_matrix);
}

export function quaternion_rotate_point(){} // Have to do transpose quaternon * point * inverse trenaspose quat

export function quaternion_multiply(q1, q2)
{
  const cross_q1_q2 = vector_cross(q1, q2);
  const dot_q1_q2 = vector_dot(q1, q2);
  
  const vector_part = vector_3_add_into(cross_q1_q2, vector_add(vector_mult_scalar(q1, q2[3]), vector_mult_scalar(q2, q1[3])));
  const w_part = q1[3] * q2[3] - dot_q1_q2;

  return new Float32Array([vector_part[0],vector_part[1],vector_part[2], w_part]);
} // Can just do multiplication

export function n_lerp(a, b, t)
{
  a = vector_3_lerp(a, b, t);
  a[3] = lerp(a[3], b[3], t);

  return normalize_quaternion(a);
}

export function move_towards(current_vel, target_vel, max_accel)
{
  let current_to_target = vector_subtract(target_vel, current_vel);
  const mag = vector_mag(current_to_target);

  if (mag <= max_accel || mag == 0)
  {
    return target_vel;
  }

  return vector_3_add_into(current_vel, vector_mult_scalar_into(vector_div_scalar_into(current_to_target, mag), max_accel));
}

export function euler_to_vector(euler_angles)
{
  const pitch = euler_angles[1];
  const cos_pitch = Math.cos(pitch)

  const x = -Math.sin(euler_angles[1]) 
  const y = Math.sin(euler_angles[0]) * cos_pitch
  const z = Math.cos(euler_angles[0]) * cos_pitch

  return new Float32Array([x, y, z]);
}

export function vector_to_euler(vector_angles)
{
  const [x,y,z] = vector_angles;

  const pitch = Math.atan2(y,z);
  const yaw = Math.atan2(-x, Math.hypot(y,z))

  return new Float32Array([pitch, yaw, 0]);
}

export function unit_quaternion_to_matrix(quaternion)
{
  const qx = quaternion[0];
  const qx_sqaured = qx*qx;
  const qy = quaternion[1];
  const qy_sqaured = qy*qy;
  const qz = quaternion[2];
  const qz_sqaured = qz*qz;
  const qw = quaternion[3];

  return new Float32Array([
    1-2*(qy_sqaured+qz_sqaured),     2*(qx*qy + qw*qz), 2*(qx*qz - qw*qy), 0,
    2*(qx*qy - qw*qz), 1-2*(qx_sqaured+qz_sqaured),     2*(qy*qz + qw*qx), 0,
    2*(qx*qz + qw*qy), 2*(qy*qz - qw*qx), 1-2*(qx_sqaured+qy_sqaured),     0,
    0, 0, 0, 1
  ]);
}

export function matrix_to_euler(matrix)
{
  const m22 = matrix[get_matrix_row_major_index(2,2)];
  const m21 = matrix[get_matrix_row_major_index(2,1)];
  const m20 = matrix[get_matrix_row_major_index(2,0)];
  const m10 = matrix[get_matrix_row_major_index(1,0)];
  const m00 = matrix[get_matrix_row_major_index(0,0)];
  const m12 = matrix[get_matrix_row_major_index(1,2)];
  const m11 = matrix[get_matrix_row_major_index(1,1)];

  if (Math.abs(m20) < 1 - 1e-6) {
      return new Float32Array([Math.atan2(m21, m22) * RAD_TO_DEG, -Math.asin(m20) * RAD_TO_DEG, Math.atan2(m10, m00) * RAD_TO_DEG]);
    }
    // Gimbal lock: fix yaw = 0
    return new Float32Array([Math.atan2(-m12, m11) * RAD_TO_DEG, -Math.sign(m20) * 90, 0]);
}

export function rotate_normalized_lerp(current_rot, target_dir, max_rot_accel)
{
  if (target_dir === ZEROS)
  {
    return current_rot;
  }

  let current_qut_rot = euler_to_quaternion(current_rot);
  let target_qut_rot = dir_vector_to_quaternion(target_dir, WORLD_UP_VECTOR);
  
  const dot_of_qut = qut_dot(current_qut_rot, target_qut_rot);
 
  if (dot_of_qut < 0)
  {
    target_qut_rot = inverse_qut(target_qut_rot);
  }

  const new_qut_rot = n_lerp(current_qut_rot, target_qut_rot, max_rot_accel);;
 
  const new_rot_matrix = unit_quaternion_to_matrix(new_qut_rot);
  let new_rot = matrix_to_euler(new_rot_matrix);

  return new_rot;
}

function lerp(a, b, t)
{
  return (a * (1 - t) + b * (t));
}

export function vector_3_lerp(a, b, t)
{
  a[0] = lerp(a[0], b[0], t);
  a[1] = lerp(a[1], b[1], t);
  a[2] = lerp(a[2], b[2], t);

  return a;
}

export function apply_world_to_collider(vec, matrix)
{
  return [vec[0]+matrix[12],vec[1]+matrix[13],vec[2]+matrix[14], 0]; 
}

export function get_view_matrix(forward, up, cam_pos){
    const right = vector_cross(up,forward);
    const nuUp = vector_cross(forward, right);

    // debugLog("Forward vec:" + forward)

    const view =  new Float32Array([
    right[0] , nuUp[0], forward[0], 0,
    right[1] , nuUp[1], forward[1], 0,
    right[2] , nuUp[2], forward[2], 0,
    -vector_dot(right, cam_pos) , -vector_dot(nuUp, cam_pos), -vector_dot(forward, cam_pos), 1,
    ])

  return view;
}

// point • matrix
// From https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Matrix_math_for_the_web
export function multiply_matrix_and_point(matrix, point) {
  // Give a simple variable name to each part of the matrix, a column and row number
  const c0r0 = matrix[0],
    c1r0 = matrix[1],
    c2r0 = matrix[2],
    c3r0 = matrix[3];
  const c0r1 = matrix[4],
    c1r1 = matrix[5],
    c2r1 = matrix[6],
    c3r1 = matrix[7];
  const c0r2 = matrix[8],
    c1r2 = matrix[9],
    c2r2 = matrix[10],
    c3r2 = matrix[11];
  const c0r3 = matrix[12],
    c1r3 = matrix[13],
    c2r3 = matrix[14],
    c3r3 = matrix[15];

  // Now set some simple names for the point
  const x = point[0];
  const y = point[1];
  const z = point[2];
  const w = point[3];

  // Multiply the point against each part of the 1st column, then add together
  const resultX = x * c0r0 + y * c0r1 + z * c0r2 + w * c0r3;

  // Multiply the point against each part of the 2nd column, then add together
  const resultY = x * c1r0 + y * c1r1 + z * c1r2 + w * c1r3;

  // Multiply the point against each part of the 3rd column, then add together
  const resultZ = x * c2r0 + y * c2r1 + z * c2r2 + w * c2r3;

  // Multiply the point against each part of the 4th column, then add together
  const resultW = x * c3r0 + y * c3r1 + z * c3r2 + w * c3r3;

  return [resultX, resultY, resultZ, resultW];
}

const SMALL_NUM = 0.00000000000001;

export function multiply_matrix_and_normal(matrix, normal)
{
  if (normal.length !== 4 | normal[3] == 1)
  {
    console.log("Normal input wrong");
    console.log("Lenght: " + normal.length);
    console.log("Is Point?: " + (normal[3] == 1));
  }

  const inv_transpose_matrix = transpose_matrix(inverse_matrix(matrix));

  let normal_final = multiply_matrix_and_point(inv_transpose_matrix, normal);

  normal_final[3] = 0;

  normal_final = vector_norm(normal_final);

  return normal_final;
}

export function multiply_inverse_transpose_matrix_and_normal(matrix, normal)
{
  if (normal.length !== 4 | normal[3] == 1)
  {
    console.log("Normal input wrong");
    console.log("Lenght: " + normal.length);
    console.log("Is Point?: " + (normal[3] == 1));
  }

  const inv_transpose_matrix = matrix;

  let normal_final = multiply_matrix_and_point(inv_transpose_matrix, normal);

  normal_final[3] = 0;

  normal_final = vector_norm(normal_final);

  return normal_final;
}

export function get_perspective_matrix(FOV, n, f){
    const S = 1 / Math.tan((FOV/2) * (Math.PI / 180));

    const fn = ((f) / (n-f)); 
    const fMn = ((f*n) / (n-f)); 

    const test = new Float32Array([
    S,0,0,0,
    0,S,0,0,
    0,0,fn, -1,
    0,0, fMn ,0
    ]);

  return test;
}

// Matrix funcs from: 
// https://evanw.github.io/lightgl.js/docs/matrix.html
export function inverse_matrix(m)
{
  let r = new Float32Array(4*4);

  r[0] = m[5]*m[10]*m[15] - m[5]*m[14]*m[11] - m[6]*m[9]*m[15] + m[6]*m[13]*m[11] + m[7]*m[9]*m[14] - m[7]*m[13]*m[10];
  r[1] = -m[1]*m[10]*m[15] + m[1]*m[14]*m[11] + m[2]*m[9]*m[15] - m[2]*m[13]*m[11] - m[3]*m[9]*m[14] + m[3]*m[13]*m[10];
  r[2] = m[1]*m[6]*m[15] - m[1]*m[14]*m[7] - m[2]*m[5]*m[15] + m[2]*m[13]*m[7] + m[3]*m[5]*m[14] - m[3]*m[13]*m[6];
  r[3] = -m[1]*m[6]*m[11] + m[1]*m[10]*m[7] + m[2]*m[5]*m[11] - m[2]*m[9]*m[7] - m[3]*m[5]*m[10] + m[3]*m[9]*m[6];

  r[4] = -m[4]*m[10]*m[15] + m[4]*m[14]*m[11] + m[6]*m[8]*m[15] - m[6]*m[12]*m[11] - m[7]*m[8]*m[14] + m[7]*m[12]*m[10];
  r[5] = m[0]*m[10]*m[15] - m[0]*m[14]*m[11] - m[2]*m[8]*m[15] + m[2]*m[12]*m[11] + m[3]*m[8]*m[14] - m[3]*m[12]*m[10];
  r[6] = -m[0]*m[6]*m[15] + m[0]*m[14]*m[7] + m[2]*m[4]*m[15] - m[2]*m[12]*m[7] - m[3]*m[4]*m[14] + m[3]*m[12]*m[6];
  r[7] = m[0]*m[6]*m[11] - m[0]*m[10]*m[7] - m[2]*m[4]*m[11] + m[2]*m[8]*m[7] + m[3]*m[4]*m[10] - m[3]*m[8]*m[6];

  r[8] = m[4]*m[9]*m[15] - m[4]*m[13]*m[11] - m[5]*m[8]*m[15] + m[5]*m[12]*m[11] + m[7]*m[8]*m[13] - m[7]*m[12]*m[9];
  r[9] = -m[0]*m[9]*m[15] + m[0]*m[13]*m[11] + m[1]*m[8]*m[15] - m[1]*m[12]*m[11] - m[3]*m[8]*m[13] + m[3]*m[12]*m[9];
  r[10] = m[0]*m[5]*m[15] - m[0]*m[13]*m[7] - m[1]*m[4]*m[15] + m[1]*m[12]*m[7] + m[3]*m[4]*m[13] - m[3]*m[12]*m[5];
  r[11] = -m[0]*m[5]*m[11] + m[0]*m[9]*m[7] + m[1]*m[4]*m[11] - m[1]*m[8]*m[7] - m[3]*m[4]*m[9] + m[3]*m[8]*m[5];

  r[12] = -m[4]*m[9]*m[14] + m[4]*m[13]*m[10] + m[5]*m[8]*m[14] - m[5]*m[12]*m[10] - m[6]*m[8]*m[13] + m[6]*m[12]*m[9];
  r[13] = m[0]*m[9]*m[14] - m[0]*m[13]*m[10] - m[1]*m[8]*m[14] + m[1]*m[12]*m[10] + m[2]*m[8]*m[13] - m[2]*m[12]*m[9];
  r[14] = -m[0]*m[5]*m[14] + m[0]*m[13]*m[6] + m[1]*m[4]*m[14] - m[1]*m[12]*m[6] - m[2]*m[4]*m[13] + m[2]*m[12]*m[5];
  r[15] = m[0]*m[5]*m[10] - m[0]*m[9]*m[6] - m[1]*m[4]*m[10] + m[1]*m[8]*m[6] + m[2]*m[4]*m[9] - m[2]*m[8]*m[5];

  var det = m[0]*r[0] + m[1]*r[4] + m[2]*r[8] + m[3]*r[12];
  for (var i = 0; i < 16; i++) r[i] /= det;
  
  return r;
}

export function get_forward_vector_from_matrix(v, m)
{
  v[0] = -m[get_matrix_coloumn_major_index(0, 2)];
  v[1] = -m[get_matrix_coloumn_major_index(1, 2)];
  v[2] = m[get_matrix_coloumn_major_index(2, 2)];

  return v;
}

// TO DO: Creates too many new matrixs // This is a path tracing prob fix when used agian
export function transpose_matrix(m)
{
  var r = new Float32Array(4*4);

  r[0] = m[0]; r[1] = m[4]; r[2] = m[8]; r[3] = m[12];
  r[4] = m[1]; r[5] = m[5]; r[6] = m[9]; r[7] = m[13];
  r[8] = m[2]; r[9] = m[6]; r[10] = m[10]; r[11] = m[14];
  r[12] = m[3]; r[13] = m[7]; r[14] = m[11]; r[15] = m[15];
  return r;
}

export function get_vertex_buffer_from_decoded_obj(decodedObj) {
  const vertexPositionBuffer = decodedObj[0];
  const textureCoordBuffer = decodedObj[1];
  const normalBuffer = decodedObj[2];
  const faceIndexBuffer = decodedObj[3];
  
  const fLengthDivideThree = (faceIndexBuffer.length/3);
  const length = (fLengthDivideThree * 1.5) * 8;
  var outputVertexBuffer = new Float32Array(length);
  var index = 0;
  for (let i = 0; i < faceIndexBuffer.length; i += 4*3, index += 6*8) {
    //for this
    const faceVertPos0 = (faceIndexBuffer[i] - 1) * 3;
    const faceVertPos1 = (faceIndexBuffer[i + 3]- 1) * 3;
    const faceVertPos2 = (faceIndexBuffer[i + 6]- 1) * 3;
    const faceVertPos3 = (faceIndexBuffer[i + 9]- 1) * 3;

    const faceTexCoord0 = (faceIndexBuffer[i + 1]- 1) * 2 ;
    const faceTexCoord1 = (faceIndexBuffer[i + 1 + 3]- 1) * 2;
    const faceTexCoord2 = (faceIndexBuffer[i + 1 + 6]- 1) * 2 ;
    const faceTexCoord3 = (faceIndexBuffer[i + 1 + 9 ]- 1) * 2 ;

    const faceNormal0 = (faceIndexBuffer[i + 2] - 1) * 3;
    const faceNormal1 = (faceIndexBuffer[i + 2 + 3] - 1) * 3;
    const faceNormal2 = (faceIndexBuffer[i + 2 + 6] - 1) * 3;
    const faceNormal3 = (faceIndexBuffer[i + 2 + 9 ] - 1) * 3;
  
    var indexOffset = 0;

    outputVertexBuffer[index] = vertexPositionBuffer[faceVertPos0];
    outputVertexBuffer[index + 1] = vertexPositionBuffer[faceVertPos0 + 1];
    outputVertexBuffer[index + 2] = vertexPositionBuffer[faceVertPos0 + 2];
    outputVertexBuffer[index + 3] = textureCoordBuffer[faceTexCoord0];
    outputVertexBuffer[index + 4] = textureCoordBuffer[faceTexCoord0 + 1];
    outputVertexBuffer[index + 5] = normalBuffer[faceNormal0];
    outputVertexBuffer[index + 6] = normalBuffer[faceNormal0 + 1];
    outputVertexBuffer[index + 7] = normalBuffer[faceNormal0 + 2];

    indexOffset += 8;
    outputVertexBuffer[index + indexOffset] = vertexPositionBuffer[faceVertPos1];
    outputVertexBuffer[index + 1 + indexOffset] = vertexPositionBuffer[faceVertPos1 + 1];
    outputVertexBuffer[index + 2 + indexOffset] = vertexPositionBuffer[faceVertPos1 + 2];
    outputVertexBuffer[index + 3 + indexOffset] = textureCoordBuffer[faceTexCoord1];
    outputVertexBuffer[index + 4 + indexOffset] = textureCoordBuffer[faceTexCoord1 + 1];
    outputVertexBuffer[index + 5 + indexOffset] = normalBuffer[faceNormal1];
    outputVertexBuffer[index + 6 + indexOffset] = normalBuffer[faceNormal1 + 1];
    outputVertexBuffer[index + 7 + indexOffset] = normalBuffer[faceNormal1 + 2];

    indexOffset += 8;
    outputVertexBuffer[index + indexOffset] = vertexPositionBuffer[faceVertPos3];
    outputVertexBuffer[index + 1 + indexOffset] = vertexPositionBuffer[faceVertPos3 + 1];
    outputVertexBuffer[index + 2 + indexOffset] = vertexPositionBuffer[faceVertPos3 + 2];
    outputVertexBuffer[index + 3 + indexOffset] = textureCoordBuffer[faceTexCoord3];
    outputVertexBuffer[index + 4 + indexOffset] = textureCoordBuffer[faceTexCoord3 + 1];
    outputVertexBuffer[index + 5 + indexOffset] = normalBuffer[faceNormal3];
    outputVertexBuffer[index + 6 + indexOffset] = normalBuffer[faceNormal3 + 1];
    outputVertexBuffer[index + 7 + indexOffset] = normalBuffer[faceNormal3 + 2];

    indexOffset += 8;
    outputVertexBuffer[index + indexOffset] = vertexPositionBuffer[faceVertPos1];
    outputVertexBuffer[index + 1 + indexOffset] = vertexPositionBuffer[faceVertPos1 + 1];
    outputVertexBuffer[index + 2 + indexOffset] = vertexPositionBuffer[faceVertPos1 + 2];
    outputVertexBuffer[index + 3 + indexOffset] = textureCoordBuffer[faceTexCoord1];
    outputVertexBuffer[index + 4 + indexOffset] = textureCoordBuffer[faceTexCoord1 + 1];
    outputVertexBuffer[index + 5 + indexOffset] = normalBuffer[faceNormal1];
    outputVertexBuffer[index + 6 + indexOffset] = normalBuffer[faceNormal1 + 1];
    outputVertexBuffer[index + 7 + indexOffset] = normalBuffer[faceNormal1 + 2];

    indexOffset += 8;
    outputVertexBuffer[index + indexOffset] = vertexPositionBuffer[faceVertPos2];
    outputVertexBuffer[index + 1 + indexOffset] = vertexPositionBuffer[faceVertPos2 + 1];
    outputVertexBuffer[index + 2 + indexOffset] = vertexPositionBuffer[faceVertPos2 + 2];
    outputVertexBuffer[index + 3 + indexOffset] = textureCoordBuffer[faceTexCoord2];
    outputVertexBuffer[index + 4 + indexOffset] = textureCoordBuffer[faceTexCoord2 + 1];
    outputVertexBuffer[index + 5 + indexOffset] = normalBuffer[faceNormal2];
    outputVertexBuffer[index + 6 + indexOffset] = normalBuffer[faceNormal2 + 1];
    outputVertexBuffer[index + 7 + indexOffset] = normalBuffer[faceNormal2 + 2];

    indexOffset += 8;
    outputVertexBuffer[index + indexOffset] = vertexPositionBuffer[faceVertPos3];
    outputVertexBuffer[index + 1 + indexOffset] = vertexPositionBuffer[faceVertPos3 + 1];
    outputVertexBuffer[index + 2 + indexOffset] = vertexPositionBuffer[faceVertPos3 + 2];
    outputVertexBuffer[index + 3 + indexOffset] = textureCoordBuffer[faceTexCoord3];
    outputVertexBuffer[index + 4 + indexOffset] = textureCoordBuffer[faceTexCoord3 + 1];
    outputVertexBuffer[index + 5 + indexOffset] = normalBuffer[faceNormal3];
    outputVertexBuffer[index + 6 + indexOffset] = normalBuffer[faceNormal3 + 1];
    outputVertexBuffer[index + 7 + indexOffset] = normalBuffer[faceNormal3 + 2];

    //console.log( textureCoordBuffer[faceVertPos0]);
  //print test
}


  return outputVertexBuffer;
}

export async function load_image_bitmap(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return await createImageBitmap(blob, { colorSpaceConversion: 'none' });
}

export async function load_image_data(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = new OffscreenCanvas(img.width, img.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, img.width, img.height));
    };
    img.src = url;
  });
}

export async function load_shader(url) {
    const response = await fetch(url);
    return await response.text();
}

export function is_undefined(x)
{
  if (x === undefined)
  {
    console.log("Is Underfined BROKE");
  }
}

export function error_check(whatever)
{
  if (!whatever) {
    throw Error('Couldn\'t find .') ;
  }
  else{
    console.log(whatever);
  }
}