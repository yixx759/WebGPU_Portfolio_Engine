import * as render from './Render.js';
export let is_object_selected = false;
export let object_selected = -1;

export const DEBUG_COLLIDER_OBJECT = 0;
export let DELETE_ME = false;

// If DEBUG_MODE on allow for object selection and fill in obj selec
// Rember when DEBUG turned off object selected and is obj needs tuirned off
// Make func to disable and enable this.
// Ray cast func from render, returns index of object to change/
// Test right index first, Then arrow keys to move and rotate adn scale
// This should happen instead of normal moving, add an if or something
// When esc be able to move again normally in debug, rember to reset is object when out of debug and out of seleciton into debug

export function debug_select_object(gameObjectArray, look_vector)
{
    if (!render.DEBUG_MODE) {console.log("Debug select ERROR: not in debug")}
    let object_index = render.click_object(gameObjectArray, look_vector);
    console.log("Index is: " + object_index);
}

document.addEventListener('keydown', function(evt) {

    // Look at TO DO on OB and go back to to do on objec info struct to do

    if (render.DEBUG_MODE)
    {
    if (evt.altKey && evt.key.toLowerCase() == 'u')
    {
        // TO DO: This index should be what player select global value in debug utils
        // TO DO: Put this stuff in debgu utils and should have shortcut toi enable collider view
        // (tmp_min, tmp_max, tmp_pos, tmp_rot)

        DELETE_ME = true;
    }
    }
    if (evt.altKey && evt.key.toLowerCase() === 'v') 
    {
        render.switch_debug_mode();
    }



  
});