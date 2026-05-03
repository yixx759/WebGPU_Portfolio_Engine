import {absVectorSubtract, vectorAdd} from "./helperFuncs.js";

export function makeColliderFromVerts(vertexs)
{
    let maxVals = new Float32Array([0, 0, 0]);
    // Multi thread me
    for (let i = 0; i < vertexs.length; i+= 8)
    {
        maxVals[0] = Math.max(Math.abs(vertexs[i]), maxVals[0])
        maxVals[1] = Math.max(Math.abs(vertexs[i+1]), maxVals[1])
        maxVals[2] = Math.max(Math.abs(vertexs[i+2]), maxVals[2])
    }
  
    return new Float32Array([Math.abs(maxVals[0]), Math.abs(maxVals[1]), Math.abs(maxVals[2]), 0]);
}

export function AABB(positionA, halfA, positionB, halfB) {
    const diff = absVectorSubtract(positionA, positionB);
    const totalHalfs = vectorAdd(halfA, halfB);

    return (diff[0] <= totalHalfs[0]) && (diff[1] <= totalHalfs[1]) && (diff[2] <= totalHalfs[2])
}