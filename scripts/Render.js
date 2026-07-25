import { parceObjFile } from './objParser.js';
import { makeColliderFromVerts, AABB, ray, ray_AABB_intersection} from './colliderFuncs.js'
import * as helper from './helperFuncs.js'
import * as objectInfo from './objectInfoStruct.js'
import * as testFuncs from './testFuncs.js'
import * as BRDF_configs from './BRDF_configs.js';
import * as Light_Manager from './Light_Manager.js';
import * as Path_Tracing from './Path_Tracing.js';
import * as sh_funcs from './SH_Funcs.js'
import * as player_struct from './Player_struct.js'
const clearColor = { r: 0.0, g: 0.5, b: 1.0, a: 1.0 };

const DEBUG = true;
const TEST = false;
const SINGLE_TEST = false;

const TARGET_INDEX = 2;
const MOVE_TARGET_TEST = false;

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

/* Object structure

* Render Info *
  int8    vertexIndex
  int8    textureIndex

  * Transform *
  vector3 position
  int8    scale
  vector3 rotation 

  * Collision *
  vector3 half

  // TO DO : STORE EAHC ONE HERE??
  * BRDF Parameters *
  int8    BRDF param index       

*/

const AMOUNT_OF_OBJECTS = 2 + 6;

// Player Defaults

const PLAYER_START_POSITION = new Float32Array([0, 0, -30.2]);
const PLAYER_START_SCALE = 0.5;
const PLAYER_START_ROTATION = new Float32Array([180,180,0]);

const PLAYER_ID = 0;
const PLAYER_MODEL_INDEX = 1;
const PLAYER_TEXTURE_INDEX = 1;

let playerObject = new objectInfo.gameObject(PLAYER_ID, PLAYER_MODEL_INDEX, PLAYER_TEXTURE_INDEX, PLAYER_START_POSITION, PLAYER_START_SCALE, PLAYER_START_ROTATION, helper.ZEROS, BRDF_configs.BASIC_INDEX);

const OTHER_START_POSITION = new Float32Array([10, 0, 0]);
const OTHER_START_SCALE = 1;
const OTHER_START_ROTATION = new Float32Array([180,180,0]);

const OTHER_ID = 1;
const OTHER_MODEL_INDEX = 0;
const OTHER_TEXTURE_INDEX = 3;

let otherObject = new objectInfo.gameObject(OTHER_ID, OTHER_MODEL_INDEX, OTHER_TEXTURE_INDEX, OTHER_START_POSITION, OTHER_START_SCALE, OTHER_START_ROTATION, helper.ZEROS, BRDF_configs.BASIC_INDEX);

const WALL_1_START_POSITION = new Float32Array([-8.738,0,-12.2]);
const WALL_1_START_SCALE = 1;
const WALL_1_START_ROTATION = new Float32Array([90,0,90]);

const WALL_1_ID = 2;
const WALL_1_MODEL_INDEX = 2;
const WALL_1_TEXTURE_INDEX = 3;

let wall_1 = new objectInfo.gameObject(WALL_1_ID, WALL_1_MODEL_INDEX, WALL_1_TEXTURE_INDEX, WALL_1_START_POSITION, WALL_1_START_SCALE, WALL_1_START_ROTATION, helper.ZEROS, BRDF_configs.BASIC_INDEX);

const WALL_2_START_POSITION = new Float32Array([0.4000000059604645,0, -3.055]);
const WALL_2_START_SCALE = 1;
const WALL_2_START_ROTATION = new Float32Array([90,0,0]);

const WALL_2_ID = 3;
const WALL_2_MODEL_INDEX = 2;
const WALL_2_TEXTURE_INDEX = 3;

let wall_2 = new objectInfo.gameObject(WALL_2_ID, WALL_2_MODEL_INDEX, WALL_2_TEXTURE_INDEX, WALL_2_START_POSITION, WALL_2_START_SCALE, WALL_2_START_ROTATION, helper.ZEROS, BRDF_configs.BASIC_INDEX);

const WALL_3_START_POSITION = new Float32Array([9.49, 0,-12.2]);
const WALL_3_START_SCALE = 1;
const WALL_3_START_ROTATION = new Float32Array([90,0,90]);

const WALL_3_ID = 4;
const WALL_3_MODEL_INDEX = 2;
const WALL_3_TEXTURE_INDEX = 3;

let wall_3 = new objectInfo.gameObject(WALL_3_ID, WALL_3_MODEL_INDEX, WALL_3_TEXTURE_INDEX, WALL_3_START_POSITION, WALL_3_START_SCALE, WALL_3_START_ROTATION, helper.ZEROS, BRDF_configs.BASIC_INDEX);

const WALL_4_START_POSITION = new Float32Array([0.4, 0, -21.34]);
const WALL_4_START_SCALE = 1;
const WALL_4_START_ROTATION = new Float32Array([90,0,0]);

const WALL_4_ID = 5;
const WALL_4_MODEL_INDEX = 2;
const WALL_4_TEXTURE_INDEX = 3;

let wall_4 = new objectInfo.gameObject(WALL_4_ID, WALL_4_MODEL_INDEX, WALL_4_TEXTURE_INDEX, WALL_4_START_POSITION, WALL_4_START_SCALE, WALL_4_START_ROTATION, helper.ZEROS, BRDF_configs.BASIC_INDEX);

const WALL_5_START_POSITION = new Float32Array([0.35000000298023224,10.43,-12.600000381469727]);
const WALL_5_START_SCALE = 1;
const WALL_5_START_ROTATION = new Float32Array([0,0,0]);

const WALL_5_ID = 6;
const WALL_5_MODEL_INDEX = 2;
const WALL_5_TEXTURE_INDEX = 3;

let wall_5 = new objectInfo.gameObject(WALL_5_ID, WALL_5_MODEL_INDEX, WALL_5_TEXTURE_INDEX, WALL_5_START_POSITION, WALL_5_START_SCALE, WALL_5_START_ROTATION, helper.ZEROS, BRDF_configs.BASIC_INDEX);

const WALL_6_START_POSITION = new Float32Array([0.3500000011920929,-9.900000190734863,-12.10000038]);
const WALL_6_START_SCALE = 1;
const WALL_6_START_ROTATION = new Float32Array([0,0,0]);

const WALL_6_ID = 7;
const WALL_6_MODEL_INDEX = 2;
const WALL_6_TEXTURE_INDEX = 3;

let wall_6 = new objectInfo.gameObject(WALL_6_ID, WALL_6_MODEL_INDEX, WALL_6_TEXTURE_INDEX, WALL_6_START_POSITION, WALL_6_START_SCALE, WALL_6_START_ROTATION, helper.ZEROS, BRDF_configs.BASIC_INDEX);

let gameObjectArray = [playerObject, otherObject, wall_1, wall_2, wall_3, wall_4, wall_5, wall_6];

// Test prints
if (TEST) testFuncs.objectTestPrints(playerObject, otherObject)

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

  const decodedObjData = await parceObjFile('resources/models/cube.obj');
  const decodedObjDataB = await parceObjFile('resources/models/Bunny.obj');
  const decoded_obj_data_wall = await parceObjFile('resources/models/wall.obj');
  const verticiesFromObj = helper.getVertexBufferFromDecodedObj(decodedObjData);
  const verticiesFromObjB = helper.getVertexBufferFromDecodedObj(decodedObjDataB);
  const verticies_obj_wall = helper.getVertexBufferFromDecodedObj(decoded_obj_data_wall);

  let Model_Array = [verticiesFromObj ,verticiesFromObjB, verticies_obj_wall];
  let max_verts = -1;
  for (let i = 0; i < Model_Array.length; i++)
  {
    if (Model_Array[i].byteLength > max_verts)
    {
      max_verts = Model_Array[i].byteLength;
    }
  }

  if (DEBUG && max_verts == -1)
  {
    debugLog("Broke final lenght of max verts: -1");
  }

  max_verts = helper.align(max_verts, 4);

  const vertexBuffer = device.createBuffer({
        size: max_verts * AMOUNT_OF_OBJECTS, // Should pre calculate max
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });

  let VERTEX_OFFSET = max_verts;

  const tmp_first_2 = 2;
  const tmp_first_1 = 1;

  for (let i = 0; i < AMOUNT_OF_OBJECTS; i++) {   
    const vertex_index = gameObjectArray[i].getModelIndex();

    device.queue.writeBuffer(vertexBuffer, VERTEX_OFFSET * i, Model_Array[vertex_index], 0, Model_Array[vertex_index].length);

      if (!SINGLE_TEST || i < tmp_first_1)
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

const source = await helper.loadImageBitmap(url);
const sourceF = await helper.loadImageBitmap(urlF);
const source_green = await helper.loadImageBitmap(url_green);
const source_tester = await helper.loadImageBitmap(url_tester);

const source_data = await helper.loadImageData(url);
const sourceF_data = await helper.loadImageData(urlF);
const green_data = await helper.loadImageData(url_green);
const tester_data = await helper.loadImageData(url_tester);

// TO DO: Generalize me
const texture_green = device.createTexture({
  label: url_green,
  format: 'rgba8unorm',
  size: [sourceF.width, sourceF.height],
  usage: GPUTextureUsage.TEXTURE_BINDING |
         GPUTextureUsage.COPY_DST |
         GPUTextureUsage.RENDER_ATTACHMENT,
});

const texture_tester = device.createTexture({
  label: url_tester,
  format: 'rgba8unorm',
  size: [source_tester.width, source_tester.height],
  usage: GPUTextureUsage.TEXTURE_BINDING |
         GPUTextureUsage.COPY_DST |
         GPUTextureUsage.RENDER_ATTACHMENT,
});

const textureF = device.createTexture({
  label: urlF,
  format: 'rgba8unorm',
  size: [sourceF.width, sourceF.height],
  usage: GPUTextureUsage.TEXTURE_BINDING |
         GPUTextureUsage.COPY_DST |
         GPUTextureUsage.RENDER_ATTACHMENT,
});

const texture = device.createTexture({
  label: url,
  format: 'rgba8unorm',
  size: [source.width, source.height],
  usage: GPUTextureUsage.TEXTURE_BINDING |
         GPUTextureUsage.COPY_DST |
         GPUTextureUsage.RENDER_ATTACHMENT,
});

device.queue.copyExternalImageToTexture(
  {source: source_green, flipY: true},
  {texture: texture_green},
  {width: source_green.width, height: source_green.height},
);

device.queue.copyExternalImageToTexture(
  {source: source_tester, flipY: true},
  {texture: texture_tester},
  {width: source_tester.width, height: source_tester.height},
);

device.queue.copyExternalImageToTexture(
  {source: sourceF, flipY: true},
  {texture: textureF},
  {width: sourceF.width, height: sourceF.height},
);

device.queue.copyExternalImageToTexture(
  {source, flipY: true},
  {texture},
  {width: source.width, height: source.height},
);

const sampler = device.createSampler({
  addressModeU: 'repeat',
  addressModeV: 'repeat',
  magFilter: 'linear',
});

let textures = [texture, textureF, texture_green, texture_tester];
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

const targetPos = [0,0,2];
const up = [0,1,0];

const DEBUG_TARGET_SENSITIVITY = 1;

var debug_target_keyX = 0;
var debug_target_keyXDown = 0;
var debug_target_keyY = 0;
var debug_target_keyYDown = 0;
var debug_target_keyZ = 0;
var debug_target_keyZDown = 0;

var keyX = 0;
var keyXDown = 0;
var keyY = 0;
var keyYDown = 0;
var keyZ = 0;
var keyZDown = 0;

const MOUSE_SPEED_X = 0.005;
const MOUSE_SPEED_Y = 0.005;

const Y_ANGLE_CAM_CLAMP = 50 * Math.PI / 180;

var mouse_X = 0;
var mouse_Y = 0;

document.addEventListener('keydown', function(evt) {
  if (evt.key.toLowerCase() === 'w') {
    debugLog("Up");
    keyZDown = -0.1;
  } else if (evt.key.toLowerCase() === 's') {
    debugLog("Down");
    keyZDown = 0.1;
  }

  if (evt.key.toLowerCase() === 'd') {
    debugLog("Right");
    keyXDown = -0.1;
  } else if (evt.key.toLowerCase() === 'a') {
    debugLog("Left");
    keyXDown = 0.1;
  }

  if (evt.key.toLowerCase() === 'e') {
    debugLog("forward");
    keyYDown = 0.1;
  } else if (evt.key.toLowerCase() === 'q') {
    debugLog("down");
    keyYDown = -0.1;
  }

  // DEBUG Control

  if (MOVE_TARGET_TEST)
  {
    if (evt.key.toLowerCase() === 'ArrowUp') {
    debugLog("Debug Up");
    debug_target_keyZDown = -0.1;
  } else if (evt.key.toLowerCase() === 'ArrowDown') {
    debugLog("Debug Down");
    debug_target_keyZDown = 0.1;
  }

  if (evt.key.toLowerCase() === 'ArrowRight') {
    debugLog("Debug Right");
    debug_target_keyXDown = 0.1;
  } else if (evt.key.toLowerCase() === 'ArrowLeft') {
    debugLog("Debug Left");
    debug_target_keyXDown = -0.1;
  }

  if (evt.key.toLowerCase() === 'f') {
    debugLog("Debug forward");
    debug_target_keyYDown = 0.1;
  } else if (evt.key.toLowerCase() === 'h') {
    debugLog("Debug down");
    debug_target_keyYDown = -0.1;
  }
  }

}, false);

document.addEventListener('keyup', function(evt) {
  
    if (evt.key.toLowerCase() === 'w' || evt.key.toLowerCase() === 's') {
        debugLog("debug Z stop");
        keyZDown = 0;
      }

    if (evt.key.toLowerCase() === 'd' || evt.key.toLowerCase() === 'a') {
      debugLog("debug X stop");
      keyXDown = 0;
    }

    if (evt.key.toLowerCase() === 'e' || evt.key.toLowerCase() === 'q') {
      debugLog("debug Y stop");
      keyYDown = 0;
    }
    
  // DEBUG Control

  if (MOVE_TARGET_TEST)
      {
    if (evt.key.toLowerCase() === 'ArrowUp' || evt.key.toLowerCase() === 'ArrowDown') {
      debugLog("Z stop");
      debug_target_keyZDown = 0;
    }

    if (evt.key.toLowerCase() === 'ArrowRight' || evt.key.toLowerCase() === 'ArrowLeft') {
      debugLog("X stop");
      debug_target_keyXDown = 0;
    }

    if (evt.key.toLowerCase() === 'f' || evt.key.toLowerCase() === 'h') {
      debugLog("Y stop");
      debug_target_keyYDown = 0;
    }
      }

}, false);

document.addEventListener('mousemove', function(evt) {
    mouse_X = mouse_X + evt.movementX * MOUSE_SPEED_X;
    mouse_Y = Math.max(Math.min(mouse_Y - evt.movementY * MOUSE_SPEED_Y, Y_ANGLE_CAM_CLAMP), -Y_ANGLE_CAM_CLAMP);
})

let tmpCamPos = new Float32Array(4);

if (DEBUG && !PATH_TEST)
{
  document.addEventListener('click', function(evt) {
    debugLog("clicked")

    const MAG = new Float32Array([10,10,10]);
    let dir = helper.vector_mult(look_vector, MAG);
    let ray_from_player_forward = new ray(camPos[0], camPos[1], camPos[2], -dir[0], -dir[1], -dir[2]);

    let did_hit = false;

    const min_max = {min: new Float32Array(3), max: new Float32Array(3)};

    for (let i = 0; i < AMOUNT_OF_OBJECTS; i++)
    {
      gameObjectArray[i].get_min_Into( min_max);
      gameObjectArray[i].get_max_Into( min_max);

      if (ray_AABB_intersection(ray_from_player_forward, min_max.min, min_max.max))
      {
        did_hit = true;
      }
    }

    newRayPos(camPos, ray_from_player_forward.get_ray_dest(), did_hit, device, vertexDebugBuffer)
  }, false);
}

canvas.addEventListener("click", async () => {
   if (document.pointerLockElement != canvas) {
      await canvas.requestPointerLock();
   }
});

// key down enables a bool and key up disables it makes input smooth
const depthTexture = device.createTexture({
  size: [canvas.clientWidth, canvas.clientHeight , 1],
  format: "depth24plus",
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
});

// Put up here to avoid re allocation
var camPos = new Float32Array([keyX,0,keyY+10, 1]);
var camPosPrev = new Float32Array([keyX,0,keyY+10, 1]);
var forward_vector_mat = new Float32Array([Math.cos(mouse_X), -Math.sin(mouse_X), Math.sin(mouse_X), Math.cos(mouse_X)]);
var look_vector = new Float32Array([forward_vector_mat[0] * Math.cos(mouse_Y), Math.sin(mouse_Y), forward_vector_mat[2] * Math.cos(mouse_Y)])

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

const playerCollider = new Float32Array([1, 2, 1, 0]);

const player = new player_struct.Player_Stuff(playerObject, playerCollider);

const CONST_TIME_DIV = 100;

// TO DO: Scratch mangaer
let tmp_pos = new Float32Array(3);
let tmp_rot = new Float32Array(3);
let tmp_half = new Float32Array(3);

function render() {
  Time = Date.now() / CONST_TIME_DIV;

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
 
  let OBJECTS_TO_RENDER = SINGLE_TEST ? tmp_first_1 : AMOUNT_OF_OBJECTS;

    for (let i = 0; i < OBJECTS_TO_RENDER; i++)
    {
      gameObjectArray[i].getPosition_Into(tmp_pos);
      gameObjectArray[i].getHalf_Into(tmp_half);
      
      if (AABB(tmp_pos, tmp_half, camPos, player.Collider) && !SINGLE_TEST)
      {
        helper.vector_assign_cam(camPos, camPosPrev);
      }
    }
  

  helper.vector_assign_cam(camPosPrev, camPos);

  //TO Do : make new target pos forward vec and use new const.
  // First xz vector = cos(mouseX) , 0  ,sin(mouseX)
  // First (xz)y vector = cos(mouseX) * cos(mouseY), sin(mouseY)  ,sin(mouseX) * cos(mouseY)
  look_vector = new Float32Array([forward_vector_mat[0] * Math.cos(mouse_Y), Math.sin(mouse_Y), forward_vector_mat[2] * Math.cos(mouse_Y)])
 
  if (SINGLE_TEST)
  {
    var viewMatix = helper.getViewMatrix(look_vector, helper.WORLD_UP_VECTOR, new Float32Array([0,0,0]));
  }
  else
  {
    var viewMatix = helper.getViewMatrix(look_vector, helper.WORLD_UP_VECTOR, camPos);
  }

  var perMatrix = helper.getPerspectiveMatrix(70, 1,1000);

  {

  let tmp_scale = 0;

  for(let i = 0; i < OBJECTS_TO_RENDER; i++ )
  {
    if (SINGLE_TEST)
    {
      gameObjectArray[i].setPosition( camPos);
      gameObjectArray[i].setRotation( new Float32Array([0,keyY,0]));
    }

    if (MOVE_TARGET_TEST && TARGET_INDEX == i)
    {
      gameObjectArray[i].setPosition( new Float32Array([debug_target_keyX,debug_target_keyY,debug_target_keyZ]));
      gameObjectArray[i].setRotation( new Float32Array([90,0,0]));
    }

    gameObjectArray[i].getPosition_Into(tmp_pos);
    tmp_scale = gameObjectArray[i].getScale();
    gameObjectArray[i].getRotation_Into(tmp_rot);

     if (MOVE_TARGET_TEST && TARGET_INDEX == i)
    {
      if (PATH_TEST)
      {
        debugLog(tmp_pos);
        Path_Tracing.transform_vertexs(verticies_obj_wall, gameObjectArray[i], );
      }
    }

    worldMatrix = helper.getWorldMatrix(tmp_pos[0], tmp_pos[1], tmp_pos[2], tmp_rot[0], tmp_rot[1], tmp_rot[2], tmp_scale);
    device.queue.writeBuffer(Mats, i*sizet+0, worldMatrix);
    device.queue.writeBuffer(Mats, i*sizet+matrixSize, viewMatix );
    device.queue.writeBuffer(Mats, i*sizet+matrixSize * 2, perMatrix);
    device.queue.writeBuffer(Mats, i*sizet+matrixSize * 3, camPos);
  }
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

init();
