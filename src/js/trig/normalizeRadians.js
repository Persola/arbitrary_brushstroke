export default (unnormalized) => {
  if (unnormalized >= 0) {
    return unnormalized % (2 * Math.PI);
  } else {
    return (unnormalized % (2 * Math.PI)) + (2 * Math.PI);
  }
};
