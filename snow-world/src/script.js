import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { CharacterControls } from './charMovement'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger'
import { threeToCannon } from 'three-to-cannon'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0xa8def0);

/**
 * Physics
 */
const world = new CANNON.World()
world.broadphase = new CANNON.SAPBroadphase(world)
world.allowSleep = true
world.gravity.set(0, - 9.82, 0)

const cannonDebugger = new CannonDebugger(scene, world, {
// options...
})

// Default material
const defaultMaterial = new CANNON.Material('default')
const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
        friction: 0.1,
        restitution: 0.7
    }
)
world.defaultContactMaterial = defaultContactMaterial

/**
 * Sizes
 */
 const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 5;
camera.position.z = 5;
camera.position.x = 0;
scene.add(camera)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true
controls.minDistance = 5
controls.maxDistance = 15
controls.enablePan = false
controls.maxPolarAngle = Math.PI / 2 - 0.05
controls.update();

/**
 * Textures
 */
 const textureLoader = new THREE.TextureLoader();

 const matcap = textureLoader.load("/textures/matcaps/black.png");

const fontLoader = new FontLoader();

/**
 * Models
 */
const gltfLoader = new GLTFLoader();

gltfLoader.load(
    '/models/world/scene.gltf',
    (gltf) =>
    {
        gltf.scene.traverse( function( node ) {
            if (node.name === 'Plane_0') {
                console.log(node)
            }
            // console.log(node)
            if ( node.isMesh ) {
                node.castShadow = true;
                node.receiveShadow = true;
                
                // let shape = threeToCannon(node);
                // console.log(shape)
                // // Add phys shape
                // let physBox = new CANNON.Body({
                //     mass: 0,
                //     // position: options.position,
                //     // quaternion: options.rotation,
                //     shape: shape
                // });
                // console.log('cannon', physBox)
                // const floorShape = new CANNON.Plane()
                // const floorBody = new CANNON.Body()
                // floorBody.mass = 0
                // floorBody.addShape(floorShape)
                // floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5) 
                // world.addBody(floorBody)

                // Create a matrix of height values
                const matrix = []
                const sizeX = 15
                const sizeZ = 15
                for (let i = 0; i < sizeX; i++) {
                    matrix.push([])
                    for (let j = 0; j < sizeZ; j++) {
                        if (i === 0 || i === sizeX - 1 || j === 0 || j === sizeZ - 1) {
                            const height = 3
                            matrix[i].push(height + 1)
                            continue
                        }

                        const height = Math.cos((i / sizeX) * Math.PI * 2) * Math.cos((j / sizeZ) * Math.PI * 2) + 2
                        matrix[i].push(height + 1)
                    }
                }

                // Create the heightfield
                const heightfieldShape = new CANNON.Heightfield(matrix, {
                elementSize: 1,
                })
                const heightfieldBody = new CANNON.Body({ mass: 0 })
                heightfieldBody.addShape(heightfieldShape)
                heightfieldBody.position.set(
                -((sizeX - 1) * heightfieldShape.elementSize) / 2,
                -4,
                ((sizeZ - 1) * heightfieldShape.elementSize) / 2
                )
                heightfieldBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
                world.addBody(heightfieldBody)

                // world.addBody(physBox);
            }
        } );

        scene.add(gltf.scene)
    },
    (progress) =>
    {
        console.log('progress')
        console.log(progress)
    },
    (error) =>
    {
        console.log('error')
        console.log(error)
    }
)

let characterControls = null; 
gltfLoader.load(
    '/models/Fox/glTF/Fox.gltf',
    async (gltf) =>
    {
        const model = gltf.scene;

        model.rotateY(Math.PI)
        model.scale.set(0.005, 0.005, 0.005)
        model.position.set(gltf.scene.position.x, 0.5, gltf.scene.position.z)

        const playerName = await loadPlayerName();

        model.traverse((object) => {
            if (object.isMesh) {
                object.castShadow = true;
                if (object.name.includes('Cone')) {
                    object.visible = false;
                }
            }
        });
        scene.add(model);
    
        const gltfAnimations = gltf.animations;
        const mixer = new THREE.AnimationMixer(model);
        const animationsMap = new Map()
        gltfAnimations.forEach((a) => {
            animationsMap.set(a.name, mixer.clipAction(a))
        })

        
    
        const shape = new CANNON.Box(new CANNON.Vec3(0.15, 0.15, 0.5))

        const body = new CANNON.Body({
            mass: 1,
            // position: model.position,
            shape: shape,
            material: defaultMaterial
        })
        body.position.copy(model.position)
        // body.addEventListener('collide', playHitSound)
        console.log(body)
        world.addBody(body)

        characterControls = new CharacterControls(model, mixer, animationsMap, controls, camera,  'Survey', playerName, body)
    },
    (progress) =>
    {
        console.log('progress')
        // console.log(progress)
    },
    (error) =>
    {
        console.log('error')
        console.log(error)
    }
)

const loadPlayerName = async () => {
    const font = await fontLoader.loadAsync("/fonts/helvetiker_regular.typeface.json");
    console.log("Font loaded", font);

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

    const text = new THREE.Mesh(textGeometry, sharedMaterial);

    scene.add(text);
    return text;
}

// CONTROL KEYS
const keysPressed = {  }
// const keyDisplayQueue = new KeyDisplay();
document.addEventListener('keydown', (event) => {
    // keyDisplayQueue.down(event.key)
    if (event.shiftKey && characterControls) {
        characterControls.switchRunToggle()
    } else {
        (keysPressed)[event.key.toLowerCase()] = true
    }
}, false);
document.addEventListener('keyup', (event) => {
    // keyDisplayQueue.up(event.key);
    (keysPressed)[event.key.toLowerCase()] = false
}, false);

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.shadow.bias = -0.05;
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    if (characterControls) {
        characterControls.update(deltaTime, keysPressed);
    }

    // Update controls
    controls.update()

    world.step(deltaTime) // Update cannon-es physics
    cannonDebugger.update() // Update the CannonDebugger meshes
    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()