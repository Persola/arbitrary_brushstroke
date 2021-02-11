const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 600;

// KICKOFF

// should I be using void before putImageData?

const initializeView = () => {
  $('#view').width = VIEW_WIDTH;
  $('#view').height = VIEW_HEIGHT;
  const cantext = $('#view').getContext('2d', {
    alpha: true,
    desynchronized: true, // guessing
    willReadFrequently: true // guessing
  });
  cantext.fillStyle = 'white';
  cantext.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  $('#view').onclick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    blot(cantext, e, x, y);
  };
};

const blot = (cantext, e, x, y) => {
  console.log(x, y);
  const id = new ImageData(
    new Uint8ClampedArray([
      255, 0, 0, 255
    ]),
    1,
    1
  );
  cantext.putImageData(id, x, y);
};

const padPrint = (num, padMin) => {
  const strNum = String(num);
  diff = padMin - strNum.length;
  return '&nbsp'.repeat(diff) + strNum;
};

const handleCanvasPointerMove = (x, y) => {
  $('#mousePosition').innerHTML = `x: ${padPrint(x, 5)}; y: ${padPrint(y, 5)}`;
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

const handlePointerMove = (evt) => {
  const rect = $('#view').getBoundingClientRect();
  if (mouseInCanvas(evt, rect)) {
    handleCanvasPointerMove(
      evt.clientX - rect.left,
      evt.clientY - rect.top
    );
  } else {
    $('#mousePosition').innerHTML = null;
  }
};

window.onload = (e) => {
  const cantext = $('#view').getContext('2d');
  // $('#view').addEventListener("pointerdown", handleStart, false);
  // $('#view').addEventListener("pointerup", handleEnd, false);
  // $('#view').addEventListener("pointercancel", handleCancel, false);
  $('body').addEventListener('pointermove', handlePointerMove, true);
  initializeView();
};
