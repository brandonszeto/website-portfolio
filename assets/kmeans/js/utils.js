export function changeAlpha(originalColor, newAlpha) {
  const rgbaRegex = /rgba\((\d{1,3}), (\d{1,3}), (\d{1,3}), ([0-1]?\.?\d+)\)/;
  const matches = originalColor.match(rgbaRegex);

  if (matches) {
    const red = matches[1];
    const green = matches[2];
    const blue = matches[3];
    const alpha = newAlpha;

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  } else {
    return originalColor;
  }
}

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function gaussianRandom(standardDeviation, seed = Math.random()) {
  let u = 0,
    v = 0;
  while (u === 0) u = seededRandom(seed++);
  while (v === 0) v = seededRandom(seed++);
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  let num2 = Math.sqrt(-2.0 * Math.log(u)) * Math.sin(2.0 * Math.PI * v);
  return [num * standardDeviation, num2 * standardDeviation];
}

export function euclideanDistance(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}
