import { instanceOf } from '../../common/functions/instanceOf';
import { ScalarType, Vector2Type, Vector3Type } from '../../common/types/NumericalTypes';
import { StateAlias } from '../types/StateAlias';

interface weightedState {
  type: StateAlias
  value: ScalarType | Vector2Type | Vector3Type
}

interface outputState {
  type: StateAlias
  weight: number
}

// get ring buffer

const outputBlendStateBuffer: outputState[] = new Array<outputState>(1);
let totalDistance = 0;
let distance: number;
let bufferPosition: number;
let _outputBlendState: outputState;
let i = 0;
let a: number;
let b: number;
let c: number;

export function computeOutputFromWeightedStates (
  inputValue: ScalarType | Vector2Type | Vector3Type,
  blendStateValues: weightedState[]
): outputState[] {
  bufferPosition = 0;
  totalDistance = 0;
  blendStateValues.forEach(state => {
    // compute distance
    distance = computeDistance(inputValue, state.value);
    // if distance is less than 1.5 (slightly more than sqrt 2/2), continue
    if (distance > 1.5) {
      // Cull
    } else {
      _outputBlendState = {
        type: state.type,
        weight: distance
      };
      // otherwise, add to buffer as statetype and magnitude
      if (bufferPosition > outputBlendStateBuffer.length) {
        outputBlendStateBuffer.push(_outputBlendState);
        totalDistance += distance;
      } else {
        outputBlendStateBuffer[bufferPosition] = _outputBlendState;
      }
      bufferPosition++;
    }
  });

  for (i = 0; i <= bufferPosition; i++) {
    //  divide all magnitudes by total to normalize, and invert (1.0 - val)
    outputBlendStateBuffer[bufferPosition].weight = normalizedRelu(
      1.0 - outputBlendStateBuffer[bufferPosition].weight / totalDistance
    );
  }
  return outputBlendStateBuffer;
}

const normalizedRelu = function (x) {
  x = x * 2 - 1;
  return x > 0 ? x : 0;
};

function computeDistance (p0: ScalarType | Vector2Type | Vector3Type, p1: ScalarType | Vector2Type | Vector3Type): number {
  // P1 = (x1, y1, z1); P2 = (x2, y2, z2)
  a = instanceOf<ScalarType>(p1) ? p1[0] - p0[0] : 0;
  b = instanceOf<Vector2Type>(p1) && instanceOf<Vector2Type>(p0) ? p1[1] - p0[1] : 0;
  c = instanceOf<Vector3Type>(p1) && instanceOf<Vector3Type>(p0) ? p1[2] - p0[2] : 0;
  return Math.sqrt(a * a + b * b + c * c);
}
