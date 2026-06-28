import * as helper from './helperFuncs.js'
import * as light_manager from './Light_Manager.js'

// Use the vertex buffer skip normals uvs and shit only do positions.

const OFFSET_INT_VT_INDEX = 3;
const OFFSET_INT_VN_INDEX = 5;

const MAX_DEPTH = 1;
const MAX_SAMPLES_PER_BOUNCE = 1000; // 128;
const MAX_SAMPLES_AROUND_SPHERE = 1; // 128;

// final_res = [true, u, v, t]
const CONST_RESULT_STRUCT_RESULT_INDEX = 0;
const CONST_RESULT_STRUCT_U_INDEX = 1;
const CONST_RESULT_STRUCT_V_INDEX = 2;
const CONST_RESULT_STRUCT_T_INDEX = 3;

//   return [final_res, nu_origin, nu_dir, final_colour, final_norm];
const INDEX_RES_INTERSECT_INFO = 0;
const INDEX_RES_NU_ORIGIN = 1;
const INDEX_RES_NU_DIR = 2;
const INDEX_RES_COLOUR = 3;
const INDEX_RES_NORM = 4;
const INDEX_RES_VERTEX_INDEX = 5;
const INDEX_RES_OBJECT_INDEX = 6;

export function PATH_TRACE(origin, dir, objects, transformArray, objectArray, models, texture_data, directional_array)
{
    // samples around sphere to fill out
    // recursive until depth
    // each hit samples how many times
    // Do direct light then start recurse

    // Do Lighting from normal just lambertian with lighitng.

    let indirect_lighting = null;

    // TO DO: CHANGE MEEEE
    for (let i = 0; i < 1; i++)
    {
        const dir_from_sphere = random_sample_sphere();
        const res = path_trace_ray(origin, dir_from_sphere, objects, transformArray, objectArray, models, texture_data);
        // Once hit new place dont do direct
        // send new locaiton and new smaple dir to indierct

        if (res != null)
        {
            const nu_origin = res[INDEX_RES_NU_ORIGIN];
            const nu_normal = res[INDEX_RES_NORM];

            for (let j = 0; j < MAX_SAMPLES_PER_BOUNCE; j++)
            {
                const r1 = Math.random();
                const sample_on_hemisphere = random_sample_hemi_sphere(nu_normal, r1);
                indirect_lighting = indirect(nu_normal, 0, nu_origin, sample_on_hemisphere, objects, transformArray, objectArray, models, texture_data, directional_array);
            
                if (indirect_lighting[0] === helper.ZEROS[0] && 
                    indirect_lighting[1] === helper.ZEROS[1] &&
                    indirect_lighting[2] === helper.ZEROS[2])
                {
                    console.log(indirect_lighting);
                    break;
                }
            }
        }

        // TOTAL ME

    }

    console.log(indirect_lighting);

    // devide me
    return indirect_lighting;

    // do first ray but skip any results
    // Do thins until depth
    // Average this out
    // Check resulting color try green

    // Then store this as spherical harmioc
}

export function direct_light(origin, dir, objects, transformArray, objectArray, models, texture_data, directional_array)
{
    // get colour
    const res = path_trace_ray(origin, dir, objects, transformArray, objectArray, models, texture_data);

    // Change to background colour
    if (res === null || res[INDEX_RES_INTERSECT_INFO][CONST_RESULT_STRUCT_RESULT_INDEX] == false) {return [helper.ZEROS, null, null]};

    const colour_from_ray = res[INDEX_RES_COLOUR];
    const norm_from_ray = res[INDEX_RES_NORM];

    // Rember the dir array first 3 items are the dir 
    // get mult by lambertian

    // TO DO: DOSE THISE NEED /PI
    let direct_lighting = helper.vector_mult_scalar(colour_from_ray, light_manager.dir_light_illuminate(directional_array, norm_from_ray, directional_array[3]));
   
    // direct_lighting = helper.vector_mult_scalar(direct_lighting, 1/Math.PI);

    for (let i = 0; i < light_manager.light_number; i++)
    {
        const index = i*light_manager.ALIGNED_SIZE_OF_POINT_LIGHT_F32;
        const light_point = [light_manager.POINT_LIGHT_ARRAY[index], light_manager.POINT_LIGHT_ARRAY[index + 1], light_manager.POINT_LIGHT_ARRAY[index + 2]];
        const intensity = light_manager.POINT_LIGHT_ARRAY[index + 3];
        const atten = light_manager.POINT_LIGHT_ARRAY[index + 4];

        // mult by me
        // TO DO: const indexes

        // Vector from hit origin in direciton of light
        // cpompared with length of vector from hit origin to actual light
        // If longer to hit light then thesrse somehting between light and origin

        const to_light = helper.vectorSubtract(light_point, res[INDEX_RES_NU_ORIGIN]); 
        const length_to_light = helper.vector_mag(to_light);  
        const dir_to_light = helper.vectorNorm(to_light);  
      
        const vis = vis_check(res[INDEX_RES_NU_ORIGIN], dir_to_light, objects, transformArray, objectArray, models, texture_data, res[INDEX_RES_VERTEX_INDEX], res[INDEX_RES_OBJECT_INDEX]) > length_to_light ? 1 : 0;
        //const vis = vis_check(TEST_ORIGIN, TEST_DIR, objects, transformArray, objectArray, models, texture_data, res[INDEX_RES_VERTEX_INDEX], res[INDEX_RES_OBJECT_INDEX]) > length_to_light ? 1 : 0;
    
        // console.log("Spot Lighitng Col: " + colour_from_ray);
         // console.log("spot lighitng pos: " + light_point);
        // console.log("spot lighitng hit pos: " + res[INDEX_RES_NU_ORIGIN]);
        // console.log("spot lighitng vis check length to collide: " + vis_check(res[INDEX_RES_NU_ORIGIN], dir_to_light, objects, transformArray, objectArray, models, texture_data, res[INDEX_RES_VERTEX_INDEX], res[INDEX_RES_OBJECT_INDEX]));
        // console.log("spot lighitng length to light: " + length_to_light);
        // console.log("spot lighitng illumination: " + light_manager.point_light_illuminate(light_point, res[INDEX_RES_NU_ORIGIN], atten, intensity, norm_from_ray));

        direct_lighting = helper.vectorAdd(direct_lighting, helper.vector_mult_scalar(helper.vector_mult_scalar(colour_from_ray, light_manager.point_light_illuminate(light_point, res[INDEX_RES_NU_ORIGIN], atten, intensity, norm_from_ray)), vis));
        
        
        console.log("Vis: " + vis); 

       if (i == 0 && vis == 0)
       {
            console.log("HIT NO LIGHT");
            console.log("Vis: " + vis);
            console.log("Mult: " + light_manager.point_light_illuminate(light_point, res[INDEX_RES_NU_ORIGIN], atten, intensity, norm_from_ray));
            console.log("nu origin : " + res[INDEX_RES_NU_ORIGIN]);
            console.log("dir light : " + dir_to_light);
            console.log("light_point : " + light_point);
            console.log("lenght : " + length_to_light);
            console.log("lenght to collide : " + vis_check(res[INDEX_RES_NU_ORIGIN], dir_to_light, objects, transformArray, objectArray, models, texture_data, res[INDEX_RES_VERTEX_INDEX], res[INDEX_RES_OBJECT_INDEX]));
            console.log("Direct Lighitng: " + direct_lighting);
       }
    }

    return [direct_lighting, res[INDEX_RES_NU_ORIGIN], res[INDEX_RES_NORM]];
}

const PDF = (2 * Math.PI);

//[direct_lighting, res[INDEX_RES_NU_ORIGIN], res[INDEX_RES_NORM]];
const INDEX_DIRECT_LIGHT = 0;
const INDEX_NU_ORIGIN = 1;
const INDEX_NORM = 2;

const TEST_ORIGIN = new Float32Array([8.344025611877441,9.738006591796875,-18.001483917236328]);
const TEST_DIR = new Float32Array([ -0.5928212948324045,-0.6918600140222468,0.4121803408586679]);

export function indirect(norm, depth, origin, dir, objects, transformArray, objectArray, models, texture_data, directional_array)
{
    if (depth >= MAX_DEPTH) return helper.ZEROS;

    origin = helper.vectorAdd(origin, helper.vector_mult_scalar(norm, 0.01));

    //const res = direct_light(TEST_ORIGIN, TEST_DIR, objects, transformArray, objectArray, models, texture_data, directional_array);
    const res = direct_light(origin, dir, objects, transformArray, objectArray, models, texture_data, directional_array);
    
    if (res[INDEX_RES_NU_ORIGIN] == null) {return res[INDEX_DIRECT_LIGHT]};

    const nu_origin = res[INDEX_NU_ORIGIN];

    const nu_normal = res[INDEX_NORM];

    let direct_lighting = res[INDEX_DIRECT_LIGHT];

    let indirect_light = new Float32Array([0, 0, 0]);

    for (let j = 0; j < MAX_SAMPLES_PER_BOUNCE; j++)
    {
        const r1 = Math.random();
        const sample_on_hemisphere = random_sample_hemi_sphere(nu_normal, r1);

        const indirect_light_tmp = indirect(nu_normal, depth + 1, nu_origin, sample_on_hemisphere, objects, transformArray, objectArray, models, texture_data, directional_array);

        // Multiply r1
        indirect_light = helper.vectorAdd(indirect_light, helper.vector_mult_scalar(helper.vector_mult_scalar(indirect_light_tmp, r1), PDF));
    }

    indirect_light = helper.vector_mult_scalar(indirect_light, (1 / MAX_SAMPLES_PER_BOUNCE) * 2);

    return helper.vectorAdd(direct_lighting, indirect_light);
}

// Func take in normal light dir, color for direcitonal

// Fumc tale om normal light dir. pos, color for spot

export function random_sample_sphere()
{
    const theta = Math.random() * Math.PI * 2; 
    const alpha = Math.acos(1 - 2 * Math.random());

    return [Math.cos(theta) * Math.sin(alpha), Math.cos(alpha), Math.sin(theta) * Math.sin(alpha)];
}

// https://www.scratchapixel.com/lessons/3d-basic-rendering/global-illumination-path-tracing/global-illumination-path-tracing-practical-implementation.html
export function random_sample_hemi_sphere(normal, r1)
{
    helper.is_undefined(r1);
    helper.is_undefined(normal);

    const theta = Math.sqrt(1 - r1 * r1); 
    const phi = 2 * Math.random() * Math.PI;

    const x = theta * Math.cos(phi);
    const z = theta * Math.sin(phi);
    const dir = new Float32Array([x, r1, z]);
    
    let tangent;

    if (Math.abs(normal[0]) > Math.abs(normal[1]))
    {
       tangent = helper.vectorNorm([normal[2], 0, -normal[0]]);
    }
    else
    {
        tangent = helper.vectorNorm([0, -normal[2], normal[1]]);
    }

    const cross = helper.vectorCross(normal, tangent);

    const sample = new Float32Array([dir[0] * cross[0] + dir[1] * normal[0] + dir[2] * tangent[0],
    dir[0] * cross[1] + dir[1] * normal[1] + dir[2] * tangent[1],
    dir[0] * cross[2] + dir[1] * normal[2] + dir[2] * tangent[2]]);

    return sample;
}

// TO DO: Do I do a initial object ray before doing this traingle by triangle ray
export function transform_vertexs(vertex_info, game_object, transformArray)
{
    // Game Object create world matrix

    let world_verts = [];
    let world_verts_index = 0;

    let tex_verts = [];
    let tex_verts_index = 0;

    let norm_verts = [];
    let norm_verts_index = 0;

    // Make world matrix for verts
    let tmp_pos = game_object.getPosition(transformArray);
    let tmp_scale = game_object.getScale(transformArray);
    let tmp_rot = game_object.getRotation(transformArray);
    let world_matrix = helper.getWorldMatrix(tmp_pos[0], tmp_pos[1], tmp_pos[2], tmp_rot[0], tmp_rot[1], tmp_rot[2], tmp_scale);

    // Skip to only triangle vertexes
    for (let i = 0; i < vertex_info.length; i += 8)
    {
        let verts = [vertex_info[i + 0], vertex_info[i + 1], vertex_info[i + 2], 1];
        
        world_verts[world_verts_index++] = helper.multiply_matrix_and_point(world_matrix, verts);
        tex_verts[tex_verts_index++] = [vertex_info[i + OFFSET_INT_VT_INDEX], vertex_info[i + OFFSET_INT_VT_INDEX + 1]];

        let norm = [vertex_info[i + OFFSET_INT_VN_INDEX], vertex_info[i + OFFSET_INT_VN_INDEX + 1], vertex_info[i + OFFSET_INT_VN_INDEX + 2], 0];
  
        // TO DO: Create func to transfrom vec with inver transpose of word matrix
        norm_verts[norm_verts_index++] = helper.multiply_matrix_and_normal(world_matrix, norm);
    }

    return [world_verts, tex_verts, norm_verts];
}

const CONST_SMALL_NUMBER = 0.00000000000001;

const CONST_INDEX_OF_VERTEX_POS = 0;
const CONST_INDEX_OF_VERTEX_TEX = 1;

// Res U V T


const CONST_INDEX_U = 0;
const CONST_INDEX_V = 1;

// data
// colorSpace
// height
// pixelFormat
// width

export function path_trace_ray(origin, dir, objects, transformArray, objectArray, models, texture_data)
{
    const CONST_START_OBJECT_INDEX = 1;
    let t_near = -1;
    let final_res = null;
    let final_index = -1;

    for (let i = CONST_START_OBJECT_INDEX; i < objects.length; i++)
    {
        let verts = transform_vertexs(models[objects[i].getModelIndex(objectArray)], objects[i], transformArray);
        // TO DO: Print index
        const tex_data = texture_data[objects[i].getTextureIndex(objectArray)];
        let res = intersect_objects_triangles(verts[0], origin, dir, verts[1], tex_data["data"], tex_data["width"], tex_data["height"], verts[2]);

        if (res[0][CONST_RESULT_STRUCT_RESULT_INDEX] && (t_near == -1 || (res[CONST_RESULT_STRUCT_T_INDEX] < t_near)))
        {
            t_near = res[INDEX_RES_INTERSECT_INFO][CONST_RESULT_STRUCT_T_INDEX];
            final_res = res;
            final_index = i;
        }
    }
 
    if (final_res != null)
    {
        final_res.push(final_index);
    }

    return final_res;
}


export function vis_check(origin, dir, objects, transformArray, objectArray, models, texture_data, vertex_skip_index = -1, object_skip_index = -1)
{
    const CONST_START_OBJECT_INDEX = 1;
    let t_near = -1;

    for (let i = CONST_START_OBJECT_INDEX; i < objects.length; i++)
    {
    // Can just do second one
        let verts = transform_vertexs(models[objects[i].getModelIndex(objectArray)], objects[i], transformArray);
        // TO DO: Print index
        const tex_data = texture_data[objects[i].getTextureIndex(objectArray)];
        let res = intersect_objects_triangles(verts[0], origin, dir, verts[1], tex_data["data"], tex_data["width"], tex_data["height"], verts[2], vertex_skip_index, object_skip_index, i);

        if (res[0][CONST_RESULT_STRUCT_RESULT_INDEX] && (t_near == -1 || (res[CONST_RESULT_STRUCT_T_INDEX] < t_near)))
        {
            t_near = res[0][CONST_RESULT_STRUCT_T_INDEX];

            // if (t_near < 0.0001)
            // {
            //     console.log("NOT VISIBLE");
            //     console.log("From: " + origin);
            //     console.log("To: " + res[INDEX_RES_NU_ORIGIN]);
            //     console.log("in Dir: " + dir);
                
            // }

        }
    }

    return (t_near == -1) ? helper.BIG_NUMBER : t_near;
}


 // Can just do second one
export function intersect_objects_triangles(vertexs, origin, dir, texs, texture, width, height, norms, skip_index = -1, skip_object_index = -1, current_object_index = -1)
{
    let coords = null;
    let final_norm = null;
    let final_colour = null;
    let t_near = -1;
    let final_res = CONST_FALSE_RESULT;
    let final_index = null;

    for (let i = 0; i < vertexs.length; i += 3)
    {
        if ((skip_index == -1 || skip_object_index == -1 || current_object_index == -1) || !(i == skip_index && (skip_object_index == current_object_index)))
        {
            let res = ray_triangle_intersection(origin, dir, vertexs[i + 0], vertexs[i + 1], vertexs[i + 2])

            if (res[CONST_RESULT_STRUCT_RESULT_INDEX] == true & (t_near == -1 | res[CONST_RESULT_STRUCT_T_INDEX] < t_near))
            {
        
                final_res = res;
                t_near = res[CONST_RESULT_STRUCT_T_INDEX];

                if (t_near < 0.0001)
                {
                    console.log("T Test: " + t_near);
                    const nu_origin = helper.vectorAdd(origin, helper.vector_mult_scalar(dir, t_near));
                    console.log("Original: " + origin);
                    console.log("New: " + nu_origin);
                }

                coords = calculate_UV_from_VT(res[CONST_RESULT_STRUCT_U_INDEX], res[CONST_RESULT_STRUCT_V_INDEX], texs[i + 0], texs[i + 1], texs[i + 2]);
                final_norm = calculate_NORM_from_VN(res[CONST_RESULT_STRUCT_U_INDEX], res[CONST_RESULT_STRUCT_V_INDEX], norms[i + 0], norms[i + 1], norms[i + 2]);
                final_colour = sample_tex_at_uv(texture, coords[CONST_INDEX_U], coords[CONST_INDEX_V], width, height);
                final_index = i;
            
            }
        }
    }

    // TO DO: SRG TO LINEAR

    if (t_near != -1)
    {
        // TO DO: TEST THIS : vector_reflect
        
        // Find new orign and dir create ray, maybe intersect agains with ray tri

       const nu_origin = helper.vectorAdd(origin, helper.vector_mult_scalar(dir, t_near));
       const nu_dir = helper.vector_reflect(dir, final_norm);
     
        return [final_res, nu_origin, nu_dir, final_colour, final_norm, final_index];
    }

    return [final_res, null, null, null, null, null];
}

function sample_tex_at_uv(tex, U, V, width, height)
{
    if (U < 0 | V < 0 | width < 0 | height < 0)
    {
        console.log("Error in sample_tex_at_uv something is negative");
        console.log("U: " + U);
        console.log("V: " + V);
        console.log("width: " + width);
        console.log("height: " + height);
    }

    // Try mirror
    const x_coord = Math.floor(U * (width - 1));
    const y_coord = Math.floor((1 - V) * (height - 1)) * width;
    const r_index = (x_coord + y_coord) * 4;

   // return [tex[r_index], tex[r_index + 1], tex[r_index + 2], tex[r_index + 3]];

    // Maybe need gamma
    return [Math.pow(tex[r_index] / 255 , 2.2) * 255, Math.pow(tex[r_index + 1] / 255 , 2.2) * 255, Math.pow(tex[r_index + 2] / 255 , 2.2) * 255, Math.pow(tex[r_index + 3] / 255 , 2.2) * 255];
}

// Use U V and W = (1 - U - V). to interpolate 3 vertexs vt
// V0 * w + v1 * u + v2 * v

// Passing in [U, V] array for VT returning [U, V] array
function calculate_UV_from_VT(U, V, VT0, VT1, VT2)
{
    const W = (1 - U - V);

    return [(VT0[0] * W + VT1[0] * U + VT2[0] * V), (VT0[1] * W + VT1[1] * U + VT2[1] * V)];
}

function calculate_NORM_from_VN(U, V, VN0, VN1, VN2)
{
    const W = (1 - U - V);

    return [(VN0[0] * W + VN1[0] * U + VN2[0] * V), (VN0[1] * W + VN1[1] * U + VN2[1] * V), (VN0[2] * W + VN1[2] * U + VN2[2] * V)];
}

const CONST_FALSE_RESULT = [false, -1, -1, -1];

// Returns [true, u, v, t]
// https://github.com/scratchapixel/scratchapixel-code/blob/main/global-illumination-path-tracing/indirectdiffuse.cpp#L274
export function ray_triangle_intersection(origin, dir, vec_0, vec_1, vec_2)
{
    let V_0_to_V_1 = helper.vectorSubtract(vec_1, vec_0);
    let V_0_to_V_2 = helper.vectorSubtract(vec_2, vec_0);

    let p_vec = helper.vectorCross(dir ,V_0_to_V_2);
    let determinent = helper.vectorDot(V_0_to_V_1, p_vec);

    if (Math.abs(determinent) < CONST_SMALL_NUMBER) return CONST_FALSE_RESULT;

//   float invDet = 1 / det;

    const inverse_determinent = 1 / determinent;

//     Vec3f tvec = orig - v0;

    let t_vec = helper.vectorSubtract(origin, vec_0);

//     u = tvec.dotProduct(pvec) * invDet;
    
    let u = helper.vectorDot(t_vec, p_vec) * inverse_determinent;

//     if (u < 0 || u > 1) return false;

    if (u < 0 || u > 1) return CONST_FALSE_RESULT;

//     Vec3f qvec = tvec.crossProduct(v0v1);

    let q_vec = helper.vectorCross(t_vec, V_0_to_V_1);

//     v = dir.dotProduct(qvec) * invDet;

    let v = helper.vectorDot(dir, q_vec) * inverse_determinent;

//     if (v < 0 || u + v > 1) return false;

    if (v < 0 || u + v > 1) return CONST_FALSE_RESULT;
    
//    t = v0v2.dotProduct(qvec) * invDet;

    let t = helper.vectorDot(V_0_to_V_2, q_vec) * inverse_determinent;
    
//     return (t > 0) ? true : false;

    return (t > 0) ? [true, u, v, t] : CONST_FALSE_RESULT;
}



// Remeber to do indirect look at scratch a pixel
// Dose direct lighting at each step check direct
// skip first depth step as that is direct lighting
// indirect lighting is every bouce after that.
// Convert this to spherical harmonic result
// Test set for spherical harmonics output in sphere
// TO DO: BRDF bit lambertian works find for indirect
// DO bilinear interpolation on texture sample wiht UV
// TO DO: Test gamma later
// TO DO: Light color will be important later (torches)