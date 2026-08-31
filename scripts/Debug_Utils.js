import * as render from './Render.js';
import { save_file } from './Save_Funcs.js';
import * as helper from './Helper_Funcs.js';
import * as controls from './Controls.js';
import * as objectInfo from './Object_Info_Struct.js'

export let is_object_selected = false;
export let object_selected = -1;

export let creating_object = false;

export const DEBUG_COLLIDER_OBJECT = 0;
export let trigger_recalculate_collider = false;

export let SHOW_COLLIDER = false;

let tmp_pos = new Float32Array(3);
let tmp_rot = new Float32Array(3);
let tmp_scale = -1;

// If roation is 90 degrees, but colldier already rotated 90
// This creats a problem doing 180 degrees. needs to undo then do the 90
let tmp_col_rot = new Float32Array(3); 

export let pos_x_down = 0;
export let pos_y_down = 0;
export let pos_z_down = 0;

export let rot_x_down = 0;
export let rot_y_down = 0;
export let rot_z_down = 0;

export let scale_x_down = 0;
export let scale_y_down = 0;
export let scale_z_down = 0;


// If DEBUG_MODE on allow for object selection and fill in obj selec
// Rember when DEBUG turned off object selected and is obj needs tuirned off
// Make func to disable and enable this.
// Ray cast func from render, returns index of object to change/
// Test right index first, Then arrow keys to move and rotate adn scale
// This should happen instead of normal moving, add an if or something
// When esc be able to move again normally in debug, rember to reset is object when out of debug and out of seleciton into debug

window.create_new_object = function()
{
    const pos_inp = document.Create_Object_Values.elements["pos[]"];
    const rot_inp = document.Create_Object_Values.elements["rot[]"];

    tmp_pos = new Float32Array([parseFloat(pos_inp[0].value), parseFloat(pos_inp[1].value), parseFloat(pos_inp[2].value)])
    tmp_rot = new Float32Array([parseFloat(rot_inp[0].value), parseFloat(rot_inp[1].value), parseFloat(rot_inp[2].value)])

    // USE AMOUNT_OF_OBJECTS FOR ID
    let tmp_object = new objectInfo.gameObject(render.AMOUNT_OF_OBJECTS, parseInt(document.Create_Object_Values.vertex_index.value.trim()), parseInt(document.Create_Object_Values.texture_index.value.trim()), tmp_pos, parseFloat(document.Create_Object_Values.scale.value.trim()), tmp_rot, helper.ZEROS, helper.ZEROS_MATRIX, parseInt(document.Create_Object_Values.BRDF_index.value.trim()));

    console.log(tmp_object.get_BRDF_index())
    // USE VALUES FROM FOURM AND HALF NEEDS CALUCLATED
    // export func from render
    // OVERWRTIE AMOUT OF OBJECTS ON SAVE
    render.get_object_half(tmp_object);

    save_file(render.AMOUNT_OF_OBJECTS, render.game_object_array, controls.cam_pos, render.coeffs, true, tmp_object);

    creating_object = false;
    document.Create_Object_Values.style.display = "none"; 
}

export function reset_collider_recalc_trigger()
{
    trigger_recalculate_collider = false;
}

export function recalculate_collider(game_object_array, device, collider_vertexDebugBuffer)
{
    let tmp_min = new Float32Array(3);
    let tmp_max = new Float32Array(4);
    let tmp_pos = new Float32Array(4);
    let tmp_rot = new Float32Array(4);

    game_object_array[object_selected].update_collider_with_rot(tmp_min, tmp_max, tmp_pos, tmp_rot, tmp_col_rot);
    render.update_collider_vertex(device, game_object_array, collider_vertexDebugBuffer, object_selected);
    reset_collider_recalc_trigger();

    game_object_array[object_selected].getRotation_Into(tmp_col_rot);
}

function reset_object_values(selected_game_obj)
{
    selected_game_obj.set_position(tmp_pos);
    selected_game_obj.set_rotation(tmp_rot);
    selected_game_obj.setScale(tmp_scale);
}

function leave_selection_mode()
{
    reset_object_values(render.game_object_array[object_selected]); 
    object_selected = -1;
    is_object_selected = false;  
    SHOW_COLLIDER = false;

    document.Debug_Values.style.display = "none"; 
}

function save_selection_values(selected_game_obj)
{
    selected_game_obj.get_position_Into(tmp_pos);
    selected_game_obj.getRotation_Into(tmp_rot);
    tmp_scale = selected_game_obj.getScale();
    selected_game_obj.getRotation_Into(tmp_col_rot);
    fill_in_html_debug(tmp_pos, tmp_rot, tmp_scale)
}

function fill_in_html_debug(pos, rot, scale)
{
    const pos_inp = document.Debug_Values.elements["pos[]"];
    const rot_inp = document.Debug_Values.elements["rot[]"];
    const scale_inp = document.Debug_Values.scale;
    
    pos_inp[0].value = pos[0];
    pos_inp[1].value = pos[1];
    pos_inp[2].value = pos[2];

    rot_inp[0].value = rot[0];
    rot_inp[1].value = rot[1];
    rot_inp[2].value = rot[2];

    scale_inp.value = scale;
}

function validate_num(num)
{
    if (!num.value.trim())
    {
        return false;
    }

    if (isNaN(num.value.trim()))
    {
        return false;
    }

    return true;
}

function validate_gui_values(pos_inp, rot_inp, scale_inp)
{
    for (let i = 0; i < 3; i++)
    {
        if (!validate_num(pos_inp[i]))
        {
            console.print("Postions " + i + "Breaks");
            return false;
        }
    }   

    for (let i = 0; i < 3; i++)
    {
        if (!validate_num(rot_inp[i]))
        {
            console.print("Rotations " + i + "Breaks");
            return false;
        }
    }

    if (!validate_num(scale_inp))
    {
        console.print("Scale Breaks");
        return false;
    }

    return true;
}

window.submit_gui_values = function()
{ 
    const pos_inp = document.Debug_Values.elements["pos[]"];
    const rot_inp = document.Debug_Values.elements["rot[]"];
    const scale_inp = document.Debug_Values.scale;
    
    if (!validate_gui_values(pos_inp, rot_inp, scale_inp))
    {
        return
    }

    const selected_game_obj = render.game_object_array[object_selected];

    selected_game_obj.set_position(new Float32Array([parseFloat(pos_inp[0].value.trim()), parseFloat(pos_inp[1].value.trim()), parseFloat(pos_inp[2].value.trim())]));
    selected_game_obj.set_rotation(new Float32Array([parseFloat(rot_inp[0].value.trim()), parseFloat(rot_inp[1].value.trim()), parseFloat(rot_inp[2].value.trim())]));
    selected_game_obj.setScale(parseFloat(scale_inp.value.trim()))
}

export function debug_select_object(game_object_array, look_vector, device, collider_vertexDebugBuffer)
{
    if (!render.DEBUG_MODE) {console.log("Debug select ERROR: not in debug")}

    if (!is_object_selected){
        let object_index = render.click_object(game_object_array, look_vector);
        
        if (object_index != -1)
        {
            is_object_selected = true;
            object_selected = object_index;

            // TO DO: Should save pos / rot / scale
            const selected_game_obj = game_object_array[object_index];
            save_selection_values(selected_game_obj);
            render.update_collider_vertex(device, game_object_array, collider_vertexDebugBuffer, object_selected);
            console.log("Object selected: " + object_selected);

            // TO DO: Need to hide before selction and after selciton left
            document.Debug_Values.style.display = "block"; 
        }
    }
}

let selected_tmp_pos = new Float32Array(4);
let selected_tmp_rot = new Float32Array(4);
let selected_tmp_scale = -1;

export function move_selected_object(game_object_array)
{
    if (render.DEBUG_MODE && is_object_selected && object_selected != -1)
    {
        const selected_game_object = game_object_array[object_selected];
        
        selected_game_object.get_position_Into(selected_tmp_pos);
        selected_game_object.getRotation_Into(selected_tmp_rot);
        selected_tmp_scale = selected_game_object.getScale();

        selected_tmp_pos = helper.vector_add(selected_tmp_pos, new Float32Array([pos_x_down, pos_y_down, pos_z_down]), true);
        selected_tmp_rot = helper.vector_add(selected_tmp_rot, new Float32Array([rot_x_down * 2, rot_y_down * 2, rot_z_down * 2]), true);

        selected_game_object.set_position(selected_tmp_pos);
        selected_game_object.set_rotation(selected_tmp_rot);
    }
}

document.addEventListener('keydown', function(evt) {

    // Look at TO DO on OB and go back to to do on objec info struct to do

    if (evt.altKey && evt.key.toLowerCase() === 'v') 
    {
        creating_object = false;

        if (is_object_selected)
        {
            leave_selection_mode();
        }
        render.switch_debug_mode();
    }

    if (render.DEBUG_MODE && is_object_selected && object_selected != -1 && !creating_object)
    {
        if (evt.altKey && evt.key.toLowerCase() == 'c')
        {
            SHOW_COLLIDER = !SHOW_COLLIDER;
        }

        if (evt.altKey && evt.key.toLowerCase() == 'u')
        {
            // TO DO: This index should be what player select global value in debug utils
            // TO DO: Put this stuff in debgu utils and should have shortcut toi enable collider view
            // (tmp_min, tmp_max, tmp_pos, tmp_rot)

            trigger_recalculate_collider = true;
        }
        
        if (evt.key.toLowerCase() === 'w') {
            pos_z_down = -0.1;
        } else if (evt.key.toLowerCase() === 's') {
            pos_z_down = 0.1;
        }

        if (evt.key.toLowerCase() === 'd') {
            pos_x_down = -0.1;
        } else if (evt.key.toLowerCase() === 'a') {
            pos_x_down = 0.1;
        }

        if (evt.key.toLowerCase() === 'e') {
            pos_y_down = 0.1;
        } else if (evt.key.toLowerCase() === 'q') {
            pos_y_down = -0.1;
        }

        // DEBUG Control

        if (evt.key === 'ArrowUp') {
            rot_z_down = -0.1;
        } 
        else if (evt.key === 'ArrowDown') {
            rot_z_down = 0.1;
        }

        if (evt.key === 'ArrowRight') {
            rot_x_down = 0.1;
        } 
        else if (evt.key === 'ArrowLeft') {
            rot_x_down = -0.1;
        }

        if (evt.key.toLowerCase() === 'f') {
            rot_y_down = 0.1;
        } 
        else if (evt.key.toLowerCase() === 'h') {
            rot_y_down = -0.1;
        }

        if (evt.altKey && evt.key.toLowerCase() === 'b')
        {
            leave_selection_mode();
        }
    
        if (evt.altKey && evt.key.toLowerCase() === 'j')
        {
            save_selection_values(render.game_object_array[object_selected]);
        }
    }
    else if (render.DEBUG_MODE && is_object_selected && object_selected == -1)
    {
        console.log("ERROR: INVALID OBJECT SELECTED IN DEBIG OBJECT MOVING");
    }
    else if (render.DEBUG_MODE && !creating_object)
    {
        if (evt.altKey && evt.key.toLowerCase() === 'g')
        {
            creating_object = true;
            document.Create_Object_Values.style.display = "block"; 
        }
    }
});

document.addEventListener('keyup', function(evt) {
  
    if (render.DEBUG_MODE && is_object_selected && object_selected != -1 && !creating_object)
    {
        if (evt.key.toLowerCase() === 'w' || evt.key.toLowerCase() === 's') {  
            pos_z_down = 0;
        }

        if (evt.key.toLowerCase() === 'd' || evt.key.toLowerCase() === 'a') {
            pos_x_down = 0;
        }

        if (evt.key.toLowerCase() === 'e' || evt.key.toLowerCase() === 'q') {
            pos_y_down = 0;
        }
        
    // DEBUG Control

        if (evt.key === 'ArrowUp' || evt.key === 'ArrowDown') {
            rot_z_down = 0;
        }

        if (evt.key === 'ArrowRight' || evt.key === 'ArrowLeft') {
            rot_x_down = 0;
        }

        if (evt.key.toLowerCase() === 'f' || evt.key.toLowerCase() === 'h') {
            rot_y_down = 0;
        }
    }
    

}, false);

