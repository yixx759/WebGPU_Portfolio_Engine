import * as objectInfo from './objectInfoStruct.js';

const DEBUG = true;

const ALLIGHNMENT_NUMBER = 32

// This must match wgsl version
export const TOTAL_AMOUNT_OF_POINT_LIGHTS = 2;

export const SIZE_OF_POINT_LIGHT_BYTES = objectInfo.BYTES_OF_VECTOR3 + objectInfo.BYTES_OF_FLOAT_32 +  objectInfo.BYTES_OF_FLOAT_32;
const SIZE_OF_POINT_LIGHT_F32 = SIZE_OF_POINT_LIGHT_BYTES / objectInfo.BYTES_OF_FLOAT_32;

export const ALIGNED_SIZE_OF_POINT_LIGHT_BYTES = (SIZE_OF_POINT_LIGHT_BYTES  + ALLIGHNMENT_NUMBER - 1) & ~(ALLIGHNMENT_NUMBER - 1);
const ALIGNED_SIZE_OF_POINT_LIGHT_F32 = ALIGNED_SIZE_OF_POINT_LIGHT_BYTES / objectInfo.BYTES_OF_FLOAT_32;

export let POINT_LIGHT_ARRAY = new Float32Array(ALIGNED_SIZE_OF_POINT_LIGHT_F32 * TOTAL_AMOUNT_OF_POINT_LIGHTS);

let light_number = 0;
let light_index = light_number * ALIGNED_SIZE_OF_POINT_LIGHT_F32;

export function add_new_light(pos_x, pos_y, pos_z, intensity, attenuation)
{
    if (light_number >= TOTAL_AMOUNT_OF_POINT_LIGHTS)
    {
        console.log("ERROR: TOO MANY LIGHTS")
    }

    POINT_LIGHT_ARRAY[light_index + 0] = pos_x;
    POINT_LIGHT_ARRAY[light_index + 1] = pos_y;
    POINT_LIGHT_ARRAY[light_index + 2] = pos_z;
    POINT_LIGHT_ARRAY[light_index + 3] = intensity;
    POINT_LIGHT_ARRAY[light_index + 4] = attenuation;

    ++light_number;

    if (DEBUG)
    {
        console.log("Added new light " + light_number + " in index: " + light_index);
    }

    light_index = light_number * ALIGNED_SIZE_OF_POINT_LIGHT_F32;
}