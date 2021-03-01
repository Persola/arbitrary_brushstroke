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
import fillPlaid from './js/render/fillPlaid'

import BRUSH_STATE_DEFAULTS from './js/state/brushStateDefaults'

const PAINTING_WIDTH = 400;
const PAINTING_HEIGHT = 400;
const TRANSPARENT_PIXEL = [0, 0, 0, 0];

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
  // fillPlaid(cxt.painting, PAINTING_WIDTH, PAINTING_HEIGHT);
  cxt.painting.fillStyle = 'rgba(255, 133, 0, 255)';
  cxt.painting.fillRect(0, 0, PAINTING_WIDTH, PAINTING_HEIGHT);
  cxt.strokeLayer.fillStyle = 'rgba(0, 0, 0, 0)';
  cxt.strokeLayer.fillRect(0, 0, PAINTING_WIDTH, PAINTING_HEIGHT);
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
      mapBallIntoStrokeLayer(thisPointCoords);
      /* With the first point being set during stroke initialization, at this
         point strokePointCount should be 2 at minimum, so there should exist
         a segment ending on this point, so we can render it without a check. */
      mapSegmentRectIntoStrokeLayer(
        {
          x: brushState.prevPointX,
          y: brushState.prevPointY
        },
        thisPointCoords
      );
      Object.assign(
        brushState,
        {
          prevPointX: thisPointCoords.x,
          prevPointY: thisPointCoords.y
        }
      );
      // renderSegment(thisPointCoords);
    }
  } else {
    $('body').style.cursor = 'crosshair';
    $('#pointerPositionReadout').innerHTML = null;
  }
};

const mapBallIntoStrokeLayer = (ballCenterCoords) => {
  const brushtipSize = settings.brushtipSize;
  const diameter = (brushtipSize * 2) + 1;
  const radius = diameter / 2;
  const dirtyRectXMin = Math.round(ballCenterCoords.x) - brushtipSize;
  const dirtyRectYMin = Math.round(ballCenterCoords.y) - brushtipSize;
  const imDat = cxt.painting.getImageData(
    dirtyRectXMin,
    dirtyRectYMin,
    diameter,
    diameter
  );

  const dirtyPixelCount = diameter**2;

  let mappedRawData = [];
  let pixelRelativeX = -brushtipSize;
  let pixelRelativeY = -brushtipSize;
  for (let pixelFlatInd = 0; pixelFlatInd < dirtyPixelCount; pixelFlatInd++) {
    if (ballMask(radius, pixelRelativeX, pixelRelativeY)) {
      let originalPixel = imDat.data.slice(
        pixelFlatInd * 4,
        (pixelFlatInd + 1) * 4
      );
      mappedRawData.push(...pixelMap(originalPixel));
    } else {
      mappedRawData.push(...TRANSPARENT_PIXEL);
    }
    pixelRelativeX += 1;
    if (pixelRelativeX > brushtipSize) {
      pixelRelativeY += 1;
      pixelRelativeX = -brushtipSize;
    }      
  }

  const imdat = new ImageData(
    new Uint8ClampedArray(mappedRawData),
    diameter,
    diameter
  );

  createImageBitmap(imdat).then((imageBitmap) => { // premultiply here?
    cxt.strokeLayer.drawImage(
      imageBitmap,
      dirtyRectXMin,
      dirtyRectYMin
    );
  }).catch((error) => {
    console.log(error);
  });;
};

const ballMask = (radius, relativeX, relativeY) => {
  // masks should also screen out pixels outside the bounds of the painting?
  return (relativeX**2) + (relativeY**2) < (radius**2);
};

const mapSegmentRectIntoStrokeLayer = (startCoords, endCoords) => {
  const brushtipSize = settings.brushtipSize;
  const segmentWidth = (brushtipSize * 2) + 1;
  const roundStartCoords = {
    x: Math.round(startCoords.x),
    y: Math.round(startCoords.y),
  };
  const roundEndCoords = {
    x: Math.round(endCoords.x),
    y: Math.round(endCoords.y),
  };
  const dirtyRectXMin = Math.min(roundStartCoords.x, roundEndCoords.x) - brushtipSize;
  const dirtyRectYMin = Math.min(roundStartCoords.y, roundEndCoords.y) - brushtipSize;
  const dirtyRectXMax = Math.max(roundStartCoords.x, roundEndCoords.x) + brushtipSize;
  const dirtyRectYMax = Math.max(roundStartCoords.y, roundEndCoords.y) + brushtipSize;
  const dirtyRectWidth = dirtyRectXMax - dirtyRectXMin;
  const dirtyRectHeight = dirtyRectYMax - dirtyRectYMin;
  const imDat = cxt.painting.getImageData(
    dirtyRectXMin,
    dirtyRectYMin,
    dirtyRectWidth,
    dirtyRectHeight
  );

  const dirtyPixelCount = dirtyRectWidth * dirtyRectHeight;
  const relativeRoundStartCoords = {
    x: roundStartCoords.x - dirtyRectXMin,
    y: roundStartCoords.y - dirtyRectYMin
  };
  const relativeRoundEndCoords = {
    x: roundEndCoords.x - dirtyRectXMin,
    y: roundEndCoords.y - dirtyRectYMin
  };

  let mappedRawData = [];
  let pixelX = 0;
  let pixelY = 0;
  for (let pixelFlatInd = 0; pixelFlatInd < dirtyPixelCount; pixelFlatInd++) {
    if (
      Math.abs(relativeRoundStartCoords.x - pixelX) < 1 &&
      Math.abs(relativeRoundStartCoords.y - pixelY) < 1
    ) {
      mappedRawData.push(255, 255, 255, 200);      
    } else if (segmentRectMask(relativeRoundStartCoords, relativeRoundEndCoords, pixelX, pixelY, brushtipSize)) {
      let originalPixel = imDat.data.slice(
        pixelFlatInd * 4,
        (pixelFlatInd + 1) * 4
      );
      mappedRawData.push(...pixelMap(originalPixel));
    } else {
      // mappedRawData.push(0, 100, 0, 15);
      mappedRawData.push(...TRANSPARENT_PIXEL);
    }
    pixelX += 1;
    if (pixelX >= dirtyRectWidth) {
      pixelY += 1;
      pixelX = 0;
    }      
  }
  
  const imdat = new ImageData(
    new Uint8ClampedArray(mappedRawData),
    dirtyRectWidth,
    dirtyRectHeight
  );
  
  createImageBitmap(imdat).then((imageBitmap) => { // premultiply here?
    cxt.strokeLayer.drawImage(
      imageBitmap,
      dirtyRectXMin,
      dirtyRectYMin
    );
  }).catch((error) => {
    console.log(error);
  });
};

const segmentRectMask  = (startCoords, endCoords, pixelX, pixelY, brushtipSize) => {
  if (startCoords.x === endCoords.x) {
    return (
      pixelX >= startCoords.x - brushtipSize
      && pixelX <= startCoords.x + brushtipSize
      && pixelY >= Math.min(startCoords.y, endCoords.y)
      && pixelY <= Math.max(startCoords.y, endCoords.y)
    )
  } else if (startCoords.y === endCoords.y) {
    return (
      pixelY >= startCoords.y - brushtipSize
      && pixelY <= startCoords.y + brushtipSize
      && pixelX >= Math.min(startCoords.x, endCoords.x)
      && pixelX <= Math.max(startCoords.x, endCoords.x)
    )    
  }

  const xDelta = (endCoords.x - startCoords.x);
  const yDelta = (endCoords.y - startCoords.y);
  const segmentSlope = yDelta / xDelta;
  const segmentYIntercept = startCoords.y - (segmentSlope * startCoords.x);

  const perpendicularSlope = -(segmentSlope**(-1));
  const startPerpLineYIntercept = startCoords.y - (perpendicularSlope * startCoords.x);
  const endPerpLineYIntercept = endCoords.y - (perpendicularSlope * endCoords.x);

  const sideBoundaryYAbsDiff = brushtipSize * (1 + segmentSlope**2)**(1/2);

  // recall that the canvas y-axis is inverted (lower numbers are higher up)
  const belowTopBoundary = (pixelY >= (segmentSlope * pixelX) + segmentYIntercept - sideBoundaryYAbsDiff);
  const aboveBottomBoundary = (pixelY <= (segmentSlope * pixelX) + segmentYIntercept + sideBoundaryYAbsDiff);

  let insideStartBoundary;
  let insideEndBoundary;
  const segmentGoesDown = startCoords.y < endCoords.y;
  if (segmentGoesDown) {
    insideStartBoundary = pixelY >= perpendicularSlope * pixelX + startPerpLineYIntercept;
    insideEndBoundary = pixelY <= perpendicularSlope * pixelX + endPerpLineYIntercept;
  } else { // segment goes up
    insideStartBoundary = pixelY <= perpendicularSlope * pixelX + startPerpLineYIntercept;
    insideEndBoundary = pixelY >= perpendicularSlope * pixelX + endPerpLineYIntercept;
  }

  return (
    true
    && belowTopBoundary
    && aboveBottomBoundary
    && insideStartBoundary
    && insideEndBoundary
  )
};

const pixelMap = (originalPixel) => {
  return [
    originalPixel[1],
    originalPixel[2],
    originalPixel[0],
    30
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
  $('#strokeLayer').addEventListener('pointerdown', initStroke, true);
  $('body').addEventListener('pointermove', handlePointerMove, true);
  $('body').addEventListener('pointerup', endStroke, true);
  $('body').addEventListener('pointercancel', endStroke, true);
};
