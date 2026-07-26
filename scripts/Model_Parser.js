import { parceObjFile } from './objParser.js';
import * as helper from './helperFuncs.js';
import * as render from './Render.js';


let size_of_array = 0;

export async function add_model_to_array(model_name, Model_Array)
{
    const Decoded_Obj_Data = await parceObjFile(model_name);

    const Verticies_From_Obj = helper.getVertexBufferFromDecodedObj(Decoded_Obj_Data);

    Model_Array.push(Verticies_From_Obj);
    ++size_of_array;

    return size_of_array - 1;
}

export function get_max_verts(Model_Array)
{

 let max_verts = -1;

  for (let i = 0; i < Model_Array.length; i++)
  {
    if (Model_Array[i].byteLength > max_verts)
    {
      max_verts = Model_Array[i].byteLength;
    }
  }

  if (render.DEBUG && max_verts == -1)
  {
    console.log("Broke final lenght of max verts: -1");
  }

  max_verts = helper.align(max_verts, 4);

  return max_verts
}


export async function add_texture(device, file_name, texture_array)
{
    const source = await helper.loadImageBitmap(file_name);

    const texture = device.createTexture({
    label: file_name,
    format: 'rgba8unorm',
    size: [source.width, source.height],
    usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT,
    });

    device.queue.copyExternalImageToTexture(
        {source: source, flipY: true},
        {texture: texture},
        {width: source.width, height: source.height},
    );

    texture_array.push(texture)
}