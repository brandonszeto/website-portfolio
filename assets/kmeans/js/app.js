import {
  addPoint,
  drawPoint,
  addGaussian,
  addCentroid,
  drawCentroid,
  reset,
  redraw,
  drawVoronoi,
} from "./draw.js";

import { runKMeans } from "./kmeans.js";

let canvas, ctx, cursorCanvas, cursorCtx;
let cachedCanvas;
let cachedCtx;

let points = [];
let centroids = [];
let numCentroids = 0;
let drawingGaussian = false;
let drawingCentroid = false;
let runBefore = false;

function toggleCentroid() {
  drawingCentroid = !drawingCentroid;
  const centroidBtn = document.getElementById("centroidBtn");
  centroidBtn.innerHTML = drawingCentroid ? "Draw Points" : "Draw Centroids";
}

function toggleGaussian() {
  drawingGaussian = !drawingGaussian;
  const gaussianBtn = document.getElementById("gaussianBtn");
  gaussianBtn.innerHTML = drawingGaussian
    ? "Draw Single Point"
    : "Draw Gaussian";
}

function saveCanvasToCache(cachedCtx, cachedCanvas) {
  cachedCtx.clearRect(0, 0, cachedCanvas.width, cachedCanvas.height);
  redraw(cachedCtx, points, centroids);
  if (runBefore) drawVoronoi(cachedCanvas, cachedCtx, centroids);
}

function drawFromCache(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(cachedCanvas, 0, 0);
}

window.onload = function () {
  // Content canvas
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  canvas.width = canvas.offsetWidth * 2;
  canvas.height = canvas.offsetHeight * 2;
  ctx.scale(2, 2);

  // Cursor canvas
  cachedCanvas = new OffscreenCanvas(canvas.width, canvas.height);
  cachedCtx = cachedCanvas.getContext("2d");

  canvas.addEventListener("mouseenter", () => {
    canvas.style.cursor = "none";
  });

  // Use offscreen canvas to cache current canvas.
  canvas.addEventListener("mousemove", function (event) {
    var x = event.offsetX;
    var y = event.offsetY;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // redraw(ctx, points, centroids);
    drawFromCache(ctx, canvas);
    if (drawingCentroid) {
      drawCentroid(ctx, x, y);
    } else {
      drawPoint(ctx, x, y);
    }
  });

  canvas.addEventListener("mouseleave", () => {
    canvas.style.cursor = "default";
  });

  // Cache should be saved on all clicks
  canvas.addEventListener("mousedown", function (event) {
    if (drawingCentroid) {
      addCentroid(event, ctx, centroids, numCentroids);
    } else if (drawingGaussian) {
      addGaussian(event, ctx, points);
    } else {
      addPoint(event, ctx, points);
    }
    saveCanvasToCache(cachedCtx, cachedCanvas);
  });

  document.getElementById("clearBtn").addEventListener("click", function () {
    reset(canvas, ctx, points, centroids);
  });

  document.getElementById("runBtn").addEventListener("click", function () {
    runBefore = true;
    runKMeans(canvas, ctx, centroids, points);
    saveCanvasToCache(cachedCtx, cachedCanvas);
  });

  document
    .getElementById("centroidBtn")
    .addEventListener("click", toggleCentroid);

  document
    .getElementById("gaussianBtn")
    .addEventListener("click", toggleGaussian);
};
