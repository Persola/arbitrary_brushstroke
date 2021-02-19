export default (
    cantext,
    thisSegmentStartPoint,
    thisSegmentEndpoint,
    thisPointWingtipPos,
    prevPointWingtipPos
) => {
  let region = new Path2D();
  region.moveTo(
    thisSegmentStartPoint.x + prevPointWingtipPos.leftWingtipXDelta,
    thisSegmentStartPoint.y + prevPointWingtipPos.leftWingtipYDelta
  );
  region.lineTo(
    thisSegmentStartPoint.x + prevPointWingtipPos.rightWingtipXDelta,
    thisSegmentStartPoint.y + prevPointWingtipPos.rightWingtipYDelta
  );
  region.lineTo(
    thisSegmentEndpoint.x + thisPointWingtipPos.rightWingtipXDelta,
    thisSegmentEndpoint.y + thisPointWingtipPos.rightWingtipYDelta
  );
  region.lineTo(
    thisSegmentEndpoint.x + thisPointWingtipPos.leftWingtipXDelta,
    thisSegmentEndpoint.y + thisPointWingtipPos.leftWingtipYDelta
  );
  region.closePath();
  cantext.stroke(region); // switch to fill to get normal stroke
};
