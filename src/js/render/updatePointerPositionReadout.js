import $ from '../utility/querySelector';
import padPrint from '../utility/padPrint'

const READOUT_DIGIT_TRUNC = 6;

export default (thisSegmentEndpoint) => {
  $('#pointerPositionReadout').innerHTML = `x: ${padPrint(thisSegmentEndpoint.x, READOUT_DIGIT_TRUNC)}; y: ${padPrint(thisSegmentEndpoint.y, READOUT_DIGIT_TRUNC)}`;
};
