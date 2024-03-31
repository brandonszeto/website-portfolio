import { changeAlpha, gaussianRandom, euclideanDistance } from "./utils.js";

export const maxCentroids = 10;
let numCentroids = 0;
let seed = Math.random();

export function drawPoint(ctx, x, y) {
  ctx.fillStyle = "rgb(66, 66, 66)";
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.closePath();
}

export function addPoint(event, ctx, points) {
  let x = event.offsetX;
  let y = event.offsetY;
  points.push({ x, y });
  drawPoint(ctx, x, y);
}

export function drawCentroid(
  ctx,
  x,
  y,
  color = getCentroidColor(numCentroids),
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.closePath();
  ctx.fillStyle = "rgb(66, 66, 66)";
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.closePath();
}

export function addCentroid(event, ctx, centroids) {
  let x = event.offsetX;
  let y = event.offsetY;
  if (numCentroids < maxCentroids) {
    centroids.push({ x, y });
    drawCentroid(ctx, x, y, getCentroidColor(numCentroids));
    numCentroids += 1;
  } else {
    alert("Maximum number of centroids reached.");
    return;
  }
}

export function addGaussian(event, ctx, points, std, n) {
  let x = event.offsetX;
  let y = event.offsetY;

  for (let i = 0; i < n; i++) {
    let [dx, dy] = gaussianRandom(std, seed + i);
    let pointX = x + dx;
    let pointY = y + dy;
    points.push({ x: pointX, y: pointY });
    drawPoint(ctx, pointX, pointY);
  }
  seed = Math.random();
}

export function drawGaussian(event, ctx, std, n) {
  let x = event.offsetX;
  let y = event.offsetY;

  for (let i = 0; i < n; i++) {
    let [dx, dy] = gaussianRandom(std, seed + i);
    let pointX = x + dx;
    let pointY = y + dy;
    drawPoint(ctx, pointX, pointY);
  }
}

export function getCentroidColor(i) {
  const colors = [
    "rgba(251, 73, 52, 1)", // #fb4934
    "rgba(184, 187, 38, 1)", // #b8bb26
    "rgba(250, 189, 47, 1)", // #fabd2f
    "rgba(131, 165, 152, 1)", // #83a598
    "rgba(211, 134, 155, 1)", // #d3869b
    "rgba(254, 128, 25, 1)", // #fe8019
  ];
  return colors[(((i - 1) % colors.length) + colors.length) % colors.length];
}

export function drawVoronoi(canvas, ctx, centroids, resolution) {
  for (let x = 0; x < canvas.width; x += resolution) {
    for (let y = 0; y < canvas.height; y += resolution) {
      let closestCentroidIndex = -1;
      let minDist = Infinity;

      // Iterate over a grid of points within each unit area
      for (let i = 0; i < centroids.length; i++) {
        let dist = euclideanDistance(x, y, centroids[i].x, centroids[i].y);
        if (dist < minDist) {
          minDist = dist;
          closestCentroidIndex = i;
        }
      }

      // Fill the unit area with the color of the closest centroid
      ctx.fillStyle = changeAlpha(getCentroidColor(closestCentroidIndex), 0.6);
      ctx.fillRect(x, y, resolution, resolution);
    }
  }
}

export function reset(canvas, ctx, points, centroids) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  points.length = 0;
  centroids.length = 0;
  numCentroids = 0;
}
