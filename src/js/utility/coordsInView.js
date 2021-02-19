import $ from './querySelector';

export default (screenX, screenY) => {
  const viewsBounds = $('#view').getBoundingClientRect();
  return {
    x: screenX - viewsBounds.left - 0.5, /* part of canvas half pixel off bug fix */
    y: screenY - viewsBounds.top - 0.5 /* part of canvas half pixel off bug fix */
  };
};
