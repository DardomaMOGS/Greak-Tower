"use strict";

/* =========================================================
   GREAK TOWER V0.1
   Complete working game logic
   ========================================================= */

// ---------------------------------------------------------
// GAME STATE
// ---------------------------------------------------------

const GAME = {
    coins: 100,
    baseHealth: 100,
    wave: 1,

    waveRunning: false,
    gameOver: false,

    enemiesToSpawn: 0,
    enemiesSpawned: 0,
    spawnTimer: 0,

    towerMode: false
};

// ---------------------------------------------------------
// THREE.JS
// ---------------------------------------------------------

let scene;
let camera;
let renderer;
let raycaster;
let mouse;
let placementPlane;

const enemies = [];
const towers = [];
const projectiles = [];

// ---------------------------------------------------------
// PATH
// ---------------------------------------------------------

const pathPoints = [
    new THREE.Vector3(-15, 0, -9),
    new THREE.Vector3(-8, 0, -9),
    new THREE.Vector3(-8, 0, 5),
    new THREE.Vector3(2, 0, 5),
    new THREE.Vector3(2, 0, -5),
    new THREE.Vector3(10, 0, -5),
    new THREE.Vector3(10, 0, 9),
    new THREE.Vector3(15, 0, 9)
];

// ---------------------------------------------------------
// START GAME
// ---------------------------------------------------------

function startGame() {

    if (typeof THREE === "undefined") {
        showMessage("Three.js failed to load.");
        return;
    }

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    // Camera
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    camera.position.set(0, 28, 27);
    camera.lookAt(0, 0, 0);

    // Renderer
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

    renderer.shadowMap.enabled = true;

    document.getElementById("game").innerHTML = "";

    document.getElementById("game").appendChild(
        renderer.domElement
    );

    // Raycasting
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    placementPlane = new THREE.Plane(
        new THREE.Vector3(0, 1, 0),
        0
    );

    // Lights
    createLights();

    // Map
    createGround();
    createPath();
    createTrees();
    createBase();

    // UI
    setupButtons();
    updateUI();

    // Input
    renderer.domElement.addEventListener(
        "click",
        handleMapClick
    );

    window.addEventListener(
        "resize",
        handleResize
    );

    animate();

    console.log("GREAK TOWER V0.1 started");
}

// ---------------------------------------------------------
// LIGHTS
// ---------------------------------------------------------

function createLights() {

    const ambient = new THREE.AmbientLight(
        0xffffff,
        0.65
    );

    scene.add(ambient);

    const sun = new THREE.DirectionalLight(
        0xffffff,
        1
    );

    sun.position.set(
        10,
        30,
        15
    );

    sun.castShadow = true;

    scene.add(sun);
}

// ---------------------------------------------------------
// GROUND
// ---------------------------------------------------------

function createGround() {

    const geometry = new THREE.BoxGeometry(
        34,
        1,
        26
    );

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x4caf50
        });

    const ground = new THREE.Mesh(
        geometry,
        material
    );

    ground.position.y = -0.5;

    ground.receiveShadow = true;

    scene.add(ground);
}

// ---------------------------------------------------------
// PATH
// ---------------------------------------------------------

function createPath() {

    const material =
        new THREE.MeshStandardMaterial({
            color: 0xd8b36a
        });

    for (let i = 0; i < pathPoints.length - 1; i++) {

        const a = pathPoints[i];
        const b = pathPoints[i + 1];

        const dx = b.x - a.x;
        const dz = b.z - a.z;

        const length = Math.sqrt(
            dx * dx + dz * dz
        );

        const geometry =
            new THREE.BoxGeometry(
                Math.abs(dx) > Math.abs(dz)
                    ? length
                    : 3.5,

                0.15,

                Math.abs(dz) > Math.abs(dx)
                    ? length
                    : 3.5
            );

        const pathPart = new THREE.Mesh(
            geometry,
            material
        );

        pathPart.position.set(
            (a.x + b.x) / 2,
            0.08,
            (a.z + b.z) / 2
        );

        scene.add(pathPart);
    }
}

// ---------------------------------------------------------
// TREES
// ---------------------------------------------------------

function createTrees() {

    const treePositions = [
        [-15, -3],
        [-13, 6],
        [-4, -3],
        [-4, 9],
        [6, 2],
        [6, -10],
        [13, -1],
        [14, 5],
        [-14, 11],
        [5, 11]
    ];

    for (const [x, z] of treePositions) {

        const trunk = new THREE.Mesh(
            new THREE.BoxGeometry(
                0.8,
                2,
                0.8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x795548
            })
        );

        trunk.position.set(
            x,
            1,
            z
        );

        trunk.castShadow = true;

        scene.add(trunk);

        const leaves = new THREE.Mesh(
            new THREE.BoxGeometry(
                2.5,
                2.5,
                2.5
            ),
            new THREE.MeshStandardMaterial({
                color: 0x228b22
            })
        );

        leaves.position.set(
            x,
            2.8,
            z
        );

        leaves.castShadow = true;

        scene.add(leaves);
    }
}

// ---------------------------------------------------------
// BASE
// ---------------------------------------------------------

function createBase() {

    const base = new THREE.Mesh(
        new THREE.BoxGeometry(
            3,
            3,
            3
        ),
        new THREE.MeshStandardMaterial({
            color: 0x7e57c2
        })
    );

    base.position.set(
        15,
        1.5,
        9
    );

    base.castShadow = true;

    scene.add(base);

    const roof = new THREE.Mesh(
        new THREE.ConeGeometry(
            2.5,
            2.5,
            4
        ),
        new THREE.MeshStandardMaterial({
            color: 0xff9800
        })
    );

    roof.position.set(
        15,
        4.2,
        9
    );

    roof.rotation.y = Math.PI / 4;

    roof.castShadow = true;

    scene.add(roof);
}

// ---------------------------------------------------------
// BUTTONS
// ---------------------------------------------------------

function setupButtons() {

    const startButton =
        document.getElementById("startWave");

    const towerButton =
        document.getElementById("towerButton");

    startButton.onclick = startWave;

    towerButton.onclick = function () {

        if (GAME.gameOver) return;

        GAME.towerMode = !GAME.towerMode;

        if (GAME.towerMode) {

            towerButton.textContent =
                "❌ CANCEL TOWER";

            showMessage(
                "Click an empty green area to place a tower."
            );

        } else {

            towerButton.textContent =
                "🏰 TOWER";

            showMessage("");
        }
    };
}

// ---------------------------------------------------------
// MAP CLICK
// ---------------------------------------------------------

function handleMapClick(event) {

    if (!GAME.towerMode) return;
    if (GAME.gameOver) return;

    const rect =
        renderer.domElement.getBoundingClientRect();

    mouse.x =
        ((event.clientX - rect.left) /
            rect.width) * 2 - 1;

    mouse.y =
        -((event.clientY - rect.top) /
            rect.height) * 2 + 1;

    raycaster.setFromCamera(
        mouse,
        camera
    );

    const position =
        new THREE.Vector3();

    const hit =
        raycaster.ray.intersectPlane(
            placementPlane,
            position
        );

    if (!hit) {
        showMessage("Invalid location.");
        return;
    }

    placeTower(
        position.x,
        position.z
    );
}

// ---------------------------------------------------------
// TOWER PLACEMENT
// ---------------------------------------------------------

function placeTower(x, z) {

    const COST = 50;

    // Map boundary
    if (
        x < -16 ||
        x > 16 ||
        z < -12 ||
        z > 12
    ) {
        showMessage("You cannot build there.");
        return;
    }

    // Path
    if (isOnPath(x, z)) {
        showMessage("You cannot build on the path.");
        return;
    }

    // Base
    if (
        Math.hypot(
            x - 15,
            z - 9
        ) < 3
    ) {
        showMessage("You cannot build near the base.");
        return;
    }

    // Tower spacing
    for (const tower of towers) {

        const distance =
            Math.hypot(
                tower.mesh.position.x - x,
                tower.mesh.position.z - z
            );

        if (distance < 2.5) {
            showMessage(
                "That tower is too close to another tower."
            );
            return;
        }
    }

    // Money
    if (GAME.coins < COST) {

        showMessage(
            "You need 50 coins."
        );

        return;
    }

    // Create tower
    const tower = createTower(
        x,
        z
    );

    towers.push(tower);

    GAME.coins -= COST;

    updateUI();

    GAME.towerMode = false;

    document.getElementById(
        "towerButton"
    ).textContent = "🏰 TOWER";

    showMessage(
        "Tower placed!"
    );
}

// ---------------------------------------------------------
// CHECK PATH
// ---------------------------------------------------------

function isOnPath(x, z) {

    const width = 2.4;

    for (let i = 0; i < pathPoints.length - 1; i++) {

        const a = pathPoints[i];
        const b = pathPoints[i + 1];

        if (a.x === b.x) {

            if (
                Math.abs(x - a.x) < width &&
                z >= Math.min(a.z, b.z) - width &&
                z <= Math.max(a.z, b.z) + width
            ) {
                return true;
            }

        } else {

            if (
                Math.abs(z - a.z) < width &&
                x >= Math.min(a.x, b.x) - width &&
                x <= Math.max(a.x, b.x) + width
            ) {
                return true;
            }
        }
    }

    return false;
}

// ---------------------------------------------------------
// CREATE TOWER
// ---------------------------------------------------------

function createTower(x, z) {

    const group =
        new THREE.Group();

    const base = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.7,
            1.8,
            1.7
        ),
        new THREE.MeshStandardMaterial({
            color: 0x2196f3
        })
    );

    base.position.y = 0.9;

    base.castShadow = true;

    group.add(base);

    const top = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.3,
            0.9,
            1.3
        ),
        new THREE.MeshStandardMaterial({
            color: 0xffd600
        })
    );

    top.position.y = 2.25;

    top.castShadow = true;

    group.add(top);

    const barrel = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.35,
            0.35,
            1.4
        ),
        new THREE.MeshStandardMaterial({
            color: 0x263238
        })
    );

    barrel.position.set(
        0,
        2.25,
        -0.8
    );

    barrel.castShadow = true;

    group.add(barrel);

    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);

    return {
        mesh: group,
        range: 7,
        damage: 25,
        fireRate: 0.7,
        cooldown: 0
    };
}

// ---------------------------------------------------------
// START WAVE
// ---------------------------------------------------------

function startWave() {

    if (GAME.gameOver) return;

    if (GAME.waveRunning) {

        showMessage(
            "The wave is already running!"
        );

        return;
    }

    GAME.waveRunning = true;

    GAME.enemiesToSpawn =
        4 + GAME.wave * 2;

    GAME.enemiesSpawned = 0;

    GAME.spawnTimer = 0;

    showMessage(
        "Wave " + GAME.wave + " started!"
    );
}

// ---------------------------------------------------------
// SPAWN ENEMY
// ---------------------------------------------------------

function spawnEnemy() {

    const enemyMesh = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.4,
            1.4,
            1.4
        ),
        new THREE.MeshStandardMaterial({
            color: 0xf44336
        })
    );

    enemyMesh.position.copy(
        pathPoints[0]
    );

    enemyMesh.position.y = 0.7;

    enemyMesh.castShadow = true;

    scene.add(enemyMesh);

    const enemy = {
        mesh: enemyMesh,

        pathIndex: 0,

        health: 100,

        maxHealth: 100,

        speed:
            2.2 + GAME.wave * 0.05,

        reward: 10
    };

    enemies.push(enemy);
}

// ---------------------------------------------------------
// UPDATE ENEMIES
// ---------------------------------------------------------

function updateEnemies(delta) {

    for (
        let i = enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy = enemies[i];

        if (
            enemy.pathIndex >=
            pathPoints.length - 1
        ) {

            scene.remove(
                enemy.mesh
            );

            enemies.splice(i, 1);

            GAME.baseHealth -= 10;

            updateUI();

            if (GAME.baseHealth <= 0) {
                GAME.baseHealth = 0;
                gameOver();
            }

            continue;
        }

        const target =
            pathPoints[
                enemy.pathIndex + 1
            ];

        const direction =
            new THREE.Vector3(
                target.x -
                    enemy.mesh.position.x,

                0,

                target.z -
                    enemy.mesh.position.z
            );

        const distance =
            direction.length();

        if (
            distance <
            enemy.speed * delta
        ) {

            enemy.mesh.position.set(
                target.x,
                0.7,
                target.z
            );

            enemy.pathIndex++;

        } else {

            direction.normalize();

            enemy.mesh.position.x +=
                direction.x *
                enemy.speed *
                delta;

            enemy.mesh.position.z +=
                direction.z *
                enemy.speed *
                delta;
        }
    }
}

// ---------------------------------------------------------
// UPDATE TOWERS
// ---------------------------------------------------------

function updateTowers(delta) {

    for (const tower of towers) {

        tower.cooldown -= delta;

        if (tower.cooldown > 0)
            continue;

        let closest = null;
        let closestDistance = Infinity;

        for (const enemy of enemies) {

            const distance =
                tower.mesh.position.distanceTo(
                    enemy.mesh.position
                );

            if (
                distance <= tower.range &&
                distance < closestDistance
            ) {

                closest = enemy;
                closestDistance = distance;
            }
        }

        if (closest) {

            fireProjectile(
                tower,
                closest
            );

            tower.cooldown =
                tower.fireRate;
        }
    }
}

// ---------------------------------------------------------
// PROJECTILE
// ---------------------------------------------------------

function fireProjectile(
    tower,
    enemy
) {

    const projectile = new THREE.Mesh(
        new THREE.SphereGeometry(
            0.25,
            12,
            12
        ),
        new THREE.MeshStandardMaterial({
            color: 0xffff00
        })
    );

    projectile.position.set(
        tower.mesh.position.x,
        2.25,
        tower.mesh.position.z
    );

    scene.add(projectile);

    projectiles.push({
        mesh: projectile,
        target: enemy,
        damage: tower.damage,
        speed: 14
    });
}

// ---------------------------------------------------------
// UPDATE PROJECTILES
// ---------------------------------------------------------

function updateProjectiles(delta) {

    for (
        let i = projectiles.length - 1;
        i >= 0;
        i--
    ) {

        const projectile =
            projectiles[i];

        const target =
            projectile.target;

        if (
            !target ||
            !enemies.includes(target)
        ) {

            scene.remove(
                projectile.mesh
            );

            projectiles.splice(i, 1);

            continue;
        }

        const direction =
            new THREE.Vector3()
                .subVectors(
                    target.mesh.position,
                    projectile.mesh.position
                );

        const distance =
            direction.length();

        if (
            distance <
            projectile.speed * delta
        ) {

            target.health -=
                projectile.damage;

            scene.remove(
                projectile.mesh
            );

            projectiles.splice(i, 1);

            if (target.health <= 0) {
                destroyEnemy(target);
            }

        } else {

            direction.normalize();

            projectile.mesh.position.add(
                direction.multiplyScalar(
                    projectile.speed * delta
                )
            );
        }
    }
}

// ---------------------------------------------------------
// DESTROY ENEMY
// ---------------------------------------------------------

function destroyEnemy(enemy) {

    const index =
        enemies.indexOf(enemy);

    if (index === -1)
        return;

    scene.remove(
        enemy.mesh
    );

    enemies.splice(
        index,
        1
    );

    GAME.coins += enemy.reward;

    updateUI();
}

// ---------------------------------------------------------
// WAVE LOGIC
// ---------------------------------------------------------

function updateWave(delta) {

    if (!GAME.waveRunning)
        return;

    GAME.spawnTimer -= delta;

    if (
        GAME.enemiesSpawned <
        GAME.enemiesToSpawn
    ) {

        if (GAME.spawnTimer <= 0) {

            spawnEnemy();

            GAME.enemiesSpawned++;

            GAME.spawnTimer =
                Math.max(
                    0.45,
                    0.9 -
                    GAME.wave * 0.02
                );
        }
    }

    if (
        GAME.enemiesSpawned >=
            GAME.enemiesToSpawn &&
        enemies.length === 0
    ) {

        finishWave();
    }
}

// ---------------------------------------------------------
// FINISH WAVE
// ---------------------------------------------------------

function finishWave() {

    GAME.waveRunning = false;

    GAME.coins += 25;

    GAME.wave++;

    updateUI();

    showMessage(
        "Wave complete! +25 coins"
    );
}

// ---------------------------------------------------------
// GAME OVER
// ---------------------------------------------------------

function gameOver() {

    if (GAME.gameOver)
        return;

    GAME.gameOver = true;

    GAME.waveRunning = false;
    GAME.towerMode = false;

    document.getElementById(
        "towerButton"
    ).textContent = "🏰 TOWER";

    showMessage(
        "GAME OVER — Refresh to play again."
    );
}

// ---------------------------------------------------------
// UI
// ---------------------------------------------------------

function updateUI() {

    document.getElementById(
        "coins"
    ).textContent =
        GAME.coins;

    document.getElementById(
        "baseHealth"
    ).textContent =
        GAME.baseHealth;

    document.getElementById(
        "wave"
    ).textContent =
        GAME.wave;
}

// ---------------------------------------------------------
// MESSAGE
// ---------------------------------------------------------

let messageTimer = null;

function showMessage(text) {

    const message =
        document.getElementById(
            "message"
        );

    message.textContent = text;

    clearTimeout(
        messageTimer
    );

    if (text) {

        messageTimer =
            setTimeout(
                () => {
                    message.textContent = "";
                },
                2500
            );
    }
}

// ---------------------------------------------------------
// RESIZE
// ---------------------------------------------------------

function handleResize() {

    camera.aspect =
        window.innerWidth /
        window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
}

// ---------------------------------------------------------
// MAIN LOOP
// ---------------------------------------------------------

let lastTime = performance.now();

function animate() {

    requestAnimationFrame(
        animate
    );

    const now =
        performance.now();

    const delta =
        Math.min(
            (now - lastTime) / 1000,
            0.05
        );

    lastTime = now;

    updateWave(delta);
    updateEnemies(delta);
    updateTowers(delta);
    updateProjectiles(delta);

    renderer.render(
        scene,
        camera
    );
}

// ---------------------------------------------------------
// START
// ---------------------------------------------------------

startGame();
