import * as helper from './helperFuncs.js'

// Use the vertex buffer skip normals uvs and shit only do positions.

// TO DO: Do I do a initial object ray before doing this traingle by triangle ray
export function transform_vertexs(vertex_info, game_object, transformArray)
{
    // Game Object create world matrix

    let world_verts = [];
    let world_verts_index = 0;

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
    }

    return world_verts;
}

const CONST_SMALL_NUMBER = 0.00000001;

export function intersect_objects_triangles(vertexs, dir, origin)
{
    for (let i = 0; i < vertexs.length; i += 3)
    {
        let res = ray_triangle_intersection(origin, dir, vertexs[i + 0], vertexs[i + 1], vertexs[i + 2])

        if (res[0] == true)
        {
            return res;
        }
    }

    return CONST_FALSE_RESULT;
}

const CONST_FALSE_RESULT = [false, -1, -1, -1];

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
// Find best testing envornment
// Chang colours better test
// Remeber to do indirect look at scratch a pixel
// Dose direct lighting at each step check direct
// skip first depth step as that is direct lighting
// indirect lighting is every bouce after that.
// Convert this to spherical harmonic result