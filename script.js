"use strict";

console.log("GREAK TOWER script started");

let scene;
let camera;
let renderer;

function startGame() {
    // Check Three.js
    if (typeof THREE === "undefined") {
        console.error("THREE.JS DID NOT LOAD");
        document.getElementById("message").textContent =
            "ERROR: Three.js did not load.";
        return;
    }

    console.log("Three.js loaded:", THREE.REVISION);

    // -------------------------
    // SCENE
    // -------------------------

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    // -------------------------
    // CAMERA
    // -------------------------

    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    camera.position.set(0, 25, 25);
    camera.lookAt(0, 0, 0);

    // -------------------------
    // RENDERER
    // -------------------------

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    document.getElementById("game").appendChild(
        renderer.domElement
    );

    // -------------------------
    // LIGHTS
    // -------------------------

    const ambientLight = new THREE.AmbientLight(
        0xffffff,
        0.7
    );

    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(
        0xffffff,
        1
    );

    sun.position.set(10, 30, 10);

    scene.add(sun);

    // -------------------------
    // GROUND
    // -------------------------

    const groundGeometry = new THREE.BoxGeometry(
        34,
        1,
        26
    );

    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x4caf50
    });

    const ground = new THREE.Mesh(
        groundGeometry,
        groundMaterial
    );

    ground.position.y = -0.5;

    scene.add(ground);

    // -------------------------
    // PATH
    // -------------------------

    const pathMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xd9b56c
        });

    const path = new THREE.Mesh(
        new THREE.BoxGeometry(30, 0.15, 4),
        pathMaterial
    );

    path.position.set(0, 0.1, -5);

    scene.add(path);

    // -------------------------
    // TEST TOWER
    // -------------------------

    const towerBase = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshStandardMaterial({
            color: 0x2196f3
        })
    );

    towerBase.position.set(0, 1, 3);

    scene.add(towerBase);

    const towerTop = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1, 1.5),
        new THREE.MeshStandardMaterial({
            color: 0xffd600
        })
    );

    towerTop.position.set(0, 2.5, 3);

    scene.add(towerTop);

    // -------------------------
    // TEST ENEMY
    // -------------------------

    const enemy = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1.5, 1.5),
        new THREE.MeshStandardMaterial({
            color: 0xf44336
        })
    );

    enemy.position.set(-10, 0.75, -5);

    scene.add(enemy);

    // -------------------------
    // RESIZE
    // -------------------------

    window.addEventListener(
        "resize",
        resizeGame
    );

    console.log("GREAK TOWER 3D scene created");

    animate();
}

// -------------------------
// RESIZE
// -------------------------

function resizeGame() {

    if (!camera || !renderer) return;

    camera.aspect =
        window.innerWidth /
        window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
}

// -------------------------
// ANIMATION
// -------------------------

function animate() {

    requestAnimationFrame(animate);

    renderer.render(
        scene,
        camera
    );
}

// -------------------------
// START
// -------------------------

startGame();
