import $ from './querySelector';

export default (screenX, screenY) => {
  const paintingBounds = $('#strokeLayer').getBoundingClientRect();
  return {
    x: screenX - paintingBounds.left - 0.5, // coords refer to center of pixel
    y: screenY - paintingBounds.top - 0.5 // coords refer to center of pixel
  };
};
