/* app.js */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { PointLightHelper } from "three";

// Model inspection
const SHOULD_INSPECT_MODEL = false;
let modelHasBeenInspectedThisSession = false;

const colorFg0 = getComputedStyle(document.documentElement)
  .getPropertyValue("--color-fg0")
  .trim();
const colorFg4 = getComputedStyle(document.documentElement)
  .getPropertyValue("--color-fg4")
  .trim();

const colorBg0h = getComputedStyle(document.documentElement)
  .getPropertyValue("--color-bg0-h")
  .trim();
const colorBg0 = getComputedStyle(document.documentElement)
  .getPropertyValue("--color-bg0")
  .trim();
const colorBg2 = getComputedStyle(document.documentElement)
  .getPropertyValue("--color-bg2")
  .trim();
const colorBg4 = getComputedStyle(document.documentElement)
  .getPropertyValue("--color-bg4")
  .trim();

function inspectModelDetailed(modelNode) {
  if (!modelNode || !SHOULD_INSPECT_MODEL || modelHasBeenInspectedThisSession) {
    if (modelHasBeenInspectedThisSession && SHOULD_INSPECT_MODEL) {
      console.log(
        "Model already inspected this session. To re-inspect, set 'modelHasBeenInspectedThisSession = false' in console and reload.",
      );
    }
    return;
  }

  console.log("--- Starting Model Inspection ---");
  console.log("Model Root Object:", modelNode);

  const traversalQueue = [{ node: modelNode, depth: 0 }];
  let count = 0;

  while (traversalQueue.length > 0 && count < 1000) {
    // Safety break
    const current = traversalQueue.shift();
    const child = current.node;
    const depth = current.depth;
    const indent = "  ".repeat(depth);
    count++;

    console.groupCollapsed(
      `${indent}Object: ${child.name || "Unnamed"} (Type: ${child.constructor.name}, ID: ${child.uuid})`,
    );
    console.log(`${indent}Full Object:`, child);
    console.log(`${indent}Position:`, child.position.toArray().join(", "));
    console.log(
      `${indent}Rotation (Euler XYZ):`,
      child.rotation.toArray().slice(0, 3).join(", "),
    );
    console.log(`${indent}Scale:`, child.scale.toArray().join(", "));
    console.log(`${indent}Visible:`, child.visible);

    if (child.isMesh) {
      console.log(`${indent}Geometry UUID:`, child.geometry.uuid);
      // ... (rest of geometry details as in previous inspectModel function)

      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      materials.forEach((material, index) => {
        if (material) {
          console.groupCollapsed(
            `${indent}  Material ${index}: ${material.name || "Unnamed Material"} (Type: ${material.constructor.name}, ID: ${material.uuid})`,
          );
          console.log(`${indent}  Full Material Object:`, material);
          // Common Material Properties
          console.log(
            `${indent}  Color:`,
            material.color ? `#${material.color.getHexString()}` : "N/A",
          );
          console.log(
            `${indent}  Map (Texture):`,
            material.map
              ? material.map.name || `Texture UUID: ${material.map.uuid}`
              : "No",
          );
          console.log(`${indent}  Transparent:`, material.transparent);
          console.log(`${indent}  Opacity:`, material.opacity);
          // ... (all other material properties as in your detailed inspectModel function)
          if (material.isMeshStandardMaterial) {
            // Covers MeshPhysicalMaterial too
            console.log(`${indent}  Roughness:`, material.roughness);
            console.log(
              `${indent}  RoughnessMap:`,
              material.roughnessMap
                ? material.roughnessMap.name ||
                    `Texture UUID: ${material.roughnessMap.uuid}`
                : "No",
            );
            console.log(`${indent}  Metalness:`, material.metalness);
            console.log(
              `${indent}  MetalnessMap:`,
              material.metalnessMap
                ? material.metalnessMap.name ||
                    `Texture UUID: ${material.metalnessMap.uuid}`
                : "No",
            );
            console.log(
              `${indent}  NormalMap:`,
              material.normalMap
                ? material.normalMap.name ||
                    `Texture UUID: ${material.normalMap.uuid}`
                : "No",
            );
            console.log(
              `${indent}  NormalScale:`,
              material.normalScale
                ? `${material.normalScale.x.toFixed(2)}, ${material.normalScale.y.toFixed(2)}`
                : "N/A",
            );
            console.log(
              `${indent}  AoMap:`,
              material.aoMap
                ? material.aoMap.name || `Texture UUID: ${material.aoMap.uuid}`
                : "No",
            );
            console.log(`${indent}  AoMapIntensity:`, material.aoMapIntensity);
            console.log(
              `${indent}  Emissive:`,
              material.emissive
                ? `#${material.emissive.getHexString()}`
                : "N/A",
            );
            console.log(
              `${indent}  EmissiveIntensity:`,
              material.emissiveIntensity,
            );
            console.log(
              `${indent}  EmissiveMap:`,
              material.emissiveMap
                ? material.emissiveMap.name ||
                    `Texture UUID: ${material.emissiveMap.uuid}`
                : "No",
            );
            console.log(
              `${indent}  EnvMapIntensity:`,
              material.envMapIntensity,
            );

            if (material.isMeshPhysicalMaterial) {
              console.log(`${indent}  --- Physical Properties ---`);
              console.log(`${indent}  Clearcoat:`, material.clearcoat);
              console.log(
                `${indent}  ClearcoatRoughness:`,
                material.clearcoatRoughness,
              );
              console.log(`${indent}  Sheen:`, material.sheen);
              console.log(
                `${indent}  SheenColor:`,
                material.sheenColor
                  ? `#${material.sheenColor.getHexString()}`
                  : "N/A",
              );
              console.log(
                `${indent}  SheenRoughness:`,
                material.sheenRoughness,
              );
              console.log(`${indent}  Transmission:`, material.transmission);
              console.log(`${indent}  Thickness:`, material.thickness);
              console.log(
                `${indent}  AttenuationColor:`,
                material.attenuationColor
                  ? `#${material.attenuationColor.getHexString()}`
                  : "N/A",
              );
              console.log(
                `${indent}  AttenuationDistance:`,
                material.attenuationDistance,
              );
              console.log(`${indent}  IOR:`, material.ior);
              console.log(
                `${indent}  SpecularIntensity:`,
                material.specularIntensity,
              );
              console.log(
                `${indent}  SpecularColor:`,
                material.specularColor
                  ? `#${material.specularColor.getHexString()}`
                  : "N/A",
              );
            }
          }
          console.groupEnd(); // End Material Group
        } else {
          console.log(`${indent}  Material ${index}: undefined/null`);
        }
      });
    } else if (child.isLight) {
      // ... (light details)
    } else if (child.isCamera) {
      // ... (camera details)
    }
    child.children.forEach((c) =>
      traversalQueue.push({ node: c, depth: depth + 1 }),
    );
    console.groupEnd();
  }
  if (count >= 1000)
    console.warn("--- Model Inspection stopped early (iteration limit) ---");
  else console.log("--- End Model Inspection ---");
  modelHasBeenInspectedThisSession = true;
}

// --- GLOBAL VARIABLES ---
let scene, camera, renderer, controls;
let carModel;
let pivot;
const rotationSpeed = 0.001;

// --- INITIALIZATION FUNCTION ---
function init() {
  const container = document.getElementById("three-container");
  if (!container) {
    console.error("Container element '#three-container' not found.");
    return;
  }

  scene = new THREE.Scene();
  scene.background = new THREE.Color(colorBg0h);

  // --- Add Lights ---

  // == Exterior Lights (Keep these) ==
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);
  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight2.position.set(-5, 5, -10);
  scene.add(directionalLight2);
  const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight3.position.set(0, 5, -15);
  scene.add(directionalLight3);

  // --- Add a Floor ---
  const floorGeometry = new THREE.PlaneGeometry(500, 500);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: colorBg0h,
    roughness: 0.9,
    metalness: 0.1,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  scene.add(floor);

  const gridHelper = new THREE.GridHelper(500, 100, colorBg0, colorBg0);
  gridHelper.position.y = 0.01;
  scene.add(gridHelper);

  // 2. Camera
  const fov = 20;
  const aspect =
    container.clientWidth > 0 && container.clientHeight > 0
      ? container.clientWidth / container.clientHeight
      : 1;
  const near = 0.1;
  const far = 1000;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(30.77, 5, -20.75);
  camera.rotation.set(-172, 57, 172);

  // setInterval(() => {
  //   console.log(
  //     `Camera position: x=${camera.position.x.toFixed(2)}, y=${camera.position.y.toFixed(2)}, z=${camera.position.z.toFixed(2)}`,
  //   );
  //   console.log(
  //     `Camera rotation: x=${camera.rotation.x.toFixed(2)}, y=${camera.rotation.y.toFixed(2)}, z=${camera.rotation.z.toFixed(2)}`,
  //   );
  // }, 5000);

  // 3. Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth || 300, container.clientHeight || 150);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.physicallyCorrectLights = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);

  // 4. Create the Pivot Group
  pivot = new THREE.Group();
  scene.add(pivot);

  // 5. Load the GLB model
  const loader = new GLTFLoader();
  loader.load(
    "/models/model_3p.glb",
    function (gltf) {
      carModel = gltf.scene;

      if (SHOULD_INSPECT_MODEL) {
        inspectModelDetailed(carModel);
      }

      const box = new THREE.Box3().setFromObject(carModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      console.log("Model Bounding Box Center:", center);
      console.log("Model Bounding Box Size:", size);

      // Center the car model within the pivot
      carModel.position.x -= center.x;
      carModel.position.y -= center.y - size.y / 2; // Align bottom near y=0
      carModel.position.z -= center.z;

      pivot.add(carModel); // Add centered car model to the pivot

      carModel.traverse((object) => {
        if (object.isMesh) {
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

          materials.forEach((material) => {
            // if (material && material.name === "Car_inside_light.001") {
            //   if (typeof material.emissiveIntensity !== "undefined") {
            //     material.emissive = new THREE.Color(0xffa500);
            //     material.emissiveIntensity = 20;
            //     console.log(
            //       `Set new EmissiveIntensity to: ${material.emissiveIntensity}`,
            //     );
            //   } else {
            //     console.warn(
            //       `Material '${material.name}' does not have an emissiveIntensity property.`,
            //     );
            //   }
            // }
            if (material && material.name === "Vetro.004") {
              material.opacity = 0.6;
            }
          });
        }
      });

      // Update controls target after model is positioned
      if (controls) {
        controls.target.set(pivot.position.x, size.y / 2, pivot.position.z);
        controls.update();
      }
    },
    undefined,
    function (error) {
      console.error("An error occurred while loading the model:", error);
    },
  );

  // 6. Controls (OrbitControls)
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 2;
  controls.maxDistance = 50;
  controls.target.set(0, 1, 0);
  controls.update();

  // --- EVENT LISTENERS ---
  window.addEventListener("resize", onWindowResize, false);

  // --- START ANIMATION ---
  animate();
}

// --- RESIZE HANDLER ---
function onWindowResize() {
  const container = document.getElementById("three-container");
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

  if (pivot) {
    pivot.rotation.y += rotationSpeed;
  }

  if (controls) controls.update();
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// --- RUN INITIALIZATION ---
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
