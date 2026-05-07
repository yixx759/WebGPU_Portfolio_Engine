import { debugLog } from './Render.js'

export const DIR_FORWARD = new Float32Array([0,0,-1]);
export const WORLD_UP_VECTOR= new Float32Array([0,1,0]);

export function multiplyFloat32Matrices(A, B) {
  
  const numRows = 4;
  const numCols = 4;

    let C = new Float32Array(numRows * numCols);
    
    for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numCols; j++) {
            let sum = 0.0;
            for (let k = 0; k < numCols; k++) {
                sum += A[i * numCols + k] * B[k * numCols + j];
            }
            C[i * numCols + j] = sum;
        }
    }
    
    return C;
}

export function getWorldMatrix(posX,posY,posZ,angleRotX, angleRotY, angleRotZ, scale)
{
 var transformMatrix = new Float32Array([
    1,0,0,0,
    0,1,0,0,
    0,0,1,0,
    posX,posY,posZ,1
  ])


  var scaleMatrix = new Float32Array([
    scale,0,0,0,
    0,scale,0,0,
    0,0,scale,0,
    0,0,0,1
  ])

  // from angle to radians

  angleRotX = angleRotX * Math.PI / 180;
  angleRotY = angleRotY * Math.PI / 180;
  angleRotZ = angleRotZ * Math.PI / 180;

  var rotX = new Float32Array([
    1.0, 0.0, 0.0, 0.0,
    0.0, Math.cos(angleRotX), -Math.sin(angleRotX), 0.0,
    0.0, Math.sin(angleRotX), Math.cos(angleRotX), 0.0,
    0.0, 0.0, 0.0, 1.0,
    ]);

    var rotY = new Float32Array([
    Math.cos(angleRotY), 0.0, Math.sin(angleRotY), 0.0,
    0.0, 1, 0, 0.0,
    -Math.sin(angleRotY), 0, Math.cos(angleRotY), 0.0,
    0.0, 0.0, 0.0, 1.0,
    ]);

    var rotZ = new Float32Array([
    Math.cos(angleRotZ), -Math.sin(angleRotZ), 0.0, 0.0,
    Math.sin(angleRotZ), Math.cos(angleRotZ), 0.0,  0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0,
    ]);

    let rotationMatrix = multiplyFloat32Matrices(multiplyFloat32Matrices(rotZ,rotY),rotX);

    return multiplyFloat32Matrices(multiplyFloat32Matrices(rotationMatrix,transformMatrix),scaleMatrix);
};

export function getWorldMatrixArray(position, angleRotation, scale)
{
 var transformMatrix = new Float32Array([
    1,0,0,0,
    0,1,0,0,
    0,0,1,0,
    position[0], position[1], position[2], 1
  ])


  var scaleMatrix = new Float32Array([
    scale,0,0,0,
    0,scale,0,0,
    0,0,scale,0,
    0,0,0,1
  ])

  // from angle to radians

  angleRotation[0] = angleRotation[0] * Math.PI / 180;
  angleRotation[1] = angleRotation[1] * Math.PI / 180;
  angleRotation[2] = angleRotation[2] * Math.PI / 180;

  var rotX = new Float32Array([
    1.0, 0.0, 0.0, 0.0,
    0.0, Math.cos(angleRotation[0]), -Math.sin(angleRotation[0]), 0.0,
    0.0, Math.sin(angleRotation[0]), Math.cos(angleRotation[0]), 0.0,
    0.0, 0.0, 0.0, 1.0,
    ]);

    var rotY = new Float32Array([
    Math.cos(angleRotation[1]), 0.0, Math.sin(angleRotation[1]), 0.0,
    0.0, 1, 0, 0.0,
    -Math.sin(angleRotation[1]), 0, Math.cos(angleRotation[1]), 0.0,
    0.0, 0.0, 0.0, 1.0,
    ]);

    var rotZ = new Float32Array([
    Math.cos(angleRotation[2]), -Math.sin(angleRotation[2]), 0.0, 0.0,
    Math.sin(angleRotation[2]), Math.cos(angleRotation[2]), 0.0,  0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0,
    ]);

    let rotationMatrix = multiplyFloat32Matrices(multiplyFloat32Matrices(rotZ,rotY),rotX);

    return multiplyFloat32Matrices(multiplyFloat32Matrices(rotationMatrix,transformMatrix),scaleMatrix);
};

export function negateVertex(inpVec)
{
  let vec = new Float32Array([...inpVec]);

  for (let i = 0; i < vec.length; i++) {
    vec[i] = -vec[i];
  }
  return vec;
}

export function vectorAdd(A, B){
  return new Float32Array([A[0]+B[0], A[1]+B[1],A[2]+B[2], 0]);
}

export function vector_mult(A, mag_vector){
  return new Float32Array([A[0]*mag_vector[0], A[1]*mag_vector[1],A[2]*mag_vector[2], 0]);
}

export function vector_add_cam(A, X, Z){
  A[0]+=X;
  A[2]+=Z;
}

export function vector_assign_cam(A,B){
  A[0]=B[0];
  A[1]=B[1];
  A[2]=B[2];
  A[3]=B[3];
}


export function vectorAdd_NonFloat(A, B){
  return new [A[0]+B[0], A[1]+B[1],A[2]+B[2], 0];
}

export function vectorSubtract(A, B){
  return new Float32Array([A[0]-B[0], A[1]-B[1],A[2]-B[2]]);
}

export function absVectorSubtract(A, B){
  return new Float32Array([Math.abs(A[0]-B[0]), Math.abs(A[1]-B[1]), Math.abs(A[2]-B[2])]);
}

export function vectorDot(A, B){
  return A[0]*B[0]+ A[1]*B[1] + A[2]*B[2];
}

export function vectorCross(A, B){
  return [A[1]*B[2] - A[2]*B[1], A[2]*B[0] - A[0]*B[2] ,A[0]*B[1] - A[1]*B[0]];
}

export function vectorMag(A){
  return Math.sqrt(A[0]*A[0]+ A[1]*A[1] + A[2]*A[2]);

}

export function vectorNorm(A){
  const mag = vectorMag(A);
  return [A[0]/mag, A[1]/mag, A[2]/mag];
}

export function applyWorldToCollider(vec, matrix)
{
  return [vec[0]+matrix[12],vec[0]+matrix[13],vec[0]+matrix[14], 0]; 
}

export function getViewMatrix(forward, up, camPos){
    const right = vectorCross(up,forward);
    const nuUp = vectorCross(right, forward);

    // debugLog("Forward vec:" + forward)

    const view =  new Float32Array([
    right[0] , nuUp[0], forward[0], 0,
    right[1] , nuUp[1], forward[1], 0,
    right[2] , nuUp[2], forward[2], 0,
    -vectorDot(right, camPos) , -vectorDot(nuUp, camPos), -vectorDot(forward, camPos), 1,
    ])

  return view;
}

export function getPerspectiveMatrix(FOV, n, f){
    const S = 1 / Math.tan((FOV/2) * (Math.PI / 180));

    const fn = ((f) / (n-f)); 
    const fMn = ((f*n) / (n-f)); 

    const test = new Float32Array([
    S,0,0,0,
    0,S,0,0,
    0,0,fn, -1,
    0,0, fMn ,0
    ]);

  return test;
}

export function getVertexBufferFromDecodedObj(decodedObj) {
  const vertexPositionBuffer = decodedObj[0];
  const textureCoordBuffer = decodedObj[1];
  const normalBuffer = decodedObj[2];
  const faceIndexBuffer = decodedObj[3];
  
  const fLengthDivideThree = (faceIndexBuffer.length/3);
  const length = (fLengthDivideThree * 1.5) * 8;
  var outputVertexBuffer = new Float32Array(length);
  var index = 0;
  for (let i = 0; i < faceIndexBuffer.length; i += 4*3, index += 6*8) {
    //for this
    const faceVertPos0 = (faceIndexBuffer[i] - 1) * 3;
    const faceVertPos1 = (faceIndexBuffer[i + 3]- 1) * 3;
    const faceVertPos2 = (faceIndexBuffer[i + 6]- 1) * 3;
    const faceVertPos3 = (faceIndexBuffer[i + 9]- 1) * 3;

    const faceTexCoord0 = (faceIndexBuffer[i + 1]- 1) * 2 ;
    const faceTexCoord1 = (faceIndexBuffer[i + 1 + 3]- 1) * 2;
    const faceTexCoord2 = (faceIndexBuffer[i + 1 + 6]- 1) * 2 ;
    const faceTexCoord3 = (faceIndexBuffer[i + 1 + 9 ]- 1) * 2 ;

    const faceNormal0 = (faceIndexBuffer[i + 2] - 1) * 3;
    const faceNormal1 = (faceIndexBuffer[i + 2 + 3] - 1) * 3;
    const faceNormal2 = (faceIndexBuffer[i + 2 + 6] - 1) * 3;
    const faceNormal3 = (faceIndexBuffer[i + 2 + 9 ] - 1) * 3;
  
    var indexOffset = 0;

    outputVertexBuffer[index] = vertexPositionBuffer[faceVertPos0];
    outputVertexBuffer[index + 1] = vertexPositionBuffer[faceVertPos0 + 1];
    outputVertexBuffer[index + 2] = vertexPositionBuffer[faceVertPos0 + 2];
    outputVertexBuffer[index + 3] = textureCoordBuffer[faceTexCoord0];
    outputVertexBuffer[index + 4] = textureCoordBuffer[faceTexCoord0 + 1];
    outputVertexBuffer[index + 5] = normalBuffer[faceNormal0];
    outputVertexBuffer[index + 6] = normalBuffer[faceNormal0 + 1];
    outputVertexBuffer[index + 7] = normalBuffer[faceNormal0 + 2];

    indexOffset += 8;
    outputVertexBuffer[index + indexOffset] = vertexPositionBuffer[faceVertPos1];
    outputVertexBuffer[index + 1 + indexOffset] = vertexPositionBuffer[faceVertPos1 + 1];
    outputVertexBuffer[index + 2 + indexOffset] = vertexPositionBuffer[faceVertPos1 + 2];
    outputVertexBuffer[index + 3 + indexOffset] = textureCoordBuffer[faceTexCoord1];
    outputVertexBuffer[index + 4 + indexOffset] = textureCoordBuffer[faceTexCoord1 + 1];
    outputVertexBuffer[index + 5 + indexOffset] = normalBuffer[faceNormal1];
    outputVertexBuffer[index + 6 + indexOffset] = normalBuffer[faceNormal1 + 1];
    outputVertexBuffer[index + 7 + indexOffset] = normalBuffer[faceNormal1 + 2];

    indexOffset += 8;
    outputVertexBuffer[index + indexOffset] = vertexPositionBuffer[faceVertPos3];
    outputVertexBuffer[index + 1 + indexOffset] = vertexPositionBuffer[faceVertPos3 + 1];
    outputVertexBuffer[index + 2 + indexOffset] = vertexPositionBuffer[faceVertPos3 + 2];
    outputVertexBuffer[index + 3 + indexOffset] = textureCoordBuffer[faceTexCoord3];
    outputVertexBuffer[index + 4 + indexOffset] = textureCoordBuffer[faceTexCoord3 + 1];
    outputVertexBuffer[index + 5 + indexOffset] = normalBuffer[faceNormal3];
    outputVertexBuffer[index + 6 + indexOffset] = normalBuffer[faceNormal3 + 1];
    outputVertexBuffer[index + 7 + indexOffset] = normalBuffer[faceNormal3 + 2];

    indexOffset += 8;
    outputVertexBuffer[index + indexOffset] = vertexPositionBuffer[faceVertPos1];
    outputVertexBuffer[index + 1 + indexOffset] = vertexPositionBuffer[faceVertPos1 + 1];
    outputVertexBuffer[index + 2 + indexOffset] = vertexPositionBuffer[faceVertPos1 + 2];
    outputVertexBuffer[index + 3 + indexOffset] = textureCoordBuffer[faceTexCoord1];
    outputVertexBuffer[index + 4 + indexOffset] = textureCoordBuffer[faceTexCoord1 + 1];
    outputVertexBuffer[index + 5 + indexOffset] = normalBuffer[faceNormal1];
    outputVertexBuffer[index + 6 + indexOffset] = normalBuffer[faceNormal1 + 1];
    outputVertexBuffer[index + 7 + indexOffset] = normalBuffer[faceNormal1 + 2];


    indexOffset += 8;
    outputVertexBuffer[index + indexOffset] = vertexPositionBuffer[faceVertPos2];
    outputVertexBuffer[index + 1 + indexOffset] = vertexPositionBuffer[faceVertPos2 + 1];
    outputVertexBuffer[index + 2 + indexOffset] = vertexPositionBuffer[faceVertPos2 + 2];
    outputVertexBuffer[index + 3 + indexOffset] = textureCoordBuffer[faceTexCoord2];
    outputVertexBuffer[index + 4 + indexOffset] = textureCoordBuffer[faceTexCoord2 + 1];
    outputVertexBuffer[index + 5 + indexOffset] = normalBuffer[faceNormal2];
    outputVertexBuffer[index + 6 + indexOffset] = normalBuffer[faceNormal2 + 1];
    outputVertexBuffer[index + 7 + indexOffset] = normalBuffer[faceNormal2 + 2];

    indexOffset += 8;
    outputVertexBuffer[index + indexOffset] = vertexPositionBuffer[faceVertPos3];
    outputVertexBuffer[index + 1 + indexOffset] = vertexPositionBuffer[faceVertPos3 + 1];
    outputVertexBuffer[index + 2 + indexOffset] = vertexPositionBuffer[faceVertPos3 + 2];
    outputVertexBuffer[index + 3 + indexOffset] = textureCoordBuffer[faceTexCoord3];
    outputVertexBuffer[index + 4 + indexOffset] = textureCoordBuffer[faceTexCoord3 + 1];
    outputVertexBuffer[index + 5 + indexOffset] = normalBuffer[faceNormal3];
    outputVertexBuffer[index + 6 + indexOffset] = normalBuffer[faceNormal3 + 1];
    outputVertexBuffer[index + 7 + indexOffset] = normalBuffer[faceNormal3 + 2];

    //console.log( textureCoordBuffer[faceVertPos0]);
  //print test
}


  return outputVertexBuffer;
}

export async function loadImageBitmap(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return await createImageBitmap(blob, { colorSpaceConversion: 'none' });
}

export async function loadShader(url) {
    const response = await fetch(url);
    return await response.text();
}
