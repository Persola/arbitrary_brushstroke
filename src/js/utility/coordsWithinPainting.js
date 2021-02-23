import $ from './querySelector';

export default (screenX, screenY) => {
  const paintingBounds = $('#painting').getBoundingClientRect();
  return {
    x: screenX - paintingBounds.left - 0.5, /* part of canvas half pixel off bug fix */
    y: screenY - paintingBounds.top - 0.5 /* part of canvas half pixel off bug fix */
  };
};
