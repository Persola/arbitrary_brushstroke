const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 600;
const RED_PIXEL = [255, 0, 0, 255];
const READOUT_DIGIT_TRUNC = 6;

const PROBABLY_GECKO = navigator.userAgent.includes('Gecko') &&
  !navigator.userAgent.includes('like Gecko');

const settings = {
  brushtipSize: 1
};

const BRUSH_STATE_DEFAULTS = {
  inStroke: false,
  strokePointCount: null, // indexes pointer positions in stroke in order starting from 1
  strokeFirstPointX: NaN,
  strokeFirstPointY: NaN,
  prevPointX: NaN,
  prevPointY: NaN,
  prevSegmentRightWingAngle: NaN,
  prevSegmentLeftWingAngle: NaN,
  prevPointRightWingAngle: NaN, // derived from segment angles
  prevPointLeftWingAngle: NaN, // derived from segment angles
};
const brushState = Object.assign({}, BRUSH_STATE_DEFAULTS);

let cantext = null;

// KICKOFF

// should I be using void before putImageData?

const initializeView = () => {
  $('#view').width = VIEW_WIDTH;
  $('#view').height = VIEW_HEIGHT;
  cantext = $('#view').getContext('2d', {
    alpha: true,
    desynchronized: true, // guessing
    willReadFrequently: true // guessing
  });
  cantext.imageSmoothingEnabled = false;
  fillCheckerboard(cantext);
  cantext.fillStyle = 'green';
};

const fillCheckerboard = (cantext) => {
  for (let x = 0; x < VIEW_WIDTH; x++) {
    for (let y = 0; y < VIEW_WIDTH; y++) {
      if ((x + y) % 2 === 0) {
        cantext.fillStyle = '#fff';
      } else {
        cantext.fillStyle = '#eee';
      }
      cantext.fillRect(x, y, 1, 1);
    }
  }
};

const mouseInCanvas = (evt, rect) => {
  if (
    evt.clientX > rect.left &&
    evt.clientX < rect.right &&
    evt.clientY > rect.top &&
    evt.clientY < rect.bottom
  ) {
    return true;
  }

  return false;
};

const padPrint = (num, maxDigits) => {
  const strNum = String(num);
  if (strNum.length > maxDigits) {
    return strNum.slice(0, maxDigits);
  } else {
    const diff = maxDigits - strNum.length;
    return '&nbsp'.repeat(diff) + strNum;
  }
};

const updatePointerPositionReadout = (thisSegmentEndpoint) => {
  $('#pointerPositionReadout').innerHTML = `x: ${padPrint(thisSegmentEndpoint.x, READOUT_DIGIT_TRUNC)}; y: ${padPrint(thisSegmentEndpoint.y, READOUT_DIGIT_TRUNC)}`;
};

const brushtipIndicatorDataURI = (radius) => {
  const cursorOffset = PROBABLY_GECKO ? radius : radius - 1;
  return `url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='${radius * 2 + 1}'%20height='${radius * 2 + 1}'%3E%3Ccircle%20cx='50%'%20cy='50%'%20r='50%'%20fill='blue'/%3E%3C/svg%3E") ${cursorOffset} ${cursorOffset}, crosshair`;
};

const updateBrushtipIndicatorSize = () => {
  $('body').style.cursor = brushtipIndicatorDataURI(settings.brushtipSize);
}

const renderSegment = (thisSegmentEndpoint) => {
  const thisSegmentStartPoint = {
    x: brushState.prevPointX,
    y: brushState.prevPointY
  };

  const thisSegmentWingAngles = segmentWingAngles(
    thisSegmentStartPoint,
    thisSegmentEndpoint
  );

  let prevSegmentWingAngles;
  let prevPointWingAngles;
  if (brushState.strokePointCount > 2) {
    prevSegmentWingAngles = {
      left: brushState.prevSegmentLeftWingAngle,
      right: brushState.prevSegmentRightWingAngle
    };
    prevPointWingAngles = {
      left: brushState.prevPointLeftWingAngle,
      right: brushState.prevPointRightWingAngle
    };
  } else {
    // don't set prevSegmentWingAngles
    prevPointWingAngles = thisSegmentWingAngles;
  }

  let thisPointWingAngles;
  if (brushState.strokePointCount > 2) {
    thisPointWingAngles = {
      left: radiansArithmeticMean(
        prevSegmentWingAngles.left,
        thisSegmentWingAngles.left
      ),
      right: radiansArithmeticMean(
        prevSegmentWingAngles.right,
        thisSegmentWingAngles.right
      )
    };
  } else { // second stroke point, first stroke segment, so no earlier segment angles
    // don't use prevSegmentWingAngles
    thisPointWingAngles = thisSegmentWingAngles;
  }

  const thisPointWingtipPos = relativeWingtipPositions(thisPointWingAngles);
  const prevPointWingtipPos = relativeWingtipPositions(prevPointWingAngles);

  Object.assign(
    brushState,
    {
      prevPointX: thisSegmentEndpoint.x,
      prevPointY: thisSegmentEndpoint.y,
      prevSegmentLeftWingAngle: thisSegmentWingAngles.left,
      prevSegmentRightWingAngle: thisSegmentWingAngles.right,
      prevPointLeftWingAngle: thisPointWingAngles.left,
      prevPointRightWingAngle: thisPointWingAngles.right
    }
  );
  // traceWings(thisSegmentEndpoint, thisPointWingtipPos);
  fillWingBanners(
    thisSegmentStartPoint,
    thisSegmentEndpoint,
    thisPointWingtipPos,
    prevPointWingtipPos
  );
};

const handlePointerMove = (evt) => {
  const rect = $('#view').getBoundingClientRect();
  const mouseInCanvasNow = mouseInCanvas(evt, rect);
  if (mouseInCanvasNow) {
    updateBrushtipIndicatorSize();
    thisSegmentEndpoint = coordsInView(evt.clientX, evt.clientY);
    updatePointerPositionReadout(thisSegmentEndpoint);
    if (brushState.inStroke) {
      brushState.strokePointCount += 1;
      /* With the first point being set during stroke initialization, at this
         point strokePointCount should be 2 at minimum, so there should exist
         a segment before this point, so we can render it without a check. */
      blot(thisSegmentEndpoint.x, thisSegmentEndpoint.y, 2);
      renderSegment(thisSegmentEndpoint);
    }
  } else {
    $('body').style.cursor = 'crosshair';
    $('#pointerPositionReadout').innerHTML = null;
  }
};

const normalizeRadians = (unnormalized) => {
  if (unnormalized >= 0) {
    return unnormalized % (2 * Math.PI);
  } else {
    return (unnormalized % (2 * Math.PI)) + (2 * Math.PI);
  }
};

const radiansArithmeticMean = (r1, r2, weightFirst) => {
  if (weightFirst === undefined) {
    weightFirst = 0.5;
  }
  weightSecond = 1 - weightFirst;
  if (r1 === r2) {
    return r1;
  }
  let greater;
  let lesser;
  if (r1 > r2) {
    greater = r1;
    lesser = r2;
  } else {
    greater = r2;
    lesser = r1;
  }
  if (greater - lesser === Math.PI) {
    throw('arithmetic mean of directly opposite angles is undefined');
  } else if (greater - lesser < Math.PI) {
    return (
      (r1 * weightFirst) +
      (r2 * weightSecond)
    );
  } else { // greater - lesser > Math.PI
    if (r1 === greater) {
      return normalizeRadians(
        (r1 * weightFirst) +
        ((2 * Math.PI + r2) * weightSecond)
      )
    } else {
      return normalizeRadians(
        (r2 * weightSecond) +
        ((2 * Math.PI + r1) * weightFirst)
      )
    }
  }
};

const segmentWingAngles = (lastPos, currentPos) => {
  const yDelta = currentPos.y - lastPos.y;
  const xDelta = currentPos.x - lastPos.x;
  if (xDelta === 0 && yDelta === 0) {
    blot(currentPos.x, currentPos.y);
    return null;
  }
  const slope = yDelta/xDelta;
  /* We find the angle of the segment vector. Note due to inversion of the
     y-axis on canvas, the unit circle rotates clockwise here (but 0 is still on
     the right). This conversion works with signed zero and signed infinity
     slopes. */
  const segmentAngle = normalizeRadians(
    xDelta >= 0 ?
    Math.atan(slope) :
    Math.atan(slope) + Math.PI
  );
  return {
    left: normalizeRadians(segmentAngle - (Math.PI * 0.5)),
    right: normalizeRadians(segmentAngle + (Math.PI * 0.5))
  };
};

const relativeWingtipPositions = (segmentWingAngles) => {
  const radius = settings.brushtipSize;

  return {
    leftWingtipXDelta: Math.cos(segmentWingAngles.left) * radius,
    leftWingtipYDelta: Math.sin(segmentWingAngles.left) * radius,
    rightWingtipXDelta: Math.cos(segmentWingAngles.right) * radius,
    rightWingtipYDelta: Math.sin(segmentWingAngles.right) * radius
  };
};

const fillWingBanners = (
    thisSegmentStartPoint,
    thisSegmentEndpoint,
    thisPointWingtipPos,
    prevPointWingtipPos
) => {
  let region = new Path2D();
  region.moveTo(
    thisSegmentStartPoint.x + prevPointWingtipPos.leftWingtipXDelta,
    thisSegmentStartPoint.y + prevPointWingtipPos.leftWingtipYDelta
  );
  region.lineTo(
    thisSegmentStartPoint.x + prevPointWingtipPos.rightWingtipXDelta,
    thisSegmentStartPoint.y + prevPointWingtipPos.rightWingtipYDelta
  );
  region.lineTo(
    thisSegmentEndpoint.x + thisPointWingtipPos.rightWingtipXDelta,
    thisSegmentEndpoint.y + thisPointWingtipPos.rightWingtipYDelta
  );
  region.lineTo(
    thisSegmentEndpoint.x + thisPointWingtipPos.leftWingtipXDelta,
    thisSegmentEndpoint.y + thisPointWingtipPos.leftWingtipYDelta
  );
  region.closePath();
  cantext.stroke(region); // switch to fill to get normal stroke
};

const traceWings = (lastPos, wingtipPos) => {
  cantext.lineWidth = 1;
  cantext.strokeStyle = 'blue';
  cantext.beginPath();
  cantext.moveTo(
    lastPos.x + wingtipPos.leftWingtipXDelta,
    lastPos.y + wingtipPos.leftWingtipYDelta
  );
  cantext.lineTo(lastPos.x, lastPos.y);
  cantext.closePath();
  cantext.stroke();

  cantext.strokeStyle = 'red';
  cantext.beginPath();
  cantext.moveTo(
    lastPos.x + wingtipPos.rightWingtipXDelta,
    lastPos.y + wingtipPos.rightWingtipYDelta
  );
  cantext.lineTo(lastPos.x, lastPos.y);
  cantext.closePath();
  cantext.stroke();
};

const markWingtips = (
  lastPos,
  leftWingtipXDelta,
  leftWingtipYDelta,
  rightWingtipXDelta,
  rightWingtipYDelta
) => {
  blot(lastPos.x + leftWingtipXDelta, lastPos.y + leftWingtipYDelta, 1);
  blot(lastPos.x + rightWingtipXDelta, lastPos.y + rightWingtipYDelta, 1);
};

const coordsInView = (screenX, screenY) => {
  const viewsBounds = $('#view').getBoundingClientRect();
  return {
    x: screenX - viewsBounds.left - 0.5, /* part of canvas half pixel off bug fix */
    y: screenY - viewsBounds.top - 0.5 /* part of canvas half pixel off bug fix */
  };
};

const initStroke = (evt) => {
  const coords = coordsInView(evt.clientX, evt.clientY);
  Object.assign(
    brushState,
    {
      inStroke: true,
      strokePointCount: 1,
      strokeFirstPointX: coords.x,
      strokeFirstPointY: coords.y,
      prevPointX: coords.x,
      prevPointY: coords.y
    }
  )
  blot(coords.x, coords.y, 2);
  blot(coords.x, coords.y)
};

const arrayRepeat = (baseArray, times) => {
  const totalLength = baseArray.length * times;
  const repeated = Array(totalLength);

  for (let i = 0; i < totalLength; i++) {
    repeated[i] = baseArray[i % baseArray.length];
  }
  
  return repeated;
};

const blot = (blotCenterX, blotCenterY, customRadius) => {
  const radius = customRadius || settings.brushtipSize;
  cantext.beginPath();
  cantext.arc(
    blotCenterX,
    blotCenterY,
    radius,
    0,
    2 * Math.PI
  );
  cantext.stroke(); // switch to fill to get normal stroke
};

// const blot = (blotCenterX, blotCenterY, customRadius) => {
//   const radius = customRadius || settings.brushtipSize;
//   const imdat = new ImageData(
//     new Uint8ClampedArray(
//       arrayRepeat(RED_PIXEL, (radius * 2 + 1)**2)
//     ),
//     radius * 2 + 1,
//     radius * 2 + 1
//   );
//   const a = Math.ceil(blotCenterX - radius);
//   const b = Math.ceil(blotCenterY - radius);
//   cantext.putImageData(imdat, a, b);
// };

const pointerEndStroke = (evt) => {
  Object.assign(brushState, BRUSH_STATE_DEFAULTS);
  const coords = coordsInView(evt.clientX, evt.clientY);
  blot(coords.x, coords.y);
};

window.onload = () => {
  $('body').addEventListener('pointermove', handlePointerMove, true);
  settings.brushtipSize = Number($('#brushtipSize').value);
  $('#brushtipSize').addEventListener('change', (evt) => {
    settings.brushtipSize = Number($('#brushtipSize').value);
  }, false);
  initializeView();
  $('#view').addEventListener('pointerdown', initStroke, true);
  $('body').addEventListener('pointerup', pointerEndStroke, true);
  $('body').addEventListener('pointercancel', pointerEndStroke, true);
};
