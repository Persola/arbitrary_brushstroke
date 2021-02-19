export default (cantext, width, height) => {
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if ((x + y) % 2 === 0) {
        cantext.fillStyle = '#fff';
      } else {
        cantext.fillStyle = '#eee';
      }
      cantext.fillRect(x, y, 1, 1);
    }
  }
};
