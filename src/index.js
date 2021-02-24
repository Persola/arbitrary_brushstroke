import './style.css';

import $ from './js/utility/querySelector';
import coordsWithinPainting from './js/utility/coordsWithinPainting'
import mouseInPainting from './js/utility/mouseInPainting'
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

const PAINTING_WIDTH = 300;
const PAINTING_HEIGHT = 300;

const brushState = Object.assign({}, BRUSH_STATE_DEFAULTS);

const cxt = {
  painting: null,
  strokeLayer: null
};

const initializeCanvas = (elId) => {
  $(`#${elId}`).width = PAINTING_WIDTH;
  $(`#${elId}`).height = PAINTING_HEIGHT;
  cxt[elId] = $(`#${elId}`).getContext('2d', {
    alpha: true,
    desynchronized: true, // guessing
    willReadFrequently: true // guessing
  });
  cxt[elId].imageSmoothingEnabled = false;
};

const initializePainting = () => {
  initializeCanvas('painting');
  initializeCanvas('strokeLayer');
  fillCheckerboard(cxt.painting, PAINTING_WIDTH, PAINTING_HEIGHT);
  cxt.strokeLayer.fillStyle = 'rgba(0, 0, 0, 0)';
  cxt.strokeLayer.fillRect(0, 0, PAINTING_WIDTH, PAINTING_HEIGHT);
  cxt.painting.fillStyle = 'rgba(255, 133, 0, 255)';
  cxt.painting.fillRect(0, 0, PAINTING_WIDTH, PAINTING_HEIGHT);
};

const initStroke = (evt) => {
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
  // blot(paintingCtx, coords.x, coords.y, 2);
  // blot(paintingCtx, coords.x, coords.y, settings.brushtipSize)
};

const handlePointerMove = (evt) => {
  const paintingBounds = $('#painting').getBoundingClientRect();
  if (mouseInPainting(evt, paintingBounds)) {
    updateBrushtipIndicatorSize(settings.brushtipSize);
    const thisPointCoords = coordsWithinPainting(evt.clientX, evt.clientY);
    updatePointerPositionReadout(thisPointCoords);
    if (brushState.inStroke) {
      brushState.strokePointCount += 1;
      /* With the first point being set during stroke initialization, at this
         point strokePointCount should be 2 at minimum, so there should exist
         a segment before this point, so we can render it without a check. */
      // renderSegment(thisPointCoords);
      mapIntoStrokeLayer(thisPointCoords);
      // blot(paintingCtx, thisPointCoords.x, thisPointCoords.y, 2);
    }
  } else {
    $('body').style.cursor = 'crosshair';
    $('#pointerPositionReadout').innerHTML = null;
  }
};

const mapIntoStrokeLayer = (thisPointCoords) => {
  const width = (5 * 2) + 1;
  const height = (5 * 2) + 1;
  const imDat = cxt.painting.getImageData(
    thisPointCoords.x - 5,
    thisPointCoords.y - 5,
    width,
    height
  );
  
  const totalPixels = width * height;

  let mappedRawData = [];
  for (let pixelInd = 0; pixelInd < totalPixels; pixelInd++) {
    let originalPixel = imDat.data.slice(
      pixelInd * 4,
      (pixelInd + 1) * 4
    );
    if (originalPixel[1] < 200) {
      console.log('sdf');
    }
    mappedRawData.push(...pixelMap(originalPixel));
  }

  const imdat = new ImageData(
    new Uint8ClampedArray(mappedRawData),
    width,
    height
  );
  createImageBitmap(imdat).then((imageBitmap) => { // premultiply here?
    cxt.strokeLayer.drawImage(
      imageBitmap,
      thisPointCoords.x - 5,
      thisPointCoords.y - 5
    );
  }).catch((error) => {
    console.log(error);
  });;
};

const pixelMap = (originalPixel) => {
  return [
    originalPixel[1],
    originalPixel[2],
    originalPixel[0],
    255
  ];
};

const renderSegment = (thisPoint) => {
  const prevPoint = {
    x: brushState.prevPointX,
    y: brushState.prevPointY
  };

  const segmentEndingAtPrevPointWingAngle = segmentWingAngles(
    prevPoint,
    thisPoint
  );

  let segmentEndingAtPrevPointWingAngles;
  let prevPointWingAngles;
  if (brushState.strokePointCount > 2) {
    segmentEndingAtPrevPointWingAngles = {
      left: brushState.segmentEndingAtPrevPointLeftWingAngle,
      right: brushState.segmentEndingAtPrevPointRightWingAngle
    };
    prevPointWingAngles = {
      left: brushState.prevPointLeftWingAngle,
      right: brushState.prevPointRightWingAngle
    };
  } else {
    // don't set segmentEndingAtPrevPointWingAngles
    prevPointWingAngles = segmentEndingAtPrevPointWingAngle;
  }

  let thisPointWingAngles;
  if (brushState.strokePointCount > 2) {
    thisPointWingAngles = {
      left: radiansArithmeticMean(
        segmentEndingAtPrevPointWingAngles.left,
        segmentEndingAtPrevPointWingAngle.left
      ),
      right: radiansArithmeticMean(
        segmentEndingAtPrevPointWingAngles.right,
        segmentEndingAtPrevPointWingAngle.right
      )
    };
  } else { // second stroke point, first stroke segment, so no earlier segment angles
    // don't use segmentEndingAtPrevPointWingAngles
    thisPointWingAngles = segmentEndingAtPrevPointWingAngle;
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
      prevPointX: thisPoint.x,
      prevPointY: thisPoint.y,
      segmentEndingAtPrevPointLeftWingAngle: segmentEndingAtPrevPointWingAngle.left,
      segmentEndingAtPrevPointRightWingAngle: segmentEndingAtPrevPointWingAngle.right,
      prevPointLeftWingAngle: thisPointWingAngles.left,
      prevPointRightWingAngle: thisPointWingAngles.right
    }
  );
  // traceWings(paintingCtx, thisPoint, thisPointWingtipPos);
  // fillWingBanners(
  //   paintingCtx,
  //   prevPoint,
  //   thisPoint,
  //   thisPointWingtipPos,
  //   prevPointWingtipPos
  // );
};

const endStroke = (evt) => {
  Object.assign(brushState, BRUSH_STATE_DEFAULTS);
  const coords = coordsWithinPainting(evt.clientX, evt.clientY);
  // blot(paintingCtx, coords.x, coords.y, settings.brushtipSize);
  commitStroke();
};

const commitStroke = () => {
  cxt.painting.drawImage($('#strokeLayer'), 0, 0);
  cxt.strokeLayer.fillStyle = 'rgba(0, 0, 0, 0)';
  cxt.strokeLayer.fillRect(0, 0, PAINTING_WIDTH, PAINTING_HEIGHT);
};

const updateBrushtipSize = () => {
  settings.brushtipSize = Number($('#brushtipSize').value);
};

window.onload = () => {
  initializePainting();
  updateBrushtipSize(); // for cached input values
  $('#brushtipSize').addEventListener('change', updateBrushtipSize, false);
  $('#strokeLayer').addEventListener('pointerdown', initStroke, true);
  $('body').addEventListener('pointermove', handlePointerMove, true);
  $('body').addEventListener('pointerup', endStroke, true);
  $('body').addEventListener('pointercancel', endStroke, true);
};
