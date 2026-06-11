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
        
    console.log(vertex_info.length);
    console.log(vertex_info[0]);

    // Skip to only triangle vertexes
    for (let i = 0; i < vertex_info.length; i += 8)
    {
        let verts = [vertex_info[i + 0], vertex_info[i + 1], vertex_info[i + 2], 0];
        
        world_verts[world_verts_index++] = helper.multiply_matrix_and_point(world_matrix, verts);
        console.log(helper.multiply_matrix_and_point(world_matrix, verts));
        console.log(world_matrix);
        console.log(world_verts[world_verts_index - 1]);
    }

    console.log("vert 1: " + world_verts[0]);
    console.log("vert 2: " + world_verts[1]);
    console.log("vert 3: " + world_verts[2]);
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