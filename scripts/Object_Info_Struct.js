import * as helper from './Helper_Funcs.js';

// Data type size
// refrence: https://www.w3schools.com/js/js_datatypes.asp

export const BYTES_OF_FLOAT_16 = 16 / 8;
export const BYTES_OF_FLOAT_32 = 32 / 8;
export const BYTES_OF_FLOAT_64 = 64 / 8;

export const BYTES_OF_INT_8 = 8 / 8;
export const BYTES_OF_INT_16 = 16 / 8;
export const BYTES_OF_INT_32 = 32 / 8;

export const BYTES_OF_VECTOR3 = BYTES_OF_FLOAT_32 * 3;
export const BYTES_OF_MATRIX = BYTES_OF_FLOAT_32 * 4 * 4;

const OFFSET_TRANSFROM_SCALE = 3;
const OFFSET_TRANSFROM_ROTATION = 4;

export const VERTEX_INDEX_CUBE = 0;
export const VERTEX_INDEX_BUNNY = 1;

const ALIGHNMENT_NUMBER = 64

export let ALIGNMENT_BYTES_OF_OBJECT = -1;
export const SIZE_OF_BRDF_PARAMS_BYTES = 256; // 11 * objectInfo.BYTES_OF_FLOAT_32;

let object_array;
let transform_array;
let index_array;

const AMOUNT_OF_ELEMENTS = 9;
let OFFSET_INTO_ELEMENT = new Int16Array(AMOUNT_OF_ELEMENTS);

function add_int8_element(index)
{
  index = helper.align(index + BYTES_OF_INT_8, BYTES_OF_FLOAT_32)

  return index
}

function add_float32_element(index)
{
  index = index + BYTES_OF_FLOAT_32

  return index
}

function add_vector3_element(index)
{
  index = helper.align(index + BYTES_OF_VECTOR3, BYTES_OF_FLOAT_32)

  return index
}

function add_matrix_element(index)
{
  index = helper.align(index + BYTES_OF_MATRIX, BYTES_OF_FLOAT_32)

  return index
}

let INDEX_OFFSET_INTO_VERTEX_INDEX = 0;
let INDEX_OFFSET_INTO_TEXTURE_INDEX = 1;
let INDEX_OFFSET_INTO_POSITION = 2;
let INDEX_OFFSET_INTO_SCALE = 3;
let INDEX_OFFSET_INTO_ROTATION = 4;
let INDEX_OFFSET_INTO_HALF = 5;
let INDEX_OFFSET_INTO_MATRIX = 6;
let INDEX_OFFSET_INTO_DIRTY_BIT = 7;
let INDEX_OFFSET_INTO_BRDF_PARAMS = 8;

export function init_object_arrays(AMOUNT_OF_OBJECTS)
{
  let prev = 0;
  OFFSET_INTO_ELEMENT[INDEX_OFFSET_INTO_VERTEX_INDEX] = prev;

  OFFSET_INTO_ELEMENT[INDEX_OFFSET_INTO_TEXTURE_INDEX] = add_int8_element(prev);
  prev = OFFSET_INTO_ELEMENT[INDEX_OFFSET_INTO_TEXTURE_INDEX];

  OFFSET_INTO_ELEMENT[INDEX_OFFSET_INTO_POSITION] = add_int8_element(prev);
  prev = OFFSET_INTO_ELEMENT[INDEX_OFFSET_INTO_POSITION];

  OFFSET_INTO_ELEMENT[INDEX_OFFSET_INTO_SCALE] = add_vector3_element(prev);
  prev = OFFSET_INTO_ELEMENT[INDEX_OFFSET_INTO_SCALE];

  OFFSET_INTO_ELEMENT[INDEX_OFFSET_INTO_ROTATION] = add_float32_element(prev);
  prev = OFFSET_INTO_ELEMENT[INDEX_OFFSET_INTO_ROTATION];

  OFFSET_INTO_ELEMENT[INDEX_OFFSET_INTO_HALF] = add_vector3_element(prev);
  prev = OFFSET_INTO_ELEMENT[INDEX_OFFSET_INTO_HALF];

  OFFSET_INTO_ELEMENT[INDEX_OFFSET_INTO_MATRIX] = add_vector3_element(prev);
  prev = OFFSET_INTO_ELEMENT[INDEX_OFFSET_INTO_MATRIX];

  OFFSET_INTO_ELEMENT[INDEX_OFFSET_INTO_DIRTY_BIT] = add_matrix_element(prev);
  prev = OFFSET_INTO_ELEMENT[INDEX_OFFSET_INTO_DIRTY_BIT];

  OFFSET_INTO_ELEMENT[INDEX_OFFSET_INTO_BRDF_PARAMS] = add_int8_element(prev);
  prev = OFFSET_INTO_ELEMENT[INDEX_OFFSET_INTO_BRDF_PARAMS];

  ALIGNMENT_BYTES_OF_OBJECT = helper.align(prev, ALIGHNMENT_NUMBER);

  object_array = new ArrayBuffer(ALIGNMENT_BYTES_OF_OBJECT * AMOUNT_OF_OBJECTS);
  transform_array = new Float32Array(object_array);
  index_array = new Int8Array(object_array);

  console.log("Last Index: " + index_array.length)
}

function get_float32_index(base_index, element_index)
{
  return (OFFSET_INTO_ELEMENT[element_index] + base_index) / 4;
}

function get_int8_index(base_index, element_index)
{
  return (OFFSET_INTO_ELEMENT[element_index] + base_index)
}

/* Object structure

* Render Info *
  int8    vertexIndex
  int8    textureIndex

  * Transform *
  vector3 position
  float32    scale
  vector3 rotation 

  * Collision *
  vector3 half

  * WORLD MATRIX *
  float32[16] world matrix 

  * Dirty Bit*
  int8 dirty_bit

  // TO DO : STORE EAHC ONE HERE??
  * BRDF Parameters *
  int8 BRDF param index  
*/

// TO DO: Optimize me can make this more contigous like in c++
export class gameObject
{
  ID;
  byte_index;
  transform_index;
  collision_index;
  BRDF_index;
  dirty_bit;
  matrix_index;

  // TO DO AUTOMATE INTIALIZATION FUNCT, FUNCTIONS TO CREATE NEW INT8 OBEJCT, VECTOIRE 3 ETC
  // These fubcs write how fat into to that index
  // then in constructor assighn that array by itslef or / 4 with antoher funciton
  // THIS ALSO EFFECTS ALIGHNMENT BYTES OF OBJECT
  // JUST HAVE CONSTANTS GOIGN FROM 0 to whatever acessing that index array mangaed for me


  // Takes input of what number object this is and initialses a new object 
  // With input informaiton.
  constructor(object_id, vertex_index, texture_index, position, scale, rotation, half, world_matrix, param_array_index)
  {
    // NOTE: Pos rot should be float32array
    // NOTE: Keep alighnment in mind

    // TO DO: Is adding to byte array done in parraleel for diff parts check
  
    let index = object_id * ALIGNMENT_BYTES_OF_OBJECT
  
    // TO DO: GENERALIZE!
    this.byte_index = index;
    this.transform_index = get_float32_index(index, INDEX_OFFSET_INTO_POSITION);
    this.collision_index = get_float32_index(index, INDEX_OFFSET_INTO_HALF);
    this.dirty_bit = get_int8_index(index, INDEX_OFFSET_INTO_DIRTY_BIT);
    this.BRDF_index = get_int8_index(index, INDEX_OFFSET_INTO_BRDF_PARAMS);
    this.ID = object_id;

    // Set vertexIndex
    this.set_int8(get_int8_index(index, INDEX_OFFSET_INTO_VERTEX_INDEX), vertex_index);
    
    console.log("set")
    console.log(this.get_model_index());

    // Set textureIndex
    this.set_int8(get_int8_index(index, INDEX_OFFSET_INTO_TEXTURE_INDEX), texture_index);

    // Set position
    this.set_vector3(get_float32_index(index, INDEX_OFFSET_INTO_POSITION), position);
    
    // Set scale
    this.set_float32(get_float32_index(index, INDEX_OFFSET_INTO_SCALE), scale);

    // Set rotation
    this.set_vector3(get_float32_index(index, INDEX_OFFSET_INTO_ROTATION), rotation);

    // Set half
    this.set_vector3(get_float32_index(index, INDEX_OFFSET_INTO_HALF), half);

    // Set Matrix
    this.set_matrix(get_float32_index(index, INDEX_OFFSET_INTO_MATRIX), world_matrix);

    // TO DO: order and pack ints correclty

    // Set Dirty Bit
    this.set_int8(get_int8_index(index, INDEX_OFFSET_INTO_DIRTY_BIT), 1);

    this.set_int8(get_int8_index(index, INDEX_OFFSET_INTO_BRDF_PARAMS), param_array_index);
  }

    // NOTE: Have a view for int8 to pass in.
    get_model_index()
    {
      if (!(index_array instanceof Int8Array)) {
        console.log("ERROR: Get model index wasnt given int8array");
        return -1;
      }

      return index_array[this.byte_index];
    }

    // NOTE: Have a view for int8 to pass in.
    get_texture_index()
    {
      if (!(index_array instanceof Int8Array)) {
        console.log("ERROR: Get texture index wasnt given int8array");
        return -1;
      }

      return index_array[this.byte_index + 1];
    }

    // NOTE: Have a view for int8 to pass in.
    set_model_index(data)
    {
      if (!(index_array instanceof Int8Array)) {
        console.log("ERROR: Set model index wasnt given int8array");
        return -1;
      }

      index_array[this.byte_index] = data
    }

    // NOTE: Have a view for int8 to pass in.
    set_texture_index(data)
    {
      if (!(index_array instanceof Int8Array)) {
        console.log("ERROR: Set texture index wasnt given int8array");
        return -1;
      }

      index_array[this.byte_index + 1] = data;
    }

     // NOTE: Have a view for float32 to pass in.
    get_position_into(pos)
    {

      if (!(transform_array instanceof Float32Array)) {
        console.log("ERROR: Get position wasnt given float32array");
        return -1;
      }

      const x = transform_array[this.transform_index]
      const y = transform_array[this.transform_index + 1]
      const z = transform_array[this.transform_index + 2]

      pos.set([x, y, z]);

      return 1;
    }

    // NOTE: Have a view for float32 to pass in.
    get_position()
    {
      if (!(transform_array instanceof Float32Array)) {
        console.log("ERROR: Get position wasnt given float32array");
        throw new Error("Something went wrong");
        return -1;
      }

      const x = transform_array[this.transform_index]
      const y = transform_array[this.transform_index + 1]
      const z = transform_array[this.transform_index + 2]

      return new Float32Array([x, y, z]);
    }

    // NOTE: Have a view for float32 to pass in.
    set_position(data)
    {
      if (!(transform_array instanceof Float32Array)) {
        console.log("ERROR: Set position wasnt given float32array");
        throw new Error("Something went wrong");
        return -1;
      }

      this.set_dirty_bit(1);

      return this.set_vector3(this.transform_index, data)
    }

    // NOTE: Have a view for float32 to pass in.
    get_scale()
    {
      if (!(transform_array instanceof Float32Array)) {
        console.log("ERROR: Get scale wasnt given float32array");
        throw new Error("Something went wrong");
        return -1;
      }

      return transform_array[this.transform_index + OFFSET_TRANSFROM_SCALE];
    }

    // NOTE: Have a view for float32 to pass in.
    set_scale(data)
    {
      if (!(transform_array instanceof Float32Array)) {
        console.log("ERROR: Set scale wasnt given float32array");
        return -1;
      }

      this.set_dirty_bit(1);

      transform_array[this.transform_index + OFFSET_TRANSFROM_SCALE] = data;
    }

    // NOTE: Have a view for float32 to pass in.
    get_rotation_into(rot)
    {
      if (!(transform_array instanceof Float32Array)) {
        console.log("ERROR: Get rotation wasnt given float32array");
        return -1;
      }

      const x = transform_array[this.transform_index + OFFSET_TRANSFROM_ROTATION]
      const y = transform_array[this.transform_index + OFFSET_TRANSFROM_ROTATION + 1]
      const z = transform_array[this.transform_index + OFFSET_TRANSFROM_ROTATION + 2]

      return rot.set([x, y, z]);
    }

    // NOTE: Have a view for float32 to pass in.
    get_rotation()
    {
      if (!(transform_array instanceof Float32Array)) {
        console.log("ERROR: Get rotation wasnt given float32array");
        return -1;
      }

      const x = transform_array[this.transform_index + OFFSET_TRANSFROM_ROTATION]
      const y = transform_array[this.transform_index + OFFSET_TRANSFROM_ROTATION + 1]
      const z = transform_array[this.transform_index + OFFSET_TRANSFROM_ROTATION + 2]

      return new Float32Array([x, y, z]);
    }

    // NOTE: Have a view for float32 to pass in.
    set_rotation(data)
    {
      if (!(transform_array instanceof Float32Array)) {
        console.log("ERROR: Set rotation wasnt given float32array");
        return -1;
      }

      this.set_dirty_bit(1);

      return this.set_vector3(this.transform_index + OFFSET_TRANSFROM_ROTATION, data)
    }

    get_world_matrix(World_Matrix, tmp_pos, tmp_rot)
    {
      if (index_array[this.dirty_bit] != 1)
      {
        this.get_matrix_into(World_Matrix);
        return World_Matrix;
      }
      else
      {   
        this.get_position_into(tmp_pos);
        let tmp_scale = this.get_scale();
        this.get_rotation_into(tmp_rot);

        this.set_dirty_bit(0);

        this.get_matrix_into(World_Matrix);

        // TO DO: Reuse memroy in that func
        let new_matrix = helper.get_world_matrix(tmp_pos[0], tmp_pos[1], tmp_pos[2], tmp_rot[0], tmp_rot[1], tmp_rot[2], tmp_scale);

        this.set_matrix(this.matrix_index, new_matrix);
        this.get_matrix_into(World_Matrix);

        return new_matrix;
      }
    }

    // NOTE: Have a view for float32 to pass in.
    get_half_into(halfs)
    {
      if (!(transform_array instanceof Float32Array)) {
        console.log("ERROR: Get half wasnt given float32array");
        return -1;
      }

      const x = transform_array[this.collision_index]
      const y = transform_array[this.collision_index + 1]
      const z = transform_array[this.collision_index + 2]

      return halfs.set([x, y, z]);
    }

    set_dirty_bit(data)
    {
      return index_array[this.dirty_bit] = data;
    }

    // NOTE: Have a view for float32 to pass in.
    get_half()
    {
      if (!(transform_array instanceof Float32Array)) {
        console.log("ERROR: Get half wasnt given float32array");
        return -1;
      }

      const x = transform_array[this.collision_index]
      const y = transform_array[this.collision_index + 1]
      const z = transform_array[this.collision_index + 2]

      return new Float32Array([x, y, z]);
    }

    // NOTE: Have a view for float32 to pass in.
    set_half(data)
    {
      if (!(transform_array instanceof Float32Array)) {
        console.log("ERROR: Set half wasnt given float32array");
        return -1;
      }

      helper.vector_abs_into(data);

      return this.set_vector3(this.collision_index, data)
    }

    get_min()
    {
      if (!(transform_array instanceof Float32Array)) {
        console.log("ERROR: Get min wasnt given float32array");
        return -1;
      }

      const halfs = this.get_half(transform_array);
      const pos = this.get_position(transform_array);

      return new Float32Array([pos[0] - halfs[0], pos[1] - halfs[1], pos[2] - halfs[2]]);
    }

    get_min_into(min_max)
    {
      if (!(transform_array instanceof Float32Array)) {
        console.log("ERROR: Get min wasnt given float32array");
        return -1;
      }

      const halfs = this.get_half(transform_array);
      const pos = this.get_position(transform_array);

      return min_max.set([pos[0] - halfs[0], pos[1] - halfs[1], pos[2] - halfs[2]]);
    }


    get_min_into_struct(min_max)
    {
      if (!(transform_array instanceof Float32Array)) {
        console.log("ERROR: Get min wasnt given float32array");
        return -1;
      }

      const halfs = this.get_half(transform_array);
      const pos = this.get_position(transform_array);

      return min_max.min.set([pos[0] - halfs[0], pos[1] - halfs[1], pos[2] - halfs[2]]);
    }

    get_max_into(min_max)
    {
      if (!(transform_array instanceof Float32Array)) {
        console.log("ERROR: Get min wasnt given float32array");
        return -1;
      }

      const halfs = this.get_half(transform_array);
      const pos = this.get_position(transform_array);

       return min_max.set([pos[0] + halfs[0], pos[1] + halfs[1], pos[2] + halfs[2]]);
    }

    get_max_into_struct(min_max)
    {
      if (!(transform_array instanceof Float32Array)) {
        console.log("ERROR: Get min wasnt given float32array");
        return -1;
      }

      const halfs = this.get_half(transform_array);
      const pos = this.get_position(transform_array);

       return min_max.max.set([pos[0] + halfs[0], pos[1] + halfs[1], pos[2] + halfs[2]]);
    }

    get_max()
    {
      if (!(transform_array instanceof Float32Array)) {
        console.log("ERROR: Get min wasnt given float32array");
        return -1;
      }

      const halfs = this.get_half(transform_array);
      const pos = this.get_position(transform_array);

      return new Float32Array([pos[0] + halfs[0], pos[1] + halfs[1], pos[2] + halfs[2]]);
    }

    update_collider_with_rot(tmp_min, tmp_max, tmp_pos, tmp_rot, current_rot)
    {
      // PLAN

     // Get max and min (have temp value for this use max min into)
      // Never mind only need one cuz symetrical
      this.get_max_into(tmp_max);

      // Rotate these points using javascript rotate function with this object rot
      
      //  // Subtract from pos to get back to orgin
      this.get_position_into(tmp_pos);

      console.log("Sub");
      const max_at_origin = helper.vector_subtract(tmp_max, tmp_pos);

      const vec4_max_at_origin = new Float32Array([max_at_origin[0], max_at_origin[1], max_at_origin[2], 1]);
      
      const inv_rot_matrix = helper.get_inv_rotation_matrix(current_rot[0], current_rot[1], current_rot[2]);
      const vec4_max_origin_no_rot = helper.multiply_matrix_and_point(inv_rot_matrix, vec4_max_at_origin);

      //  // Rotate 
      this.get_rotation_into(tmp_rot);

      console.log("tmp rot:" + tmp_rot);
      console.log("cur rot:" + current_rot);
     
      const rot_matrix = helper.get_rotation_matrix(tmp_rot[0], tmp_rot[1], tmp_rot[2]);

      const rotated_max = helper.multiply_matrix_and_point(rot_matrix, vec4_max_origin_no_rot);

      const f32_rotated_max = new Float32Array(rotated_max);
      // Set half for this object
      this.set_half(f32_rotated_max);

      // Temp hot key to trigger collider_box_vertex = make_vertexs(game_object_array); - done
      // This could be done during object creation if not loaded - done
      // DO DEBUG SELECTION RETURN AFTER - done
      // Soloution, on roation when Applying changes maube esc key. store orginal positions rot, scale
      // Undo original roation then apply new opne/. - done
      // Also trigger this with command in debug mode on selected object - done
      // Is Collider post scale? - yes need to fix
      // CHECK THIS ISNT OVERWRITTEN ON START UP AND IS SKIPPED ON LOAD.- done
      // Should save halfs anyway on laod - done
      // Button to enable collider view - done
      // Fix player collision and test - done
      // Wire frame remove depth new shader - done
      // DO LATER
      // If can be fucked just give it a matrix do pos/scale/rot
      // Also min and max can be flipped min: 12 max -2 if roated weird above might fix
      // or do full aabb recalc
    }

    get_matrix()
    {
      // TO DO: Magic number
      let Matrix = new Float32Array(16);

      for (let i = 0; i < 4; i++)
      {
        for (let j = 0; j < 4; j++)
        {
          Matrix[(i * 4) + j] = transform_array[this.matrix_index + (i * 4) + j];
        }
      }

      return Matrix
    }

    get_matrix_into(Matrix)
    {
      for (let i = 0; i < 4; i++)
      {
        for (let j = 0; j < 4; j++)
        {
          Matrix[(i * 4) + j] = transform_array[this.matrix_index + (i * 4) + j];
        }
      }
    }

    set_vector3(offset, data)
    {
      if (!(transform_array instanceof Float32Array)) {
        console.log("ERROR: Set vector3 wasnt given float32array");
        throw new Error("Something went wrong");
        return -1;
      }

      if (!(data instanceof Float32Array)) {
        console.log("ERROR: Set vector3 wasnt given data float32array");
        throw new Error("Something went wrong");
        return -1;
      }

      transform_array[offset] = data[0];
      transform_array[offset + 1] = data[1];
      transform_array[offset + 2] = data[2];

      return BYTES_OF_VECTOR3;
    }

    set_matrix(offset, data)
    {
      if (!(transform_array instanceof Float32Array)) {
        console.log("ERROR: Set vector3 wasnt given float32array");
        return -1;
      }

      if (!(data instanceof Float32Array)) {
        console.log("ERROR: Set vector3 wasnt given data float32array");
        return -1;
      }

      for (let i = 0; i < 4; i++)
      {
        for (let j = 0; j < 4; j++)
        {
          transform_array[offset + (i * 4) + j] = data[(i * 4) + j];
        }
      }

      return BYTES_OF_MATRIX;
    }

    set_float32( offset, data)
    {
      if (!(transform_array instanceof Float32Array)) {
        console.log("ERROR: Set Float32 wasnt given float32array");
        return -1;
      }

      transform_array[offset] = data;

      return BYTES_OF_FLOAT_32;
    }

    set_int8(offset, data)
    {
      if (!(index_array instanceof Int8Array)) {
        console.log("ERROR: Set setInt8 wasnt given Int8Array");
        return -1;
      }

      index_array[offset] = data;

      return BYTES_OF_FLOAT_32;
    }

    set_BRDF_params( offset, data)
    {
      if (!(transform_array instanceof Float32Array)) {
        console.log("ERROR: Set BRDF Params wasnt given float32array");
        return -1;
      }

      if (!(data instanceof Float32Array)) {
        console.log("ERROR: Set  BRDF Params  wasnt given data float32array");
        return -1;
      }

      let index = 0;

      // Set BRDF Params
      let base_index = 0;

     // ROUGHNESS
      index += set_float32( offset + base_index, param_array[base_index]);
      ++base_index;
      // ROUGHNESS_SQUARED
      index += set_float32( offset + base_index, param_array[base_index]);
      ++base_index;
      // SUBSURFACE
      index += set_float32( offset + base_index, param_array[base_index]);
      ++base_index;
      // ANISOTROPIC
      index += set_float32( offset + base_index, param_array[base_index]);
      ++base_index;
      // CLEARCOAT
      index += set_float32( offset + base_index, param_array[base_index]);
      ++base_index;
      // CLEARCOAT_GLOSS
      index += set_float32( offset + base_index, param_array[base_index]);
      ++base_index;
      // SPECULAR
      index += set_float32( offset + base_index, param_array[base_index]);
      ++base_index;
      // SPECULAR_TINT
      index += set_float32( offset + base_index, param_array[base_index]);
      ++base_index;
      // METALLIC
      index += set_float32( offset + base_index, param_array[base_index]);
      ++base_index;
      // SHEEN
      index += set_float32( offset + base_index, param_array[base_index]);
      ++base_index;
      // SHEEN_TINT
      index += set_float32( offset + base_index, param_array[base_index]);
      ++base_index;

      return index;
    }

    // NOTE: Have a view for int8 to pass in.
    get_BRDF_index()
    {
      if (!(index_array instanceof Int8Array)) {
        console.log("ERROR: Get BRDF index wasnt given int8array");
        return -1;
      }

      return index_array[this.BRDF_index];
    }
    
}