const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 600;
const RED_PIXEL = [255, 0, 0, 255];

const settings = {
  brushtipSize: 10
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
  cantext.fillStyle = 'white';
  cantext.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
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

const padPrint = (num, padMin) => {
  const strNum = String(num);
  diff = padMin - strNum.length;
  return '&nbsp'.repeat(diff) + strNum;
};

const updatePointerPositionReadout = (x, y) => {
  $('#pointerPositionReadout').innerHTML = `x: ${padPrint(x, 5)}; y: ${padPrint(y, 5)}`;
};

const brushtipIndicatorDataURI = (diameter) => {
  return `url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='${diameter}'%20height='${diameter}'%3E%3Ccircle%20cx='${diameter/2}'%20cy='${diameter/2}'%20r='${diameter/2}'%20fill='red'/%3E%3C/svg%3E") ${diameter/2} ${diameter/2}, crosshair`;
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
    $('body').style.cursor = `crosshair`;
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
    x: screenX - viewsBounds.left,
    y: screenY - viewsBounds.top
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

  for (i = 0; i < totalLength; i++) {
    repeated[i] = baseArray[i % baseArray.length];
  }
  
  return repeated;
};

const blot = (blotCenterX, blotCenterY) => {
  const diameter = settings.brushtipSize;
  const id = new ImageData(
    new Uint8ClampedArray(
      arrayRepeat(RED_PIXEL, diameter**2)
    ),
    diameter,
    diameter
  );
  cantext.putImageData(id, blotCenterX - (diameter/2), blotCenterY - (diameter/2));
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
  $('#brushtipSize').addEventListener('change', (evt) => {
    settings.brushtipSize = $('#brushtipSize').value;
  }, false);
  initializeView();
  $('#view').addEventListener('pointerdown', pointerInitStroke, true);
  $('body').addEventListener('pointerup', pointerEndStroke, true);
  $('body').addEventListener('pointercancel', pointerEndStroke, true);
};
