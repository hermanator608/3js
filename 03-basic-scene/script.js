const scene = new THREE.Scene()

// Red cube
const geo = new THREE.BoxGeometry(1, 1, 1)
const mat = new THREE.MeshBasicMaterial({color: '#ff0000'})
const mesh = new THREE.Mesh(geo, mat)

scene.add(mesh)

// Camera
const sizes = {
  width: 800,
  height: 600
}

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
camera.position.z = 3
scene.add(camera)

const canvas = document.querySelector('.webgl')
const renderer = new THREE.WebGLRenderer({
  canvas
})

renderer.setSize(sizes.width, sizes.height)

renderer.render(scene, camera)
