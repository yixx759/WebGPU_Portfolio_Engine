import * as helper from './Helper_Funcs.js';
import * as objectInfo from './Object_Info_Struct.js';

let enemy_list = new Array(10).fill(null);
export let enemy_list_index = 0;

const TEST_LOCAITON = new Float32Array([100,0,10]);
const TEST_ACCEL = 200 / 100;
const TEST_SPEED = 10000;

export function create_enemy_list(objects)
{
    for (let i = 0; i < objects.length; i++)
    {
        let object = objects[i];
        const bit_field = object.get_bit_field();

        if (bit_field == helper.BIT_FIELD_ENEMY) 
        {
            enemy_list[enemy_list_index++] = object;
        }
    }
}

// TO DO: fucntion to loop over all enemys or manage each enemy

// TO DO: Function that moves player in direction
// TO DO: Function that uses move toward target to move between patrol points
// TO DO: Function lets look for and observe enemy
// TO DO: Functioon move towards tarter but on player.
// TO DO: Dose update collider?
// TO DO: Attacking and health
// TO DO: Time step re read that time step article find implementaitons


export function move_enemys_towards_target()
{
    for (let i = 0; i < enemy_list_index; i++)
    {
        move_towards_target(enemy_list[i], TEST_LOCAITON);
    }
}

function move_towards_target(object, target)
{
    // TO DO: get direciton form postion
    // Normalize dir and send tat constant speed
    // Do daeab absic movement wiht constand t diff on vector
    // add constant to add that to movement.
    // then Just do dead basic accel and velocicty
    let current_position = object.get_position();
    let current_rotation = object.get_rotation();
    // TO DO: ASSERT NANs
    let current_velocity = object.get_velocity();

    let dir_to_target = helper.vector_norm_into(helper.vector_subtract(target, current_position));
    let new_rotation = helper.rotate_normalized_lerp(current_rotation, dir_to_target, TEST_ACCEL);

    console.log("new_rotation: " + new_rotation);
    dir_to_target = helper.vector_mult_scalar_into(dir_to_target, TEST_SPEED);
    // Accel is a constant set
    // Velocity is MoveTowards(V, TargetVel(input), accel);

    // A = FORCE / MASS

    // V += A * dt
    let new_velocity = helper.move_towards(current_velocity, dir_to_target, TEST_ACCEL);
 
    // P += V * dt
    let new_position = helper.vector_3_add_into(current_position, helper.vector_mult_scalar_into(new_velocity, helper.DT));
  
    object.set_position(new_position);
    object.set_rotation(new_rotation);




    // dt just use time since last render do somethign better at end

    // TO DO: adjsut roation with frward dir 
    // this should also be like an accelration or velocty not isntant

    // TO DO: fix time step
    // TO DO: Debug ray of enemy going forward. also maybe add more debug rays
}
