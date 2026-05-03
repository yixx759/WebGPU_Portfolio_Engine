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