import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// --- Configuration ---
const HELIX_MAX_THETA = 2 * Math.PI; // Angle range (will represent omega)
const HELIX_HEIGHT_SCALE = 3;
const ROTATION_SPEED = 0.01;
const NUM_PATH_POINTS = 100;
const AXIS_COLOR = "#AAAAAA"; // For 2D canvas axes
const MAIN_AXIS_COLOR = "#000000"; // Black for primary Z-axis (Omega axis)
const GRID_COLOR = "#E0E0E0";
const SINE_COLOR = "#FF0000"; // Red
const COSINE_COLOR = "#0000FF"; // Blue
const HELIX_PATH_COLOR = "#888888"; // Darker Grey for helix
const UNIT_CIRCLE_COLOR = "#CCCCCC"; // 2D Canvas Unit Circle
const UNIT_CIRCLE_POINT_COLOR = COSINE_COLOR; // Match cosine color
const POINT_RADIUS = 5; // 2D Canvas point radius
const AXIS_LINE_WIDTH = 1;
const WAVE_LINE_WIDTH = 2;
const LEGEND_FONT = "14px sans-serif";
const AXIS_LABEL_FONT = "12px sans-serif";
const TITLE_FONT = "bold 16px sans-serif";
const LEGEND_COLOR = "#333333";
const CANVAS_PADDING = 40;

// --- Fill Colors ---
const SINE_FILL_COLOR = SINE_COLOR;
const COSINE_FILL_COLOR = COSINE_COLOR;
const FILL_OPACITY_3D = 0.3; // Opacity for 3D filled areas
const FILL_OPACITY_2D = 0.2; // Opacity for 2D filled areas

// --- 3D Projection Config ---
const PROJECTION_UNIT_CIRCLE_COLOR_3D = "#DDDDDD";
const PROJECTION_POINT_COLOR_3D = COSINE_COLOR;
const PROJECTION_POINT_RADIUS_3D = 0.05;
const PROJECTION_PLANE_OFFSET = -0.01; // Offset slightly behind the axis plane
const RADIUS_LINE_COLOR_3D = "#555555";
const RADIUS_LINE_DASH_3D = [0.05, 0.05];

// --- State ---
let currentRotation = 0;
let scene, camera, renderer, controls;
let helixObject;
let animationRunning = true;

// --- 3D Elements ---
const canvas3D = document.getElementById("eulerCanvas3D");
const container3D = document.querySelector(".canvas-container-3d");

// --- 2D Projection Elements ---
const canvasXY = document.getElementById("projXYCanvas");
const canvasXZ = document.getElementById("projXZCanvas");
const canvasYZ = document.getElementById("projYZCanvas");
const ctxXY = canvasXY.getContext("2d");
const ctxXZ = canvasXZ.getContext("2d");
const ctxYZ = canvasYZ.getContext("2d");
const projectionCanvases = [
  { canvas: canvasXY, ctx: ctxXY, type: "XY" }, // Real/Imaginary Plane
  { canvas: canvasXZ, ctx: ctxXZ, type: "XZ" }, // Cosine vs Omega
  { canvas: canvasYZ, ctx: ctxYZ, type: "YZ" }, // Sine vs Omega
];

let originalHelixPoints = [];
let transformedPoints = [];

// --- 3D Projection Objects ---
let projectionGroup;
let projUnitCircleLine, projUnitCirclePoint, projUnitCircleRadiusLine;
let projSineAreaMesh, projCosineAreaMesh;
let projSineAreaGeometry, projCosineAreaGeometry;
let projRadiusGeometry;

// --- Initialization ---
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  resize3DCanvas();
  const aspect = container3D.clientWidth / container3D.clientHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  const helixCenterZ = HELIX_HEIGHT_SCALE / 2;
  camera.position.set(3.0, 4.0, helixCenterZ + 4.0);
  camera.lookAt(0, 0, helixCenterZ);

  renderer = new THREE.WebGLRenderer({ canvas: canvas3D, antialias: true });
  renderer.setSize(container3D.clientWidth, container3D.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  const ambientLight = new THREE.AmbientLight(0x909090, 2);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(3, 5, 4);
  scene.add(directionalLight);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, helixCenterZ);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 1;
  controls.maxDistance = 25;

  // --- Primary Z-Axis (Omega Axis) ---
  const zAxisMaterial = new THREE.LineBasicMaterial({ color: MAIN_AXIS_COLOR });
  const zAxisPoints = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, HELIX_HEIGHT_SCALE * 1.1),
  ];
  const zAxisGeometry = new THREE.BufferGeometry().setFromPoints(zAxisPoints);
  const zAxisLine = new THREE.Line(zAxisGeometry, zAxisMaterial);
  scene.add(zAxisLine);

  // --- Helix Geometry ---
  originalHelixPoints = [];
  transformedPoints = [];
  const helixPointsForLine = [];
  for (let i = 0; i <= NUM_PATH_POINTS; i++) {
    const omega = (i / NUM_PATH_POINTS) * HELIX_MAX_THETA; // Use omega internally
    const x = Math.cos(omega);
    const y = Math.sin(omega);
    const z = (omega / (2 * Math.PI)) * HELIX_HEIGHT_SCALE; // Map omega to Z
    const pointVec = new THREE.Vector3(x, y, z);
    originalHelixPoints.push(pointVec);
    helixPointsForLine.push(pointVec);
    transformedPoints.push(new THREE.Vector3());
  }
  const pathGeometry = new THREE.BufferGeometry().setFromPoints(
    helixPointsForLine,
  );
  const pathMaterial = new THREE.LineBasicMaterial({
    color: HELIX_PATH_COLOR,
    linewidth: 3,
  });
  helixObject = new THREE.Line(pathGeometry, pathMaterial);
  scene.add(helixObject);

  // --- Create 3D Projection Elements ---
  create3DProjections();
  scene.add(projectionGroup);

  window.addEventListener("resize", onWindowResize);
  resizeProjectionCanvases();

  animate();
}

// --- Create 3D Projection Objects ---
function create3DProjections() {
  projectionGroup = new THREE.Group();

  // --- Materials ---
  const unitCircleMaterial = new THREE.LineBasicMaterial({
    color: PROJECTION_UNIT_CIRCLE_COLOR_3D,
    transparent: true,
    opacity: 0.7,
  });
  const pointMaterial = new THREE.MeshBasicMaterial({
    color: PROJECTION_POINT_COLOR_3D,
  });
  const radiusLineMaterial = new THREE.LineDashedMaterial({
    color: RADIUS_LINE_COLOR_3D,
    scale: 1,
    dashSize: RADIUS_LINE_DASH_3D[0],
    gapSize: RADIUS_LINE_DASH_3D[1],
    transparent: true,
    opacity: 0.6,
  });
  const sineAreaMaterial = new THREE.MeshBasicMaterial({
    color: SINE_FILL_COLOR,
    opacity: FILL_OPACITY_3D,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const cosineAreaMaterial = new THREE.MeshBasicMaterial({
    color: COSINE_FILL_COLOR,
    opacity: FILL_OPACITY_3D,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  // --- XY Plane (Unit Circle) ---
  const circlePoints = [];
  const segments = 64;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    circlePoints.push(
      new THREE.Vector3(
        Math.cos(theta),
        Math.sin(theta),
        PROJECTION_PLANE_OFFSET,
      ),
    );
  }
  const circleGeometry = new THREE.BufferGeometry().setFromPoints(circlePoints);
  projUnitCircleLine = new THREE.Line(circleGeometry, unitCircleMaterial);
  projectionGroup.add(projUnitCircleLine);
  const pointGeometry = new THREE.SphereGeometry(
    PROJECTION_POINT_RADIUS_3D,
    16,
    8,
  );
  projUnitCirclePoint = new THREE.Mesh(pointGeometry, pointMaterial);
  projUnitCirclePoint.position.z = PROJECTION_PLANE_OFFSET;
  projectionGroup.add(projUnitCirclePoint);
  projRadiusGeometry = new THREE.BufferGeometry();
  const radiusPositions = new Float32Array(2 * 3);
  radiusPositions[0] = 0;
  radiusPositions[1] = 0;
  radiusPositions[2] = PROJECTION_PLANE_OFFSET;
  projRadiusGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(radiusPositions, 3),
  );
  projUnitCircleRadiusLine = new THREE.Line(
    projRadiusGeometry,
    radiusLineMaterial,
  );
  projectionGroup.add(projUnitCircleRadiusLine);

  // --- XZ Plane (Cosine Area Mesh) ---
  const numAreaVertices = (NUM_PATH_POINTS + 1) * 2;
  projCosineAreaGeometry = new THREE.BufferGeometry();
  const cosineAreaPositions = new Float32Array(numAreaVertices * 3);
  projCosineAreaGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(cosineAreaPositions, 3),
  );
  const areaIndices = []; // Create indices once, use for both
  for (let i = 0; i < NUM_PATH_POINTS; i++) {
    const axis_i = i * 2;
    const curve_i = i * 2 + 1;
    const axis_i1 = (i + 1) * 2;
    const curve_i1 = (i + 1) * 2 + 1;
    areaIndices.push(axis_i, curve_i, curve_i1); // Triangle 1
    areaIndices.push(axis_i, curve_i1, axis_i1); // Triangle 2
  }
  projCosineAreaGeometry.setIndex(areaIndices);
  projCosineAreaMesh = new THREE.Mesh(
    projCosineAreaGeometry,
    cosineAreaMaterial,
  );
  projCosineAreaMesh.position.y = PROJECTION_PLANE_OFFSET;
  projectionGroup.add(projCosineAreaMesh);

  // --- YZ Plane (Sine Area Mesh) ---
  projSineAreaGeometry = new THREE.BufferGeometry();
  const sineAreaPositions = new Float32Array(numAreaVertices * 3);
  projSineAreaGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(sineAreaPositions, 3),
  );
  projSineAreaGeometry.setIndex(areaIndices); // Reuse index array
  projSineAreaMesh = new THREE.Mesh(projSineAreaGeometry, sineAreaMaterial);
  projSineAreaMesh.position.x = PROJECTION_PLANE_OFFSET;
  projectionGroup.add(projSineAreaMesh);
}

// --- Animation Loop ---
function animate() {
  if (!animationRunning) return;
  requestAnimationFrame(animate);

  currentRotation += ROTATION_SPEED;
  currentRotation %= 2 * Math.PI;

  helixObject.rotation.z = currentRotation;
  helixObject.updateMatrixWorld();

  const matrix = helixObject.matrixWorld;
  for (let i = 0; i < originalHelixPoints.length; i++) {
    transformedPoints[i].copy(originalHelixPoints[i]).applyMatrix4(matrix);
  }

  update3DProjections();
  drawProjections(); // 2D Canvases

  controls.update();
  renderer.render(scene, camera);
}

// --- Update 3D Projection Geometries ---
function update3DProjections() {
  // 1. Update Unit Circle Point and Radius Line
  const angle = currentRotation;
  const px = Math.cos(angle);
  const py = Math.sin(angle);
  projUnitCirclePoint.position.x = px;
  projUnitCirclePoint.position.y = py;

  const radiusPositions = projRadiusGeometry.attributes.position.array;
  radiusPositions[3] = px;
  radiusPositions[4] = py;
  projRadiusGeometry.attributes.position.needsUpdate = true;
  projRadiusGeometry.computeBoundingSphere();
  projUnitCircleRadiusLine.computeLineDistances();

  // 2. Update Cosine Area Mesh (XZ Plane)
  const cosineAreaPositions = projCosineAreaGeometry.attributes.position.array;
  for (let i = 0; i <= NUM_PATH_POINTS; i++) {
    const p = transformedPoints[i];
    const axisIdx = i * 2 * 3;
    const curveIdx = (i * 2 + 1) * 3;
    cosineAreaPositions[axisIdx + 0] = 0;
    cosineAreaPositions[axisIdx + 1] = 0;
    cosineAreaPositions[axisIdx + 2] = p.z;
    cosineAreaPositions[curveIdx + 0] = p.x;
    cosineAreaPositions[curveIdx + 1] = 0;
    cosineAreaPositions[curveIdx + 2] = p.z;
  }
  projCosineAreaGeometry.attributes.position.needsUpdate = true;
  projCosineAreaGeometry.computeBoundingSphere();

  // 3. Update Sine Area Mesh (YZ Plane)
  const sineAreaPositions = projSineAreaGeometry.attributes.position.array;
  for (let i = 0; i <= NUM_PATH_POINTS; i++) {
    const p = transformedPoints[i];
    const axisIdx = i * 2 * 3;
    const curveIdx = (i * 2 + 1) * 3;
    sineAreaPositions[axisIdx + 0] = 0;
    sineAreaPositions[axisIdx + 1] = 0;
    sineAreaPositions[axisIdx + 2] = p.z;
    sineAreaPositions[curveIdx + 0] = 0;
    sineAreaPositions[curveIdx + 1] = p.y;
    sineAreaPositions[curveIdx + 2] = p.z;
  }
  projSineAreaGeometry.attributes.position.needsUpdate = true;
  projSineAreaGeometry.computeBoundingSphere();
}

// --- Helper: Map Range ---
function mapRange(value, inMin, inMax, outMin, outMax) {
  value = Math.max(inMin, Math.min(value, inMax));
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

// --- Helper: Draw Axes and Grid for 2D Canvases ---
function drawAxesAndGrid(
  ctx,
  ox,
  oy,
  w,
  h,
  xMin,
  xMax,
  yMin,
  yMax,
  xLabel,
  yLabel,
  title,
  xTicks = [],
  yTicks = [],
) {
  ctx.save();
  ctx.strokeStyle = AXIS_COLOR;
  ctx.fillStyle = LEGEND_COLOR;
  ctx.lineWidth = AXIS_LINE_WIDTH;
  ctx.font = AXIS_LABEL_FONT;
  ctx.beginPath();
  ctx.moveTo(ox, oy - h);
  ctx.lineTo(ox, oy + h);
  ctx.stroke(); // Y Axis
  ctx.beginPath();
  ctx.moveTo(ox - w, oy);
  ctx.lineTo(ox + w, oy);
  ctx.stroke(); // X Axis
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 0.5;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  xTicks.forEach((tick) => {
    const canvasX = mapRange(tick.value, xMin, xMax, ox, ox + w);
    ctx.beginPath();
    ctx.moveTo(canvasX, oy - h);
    ctx.lineTo(canvasX, oy + h);
    ctx.stroke();
    ctx.fillText(tick.label, canvasX, oy + 5);
  });
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  yTicks.forEach((tick) => {
    // *** CORRECTED Y-axis mapping ***
    const canvasY = mapRange(tick.value, yMin, yMax, oy + h, oy - h); // Map value range to [bottom, top] canvas Y
    ctx.beginPath();
    ctx.moveTo(ox - w, canvasY);
    ctx.lineTo(ox + w, canvasY);
    ctx.stroke();
    ctx.fillText(tick.label, ox - 5, canvasY);
  });
  ctx.fillStyle = LEGEND_COLOR;
  ctx.font = AXIS_LABEL_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(xLabel, ox + w / 2, oy + 20); // X Label (now omega)
  ctx.save();
  ctx.translate(ox - 30, oy - h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(yLabel, 0, 0);
  ctx.restore(); // Y Label (now cos/sin)
  ctx.font = TITLE_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(title, ox + w / 2, oy - h - 10); // Title (now cos/sin)
  ctx.restore();
}

// --- 2D Projection Drawing Setup ---
function setupProjectionContexts() {
  projectionCanvases.forEach(({ ctx }) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  });
}

// Utility to convert hex+alpha to rgba for canvas
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// --- Draw 2D Projections on Canvases ---
function drawProjections() {
  projectionCanvases.forEach(({ canvas, ctx, type }) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;
    const drawWidth = w - 2 * CANVAS_PADDING;
    const drawHeight = h - 2 * CANVAS_PADDING;

    if (type === "XY") {
      // --- XY Projection (Unit Circle View - 2D Canvas) ---
      const scale = Math.min(drawWidth, drawHeight) / 2;
      const offsetX = w / 2;
      const offsetY = h / 2;
      ctx.strokeStyle = AXIS_COLOR;
      ctx.lineWidth = AXIS_LINE_WIDTH;
      ctx.beginPath();
      ctx.moveTo(offsetX - scale * 1.1, offsetY);
      ctx.lineTo(offsetX + scale * 1.1, offsetY);
      ctx.stroke(); // X (Re)
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY - scale * 1.1);
      ctx.lineTo(offsetX, offsetY + scale * 1.1);
      ctx.stroke(); // Y (Im)
      ctx.strokeStyle = UNIT_CIRCLE_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(offsetX, offsetY, scale, 0, 2 * Math.PI);
      ctx.stroke();
      const angle = currentRotation;
      const pointX = Math.cos(angle);
      const pointY = Math.sin(angle);
      const canvasPointX = offsetX + pointX * scale;
      const canvasPointY = offsetY - pointY * scale;
      ctx.strokeStyle = RADIUS_LINE_COLOR_3D;
      ctx.lineWidth = 1;
      ctx.setLineDash(RADIUS_LINE_DASH_3D.map((d) => d * 20));
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
      ctx.lineTo(canvasPointX, canvasPointY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = UNIT_CIRCLE_POINT_COLOR;
      ctx.beginPath();
      ctx.arc(canvasPointX, canvasPointY, POINT_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = LEGEND_COLOR;
      ctx.font = TITLE_FONT;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("XY Plane (Re/Im)", w / 2, CANVAS_PADDING - 10);
    } else {
      // --- XZ (Cosine) and YZ (Sine) Wave Views - 2D Canvas ---
      const isCosineView = type === "XZ";
      const waveColor = isCosineView ? COSINE_COLOR : SINE_COLOR;
      const fillColor = isCosineView ? COSINE_FILL_COLOR : SINE_FILL_COLOR;
      const xLabel = "ω"; // Use omega symbol for horizontal axis
      const yLabel = "";
      const title = isCosineView ? "cos(ω)" : "sin(ω)";
      const zMin = 0;
      const zMax = HELIX_HEIGHT_SCALE;
      const valueMin = -1;
      const valueMax = 1;
      const originX = CANVAS_PADDING;
      const originY = h / 2;

      // Define ticks for 2D canvas axes (using omega)
      const zTicks = [
        { value: HELIX_HEIGHT_SCALE / 4, label: "π/2" },
        { value: HELIX_HEIGHT_SCALE / 2, label: "π" },
        { value: (3 * HELIX_HEIGHT_SCALE) / 4, label: "3π/2" },
        { value: HELIX_HEIGHT_SCALE, label: "2π" },
      ];
      const valueTicks = [
        { value: -1, label: "-1" },
        { value: -0.5, label: "-½" },
        { value: 0, label: "0" },
        { value: 0.5, label: "½" },
        { value: 1, label: "1" },
      ];

      // Call drawAxesAndGrid with updated labels/title
      drawAxesAndGrid(
        ctx,
        originX,
        originY,
        drawWidth,
        drawHeight / 2,
        zMin,
        zMax,
        valueMin,
        valueMax,
        xLabel,
        yLabel,
        title,
        zTicks,
        valueTicks,
      );

      // --- Draw Filled Area ---
      ctx.beginPath();
      ctx.moveTo(originX, originY); // Start at axis origin
      const wavePoints = [];
      for (let i = 0; i < transformedPoints.length; i++) {
        const p = transformedPoints[i];
        const zValue = p.z; // Z represents omega scaled
        const waveValue = isCosineView ? p.x : p.y;
        const canvasX = mapRange(
          zValue,
          zMin,
          zMax,
          originX,
          originX + drawWidth,
        );
        const canvasY = mapRange(
          waveValue,
          valueMin,
          valueMax,
          originY + drawHeight / 2,
          originY - drawHeight / 2,
        ); // Map wave value correctly
        ctx.lineTo(canvasX, canvasY);
        wavePoints.push({ x: canvasX, y: canvasY });
      }
      const endAxisX = mapRange(zMax, zMin, zMax, originX, originX + drawWidth);
      ctx.lineTo(endAxisX, originY); // Line back along the axis
      ctx.closePath();
      ctx.fillStyle = hexToRgba(fillColor, FILL_OPACITY_2D);
      ctx.fill();

      // --- Optional: Draw Wave Outline ---
      ctx.strokeStyle = waveColor;
      ctx.lineWidth = WAVE_LINE_WIDTH;
      ctx.beginPath();
      wavePoints.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }
  });
}

// --- Resize Handling ---
function resize3DCanvas() {
  const width = container3D.clientWidth;
  const height = container3D.clientHeight;
  if (camera) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  if (renderer) {
    renderer.setSize(width, height, false);
  }
}

function resizeProjectionCanvases() {
  projectionCanvases.forEach(({ canvas }) => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
  });
  setupProjectionContexts();
}

function onWindowResize() {
  resize3DCanvas();
  resizeProjectionCanvases();
}

// --- Start ---
init();
