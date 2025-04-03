function addNoise(value, noiseLevel) {
  return value + (Math.random() - 0.5) * noiseLevel;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
