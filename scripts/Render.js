import { parceObjFile } from './objParser.js';
import { makeColliderFromVerts, AABB, ray, ray_AABB_intersection} from './colliderFuncs.js'
import * as helper from './helperFuncs.js';
import * as objectInfo from './objectInfoStruct.js'
import * as testFuncs from './testFuncs.js'
import * as BRDF_configs from './BRDF_configs.js';
import * as Light_Manager from './Light_Manager.js';
import * as Path_Tracing from './Path_Tracing.js';
import * as sh_funcs from './SH_Funcs.js';
import * as player_struct from './Player_struct.js';
import * as model_parser from './Model_Parser.js';
import * as controls from './Controls.js';
import * as tmp_mem from './Temp_Mem.js';
import * as save_funcs from './Save_Funcs.js';

const clearColor = { r: 0.0, g: 0.5, b: 1.0, a: 1.0 };

export const DEBUG = true;
const TEST = false;
const SINGLE_TEST = false;

export const SAVE_CURRENT_STATE = true;
export const LOAD_CURRENT_STATE = true;

const TARGET_INDEX = 2;
export const MOVE_TARGET_TEST = false;

const PATH_TEST = false;

const PATH_ORIGIN = new Float32Array([0,0,-12.2]);
const PATH_DIR = helper.vectorNorm(new Float32Array([0.37, 0.6, -1]));

// TO DO: Do that roation system casey did a article on research turns and normalized lerp
// TO DO: Validaiton with max amount of moidels and texture so cant create object
// with any more than that

export function print(string)
{
  console.log(string);
}

export function debugLog(...args) {
  if (DEBUG) console.log(...args);
}

function newRayPos(pos1, pos2, colour_red_enabled, device, vertexDebugBuffer)
{
  const debugLineVertex = new Float32Array([
    pos1[0], pos1[1], pos1[2],
    (colour_red_enabled ? 1 : 0), 0, 0,
    pos2[0], pos2[1], pos2[2],
    (colour_red_enabled ? 1 : 0), 0, 0
  ]);

  device.queue.writeBuffer(vertexDebugBuffer, 0, debugLineVertex, 0, debugLineVertex.length);
}

export const AMOUNT_OF_OBJECTS = 2 + 6;

export let gameObjectArray = [];

if (LOAD_CURRENT_STATE)
{
  // TO DO: Too much global state modfication. Needs re org.
  await save_funcs.load_file(gameObjectArray, controls.camPos);
}
else
{
  gameObjectArray = player_struct.Set_Up_Objects();
}

console.log(gameObjectArray);

const PLAYER_INDEX = 0;
const OTHER_OB_INDEX = 1;

// Test prints
if (TEST) testFuncs.objectTestPrints(gameObjectArray[PLAYER_INDEX], gameObjectArray[OTHER_OB_INDEX]);

// TO DO: Add me to collider stuff?
// TO DO: Make acc player struct with cam pos and stuff
const playerCollider = new Float32Array([1, 2, 1, 0]);

// Vertex and fragment shaders
const shaderCode = await helper.loadShader("./shaders/burley-test.wgsl");

let shaderDebugCode;

if (DEBUG)  shaderDebugCode = await helper.loadShader("./shaders/debug_render.wgsl");

function errorCheck(whatever)
{
  if (!whatever) {
    throw Error('Couldn\'t find .') ;
  }
  else{
    console.log(whatever);
  }
}

async function init() {
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
    code: shaderCode
  });

  errorCheck(shaderModule);

  let shaderDebugModule;

  if (DEBUG){
    shaderDebugModule = device.createShaderModule({
    code: shaderDebugCode
  });

  errorCheck(shaderDebugCode);
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

  let Model_Array = [];

  const MODEL_CUBE_INDEX = await model_parser.add_model_to_array('resources/models/cube.obj', Model_Array);
  const MODEL_BUNNY_INDEX = await model_parser.add_model_to_array('resources/models/Bunny.obj', Model_Array);
  const MODEL_WALL_INDEX = await model_parser.add_model_to_array('resources/models/wall.obj', Model_Array);

  let max_verts = model_parser.get_max_verts(Model_Array);

  const vertexBuffer = device.createBuffer({
        size: max_verts * AMOUNT_OF_OBJECTS, 
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });

  let VERTEX_OFFSET = max_verts;

  for (let i = 0; i < AMOUNT_OF_OBJECTS; i++) {   
    const vertex_index = gameObjectArray[i].getModelIndex();

    device.queue.writeBuffer(vertexBuffer, VERTEX_OFFSET * i, Model_Array[vertex_index], 0, Model_Array[vertex_index].length);

      if (!SINGLE_TEST || i < 1)
      {
        // TO DO: Get these better include in whatever file type is made
        gameObjectArray[i].setHalf(makeColliderFromVerts(Model_Array[0]));
      }
  }
 
  const vertexBuffers = [{
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

  const vertexDebugBuffer = device.createBuffer({
    size: 32*3*2*2, // size of 2 positions which are 3 float32 3s and 2 colors
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

  let debugLineVertex;
  
  if (DEBUG){
     debugLineVertex = new Float32Array([
      0, 0, 0, 
      0, 0, 0, // Color
      5, 0, 0,
      1, 0, 0,// Color
    ]);

  device.queue.writeBuffer(vertexDebugBuffer, 0, debugLineVertex, 0, debugLineVertex.length);
  }

  let vertexDebugBuffers;

  if (DEBUG){
    vertexDebugBuffers = [{
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
      buffers: vertexBuffers
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fragment_main',
      targets: [{
        format: navigator.gpu.getPreferredCanvasFormat()
      }]
    },
    primitive: {
      topology: 'triangle-list'
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

if (DEBUG){
 pipelineDebugDescriptor = {
    vertex: {
      module: shaderDebugModule,
      entryPoint: 'vertex_main',
      buffers: vertexDebugBuffers
    },
    fragment: {
      module: shaderDebugModule,
      entryPoint: 'fragment_main',
      targets: [{
        format: navigator.gpu.getPreferredCanvasFormat()
      }]
    },
    primitive: {
      topology: 'line-list'
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

if (DEBUG)
{
    renderDebugPipeline = device.createRenderPipeline(pipelineDebugDescriptor);
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
const camPosSize = 4 * 4;

const roundUp = (v, alignment) => Math.ceil(v / alignment) * alignment;

let sizet = roundUp((matrixSize * matrixAmount + camPosSize), device.limits.minUniformBufferOffsetAlignment);

const Mats = device.createBuffer({
  size: sizet * AMOUNT_OF_OBJECTS, 
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(Mats, 0, worldMatrix, 0, worldMatrix.length);

const BRDF_PARAMS = device.createBuffer({
  size: objectInfo.SIZE_OF_BRDF_PARAMS_BYTES * AMOUNT_OF_OBJECTS, 
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

for (let i = 0; i < AMOUNT_OF_OBJECTS; i++)
{
  let BRDF_index = gameObjectArray[i].getBRDFIndex();

  const params = BRDF_configs.BRDF_config[BRDF_index];
  
  const size = params.length;
  device.queue.writeBuffer(BRDF_PARAMS, i * objectInfo.SIZE_OF_BRDF_PARAMS_BYTES, params, 0, params.length);
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
        offset: objectInfo.SIZE_OF_BRDF_PARAMS_BYTES * i
      }},
  ],
  });
  bindGroupArray.push(bindGroup);

  if (DEBUG)
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
            offset: objectInfo.SIZE_OF_BRDF_PARAMS_BYTES*i
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

// const source_data = await helper.loadImageData(url);
// const sourceF_data = await helper.loadImageData(urlF);
// const green_data = await helper.loadImageData(url_green);
// const tester_data = await helper.loadImageData(url_tester);

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
//let textures_data = [source_data, sourceF_data, green_data, tester_data];

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
  size:  objectInfo.BYTES_OF_VECTOR3 + objectInfo.BYTES_OF_FLOAT_32, // dir (vec3) + intensity (f32)
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(Directional_Lights, 0, dir_light_dir_and_intensity, 0, dir_light_dir_and_intensity.length);

// struct POINT_LIGHT {
//   position : vec3f,
//   intensity : f32,
//   attenuation : f32
// }

// Light 1
Light_Manager.add_new_light(0,0,-12.2, 1, 2);

// Light 2 
Light_Manager.add_new_light(12, -2, -5, 0, 2);

const Point_Lights = device.createBuffer({
  size:  Light_Manager.ALIGNED_SIZE_OF_POINT_LIGHT_BYTES * Light_Manager.TOTAL_AMOUNT_OF_POINT_LIGHTS, 
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(Point_Lights, 0, Light_Manager.POINT_LIGHT_ARRAY, 0, Light_Manager.POINT_LIGHT_ARRAY.length);

if (PATH_TEST)
{
  const coeffs = Path_Tracing.PATH_TRACE(PATH_ORIGIN, PATH_DIR, gameObjectArray,   Model_Array, textures_data, dir_light_dir_and_intensity);
}

const SH_COEFF = device.createBuffer({
  size:  3 * sh_funcs.TOTAL_COEFF * objectInfo.BYTES_OF_FLOAT_32, 
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

if (PATH_TEST)
{
  device.queue.writeBuffer(SH_COEFF, 0, coeffs, 0, coeffs.length);
  debugLog(coeffs);
}

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

let tmpCamPos = new Float32Array(4);

if (DEBUG && !PATH_TEST)
{
  document.addEventListener('click', function(evt) {
    debugLog("clicked")

    const MAG = new Float32Array([10,10,10]);
    let dir = helper.vector_mult(look_vector, MAG);
    let ray_from_player_forward = new ray(controls.camPos[0], controls.camPos[1], controls.camPos[2], -dir[0], -dir[1], -dir[2]);

    let did_hit = false;

    const min_max = {min: new Float32Array(3), max: new Float32Array(3)};

    for (let i = 0; i < AMOUNT_OF_OBJECTS; i++)
    {
      gameObjectArray[i].get_min_Into(min_max);
      gameObjectArray[i].get_max_Into(min_max);

      if (ray_AABB_intersection(ray_from_player_forward, min_max.min, min_max.max))
      {
        did_hit = true;
      }
    }

    newRayPos(controls.camPos, ray_from_player_forward.get_ray_dest(), did_hit, device, vertexDebugBuffer)
  }, false);
}

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

  res =  Path_Tracing.PATH_TRACE(PATH_ORIGIN, PATH_DIR, gameObjectArray,   Model_Array, textures_data, dir_light_dir_and_intensity);
  if (res){
    newRayPos(PATH_ORIGIN, helper.vectorAdd(PATH_ORIGIN, helper.vector_mult_scalar(PATH_DIR, MAG)), res[0][0], device, vertexDebugBuffer)
  }

  newRayPos(TEST_ORIGIN,  helper.vectorAdd(TEST_ORIGIN, helper.vector_mult_scalar(TEST_DIR, MAG)), 1, device, vertexDebugBuffer)
}

const CONST_TIME_DIV = 100;

// TO DO: Add to player?
let look_vector = new Float32Array([controls.forward_vector_mat[0] * Math.cos(controls.mouse_Y), Math.sin(controls.mouse_Y), controls.forward_vector_mat[2] * Math.cos(controls.mouse_Y)])

let tmp_pos = tmp_mem.get_temp_memory_vector();
let tmp_rot = tmp_mem.get_temp_memory_vector();
let tmp_half = tmp_mem.get_temp_memory_vector();

function render() {
  Time = Date.now() / CONST_TIME_DIV;
  
  let OBJECTS_TO_RENDER = SINGLE_TEST ? 1 : AMOUNT_OF_OBJECTS;

  // NOTE: CHANGES CAM POS
  look_vector = controls.move_and_look(gameObjectArray, tmp_pos, tmp_half, playerCollider, OBJECTS_TO_RENDER, MOVE_TARGET_TEST, SINGLE_TEST);
 
  if (SINGLE_TEST)
  {
    var viewMatix = helper.getViewMatrix(look_vector, helper.WORLD_UP_VECTOR, new Float32Array([0,0,0]));
  }
  else
  {
    var viewMatix = helper.getViewMatrix(look_vector, helper.WORLD_UP_VECTOR, controls.camPos);
  }

  var perMatrix = helper.getPerspectiveMatrix(70, 1, 1000);

  {


// TO DO: Put somewhere
  let tmp_World_Matrix = new Float32Array(4 * 4);
  assign_matrixs(device, viewMatix, perMatrix, OBJECTS_TO_RENDER, gameObjectArray, tmp_pos, tmp_rot, tmp_World_Matrix, Mats, matrixSize, sizet);
}

  const commandEncoder = device.createCommandEncoder();

  const renderPassDescriptor = {
    colorAttachments: [{
      clearValue: clearColor,
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
    const vert_index = gameObjectArray[i].getModelIndex();
    const tex_index = gameObjectArray[i].getTextureIndex();
    const id = gameObjectArray[i].ID;

    passEncoder.setBindGroup(0, bindGroupArray[id]);
    passEncoder.setBindGroup(1, bindGroupTexArray[tex_index]);
    passEncoder.setVertexBuffer(0, vertexBuffer, VERTEX_OFFSET * id, Model_Array[vert_index].byteLength);
    passEncoder.draw(Model_Array[vert_index].length / 8);
  }

  if (DEBUG)
  {
    passEncoder.setPipeline(renderDebugPipeline);
    passEncoder.setBindGroup(0, bindDebugGroup);
    passEncoder.setVertexBuffer(0, vertexDebugBuffer, 0, debugLineVertex.byteLength);
    passEncoder.draw(2);
  }
  
  passEncoder.end();
  
  device.queue.submit([commandEncoder.finish()]);
  requestAnimationFrame(render);
}
  requestAnimationFrame(render);
}

function assign_matrixs(device, viewMatix, perMatrix, OBJECTS_TO_RENDER, gameObjectArray, tmp_pos, tmp_rot, tmp_World_Matrix, Mats, matrixSize, sizet)
{
  let tmp_scale = 0;

  for(let i = 0; i < OBJECTS_TO_RENDER; i++ )
  {
    if (SINGLE_TEST)
    {
      gameObjectArray[i].setPosition(controls.camPos);
      gameObjectArray[i].setRotation( new Float32Array([0,controls.keyY,0]));
    }

    if (MOVE_TARGET_TEST && TARGET_INDEX == i)
    {
      gameObjectArray[i].setPosition( new Float32Array([debug_target_keyX,debug_target_keyY,debug_target_keyZ]));
      gameObjectArray[i].setRotation( new Float32Array([90,0,0]));
    }

     if (MOVE_TARGET_TEST && TARGET_INDEX == i)
    {
      if (PATH_TEST)
      {
        debugLog(tmp_pos);
        Path_Tracing.transform_vertexs(verticies_obj_wall, gameObjectArray[i]);
      }
    }

    // TO DO: Dirty bit
    // TO DO: World_Matrix, tmp_pos, tmp_rot add params use temp meory for matrix maybe
    // or just creat one.
    // PRINT INSIDE DIRTY AND OUTSIDE DIRTY Branch
    let worldMatrix = gameObjectArray[i].get_world_matrix(tmp_World_Matrix, tmp_pos, tmp_rot);

    device.queue.writeBuffer(Mats, i * sizet + 0, worldMatrix);
    device.queue.writeBuffer(Mats, i * sizet + matrixSize, viewMatix );
    device.queue.writeBuffer(Mats, i * sizet + matrixSize * 2, perMatrix);
    device.queue.writeBuffer(Mats, i * sizet + matrixSize * 3, controls.camPos);
  }
}

init();
