import { changeAlpha, gaussianRandom, euclideanDistance } from "./utils.js";

export const maxCentroids = 3;
let numCentroids = 0;

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

export function addGaussian(event, ctx, points) {
  let x = event.offsetX;
  let y = event.offsetY;
  let n = 100;
  let standardDeviation = 20;

  for (let i = 0; i < n; i++) {
    let [dx, dy] = gaussianRandom(standardDeviation);
    let pointX = x + dx;
    let pointY = y + dy;
    points.push({ x: pointX, y: pointY });
    drawPoint(ctx, pointX, pointY);
  }
}

export function redraw(ctx, points, centroids) {
  points.forEach(function (p) {
    drawPoint(ctx, p.x, p.y);
  });
  centroids.forEach(function (p, index) {
    drawCentroid(ctx, p.x, p.y, getCentroidColor(index));
  });
}

export function getCentroidColor(i) {
  const colors = [
    "rgba(255, 0, 0, 1)",
    "rgba(0, 255, 0, 1)",
    "rgba(0, 0, 255, 1)",
  ];
  return colors[i];
}

export function drawPointManual(ctx, x, y, isCentroid) {
  if (isCentroid) {
    // ctx.fillStyle = getCentroidColor(numCentroids);
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.fillStyle = "rgb(66, 66, 66)";
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();
  } else {
    // ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();
  }
}

export function drawVoronoi(canvas, ctx, centroids) {
  for (let x = 0; x < canvas.width; x += 1) {
    for (let y = 0; y < canvas.height; y += 1) {
      let closestCentroidIndex = -1;
      let minDist = Infinity;

      for (let i = 0; i < centroids.length; i++) {
        let dist = euclideanDistance(x, y, centroids[i].x, centroids[i].y);
        if (dist < minDist) {
          minDist = dist;
          closestCentroidIndex = i;
        }
      }

      ctx.fillStyle = changeAlpha(getCentroidColor(closestCentroidIndex), 0.5);
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

export function reset(canvas, ctx, points, centroids) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  points.length = 0;
  centroids.length = 0;
  numCentroids = 0;
}
