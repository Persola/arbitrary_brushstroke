import normalizeRadians from './normalizeRadians'

export default (lastPos, currentPos) => {
  const yDelta = currentPos.y - lastPos.y;
  const xDelta = currentPos.x - lastPos.x;
  if (xDelta === 0 && yDelta === 0) {
    return null;
  }
  const slope = yDelta/xDelta;
  /* We find the angle of the segment vector. Note due to inversion of the
     y-axis on canvas, the unit circle rotates clockwise here (but 0 is still on
     the right). This conversion works with signed zero and signed infinity
     slopes. */
  return normalizeRadians(
    xDelta >= 0 ?
    Math.atan(slope) :
    Math.atan(slope) + Math.PI
  );
};
