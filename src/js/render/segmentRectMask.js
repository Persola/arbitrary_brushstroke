export default (startCoords, endCoords, pixelX, pixelY, brushtipSize) => {
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
