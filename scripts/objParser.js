const CONST_V_SPACE = 'v'.charCodeAt(0) + ' '.charCodeAt(0);
const CONST_V_T = 'v'.charCodeAt(0) + 't'.charCodeAt(0);
const CONST_V_N = 'v'.charCodeAt(0) + 'n'.charCodeAt(0);
const CONST_F_SPACE = 'f'.charCodeAt(0) + ' '.charCodeAt(0);

const CONST_0 = '0'.charCodeAt(0);
const CONST_1 = '1'.charCodeAt(0);
const CONST_2 = '2'.charCodeAt(0);
const CONST_3 = '3'.charCodeAt(0);
const CONST_4 = '4'.charCodeAt(0);
const CONST_5 = '5'.charCodeAt(0);
const CONST_6 = '6'.charCodeAt(0);
const CONST_7 = '7'.charCodeAt(0);
const CONST_8 = '8'.charCodeAt(0);
const CONST_9 = '9'.charCodeAt(0);
const CONST_DOT = '.'.charCodeAt(0);
const CONST_SLASH = '/'.charCodeAt(0);
const CONST_MINUS = '-'.charCodeAt(0);
const CONST_END_OF_LINE = '\n'.charCodeAt(0);
const CONST_SPACE = ' '.charCodeAt(0);

const V_TYPE = 0
const VT_TYPE = 1
const VN_TYPE = 2
const F_TYPE = 3

const ELEMENT_COUNT_PER_TYPE = [3, 2, 3,(3 * 4)];

export async function parceObjFile(url)
{
  const res = await fetch(url);
  const buffer = await (await res.blob()).arrayBuffer();
  const objBytes = new Uint8Array(buffer);
  const totalObjBytes = objBytes.length;
  var index = 0;
  var vInfo = countLinesOfType(objBytes, totalObjBytes, CONST_V_SPACE);
  var vtInfo = countLinesOfType(objBytes, totalObjBytes, CONST_V_T);
  var vnInfo = countLinesOfType(objBytes, totalObjBytes, CONST_V_N);
  var fInfo = countLinesOfType(objBytes, totalObjBytes, CONST_F_SPACE);

  const vShit = getInfoOfType(objBytes, vInfo, V_TYPE);
  const vtShit = getInfoOfType(objBytes, vtInfo, VT_TYPE);
  const vnShit = getInfoOfType(objBytes, vnInfo, VN_TYPE);
  const fShit = getInfoOfType(objBytes, fInfo, F_TYPE)

  // This currently dosnt handle 3 sets of f only 4.
  return [vShit, vtShit, vnShit, fShit];

}

function getInfoOfType(objBytes, info, modelInfoType) {
  const count = info[0];
  const startIndex = info[1];
  var index = startIndex;
  const numberOfElements = ELEMENT_COUNT_PER_TYPE[modelInfoType] 
  //change this num depedning on type
  if (modelInfoType != F_TYPE) {
    var infoArray = new Float32Array(count * numberOfElements);
  }
  else {
    var infoArray = new Int16Array(count * numberOfElements);
  }

  for (let i = 0; i < count; i++) {
    //change num
    if (modelInfoType != F_TYPE) {
      index = parseLine(objBytes, index, infoArray, numberOfElements * i);
    }
    else {
      index = parseFLine(objBytes, index, infoArray, numberOfElements * i);
    }
  }

  return infoArray;
}

function parseLine(inputArray, index, outputArray, arrayIndex) {
  var char = ""
  while (char != CONST_END_OF_LINE) {
    char = inputArray[index];
    if (char == CONST_SPACE) {
      index = parseNumbers(inputArray, ++index, outputArray, arrayIndex);
    }
    else{
      ++index;
    }
  }
    return index;
}

function parseNumbers(inputArray, index, outputArray, arrayIndex) {
  //make sure I enter past space
  var char = inputArray[index]
  var result = 0.0;
  var sign = 1;
  var isDecimal = false;
  var decimalator = 1.0/10.0;

  while (char != CONST_END_OF_LINE) {
    char = inputArray[index];

    switch(char) {
      case (CONST_END_OF_LINE):
        --index;
      case (CONST_SPACE):
        outputArray[arrayIndex++] = sign * result;
        result = 0.0;
        sign = 1;
        isDecimal = false;
        decimalator = 1.0/10.0;
        break;

      case (CONST_0):
      case (CONST_1):
      case (CONST_2):
      case (CONST_3):
      case (CONST_4):
      case (CONST_5):
      case (CONST_6):
      case (CONST_7):
      case (CONST_8):
      case (CONST_9):
        if (!isDecimal) {
          result = result * 10 + (char - CONST_0);
        }
        else {
          result += decimalator * (char - CONST_0);
          decimalator *= 1.0/10.0;
        }
      break;

      case (CONST_DOT):
        isDecimal = true;
      break;

      case (CONST_MINUS):
        sign = -1;
      break;
    }
    ++index;
  }

  return index;
}

function parseFLine(inputArray, index, outputArray, arrayIndex) {
  var char = ""
  while (char != CONST_END_OF_LINE) 
  {
    char = inputArray[index];
    if (char == CONST_SPACE || index >= inputArray.length) {
      index = parseFNumbers(inputArray, ++index, outputArray, arrayIndex);
    }
    else{
      ++index;
    }
  }
    return index;
}

function parseFNumbers(inputArray, index, outputArray, arrayIndex) {
  //make sure I enter past space
  var char = inputArray[index]
  var result = 0;

  while (char != CONST_END_OF_LINE) {
    char = inputArray[index];

    switch(char) {
      case (CONST_END_OF_LINE):
        --index;
      case (CONST_SPACE):
      case (CONST_SLASH):
        outputArray[arrayIndex++] = result;
        result = 0;
      break;

      case (CONST_0):
      case (CONST_1):
      case (CONST_2):
      case (CONST_3):
      case (CONST_4):
      case (CONST_5):
      case (CONST_6):
      case (CONST_7):
      case (CONST_8):
      case (CONST_9):
        result = result * 10 + (char - CONST_0);
      break;
    }
    ++index;
  }

  return index;
}


// identify line type
// parse vert info
// pare face info

function countLinesOfType(objBytes, totalObjBytes, modelInfoType) {
  var index = 0; 
  var total = 0;
  var endOfLine = true;
  var twoChar = 0;
  var char = 0;
  var targetFound = false;
  var startIndex = 0;

  while (index < totalObjBytes) {
    if (endOfLine) {
      twoChar = objBytes[index] + objBytes[index + 1];
      if (twoChar == modelInfoType) {
        ++total;
        if (!targetFound) {
          startIndex = index;
        }
        targetFound = true;
      }
      else if (targetFound) {
       return [total, startIndex];
      }
      endOfLine = false;
      index += 2;
    }
    else{
        char = objBytes[index];
        endOfLine = (char == CONST_END_OF_LINE);
        ++index;
    }
  }
  return [total, startIndex];
}

