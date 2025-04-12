import { drawPoint } from "./draw.js";
import { KalmanFilter2D } from "./kalman.js";

function setupCanvas(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const cssWidth = canvas.offsetWidth;
  const cssHeight = canvas.offsetHeight;
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  ctx.scale(dpr, dpr);
  console.log(
    `Canvas setup: CSS=${cssWidth}x${cssHeight}, Buffer=${canvas.width}x${canvas.height}, DPR=${dpr}`,
  );
}

const TRAIL_DURATION = 2500;
const blueTrail = [];
const redTrail = [];
const greenTrail = [];

let sampleRate = 50;
let lastSampleTime = 0;
let maxVariance = 10;

let isBlueTrailVisible = true;
let isRedTrailVisible = true;
let isGreenTrailVisible = true;

let lastKnownX = 0;
let lastKnownY = 0;
let isDrawing = false;
let showIntroText = true;
let animationFrameId = null;

const kf = new KalmanFilter2D();

function updateBlueTrail(x, y) {
  if (!isDrawing) return;
  const now = Date.now();
  blueTrail.push({ x, y, time: now });
}

function addRedSamplePoint(currentTime) {
  if (!isDrawing) return;

  const varianceX = (Math.random() - 0.5) * 2 * maxVariance;
  const varianceY = (Math.random() - 0.5) * 2 * maxVariance;
  const redX = lastKnownX + varianceX;
  const redY = lastKnownY + varianceY;
  const measurement = [redX, redY];
  redTrail.push({ x: redX, y: redY, time: currentTime });

  if (!kf.isInitialized) {
    console.log("KF Init at", currentTime, "with", measurement);
    kf.init(currentTime, measurement);
    const initialState = kf.getState();
    greenTrail.push({
      x: initialState[0],
      y: initialState[1],
      time: currentTime,
    });
    kf.lastTime = currentTime;
  } else {
    const dt = (currentTime - kf.lastTime) / 1000.0;
    if (dt > 0) {
      kf.predict(dt);
      kf.update(measurement);
      const filteredState = kf.getState();
      greenTrail.push({
        x: filteredState[0],
        y: filteredState[1],
        time: currentTime,
      });
      kf.lastTime = currentTime;
    } else if (dt === 0) {
      kf.update(measurement);
      const filteredState = kf.getState();
      if (
        greenTrail.length > 0 &&
        greenTrail[greenTrail.length - 1].time === currentTime
      ) {
        greenTrail[greenTrail.length - 1].x = filteredState[0];
        greenTrail[greenTrail.length - 1].y = filteredState[1];
      } else {
        greenTrail.push({
          x: filteredState[0],
          y: filteredState[1],
          time: currentTime,
        });
      }
      console.warn("KF Update dt was 0.");
    } else {
      console.warn(
        "Time delta (dt) for Kalman filter was negative. Resetting filter.",
        dt,
      );
      kf.isInitialized = false;
    }
  }
}

function handleSampling() {
  if (!isDrawing) return;

  const now = Date.now();
  if (lastSampleTime === 0) {
    lastSampleTime = now;
  }

  while (now >= lastSampleTime + sampleRate) {
    const sampleTime = lastSampleTime + sampleRate;
    addRedSamplePoint(sampleTime);
    lastSampleTime = sampleTime;
  }
}

function drawIntroText(ctx, canvas) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.font = "16px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const text = isTouchDevice
    ? "Tap and hold to draw"
    : "Click and drag to draw";
  ctx.fillText(text, canvas.offsetWidth / 2, canvas.offsetHeight / 2);
  ctx.restore();
}

function drawTrails(ctx) {
  const now = Date.now();

  const pruneTrail = (trail) => {
    while (trail.length && now - trail[0].time > TRAIL_DURATION) {
      trail.shift();
    }
  };

  const drawLines = (trail, color) => {
    if (trail.length < 2) return;
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let i = 0; i < trail.length - 1; i++) {
      const p1 = trail[i];
      const p2 = trail[i + 1];
      const age = now - p1.time;
      const alpha = Math.max(0, 1 - age / TRAIL_DURATION);

      if (alpha > 0.01) {
        ctx.strokeStyle = `${color}${alpha})`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
  };

  const drawPoints = (trail, color) => {
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      const age = now - p.time;
      const alpha = Math.max(0, 1 - age / TRAIL_DURATION);
      if (alpha > 0.01) {
        drawPoint(ctx, p.x, p.y, `${color}${alpha})`, 3);
      }
    }
  };

  pruneTrail(blueTrail);
  pruneTrail(redTrail);
  pruneTrail(greenTrail);

  if (isBlueTrailVisible) drawLines(blueTrail, "rgba(100, 186, 255, ");
  if (isRedTrailVisible) {
    drawLines(redTrail, "rgba(255, 80, 80, ");
    drawPoints(redTrail, "rgba(220, 0, 0, ");
  }
  if (isGreenTrailVisible) {
    drawLines(greenTrail, "rgba(80, 200, 80, ");
    drawPoints(greenTrail, "rgba(0, 150, 0, ");
  }
}

function startAnimationLoop() {
  if (!animationFrameId) {
    console.log("Starting animation loop...");
    animationFrameId = requestAnimationFrame(animate);
    console.log(`Animation frame requested. ID: ${animationFrameId}`);
  }
}

function stopAnimationLoop() {
  if (animationFrameId) {
    console.log(`Stopping animation loop. ID: ${animationFrameId}`);
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function animate() {
  const canvas = document.getElementById("canvas");
  if (!canvas) {
    console.error("animate: Canvas not found! Stopping loop.");
    stopAnimationLoop();
    return;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("animate: Context not found! Stopping loop.");
    stopAnimationLoop();
    return;
  }

  const logicalWidth = canvas.offsetWidth;
  const logicalHeight = canvas.offsetHeight;
  ctx.clearRect(0, 0, logicalWidth, logicalHeight);

  if (showIntroText) {
    drawIntroText(ctx, canvas);
  }

  if (isDrawing) {
    handleSampling();
  }

  drawTrails(ctx);

  if (isDrawing) {
    drawPoint(ctx, lastKnownX, lastKnownY, "rgba(0,0,0,0.8)", 3);
  }

  if (
    isDrawing ||
    blueTrail.length > 0 ||
    redTrail.length > 0 ||
    greenTrail.length > 0
  ) {
    animationFrameId = requestAnimationFrame(animate);
  } else {
    console.log(
      "animate: Condition met to stop loop naturally (not drawing, trails empty).",
    );
    animationFrameId = null;
    showIntroText = true;
    requestAnimationFrame(() => {
      if (!animationFrameId && showIntroText) {
        const currentCtx = canvas.getContext("2d");
        if (currentCtx) {
          const lw = canvas.offsetWidth;
          const lh = canvas.offsetHeight;
          currentCtx.clearRect(0, 0, lw, lh);
          drawIntroText(currentCtx, canvas);
          console.log("animate: Drew final intro text frame after stopping.");
        }
      }
    });
  }
}

window.onload = function () {
  console.log("window.onload triggered");

  console.log("Attempting to get canvas element...");
  const canvas = document.getElementById("canvas");
  if (!canvas) {
    console.error("Canvas element with ID 'canvas' not found! Aborting.");
    return;
  }
  console.log("Canvas element found:", canvas);

  console.log("Attempting to get context...");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("Failed to get 2D context from canvas. Aborting.");
    return;
  }
  console.log("Single canvas context obtained");

  function initializeCanvas() {
    console.log("initializeCanvas called");
    setupCanvas(canvas, ctx);
    if (showIntroText && !animationFrameId) {
      const logicalWidth = canvas.offsetWidth;
      const logicalHeight = canvas.offsetHeight;
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);
      drawIntroText(ctx, canvas);
      console.log(
        "initializeCanvas: Redrew intro text after resize (stopped state).",
      );
    }
  }
  initializeCanvas();

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      console.log("Resize event triggered initializeCanvas");
      initializeCanvas();
    }, 100);
  });

  const sampleRateSlider = document.getElementById("sampleRateSlider");
  const sampleRateOutput = document.getElementById("sampleRateOutput");
  const varianceSlider = document.getElementById("varianceSlider");
  const varianceOutput = document.getElementById("varianceOutput");
  const measurementNoiseSlider = document.getElementById(
    "measurementNoiseSlider",
  );
  const measurementNoiseOutput = document.getElementById(
    "measurementNoiseOutput",
  );
  const processNoiseSlider = document.getElementById("processNoiseSlider");
  const processNoiseOutput = document.getElementById("processNoiseOutput");

  if (sampleRateSlider && sampleRateOutput) {
    sampleRate = parseInt(sampleRateSlider.value, 10);
    sampleRateOutput.textContent = sampleRate;
  }
  if (varianceSlider && varianceOutput) {
    maxVariance = parseInt(varianceSlider.value, 10);
    varianceOutput.textContent = maxVariance;
  }
  if (measurementNoiseSlider && measurementNoiseOutput) {
    const initialMeasurementNoise = parseFloat(measurementNoiseSlider.value);
    measurementNoiseOutput.textContent = initialMeasurementNoise.toFixed(2);
    kf.setMeasurementNoise(initialMeasurementNoise);
  }
  if (processNoiseSlider && processNoiseOutput) {
    const initialProcessNoise = parseFloat(processNoiseSlider.value);
    processNoiseOutput.textContent = initialProcessNoise.toExponential(2);
    kf.setProcessNoise(initialProcessNoise);
  }

  if (sampleRateSlider) {
    sampleRateSlider.addEventListener("input", function () {
      sampleRate = parseInt(this.value, 10);
      if (sampleRateOutput) sampleRateOutput.textContent = this.value;
    });
  }
  if (varianceSlider) {
    varianceSlider.addEventListener("input", function () {
      maxVariance = parseInt(this.value, 10);
      if (varianceOutput) varianceOutput.textContent = this.value;
    });
  }
  if (measurementNoiseSlider) {
    measurementNoiseSlider.addEventListener("input", function () {
      const noiseValue = parseFloat(this.value);
      if (measurementNoiseOutput)
        measurementNoiseOutput.textContent = noiseValue.toFixed(2);
      kf.setMeasurementNoise(noiseValue);
    });
  }
  if (processNoiseSlider) {
    processNoiseSlider.addEventListener("input", function () {
      const noiseValue = parseFloat(this.value);
      if (processNoiseOutput)
        processNoiseOutput.textContent = noiseValue.toExponential(2);
      kf.setProcessNoise(noiseValue);
    });
  }

  const toggleBlueButton = document.getElementById("toggleBlueButton");
  const toggleRedButton = document.getElementById("toggleRedButton");
  const toggleGreenButton = document.getElementById("toggleGreenButton");

  function updateButtonAppearance() {
    const setActive = (button, isActive, activeColor, activeBorder) => {
      if (!button) return;
      button.classList.toggle("active", isActive);
      button.style.backgroundColor = isActive ? activeColor : "#f8f8f8";
      button.style.borderColor = isActive ? activeBorder : "#ccc";
    };
    setActive(toggleBlueButton, isBlueTrailVisible, "#d0f0ff", "#a0d0ff");
    setActive(toggleRedButton, isRedTrailVisible, "#ffd0d0", "#ffa0a0");
    setActive(toggleGreenButton, isGreenTrailVisible, "#d0ffd0", "#a0ffa0");
  }

  if (toggleBlueButton)
    toggleBlueButton.addEventListener("click", () => {
      isBlueTrailVisible = !isBlueTrailVisible;
      updateButtonAppearance();
    });
  if (toggleRedButton)
    toggleRedButton.addEventListener("click", () => {
      isRedTrailVisible = !isRedTrailVisible;
      updateButtonAppearance();
    });
  if (toggleGreenButton)
    toggleGreenButton.addEventListener("click", () => {
      isGreenTrailVisible = !isGreenTrailVisible;
      updateButtonAppearance();
    });
  updateButtonAppearance();

  function getEventCoords(event) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if (event.changedTouches && event.changedTouches.length > 0) {
      clientX = event.changedTouches[0].clientX;
      clientY = event.changedTouches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    if (typeof clientX !== "number" || typeof clientY !== "number") {
      console.error(
        "getEventCoords: Invalid clientX/Y obtained from event",
        event,
      );
      return null;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    return { x, y };
  }

  function handlePointerDown(event) {
    console.log(
      `---> handlePointerDown called. Type: ${event.type}, Target:`,
      event.target,
    );

    if (event.type === "mousedown") {
      event.preventDefault();
    }
    if (event.type === "touchstart") {
      const targetTag = event.target.tagName.toLowerCase();
      if (
        targetTag === "button" ||
        targetTag === "input" ||
        targetTag === "label" ||
        targetTag === "span"
      ) {
        console.log("Ignoring touchstart on control element:", targetTag);
        return;
      }
      event.preventDefault();
    }

    const coords = getEventCoords(event);
    if (!coords) {
      console.error(
        "handlePointerDown: Failed to get valid coordinates. Aborting draw start.",
      );
      return;
    }
    console.log(
      `handlePointerDown: Coords obtained: (${coords.x.toFixed(1)}, ${coords.y.toFixed(1)})`,
    );

    isDrawing = true;
    showIntroText = false;
    console.log(
      "handlePointerDown: State set: isDrawing=true, showIntroText=false",
    );

    lastKnownX = coords.x;
    lastKnownY = coords.y;

    console.log("handlePointerDown: Resetting trails and KF");
    blueTrail.length = 0;
    redTrail.length = 0;
    greenTrail.length = 0;
    kf.isInitialized = false;

    const now = Date.now();
    lastSampleTime = now;
    console.log(
      `handlePointerDown: First blue point @ (${lastKnownX.toFixed(1)}, ${lastKnownY.toFixed(1)})`,
    );
    updateBlueTrail(lastKnownX, lastKnownY);

    if (canvas) canvas.style.cursor = "none";
    console.log("handlePointerDown: Starting animation loop...");
    startAnimationLoop();
  }

  function handlePointerMove(event) {
    if (!isDrawing) return;

    if (event.type === "touchmove") {
      event.preventDefault();
    }

    const coords = getEventCoords(event);
    if (!coords) {
      console.warn("handlePointerMove: Failed to get valid coordinates.");
      return;
    }

    lastKnownX = coords.x;
    lastKnownY = coords.y;
    updateBlueTrail(lastKnownX, lastKnownY);
  }

  function handlePointerUp(event) {
    if (!isDrawing) return;

    console.log(`<--- handlePointerUp called. Type: ${event.type}`);
    isDrawing = false;
    console.log("handlePointerUp: State set: isDrawing=false");
    if (canvas) canvas.style.cursor = "default";

    console.log(
      `handlePointerUp: Trail lengths: blue=${blueTrail.length}, red=${redTrail.length}, green=${greenTrail.length}`,
    );

    console.log(
      "handlePointerUp: Letting animation loop continue for fadeout.",
    );
  }

  console.log("Attaching pointer down listeners to canvas...");
  canvas.addEventListener("mousedown", handlePointerDown);
  canvas.addEventListener("touchstart", handlePointerDown, { passive: false });

  console.log("Attaching pointer move/up listeners to window...");
  window.addEventListener("mousemove", handlePointerMove);
  window.addEventListener("touchmove", handlePointerMove, { passive: false });

  window.addEventListener("mouseup", handlePointerUp);
  window.addEventListener("touchend", handlePointerUp);
  window.addEventListener("touchcancel", handlePointerUp);

  canvas.addEventListener("mouseleave", (event) => {
    if (isDrawing) {
      console.log("<-- Mouse left canvas while drawing. Stopping draw.");
      isDrawing = false;
      if (canvas) canvas.style.cursor = "default";
      console.log("mouseleave: Letting animation loop continue for fadeout.");
    }
  });

  canvas.addEventListener("mouseenter", (event) => {
    if (!isDrawing && event.buttons === 0) {
      if (canvas) canvas.style.cursor = "default";
    } else if (isDrawing) {
      if (canvas) canvas.style.cursor = "none";
    }
  });

  console.log("Event listeners attached.");

  console.log("Drawing initial state (intro text)");
  const initialLogicalWidth = canvas.offsetWidth;
  const initialLogicalHeight = canvas.offsetHeight;
  ctx.clearRect(0, 0, initialLogicalWidth, initialLogicalHeight);
  drawIntroText(ctx, canvas);

  console.log("Setup complete. Waiting for interaction.");
};
