import * as render from './Render.js';
import * as helper from './helperFuncs.js';

export let is_object_selected = false;
export let object_selected = -1;

export const DEBUG_COLLIDER_OBJECT = 0;
export let trigger_recalculate_collider = false;

let tmp_pos = new Float32Array(3);
let tmp_rot = new Float32Array(3);
let tmp_scale = -1;

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

export function reset_collider_recalc_trigger()
{
    trigger_recalculate_collider = false;
}

export function recalculate_collider(gameObjectArray, device, collider_vertexDebugBuffer)
{
    let tmp_min = new Float32Array(3);
    let tmp_max = new Float32Array(4);
    let tmp_pos = new Float32Array(4);
    let tmp_rot = new Float32Array(4);

    gameObjectArray[object_selected].update_collider_with_rot(tmp_min, tmp_max, tmp_pos, tmp_rot);
    render.update_collider_vertex(device, gameObjectArray, collider_vertexDebugBuffer, object_selected);
    reset_collider_recalc_trigger();

}

function reset_object_values(selected_game_obj)
{
    selected_game_obj.setPosition(tmp_pos);
    selected_game_obj.setRotation(tmp_rot);
    selected_game_obj.setScale(tmp_scale);
}

function leave_selection_mode()
{
    reset_object_values(render.gameObjectArray[object_selected]); 
    object_selected = -1;
    is_object_selected = false;  
}

function save_selection_values(selected_game_obj)
{
    selected_game_obj.getPosition_Into(tmp_pos);
    selected_game_obj.getRotation_Into(tmp_rot);
    tmp_scale = selected_game_obj.getScale();

}

export function debug_select_object(gameObjectArray, look_vector, device, collider_vertexDebugBuffer)
{
    if (!render.DEBUG_MODE) {console.log("Debug select ERROR: not in debug")}

    if (!is_object_selected){
        let object_index = render.click_object(gameObjectArray, look_vector);
        
        if (object_index != -1)
        {
            is_object_selected = true;
            object_selected = object_index;

            // TO DO: Should save pos / rot / scale
            const selected_game_obj = gameObjectArray[object_index];
            save_selection_values(selected_game_obj);
            render.update_collider_vertex(device, gameObjectArray, collider_vertexDebugBuffer, object_selected);
            console.log("Object selected: " + object_selected);
        }
    }
}

let selected_tmp_pos = new Float32Array(4);
let selected_tmp_rot = new Float32Array(4);
let selected_tmp_scale = -1;

export function move_selected_object(gameObjectArray)
{
    if (render.DEBUG_MODE && is_object_selected && object_selected != -1)
    {
        const selected_game_object = gameObjectArray[object_selected];
        
        selected_game_object.getPosition_Into(selected_tmp_pos);
        selected_game_object.getRotation_Into(selected_tmp_rot);
        selected_tmp_scale = selected_game_object.getScale();

        selected_tmp_pos = helper.vectorAdd(selected_tmp_pos, new Float32Array([pos_x_down, pos_y_down, pos_z_down]), true);
        selected_tmp_rot = helper.vectorAdd(selected_tmp_rot, new Float32Array([rot_x_down * 2, rot_y_down * 2, rot_z_down * 2]), true);

        selected_game_object.setPosition(selected_tmp_pos);
        selected_game_object.setRotation(selected_tmp_rot);
    }
}

document.addEventListener('keydown', function(evt) {

    // Look at TO DO on OB and go back to to do on objec info struct to do


    if (evt.altKey && evt.key.toLowerCase() === 'v') 
    {
        if (is_object_selected)
        {
            leave_selection_mode();
        }
        render.switch_debug_mode();
    }

    if (render.DEBUG_MODE && is_object_selected && object_selected != -1)
    {
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
            save_selection_values(render.gameObjectArray[object_selected]);
        }
    }
    else if (render.DEBUG_MODE && is_object_selected && object_selected == -1)
    {
        console.log("ERROR: INVALID OBJECT SELECTED IN DEBIG OBJECT MOVING");
    }
 
});

document.addEventListener('keyup', function(evt) {
  
    if (render.DEBUG_MODE && is_object_selected && object_selected != -1)
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

