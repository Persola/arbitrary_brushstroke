export default (cantext, lastPos, wingtipPos) => {
  cantext.lineWidth = 1;
  cantext.strokeStyle = 'blue';
  cantext.beginPath();
  cantext.moveTo(
    lastPos.x + wingtipPos.leftWingtipXDelta,
    lastPos.y + wingtipPos.leftWingtipYDelta
  );
  cantext.lineTo(lastPos.x, lastPos.y);
  cantext.closePath();
  cantext.stroke();

  cantext.strokeStyle = 'red';
  cantext.beginPath();
  cantext.moveTo(
    lastPos.x + wingtipPos.rightWingtipXDelta,
    lastPos.y + wingtipPos.rightWingtipYDelta
  );
  cantext.lineTo(lastPos.x, lastPos.y);
  cantext.closePath();
  cantext.stroke();
};
