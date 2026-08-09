import * as objectInfo from './objectInfoStruct.js'

const SIZE_OF_OBJECT_NUMBER = objectInfo.BYTES_OF_INT_8;
const SIZE_OF_END_PATTERN = objectInfo.BYTES_OF_INT_8;
const SIZE_OF_COEFFS = 16 * 3 * objectInfo.BYTES_OF_FLOAT_32;

function add_int8(value, view, offset)
{
    view.setInt8(offset, value);

    return objectInfo.BYTES_OF_INT_8;
}

function add_float32(value, view, offset)
{
    view.setFloat32(offset, value);

    return objectInfo.BYTES_OF_FLOAT_32;
}

function add_vector3(values, view, offset)
{
    for (let i = 0; i < 3; i++)
    {
        view.setFloat32(offset + i * objectInfo.BYTES_OF_FLOAT_32, values[i]);
    }

    return objectInfo.BYTES_OF_VECTOR3;
}

function add_matrix(values, view, offset)
{

    for (let i = 0; i < 16; i++)
    {
        view.setFloat32(offset + i * objectInfo.BYTES_OF_FLOAT_32, values[i]);
    }

    return objectInfo.BYTES_OF_MATRIX;
}

function add_sh_matrix(values, view, offset)
{

    for (let i = 0; i < 16 * 3; i++)
    {
        view.setFloat32(offset + i * objectInfo.BYTES_OF_FLOAT_32, values[i]);
    }

    return objectInfo.BYTES_OF_MATRIX * 3;
}

function load_int8(view, offset)
{
    // Use get
    let value = view.getInt8(offset, false);

    return value;
}

function load_float32(view, offset)
{
    let value = view.getFloat32(offset, false);

    return value;
}

function load_vector3_into(array, view, offset)
{

    for (let i = 0; i < 3; i++)
    {
        array[i] = view.getFloat32(offset + i * objectInfo.BYTES_OF_FLOAT_32, false);
    }

    return array;
}

function load_matrix_into(matrix, view, offset)
{

    for (let i = 0; i < 16; i++)
    {
        matrix[i] = view.getFloat32(offset + i * objectInfo.BYTES_OF_FLOAT_32, false);
    }

    return matrix;
}

function load_sh_matrix_into(matrix, view, offset)
{
    console.log("into");

    for (let i = 0; i < 16 * 3; i++)
    {
        console.log(i);
        console.log(offset + i * objectInfo.BYTES_OF_FLOAT_32);
        console.log(view.getFloat32(offset + i * objectInfo.BYTES_OF_FLOAT_32, false));
        matrix[i] = view.getFloat32(offset + i * objectInfo.BYTES_OF_FLOAT_32, false);
    }

    return matrix;
}

export async function save_file(amount_of_objects, game_object_array, player_pos, sh_coeffs)
{
    let bit_buffer = new ArrayBuffer(
        SIZE_OF_OBJECT_NUMBER +
        SIZE_OF_COEFFS +
        objectInfo.BYTES_OF_VECTOR3 +
        objectInfo.ALIGNMENT_BYTES_OF_OBJECT * amount_of_objects
    );

    let view = new DataView(bit_buffer);

    // Save Objects
    if (amount_of_objects > 255) {
        console.log("ERROR: amount_of_objectsn wasnt given int");
        return -1;
    }

    let offset = 0;

    offset += add_int8(amount_of_objects, view, offset);

    
    console.log("before load object: ");
    console.log(offset);

    let tmp_go;

    for (let i = 0; i < amount_of_objects; i++)
    {
        tmp_go = game_object_array[i];

        // OBJECT_ID is implied by the order

        // OBJECT_MODEL_INDEX
        offset += add_int8(tmp_go.getModelIndex(), view, offset);

        // OBJECT_TEXTURE_INDEX
        offset += add_int8(tmp_go.getTextureIndex(), view, offset);

        // OBJECT_START_POSITION
        offset += add_vector3(tmp_go.getPosition(), view, offset);

        // OBJECT_START_SCALE
        offset += add_float32(tmp_go.getScale(), view, offset);

        // OBJECT_START_ROTATION
        offset += add_vector3(tmp_go.getRotation(), view, offset);

        // OBJECT_HALF
        offset += add_vector3(tmp_go.getHalf(), view, offset);

        // OBJECT_WORLD_MATRIX
        offset += add_matrix(tmp_go.getMatrix(), view, offset);

        // OBJECT_BRDF_INDEX
        offset += add_int8(tmp_go.getBRDFIndex(), view, offset);
        console.log("offset during: ");
    console.log(offset);
    }

    
    console.log("offset: ");
    console.log(offset);
    // TO DO: Player pos do later fix size of thing
    offset += add_vector3(player_pos, view, offset);
    console.log("Player pos saved at: ");
    console.log(player_pos);

    // TO DO: Split into own file as probes could be varibale number
    // TO DO: Probe in editor mode
    // Save SH

    console.log("saved");
    console.log(sh_coeffs);
    offset += add_sh_matrix(sh_coeffs, view, offset);
    
    // Can use save matrix for this x 3

    const handle = await window.showSaveFilePicker({
    suggestedName: "object.bin",
    types: [{
      description: "Binary file",
      accept: { "application/octet-stream": [".bin"] }
    }]
  });

  const writable = await handle.createWritable();
   await writable.write(bit_buffer);
   await writable.close();


    // const blob = new Blob([bit_buffer], {
    // type: "application/octet-stream"
    // });

    // const url = URL.createObjectURL(blob);

    // const a = document.createElement("a");
    // a.href = url;
    // a.download = "object.bin";
    // a.click();
}

export async function load_file(game_object_array, cam_pos, coeffs)
{
    const response = await fetch("resources/saves/object.bin");
    const buffer = await response.arrayBuffer();
    const view = new DataView(buffer);

    let offset = 0;

    // Load how many objects
    const amount_of_objects = load_int8(view, offset);
    console.log("Amount: " + amount_of_objects);
    offset += objectInfo.BYTES_OF_INT_8;

    console.log("before load object: ");
    console.log(offset);
    // Load Objects
    offset = load_objects(amount_of_objects, game_object_array, offset, view);

    // Load Player Position
    offset = load_player(cam_pos, offset, view);

    offset = load_sh(coeffs, offset, view);
    console.log("Coeff");
    console.log(coeffs);


    // Load functions reverse of save functions
    // appen to game object array
    // later take in SH and Player split into funcs
}

function load_sh(coeffs, offset, view)
{
    load_sh_matrix_into(coeffs, view, offset);
    offset += objectInfo.BYTES_OF_MATRIX * 3;

    return offset;
}

function load_player(cam_pos, offset, view)
{
    load_vector3_into(cam_pos, view, offset);
    offset += objectInfo.BYTES_OF_VECTOR3;

    return  offset;
}

function load_objects(amount_of_objects, game_object_array, offset, view)
{
     // return offset

     let tmp_pos = new Float32Array(3);
     let tmp_rot = new Float32Array(3);
     let tmp_half = new Float32Array(3);
     let tmp_mat = new Float32Array(16);

     for (let i = 0; i < amount_of_objects; i++)
     {  
        // OBJECT_ID is implied by the order

        // OBJECT_MODEL_INDEX
        let model_index = load_int8(view, offset);
        offset += objectInfo.BYTES_OF_INT_8;
        console.log("Model: " + model_index);

        // OBJECT_TEXTURE_INDEX
        let texture_index = load_int8(view, offset);
        offset += objectInfo.BYTES_OF_INT_8;
        console.log("texture_index: " + texture_index);
        // OBJECT_START_POSITION
        load_vector3_into(tmp_pos, view, offset);
        offset += objectInfo.BYTES_OF_VECTOR3;
        console.log("tmp_pos: " + tmp_pos);

        // OBJECT_START_SCALE
        let scale = load_float32(view, offset);
        offset += objectInfo.BYTES_OF_FLOAT_32;
        console.log("scale: " + scale);

        // OBJECT_START_ROTATION
        load_vector3_into(tmp_rot, view, offset);
        offset += objectInfo.BYTES_OF_VECTOR3;
        console.log("tmp_rot: " + tmp_rot);

        // OBJECT_HALF
        load_vector3_into(tmp_half, view, offset);
        offset += objectInfo.BYTES_OF_VECTOR3;
        console.log("tmp_half: " + tmp_half);

        // OBJECT_WORLD_MATRIX
        load_matrix_into(tmp_mat, view, offset);
        offset += objectInfo.BYTES_OF_MATRIX;
        console.log("tmp_mat: " + tmp_mat);

        // OBJECT_BRDF_INDEX
        let brdf = load_int8(view, offset);
        offset += objectInfo.BYTES_OF_INT_8;
        console.log("brdf: " + brdf);

        let tmp_obj = new objectInfo.gameObject(i, model_index, texture_index, tmp_pos, scale, tmp_rot, tmp_half, tmp_mat, brdf);

        game_object_array.push(tmp_obj);
    }
     
    return offset;
}