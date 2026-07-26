import * as objectInfo from './objectInfoStruct.js'
import * as helper from './helperFuncs.js'
import * as BRDF_configs from './BRDF_configs.js';

/* Player structure

    gameObject Player_Object

    Vector3 Collider
*/


export class Player_Stuff
{
    Player_Object;
    Collider;

    constructor(in_Player_Object, in_Collider)
    {
        this.Player_Object = in_Player_Object;

        this.Collider = in_Collider;
    }
}


export function Set_Up_Objects()
{
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
    
    return [playerObject, otherObject, wall_1, wall_2, wall_3, wall_4, wall_5, wall_6];
}