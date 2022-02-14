import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";

import * as dat from "lil-gui";

/**
 * Base
 */
// Debug
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Axis Helper
const axisHelper = new THREE.AxesHelper();
scene.add(axisHelper);

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();

const matcap = textureLoader.load("/textures/matcaps/8.png");

// Font
const fontLoader = new FontLoader();
fontLoader.load("/fonts/helvetiker_regular.typeface.json", (font) => {
  console.log("Font loaded", font);

  const bevelSize = 0.02;
  const bevelThickness = 0.03;
  const textGeometry = new TextGeometry("Emma Herms", {
    font,
    size: 0.5,
    height: 0.2,
    curveSegments: 5,
    bevelEnabled: true,
    bevelThickness,
    bevelSize,
    bevelOffset: 0,
    bevelSegments: 4,
  });

  textGeometry.computeBoundingBox();
  console.log(textGeometry.boundingBox);
  //   textGeometry.translate(
  //     -(textGeometry.boundingBox.max.x - bevelSize) * 0.5,
  //     -(textGeometry.boundingBox.max.y - bevelSize) * 0.5,
  //     -(textGeometry.boundingBox.max.z - bevelThickness) * 0.5
  //   );

  textGeometry.center();

  const sharedMaterial = new THREE.MeshMatcapMaterial({ matcap });

  const text = new THREE.Mesh(textGeometry, sharedMaterial);

  scene.add(text);

  console.time("donuts");

  const donutGeo = new THREE.TorusBufferGeometry(0.3, 0.2, 20, 45);
  for (let i = 0; i < 1000; i++) {
    const donut = new THREE.Mesh(donutGeo, sharedMaterial);

    donut.position.x = (Math.random() - 0.5) * 20;
    donut.position.y = (Math.random() - 0.5) * 20;
    donut.position.z = (Math.random() - 0.5) * 20;

    donut.rotation.x = (Math.random() - 0.5) * Math.PI * 2;
    donut.rotation.y = (Math.random() - 0.5) * Math.PI * 2;

    const scaleRand = Math.random();
    donut.scale.set(scaleRand, scaleRand, scaleRand);

    scene.add(donut);
  }

  console.timeEnd("donuts");
});

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 1;
camera.position.y = 1;
camera.position.z = 2;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
