import { drawPoint } from "./draw.js"; // Make sure this path is correct
import { KalmanFilter2D } from "./kalman.js"; // Make sure this path is correct

// --- Canvas Setup ---
function setupCanvas(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  // Use offsetWidth/Height for the logical size determined by CSS
  const cssWidth = canvas.offsetWidth;
  const cssHeight = canvas.offsetHeight;

  // Set the actual canvas buffer size based on DPR
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;

  // Scale the context to draw logically (like CSS pixels)
  ctx.scale(dpr, dpr);

  // Optional: Check if CSS is overriding explicit width/height attributes
  // const attrWidth = canvas.getAttribute('width');
  // const attrHeight = canvas.getAttribute('height');
  // if (attrWidth && canvas.width !== parseInt(attrWidth) * dpr) {
  //     console.warn("Canvas width adjusted due to CSS override.");
  // }
  // if (attrHeight && canvas.height !== parseInt(attrHeight) * dpr) {
  //     console.warn("Canvas height adjusted due to CSS override.");
  // }
  console.log(
    `Canvas setup: CSS=${cssWidth}x${cssHeight}, Buffer=${canvas.width}x${canvas.height}, DPR=${dpr}`,
  );
}

// --- Constants and State Variables ---
const TRAIL_DURATION = 2500; // milliseconds
const blueTrail = [];
const redTrail = [];
const greenTrail = [];

let sampleRate = 50; // ms between red/green samples (will be set by slider)
let lastSampleTime = 0;
let maxVariance = 10; // pixels (will be set by slider)

let isBlueTrailVisible = true;
let isRedTrailVisible = true;
let isGreenTrailVisible = true;

let lastKnownX = 0;
let lastKnownY = 0;
let isDrawing = false; // <<< NEW: Controls drawing state (replaces hasMoved)
let showIntroText = true; // <<< NEW: Controls intro text visibility
let animationFrameId = null; // <<< NEW: To control animation loop

// --- Instantiate the Kalman Filter ---
// Initial noise values will be overwritten by slider defaults in window.onload
const kf = new KalmanFilter2D();

// --- Trail Update Functions ---
function updateBlueTrail(x, y) {
  // Only add points if actively drawing
  if (!isDrawing) return;
  const now = Date.now();
  blueTrail.push({ x, y, time: now });
  // Pruning is now handled in drawTrails
}

function addRedSamplePoint(currentTime) {
  // Only sample if actively drawing
  if (!isDrawing) return;

  // Generate noisy measurement (Red Point)
  const varianceX = (Math.random() - 0.5) * 2 * maxVariance;
  const varianceY = (Math.random() - 0.5) * 2 * maxVariance;
  const redX = lastKnownX + varianceX;
  const redY = lastKnownY + varianceY;
  const measurement = [redX, redY];
  redTrail.push({ x: redX, y: redY, time: currentTime });

  // Kalman Filter Update (Green Point)
  if (!kf.isInitialized) {
    // Initialize KF on the first sample of a new drawing session
    console.log("KF Init at", currentTime, "with", measurement);
    kf.init(currentTime, measurement);
    const initialState = kf.getState();
    greenTrail.push({
      x: initialState[0],
      y: initialState[1],
      time: currentTime,
    });
    // kf.lastTime is set inside kf.init() if you modify it to accept time
    // If not, set it here:
    kf.lastTime = currentTime;
  } else {
    const dt = (currentTime - kf.lastTime) / 1000.0; // Delta time in seconds
    // console.log("KF Update dt:", dt, "current:", currentTime, "last:", kf.lastTime);
    if (dt > 0) {
      kf.predict(dt);
      kf.update(measurement);
      const filteredState = kf.getState();
      greenTrail.push({
        x: filteredState[0],
        y: filteredState[1],
        time: currentTime,
      });
      kf.lastTime = currentTime; // Update lastTime after successful predict/update
    } else if (dt === 0) {
      // If dt is 0, update measurement but don't advance time state
      kf.update(measurement);
      const filteredState = kf.getState();
      // Replace last point if time hasn't changed
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
      // Don't update kf.lastTime
      console.warn("KF Update dt was 0.");
    } else {
      console.warn(
        "Time delta (dt) for Kalman filter was negative. Resetting filter.",
        dt,
      );
      // Reset if time goes backward (shouldn't normally happen)
      kf.isInitialized = false;
    }
  }
  // Pruning is now handled in drawTrails
}

function handleSampling() {
  // Only sample if actively drawing
  if (!isDrawing) return;

  const now = Date.now();
  // Ensure lastSampleTime is initialized reasonably when drawing starts
  if (lastSampleTime === 0) {
    lastSampleTime = now; // Should have been set on pointer down, but safety check
  }

  // Add samples for the time elapsed since the last frame/sample
  while (now >= lastSampleTime + sampleRate) {
    const sampleTime = lastSampleTime + sampleRate;
    addRedSamplePoint(sampleTime);
    lastSampleTime = sampleTime; // Increment strictly by sampleRate
  }
}

// --- Drawing Functions ---
function drawIntroText(ctx, canvas) {
  ctx.save(); // Save context state
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.font = "16px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const text = isTouchDevice
    ? "Tap and hold to draw"
    : "Click and drag to draw";
  // Use logical canvas dimensions (offsetWidth/Height) for centering text
  ctx.fillText(text, canvas.offsetWidth / 2, canvas.offsetHeight / 2);
  ctx.restore(); // Restore context state
}

function drawTrails(ctx) {
  const now = Date.now();

  // Helper to prune old points from a trail
  const pruneTrail = (trail) => {
    while (trail.length && now - trail[0].time > TRAIL_DURATION) {
      trail.shift();
    }
  };

  // Helper function to draw lines for a trail
  const drawLines = (trail, color) => {
    if (trail.length < 2) return;
    ctx.lineWidth = 1.5; // Slightly thicker lines maybe
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let i = 0; i < trail.length - 1; i++) {
      const p1 = trail[i];
      const p2 = trail[i + 1];
      const age = now - p1.time; // Use p1's time for segment age
      const alpha = Math.max(0, 1 - age / TRAIL_DURATION);

      if (alpha > 0.01) {
        // Only draw if visible enough
        ctx.strokeStyle = `${color}${alpha})`; // Apply alpha to base color string
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
  };

  // Helper function to draw points for a trail (for red/green)
  const drawPoints = (trail, color) => {
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      const age = now - p.time;
      const alpha = Math.max(0, 1 - age / TRAIL_DURATION);
      if (alpha > 0.01) {
        // Only draw if visible enough
        drawPoint(ctx, p.x, p.y, `${color}${alpha})`, 3);
      }
    }
  };

  // Prune trails *before* drawing
  pruneTrail(blueTrail);
  pruneTrail(redTrail);
  pruneTrail(greenTrail);

  // Draw the trails
  if (isBlueTrailVisible) drawLines(blueTrail, "rgba(100, 186, 255, "); // Blue lines only
  if (isRedTrailVisible) {
    drawLines(redTrail, "rgba(255, 80, 80, "); // Lighter lines for red
    drawPoints(redTrail, "rgba(220, 0, 0, "); // Solid points for red
  }
  if (isGreenTrailVisible) {
    drawLines(greenTrail, "rgba(80, 200, 80, "); // Lighter lines for green
    drawPoints(greenTrail, "rgba(0, 150, 0, "); // Solid points for green
  }
}

// --- Animation Loop Control ---
function startAnimationLoop() {
  if (!animationFrameId) {
    console.log("Starting animation loop...");
    animationFrameId = requestAnimationFrame(animate);
    console.log(`Animation frame requested. ID: ${animationFrameId}`);
  } else {
    // console.log("Animation loop already running.");
  }
}

function stopAnimationLoop() {
  if (animationFrameId) {
    console.log(`Stopping animation loop. ID: ${animationFrameId}`);
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

// --- Main Animation Function ---
function animate() {
  // console.log(`animate() frame. ID: ${animationFrameId}, isDrawing: ${isDrawing}, showIntro: ${showIntroText}, blueTrail: ${blueTrail.length}`); // Verbose log

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

  // Use logical width/height for clearing, matching CSS/layout size
  const logicalWidth = canvas.offsetWidth;
  const logicalHeight = canvas.offsetHeight;
  ctx.clearRect(0, 0, logicalWidth, logicalHeight);
  // console.log(`Cleared canvas area: 0, 0, ${logicalWidth}, ${logicalHeight}`);

  // Draw intro text if applicable
  if (showIntroText) {
    drawIntroText(ctx, canvas);
  }

  // Sample red/green points if drawing
  if (isDrawing) {
    handleSampling();
  }

  // Draw trails (fading happens here)
  drawTrails(ctx);

  // Draw the "live" cursor position (black dot) only when drawing
  if (isDrawing) {
    drawPoint(ctx, lastKnownX, lastKnownY, "rgba(0,0,0,0.8)", 3); // Semi-transparent black
  }

  // Decide whether to continue the loop
  if (
    isDrawing ||
    blueTrail.length > 0 ||
    redTrail.length > 0 ||
    greenTrail.length > 0
  ) {
    // Continue if drawing OR if trails still need to fade out
    animationFrameId = requestAnimationFrame(animate);
  } else {
    // Stop the loop naturally
    console.log(
      "animate: Condition met to stop loop naturally (not drawing, trails empty).",
    );
    animationFrameId = null;
    // Ensure intro text is shown on the *next* interaction or resize
    showIntroText = true;
    // Request one final draw *if* the intro text wasn't already showing
    // This ensures it appears immediately when trails finish fading
    requestAnimationFrame(() => {
      if (!animationFrameId && showIntroText) {
        // Check loop hasn't restarted
        const currentCtx = canvas.getContext("2d");
        if (currentCtx) {
          const lw = canvas.offsetWidth;
          const lh = canvas.offsetHeight;
          currentCtx.clearRect(0, 0, lw, lh); // Clear first
          drawIntroText(currentCtx, canvas);
          console.log("animate: Drew final intro text frame after stopping.");
        }
      }
    });
  }
}

// --- Main Execution ---
window.onload = function () {
  console.log("window.onload triggered");

  // Get SINGLE Canvas and Context
  console.log("Attempting to get canvas element..."); // <-- ADD LOG
  const canvas = document.getElementById("canvas");
  if (!canvas) {
    console.error("Canvas element with ID 'canvas' not found! Aborting."); // <-- More specific error
    return;
  }
  console.log("Canvas element found:", canvas); // <-- ADD LOG + Element

  console.log("Attempting to get context..."); // <-- ADD LOG
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("Failed to get 2D context from canvas. Aborting."); // <-- More specific error
    return;
  }
  console.log("Single canvas context obtained");

  // Initialize Canvas Size
  function initializeCanvas() {
    console.log("initializeCanvas called");
    setupCanvas(canvas, ctx);
    // Redraw intro text immediately after resize IF the loop isn't running
    if (showIntroText && !animationFrameId) {
      const logicalWidth = canvas.offsetWidth;
      const logicalHeight = canvas.offsetHeight;
      ctx.clearRect(0, 0, logicalWidth, logicalHeight); // Clear first
      drawIntroText(ctx, canvas);
      console.log(
        "initializeCanvas: Redrew intro text after resize (stopped state).",
      );
    }
    // If the loop is running, 'animate()' will handle redraw on the next frame.
  }
  initializeCanvas(); // Initial setup

  // Handle Resizing
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      console.log("Resize event triggered initializeCanvas");
      initializeCanvas();
    }, 100); // Debounce resize
  });

  // --- Slider Setup ---
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

  // Initialize sliders and KF from default values (add null checks)
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

  // --- Slider Event Listeners (with null checks) ---
  if (sampleRateSlider) {
    sampleRateSlider.addEventListener("input", function () {
      sampleRate = parseInt(this.value, 10);
      if (sampleRateOutput) sampleRateOutput.textContent = this.value;
      // Resetting lastSampleTime might cause jumps if changed mid-draw,
      // handleSampling adjusts naturally.
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

  // --- Button Setup ---
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
  updateButtonAppearance(); // Initial setup

  // --- Interaction Event Listeners (Mouse and Touch) ---

  function getEventCoords(event) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (event.touches && event.touches.length > 0) {
      // Use the first touch point for touchstart/touchmove
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if (event.changedTouches && event.changedTouches.length > 0) {
      // Use changedTouches for touchend/touchcancel
      clientX = event.changedTouches[0].clientX;
      clientY = event.changedTouches[0].clientY;
    } else {
      // Use mouse event coordinates
      clientX = event.clientX;
      clientY = event.clientY;
    }

    // Check if coordinates are valid numbers
    if (typeof clientX !== "number" || typeof clientY !== "number") {
      console.error(
        "getEventCoords: Invalid clientX/Y obtained from event",
        event,
      );
      return null; // Indicate failure
    }

    // Calculate coordinates relative to the canvas element's top-left corner
    // This gives coordinates in CSS pixels, matching the ctx.scale setup
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // console.log(`getEventCoords: client=(${clientX}, ${clientY}), rect.left=${rect.left}, rect.top=${rect.top}, result=(${x}, ${y})`);
    return { x, y };
  }

  function handlePointerDown(event) {
    console.log(
      `---> handlePointerDown called. Type: ${event.type}, Target:`,
      event.target,
    );

    // Prevent text selection during drag (mousedown only)
    if (event.type === "mousedown") {
      event.preventDefault();
    }
    // Prevent page scroll/zoom during touch drag on canvas
    if (event.type === "touchstart") {
      const targetTag = event.target.tagName.toLowerCase();
      // Allow interaction with controls
      if (
        targetTag === "button" ||
        targetTag === "input" ||
        targetTag === "label" ||
        targetTag === "span"
      ) {
        console.log("Ignoring touchstart on control element:", targetTag);
        return; // Don't start drawing if touching a control
      }
      // Prevent default page actions if touching the canvas itself
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

    // --- Start Drawing State ---
    isDrawing = true;
    showIntroText = false; // Hide intro text
    console.log(
      "handlePointerDown: State set: isDrawing=true, showIntroText=false",
    );

    lastKnownX = coords.x;
    lastKnownY = coords.y;

    // --- Reset for new drawing session ---
    console.log("handlePointerDown: Resetting trails and KF");
    blueTrail.length = 0;
    redTrail.length = 0;
    greenTrail.length = 0;
    kf.isInitialized = false; // Reset Kalman Filter state

    const now = Date.now();
    lastSampleTime = now; // Initialize sample time for this drawing session
    console.log(
      `handlePointerDown: First blue point @ (${lastKnownX.toFixed(1)}, ${lastKnownY.toFixed(1)})`,
    );
    // Add the very first blue point immediately
    updateBlueTrail(lastKnownX, lastKnownY);

    if (canvas) canvas.style.cursor = "none"; // Hide system cursor
    console.log("handlePointerDown: Starting animation loop...");
    startAnimationLoop(); // Ensure animation is running
  }

  function handlePointerMove(event) {
    if (!isDrawing) return; // Only process if actively drawing

    // Prevent scrolling/zooming on touch devices during drag
    if (event.type === "touchmove") {
      event.preventDefault();
    }

    const coords = getEventCoords(event);
    if (!coords) {
      console.warn("handlePointerMove: Failed to get valid coordinates.");
      return; // Don't update if coords are bad
    }

    lastKnownX = coords.x;
    lastKnownY = coords.y;
    // console.log(`handlePointerMove: New coords: (${coords.x.toFixed(1)}, ${coords.y.toFixed(1)})`);
    // Add blue points continuously as pointer moves
    updateBlueTrail(lastKnownX, lastKnownY);
    // Red/Green points are added via handleSampling in the animation loop
  }

  function handlePointerUp(event) {
    // Only react if we were actually drawing
    if (!isDrawing) return;

    console.log(`<--- handlePointerUp called. Type: ${event.type}`);
    isDrawing = false;
    console.log("handlePointerUp: State set: isDrawing=false");
    if (canvas) canvas.style.cursor = "default"; // Show system cursor again

    // DEBUG: Log trail lengths at the end of the interaction
    console.log(
      `handlePointerUp: Trail lengths: blue=${blueTrail.length}, red=${redTrail.length}, green=${greenTrail.length}`,
    );

    // *** Crucially: DO NOT stop the animation loop here ***
    // 'animate()' function will continue running as long as trails have points,
    // allowing them to fade out. It will stop itself when appropriate.
    console.log(
      "handlePointerUp: Letting animation loop continue for fadeout.",
    );
  }

  // Attach Listeners to the CANVAS for starting interactions
  console.log("Attaching pointer down listeners to canvas...");
  canvas.addEventListener("mousedown", handlePointerDown);
  // Use passive: false for touchstart to allow preventDefault()
  canvas.addEventListener("touchstart", handlePointerDown, { passive: false });

  // Attach Listeners to the WINDOW for move/up/cancel to catch events
  // that might end outside the canvas bounds while dragging.
  console.log("Attaching pointer move/up listeners to window...");
  window.addEventListener("mousemove", handlePointerMove);
  window.addEventListener("touchmove", handlePointerMove, { passive: false });

  window.addEventListener("mouseup", handlePointerUp);
  window.addEventListener("touchend", handlePointerUp);
  window.addEventListener("touchcancel", handlePointerUp); // Handle interruptions

  // Handle mouse leaving the canvas *while drawing*
  canvas.addEventListener("mouseleave", (event) => {
    if (isDrawing) {
      console.log("<-- Mouse left canvas while drawing. Stopping draw.");
      // Treat it like a mouseup event
      isDrawing = false;
      if (canvas) canvas.style.cursor = "default"; // Restore cursor
      console.log("mouseleave: Letting animation loop continue for fadeout.");
    }
  });

  // Optional: Restore cursor if mouse enters canvas *without* button down
  canvas.addEventListener("mouseenter", (event) => {
    // event.buttons === 0 means no mouse button is pressed
    if (!isDrawing && event.buttons === 0) {
      if (canvas) canvas.style.cursor = "default";
    } else if (isDrawing) {
      if (canvas) canvas.style.cursor = "none"; // Ensure cursor stays hidden if re-entering while drawing
    }
  });

  console.log("Event listeners attached.");

  // --- Initial Draw ---
  console.log("Drawing initial state (intro text)");
  // Draw the intro text once at the start, before any interaction
  const initialLogicalWidth = canvas.offsetWidth;
  const initialLogicalHeight = canvas.offsetHeight;
  ctx.clearRect(0, 0, initialLogicalWidth, initialLogicalHeight);
  drawIntroText(ctx, canvas);

  // The animation loop (`animate`) is NOT started here.
  // It will be started by the first `handlePointerDown` event.
  console.log("Setup complete. Waiting for interaction.");
};
