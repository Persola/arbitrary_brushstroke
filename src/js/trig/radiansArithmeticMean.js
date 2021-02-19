import normalizeRadians from './normalizeRadians'

export default (r1, r2, weightFirst) => {
  if (weightFirst === undefined) {
    weightFirst = 0.5;
  }
  const weightSecond = 1 - weightFirst;
  if (r1 === r2) {
    return r1;
  }
  let greater;
  let lesser;
  if (r1 > r2) {
    greater = r1;
    lesser = r2;
  } else {
    greater = r2;
    lesser = r1;
  }
  if (greater - lesser === Math.PI) {
    throw('arithmetic mean of directly opposite angles is undefined');
  } else if (greater - lesser < Math.PI) {
    return (
      (r1 * weightFirst) +
      (r2 * weightSecond)
    );
  } else { // greater - lesser > Math.PI
    if (r1 === greater) {
      return normalizeRadians(
        (r1 * weightFirst) +
        ((2 * Math.PI + r2) * weightSecond)
      )
    } else {
      return normalizeRadians(
        (r2 * weightSecond) +
        ((2 * Math.PI + r1) * weightFirst)
      )
    }
  }
};
