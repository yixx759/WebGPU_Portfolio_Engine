
import * as object_info from './Object_Info_Struct.js'
import * as helper from './Helper_Funcs.js';


export function process_raycast_hit(game_object_hit)
{
  const bit_field = game_object_hit.get_bit_field();

  // Switch to ifs if doing want to avoid combinations or do
  // multiple flags at once
  switch (bit_field)
  {
    case helper.BIT_FIELD_CHEST_ITEM:
      game_object_hit.set_texture_index(1);
      console.log("HIT CHEST");
      break
  }

}