import * as objectInfo from './objectInfoStruct.js'

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