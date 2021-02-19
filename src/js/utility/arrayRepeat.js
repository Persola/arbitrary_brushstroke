export default (baseArray, times) => {
  const totalLength = baseArray.length * times;
  const repeated = Array(totalLength);

  for (let i = 0; i < totalLength; i++) {
    repeated[i] = baseArray[i % baseArray.length];
  }
  
  return repeated;
};
