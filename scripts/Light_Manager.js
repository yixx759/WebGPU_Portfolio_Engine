import * as helper from './Helper_Funcs.js'
import * as objectInfo from './Object_Info_Struct.js';

const DEBUG = true;

const ALLIGHNMENT_NUMBER = 32

// This must match wgsl version
export const TOTAL_AMOUNT_OF_POINT_LIGHTS = 2;

export const SIZE_OF_POINT_LIGHT_BYTES = objectInfo.BYTES_OF_VECTOR3 + objectInfo.BYTES_OF_FLOAT_32 +  objectInfo.BYTES_OF_FLOAT_32;
const SIZE_OF_POINT_LIGHT_F32 = SIZE_OF_POINT_LIGHT_BYTES / objectInfo.BYTES_OF_FLOAT_32;

export const ALIGNED_SIZE_OF_POINT_LIGHT_BYTES = (SIZE_OF_POINT_LIGHT_BYTES  + ALLIGHNMENT_NUMBER - 1) & ~(ALLIGHNMENT_NUMBER - 1);
export const ALIGNED_SIZE_OF_POINT_LIGHT_F32 = ALIGNED_SIZE_OF_POINT_LIGHT_BYTES / objectInfo.BYTES_OF_FLOAT_32;

export let POINT_LIGHT_ARRAY = new Float32Array(ALIGNED_SIZE_OF_POINT_LIGHT_F32 * TOTAL_AMOUNT_OF_POINT_LIGHTS);

export let light_number = 0;
export let light_index = light_number * ALIGNED_SIZE_OF_POINT_LIGHT_F32;

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

const INVERSE_DENOM_CONST = 0.001;
const R_MAX = 300;

export function lambertian(N, L)
{
    return Math.max(helper.vector_dot(N, L), 0);
}

export function point_light_illuminate(light_pos, surface_pos, atten, intensity, normal, debug = false)
{
    // let light_ray = point_light_info[i].pos - fragData.wpos;
    const light_ray = helper.vector_subtract(light_pos, surface_pos);

    if (debug)
    {
        console.log("Light ray: " + light_ray);
    }
    
    // light_dir = normalize(light_ray);
    const light_dir = helper.vector_norm(light_ray);

    if (debug)
    {
        console.log("Light dir: " + light_dir);
    }

    // let distance = length(light_ray);
    const dist = helper.vector_mag(light_ray);

    if (debug)
    {
        console.log("dist: " + dist);
    }

    // // TO DO: This could be square auto
    // let inverse_square = (point_light_info[i].attenuation * point_light_info[i].attenuation) / ((distance * distance) + INVERSE_DENOM_CONST);
    const inverse_square = (atten * atten) / (dist * dist) + INVERSE_DENOM_CONST;

    if (debug)
    {
        console.log("inverse_square: " + inverse_square);
    }

    // let window_func = pow(max((1 - pow(point_light_info[i].attenuation / R_MAX, 4)), 0), 2);
    const window_func = Math.pow(Math.max((1 - Math.pow(atten / R_MAX, 4)), 0), 2);

     if (debug)
    {
        console.log("window_func: " + window_func);
    }

    // let final_atten = window_func * inverse_square;
    const final_atten = window_func * inverse_square;

    if (debug)
    {
        console.log("final_atten: " + final_atten);
    }

    
    if (debug)
    {
        console.log("light_dir: " + light_dir);
        console.log("normal: " + normal);
        console.log("dot: " + helper.vector_dot(normal, light_dir));
        console.log("lambert: " + lambertian(normal, light_dir));
    }

    // Lambert func

    // final_colour += vec4((burley_brdf_dir(light_info, light_dir).xyz * point_light_info[i].intensity * final_atten).xyz, 0); // Point
    
    return lambertian(normal, light_dir) * intensity * final_atten;
}

export function dir_light_illuminate(light_dir, normal, intensity)
{
    return lambertian(normal, light_dir) * intensity;
}