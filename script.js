import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { data, dataReady } from './data.js'






/// threejs setup
const scene = new THREE.Scene();
// more visible perspective, but from above, coasts are unaligned
// const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
// closer to orthographic
const camera = new THREE.PerspectiveCamera( 3, window.innerWidth / window.innerHeight, 0.1, 10000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );

document.body.appendChild( renderer.domElement );

/// scene setup
const controls = new OrbitControls( camera, renderer.domElement );

// choose this position for orthographic
camera.position.set( 30, 1400, -106 );
// choose this position for perspective
// camera.position.set( 36, 100, -96 );
controls.target.set(36, 0, -106)
controls.update();


const directionalLight = new THREE.DirectionalLight('#ffffee')
// target is 0,0,0     position is 1,1,0  // shines from above and east, down to 0,0,0
directionalLight.position.set(-1,1,1)
scene.add(directionalLight)

const ambientLight = new THREE.AmbientLight('#eeeeff', 0.1)
scene.add(ambientLight)

// const axesHelper = new THREE.AxesHelper( 10 );
// axesHelper.position.set(36, 0, -96)
// scene.add( axesHelper );





/// animation

// let time = 0
let year = 1950

let mode = 'animation'

/** @type {any} */
const slider = document.getElementById('year')

slider.addEventListener('input', event => {
    mode = 'manual' // stop animating
    year = Number(slider.value)
    updateSpheres(data)
})

/** @type {any} */
const button = document.getElementById('animate')
button.addEventListener('click', event => {
    if (mode === 'manual') {
        mode = 'animation'
    } else {
        mode = 'manual'
    }
})



/// our graph

// map
const mapHeight = populationToY(100_000)

;(() => {
    const geometry = new THREE.PlaneGeometry(1,1)
    
    const loader = new THREE.TextureLoader()
    const texture = loader.load('images/outline-of-united-states-map-brown-hi.png')
    const mapMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false, // don't block other objects behind
    })
    const map = new THREE.Mesh(geometry, mapMaterial)
    scene.add(map)
    map.position.set(36.4, mapHeight, -96)
    map.scale.set(58,-30,30)
    // map.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI/2)
    map.rotateY(-Math.PI/2)
    map.rotateX(Math.PI/2)
    
})()


// spheres
const sphereMeshes = {}
const lineMeshes = {}

const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 1, 0),
])

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries
function buildSpheres(data) {
    for (const [name, cityData] of Object.entries(data)) {
        
        // make a sphere
        // add to scene
        // x,z lat long                         constant
        // y pop                                variable
        // size area                            constant
        // opacity/color  density = pop/area    variable
        const geometry = new THREE.SphereGeometry(cityData.area/500 + 0.5)
        const material = new THREE.MeshLambertMaterial({ color: 0x00ff00, transparent: true })
        const sphere = new THREE.Mesh( geometry, material)
        scene.add(sphere)
        sphereMeshes[name] = sphere
        
        // console.log(cityData.lat, cityData.populationOverTime[0]/1_000_000, cityData.long)
        // sphere.position.set(cityData.lat, cityData.populationOverTime[0]/1_000_000, cityData.long)
        sphere.position.set(cityData.lat, 0, cityData.long)
        
        // linesPoints.push(new THREE.Vector3(cityData.lat, 0, cityData.long))
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x00ff00,
        })
        const line = new THREE.Line(lineGeometry, lineMaterial)
        scene.add(line)
        lineMeshes[name] = line
        line.position.set(cityData.lat, mapHeight, cityData.long)
    }
}

// console.log(sphereMeshes)

function populationToY(population) {
    return 8*Math.log(population/1_000_000)
}

const densityColor0 = new THREE.Color().setHSL(1/6, 1, 0.5)
const densityColor1 = new THREE.Color().setHSL(0, 1, 0.5)

function updateSpheres(data) {
    for (const [name, cityData] of Object.entries(data)) {
        
        // x,z lat long                         constant
        // y pop                                variable
        // size area                            constant
        // opacity/color  density = pop/area    variable
        const sphere = sphereMeshes[name]
        
        // 0 -> 1950, 1 -> 1951
        // interpolate the two adjacent years
        const populationYearStart = cityData.populationOverTime[Math.floor(year - 1950)]
        const populationYearEnd = cityData.populationOverTime[Math.floor(year+1 - 1950)]
        const weight = (year % 1)
        const population = (1-weight)*populationYearStart + weight*populationYearEnd
        
        sphere.position.setY(populationToY(population))
        
        const density = population / cityData.area
        
        // sphere.material.opacity = 0.30 + (density / 65_000)
        sphere.material.color.copy(densityColor0)
        sphere.material.color.lerpHSL(densityColor1, Math.pow(Math.min(1, density / 70_000), 0.4))
        
        const line = lineMeshes[name]
        line.scale.set(1, populationToY(population) - mapHeight, 1)
        line.material.color.copy(sphere.material.color)
    }
}

dataReady.then(() => {
    buildSpheres(data)
    requestAnimationFrame(animate)
    // setTimeout(() => {
    //     updateSpheres(data, time)
    // }, 1000)
})




// Y axis

const labels = [
    10_000,
    30_000,
    100_000,
    300_000,
    1_000_000,
    3_000_000,
    10_000_000,
    30_000_000,
]

const numTextures = labels.map(drawNumber)

function drawNumber(num) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext("2d");
    ctx.canvas.width = 240
    ctx.canvas.height = 48
    ctx.fillStyle = "white";
    ctx.font = "48px sans-serif";
    ctx.fillText(num.toLocaleString(), 0, 48); // text, x, y
    return new THREE.CanvasTexture(canvas, THREE.UVMapping)
}

labels.forEach((labelNum, idx) => {
    const mat = new THREE.SpriteMaterial({
        map: numTextures[idx],
    })
    const sprite = new THREE.Sprite(mat)
    sprite.position.set(36, populationToY(labelNum), -130)
    sprite.scale.set(5,1,1).multiplyScalar(1.5)
    scene.add(sprite)
})




function animate(newTime) {
    // console.log(prevTime)
    requestAnimationFrame( animate );
    
    const delta = newTime - prevTime
    prevTime = newTime
    
    if (mode === 'animation') {
        // year = 1950 + (2035-1950)*((time/8) % 1)
        year += (2035-1950)*(delta/1000/8)
        if (year >= 2035) {
            year = 1950
        }
        slider.value = year
        updateSpheres(data)
    }
    
    
    // required if controls.enableDamping or controls.autoRotate are set to true
	// controls.update();
    
    renderer.render( scene, camera );
    
}


let prevTime = performance.now()


