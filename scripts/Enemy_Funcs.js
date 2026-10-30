import * as helper from './Helper_Funcs.js';
import * as objectInfo from './Object_Info_Struct.js';
import * as controls from './Controls.js';
import * as debug_ray from './Debug_Rays.js';
import assert, { assert_no_NaN_array } from './Assert.js'

const enemy_list_length = 10;

let enemy_list = new Array(enemy_list_length).fill(null);
let enemy_patrol_point_index_list = new Array(enemy_list_length).fill(null);
let enemy_patrol_list = new Array(enemy_list_length).fill(null);
export let enemy_list_index = 0;

const TEST_LOCAITON = new Float32Array([-1000,0,0]);
// const TEST_LOCAITON = new Float32Array([0,0,-100000]);
const TEST_ACCEL = 1 / 10;
const TEST_SPEED = 40;

const TEST_PATROL_POINTS = [[new Float32Array([0,0,0]), new Float32Array([10,0,0])], [new Float32Array([40,0,-10]), new Float32Array([70,0,10])]];
const DISTANCE_TO_SWITCH_POINT_SQR = 2;

const DISTANCE_TO_CHASE_PLAYER_NOT_CHASING = 27;
const FOV_OF_ENEMY_NOT_CHASING = Math.cos((180 / 2) * helper.DEG_TO_RAD); // 180 Degrees

const DISTANCE_TO_CHASE_PLAYER_CHASING = 40;
const FOV_OF_ENEMY_CHASING = Math.cos((270 / 2) * helper.DEG_TO_RAD); // 270 Degrees

let chase_player = false;

export function create_enemy_list(objects)
{
    for (let i = 0; i < objects.length; i++)
    {
        let object = objects[i];
        const bit_field = object.get_bit_field();

        if (bit_field == helper.BIT_FIELD_ENEMY) 
        {
            enemy_patrol_list[enemy_list_index] = 0
            enemy_patrol_point_index_list[enemy_list_index] = object.get_patrol_index();
            assert(typeof TEST_PATROL_POINTS == "object", "Patrol isnt list");
            assert(TEST_PATROL_POINTS[0][0] instanceof Float32Array, "POINT wasnt flaot 32")
            assert(TEST_PATROL_POINTS.length == 2, "Test patrol not right num")

            enemy_list[enemy_list_index++] = object;
        }
    }
}

// TO DO: Time step re read that time step article find implementaitons
// TO DO: Attacking and health
export function is_chase_player(enemy, player_pos)
{
    assert(arguments.length == 2, "Not Enough Params");
    assert(enemy instanceof objectInfo.game_object, "enemy not game object");

    // TO DO: should input calculated a few times
    const enemy_pos = enemy.get_position();
    assert(enemy_pos instanceof Float32Array, "enemy not array float32");
    assert(enemy_pos.every(Number.isFinite), "Nan in target");

    const enemy_to_player = helper.vector_subtract(player_pos, enemy_pos);
    assert(enemy_to_player instanceof Float32Array, "enemy to player not array float32");
    assert(enemy_to_player.every(Number.isFinite), "Nan in target");

    const length_to_player = helper.vector_mag(enemy_to_player);
    assert(length_to_player === length_to_player, "Length is NAN")
    assert(Number.isFinite(length_to_player), "Length is finite");

    const norm_enemy_to_player = helper.vector_div_scalar_into(enemy_to_player, length_to_player);
   
    const norm_enemy_forward = new Float32Array(3);
    const matrix_tmp = new Float32Array(4 * 4);
    helper.vector_norm_into(helper.get_forward_vector_from_matrix(norm_enemy_forward, enemy.get_world_matrix(matrix_tmp, enemy.get_position(), enemy.get_rotation())));
    assert(norm_enemy_forward instanceof Float32Array, "norm enemy forward not array float32");
    assert(norm_enemy_forward.every(Number.isFinite), "Nan in norm enemy forward");

    const distance_to_chase_player = chase_player ? DISTANCE_TO_CHASE_PLAYER_CHASING : DISTANCE_TO_CHASE_PLAYER_NOT_CHASING;
    assert(Number.isFinite(distance_to_chase_player), "distance_to_chase_player is finite");
    const enemy_field_of_vision = chase_player ? FOV_OF_ENEMY_CHASING : FOV_OF_ENEMY_NOT_CHASING;
    assert(Number.isFinite(enemy_field_of_vision), "enemy_field_of_vision is finite");

    assert(!(helper.vector_dot(norm_enemy_forward, norm_enemy_to_player) > 1) && !(helper.vector_dot(norm_enemy_forward, norm_enemy_to_player) < -1))

    // This attaches a ray to shoot forward from enemy.
    // debug_ray.new_ray_pos(enemy_pos, helper.vector_add(enemy_pos, helper.vector_mult_scalar(norm_enemy_forward, 10)), false);

    if (length_to_player < distance_to_chase_player && helper.vector_dot(norm_enemy_forward, norm_enemy_to_player) > enemy_field_of_vision)
    {
        return true
    }

    return false
}

export function move_enemys_towards_target()
{
    assert(controls.cam_pos instanceof Float32Array, "player_pos not array float32");
    assert(controls.cam_pos.every(Number.isFinite), "Nan in target");

    for (let i = 0; i < enemy_list_index; i++)
    {   
        const enemy = enemy_list[i];
        chase_player = is_chase_player(enemy, controls.cam_pos);

        if (chase_player)
        {
            move_towards_target(enemy_list[i], controls.cam_pos);
        }
        else
        {
            const patrol_index = enemy_patrol_point_index_list[i];
            const target = TEST_PATROL_POINTS[patrol_index][enemy_patrol_list[i]];
            
            assert(target instanceof Float32Array, "target not array float32");
            assert(target.every(Number.isFinite), "Nan in target");
            assert(enemy instanceof objectInfo.game_object, "enemy not game object");

            move_towards_target(enemy_list[i], target);
            switch_patrol_points_check(enemy_list[i], target, i, patrol_index);
        }
    }
}

function switch_patrol_points_check(object, target, index, patrol_index)
{
    assert(arguments.length == 4, "Not Enough Params");
    assert(target instanceof Float32Array, "POINT wasnt flaot 32");
    assert(object instanceof objectInfo.game_object, "Game object not isnerted");
    assert(typeof index == "number", "INdex not number")
    assert(typeof patrol_index == "number", "Patrol index not number")

    let current_position = object.get_position();
    assert(current_position.every(Number.isFinite), "current position not fetched");
    assert(current_position instanceof Float32Array, "cur pos wasnt flaot 32");

    let length_to_target_sqr = helper.vector_mag_sqr(helper.vector_subtract(target, current_position));
    assert(length_to_target_sqr === length_to_target_sqr, "Length is NAN")
    assert(Number.isFinite(length_to_target_sqr), "Length is finite");

    if (length_to_target_sqr < DISTANCE_TO_SWITCH_POINT_SQR)
    {
        console.log("POstions at switch" + current_position)
        // Mod now make & later
        enemy_patrol_list[index] = (enemy_patrol_list[index] + 1) % TEST_PATROL_POINTS[patrol_index].length;
    }
}

function move_towards_target(object, target)
{
    let current_position = object.get_position();
    assert_no_NaN_array(current_position);

    let current_rotation = object.get_rotation();
    assert_no_NaN_array(current_rotation);
    
    let current_velocity = object.get_velocity();
    assert_no_NaN_array(current_velocity);

    let dir_to_target = helper.vector_norm_into(helper.vector_subtract(target, current_position));
    assert_no_NaN_array(dir_to_target);

    // TO DO: USE QUATERNIONS
    // TO DO: NORMALIZE LERP ON QUATERNION
    let new_rotation = helper.rotate_normalized_lerp(current_rotation, dir_to_target, TEST_ACCEL);
    assert_no_NaN_array(new_rotation);

    dir_to_target = helper.vector_mult_scalar_into(dir_to_target, TEST_SPEED);
    assert_no_NaN_array(dir_to_target);
    // Accel is a constant set
    // Velocity is MoveTowards(V, TargetVel(input), accel);

    // A = FORCE / MASS

    // V += A * dt
    let new_velocity = helper.move_towards(current_velocity, dir_to_target, TEST_ACCEL);
    assert_no_NaN_array(new_velocity);

    object.set_velocity(new_velocity);

    // P += V * dt
    let new_position = helper.vector_3_add_into(current_position, helper.vector_mult_scalar_into(new_velocity, helper.DT));
    assert_no_NaN_array(new_position);

    object.set_position(new_position);

    object.set_rotation(new_rotation);

    // dt just use time since last render do somethign better at end

    // TO DO: fix time step
    // TO DO: Debug ray of enemy going forward. also maybe add more debug rays
}
