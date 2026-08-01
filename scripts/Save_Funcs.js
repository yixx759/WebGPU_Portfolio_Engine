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

export function save_file(amount_of_objects, game_object_array, sh_coeffs)
{
    let bit_buffer = new ArrayBuffer(
        SIZE_OF_OBJECT_NUMBER +
        SIZE_OF_END_PATTERN +
        SIZE_OF_COEFFS +
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
    }

    // TO DO: Player pos do later fix size of thing

    // Save SH

    // Can use save matrix for this x 3


    const blob = new Blob([bit_buffer], {
    type: "application/octet-stream"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "object.bin";
    a.click();
}



export function load_file()
{
    // Load Objects

    // Save SH
}