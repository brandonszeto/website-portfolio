/* app.js */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// --- GLOBAL VARIABLES ---
let scene, camera, renderer, controls;

// --- INITIALIZATION FUNCTION ---
function init() {
  // Get the container element
  const container = document.getElementById('three-container');
  if (!container) {
    console.error("Container element '#three-container' not found.");
    return;
  }

  // 1. Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeeeeee); // Light grey background

  // 1.5 Development help
  // const axesHelper = new THREE.AxesHelper(5);
  // scene.add(axesHelper);

  // const gridHelper = new THREE.GridHelper(100, 10); // 10 units with 10 divisions
  // scene.add(gridHelper);

  // gridHelper.rotation.x = Math.PI / 2; // Rotate grid so it's in the XY plane
  // scene.add(gridHelper);

  // --- Add Lights ---
  // Ambient light for overall illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  // Directional light to simulate a primary light source
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 10, 10);
  scene.add(directionalLight);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, -10, 0);
  scene.add(directionalLight2);

  const directionalLight3 = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 10, -15);
  scene.add(directionalLight3);
  
  // 2. Camera
  const fov = 75; // Field of View
  const aspect = (container.clientWidth > 0 && container.clientHeight > 0)
                 ? container.clientWidth / container.clientHeight
                 : 1;
  const near = 0.1; // Near clipping plane
  const far = 1000; // Far clipping plane
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  camera.position.set(0, 20, 40);

  // 3. Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth || 300, container.clientHeight || 150);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // 4. Load the GLB model
 const loader = new GLTFLoader();
 loader.load(
  '/models/macbook.glb', // Ensure this path is correct
  function (gltf) {
    const model = gltf.scene;
    model.scale.set(1, 1, 1);
    model.position.set(0, 0, 0);
    
    // Traverse the model to log mesh names
    model.traverse((child) => {
      if (child.isMesh) {
        console.log('Mesh name:', child.name);
      }
    });
    
    scene.add(model);
  },
  undefined,
  function (error) {
    console.error('An error occurred while loading the model:', error);
  }
); 

  // 5. Controls (OrbitControls)
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // Optional: adds inertia to camera movement
  controls.dampingFactor = 0.05;

  controls.target.set(0, 0, -15);
  controls.update();

  // --- EVENT LISTENERS ---
  window.addEventListener('resize', onWindowResize, false);

  // --- START ANIMATION ---
  animate();
}

// --- RESIZE HANDLER ---
function onWindowResize() {
  const container = document.getElementById('three-container');
  if (!container || !camera || !renderer) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  if (width > 0 && height > 0) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  } else {
    console.warn("Container has zero width or height during resize.");
  }
}

// --- ANIMATION LOOP ---
function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// --- RUN INITIALIZATION ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
