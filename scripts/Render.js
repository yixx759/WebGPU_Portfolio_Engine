import { parceObjFile } from './objParser.js';
import { makeColliderFromVerts, AABB } from './colliderFuncs.js'
import * as helper from './helperFuncs.js'
import * as objectInfo from './objectInfoStruct.js'
import * as testFuncs from './testFuncs.js'
const clearColor = { r: 0.0, g: 0.5, b: 1.0, a: 1.0 };

const DEBUG = false;
const TEST = false;

// TO DO: dont cretae new memory everytime get positons
// TO DO: Do that roation system casey did a article on research turns and normalized lerp
// TO DO: Validaiton with max amount of moidels and texture so cant create object
// with any more than that

function print(string)
{
  console.log(string);
}

function debugLog(...args) {
  if (DEBUG) console.log(...args);
}

const ZEROS = new Float32Array([0, 0, 0]);

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
*/

const AMOUNT_OF_OBJECTS = 2;

console.log(objectInfo.ALIGNMENT_BYTES_OF_OBJECT)
// TO DO: Hide this inside of object info struct dont have to send as param
const objectArray = new ArrayBuffer(objectInfo.ALIGNMENT_BYTES_OF_OBJECT * AMOUNT_OF_OBJECTS);
const transformArray = new Float32Array(objectArray);
const indexArray = new Int8Array(objectArray);

// Player Defaults

const PLAYER_START_POSITION = new Float32Array([0, 0, 0]);
const PLAYER_START_SCALE = 1;
const PLAYER_START_ROTATION = new Float32Array([180,180,0]);

const PLAYER_ID = 0;
const PLAYER_MODEL_INDEX = 0;
const PLAYER_TEXTURE_INDEX = 1;

let playerObject = new objectInfo.gameObject(objectArray, PLAYER_ID, PLAYER_MODEL_INDEX, PLAYER_TEXTURE_INDEX, PLAYER_START_POSITION, PLAYER_START_SCALE, PLAYER_START_ROTATION, ZEROS);

const OTHER_START_POSITION = new Float32Array([5, 0, 0]);
const OTHER_START_SCALE = 1;
const OTHER_START_ROTATION = new Float32Array([180,180,0]);

const OTHER_ID = 1;
const OTHER_MODEL_INDEX = 0;
const OTHER_TEXTURE_INDEX = 1;

let otherObject = new objectInfo.gameObject(objectArray, OTHER_ID, OTHER_MODEL_INDEX, OTHER_TEXTURE_INDEX, OTHER_START_POSITION, OTHER_START_SCALE, OTHER_START_ROTATION, ZEROS);

let gameObjectArray = [playerObject, otherObject];

// Test prints
if (TEST) testFuncs.objectTestPrints(playerObject, otherObject, indexArray, transformArray)

// Vertex and fragment shaders
const shaderCode = await helper.loadShader("./shaders/burley-test.wgsl");;

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
  const verticiesFromObj = helper.getVertexBufferFromDecodedObj(decodedObjData);
  const verticiesFromObjB = helper.getVertexBufferFromDecodedObj(decodedObjDataB);

  let objectArray = [verticiesFromObj ,verticiesFromObjB];

  // TO DO: ADD PLAYER TO SOME SORT OF STRUCT
  const playerCollider = new Float32Array([1, 2, 1, 0]);

  // TO DO: Use biggest model precalculate and look into alighnment for this
  const vertexBuffer = device.createBuffer({
        size: objectArray[1].byteLength * AMOUNT_OF_OBJECTS, // Should pre calculate max
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

  let VERTEX_OFFSET = objectArray[1].byteLength

  for (let i = 0; i < AMOUNT_OF_OBJECTS; i++) {   
    const vertex_index = gameObjectArray[i].getModelIndex(indexArray);

    device.queue.writeBuffer(vertexBuffer, VERTEX_OFFSET * i, objectArray[vertex_index], 0, objectArray[vertex_index].length);

    // TO DO: Get these better include in whatever file type is made
    gameObjectArray[i].setHalf(transformArray, makeColliderFromVerts(objectArray[0]));
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

  const group0Layout = device.createBindGroupLayout({
    entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } 
  }],
  label: "bind group 0",
  });

  const group1Layout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} }
    ],

    label: "bind group 1",
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
      group1Layout  // for sampler + texture
    ]
    })
  };

  var Time = Date.now();

  const renderPipeline = device.createRenderPipeline(pipelineDescriptor);

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
  
  let bindGroupArray = [];

  // TO DO: This should be ordred by ID not i do me later
  for (let i = 0; i < AMOUNT_OF_OBJECTS; i++ ){
   
    const bindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
        {binding: 0, resource: {
          buffer: Mats,
          offset: sizet*i
        }},
    ],
    });
    bindGroupArray.push(bindGroup);
  }

const url = 'resources/images/Bunny Texture.png';
const urlF = 'resources/images/f-texture.png';
const source = await helper.loadImageBitmap(url);
const sourceF = await helper.loadImageBitmap(urlF);

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

let textures = [texture, textureF];

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

const targetPos = [0,0,2];
const up = [0,1,0];

var keyX = 0;
var keyXDown = 0;
var keyY = 0;
var keyYDown = 0;
var keyZ = 0;
var keyZDown = 0;

document.addEventListener('keydown', function(evt) {

  if (evt.key === 'w') {
    debugLog("Up");
    keyZDown = -0.1;
  } else if (evt.key === 's') {
    debugLog("Down");
    keyZDown = 0.1;
  }

  if (evt.key === 'd') {
    debugLog("Right");
    keyXDown = 0.1;
  } else if (evt.key === 'a') {
    debugLog("Left");
    keyXDown = -0.1;
  }

  if (evt.key === 'e') {
    debugLog("forward");
    keyYDown = -0.1;
  } else if (evt.key === 'q') {
    debugLog("down");
    keyYDown = 0.1;
  }

}, false);

document.addEventListener('keyup', function(evt) {

  if (evt.key === 'w' || evt.key === 's') {
    debugLog("Z stop");
    keyZDown = 0;
  }

  if (evt.key === 'd' || evt.key === 'a') {
    debugLog("X stop");
    keyXDown = 0;
  }

  if (evt.key === 'e' || evt.key === 'q') {
    debugLog("Y stop");
    keyYDown = 0;
  }

}, false);

// key dwon enables a bool and key up disables it makes input smooth
const depthTexture = device.createTexture({
  size: [canvas.clientWidth, canvas.clientHeight , 1],
  format: "depth24plus",
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
});

// Put up here to avoid re allocation
let camPos = new Float32Array([keyX,0,keyY+10, 1]);
let camPosPrev = new Float32Array([keyX,0,keyY+10, 1]);

function render() {

  // TO DO: Magic numbers
  Time = Date.now() / 100;

  helper.vectorAdd_Cam(camPos, keyXDown, keyZDown)
  
  for (let i = 0; i < AMOUNT_OF_OBJECTS; i++)
  {
    if (AABB(gameObjectArray[i].getPosition(transformArray), gameObjectArray[i].getHalf(transformArray), camPos, playerCollider))
    {
      helper.vectorAdd_Cam(camPos, keyXDown, keyZDown)
      helper.vectorAss_Cam(camPos, camPosPrev);
    }
  }

  helper.vectorAss_Cam(camPosPrev, camPos);

  var viewMatix = helper.getViewMatrix(targetPos, up, camPos);
  var perMatrix = helper.getPerspectiveMatrix(90, 1,1000);

  // TO DO: Only need to change world
  for(let i = 0; i < AMOUNT_OF_OBJECTS; i++ )
  {
    // TO DO: SHould be some scratch memroy here to pass in
    // right no createing vec everytime
    let tmp_pos = gameObjectArray[i].getPosition(transformArray);
    let tmp_scale = gameObjectArray[i].getScale(transformArray);
    let tmp_rot = gameObjectArray[i].getRotation(transformArray);

    worldMatrix = helper.getWorldMatrix(tmp_pos[0], tmp_pos[1], tmp_pos[2], tmp_rot[0], tmp_rot[1], tmp_rot[2], tmp_scale);
    device.queue.writeBuffer(Mats, i*sizet+0, worldMatrix);
    device.queue.writeBuffer(Mats, i*sizet+matrixSize, viewMatix );
    device.queue.writeBuffer(Mats, i*sizet+matrixSize * 2, perMatrix);
    device.queue.writeBuffer(Mats, i*sizet+matrixSize * 3, camPos);
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
  
  // This should be based on object indexs
  // TO DO: Make these names better
  for (let i = 0; i < AMOUNT_OF_OBJECTS; i++)
  {
    const vert_index = gameObjectArray[i].getModelIndex(indexArray);
    const tex_index = gameObjectArray[i].getTextureIndex(indexArray);
    const id = gameObjectArray[i].ID;
    passEncoder.setBindGroup(0, bindGroupArray[id]);
    passEncoder.setBindGroup(1, bindGroupTexArray[tex_index]);
    passEncoder.setVertexBuffer(0, vertexBuffer, VERTEX_OFFSET * id, objectArray[vert_index].byteLength);
    passEncoder.draw(objectArray[vert_index].length / 8);
  }

  passEncoder.end();
  
  device.queue.submit([commandEncoder.finish()]);
  requestAnimationFrame(render);
}
  requestAnimationFrame(render);
}

init();
