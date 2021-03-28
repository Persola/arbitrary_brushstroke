import TRANSPARENT_PIXEL from './transparentPixel'
import pixelMap from './pixelMap'

const pointBallMask = (radius, relativeX, relativeY) => {
  // masks should also screen out pixels outside the bounds of the painting?
  return (relativeX**2) + (relativeY**2) < (radius**2);
};

export default (cxt, ballCenterCoords, brushtipSize) => {
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
    if (pointBallMask(radius, pixelRelativeX, pixelRelativeY)) {
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
