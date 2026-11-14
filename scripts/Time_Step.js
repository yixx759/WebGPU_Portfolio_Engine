import * as enemy_funcs from './Enemy_Funcs.js';
import assert, { assert_no_NaN_array } from './Assert.js'

export const DT = 0.01;
let previous_time = 0;
let accumulator = 0;

export function update_physics_funcs()
{
    const current_time = performance.now() / 1000;
    assert(current_time === current_time, "current_time is NAN")
    assert(Number.isFinite(current_time), "current_time is finite");
    assert(current_time > previous_time, "Current time is before prev");

    const full_dt = current_time - previous_time;
    accumulator += full_dt;

    while (accumulator >= DT)
    {
        enemy_funcs.move_enemys_towards_target();
        accumulator -= DT;
    }

    previous_time = current_time;

    // TO DO: use accumulator remiander as interpolation for rendering.
}

// TO DO: Add credit here

// double t = 0.0;
//     double dt = 0.01;

//     double currentTime = hires_time_in_seconds();
//     double accumulator = 0.0;

//     State previous;
//     State current;

//     while ( !quit )
//     {
//         double newTime = time();
//         double frameTime = newTime - currentTime;
//         if ( frameTime > 0.25 )
//             frameTime = 0.25;
//         currentTime = newTime;

//         accumulator += frameTime;

//         while ( accumulator >= dt )
//         {
//             previousState = currentState;
//             integrate( currentState, t, dt );
//             t += dt;
//             accumulator -= dt;
//         }

//         const double alpha = accumulator / dt;

//         State state = currentState * alpha + 
//             previousState * ( 1.0 - alpha );

//         render( state );
//     }