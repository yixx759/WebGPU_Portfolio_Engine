export function objectTestPrints(playerObject, otherObject, indexArray, transformArray)
{
    console.log("=== Initial values ===");
    console.log("Player vert:    " + playerObject.getModelIndex(indexArray));
    console.log("Player tex:     " + playerObject.getTextureIndex(indexArray));
    console.log("Player pos:     " + playerObject.getPosition(transformArray));
    console.log("Player scale:   " + playerObject.getScale(transformArray));
    console.log("Player rot:     " + playerObject.getRotation(transformArray));
    console.log("Player half:    " + playerObject.getHalf(transformArray));

    console.log("Other vert:     " + otherObject.getModelIndex(indexArray));
    console.log("Other tex:      " + otherObject.getTextureIndex(indexArray));
    console.log("Other pos:      " + otherObject.getPosition(transformArray));
    console.log("Other scale:    " + otherObject.getScale(transformArray));
    console.log("Other rot:      " + otherObject.getRotation(transformArray));
    console.log("Other half:     " + otherObject.getHalf(transformArray));

    console.log("=== After setters on player ===");
    playerObject.setModelIndex(indexArray, 1);
    playerObject.setTextureIndex(indexArray, 9);
    playerObject.setPosition(transformArray, new Float32Array([7, 8, 9]));
    playerObject.setScale(transformArray, 3.5);
    playerObject.setRotation(transformArray, new Float32Array([1, 2, 3]));
    playerObject.setHalf(transformArray, new Float32Array([4, 4, 4]));

    console.log("Player vert:    " + playerObject.getModelIndex(indexArray));
    console.log("Player tex:     " + playerObject.getTextureIndex(indexArray));
    console.log("Player pos:     " + playerObject.getPosition(transformArray));
    console.log("Player scale:   " + playerObject.getScale(transformArray));
    console.log("Player rot:     " + playerObject.getRotation(transformArray));
    console.log("Player half:    " + playerObject.getHalf(transformArray));

    console.log("=== Other should be unchanged ===");
    console.log("Other pos:      " + otherObject.getPosition(transformArray));
    console.log("Other rot:      " + otherObject.getRotation(transformArray));
    console.log("Other half:     " + otherObject.getHalf(transformArray));
}

import * as helper_func from './helperFuncs.js';

export function vectorTestPrints() {

    console.log("=== Input Vectors ===");
    const V = new Float32Array([1, -2, 3]);
    const N = new Float32Array([0, 1, 0]);  // simple up normal
    console.log("V:              " + V);
    console.log("N (up normal):  " + N);

    console.log("=== Building Blocks ===");
    const dot = helper_func.vectorDot(V, N);
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
    const magV = helper_func.vectorMag(V);
    const magR = helper_func.vectorMag(R);
    console.log("mag(V):         " + magV.toFixed(4));
    console.log("mag(R):         " + magR.toFixed(4));
    console.log("mags match:     " + (Math.abs(magV - magR) < 0.0001));  // expect true
}