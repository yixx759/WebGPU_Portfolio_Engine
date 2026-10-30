import assert, { assert_no_NaN_array } from './Assert.js';
import * as helper from './Helper_Funcs.js';

const NUMBER_OF_RAYS_POOL = 32;
const SIZE_OF_RAYS = (4*6*2); // size of float32 which is 4 bytes, 3 float32 per position and colour

let NEWEST_RAY = 0;

let vertex_debug_buffer;
let vertex_debug_buffers;
let pipeline_debug_descriptor;
let render_debug_pipeline;

let shader_debug_code = await helper.load_shader("./shaders/debug_render.wgsl");

let device_ref = null;

helper.error_check(shader_debug_code);

export async function create_debug_lines_buffers(device)
{
    let shader_debug_module = device.createShaderModule({
        code: shader_debug_code
    });

    vertex_debug_buffer = device.createBuffer({
        size: SIZE_OF_RAYS * NUMBER_OF_RAYS_POOL, 
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

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

    const group0Layout = device.createBindGroupLayout({
      entries: [
            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" }},
            { binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }
        ],
      label: "bind group 0",
    });

    pipeline_debug_descriptor = {
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

  render_debug_pipeline = device.createRenderPipeline(pipeline_debug_descriptor);
  device_ref = device;
}

export function new_ray_pos(pos1, pos2, colour_red_enabled)
{
  assert(arguments.length == 3);
  assert_no_NaN_array(pos1);
  assert_no_NaN_array(pos2);
  assert(colour_red_enabled === false || colour_red_enabled === true, "colour_red_enabled isnt boolean");
  assert(device_ref !== null);

  const debug_line_vertex = new Float32Array([
    pos1[0], pos1[1], pos1[2],
    (colour_red_enabled ? 1 : 0), 0, 0,
    pos2[0], pos2[1], pos2[2],
    (colour_red_enabled ? 1 : 0), 0, 0
  ]);

  device_ref.queue.writeBuffer(vertex_debug_buffer, SIZE_OF_RAYS * NEWEST_RAY, debug_line_vertex, 0, debug_line_vertex.length);
  NEWEST_RAY = (NEWEST_RAY + 1) & (32 - 1);
}

export function render_lines(passEncoder)
{
  passEncoder.setPipeline(render_debug_pipeline);
  passEncoder.setVertexBuffer(0, vertex_debug_buffer, 0, SIZE_OF_RAYS * NUMBER_OF_RAYS_POOL);
  passEncoder.draw(2 * NUMBER_OF_RAYS_POOL);
}