import app from '../app.js'
import * as THREE from 'three'
import Environment from './environment.js'

export default class World
{
    constructor()
    {
        this.app = new app()
        this.scene = this.app.scene

        // Test mesh
        const testMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial()
        )
        this.scene.add(testMesh)

        // Setup
        this.environment = new Environment()
    }
}