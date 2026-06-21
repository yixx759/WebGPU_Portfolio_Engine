import * as helper from './helperFuncs.js'

// Use the vertex buffer skip normals uvs and shit only do positions.

const OFFSET_INT_VT_INDEX = 3;
const OFFSET_INT_VN_INDEX = 5;

export function PATH_TRACE(origin)
{
    // Random sample in sphere
    // Random smaple on hemispere
    // Run both random smaples and claude check

    console.log(random_sample_sphere());
    console.log(random_sample_hemi_sphere([1,0,0]));

    // Do Lighting from normal just lambertian with lighitng.
    // do first ray but skip any results
    // Reflect random directions
    // Do thins until depth
    // Average this out
    // Check resulting color try green

    // Then store this as spherical harmioc

}

export function random_sample_sphere()
{
    const theta = Math.random() * Math.PI * 2; 
    const alpha = Math.acos(1 - 2 * Math.random());

    return [Math.cos(theta) * Math.sin(alpha), Math.cos(alpha), Math.sin(theta) * Math.sin(alpha)];
}

// https://www.scratchapixel.com/lessons/3d-basic-rendering/global-illumination-path-tracing/global-illumination-path-tracing-practical-implementation.html
export function random_sample_hemi_sphere(normal)
{
    const r1 = Math.random();
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

const CONST_SMALL_NUMBER = 0.00000001;

const CONST_INDEX_OF_VERTEX_POS = 0;
const CONST_INDEX_OF_VERTEX_TEX = 1;

// Res U V T
const CONST_RESULT_STRUCT_RESULT_INDEX = 0;
const CONST_RESULT_STRUCT_U_INDEX = 1;
const CONST_RESULT_STRUCT_V_INDEX = 2;
const CONST_RESULT_STRUCT_T_INDEX = 3;

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
            t_near = res[CONST_RESULT_STRUCT_T_INDEX];
            final_res = res;
            final_index = i;
            console.log("HIT: " + res);
        }
    }

    // if (origin[0] === 0 | origin[2] === -12.2)
    // {
    //     console.log("Second Ray")
    //     path_trace_ray(final_res[1], final_res[2], objects, transformArray, objectArray, models, texture_data);
    // }

    console.log("og dir" + dir);
    console.log("Final" +  final_res[2]);
    return final_res;
    return final_res != null && final_res[0][CONST_RESULT_STRUCT_RESULT_INDEX];
}

export function intersect_objects_triangles(vertexs, origin, dir, texs, texture, width, height, norms)
{
    let coords = null;
    let final_norm = null;
    let t_near = -1;
    let final_res = CONST_FALSE_RESULT;

    for (let i = 0; i < vertexs.length; i += 3)
    {
        let res = ray_triangle_intersection(origin, dir, vertexs[i + 0], vertexs[i + 1], vertexs[i + 2])

        if (res[CONST_RESULT_STRUCT_RESULT_INDEX] == true & (t_near == -1 | res[CONST_RESULT_STRUCT_T_INDEX] < t_near))
        {
            final_res = res;
            t_near = res[CONST_RESULT_STRUCT_T_INDEX];
            coords = calculate_UV_from_VT(res[CONST_RESULT_STRUCT_U_INDEX], res[CONST_RESULT_STRUCT_V_INDEX], texs[i + 0], texs[i + 1], texs[i + 2]);
            final_norm = calculate_NORM_from_VN(res[CONST_RESULT_STRUCT_U_INDEX], res[CONST_RESULT_STRUCT_V_INDEX], norms[i + 0], norms[i + 1], norms[i + 2]);
        }
    }

    // TO DO: SRG TO LINEAR

    if (t_near != -1)
    {
        console.log(t_near);
        console.log(sample_tex_at_uv(texture, coords[CONST_INDEX_U], coords[CONST_INDEX_V], width, height));
        console.log("Normal: " + final_norm);
        // TO DO: TEST THIS : vector_reflect
        
        // Find new orign and dir create ray, maybe intersect agains with ray tri

       const nu_origin = helper.vectorAdd(origin, helper.vector_mult_scalar(dir, t_near));
       const nu_dir = helper.vector_reflect(dir, final_norm);
     
        return [final_res, nu_origin, nu_dir];
    }

    return [final_res, null, null];
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
// TO DO: BRDF bit lambertian works find for indirect
// DO bilinear interpolation on texture sample wiht UV
// TO DO: Test gamma later