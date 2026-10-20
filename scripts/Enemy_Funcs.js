import * as helper from './Helper_Funcs.js';
import * as objectInfo from './Object_Info_Struct.js';
import assert from './Assert.js'

let enemy_list = new Array(10).fill(null);
let enemy_patrol_list = new Array(10).fill(null);
export let enemy_list_index = 0;

const TEST_LOCAITON = new Float32Array([-1000,0,0]);
// const TEST_LOCAITON = new Float32Array([0,0,-100000]);
const TEST_ACCEL = 1 / 100;
const TEST_SPEED = 10000;

const TEST_PATROL_POINTS = [new Float32Array([0,0,0]), new Float32Array([10,0,0])];
const DISTANCE_TO_SWITCH_POINT_SQR = 2;

export function create_enemy_list(objects)
{
    for (let i = 0; i < objects.length; i++)
    {
        let object = objects[i];
        const bit_field = object.get_bit_field();

        if (bit_field == helper.BIT_FIELD_ENEMY) 
        {
            enemy_patrol_list[enemy_list_index] = 0
            assert(typeof TEST_PATROL_POINTS == "object", "Patrol isnt list");
            assert(TEST_PATROL_POINTS[0] instanceof Float32Array, "POINT wasnt flaot 32")
            assert(TEST_PATROL_POINTS.length == 2, "Test patrol not right num")

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
        const target = TEST_PATROL_POINTS[enemy_patrol_list[i]];
        const enemy = enemy_list[i];
        assert(target instanceof Float32Array, "target not array float32");
        assert(target.every(Number.isFinite), "Nan in target");
        assert(enemy instanceof objectInfo.game_object, "enemy not game object");

        move_towards_target(enemy_list[i], target);
        switch_patrol_points_check(enemy_list[i], target, i);
    }
}

function switch_patrol_points_check(object, target, index)
{
    assert(arguments.length == 3, "Not Enough Params");
    assert(target instanceof Float32Array, "POINT wasnt flaot 32");
    assert(object instanceof objectInfo.game_object, "Game object not isnerted");
    assert(typeof index == "number", "INdex not number")

    let current_position = object.get_position();
    assert(current_position.every(Number.isFinite), "current position not fetched");
    assert(current_position instanceof Float32Array, "cur pos wasnt flaot 32");

    let length_to_target_sqr = helper.vector_mag_sqr(helper.vector_subtract(target, current_position));
    assert(length_to_target_sqr === length_to_target_sqr, "Length is NAN")
    assert(Number.isFinite(length_to_target_sqr), "Length is finite");

    if (length_to_target_sqr < DISTANCE_TO_SWITCH_POINT_SQR)
    {
        console.trace("POstions at switch" + current_position)
        enemy_patrol_list[index]++;
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

    // TO DO: USE QUATERNIONS
    // TO DO: NORMALIZE LERP ON QUATERNION
    let new_rotation = helper.rotate_normalized_lerp(current_rotation, dir_to_target, TEST_ACCEL);

    dir_to_target = helper.vector_mult_scalar_into(dir_to_target, TEST_SPEED);
    // Accel is a constant set
    // Velocity is MoveTowards(V, TargetVel(input), accel);

    // A = FORCE / MASS

    // V += A * dt
    let new_velocity = helper.move_towards(current_velocity, dir_to_target, TEST_ACCEL);
 
    object.set_velocity(new_velocity);

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
