import {Sizes} from './utils/Sizes.js'
import Time from './utils/time.js';
import * as THREE from 'three';
import Camera from './camera.js';
import Renderer from './renderer.js';
import World from './world/world.js';

let instance = null;

export default class App {
    constructor (canvas) {
        // Singleton
        if(instance)
        {
            return instance
        }
        instance = this

        this.canvas = canvas;

        // Setup
        this.sizes = new Sizes()
        this.time = new Time()
        this.scene = new THREE.Scene()
        this.camera = new Camera(this)

        this.renderer = new Renderer()
        this.world = new World()

        // Resize event
        window.addEventListener('resize', () =>
        {
            this.width = window.innerWidth
            this.height = window.innerHeight
            this.pixelRatio = Math.min(window.devicePixelRatio, 2)
        })

        // Resize event
        this.sizes.on('resize', () =>
        {
            console.log('A resize occurred');
            this.resize();
        })

        // Time tick event
        this.time.on('tick', () =>
        {
            this.update()
        })
    }

    resize() {
        this.camera.resize()
        this.renderer.resize()
    }

    update() {
        this.camera.update()
        this.renderer.update()
    }
}