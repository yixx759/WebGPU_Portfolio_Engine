import * as helper from './Helper_Funcs.js'
import * as light_manager from './Light_Manager.js'
import * as sh_funcs from './SH_Funcs.js'

const SH_DEGREES = 3;

// Use the vertex buffer skip normals uvs and shit only do positions.

const OFFSET_INT_VT_INDEX = 3;
const OFFSET_INT_VN_INDEX = 5;

const MAX_DEPTH = 2;
const MAX_SAMPLES_PER_BOUNCE = 30; // 128;
const MAX_SAMPLES_AROUND_SPHERE = 30; // 128;

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

const RGB_COFF_RED_INDEX = 0; 
const RGB_COFF_GREEN_INDEX = 1; 
const RGB_COFF_BLUE_INDEX = 2; 

// TO DO: Results to high indirect print out way too rbigh above 1 sometiomes.
// TO DO: Check before and after point light because it seems to be just raw texture data??
export function PATH_TRACE(origin, dir, objects,   models, texture_data, directional_array)
{
    // samples around sphere to fill out
    // recursive until depth
    // each hit samples how many times
    // Do direct light then start recurse

    // Get cefficents
     var shRgb = [ 
    [],[],[]
    ];

    // TO DO: CHANGE MEEEE
    for (let i = 0; i < MAX_SAMPLES_AROUND_SPHERE; i++)
    {
        // Do Lighting from normal just lambertian with lighitng.
        let indirect_lighting =  new Float32Array([0, 0, 0]);
        
        console.log(texture_data);
        const dir_from_sphere = random_sample_sphere();
        const res = path_trace_ray(origin, dir_from_sphere, objects,   models, texture_data);
        console.log(res);
        
        // Once hit new place dont do direct
        // send new locaiton and new smaple dir to indierct

        // console.log("Main Loop ray");
        if (res != null)
        {
            const nu_origin = res[INDEX_RES_NU_ORIGIN];
            const nu_normal = res[INDEX_RES_NORM];

            for (let j = 0; j < MAX_SAMPLES_PER_BOUNCE; j++)
            {
                const r1 = Math.random();
                const sample_on_hemisphere = random_sample_hemi_sphere(nu_normal, r1);
                const tmp_indirect_lighting = indirect(nu_normal, 0, nu_origin, sample_on_hemisphere, objects, models, texture_data, directional_array);
                
                indirect_lighting = helper.vector_add(indirect_lighting, helper.vector_mult_scalar(tmp_indirect_lighting, r1));

                // if (indirect_lighting[0] === helper.ZEROS[0] && 
                //     indirect_lighting[1] === helper.ZEROS[1] &&
                //     indirect_lighting[2] === helper.ZEROS[2])
                // {
                //     console.log("Break at: " + j + " OUT OF: " + MAX_SAMPLES_AROUND_SPHERE)
                //     console.log(indirect_lighting);
                //     break;
                // }
            }
        }

        // TOTAL ME

        indirect_lighting = helper.vector_div_scalar(indirect_lighting, MAX_SAMPLES_PER_BOUNCE);

        // Since this is indirect wiht out difrect test which one looks right
        indirect_lighting = helper.vector_mult_scalar(indirect_lighting, 255);
        // indirect_lighting = helper.vector_mult_scalar(indirect_lighting, 2);

        shRgb = sh_funcs.sampleToSH(dir_from_sphere, indirect_lighting, SH_DEGREES, shRgb);

        console.log(indirect_lighting);
    }

    
    console.log(shRgb);

    // devide me
    return sh_funcs.create_coeff_buffer(shRgb);

    // do first ray but skip any results
    // Do thins until depth
    // Average this out
    // Check resulting color try green

    // Then store this as spherical harmioc
}

export function direct_light(origin, dir, objects,   models, texture_data, directional_array, norm)
{
    // get colour
    const res = path_trace_ray(origin, dir, objects,   models, texture_data);

    // Change to background colour
    if (res === null || res[INDEX_RES_INTERSECT_INFO][CONST_RESULT_STRUCT_RESULT_INDEX] == false) {return [helper.ZEROS, null, null]};

    const colour_from_ray = helper.vector_div_scalar(res[INDEX_RES_COLOUR], 255);
    const norm_from_ray = res[INDEX_RES_NORM];
    const object_from_ray = res[INDEX_RES_OBJECT_INDEX];
    const index_from_ray = res[INDEX_RES_VERTEX_INDEX];
    const origin_from_ray = res[INDEX_RES_NU_ORIGIN];

    if (origin_from_ray[1] > 9.5 || origin_from_ray[1] < -9.5 || origin_from_ray[0] > 9.2 ||  origin_from_ray[0] < -8.7 || origin_from_ray[2] < -21.3 || origin_from_ray[2] > -3.3)
    {
        // console.log("OUTSIDE box!");
        // console.log("nu origin: " + origin_from_ray);
        // path_trace_ray_debug(origin, dir, objects,   models, texture_data);
    }

    // if (origin_from_ray[0] > 9 || origin_from_ray[1] > 9.1)
    // {
    //     console.log("Outside box");

    //     console.log("origin: " + origin);
    //     console.log("dir: " + dir);
    //     console.log("nu point: " + origin_from_ray);

    //     console.log(res);
    // }

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

        const to_light = helper.vector_subtract(light_point, origin_from_ray); 
        const length_to_light = helper.vector_mag(to_light);  
        const dir_to_light = helper.vector_norm(to_light);  

        const nu_origin = helper.vector_add(origin_from_ray, helper.vector_mult_scalar(norm_from_ray, OFFSET_FROM_TRIANGLE_FACE));

        const vis = vis_check(nu_origin, dir_to_light, objects,   models, texture_data, res[INDEX_RES_VERTEX_INDEX], res[INDEX_RES_OBJECT_INDEX]) > length_to_light ? 1 : 0;
   
        direct_lighting = helper.vector_add(direct_lighting, helper.vector_mult_scalar(helper.vector_mult_scalar(colour_from_ray, light_manager.point_light_illuminate(light_point, res[INDEX_RES_NU_ORIGIN], atten, intensity, norm_from_ray)), vis));

    //    if (i == 0 && vis == 0)
    //    {
    //         console.log("HIT NO LIGHT");
    //         console.log("Vis: " + vis);
    //         console.log("Mult: " + light_manager.point_light_illuminate(light_point, res[INDEX_RES_NU_ORIGIN], atten, intensity, norm_from_ray)); 
    //         console.log("nu origin : " + res[INDEX_RES_NU_ORIGIN]);
    //         console.log("dir light : " + dir_to_light);
    //         console.log("light_point : " + light_point);
    //         console.log("lenght : " + length_to_light);
    //         console.log("lenght to collide : " + vis_check(res[INDEX_RES_NU_ORIGIN], dir_to_light, objects,   models, texture_data, res[INDEX_RES_VERTEX_INDEX], res[INDEX_RES_OBJECT_INDEX]));
    //         console.log("og from: " + origin);
    //         console.log("og dir: " + dir);

    //         console.log(object_from_ray);
    //         let tmp_verts = transform_vertexs(models[objects[object_from_ray].get_model_index()], objects[object_from_ray], );
            
    //         console.log("og result verts: " + tmp_verts[0][index_from_ray * 3 + 0] + " : " + tmp_verts[0][index_from_ray * 3 + 1] + " : " + tmp_verts[0][index_from_ray * 3 + 2]);
            
    //         console.log("Direct Lighitng: " + direct_lighting);
    //    }
    //    else if (i == 0 && helper.vector_3_equality(direct_lighting, helper.ZEROS))
    //    {
    //         console.log("HIT NO LIGHT With VIS");
    //         console.log("Vis: " + vis);
    //         console.log("Mult: " + light_manager.point_light_illuminate(light_point, res[INDEX_RES_NU_ORIGIN], atten, intensity, norm_from_ray)); 
    //         if (light_manager.point_light_illuminate(light_point, res[INDEX_RES_NU_ORIGIN], atten, intensity, norm_from_ray) == 0)
    //         {
    //             console.log("norm_from_ray: " + norm_from_ray);

    //             // light_manager.point_light_illuminate(light_point, res[INDEX_RES_NU_ORIGIN], atten, intensity, norm_from_ray, true);

    //             console.log("light_point: " + light_point);
    //             console.log("res[INDEX_RES_NU_ORIGIN]: " + res[INDEX_RES_NU_ORIGIN]);
    //             const tmp_ray =  helper.vectorSubtract(light_point, res[INDEX_RES_NU_ORIGIN]);
                
    //             console.log("helper.vectorSubtract(light_pos, surface_pos): " + tmp_ray);
    //             console.log("dir: " + helper.vectorNorm(tmp_ray));
    //             console.log("Intensity: " + intensity);
    //             console.log("Atten: " + atten);
    //         }

    //         console.log("Direct Lighitng: " + direct_lighting);
    //    }
    }

    return [direct_lighting, res[INDEX_RES_NU_ORIGIN], res[INDEX_RES_NORM], colour_from_ray];
}

const PDF = 1 / (2 * Math.PI);

//[direct_lighting, res[INDEX_RES_NU_ORIGIN], res[INDEX_RES_NORM]];
const INDEX_DIRECT_LIGHT = 0;
const INDEX_NU_ORIGIN = 1;
const INDEX_NORM = 2;
const INDEX_COL = 3;

const TEST_ORIGIN = new Float32Array([2.679107189178467,9.421055793762207,-4.0550103187561035]);
const TEST_DIR = new Float32Array([0.3692111074924469,0.8945819139480591,-0.25180625915527344]);

const OFFSET_FROM_TRIANGLE_FACE = 0.0001;

export function indirect(norm, depth, origin, dir, objects,   models, texture_data, directional_array)
{
    if (depth >= MAX_DEPTH) return helper.ZEROS;
    
    // console.log("Before: " + origin);
    origin = helper.vector_add(origin, helper.vector_mult_scalar(norm, OFFSET_FROM_TRIANGLE_FACE));

   // console.log("After: " + origin);

    //const res = direct_light(TEST_ORIGIN, TEST_DIR, objects,   models, texture_data, directional_array);
    const res = direct_light(origin, dir, objects,   models, texture_data, directional_array);
    
    if (res[INDEX_RES_NU_ORIGIN] == null) {return res[INDEX_DIRECT_LIGHT]};

    const nu_origin = res[INDEX_NU_ORIGIN];

    const nu_normal = res[INDEX_NORM];

    let direct_lighting = res[INDEX_DIRECT_LIGHT];

    let indirect_light = new Float32Array([0, 0, 0]);

    for (let j = 0; j < MAX_SAMPLES_PER_BOUNCE; j++)
    {
        const r1 = Math.random();
        const sample_on_hemisphere = random_sample_hemi_sphere(nu_normal, r1);

        const indirect_light_tmp = indirect(nu_normal, depth + 1, nu_origin, sample_on_hemisphere, objects,   models, texture_data, directional_array);

        // Multiply r1
        indirect_light = helper.vector_add(indirect_light, helper.vector_mult_scalar(indirect_light_tmp, r1));
    }

    indirect_light = helper.vector_div_scalar(indirect_light, (MAX_SAMPLES_PER_BOUNCE));
    indirect_light = helper.vector_mult_scalar(indirect_light, 2);

    // TO DO: Yes scratch apixel shows direct and indirect being multipled by color 
    // TO DO: REARRANGE INTO ONE MULT.
    indirect_light = helper.vector_mult(indirect_light, res[INDEX_COL]);

    direct_lighting = helper.vector_mult_scalar(direct_lighting, helper.ONE_OVER_PI);

    return helper.vector_add(direct_lighting, indirect_light);
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
       tangent = helper.vector_norm([normal[2], 0, -normal[0]]);
    }
    else
    {
        tangent = helper.vector_norm([0, -normal[2], normal[1]]);
    }

    const bitangent = helper.vector_cross(normal, tangent);

    const sample = new Float32Array([
    dir[0] * tangent[0]   + dir[1] * normal[0] + dir[2] * bitangent[0],
    dir[0] * tangent[1]   + dir[1] * normal[1] + dir[2] * bitangent[1],
    dir[0] * tangent[2]   + dir[1] * normal[2] + dir[2] * bitangent[2],
    ]);

    // console.log("Noraml: " + normal);

    return sample;
}

// TO DO: Do I do a initial object ray before doing this traingle by triangle ray
export function transform_vertexs(vertex_info, game_object, )
{
    // Game Object create world matrix

    let world_verts = [];
    let world_verts_index = 0;

    let tex_verts = [];
    let tex_verts_index = 0;

    let norm_verts = [];
    let norm_verts_index = 0;

    // Make world matrix for verts
    let tmp_pos = game_object.get_position();
    let tmp_scale = game_object.getScale();
    let tmp_rot = game_object.getRotation();
    let world_matrix = helper.get_world_matrix(tmp_pos[0], tmp_pos[1], tmp_pos[2], tmp_rot[0], tmp_rot[1], tmp_rot[2], tmp_scale);

    // THIS WAS CHANGED RECENTLY
    const inverse_trans_world_matrix = helper.transpose_matrix(helper.inverse_matrix(world_matrix));

    // Skip to only triangle vertexes
    for (let i = 0; i < vertex_info.length; i += 8)
    {
        let verts = [vertex_info[i + 0], vertex_info[i + 1], vertex_info[i + 2], 1];
        
        world_verts[world_verts_index++] = helper.multiply_matrix_and_point(world_matrix, verts);
        tex_verts[tex_verts_index++] = [vertex_info[i + OFFSET_INT_VT_INDEX], vertex_info[i + OFFSET_INT_VT_INDEX + 1]];

        let norm = [vertex_info[i + OFFSET_INT_VN_INDEX], vertex_info[i + OFFSET_INT_VN_INDEX + 1], vertex_info[i + OFFSET_INT_VN_INDEX + 2], 0];
  
        // TO DO: Create func to transfrom vec with inver transpose of word matrix
        norm_verts[norm_verts_index++] = helper.multiply_inverse_transpose_matrix_and_normal(inverse_trans_world_matrix, norm);
    }

    // console.log("norm verts");

    // console.log(norm_verts);

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

export function path_trace_ray(origin, dir, objects,  models, texture_data)
{
    const CONST_START_OBJECT_INDEX = 1;
    let t_near = -1;
    let final_res = null;
    let final_index = -1;
    
    // console.log("In path trace");

    // if (origin[1] > 8.5 || origin[0] > 8.5 )
    // {
    //     console.log("Origin OUTSIDE TOP");
    // }

   //  console.log("Path trace!");
    for (let i = CONST_START_OBJECT_INDEX; i < objects.length; i++)
    {
        let verts = transform_vertexs(models[objects[i].get_model_index()], objects[i], );
        // TO DO: Print index
        const tex_data = texture_data[objects[i].get_texture_index()];
        let res = intersect_objects_triangles(verts[0], origin, dir, verts[1], tex_data["data"], tex_data["width"], tex_data["height"], verts[2]);

        const tmp_T_near = res[INDEX_RES_INTERSECT_INFO][CONST_RESULT_STRUCT_T_INDEX];
        // console.log("Before intersection");
        // console.log("T: " +tmp_T_near);
        // console.log("positon of object: " + objects[i].get_position());
        
        if (res[INDEX_RES_INTERSECT_INFO][CONST_RESULT_STRUCT_RESULT_INDEX] && (t_near == -1 || (tmp_T_near < t_near)))
        {
            // console.log("Intersect");
            // console.log("positon of object: " + objects[i].get_position());

            // console.log("current  tnear: " + t_near);
            
            // const origin_from_ray = res[INDEX_RES_NU_ORIGIN];
            // if (origin_from_ray[1] > 9.5 || origin_from_ray[1] < -9.5 || origin_from_ray[0] > 9.2 ||  origin_from_ray[0] < -8.7)
            // {
            //     console.log("OUTSIDE box IN INTERSECTION");
            //     console.log("outsaide  tnear: " + tmp_T_near);
            // }

            t_near = tmp_T_near;
           // console.log("tnear: " + t_near);

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

export function path_trace_ray_debug(origin, dir, objects,   models, texture_data)
{
    const CONST_START_OBJECT_INDEX = 1;
    let t_near = -1;
    let final_res = null;
    let final_index = -1;

   
    for (let i = CONST_START_OBJECT_INDEX; i < objects.length; i++)
    {
        let verts = transform_vertexs(models[objects[i].get_model_index()], objects[i], );
        // TO DO: Print index
        const tex_data = texture_data[objects[i].get_texture_index()];
        let res = intersect_objects_triangles_debug(verts[0], origin, dir, verts[1], tex_data["data"], tex_data["width"], tex_data["height"], verts[2]);

        const tmp_T_near = res[INDEX_RES_INTERSECT_INFO][CONST_RESULT_STRUCT_T_INDEX];

        if (res[INDEX_RES_INTERSECT_INFO][CONST_RESULT_STRUCT_RESULT_INDEX] && (t_near == -1 || (tmp_T_near < t_near)))
        {
            console.log("Intersect");
            console.log("index: " + i);
            console.log("tmp_T_near: " + tmp_T_near);

            t_near = tmp_T_near;

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


export function vis_check(origin, dir, objects,   models, texture_data, vertex_skip_index = -1, object_skip_index = -1)
{
    const CONST_START_OBJECT_INDEX = 1;
    let t_near = -1;

    for (let i = CONST_START_OBJECT_INDEX; i < objects.length; i++)
    {
    // Can just do second one
        let verts = transform_vertexs(models[objects[i].get_model_index()], objects[i], );
        // TO DO: Print index
        const tex_data = texture_data[objects[i].get_texture_index()];
      
        let res = intersect_objects_triangles(verts[0], origin, dir, verts[1], tex_data["data"], tex_data["width"], tex_data["height"], verts[2], vertex_skip_index, object_skip_index, i);

        if (res[0][CONST_RESULT_STRUCT_RESULT_INDEX] && (t_near == -1 || (res[0][CONST_RESULT_STRUCT_T_INDEX] < t_near)))
        {
            t_near = res[0][CONST_RESULT_STRUCT_T_INDEX];

            if (t_near < 2)
            {
                // BE CAREFUL THIS COULD BE INSIDE WALL FACE TO OUTSIDE WALL FACE.
                // console.log("NOT VISIBLE");
                // console.log("From: " + origin);
                // console.log("To: " + res[INDEX_RES_NU_ORIGIN]);
                // console.log("in Dir: " + dir);
            }

        }
    }

    return (t_near == -1) ? helper.BIG_NUMBER : t_near;
}

// TO DO: Way too scrappy a fix
const T_MIN = 0.01;

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

            if (res[CONST_RESULT_STRUCT_RESULT_INDEX] == true &&
                (res[CONST_RESULT_STRUCT_T_INDEX] > T_MIN) &&
                (t_near == -1 || res[CONST_RESULT_STRUCT_T_INDEX] < t_near))
            {
        
                final_res = res;
                t_near = res[CONST_RESULT_STRUCT_T_INDEX];
           
             

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

       // console.log("Final Indesx: " + final_index);
       const nu_origin = helper.vector_add(origin, helper.vector_mult_scalar(dir, t_near));
       const nu_dir = helper.vector_reflect(dir, final_norm);
     
        return [final_res, nu_origin, nu_dir, final_colour, final_norm, final_index];
    }

    return [final_res, null, null, null, null, null];
}

 // Can just do second one
export function intersect_objects_triangles_debug(vertexs, origin, dir, texs, texture, width, height, norms, skip_index = -1, skip_object_index = -1, current_object_index = -1)
{
    let coords = null;
    let final_norm = null;
    let final_colour = null;
    let t_near = -1;
    let final_res = CONST_FALSE_RESULT;
    let final_index = null;

    console.log("start intersect")
    for (let i = 0; i < vertexs.length; i += 3)
    {
        if ((skip_index == -1 || skip_object_index == -1 || current_object_index == -1) || !(i == skip_index && (skip_object_index == current_object_index)))
        {
            let res = ray_triangle_intersection(origin, dir, vertexs[i + 0], vertexs[i + 1], vertexs[i + 2]);

            if (res[CONST_RESULT_STRUCT_RESULT_INDEX] == true &&
                (res[CONST_RESULT_STRUCT_T_INDEX] > T_MIN) &&
                (t_near == -1 || res[CONST_RESULT_STRUCT_T_INDEX] < t_near))
            {
        
                final_res = res;
                t_near = res[CONST_RESULT_STRUCT_T_INDEX];
           
                console.log("origin: " + origin);
                console.log("dir: " + dir);
                console.log("final index: " + i);
                console.log("final tnear: " + t_near);
                console.log("verexes: " + vertexs[i + 0] +  vertexs[i + 1] + vertexs[i + 2]);

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

       // console.log("Final Indesx: " + final_index);
       const nu_origin = helper.vector_add(origin, helper.vector_mult_scalar(dir, t_near));
       const nu_dir = helper.vector_reflect(dir, final_norm);
     
        return [final_res, nu_origin, nu_dir, final_colour, final_norm, final_index];
    }

    return [final_res, null, null, null, null, null];
}

function sample_tex_at_uv(tex, U, V, width, height)
{
    if (U < 0 | V < 0 | U > 1 | V > 1 | width < 0 | height < 0)
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
    let V_0_to_V_1 = helper.vector_subtract(vec_1, vec_0);
    let V_0_to_V_2 = helper.vector_subtract(vec_2, vec_0);

    let p_vec = helper.vector_cross(dir ,V_0_to_V_2);
    let determinent = helper.vector_dot(V_0_to_V_1, p_vec);

    if (Math.abs(determinent) < CONST_SMALL_NUMBER) return CONST_FALSE_RESULT;

//   float invDet = 1 / det;

    const inverse_determinent = 1 / determinent;

//     Vec3f tvec = orig - v0;

    let t_vec = helper.vector_subtract(origin, vec_0);

//     u = tvec.dotProduct(pvec) * invDet;
    
    let u = helper.vector_dot(t_vec, p_vec) * inverse_determinent;

//     if (u < 0 || u > 1) return false;

    if (u < 0 || u > 1) return CONST_FALSE_RESULT;

//     Vec3f qvec = tvec.crossProduct(v0v1);

    let q_vec = helper.vector_cross(t_vec, V_0_to_V_1);

//     v = dir.dotProduct(qvec) * invDet;

    let v = helper.vector_dot(dir, q_vec) * inverse_determinent;

//     if (v < 0 || u + v > 1) return false;

    if (v < 0 || u + v > 1) return CONST_FALSE_RESULT;
    
//    t = v0v2.dotProduct(qvec) * invDet;

    let t = helper.vector_dot(V_0_to_V_2, q_vec) * inverse_determinent;
    
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