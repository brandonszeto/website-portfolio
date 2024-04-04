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

export function squaredDistance(x1, y1, x2, y2) {
  return Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
}
