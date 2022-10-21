import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "lil-gui";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CharacterControls } from "./charMovement";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";
import { threeToCannon } from "three-to-cannon";

const WORLD_WIDTH = 100;

/**
 * Base
 */
// Debug
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color("#eeeeee");

const textureLoader = new THREE.TextureLoader();

const axesHelper = new THREE.AxesHelper(3);
scene.add(axesHelper);
/**
 * Physics
 */
const world = new CANNON.World();
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;
world.gravity.set(0, -9.82, 0);

// const cannonDebugger = new CannonDebugger(scene, world, {
//   // options...
// });

// Default material
const defaultMaterial = new CANNON.Material("default");
const defaultContactMaterial = new CANNON.ContactMaterial(
  defaultMaterial,
  defaultMaterial,
  {
    friction: 0.1,
    restitution: 0.0,
  }
);
world.defaultContactMaterial = defaultContactMaterial;

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(WORLD_WIDTH, WORLD_WIDTH),
  new THREE.MeshStandardMaterial({
    color: "#D6D6D6",
  })
);

floor.geometry.setAttribute(
  "uv2",
  new THREE.Float32BufferAttribute(floor.geometry.attributes.uv.array, 2)
);
floor.rotation.x = -Math.PI * 0.5;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

const planeShape = new CANNON.Plane();
const planeBody = new CANNON.Body({ mass: 0 });
planeBody.addShape(planeShape);
planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(planeBody);

const fog = new THREE.Fog("#eeeeee", 2, 30);
scene.fog = fog;

/*********************************************************************
 * Snow Particles
 *********************************************************************/
const speed = { value: 0.08, wind: 0.02 };
const snow = { count: 10000 };

gui.add(speed, "value", 0, 0.2, 0.01).name("Snow speed");
gui.add(speed, "wind", 0, 0.2, 0.01).name("Wind speed");

const particleTexture = textureLoader.load("/textures/particles/3.png");
const particlesGeo = new THREE.BufferGeometry();

const setupSnow = (snowInfo) => {
  console.log("Updating Snow", snowInfo);
  const positions = new Float32Array(snowInfo.count * 3);
  const colors = new Float32Array(snowInfo.count * 3);

  for (let i = 0; i < snowInfo.count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * WORLD_WIDTH;
    positions[i + 1] = Math.random() * 10;
    positions[i + 2] = (Math.random() - 0.5) * WORLD_WIDTH;
    colors[i], colors[i + 1], (colors[i + 2] = 1); // Math.random();
  }
  particlesGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );
  particlesGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
};
setupSnow(snow);

const snowController = gui
  .add(snow, "count", [2000, 5000, 10000, 50000, 100000])
  .name("Snow Count");
snowController.onChange(() => setupSnow(snow));

const particlesMat = new THREE.PointsMaterial({
  size: 0.2,
  sizeAttenuation: true,
  color: "white",
  map: particleTexture,
  transparent: true,
  alphaMap: particleTexture,
  alphaTest: 0.001, // Fixes the box around it
  // depthTest: false,
  depthWrite: false,
  blending: THREE.AdditiveBlending, // Adds colors on top of each other
  // vertexColors: true,
});

const particles = new THREE.Points(particlesGeo, particlesMat);
scene.add(particles);
/*********************************************************************
 * Snow Particles
 *********************************************************************/

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.y = 5;
camera.position.z = 5;
camera.position.x = 0;
scene.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 5;
controls.maxDistance = 15;
controls.enablePan = false;
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.update();

/**
 * Textures
 */

const matcap = textureLoader.load("/textures/matcaps/black.png");

const fontLoader = new FontLoader();

/*********************************************************************
 * Player Name Model
 *********************************************************************/
const font = await fontLoader.loadAsync(
  "/fonts/helvetiker_regular.typeface.json"
);

const bevelSize = 0.002;
const bevelThickness = 0.003;
const textGeometry = new TextGeometry("Player 1", {
  font,
  size: 0.05,
  height: 0.01,
  curveSegments: 5,
  bevelEnabled: true,
  bevelThickness,
  bevelSize,
  bevelOffset: 0,
  bevelSegments: 4,
});

textGeometry.computeBoundingBox();
textGeometry.center();

const sharedMaterial = new THREE.MeshMatcapMaterial({ matcap });

const playerName = new THREE.Mesh(textGeometry, sharedMaterial);

scene.add(playerName);
/*********************************************************************
 * Player Name Model
 *********************************************************************/

/*********************************************************************
 * FOX Model
 *********************************************************************/
const gltfLoader = new GLTFLoader();
const foxGltf = await gltfLoader.loadAsync("/models/Fox/glTF/Fox.gltf");

const model = foxGltf.scene;

model.rotateY(Math.PI);
model.scale.set(0.005, 0.005, 0.005);
model.position.set(foxGltf.scene.position.x, 5, foxGltf.scene.position.z);

model.traverse((object) => {
  if (object.isMesh) {
    object.castShadow = true;
  }
});
scene.add(model);

const gltfAnimations = foxGltf.animations;
const mixer = new THREE.AnimationMixer(model);
const animationsMap = new Map();
gltfAnimations.forEach((a) => {
  animationsMap.set(a.name, mixer.clipAction(a));
});

const shape = new CANNON.Box(new CANNON.Vec3(0.08, 0.1, 0.5));

const body = new CANNON.Body({
  mass: 1,
  // position: model.position,
  shape: shape,
  material: defaultMaterial,
});
body.position.copy(model.position);
// body.addEventListener('collide', playHitSound)
world.addBody(body);

const characterControls = new CharacterControls(
  model,
  mixer,
  animationsMap,
  controls,
  camera,
  "Survey",
  playerName,
  body
);
/*********************************************************************
 * FOX Model
 *********************************************************************/

/*********************************************************************
 * FOX Controls
 *********************************************************************/
const keysPressed = {};
// const keyDisplayQueue = new KeyDisplay();
document.addEventListener(
  "keydown",
  (event) => {
    // keyDisplayQueue.down(event.key)
    if (event.shiftKey && characterControls) {
      characterControls.switchRunToggle();
    } else {
      keysPressed[event.key.toLowerCase()] = true;
    }
  },
  false
);
document.addEventListener(
  "keyup",
  (event) => {
    // keyDisplayQueue.up(event.key);
    keysPressed[event.key.toLowerCase()] = false;
    winterSounds.play();
  },
  false
);
/*********************************************************************
 * FOX Controls
 *********************************************************************/

/*********************************************************************
 * Trees
 *********************************************************************/
const trees = new THREE.Group();
scene.add(trees);

const treeGltf = await gltfLoader.loadAsync(
  "/models/low_poly_snowy_trees/scene.gltf"
);

const treeModels = [];

// treeGltf.scene.scale.set(0.005, 0.005, 0.005);
treeGltf.scene.traverse((object) => {
  if (object.isMesh) {
    console.log(object.name);
    treeModels.push(object);
  }
});

const numOfGraves = 100;
for (let i = 0; i < numOfGraves; i++) {
  const treeIndex = i % treeModels.length;

  const angle = Math.random() * Math.PI * 2;

  const radius = 4 + Math.random() * 50;
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;
  // const y = 0.4 - Math.random() * 0.2;

  const treeMesh = treeModels[treeIndex].clone();
  treeMesh.rotation.x = -Math.PI * 0.5;
  if (treeMesh.name === "Tree_5_0") {
    treeMesh.scale.set(0.5, 0.5, 0.5);
    treeMesh.position.set(x, 0.5, z);
  } else if (treeMesh.name === "Tree_4_0") {
    treeMesh.scale.set(0.3, 0.3, 0.3);
    treeMesh.position.set(x, 0, z);
  } else if (treeMesh.name === "Tree_3_0") {
    treeMesh.scale.set(0.1, 0.1, 0.1);
    treeMesh.position.set(x, 0.2, z);
  } else if (treeMesh.name === "Tree_6_0") {
    treeMesh.position.set(x, 3, z);
  } else {
    treeMesh.scale.set(0.2, 0.2, 0.2);
    treeMesh.position.set(x, 0.5, z);
  }

  treeMesh.castShadow = true;

  // const treeShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));

  // const treeBody = new CANNON.Body({
  //   mass: 1,
  //   // position: model.position,
  //   shape: treeShape,
  //   material: defaultMaterial,
  // });
  // treeBody.position.copy(treeMesh.position);
  // body.addEventListener('collide', playHitSound)
  // world.addBody(treeBody);

  trees.add(treeMesh);
}

/**
 * Sounds
 */
const winterSounds = new Audio("/sounds/winter_sounds.mp3");

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.shadow.bias = -0.005;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

const dLightCamHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
scene.add(dLightCamHelper);
dLightCamHelper.visible = false;

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

const updateParticles = () => {
  // Update particles
  // particles.rotation.x = elapsedTime * 0.5;

  for (let i = 0; i < snow.count; i++) {
    const i3 = i * 3;

    // particlesGeo.attributes.position.array;
    // const x = particlesGeo.attributes.position.array[i3 + 0];

    const newY = particlesGeo.attributes.position.array[i3 + 1] - speed.value;
    const newX = particlesGeo.attributes.position.array[i3 + 0] - speed.wind;

    particlesGeo.attributes.position.array[i3 + 1] = newY <= 0 ? 10 : newY;
    particlesGeo.attributes.position.array[i3 + 0] =
      newX < -WORLD_WIDTH ? WORLD_WIDTH : newX;
  }

  particlesGeo.attributes.position.needsUpdate = true;
};

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  if (characterControls) {
    characterControls.update(deltaTime, keysPressed);
  }

  updateParticles();

  // Update controls
  controls.update();

  world.step(deltaTime); // Update cannon-es physics
  // cannonDebugger.update(); // Update the CannonDebugger meshes
  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
