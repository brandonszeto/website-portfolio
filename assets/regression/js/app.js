import {
  addPoint,
  drawPoint,
  reset,
} from "./draw.js";

import { runRegression } from "./regression.js";

let canvas, ctx, cursorCanvas, cursorCtx;
let points = [];

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
  // Setup canvas
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  setupCanvas(canvas, ctx);

  lineCanvas = document.getElementById("lineCanvas");
  lineCtx = lineCanvas.getContext("2d");
  setupCanvas(lineCanvas, lineCtx);

  cursorCanvas = document.getElementById("cursorCanvas");
  cursorCtx = cursorCanvas.getContext("2d");
  setupCanvas(cursorCanvas, cursorCtx);

  // Disappearing cursor effect
  cursorCanvas.addEventListener("mouseenter", () => {
    cursorCanvas.style.cursor = "none";
  });

  cursorCanvas.addEventListener("mousemove", function (event) {
    var x = event.offsetX;
    var y = event.offsetY;
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    drawPoint(cursorCtx, x, y);
  });

  // Draw points on click
  cursorCanvas.addEventListener("mousedown", function (event) {
    var x = event.offsetX;
    var y = event.offsetY;
    drawPoint(ctx, x, y);
    points.push({x, y})
  });

  // Run linear regression
  document.getElementById("runBtn").addEventListener("click", function () {
    runRegression(lineCanvas, lineCtx, points);
  });

  // Clear canvas (and points list)
  document.getElementById("clearBtn").addEventListener("click", function () {
    lineCtx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
    reset(canvas, ctx, points);
  });
  
  // Resize canvas
  window.addEventListener("resize", resizeCanvas);
};
