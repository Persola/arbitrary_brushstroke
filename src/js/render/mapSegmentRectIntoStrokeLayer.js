import TRANSPARENT_PIXEL from './transparentPixel'
import pixelMap from './pixelMap'
import segmentRectMask from './segmentRectMask'

export default (cxt, startCoords, endCoords, brushtipSize) => {
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
