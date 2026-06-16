import * as helper from './helperFuncs.js'

// Use the vertex buffer skip normals uvs and shit only do positions.

const OFFSET_INT_VT_INDEX = 3;

// TO DO: Do I do a initial object ray before doing this traingle by triangle ray
export function transform_vertexs(vertex_info, game_object, transformArray)
{
    // Game Object create world matrix

    let world_verts = [];
    let world_verts_index = 0;

    let tex_verts = [];
    let tex_verts_index = 0;

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
    }

    return [world_verts, tex_verts];
}

const CONST_SMALL_NUMBER = 0.00000001;

const CONST_INDEX_OF_VERTEX_POS = 0;
const CONST_INDEX_OF_VERTEX_TEX = 1;

export function intersect_objects_triangles(vertexs, dir, origin, texs, texture, width, height)
{
    for (let i = 0; i < vertexs.length; i += 3)
    {
        let res = ray_triangle_intersection(origin, dir, vertexs[i + 0], vertexs[i + 1], vertexs[i + 2])

        // TO DO: Magic numbers
        // TO DO: NEED TO CHECK IF CLOSEST
        if (res[0] == true)
        {
            console.log(texture);
            let coords = calculate_UV_from_VT(res[1], res[2], texs[i + 0], texs[i + 1], texs[i + 2]);
            console.log(sample_tex_at_uv(texture, coords[0], coords[1], width, height));
            // TO DO: SRG TO LINEAR
            return res;
        }
    }

    return CONST_FALSE_RESULT;
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

    return [tex[r_index], tex[r_index + 1], tex[r_index + 2], tex[r_index + 3]];
}

// Use U V and W = (1 - U - V). to interpolate 3 vertexs vt
// V0 * w + v1 * u + v2 * v

// Passing in [U, V] array for VT returning [U, V] array
function calculate_UV_from_VT(U, V, VT0, VT1, VT2)
{
    const W = (1 - U - V);

    return [(VT0[0] * W + VT1[0] * U + VT2[0] * V), (VT0[1] * W + VT1[1] * U + VT2[1] * V)];
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




// Dose this have to be transformed ?? by world.
// Transfrom to world maybe object by object.
// do triangle by traingle intersection
// get uv and pos info
// use texture ifnormaiton to get colour at that uv point


// Have ray class Return colided objects uv and coresponding texture colour.
// Find best testing envornment. Wall diffrent colours every so many pixels, should match ray
// Chang colours better test
// Remeber to do indirect look at scratch a pixel
// Dose direct lighting at each step check direct
// skip first depth step as that is direct lighting
// indirect lighting is every bouce after that.
// Convert this to spherical harmonic result
// DO bilinear interpolation on texture sample wiht UV