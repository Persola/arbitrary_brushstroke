export default (cantext, width, height) => {
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const red = x % 4 === 0 ? 'ff' : '00';
      const green = ((x - 2) % 4 === 0) && ((y - 2) % 4 === 0) ? 'ff' : '00';
      const blue = y % 4 === 0 ? 'ff' : '00';
      cantext.fillStyle = `#${red}${green}${blue}`;
      cantext.fillRect(x, y, 1, 1);
    }
  }
};
