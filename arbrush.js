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

const brushState = {
  inStroke: false,
  strokeStartX: NaN,
  strokeStartY: NaN,
  strokePrevX: NaN,
  strokePrevY: NaN,
};

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

const updatePointerPositionReadout = (x, y) => {
  $('#pointerPositionReadout').innerHTML = `x: ${padPrint(x, READOUT_DIGIT_TRUNC)}; y: ${padPrint(y, READOUT_DIGIT_TRUNC)}`;
};

const brushtipIndicatorDataURI = (radius) => {
  const cursorOffset = PROBABLY_GECKO ? radius : radius - 1;
  return `url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='${radius * 2 + 1}'%20height='${radius * 2 + 1}'%3E%3Ccircle%20cx='50%'%20cy='50%'%20r='50%'%20fill='blue'/%3E%3C/svg%3E") ${cursorOffset} ${cursorOffset}, crosshair`;
};

const updateBrushtipIndicatorSize = () => {
  $('body').style.cursor = brushtipIndicatorDataURI(settings.brushtipSize);
}

const handlePointerMove = (evt) => {
  const rect = $('#view').getBoundingClientRect();
  const mouseInCanvasNow = mouseInCanvas(evt, rect);
  if (mouseInCanvasNow) {
    updateBrushtipIndicatorSize();
    pointerCoords = coordsInView(evt.clientX, evt.clientY);
    updatePointerPositionReadout(pointerCoords.x, pointerCoords.y);
    if (brushState.inStroke) {
      const strokePrev = {
        x: brushState.strokePrevX,
        y: brushState.strokePrevY
      }
      Object.assign(
        brushState,
        {
          strokePrevX: pointerCoords.x,
          strokePrevY: pointerCoords.y
        }
      )
      drawStrokeSegment(strokePrev, pointerCoords.x, pointerCoords.y);
    }
  } else {
    $('body').style.cursor = 'crosshair';
    $('#pointerPositionReadout').innerHTML = null;
  }
};

const pointerInitStroke = (evt) => {
  const coords = coordsInView(evt.clientX, evt.clientY);
  initStroke(coords.x, coords.y);
  blot(coords.x, coords.y);
};

const drawStrokeSegment = (lastCoords, currentCoordsX, currentCoordsY) => {
  blot(currentCoordsX, currentCoordsY)
};

const coordsInView = (screenX, screenY) => {
  const viewsBounds = $('#view').getBoundingClientRect();
  return {
    x: screenX - viewsBounds.left - 0.5, /* part of canvas half pixel off bug fix */
    y: screenY - viewsBounds.top - 0.5 /* part of canvas half pixel off bug fix */
  };
};

const initStroke = (x, y) => {
  Object.assign(
    brushState,
    {
      inStroke: true,
      strokeStartX: x,
      strokeStartY: y,
      strokePrevX: x,
      strokePrevY: y
    }
  )
};

const arrayRepeat = (baseArray, times) => {
  const totalLength = baseArray.length * times;
  const repeated = Array(totalLength);

  for (let i = 0; i < totalLength; i++) {
    repeated[i] = baseArray[i % baseArray.length];
  }
  
  return repeated;
};

const blot = (blotCenterX, blotCenterY) => {
  const radius = settings.brushtipSize;
  const imdat = new ImageData(
    new Uint8ClampedArray(
      arrayRepeat(RED_PIXEL, (radius * 2 + 1)**2)
    ),
    radius * 2 + 1,
    radius * 2 + 1
  );
  const a = Math.ceil(blotCenterX - radius);
  const b = Math.ceil(blotCenterY - radius);
  cantext.putImageData(imdat, a, b);
};

const pointerEndStroke = () => {
  Object.assign(
    brushState,
    {
      inStroke: false,
      strokeStartX: NaN,
      strokeStartY: NaN,
      strokePrevX: NaN,
      strokePrevY: NaN
    }
  )
};

window.onload = () => {
  $('body').addEventListener('pointermove', handlePointerMove, true);
  settings.brushtipSize = Number($('#brushtipSize').value);
  $('#brushtipSize').addEventListener('change', (evt) => {
    settings.brushtipSize = Number($('#brushtipSize').value);
  }, false);
  initializeView();
  $('#view').addEventListener('pointerdown', pointerInitStroke, true);
  $('body').addEventListener('pointerup', pointerEndStroke, true);
  $('body').addEventListener('pointercancel', pointerEndStroke, true);
};
