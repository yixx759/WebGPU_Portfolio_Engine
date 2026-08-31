export function objectTestPrints(playerObject, otherObject)
{
    console.log("=== Initial values ===");
    console.log("Player vert:    " + playerObject.get_model_index());
    console.log("Player tex:     " + playerObject.get_texture_index());
    console.log("Player pos:     " + playerObject.get_position());
    console.log("Player scale:   " + playerObject.getScale());
    console.log("Player rot:     " + playerObject.getRotation());
    console.log("Player half:    " + playerObject.get_half());

    console.log("Other vert:     " + otherObject.get_model_index());
    console.log("Other tex:      " + otherObject.get_texture_index());
    console.log("Other pos:      " + otherObject.get_position());
    console.log("Other scale:    " + otherObject.getScale());
    console.log("Other rot:      " + otherObject.getRotation());
    console.log("Other half:     " + otherObject.get_half());

    console.log("=== After setters on player ===");
    playerObject.setModelIndex(1);
    playerObject.setTextureIndex(9);
    playerObject.set_position(new Float32Array([7, 8, 9]));
    playerObject.setScale(3.5);
    playerObject.set_rotation(new Float32Array([1, 2, 3]));
    playerObject.set_half(new Float32Array([4, 4, 4]));

    console.log("Player vert:    " + playerObject.get_model_index());
    console.log("Player tex:     " + playerObject.get_texture_index());
    console.log("Player pos:     " + playerObject.get_position());
    console.log("Player scale:   " + playerObject.getScale());
    console.log("Player rot:     " + playerObject.getRotation());
    console.log("Player half:    " + playerObject.get_half());

    console.log("=== Other should be unchanged ===");
    console.log("Other pos:      " + otherObject.get_position());
    console.log("Other rot:      " + otherObject.getRotation());
    console.log("Other half:     " + otherObject.get_half());
}

import * as helper_func from './Helper_Funcs.js';

export function vectorTestPrints() {

    console.log("=== Input Vectors ===");
    const V = new Float32Array([1, -2, 3]);
    const N = new Float32Array([0, 1, 0]);  // simple up normal
    console.log("V:              " + V);
    console.log("N (up normal):  " + N);

    console.log("=== Building Blocks ===");
    const dot = helper_func.vector_dot(V, N);
    console.log("dot(V,N):       " + dot);                          // expect -2
    console.log("dot*2:          " + dot * 2);                      // expect -4

    const scaled = helper_func.vector_mult(N, new Float32Array([dot * 2, dot * 2, dot * 2]));
    console.log("2(V·N)N:        " + scaled);                       // expect [0, -4, 0]

    console.log("=== Reflect V off flat floor (N=[0,1,0]) ===");
    const R = helper_func.vector_reflect(V, N);
    console.log("R:              " + R);                            // expect [1, 2, 3]

    console.log("=== Reflect straight down off floor ===");
    const straight_down = new Float32Array([0, -1, 0]);
    const R2 = helper_func.vector_reflect(straight_down, N);
    console.log("V:              " + straight_down);
    console.log("R:              " + R2);                           // expect [0, 1, 0]

    console.log("=== Reflect off vertical wall (N=[1,0,0]) ===");
    const wall_N = new Float32Array([1, 0, 0]);
    const wall_V = new Float32Array([-3, 1, 2]);
    const R3 = helper_func.vector_reflect(wall_V, wall_N);
    console.log("V:              " + wall_V);
    console.log("N (wall):       " + wall_N);
    console.log("R:              " + R3);                           // expect [3, 1, 2]

    console.log("=== Reflect grazing shot (V parallel to N) ===");
    const parallel_V = new Float32Array([0, 1, 0]);
    const R4 = helper_func.vector_reflect(parallel_V, N);
    console.log("V parallel N:   " + parallel_V);
    console.log("R:              " + R4);                           // expect [0, -1, 0] (straight back)

    console.log("=== Magnitude preserved after reflect ===");
    const magV = helper_func.vector_mag(V);
    const magR = helper_func.vector_mag(R);
    console.log("mag(V):         " + magV.toFixed(4));
    console.log("mag(R):         " + magR.toFixed(4));
    console.log("mags match:     " + (Math.abs(magV - magR) < 0.0001));  // expect true
}