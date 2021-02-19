import './style.css';

import $ from './js/utility/querySelector';
import coordsInView from './js/utility/coordsInView'
import mouseInCanvas from './js/utility/mouseInCanvas'
import settings from './js/state/settings'

import radiansArithmeticMean from './js/trig/radiansArithmeticMean'
import segmentWingAngles from './js/trig/segmentWingAngles'
import relativeWingtipPositions from './js/trig/relativeWingtipPositions'

import blot from './js/render/blot'
import fillWingBanners from './js/render/fillWingBanners'
import traceWings from './js/render/traceWings'
import updateBrushtipIndicatorSize from './js/render/updateBrushtipIndicatorSize'
import updatePointerPositionReadout from './js/render/updatePointerPositionReadout'
import fillCheckerboard from './js/render/fillCheckerboard'

import BRUSH_STATE_DEFAULTS from './js/state/brushStateDefaults'

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 600;

const brushState = Object.assign({}, BRUSH_STATE_DEFAULTS);

let cantext = null;

const initializeView = () => {
  $('#view').width = VIEW_WIDTH;
  $('#view').height = VIEW_HEIGHT;
  cantext = $('#view').getContext('2d', {
    alpha: true,
    desynchronized: true, // guessing
    willReadFrequently: true // guessing
  });
  cantext.imageSmoothingEnabled = false;
  fillCheckerboard(cantext, VIEW_WIDTH, VIEW_HEIGHT);
  cantext.fillStyle = 'green';
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
  blot(cantext, coords.x, coords.y, 2);
  blot(cantext, coords.x, coords.y, settings.brushtipSize)
};

const handlePointerMove = (evt) => {
  const rect = $('#view').getBoundingClientRect();
  const mouseInCanvasNow = mouseInCanvas(evt, rect);
  if (mouseInCanvasNow) {
    updateBrushtipIndicatorSize(settings.brushtipSize);
    const thisSegmentEndpoint = coordsInView(evt.clientX, evt.clientY);
    updatePointerPositionReadout(thisSegmentEndpoint);
    if (brushState.inStroke) {
      brushState.strokePointCount += 1;
      /* With the first point being set during stroke initialization, at this
         point strokePointCount should be 2 at minimum, so there should exist
         a segment before this point, so we can render it without a check. */
      blot(cantext, thisSegmentEndpoint.x, thisSegmentEndpoint.y, 2);
      renderSegment(thisSegmentEndpoint);
    }
  } else {
    $('body').style.cursor = 'crosshair';
    $('#pointerPositionReadout').innerHTML = null;
  }
};

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

  const thisPointWingtipPos = relativeWingtipPositions(
    thisPointWingAngles,
    settings.brushtipSize
  );
  const prevPointWingtipPos = relativeWingtipPositions(
    prevPointWingAngles,
    settings.brushtipSize
  );

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
  // traceWings(cantext, thisSegmentEndpoint, thisPointWingtipPos);
  fillWingBanners(
    cantext,
    thisSegmentStartPoint,
    thisSegmentEndpoint,
    thisPointWingtipPos,
    prevPointWingtipPos
  );
};

const pointerEndStroke = (evt) => {
  Object.assign(brushState, BRUSH_STATE_DEFAULTS);
  const coords = coordsInView(evt.clientX, evt.clientY);
  blot(cantext, coords.x, coords.y, settings.brushtipSize);
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
