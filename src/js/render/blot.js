export default (cantext, blotCenterX, blotCenterY, radius) => {
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

// should I be using void before putImageData?

// const RED_PIXEL = [255, 0, 0, 255];

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
