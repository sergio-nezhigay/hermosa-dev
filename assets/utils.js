function interpolateValue(inputval, rangeMin, rangeMax, kMin = 0, kMax = 1) {
  return kMin + (inputval - rangeMin) * (kMax - kMin) / (rangeMax - rangeMin);
}

export { interpolateValue };

window.utils = {
  interpolateValue,
};