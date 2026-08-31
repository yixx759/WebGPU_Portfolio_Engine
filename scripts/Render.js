import { parceObjFile } from './Obj_Parser.js';
import { makeColliderFromVerts, AABB, ray, ray_AABB_intersection, make_vertexs} from './Collider_Funcs.js'
import * as helper from './Helper_Funcs.js';
import * as object_info from './Object_Info_Struct.js'
import * as test_funcs from './Test_Funcs.js'
import * as BRDF_configs from './BRDF_Configs.js';
import * as light_manager from './Light_Manager.js';
import * as path_tracing from './Path_Tracing.js';
import * as sh_funcs from './SH_Funcs.js';
import * as player_struct from './Player_struct.js';
import * as model_parser from './Model_Parser.js';
import * as controls from './Controls.js';
import * as tmp_mem from './Temp_Mem.js';
import * as save_funcs from './Save_Funcs.js';
import * as debug_utils from './Debug_Utils.js';

const clear_color = { r: 0.0, g: 0.5, b: 1.0, a: 1.0 };

export const DEBUG_LOGS = true;
const TEST = false;
const SINGLE_TEST = false;

export var DEBUG_MODE = true;
export var debug_mode_changed = false;
export var tmp_debug_pos = tmp_mem.get_temp_memory_vector();

export const SAVE_CURRENT_STATE = true;
export const LOAD_CURRENT_STATE = true;

const TARGET_INDEX = 2;
export const MOVE_TARGET_TEST = false;

const PATH_TEST = false;

const PATH_ORIGIN = new Float32Array([0,0,-12.2]);
const PATH_DIR = helper.vector_norm(new Float32Array([0.37, 0.6, -1]));

// TO DO: Do that roation system casey did a article on research turns and normalized lerp
// TO DO: Validaiton with max amount of moidels and texture so cant create object
// with any more than that

export function print(string)
{
  console.log(string);
}

export function debugLog(...args) {
  if (DEBUG_LOGS) console.log(...args);
}

function new_ray_pos(pos1, pos2, colour_red_enabled, device, vertex_debug_buffer)
{
  const debug_line_vertex = new Float32Array([
    pos1[0], pos1[1], pos1[2],
    (colour_red_enabled ? 1 : 0), 0, 0,
    pos2[0], pos2[1], pos2[2],
    (colour_red_enabled ? 1 : 0), 0, 0
  ]);

  device.queue.writeBuffer(vertex_debug_buffer, 0, debug_line_vertex, 0, debug_line_vertex.length);
}

export let AMOUNT_OF_OBJECTS = 2 + 6;

export let game_object_array = [];

let model_array = [];

export let coeffs = new Float32Array(sh_funcs.TOTAL_COEFF * 3);

if (LOAD_CURRENT_STATE)
{
  // TO DO: Too much global state modfication. Needs re org.
  AMOUNT_OF_OBJECTS = await save_funcs.load_file(game_object_array, controls.cam_pos, coeffs);
}
else
{
  object_info.init_object_arrays(AMOUNT_OF_OBJECTS + 1) 
  game_object_array = player_struct.Set_Up_Objects();
}

console.log(game_object_array);

const PLAYER_INDEX = 0;
const OTHER_OB_INDEX = 1;

// Test prints
if (TEST) test_funcs.objectTestPrints(game_object_array[PLAYER_INDEX], game_object_array[OTHER_OB_INDEX]);

// TO DO: Add me to collider stuff?
// TO DO: Make acc player struct with cam pos and stuff
const player_collider = new Float32Array([1, 2, 1, 0]);

// Vertex and fragment shaders
const shader_code = await helper.load_shader("./shaders/burley-test.wgsl");

let shader_debug_code;
let collider_shader_debug_code;

if (DEBUG_LOGS)  shader_debug_code = await helper.load_shader("./shaders/debug_render.wgsl");
if (DEBUG_MODE)  collider_shader_debug_code = await helper.load_shader("./shaders/collider_debug_render.wgsl");

function errorCheck(whatever)
{
  if (!whatever) {
    throw Error('Couldn\'t find .') ;
  }
  else{
    console.log(whatever);
  }
}

export function switch_debug_mode()
{
  if (DEBUG_MODE == false)
  {
    DEBUG_MODE = true;
    debug_mode_changed = true;
  }
  else
  {
    controls.cam_pos.set([tmp_debug_pos[0], tmp_debug_pos[1], tmp_debug_pos[2]]);
    DEBUG_MODE = false;
  }
}

async function init() {

  if (DEBUG_MODE && !debug_mode_changed)
  {
    debug_mode_changed = true;
  }

  if (!navigator.gpu) {
    throw Error('WebGPU not supported.');
   }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw Error('Couldn\'t request WebGPU adapter.');
  }

  let device = await adapter.requestDevice();
  errorCheck(device);

  const shaderModule = device.createShaderModule({
    code: shader_code
  });

  errorCheck(shaderModule);

  let shader_debug_module;
  let collider_shader_debug_module;

   if (DEBUG_LOGS){
    shader_debug_module = device.createShaderModule({
    code: shader_debug_code
  });

  errorCheck(shader_debug_code);
 
  if (DEBUG_MODE){
    collider_shader_debug_module = device.createShaderModule({
    code: collider_shader_debug_code
  });

  errorCheck(collider_shader_debug_code);
  }

  // TO DO: Have 2 canvases
  const canvas = document.querySelector('#gpuCanvas');
  const context = canvas.getContext('webgpu');

  errorCheck(canvas);
  errorCheck(context);

  context.configure({
    device: device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    alphaMode: 'premultiplied'
  });

   errorCheck(context);
   await new Promise(requestAnimationFrame);

  let tex = context.getCurrentTexture(); 
  errorCheck(tex);
  let view1 = tex.createView(); 
  errorCheck(view1);


  const MODEL_CUBE_INDEX = await model_parser.add_model_to_array('resources/models/cube.obj', model_array);
  const MODEL_BUNNY_INDEX = await model_parser.add_model_to_array('resources/models/Bunny.obj', model_array);
  const MODEL_WALL_INDEX = await model_parser.add_model_to_array('resources/models/wall.obj', model_array);

  let max_verts = model_parser.get_max_verts(model_array);

  const vertexBuffer = device.createBuffer({
        size: max_verts * AMOUNT_OF_OBJECTS, 
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });

  let VERTEX_OFFSET = max_verts;

  {
    
  let tmp_min = new Float32Array(3);
  let tmp_max = new Float32Array(3);
  let tmp_pos = new Float32Array(4);
  let tmp_rot = new Float32Array(4);
  
  for (let i = 0; i < AMOUNT_OF_OBJECTS; i++) {   
    const vertex_index = game_object_array[i].get_model_index();
    console.log("Vertex indes: " + vertex_index)
    device.queue.writeBuffer(vertexBuffer, VERTEX_OFFSET * i, model_array[vertex_index], 0, model_array[vertex_index].length);

      if (!LOAD_CURRENT_STATE || !SINGLE_TEST || i < 1)
      {
        // TO DO: Get these better include in whatever file type is made
        game_object_array[i].set_half(makeColliderFromVerts(model_array[vertex_index]));
        game_object_array[i].update_collider_with_rot(tmp_min, tmp_max, tmp_pos, tmp_rot, helper.ZEROS);
      }
  }
}
 
  const vertex_buffers = [{
    attributes: [
    {
      shaderLocation: 0, // position
      offset: 0,
      format: 'float32x3'
    }, 
    {
      shaderLocation: 1, // tex
      offset: 12,
      format: 'float32x2'
    }, 
    {
      shaderLocation: 2, // normals
      offset: 20,
      format: 'float32x3'
    }
  ],
    arrayStride: 32,
    stepMode: 'vertex'
  }];

  const vertex_debug_buffer = device.createBuffer({
    size: 32*3*2*2, // size of 2 positions which are 3 float32 3s and 2 colors
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
  
    const collider_vertex_debug_buffer = device.createBuffer({
    size: 32*3*8, // size of 2 positions which are 3 float32 3s and 2 colors
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

  let debug_line_vertex;
  
  if (DEBUG_LOGS){
     debug_line_vertex = new Float32Array([
      0, 0, 0, 
      0, 0, 0, // Color
      5, 0, 0,
      1, 0, 0,// Color
    ]);

  device.queue.writeBuffer(vertex_debug_buffer, 0, debug_line_vertex, 0, debug_line_vertex.length);
  }

  let collider_box_vertex;

  if (DEBUG_MODE)
  {
    collider_box_vertex = make_vertexs(game_object_array);
    device.queue.writeBuffer(collider_vertex_debug_buffer, 0, collider_box_vertex, 0, collider_box_vertex.length);
  }

  let vertex_debug_buffers;

  if (DEBUG_LOGS){
    vertex_debug_buffers = [{
      attributes: [
      {
        shaderLocation: 0, // position
        offset: 0,
        format: 'float32x3'
      },
      {
      shaderLocation: 1, // color
      offset: 12,
      format: 'float32x3'
    }
    ],
      arrayStride: 24,
      stepMode: 'vertex'
    }];
  }

  let collider_vertex_debug_buffers;

  if (DEBUG_LOGS){
    collider_vertex_debug_buffers = [{
      attributes: [
      {
        shaderLocation: 0, // position
        offset: 0,
        format: 'float32x3'
      }
    ],
      arrayStride: 12,
      stepMode: 'vertex'
    }];
}

  const group0Layout = device.createBindGroupLayout({
    entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" }},
        { binding: 1, visibility:  GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }
      ],
  label: "bind group 0",
  });

  const group1Layout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} }
    ],

    label: "bind group 1",
  });

    const group2Layout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" }},
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" }},
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" }},
    ],

    label: "bind group 2",
  });

  const pipelineDescriptor = {
    vertex: {
      module: shaderModule,
      entryPoint: 'vertex_main',
      buffers: vertex_buffers
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fragment_main',
      targets: [{
        format: navigator.gpu.getPreferredCanvasFormat()
      }]
    },
    primitive: {
      topology: 'triangle-list',
    },
    depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus",
    },
    layout: device.createPipelineLayout({
    bindGroupLayouts: [
      group0Layout, // for mats
      group1Layout,  // for sampler + texture
      group2Layout  // for Lights
    ]
    })
  };

let pipelineDebugDescriptor;
let collider_pipelineDebugDescriptor;

if (DEBUG_LOGS){
 pipelineDebugDescriptor = {
    vertex: {
      module: shader_debug_module,
      entryPoint: 'vertex_main',
      buffers: vertex_debug_buffers
    },
    fragment: {
      module: shader_debug_module,
      entryPoint: 'fragment_main',
      targets: [{
        format: navigator.gpu.getPreferredCanvasFormat(),
        }]
    },
    primitive: {
      topology: 'line-list'
    },
    depthStencil: {
        depthWriteEnabled: false,
        depthCompare: "less",
        format: "depth24plus",
    },
    layout: device.createPipelineLayout({
    bindGroupLayouts: [
      group0Layout, // for mats
    ]
    })
  };
}

if (DEBUG_MODE) {
 collider_pipelineDebugDescriptor = {
    vertex: {
      module: collider_shader_debug_module,
      entryPoint: 'vertex_main',
      buffers: collider_vertex_debug_buffers
    },
    fragment: {
      module: collider_shader_debug_module,
      entryPoint: 'fragment_main',
      targets: [{
        format: navigator.gpu.getPreferredCanvasFormat(),
        blend: {
          color: {
            srcFactor: 'src-alpha',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add',
          },
          alpha: {
            srcFactor: 'one',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add',
          },
        },
      }]
    },
    primitive: {
      topology: 'triangle-list',
      frontFace: 'ccw',
      cullMode: 'none',
    },
    depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus",
    },
    layout: device.createPipelineLayout({
    bindGroupLayouts: [
      group0Layout, // for mats
    ]
    })
  };
}

var Time = Date.now();

const renderPipeline = device.createRenderPipeline(pipelineDescriptor);

let renderDebugPipeline;
let collider_renderDebugPipeline;

if (DEBUG_LOGS)
{
  renderDebugPipeline = device.createRenderPipeline(pipelineDebugDescriptor);
}
if (DEBUG_MODE)
{
  collider_renderDebugPipeline = device.createRenderPipeline(collider_pipelineDebugDescriptor);
}

// Matrixs

const IDENTITY = new Float32Array([
  1.0, 0.0, 0.0, 0.0,
  0.0, 1 , 0, 0.0,
  0.0, 0 , 1, 0.0,
  0 ,0.0, 0.0, 1.0,
  ]);

const testMAT = new Float32Array([
1.0, 0.0, 0.0, 0.0,
0.0, 1, 0, 0.0,
0.0, 0, 10/9, (10/9),
0.0, 0.0, -1, 0
]);

var worldMatrix = new Float32Array([
  1.0, 0.0, 0.0, 0.0,
  0.0, Math.cos(Time), -Math.sin(Time), 0.0,
  0.0, Math.sin(Time), Math.cos(Time), 0.0,
  0.0, 0.0, 0.0, 1.0,
  ]);

worldMatrix = testMAT;

const matrixSize = worldMatrix.byteLength;
const matrixAmount = AMOUNT_OF_OBJECTS;
const cam_pos_size = 4 * 4;

const roundUp = (v, alignment) => Math.ceil(v / alignment) * alignment;

let sizet = roundUp((matrixSize * matrixAmount + cam_pos_size), device.limits.minUniformBufferOffsetAlignment);

const Mats = device.createBuffer({
  size: sizet * AMOUNT_OF_OBJECTS, 
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(Mats, 0, worldMatrix, 0, worldMatrix.length);

const BRDF_PARAMS = device.createBuffer({
  size: object_info.SIZE_OF_BRDF_PARAMS_BYTES * AMOUNT_OF_OBJECTS, 
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

for (let i = 0; i < AMOUNT_OF_OBJECTS; i++)
{
  let BRDF_index = game_object_array[i].get_BRDF_index();

  const params = BRDF_configs.BRDF_config[BRDF_index];
  console.log("Index: " + BRDF_index)
  const size = params.length;
  device.queue.writeBuffer(BRDF_PARAMS, i * object_info.SIZE_OF_BRDF_PARAMS_BYTES, params, 0, params.length);
}

let bindGroupArray = [];
let bindDebugGroup;

for (let i = 0; i < AMOUNT_OF_OBJECTS; i++ ) {
  const bindGroup = device.createBindGroup({
  layout: renderPipeline.getBindGroupLayout(0),
  entries: [
      {binding: 0, resource: {
        buffer: Mats,
        offset: sizet * i
      }},
      {binding: 1, resource: {
        buffer: BRDF_PARAMS,
        offset: object_info.SIZE_OF_BRDF_PARAMS_BYTES * i
      }},
  ],
  });
  bindGroupArray.push(bindGroup);

  if (DEBUG_LOGS)
  {
  bindDebugGroup = device.createBindGroup({
      layout: renderDebugPipeline.getBindGroupLayout(0),
      entries: [
          {binding: 0, resource: {
            buffer: Mats,
            offset: 0
          }},
          {binding: 1, resource: {
            buffer: BRDF_PARAMS,
            offset: object_info.SIZE_OF_BRDF_PARAMS_BYTES*i
          }},
      ],
      });
  }
}

const url = 'resources/images/Bunny Texture.png';
const urlF = 'resources/images/f-texture.png';
const url_green = 'resources/images/green.png';
const url_tester = 'resources/images/uv_test_patchwork.png';

// if (PATH_TEST)

const source_data = await helper.load_image_data(url);
const sourceF_data = await helper.load_image_data(urlF);
const green_data = await helper.load_image_data(url_green);
const tester_data = await helper.load_image_data(url_tester);

let textures = [];

await model_parser.add_texture(device, url, textures);
await model_parser.add_texture(device, urlF, textures);
await model_parser.add_texture(device, url_green, textures);
await model_parser.add_texture(device, url_tester, textures);

const sampler = device.createSampler({
  addressModeU: 'repeat',
  addressModeV: 'repeat',
  magFilter: 'linear',
});

// IF PATH TEST
let textures_data = [source_data, sourceF_data, green_data, tester_data];

let bindGroupTexArray = [];

// If using same texture can re use bind group
// So just create bind group for texture (and noramls when added)
for (let i = 0; i < textures.length; i++){
const bindGroupTex = device.createBindGroup({
  layout: renderPipeline.getBindGroupLayout(1),
  entries: [
    {binding: 0, resource: sampler},
    {binding: 1, resource: textures[i].createView()},
  ],
})
  bindGroupTexArray.push(bindGroupTex);
}

// Lights
// struct DIR_LIGHT {
//   dir : vec3f,
//   intensity : f32
// }

const light_intensity = 0;
const dir_light_dir_and_intensity = new Float32Array([0, 0, 1, light_intensity]);

const Directional_Lights = device.createBuffer({
  size:  object_info.BYTES_OF_VECTOR3 + object_info.BYTES_OF_FLOAT_32, // dir (vec3) + intensity (f32)
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(Directional_Lights, 0, dir_light_dir_and_intensity, 0, dir_light_dir_and_intensity.length);

// struct POINT_LIGHT {
//   position : vec3f,
//   intensity : f32,
//   attenuation : f32
// }

// Light 1
light_manager.add_new_light(0,0,-12.2, 1, 2);

// Light 2 
light_manager.add_new_light(12, -2, -5, 0, 2);

const Point_Lights = device.createBuffer({
  size:  light_manager.ALIGNED_SIZE_OF_POINT_LIGHT_BYTES * light_manager.TOTAL_AMOUNT_OF_POINT_LIGHTS, 
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(Point_Lights, 0, light_manager.POINT_LIGHT_ARRAY, 0, light_manager.POINT_LIGHT_ARRAY.length);

if (PATH_TEST)
{
  debugLog("textures_data");
  debugLog(textures_data);
  coeffs = path_tracing.PATH_TRACE(PATH_ORIGIN, PATH_DIR, game_object_array, model_array, textures_data, dir_light_dir_and_intensity);
  debugLog("coeffs:");
  debugLog(coeffs);
}

const SH_COEFF = device.createBuffer({
  size:  3 * sh_funcs.TOTAL_COEFF * object_info.BYTES_OF_FLOAT_32, 
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

// if (PATH_TEST)
// {
  device.queue.writeBuffer(SH_COEFF, 0, coeffs, 0, coeffs.length);
  debugLog(coeffs);
// }

const lightBindGroup = device.createBindGroup({
  layout: renderPipeline.getBindGroupLayout(2),
  entries: [
      {binding: 0, resource: {
        buffer: Directional_Lights
      }},
      {binding: 1, resource: {
        buffer: Point_Lights
      }},
      {binding: 2, resource: {
        buffer: SH_COEFF
      }}
  ],
  });

  let tmp_cam_pos = new Float32Array(4);

  document.addEventListener('click', function(evt) {
  debugLog("clicked")

  if (DEBUG_MODE)
  {
    if (!debug_utils.is_object_selected && !debug_utils.creating_object)
    {
      debug_utils.debug_select_object(game_object_array, look_vector, device, collider_vertex_debug_buffer);
    }
  }

  if (DEBUG_LOGS && !PATH_TEST)
  {
    const MAG = 10;
    let dir = helper.vector_mult_scalar(look_vector, MAG);
    let ray_from_player_forward = new ray(controls.cam_pos[0], controls.cam_pos[1], controls.cam_pos[2], -dir[0], -dir[1], -dir[2]);

    let did_hit = false;

    const min_max = {min: new Float32Array(3), max: new Float32Array(3)};
    console.log("AMOUNT OF OBJS: " + AMOUNT_OF_OBJECTS);

    console.log("game_object_array[11]: " + game_object_array[10].get_position());

    for (let i = 0; i < AMOUNT_OF_OBJECTS; i++)
    {
      game_object_array[i].get_min_Into_Struct(min_max);
      game_object_array[i].get_max_Into_Struct(min_max);

      if (i == (AMOUNT_OF_OBJECTS - 1))
      {
        console.log("i: " + i);
        console.log("min: " + min_max.min);
        console.log("max: " + min_max.max);
      }

      if (ray_AABB_intersection(ray_from_player_forward, min_max.min, min_max.max))
      {
        console.log("Hit");
        did_hit = true;
      }
    }

    new_ray_pos(controls.cam_pos, ray_from_player_forward.get_ray_dest(), did_hit, device, vertex_debug_buffer);
  }
  }, false);

// key down enables a bool and key up disables it makes input smooth
const depthTexture = device.createTexture({
  size: [canvas.clientWidth, canvas.clientHeight , 1],
  format: "depth24plus",
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
});

if (false & PATH_TEST)
{
  const TEST_ORIGIN = new Float32Array([-7.737100124359131,-3.6731858253479004,-20.333486557006836]);
  const TEST_DIR = new Float32Array([0.18422017991542816,0.39131084084510803,-0.9016311764717102]);

  const MAG = 12.74056736299502;
  // const PATH_DIR = helper.vectorNorm(new Float32Array([-0.5153934702841967,0.3290491710254644,-0.791262417808319]));
  // const PATH_ORIGIN = new Float32Array([0,0,-12.2]);

  let res = false;

  res =  path_tracing.PATH_TRACE(PATH_ORIGIN, PATH_DIR, game_object_array,   model_array, textures_data, dir_light_dir_and_intensity);
  if (res){
    new_ray_pos(PATH_ORIGIN, helper.vector_add(PATH_ORIGIN, helper.vector_mult_scalar(PATH_DIR, MAG)), res[0][0], device, vertex_debug_buffer)
  }

  new_ray_pos(TEST_ORIGIN,  helper.vector_add(TEST_ORIGIN, helper.vector_mult_scalar(TEST_DIR, MAG)), 1, device, vertex_debug_buffer)
}

const CONST_TIME_DIV = 100;

// TO DO: Add to player?
let look_vector = new Float32Array([controls.forward_vector_mat[0] * Math.cos(controls.mouse_Y), Math.sin(controls.mouse_Y), controls.forward_vector_mat[2] * Math.cos(controls.mouse_Y)])

let tmp_pos = tmp_mem.get_temp_memory_vector();
let tmp_rot = tmp_mem.get_temp_memory_vector();
let tmp_half = tmp_mem.get_temp_memory_vector();

function render() {

  if (debug_utils.trigger_recalculate_collider)
  {
    debug_utils.recalculate_collider(game_object_array, device, collider_vertex_debug_buffer);
  }

  if (DEBUG_MODE && debug_utils.is_object_selected)
  {
    debug_utils.move_selected_object(game_object_array);
  }

  Time = Date.now() / CONST_TIME_DIV;
  
  let OBJECTS_TO_RENDER = SINGLE_TEST ? 1 : AMOUNT_OF_OBJECTS;

  if (debug_mode_changed == true)
  {
    tmp_debug_pos.set([controls.cam_pos[0], controls.cam_pos[1], controls.cam_pos[2]]);

    debug_mode_changed = false;
  }

  // NOTE: CHANGES CAM POS
  look_vector = controls.move_and_look(game_object_array, tmp_pos, tmp_half, player_collider, OBJECTS_TO_RENDER, MOVE_TARGET_TEST, SINGLE_TEST, DEBUG_MODE);
 
  if (SINGLE_TEST)
  {
    var viewMatix = helper.get_view_matrix(look_vector, helper.WORLD_UP_VECTOR, new Float32Array([0,0,0]));
  }
  else
  {
    var viewMatix = helper.get_view_matrix(look_vector, helper.WORLD_UP_VECTOR, controls.cam_pos);
  }

  var perMatrix = helper.get_perspective_matrix(70, 1, 1000);

  {
// TO DO: Put somewhere
  let tmp_World_Matrix = new Float32Array(4 * 4);
    assign_matrixs(device, viewMatix, perMatrix, OBJECTS_TO_RENDER, game_object_array, tmp_pos, tmp_rot, tmp_World_Matrix, Mats, matrixSize, sizet);
  }

  const commandEncoder = device.createCommandEncoder();

  const renderPassDescriptor = {
    colorAttachments: [{
      clearValue: clear_color,
      loadOp: 'clear',
      storeOp: 'store',
      view: context.getCurrentTexture().createView(),
    }],
    depthStencilAttachment: {
            view: depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: "clear",
            depthStoreOp: "store",
        },
  };

  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

  passEncoder.setPipeline(renderPipeline);
  
  passEncoder.setBindGroup(2, lightBindGroup);
  
  // This should be based on object indexs
  for (let i = 0; i < OBJECTS_TO_RENDER; i++)
  {
    const vert_index = game_object_array[i].get_model_index();
    const tex_index = game_object_array[i].get_texture_index();
    const id = game_object_array[i].ID;

    passEncoder.setBindGroup(0, bindGroupArray[id]);
    passEncoder.setBindGroup(1, bindGroupTexArray[tex_index]);
    passEncoder.setVertexBuffer(0, vertexBuffer, VERTEX_OFFSET * id, model_array[vert_index].byteLength);
    passEncoder.draw(model_array[vert_index].length / 8);
  }

  if (DEBUG_LOGS)
  {
    passEncoder.setPipeline(renderDebugPipeline);
    passEncoder.setBindGroup(0, bindDebugGroup);
    passEncoder.setVertexBuffer(0, vertex_debug_buffer, 0, debug_line_vertex.byteLength);
    passEncoder.draw(2);
  }
 
  // TO DO: Generalize this
  if (debug_utils.SHOW_COLLIDER)
  {
    passEncoder.setPipeline(collider_renderDebugPipeline);
    passEncoder.setBindGroup(0, bindDebugGroup);
    passEncoder.setVertexBuffer(0, collider_vertex_debug_buffer, 0, collider_box_vertex.byteLength);
    passEncoder.draw(36);
  }
  
  passEncoder.end();
  
  device.queue.submit([commandEncoder.finish()]);
  requestAnimationFrame(render);
}
  requestAnimationFrame(render);
}
}

function assign_matrixs(device, viewMatix, perMatrix, OBJECTS_TO_RENDER, game_object_array, tmp_pos, tmp_rot, tmp_World_Matrix, Mats, matrixSize, sizet)
{
  let tmp_scale = 0;

  for(let i = 0; i < OBJECTS_TO_RENDER; i++ )
  {
    if (SINGLE_TEST)
    {
      game_object_array[i].set_position(controls.cam_pos);
      game_object_array[i].set_rotation( new Float32Array([0,controls.keyY,0]));
    }

    if (MOVE_TARGET_TEST && TARGET_INDEX == i)
    {
      game_object_array[i].set_position( new Float32Array([debug_target_keyX,debug_target_keyY,debug_target_keyZ]));
      game_object_array[i].set_rotation( new Float32Array([90,0,0]));
    }

     if (MOVE_TARGET_TEST && TARGET_INDEX == i)
    {
      if (false & PATH_TEST)
      {
        debugLog(tmp_pos);
        path_tracing.transform_vertexs(verticies_obj_wall, game_object_array[i]);
      }
    }

    // TO DO: Dirty bit
    // TO DO: World_Matrix, tmp_pos, tmp_rot add params use temp meory for matrix maybe
    // or just creat one.
    // PRINT INSIDE DIRTY AND OUTSIDE DIRTY Branch
    let worldMatrix = game_object_array[i].get_world_matrix(tmp_World_Matrix, tmp_pos, tmp_rot);

    device.queue.writeBuffer(Mats, i * sizet + 0, worldMatrix);
    device.queue.writeBuffer(Mats, i * sizet + matrixSize, viewMatix );
    device.queue.writeBuffer(Mats, i * sizet + matrixSize * 2, perMatrix);
    device.queue.writeBuffer(Mats, i * sizet + matrixSize * 3, controls.cam_pos);
  }
}

export function click_object(game_object_array, look_vector)
{
   const MAG = 10;
    let dir = helper.vector_mult_scalar(look_vector, MAG);
    let ray_from_player_forward = new ray(controls.cam_pos[0], controls.cam_pos[1], controls.cam_pos[2], -dir[0], -dir[1], -dir[2]);

    let did_hit = false;

    const min_max = {min: new Float32Array(3), max: new Float32Array(3)};

    for (let i = 0; i < AMOUNT_OF_OBJECTS; i++)
    {
      game_object_array[i].get_min_into_struct(min_max);
      game_object_array[i].get_max_into_struct(min_max);

      // console.log("Max: " + min_max.max);
      // console.log("Min: " + min_max.min);

      if (ray_AABB_intersection(ray_from_player_forward, min_max.min, min_max.max))
      {
        return i;
      }
    }
    return -1;
}

export function update_collider_vertex(device, game_object_array, collider_vertexDebugBuffer, target)
{
    let collider_box_vertex = make_vertexs(game_object_array, target);
    device.queue.writeBuffer(collider_vertexDebugBuffer, 0, collider_box_vertex, 0, collider_box_vertex.length);
}

export function get_object_half(game_object)
{
  const vertex_index = game_object.get_model_index();

  let tmp_min = new Float32Array(3);
  let tmp_max = new Float32Array(3);
  let tmp_pos = new Float32Array(4);
  let tmp_rot = new Float32Array(4);

  console.log(vertex_index);
  console.log(model_array[vertex_index]);
  
  game_object.set_half(makeColliderFromVerts(model_array[vertex_index]));
  game_object.update_collider_with_rot(tmp_min, tmp_max, tmp_pos, tmp_rot, helper.ZEROS); 
}


init();
