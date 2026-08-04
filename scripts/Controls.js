import * as render from './Render.js';
import * as helper from './helperFuncs.js';
import * as save_funcs from './Save_Funcs.js'
import { makeColliderFromVerts, AABB, ray, ray_AABB_intersection} from './colliderFuncs.js'

const canvas = document.querySelector('#gpuCanvas');

export const targetPos = [0,0,2];
export const up = [0,1,0];

const DEBUG_TARGET_SENSITIVITY = 1;

export var debug_target_keyX = 0;
export var debug_target_keyXDown = 0;
export var debug_target_keyY = 0;
export var debug_target_keyYDown = 0;
export var debug_target_keyZ = 0;
export var debug_target_keyZDown = 0;

export var keyX = 0;
export var keyXDown = 0;
export var keyY = 0;
export var keyYDown = 0;
export var keyZ = 0;
export var keyZDown = 0;

const MOUSE_SPEED_X = 0.005;
const MOUSE_SPEED_Y = 0.005;

const Y_ANGLE_CAM_CLAMP = 50 * Math.PI / 180;

export var mouse_X = 0;
export var mouse_Y = 0;

const activeKeys = new Set();

document.addEventListener('keydown', function(evt) {
  if (evt.key.toLowerCase() === 'w') {
    render.debugLog("Up");
    keyZDown = -0.1;
  } else if (evt.key.toLowerCase() === 's') {
    render.debugLog("Down");
    keyZDown = 0.1;
  }

  if (evt.key.toLowerCase() === 'd') {
    render.debugLog("Right");
    keyXDown = -0.1;
  } else if (evt.key.toLowerCase() === 'a') {
    render.debugLog("Left");
    keyXDown = 0.1;
  }

  if (evt.key.toLowerCase() === 'e') {
    render.debugLog("forward");
    keyYDown = 0.1;
  } else if (evt.key.toLowerCase() === 'q') {
    render.debugLog("down");
    keyYDown = -0.1;
  }

  // DEBUG Control

  if (render.MOVE_TARGET_TEST)
  {
    if (evt.key.toLowerCase() === 'ArrowUp') {
    render.debugLog("Debug Up");
    debug_target_keyZDown = -0.1;
  } else if (evt.key.toLowerCase() === 'ArrowDown') {
    render.debugLog("Debug Down");
    debug_target_keyZDown = 0.1;
  }

  if (evt.key.toLowerCase() === 'ArrowRight') {
    render.debugLog("Debug Right");
    debug_target_keyXDown = 0.1;
  } else if (evt.key.toLowerCase() === 'ArrowLeft') {
    render.debugLog("Debug Left");
    debug_target_keyXDown = -0.1;
  }

  if (evt.key.toLowerCase() === 'f') {
    render.debugLog("Debug forward");
    debug_target_keyYDown = 0.1;
  } else if (evt.key.toLowerCase() === 'h') {
    render.debugLog("Debug down");
    debug_target_keyYDown = -0.1;
  }
  }

  if (render.SAVE_CURRENT_STATE)
  {
      if (evt.ctrlKey && evt.key.toLowerCase() == 'm')
      {
        console.log("Save!");
        save_funcs.save_file(render.AMOUNT_OF_OBJECTS, render.gameObjectArray, camPos, render.coeffs);
      }
  }

}, false);

document.addEventListener('keyup', function(evt) {
  
    if (evt.key.toLowerCase() === 'w' || evt.key.toLowerCase() === 's') {
        render.debugLog("debug Z stop");
        keyZDown = 0;
      }

    if (evt.key.toLowerCase() === 'd' || evt.key.toLowerCase() === 'a') {
      render.debugLog("debug X stop");
      keyXDown = 0;
    }

    if (evt.key.toLowerCase() === 'e' || evt.key.toLowerCase() === 'q') {
      render.debugLog("debug Y stop");
      keyYDown = 0;
    }
    
  // DEBUG Control

  if (render.MOVE_TARGET_TEST)
      {
    if (evt.key.toLowerCase() === 'ArrowUp' || evt.key.toLowerCase() === 'ArrowDown') {
      render.debugLog("Z stop");
      debug_target_keyZDown = 0;
    }

    if (evt.key.toLowerCase() === 'ArrowRight' || evt.key.toLowerCase() === 'ArrowLeft') {
      render.debugLog("X stop");
      debug_target_keyXDown = 0;
    }

    if (evt.key.toLowerCase() === 'f' || evt.key.toLowerCase() === 'h') {
      render.debugLog("Y stop");
      debug_target_keyYDown = 0;
    }
      }

}, false);

document.addEventListener('mousemove', function(evt) {
    mouse_X = mouse_X + evt.movementX * MOUSE_SPEED_X;
    mouse_Y = Math.max(Math.min(mouse_Y - evt.movementY * MOUSE_SPEED_Y, Y_ANGLE_CAM_CLAMP), -Y_ANGLE_CAM_CLAMP);
})

canvas.addEventListener("click", async () => {
   if (document.pointerLockElement != canvas) {
      await canvas.requestPointerLock();
   }
});

// Put up here to avoid re allocation
export var camPos = new Float32Array([0,0,10, 1]);
export var camPosPrev = new Float32Array([0,0,0, 1]);
export var forward_vector_mat = new Float32Array([Math.cos(mouse_X), -Math.sin(mouse_X), Math.sin(mouse_X), Math.cos(mouse_X)]);

export function move_and_look(gameObjectArray, tmp_pos, tmp_half, player_collider, OBJECTS_TO_RENDER, MOVE_TARGET_TEST, SINGLE_TEST)
{
// debugLog("mouse x: " + mouse_X);
  // debugLog("mouse y: " + mouse_Y);

  if (MOVE_TARGET_TEST)
  {
    debug_target_keyX += debug_target_keyXDown * DEBUG_TARGET_SENSITIVITY;
    debug_target_keyY += debug_target_keyYDown * DEBUG_TARGET_SENSITIVITY;
    debug_target_keyZ += debug_target_keyZDown * DEBUG_TARGET_SENSITIVITY;
  }

  forward_vector_mat.set([Math.cos(mouse_X), -Math.sin(mouse_X), Math.sin(mouse_X), Math.cos(mouse_X)]);

  if (SINGLE_TEST)
  {
    helper.vector_add_cam(camPos, keyXDown, keyZDown);
  }
  else
  {
    helper.vector_add_cam(camPos, keyZDown * forward_vector_mat[0] + keyXDown * forward_vector_mat[1], keyZDown * forward_vector_mat[2] + keyXDown * forward_vector_mat[3]);
  }
 
  for (let i = 0; i < OBJECTS_TO_RENDER; i++)
  {
    gameObjectArray[i].getPosition_Into(tmp_pos);
    gameObjectArray[i].getHalf_Into(tmp_half);
    
    if (AABB(tmp_pos, tmp_half, camPos, player_collider) && !SINGLE_TEST)
    {
      helper.vector_assign_cam(camPos, camPosPrev);
    }
  }
  
  helper.vector_assign_cam(camPosPrev, camPos);

  //TO Do : make new target pos forward vec and use new const.
  // First xz vector = cos(mouseX) , 0  ,sin(mouseX)
  // First (xz)y vector = cos(mouseX) * cos(mouseY), sin(mouseY)  ,sin(mouseX) * cos(mouseY)
  let look_vector = new Float32Array([forward_vector_mat[0] * Math.cos(mouse_Y), Math.sin(mouse_Y), forward_vector_mat[2] * Math.cos(mouse_Y)]);
 
  return look_vector;
}