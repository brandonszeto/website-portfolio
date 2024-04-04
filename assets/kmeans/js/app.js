import {
  addPoint,
  drawPoint,
  addGaussian,
  drawGaussian,
  addCentroid,
  drawCentroid,
  reset,
} from "./draw.js";

import { runKMeans } from "./kmeans.js";

let canvas, ctx, cursorCanvas, cursorCtx;
let drawingGaussian = false;
let drawingCentroid = false;
let points = [];
let centroids = [];
let numCentroids = 0;
let std = 25;
let numPointsCloud = 100;

function toggleCentroid() {
  drawingCentroid = !drawingCentroid;
  const centroidBtn = document.getElementById("centroidBtn");
  centroidBtn.innerHTML = drawingCentroid ? "Draw Points" : "Draw Centroids";
}

function toggleGaussian() {
  if (drawingCentroid) {
    drawingCentroid = !drawingCentroid;
    const centroidBtn = document.getElementById("centroidBtn");
    centroidBtn.innerHTML = drawingCentroid ? "Draw Points" : "Draw Centroids";
  }
  drawingGaussian = !drawingGaussian;
  const gaussianBtn = document.getElementById("gaussianBtn");
  gaussianBtn.innerHTML = drawingGaussian
    ? "Draw Single Point"
    : "Draw Point Cloud";
}

function setupCanvas(canvas, ctx) {
  canvas.width = canvas.offsetWidth * 2;
  canvas.height = canvas.offsetHeight * 2;
  ctx.scale(2, 2);
}

function resizeCanvas(canvas) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.onload = function () {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  setupCanvas(canvas, ctx);

  cursorCanvas = document.getElementById("cursorCanvas");
  cursorCtx = cursorCanvas.getContext("2d");
  setupCanvas(cursorCanvas, cursorCtx);

  cursorCanvas.addEventListener("mouseenter", () => {
    cursorCanvas.style.cursor = "none";
  });

  cursorCanvas.addEventListener("mousemove", function (event) {
    var x = event.offsetX;
    var y = event.offsetY;
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    if (drawingCentroid) {
      drawCentroid(cursorCtx, x, y);
    } else if (drawingGaussian) {
      drawGaussian(event, cursorCtx, std, numPointsCloud);
    } else {
      drawPoint(cursorCtx, x, y);
    }
  });

  canvas.addEventListener("mouseleave", () => {
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    canvas.style.cursor = "default";
  });

  cursorCanvas.addEventListener("mousedown", function (event) {
    if (drawingCentroid) {
      addCentroid(event, ctx, centroids, numCentroids);
    } else if (drawingGaussian) {
      addGaussian(event, ctx, points, std, numPointsCloud);
    } else {
      addPoint(event, ctx, points);
    }
  });

  document.getElementById("clearBtn").addEventListener("click", function () {
    reset(canvas, ctx, points, centroids);
  });

  document.getElementById("runBtn").addEventListener("click", function () {
    // console.time('runKMeans');
    runKMeans(canvas, ctx, centroids, points);
    // console.timeEnd('runKMeans');
  });

  document
    .getElementById("centroidBtn")
    .addEventListener("click", toggleCentroid);

  document
    .getElementById("gaussianBtn")
    .addEventListener("click", toggleGaussian);

  window.addEventListener("resize", resizeCanvas);

  document.getElementById("stdSlider").oninput = function () {
    output.innerHTML = this.value;
    std = this.value;
  };

  document.getElementById("cloudInput").oninput = function () {
    numPointsCloud = this.value;
  };
};
