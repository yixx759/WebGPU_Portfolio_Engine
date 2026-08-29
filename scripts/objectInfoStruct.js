import * as helper from './helperFuncs.js';

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

const NUMBER_OF_BRDF_PARAMETERS = 11;

const OFFSET_TRANSFROM_POSITION = 0;
const OFFSET_TRANSFROM_SCALE = 3;
const OFFSET_TRANSFROM_ROTATION = 4;

const OFFSET_INTO_TRANSFROM_HALF = OFFSET_TRANSFROM_ROTATION + 3;

const OFFSET_INTO_TRANSFROM_MATRIX = OFFSET_INTO_TRANSFROM_HALF + 3;

const OFFSET_INTO_TRANSFROM_DIRTY_BIT = OFFSET_INTO_TRANSFROM_MATRIX + 9;

export const VERTEX_INDEX_CUBE = 0;
export const VERTEX_INDEX_BUNNY = 1;

export const BYTES_OF_RENDER_INFO = BYTES_OF_INT_8 * 2;
export const BYTES_OF_TRANSFORM = BYTES_OF_VECTOR3 + BYTES_OF_FLOAT_32 + BYTES_OF_VECTOR3;
export const BYTES_OF_COLLIDER = BYTES_OF_VECTOR3;
export const BYTES_OF_BRDF = BYTES_OF_INT_8;
export const BYTES_OF_DIRTY_BIT = BYTES_OF_INT_8;
export const BYTES_OF_WORLD_MATRIX = BYTES_OF_MATRIX;

const ALIGNMENT_BYTES_OF_RENDER_INFO = BYTES_OF_RENDER_INFO + (BYTES_OF_FLOAT_32 - BYTES_OF_RENDER_INFO);

// aligned = (used + block_size - 1) & ~(block_size - 1)
// Since it uses same data type it will be allighned
const ALIGNMENT_BYTES_OF_TRANSFORM = BYTES_OF_TRANSFORM;

const ALIGNMENT_BYTES_OF_COLLIDER = BYTES_OF_COLLIDER;

const ALIGNMENT_BYTES_OF_MATRIX = BYTES_OF_MATRIX;

const ALIGNMENT_BYTES_OF_DIRTY_BIT = BYTES_OF_DIRTY_BIT + (BYTES_OF_FLOAT_32 - BYTES_OF_DIRTY_BIT);

export const BYTES_OF_OBJECT = ALIGNMENT_BYTES_OF_RENDER_INFO + ALIGNMENT_BYTES_OF_TRANSFORM + ALIGNMENT_BYTES_OF_COLLIDER + BYTES_OF_BRDF + ALIGNMENT_BYTES_OF_MATRIX + ALIGNMENT_BYTES_OF_DIRTY_BIT;

const ALLIGHNMENT_NUMBER = 64
export const ALIGNMENT_BYTES_OF_OBJECT = (BYTES_OF_OBJECT + ALLIGHNMENT_NUMBER - 1) & ~(ALLIGHNMENT_NUMBER - 1);

export const SIZE_OF_BRDF_PARAMS_BYTES = 256; // 11 * objectInfo.BYTES_OF_FLOAT_32;

let objectArray;
let transformArray;
let indexArray;

export function init_object_arrays(AMOUNT_OF_OBJECTS)
{
  objectArray = new ArrayBuffer(ALIGNMENT_BYTES_OF_OBJECT * AMOUNT_OF_OBJECTS);
  transformArray = new Float32Array(objectArray);
  indexArray = new Int8Array(objectArray);
}

/* Object structure

* Render Info *
  int8    vertexIndex
  int8    textureIndex

  * Transform *
  vector3 position
  int8    scale
  vector3 rotation 

  * Collision *
  vector3 half

  * WORLD MATRIX *
  float32[16] world matrix 

  * Dirty Bit*
  int8 dirty_bit

  // TO DO : STORE EAHC ONE HERE??
  * BRDF Parameters *
  int8    BRDF param index  
*/

// TO DO: Optimize me can make this more contigous like in c++
export class gameObject
{
  ID;
  byteIndex;
  transformIndex;
  collisionIndex;
  BRDF_Index;
  Dirty_Bit;
  Matrix_Index;
 
  // Takes input of what number object this is and initialses a new object 
  // With input informaiton.
  constructor(objectID, vertexIndex, textureIndex, position, scale, rotation, half, world_matrix, param_array_index)
  {
    // NOTE: Pos rot should be float32array
    // NOTE: Keep alighnment in mind

    // TO DO: Is adding to byte array done in parraleel for diff parts check
  
    let index = objectID * ALIGNMENT_BYTES_OF_OBJECT
  
    // TO DO: GENERALIZE!
    this.byteIndex = index;
    this.transformIndex = (index + ALIGNMENT_BYTES_OF_RENDER_INFO) / 4;
    this.collisionIndex = (index + ALIGNMENT_BYTES_OF_RENDER_INFO + ALIGNMENT_BYTES_OF_TRANSFORM) / 4;
    this.Matrix_Index = (index + ALIGNMENT_BYTES_OF_RENDER_INFO + ALIGNMENT_BYTES_OF_TRANSFORM + ALIGNMENT_BYTES_OF_COLLIDER) / 4;
    this.BRDF_Index = (index + ALIGNMENT_BYTES_OF_RENDER_INFO + ALIGNMENT_BYTES_OF_TRANSFORM + ALIGNMENT_BYTES_OF_COLLIDER + ALIGNMENT_BYTES_OF_MATRIX + ALIGNMENT_BYTES_OF_DIRTY_BIT) / 4;
    this.Dirty_Bit = (index + ALIGNMENT_BYTES_OF_RENDER_INFO + ALIGNMENT_BYTES_OF_TRANSFORM + ALIGNMENT_BYTES_OF_COLLIDER + ALIGNMENT_BYTES_OF_MATRIX);
    this.ID = objectID;

    const renderInfoView = new Uint8Array(objectArray, index);
    
    // Set vertexIndex
    renderInfoView[0] = vertexIndex;

    console.log("set")
    console.log(renderInfoView[0])

    // Set textureIndex
    renderInfoView[1] = textureIndex;

    // Offset into Transform
    index += ALIGNMENT_BYTES_OF_RENDER_INFO;
    const base_index = index / BYTES_OF_FLOAT_32;
    
    // Set position
    index += this.setVector3(base_index + OFFSET_TRANSFROM_POSITION, position);
    
    // Set scale
    transformArray[base_index + OFFSET_TRANSFROM_SCALE] = scale;
    index += BYTES_OF_FLOAT_32;

    // Set rotation
    index += this.setVector3(base_index + OFFSET_TRANSFROM_ROTATION, rotation);

    // Set half
    index += this.setVector3(base_index + OFFSET_INTO_TRANSFROM_HALF, half);

    // Set Matrix
    index += this.setMatrix(base_index + OFFSET_INTO_TRANSFROM_MATRIX, world_matrix);

    // TO DO: order and pack ints correclty

    // Set Dirty Bit
    index += this.setInt8(index, 1);

    index += this.setInt8(index, param_array_index);
  }

    // NOTE: Have a view for int8 to pass in.
    getModelIndex()
    {
      if (!(indexArray instanceof Int8Array)) {
        console.log("ERROR: Get model index wasnt given int8array");
        return -1;
      }

      return indexArray[this.byteIndex];
    }

    // NOTE: Have a view for int8 to pass in.
    getTextureIndex()
    {
      if (!(indexArray instanceof Int8Array)) {
        console.log("ERROR: Get texture index wasnt given int8array");
        return -1;
      }

      return indexArray[this.byteIndex + 1];
    }

    // NOTE: Have a view for int8 to pass in.
    setModelIndex(data)
    {
      if (!(indexArray instanceof Int8Array)) {
        console.log("ERROR: Set model index wasnt given int8array");
        return -1;
      }

      indexArray[this.byteIndex] = data
    }

    // NOTE: Have a view for int8 to pass in.
    setTextureIndex(data)
    {
      if (!(indexArray instanceof Int8Array)) {
        console.log("ERROR: Set texture index wasnt given int8array");
        return -1;
      }

      indexArray[this.byteIndex + 1] = data;
    }

     // NOTE: Have a view for float32 to pass in.
    getPosition_Into(pos)
    {

      if (!(transformArray instanceof Float32Array)) {
        console.log("ERROR: Get position wasnt given float32array");
        return -1;
      }

      const x = transformArray[this.transformIndex]
      const y = transformArray[this.transformIndex + 1]
      const z = transformArray[this.transformIndex + 2]

      pos.set([x, y, z]);

      return 1;
    }

    // NOTE: Have a view for float32 to pass in.
    getPosition()
    {
      if (!(transformArray instanceof Float32Array)) {
        console.log("ERROR: Get position wasnt given float32array");
        throw new Error("Something went wrong");
        return -1;
      }

      const x = transformArray[this.transformIndex]
      const y = transformArray[this.transformIndex + 1]
      const z = transformArray[this.transformIndex + 2]

      return new Float32Array([x, y, z]);
    }

    // NOTE: Have a view for float32 to pass in.
    setPosition(data)
    {
      if (!(transformArray instanceof Float32Array)) {
        console.log("ERROR: Set position wasnt given float32array");
        throw new Error("Something went wrong");
        return -1;
      }

      this.set_Dirty_Bit(1);

      return this.setVector3(this.transformIndex, data)
    }

    // NOTE: Have a view for float32 to pass in.
    getScale()
    {
      if (!(transformArray instanceof Float32Array)) {
        console.log("ERROR: Get scale wasnt given float32array");
        throw new Error("Something went wrong");
        return -1;
      }

      return transformArray[this.transformIndex + OFFSET_TRANSFROM_SCALE];
    }

    // NOTE: Have a view for float32 to pass in.
    setScale(data)
    {
      if (!(transformArray instanceof Float32Array)) {
        console.log("ERROR: Set scale wasnt given float32array");
        return -1;
      }

      this.set_Dirty_Bit(1);

      transformArray[this.transformIndex + OFFSET_TRANSFROM_SCALE] = data;
    }

    // NOTE: Have a view for float32 to pass in.
    getRotation_Into(rot)
    {
      if (!(transformArray instanceof Float32Array)) {
        console.log("ERROR: Get rotation wasnt given float32array");
        return -1;
      }

      const x = transformArray[this.transformIndex + OFFSET_TRANSFROM_ROTATION]
      const y = transformArray[this.transformIndex + OFFSET_TRANSFROM_ROTATION + 1]
      const z = transformArray[this.transformIndex + OFFSET_TRANSFROM_ROTATION + 2]

      return rot.set([x, y, z]);
    }

    // NOTE: Have a view for float32 to pass in.
    getRotation()
    {
      if (!(transformArray instanceof Float32Array)) {
        console.log("ERROR: Get rotation wasnt given float32array");
        return -1;
      }

      const x = transformArray[this.transformIndex + OFFSET_TRANSFROM_ROTATION]
      const y = transformArray[this.transformIndex + OFFSET_TRANSFROM_ROTATION + 1]
      const z = transformArray[this.transformIndex + OFFSET_TRANSFROM_ROTATION + 2]

      return new Float32Array([x, y, z]);
    }

    // NOTE: Have a view for float32 to pass in.
    setRotation(data)
    {
      if (!(transformArray instanceof Float32Array)) {
        console.log("ERROR: Set rotation wasnt given float32array");
        return -1;
      }

      this.set_Dirty_Bit(1);

      return this.setVector3(this.transformIndex + OFFSET_TRANSFROM_ROTATION, data)
    }

    get_world_matrix(World_Matrix, tmp_pos, tmp_rot)
    {
      if (indexArray[this.Dirty_Bit] != 1)
      {
        this.getMatrixInto(World_Matrix);
        return World_Matrix;
      }
      else
      {   
        this.getPosition_Into(tmp_pos);
        let tmp_scale = this.getScale();
        this.getRotation_Into(tmp_rot);

        this.set_Dirty_Bit(0);

        this.getMatrixInto(World_Matrix);

       // TO DO: Reuse memroy in that func
       let new_matrix = helper.getWorldMatrix(tmp_pos[0], tmp_pos[1], tmp_pos[2], tmp_rot[0], tmp_rot[1], tmp_rot[2], tmp_scale);

        this.setMatrix(this.Matrix_Index, new_matrix);
        this.getMatrixInto(World_Matrix);

        return new_matrix;
      }
    }

    // NOTE: Have a view for float32 to pass in.
    getHalf_Into(halfs)
    {
      if (!(transformArray instanceof Float32Array)) {
        console.log("ERROR: Get half wasnt given float32array");
        return -1;
      }

      const x = transformArray[this.collisionIndex]
      const y = transformArray[this.collisionIndex + 1]
      const z = transformArray[this.collisionIndex + 2]

      return halfs.set([x, y, z]);
    }

    set_Dirty_Bit(data)
    {
      return indexArray[this.Dirty_Bit] = data;
    }

    // NOTE: Have a view for float32 to pass in.
    getHalf()
    {
      if (!(transformArray instanceof Float32Array)) {
        console.log("ERROR: Get half wasnt given float32array");
        return -1;
      }

      const x = transformArray[this.collisionIndex]
      const y = transformArray[this.collisionIndex + 1]
      const z = transformArray[this.collisionIndex + 2]

      return new Float32Array([x, y, z]);
    }

    // NOTE: Have a view for float32 to pass in.
    setHalf(data)
    {
      if (!(transformArray instanceof Float32Array)) {
        console.log("ERROR: Set half wasnt given float32array");
        return -1;
      }

      helper.vector_abs_into(data);

      return this.setVector3(this.collisionIndex, data)
    }

    get_min()
    {
      if (!(transformArray instanceof Float32Array)) {
        console.log("ERROR: Get min wasnt given float32array");
        return -1;
      }

      const halfs = this.getHalf(transformArray);
      const pos = this.getPosition(transformArray);

      return new Float32Array([pos[0] - halfs[0], pos[1] - halfs[1], pos[2] - halfs[2]]);
    }

    get_min_Into(min_max)
    {
      if (!(transformArray instanceof Float32Array)) {
        console.log("ERROR: Get min wasnt given float32array");
        return -1;
      }

      const halfs = this.getHalf(transformArray);
      const pos = this.getPosition(transformArray);

      return min_max.set([pos[0] - halfs[0], pos[1] - halfs[1], pos[2] - halfs[2]]);
    }


    get_min_Into_Struct(min_max)
    {
      if (!(transformArray instanceof Float32Array)) {
        console.log("ERROR: Get min wasnt given float32array");
        return -1;
      }

      const halfs = this.getHalf(transformArray);
      const pos = this.getPosition(transformArray);

      return min_max.min.set([pos[0] - halfs[0], pos[1] - halfs[1], pos[2] - halfs[2]]);
    }

    get_max_Into(min_max)
    {
      if (!(transformArray instanceof Float32Array)) {
        console.log("ERROR: Get min wasnt given float32array");
        return -1;
      }

      const halfs = this.getHalf(transformArray);
      const pos = this.getPosition(transformArray);

       return min_max.set([pos[0] + halfs[0], pos[1] + halfs[1], pos[2] + halfs[2]]);
    }

    get_max_Into_Struct(min_max)
    {
      if (!(transformArray instanceof Float32Array)) {
        console.log("ERROR: Get min wasnt given float32array");
        return -1;
      }

      const halfs = this.getHalf(transformArray);
      const pos = this.getPosition(transformArray);

       return min_max.max.set([pos[0] + halfs[0], pos[1] + halfs[1], pos[2] + halfs[2]]);
    }

    get_max()
    {
      if (!(transformArray instanceof Float32Array)) {
        console.log("ERROR: Get min wasnt given float32array");
        return -1;
      }

      const halfs = this.getHalf(transformArray);
      const pos = this.getPosition(transformArray);

      return new Float32Array([pos[0] + halfs[0], pos[1] + halfs[1], pos[2] + halfs[2]]);
    }

    update_collider_with_rot(tmp_min, tmp_max, tmp_pos, tmp_rot, current_rot)
    {
      // PLAN

     // Get max and min (have temp value for this use max min into)
      // Never mind only need one cuz symetrical
      this.get_max_Into(tmp_max);

      // Rotate these points using javascript rotate function with this object rot
      
      //  // Subtract from pos to get back to orgin
      this.getPosition_Into(tmp_pos);

      console.log("Sub");
      const max_at_origin = helper.vectorSubtract(tmp_max, tmp_pos);

      const vec4_max_at_origin = new Float32Array([max_at_origin[0], max_at_origin[1], max_at_origin[2], 1]);
      
      const inv_rot_matrix = helper.get_inv_rotation_matrix(current_rot[0], current_rot[1], current_rot[2]);
      const vec4_max_origin_no_rot = helper.multiply_matrix_and_point(inv_rot_matrix, vec4_max_at_origin);

      //  // Rotate 
      this.getRotation_Into(tmp_rot);

      console.log("tmp rot:" + tmp_rot);
      console.log("cur rot:" + current_rot);
     
      const rot_matrix = helper.get_rotation_matrix(tmp_rot[0], tmp_rot[1], tmp_rot[2]);

      const rotated_max = helper.multiply_matrix_and_point(rot_matrix, vec4_max_origin_no_rot);

      const f32_rotated_max = new Float32Array(rotated_max);
      // Set half for this object
      this.setHalf(f32_rotated_max);

      // Temp hot key to trigger collider_box_vertex = make_vertexs(gameObjectArray); - done
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

    getMatrix()
    {
      // TO DO: Magic number
      let Matrix = new Float32Array(16);

      for (let i = 0; i < 4; i++)
      {
        for (let j = 0; j < 4; j++)
        {
          Matrix[(i * 4) + j] = transformArray[this.Matrix_Index + (i * 4) + j];
        }
      }

      return Matrix
    }

    getMatrixInto(Matrix)
    {
      for (let i = 0; i < 4; i++)
      {
        for (let j = 0; j < 4; j++)
        {
          Matrix[(i * 4) + j] = transformArray[this.Matrix_Index + (i * 4) + j];
        }
      }
    }

    setVector3(offset, data)
    {
      if (!(transformArray instanceof Float32Array)) {
        console.log("ERROR: Set vector3 wasnt given float32array");
        throw new Error("Something went wrong");
        return -1;
      }

      if (!(data instanceof Float32Array)) {
        console.log("ERROR: Set vector3 wasnt given data float32array");
        throw new Error("Something went wrong");
        return -1;
      }

      transformArray[offset] = data[0];
      transformArray[offset + 1] = data[1];
      transformArray[offset + 2] = data[2];

      return BYTES_OF_VECTOR3;
    }

    setMatrix(offset, data)
    {
      if (!(transformArray instanceof Float32Array)) {
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
          transformArray[offset + (i * 4) + j] = data[(i * 4) + j];
        }
      }

      return BYTES_OF_MATRIX;
    }

    setFloat32( offset, data)
    {
      if (!(transformArray instanceof Float32Array)) {
        console.log("ERROR: Set Float32 wasnt given float32array");
        return -1;
      }

      transformArray[offset] = data;

      return BYTES_OF_FLOAT_32;
    }

    setInt8(offset, data)
    {
      if (!(indexArray instanceof Int8Array)) {
        console.log("ERROR: Set setInt8 wasnt given Int8Array");
        return -1;
      }

      indexArray[offset] = data;

      return ALIGNMENT_BYTES_OF_DIRTY_BIT;
    }

    set_BRDF_Params( offset, data)
    {
      if (!(transformArray instanceof Float32Array)) {
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
      index += setFloat32( offset + base_index, param_array[base_index]);
      ++base_index;
      // ROUGHNESS_SQUARED
      index += setFloat32( offset + base_index, param_array[base_index]);
      ++base_index;
      // SUBSURFACE
      index += setFloat32( offset + base_index, param_array[base_index]);
      ++base_index;
      // ANISOTROPIC
      index += setFloat32( offset + base_index, param_array[base_index]);
      ++base_index;
      // CLEARCOAT
      index += setFloat32( offset + base_index, param_array[base_index]);
      ++base_index;
      // CLEARCOAT_GLOSS
      index += setFloat32( offset + base_index, param_array[base_index]);
      ++base_index;
      // SPECULAR
      index += setFloat32( offset + base_index, param_array[base_index]);
      ++base_index;
      // SPECULAR_TINT
      index += setFloat32( offset + base_index, param_array[base_index]);
      ++base_index;
      // METALLIC
      index += setFloat32( offset + base_index, param_array[base_index]);
      ++base_index;
      // SHEEN
      index += setFloat32( offset + base_index, param_array[base_index]);
      ++base_index;
      // SHEEN_TINT
      index += setFloat32( offset + base_index, param_array[base_index]);
      ++base_index;

      return index;
    }

    // NOTE: Have a view for int8 to pass in.
    getBRDFIndex()
    {
      if (!(indexArray instanceof Int8Array)) {
        console.log("ERROR: Get BRDF index wasnt given int8array");
        return -1;
      }

      return indexArray[this.BRDF_Index];
    }
    
}