export default (num, maxDigits) => {
  // return num % 1 > 0.5 ? Math.ceil(num) : Math.floor(num);
  const strNum = String(num);
  if (strNum.length > maxDigits) {
    return strNum.slice(0, maxDigits);
  } else {
    const diff = maxDigits - strNum.length;
    return '&nbsp'.repeat(diff) + strNum;
  }
};
