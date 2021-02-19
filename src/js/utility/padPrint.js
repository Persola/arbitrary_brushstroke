export default (num, maxDigits) => {
  const strNum = String(num);
  if (strNum.length > maxDigits) {
    return strNum.slice(0, maxDigits);
  } else {
    const diff = maxDigits - strNum.length;
    return '&nbsp'.repeat(diff) + strNum;
  }
};
