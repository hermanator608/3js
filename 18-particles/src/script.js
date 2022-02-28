import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
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

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();
const particleTexture = textureLoader.load("/textures/particles/1.png");

// Particles
// const particlesGeo = new THREE.SphereBufferGeometry(1, 32, 32);
const particlesGeo = new THREE.BufferGeometry();
const count = 5000;
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);

for (let i = 0; i < count; i++) {
  positions[i] = (Math.random() - 0.5) * 10;
  colors[i] = 1; // Math.random();
}
particlesGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
particlesGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

const particlesMat = new THREE.PointsMaterial({
  size: 0.2,
  sizeAttenuation: true,
  color: "white",
  map: particleTexture,
  transparent: true,
  alphaMap: particleTexture,
  //   alphaTest: 0.001, // Fixes the box around it
  // depthTest: false,
  depthWrite: false,
  // blending: THREE.AdditiveBlending, // Adds colors on top of each other
  // vertexColors: true,
});

const particles = new THREE.Points(particlesGeo, particlesMat);
scene.add(particles);

// Test cube
const cube = new THREE.Mesh(
  new THREE.BoxBufferGeometry(),
  new THREE.MeshBasicMaterial()
);
cube.visible = false;
scene.add(cube);

const fog = new THREE.Fog("#262837", 1, 10);
scene.fog = fog;

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 20),
  new THREE.MeshBasicMaterial({ color: "grey" })
);
floor.rotation.x = -Math.PI * 0.5;
floor.position.y = -2;
scene.add(floor);

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
camera.position.z = 3;
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

const speed = { value: 0.1, wind: 0.08 };
gui.add(speed, "value", 0, 0.2, 0.01).name("Snow speed");
gui.add(speed, "wind", 0, 0.2, 0.01).name("Wind speed");

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update particles
  // particles.rotation.x = elapsedTime * 0.5;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    // particlesGeo.attributes.position.array;
    // const x = particlesGeo.attributes.position.array[i3 + 0];

    const newY = particlesGeo.attributes.position.array[i3 + 1] - speed.value;
    const newX = particlesGeo.attributes.position.array[i3 + 0] - speed.wind;

    particlesGeo.attributes.position.array[i3 + 1] = newY < -5 ? 5 : newY;
    particlesGeo.attributes.position.array[i3 + 0] = newX < -5 ? 5 : newX;
  }

  particlesGeo.attributes.position.needsUpdate = true;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
