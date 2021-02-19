import normalizeRadians from './normalizeRadians'

export default (segmentWingAngles, radius) => {
  return {
    leftWingtipXDelta: Math.cos(segmentWingAngles.left) * radius,
    leftWingtipYDelta: Math.sin(segmentWingAngles.left) * radius,
    rightWingtipXDelta: Math.cos(segmentWingAngles.right) * radius,
    rightWingtipYDelta: Math.sin(segmentWingAngles.right) * radius
  };
};
