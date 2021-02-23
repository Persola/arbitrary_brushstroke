export default {
  inStroke: false,
  strokePointCount: null, // indexes pointer positions in stroke in order starting from 1
  strokeFirstPointX: NaN,
  strokeFirstPointY: NaN,
  prevPointX: NaN,
  prevPointY: NaN,
  segmentEndingAtPrevPointRightWingAngle: NaN,
  segmentEndingAtPrevPointLeftWingAngle: NaN,
  prevPointRightWingAngle: NaN, // derived from segment angles
  prevPointLeftWingAngle: NaN, // derived from segment angles
};
