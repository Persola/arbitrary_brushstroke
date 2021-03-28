import './style.css';

import $ from './js/utility/querySelector';
import coordsWithinPainting from './js/utility/coordsWithinPainting'
import mouseInPainting from './js/utility/mouseInPainting'
import settings from './js/state/settings'

import radiansArithmeticMean from './js/trig/radiansArithmeticMean'

import updateBrushtipIndicatorSize from './js/render/updateBrushtipIndicatorSize'
import updatePointerPositionReadout from './js/render/updatePointerPositionReadout'
import fillPlaid from './js/render/fillPlaid'
import mapPointBallIntoStrokeLayer from './js/render/mapPointBallIntoStrokeLayer'
import mapSegmentRectIntoStrokeLayer from './js/render/mapSegmentRectIntoStrokeLayer'

import BRUSH_STATE_DEFAULTS from './js/state/brushStateDefaults'

const PAINTING_WIDTH = 400;
const PAINTING_HEIGHT = 400;

const brushState = Object.assign({}, BRUSH_STATE_DEFAULTS);

const cxt = {
  painting: null,
  strokeLayer: null
};

const initializePainting = () => {
  initializeCanvas('painting', 'rgba(255, 133, 0, 255)');
  initializeCanvas('strokeLayer', 'rgba(0, 0, 0, 0)');
  // fillPlaid(cxt.painting, PAINTING_WIDTH, PAINTING_HEIGHT);
};

const initializeCanvas = (elId, fillColor) => {
  $(`#${elId}`).width = PAINTING_WIDTH;
  $(`#${elId}`).height = PAINTING_HEIGHT;
  cxt[elId] = $(`#${elId}`).getContext('2d', {
    alpha: true,
    desynchronized: true, // guessing
    willReadFrequently: true // guessing
  });
  cxt.imageSmoothingEnabled = false;
  cxt[elId].fillStyle = fillColor;
  cxt[elId].fillRect(0, 0, PAINTING_WIDTH, PAINTING_HEIGHT);
};

const initStroke = (evt) => {
  if (brushState.inStroke) {
    throw TypeError('Already in stroke!');
  };
  const coords = coordsWithinPainting(evt.clientX, evt.clientY);
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
  mapPointBallIntoStrokeLayer(cxt, coords, settings.brushtipSize);
};

const handlePointerMove = (evt) => {
  const paintingBounds = $('#painting').getBoundingClientRect();
  if (mouseInPainting(evt, paintingBounds)) {
    updateBrushtipIndicatorSize(settings.brushtipSize);
    const thisPointCoords = coordsWithinPainting(evt.clientX, evt.clientY);
    updatePointerPositionReadout(thisPointCoords);
    if (brushState.inStroke) {
      brushState.strokePointCount += 1;
      mapPointBallIntoStrokeLayer(cxt, thisPointCoords, settings.brushtipSize);
      /* With the first point being set during stroke initialization, at this
         point strokePointCount should be 2 at minimum, so there should exist
         a segment ending on this point, so we can render it without a check. */
      mapSegmentRectIntoStrokeLayer(
        cxt,
        {
          x: brushState.prevPointX,
          y: brushState.prevPointY
        },
        thisPointCoords,
        settings.brushtipSize
      );
      Object.assign(
        brushState,
        {
          prevPointX: thisPointCoords.x,
          prevPointY: thisPointCoords.y
        }
      );
    }
  } else {
    $('body').style.cursor = 'crosshair';
    $('#pointerPositionReadout').innerHTML = null;
  }
};

const endStroke = (evt) => {
  if (!brushState.inStroke) {
    throw TypeError('Not in stroke!');
  };
  const coords = coordsWithinPainting(evt.clientX, evt.clientY);
  mapPointBallIntoStrokeLayer(cxt, coords, settings.brushtipSize);
  commitStroke();
  Object.assign(brushState, BRUSH_STATE_DEFAULTS);
};

const commitStroke = () => {
  cxt.painting.drawImage($('#strokeLayer'), 0, 0);
  clearStrokeLayer();
};

const clearStrokeLayer = () => {
  cxt.strokeLayer.globalCompositeOperation = 'copy';
  cxt.strokeLayer.fillStyle = 'rgba(0, 0, 0, 0)';
  cxt.strokeLayer.fillRect(0, 0, PAINTING_WIDTH, PAINTING_HEIGHT);
  cxt.strokeLayer.globalCompositeOperation = 'source-over';    
};

const updateBrushtipSize = () => {
  settings.brushtipSize = Number($('#brushtipSize').value);
};

window.onload = () => {
  initializePainting();
  updateBrushtipSize(); // for cached input values
  $('#brushtipSize').addEventListener('change', updateBrushtipSize, false);
  $('body').addEventListener('pointerdown', initStroke, true);
  $('body').addEventListener('pointermove', handlePointerMove, true);
  $('body').addEventListener('pointerup', endStroke, true);
  $('body').addEventListener('pointercancel', endStroke, true);
};
