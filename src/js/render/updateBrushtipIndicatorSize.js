import $ from '../utility/querySelector';

const PROBABLY_GECKO = navigator.userAgent.includes('Gecko') &&
  !navigator.userAgent.includes('like Gecko');

const brushtipIndicatorDataURI = (radius) => {
  const cursorOffset = PROBABLY_GECKO ? radius : radius - 1;
  return `url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='${radius * 2 + 1}'%20height='${radius * 2 + 1}'%3E%3Ccircle%20cx='50%'%20cy='50%'%20r='50%'%20fill='blue'/%3E%3C/svg%3E") ${cursorOffset} ${cursorOffset}, crosshair`;
};

export default (radius) => {
  $('body').style.cursor = brushtipIndicatorDataURI(radius);
};
