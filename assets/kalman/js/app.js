
import { drawPoint } from "./draw.js";
import { KalmanFilter2D } from './kalman.js'; 

// --- Canvas Setup ---
function setupCanvas(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const cssWidth = canvas.offsetWidth;
  const cssHeight = canvas.offsetHeight;
  if (canvas.width !== cssWidth * dpr || canvas.height !== cssHeight * dpr) {
      console.warn("Canvas dimensions adjusted due to CSS override.");
  }
}

// --- Constants and State Variables ---
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
let hasMoved = false;

// --- Instantiate the Kalman Filter ---
// Initial noise values will be overwritten by slider defaults in window.onload
const kf = new KalmanFilter2D();


// --- Trail Update Functions ---
function updateBlueTrail(x, y) {
    const now = Date.now();
    blueTrail.push({ x, y, time: now });
    while (blueTrail.length && now - blueTrail[0].time > TRAIL_DURATION) {
        blueTrail.shift();
    }
}

function addRedSamplePoint(currentTime) {
    if (!hasMoved) return;
    const varianceX = (Math.random() - 0.5) * 2 * maxVariance;
    const varianceY = (Math.random() - 0.5) * 2 * maxVariance;
    const redX = lastKnownX + varianceX;
    const redY = lastKnownY + varianceY;
    const measurement = [redX, redY];
    redTrail.push({ x: redX, y: redY, time: currentTime });

    if (!kf.isInitialized) {
        kf.init(currentTime, measurement);
        const initialState = kf.getState();
        greenTrail.push({ x: initialState[0], y: initialState[1], time: currentTime });
    } else {
        const dt = (currentTime - kf.lastTime) / 1000.0;
        if (dt > 0) {
           kf.predict(dt);
           kf.update(measurement);
           kf.lastTime = currentTime;
           const filteredState = kf.getState();
           greenTrail.push({ x: filteredState[0], y: filteredState[1], time: currentTime });
        } else {
           console.warn("Time delta (dt) for Kalman filter was zero or negative.");
        }
    }
    while (redTrail.length && currentTime - redTrail[0].time > TRAIL_DURATION) {
        redTrail.shift();
    }
    while (greenTrail.length && currentTime - greenTrail[0].time > TRAIL_DURATION) {
        greenTrail.shift();
    }
}

function handleSampling() {
    const now = Date.now();
    while (now >= lastSampleTime + sampleRate) {
         const sampleTime = lastSampleTime + sampleRate;
         addRedSamplePoint(sampleTime);
         lastSampleTime = sampleTime;
    }
}


// --- Drawing Function ---
function drawTrails(ctx) {
    const now = Date.now();
    const drawLines = (trail, color) => {
        if (trail.length >= 2) {
            ctx.lineWidth = 1;
            for (let i = 0; i < trail.length - 1; i++) {
                const p1 = trail[i]; const p2 = trail[i + 1];
                const age = now - p1.time; const alpha = Math.max(0, 1 - age / TRAIL_DURATION);
                if (alpha > 0) {
                    ctx.strokeStyle = `${color}${alpha})`; ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                }
            }
        }
    };
    const drawPoints = (trail, color) => {
        for (let i = 0; i < trail.length; i++) {
            const p = trail[i]; const age = now - p.time; const alpha = Math.max(0, 1 - age / TRAIL_DURATION);
            if (alpha > 0) drawPoint(ctx, p.x, p.y, `${color}${alpha})`, 3);
        }
    };
    if (isBlueTrailVisible) drawLines(blueTrail, 'rgba(100, 186, 255, ');
    if (isRedTrailVisible) { drawLines(redTrail, 'rgba(255, 50, 50, '); drawPoints(redTrail, 'rgba(220, 0, 0, '); }
    if (isGreenTrailVisible) { drawLines(greenTrail, 'rgba(0, 180, 50, '); drawPoints(greenTrail, 'rgba(0, 150, 0, '); }
}


// --- Main Execution ---
window.onload = function() {
  // Get Canvases and Contexts
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const cursorCanvas = document.getElementById('cursorCanvas');
  const cursorCtx = cursorCanvas.getContext('2d');

  // Initialize Canvas Sizes
  function initializeCanvases() { /* ... same ... */
    setupCanvas(canvas, ctx); setupCanvas(cursorCanvas, cursorCtx);
  }
  initializeCanvases();

  // Handle Resizing
  let resizeTimeout; window.addEventListener('resize', () => { 
      clearTimeout(resizeTimeout); resizeTimeout = setTimeout(initializeCanvases, 100);
  });

  // --- Slider Setup ---
  const sampleRateSlider = document.getElementById('sampleRateSlider');
  const sampleRateOutput = document.getElementById('sampleRateOutput');
  const varianceSlider = document.getElementById('varianceSlider');
  const varianceOutput = document.getElementById('varianceOutput');
  const measurementNoiseSlider = document.getElementById('measurementNoiseSlider');
  const measurementNoiseOutput = document.getElementById('measurementNoiseOutput');
  const processNoiseSlider = document.getElementById('processNoiseSlider');
  const processNoiseOutput = document.getElementById('processNoiseOutput');

  sampleRateOutput.textContent = sampleRateSlider.value;
  sampleRate = parseInt(sampleRateSlider.value, 10);
  varianceOutput.textContent = varianceSlider.value;
  maxVariance = parseInt(varianceSlider.value, 10);

  measurementNoiseOutput.textContent = parseFloat(measurementNoiseSlider.value).toFixed(2);
  processNoiseOutput.textContent = parseFloat(processNoiseSlider.value).toExponential(2);
  kf.setMeasurementNoise(parseFloat(measurementNoiseSlider.value));
  kf.setProcessNoise(parseFloat(processNoiseSlider.value));


  // --- Slider Event Listeners ---
  sampleRateSlider.addEventListener('input', function() { 
    sampleRate = parseInt(this.value, 10); sampleRateOutput.textContent = this.value;
    if (hasMoved) lastSampleTime = Date.now();
  });
  varianceSlider.addEventListener('input', function() { 
    maxVariance = parseInt(this.value, 10); varianceOutput.textContent = this.value;
  });

  measurementNoiseSlider.addEventListener('input', function() {
      const noiseValue = parseFloat(this.value);
      measurementNoiseOutput.textContent = noiseValue.toFixed(2); // Format output
      kf.setMeasurementNoise(noiseValue); // Update KF instance
  });

  processNoiseSlider.addEventListener('input', function() {
      const noiseValue = parseFloat(this.value);
      processNoiseOutput.textContent = noiseValue.toExponential(2);
      kf.setProcessNoise(noiseValue); 
  });


  // --- Button Setup ---
  const toggleBlueButton = document.getElementById('toggleBlueButton');
  const toggleRedButton = document.getElementById('toggleRedButton');
  const toggleGreenButton = document.getElementById('toggleGreenButton');

 function updateButtonAppearance() {
    // Toggle active class for each button
    toggleBlueButton.classList.toggle('active', isBlueTrailVisible);
    toggleRedButton.classList.toggle('active', isRedTrailVisible);
    toggleGreenButton.classList.toggle('active', isGreenTrailVisible);

    // Update blue button appearance
    toggleBlueButton.style.backgroundColor = isBlueTrailVisible ? '#d0f0ff' : '#f8f8f8';
    toggleBlueButton.style.borderColor = isBlueTrailVisible ? '#a0d0ff' : '#ccc';

    // Update red button appearance
    toggleRedButton.style.backgroundColor = isRedTrailVisible ? '#ffd0d0' : '#f8f8f8';
    toggleRedButton.style.borderColor = isRedTrailVisible ? '#ffa0a0' : '#ccc';

    // Update green button appearance
    toggleGreenButton.style.backgroundColor = isGreenTrailVisible ? '#d0ffd0' : '#f8f8f8';
    toggleGreenButton.style.borderColor = isGreenTrailVisible ? '#a0ffa0' : '#ccc';
} 

  toggleBlueButton.addEventListener('click', () => { isBlueTrailVisible = !isBlueTrailVisible; updateButtonAppearance(); });
  toggleRedButton.addEventListener('click', () => { isRedTrailVisible = !isRedTrailVisible; updateButtonAppearance(); });
  toggleGreenButton.addEventListener('click', () => { isGreenTrailVisible = !isGreenTrailVisible; updateButtonAppearance(); });
  updateButtonAppearance(); // Initial setup


  // --- Mouse Event Listeners ---
  cursorCanvas.addEventListener("mouseenter", (event) => { 
    cursorCanvas.style.cursor = "none";
    if (!hasMoved) {
        const rect = cursorCanvas.getBoundingClientRect();
        lastKnownX = (event.clientX - rect.left); lastKnownY = (event.clientY - rect.top);
        lastSampleTime = Date.now(); hasMoved = true; updateBlueTrail(lastKnownX, lastKnownY);
        kf.isInitialized = false; greenTrail.length = 0;
    }
  });
  cursorCanvas.addEventListener("mousemove", function (event) {
    const rect = cursorCanvas.getBoundingClientRect(); const currentX = (event.clientX - rect.left); const currentY = (event.clientY - rect.top);
    lastKnownX = currentX; lastKnownY = currentY; hasMoved = true;
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height); drawPoint(cursorCtx, currentX, currentY, 'black', 3);
    updateBlueTrail(currentX, currentY);
  });
  cursorCanvas.addEventListener("mouseleave", () => { 
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height); cursorCanvas.style.cursor = "default";
  });


  // --- Animation Loop ---
  function animate() {
    if (hasMoved) { handleSampling(); }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTrails(ctx);
    requestAnimationFrame(animate);
  }
  animate();
};
