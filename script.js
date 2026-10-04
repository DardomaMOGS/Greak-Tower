```javascript
"use strict";

/*
=========================================================
GREAK TOWER V0.1
Browser Tower Defense
Three.js
=========================================================
*/

/* ======================================================
   BASIC SETUP
====================================================== */

const game = document.getElementById("game");

const coinsElement = document.getElementById("coins");
const healthElement = document.getElementById("baseHealth");
const waveElement = document.getElementById("wave");

const startWaveButton = document.getElementById("startWave");
const towerButton = document.getElementById("towerButton");
const messageElement = document.getElementById("message");


/* ======================================================
   GAME STATE
====================================================== */

const GAME = {
    coins: 100,
    baseHealth: 100,

    wave: 1,

    waveRunning: false,
    enemiesToSpawn: 0,
    enemiesSpawned: 0,

    spawnTimer: 0,

    towerMode: false,

    gameOver: false
};


/* ======================================================
   THREE.JS
====================================================== */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x87ceeb);


/* ======================================================
   CAMERA
====================================================== */

const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(0, 28, 24);
camera.lookAt(0, 0, 0);


/* ======================================================
   RENDERER
====================================================== */

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.shadowMap.enabled = true;

game.appendChild(renderer.domElement);


/* ======================================================
   LIGHTING
====================================================== */

const ambientLight = new THREE.HemisphereLight(
    0xffffff,
    0x567d46,
    1.8
);

scene.add(ambientLight);


const sun = new THREE.DirectionalLight(
    0xffffff,
    2
);

sun.position.set(10, 25, 10);

sun.castShadow = true;

sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;

scene.add(sun);


/* ======================================================
   GAME GROUPS
====================================================== */

const enemyGroup = new THREE.Group();
const towerGroup = new THREE.Group();
const projectileGroup = new THREE.Group();

scene.add(enemyGroup);
scene.add(towerGroup);
scene.add(projectileGroup);


/* ======================================================
   MATERIALS
====================================================== */

const grassMaterial = new THREE.MeshStandardMaterial({
    color: 0x55a630
});

const pathMaterial = new THREE.MeshStandardMaterial({
    color: 0xc2a878
});

const towerMaterial = new THREE.MeshStandardMaterial({
    color: 0x2563eb
});

const towerTopMaterial = new THREE.MeshStandardMaterial({
    color: 0xfacc15
});

const enemyMaterial = new THREE.MeshStandardMaterial({
    color: 0xdc2626
});

const enemyFaceMaterial = new THREE.MeshStandardMaterial({
    color: 0x111827
});

const projectileMaterial = new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xfacc15,
    emissiveIntensity: 1
});


/* ======================================================
   MAP
====================================================== */

const groundGeometry = new THREE.BoxGeometry(34, 1, 26);

const ground = new THREE.Mesh(
    groundGeometry,
    grassMaterial
);

ground.position.y = -0.5;

ground.receiveShadow = true;

scene.add(ground);


/* ======================================================
   ENEMY PATH
====================================================== */

const pathPoints = [
    new THREE.Vector3(-15, 0.5, -9),
    new THREE.Vector3(-8, 0.5, -9),
    new THREE.Vector3(-8, 0.5, 5),
    new THREE.Vector3(2, 0.5, 5),
    new THREE.Vector3(2, 0.5, -5),
    new THREE.Vector3(10, 0.5, -5),
    new THREE.Vector3(10, 0.5, 9),
    new THREE.Vector3(15, 0.5, 9)
];


/* ======================================================
   CREATE PATH SEGMENTS
====================================================== */

function createPathSegment(start, end) {

    const distance = start.distanceTo(end);

    const geometry = new THREE.BoxGeometry(
        Math.abs(end.x - start.x) || 3,
        0.2,
        Math.abs(end.z - start.z) || 3
    );

    const mesh = new THREE.Mesh(
        geometry,
        pathMaterial
    );

    mesh.position.set(
        (start.x + end.x) / 2,
        0.05,
        (start.z + end.z) / 2
    );

    mesh.receiveShadow = true;

    scene.add(mesh);
}


/* ======================================================
   BUILD PATH
====================================================== */

for (let i = 0; i < pathPoints.length - 1; i++) {

    createPathSegment(
        pathPoints[i],
        pathPoints[i + 1]
    );
}


/* ======================================================
   DECORATIONS
====================================================== */

function createTree(x, z) {

    const trunkGeometry = new THREE.BoxGeometry(
        0.7,
        2,
        0.7
    );

    const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x7c4a21
    });

    const trunk = new THREE.Mesh(
        trunkGeometry,
        trunkMaterial
    );

    trunk.position.set(x, 1, z);

    trunk.castShadow = true;

    scene.add(trunk);


    const leavesGeometry = new THREE.BoxGeometry(
        2.2,
        2.2,
        2.2
    );

    const leavesMaterial = new THREE.MeshStandardMaterial({
        color: 0x15803d
    });

    const leaves = new THREE.Mesh(
        leavesGeometry,
        leavesMaterial
    );

    leaves.position.set(x, 2.6, z);

    leaves.castShadow = true;

    scene.add(leaves);
}


createTree(-13, 6);
createTree(-13, -3);
createTree(-3, -10);
createTree(6, 10);
createTree(13, 4);
createTree(14, -9);


/* ======================================================
   BASE
====================================================== */

function createBase() {

    const baseGeometry = new THREE.BoxGeometry(
        3,
        3,
        3
    );

    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x7c3aed
    });

    const base = new THREE.Mesh(
        baseGeometry,
        baseMaterial
    );

    base.position.set(
        15,
        1.5,
        9
    );

    base.castShadow = true;

    scene.add(base);


    const roofGeometry = new THREE.ConeGeometry(
        2.4,
        2,
        4
    );

    const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0xf97316
    });

    const roof = new THREE.Mesh(
        roofGeometry,
        roofMaterial
    );

    roof.position.set(
        15,
        4,
        9
    );

    roof.rotation.y = Math.PI / 4;

    roof.castShadow = true;

    scene.add(roof);
}

createBase();


/* ======================================================
   ENEMY SYSTEM
====================================================== */

const enemies = [];


function createEnemy() {

    const enemy = {

        mesh: null,

        health: 100,

        maxHealth: 100,

        speed: 2.2,

        pathIndex: 0,

        alive: true,

        reward: 10
    };


    const bodyGeometry = new THREE.BoxGeometry(
        1.2,
        1.2,
        1.2
    );

    const body = new THREE.Mesh(
        bodyGeometry,
        enemyMaterial
    );

    body.castShadow = true;


    /* Eyes */

    const eyeGeometry = new THREE.BoxGeometry(
        0.2,
        0.2,
        0.1
    );

    const leftEye = new THREE.Mesh(
        eyeGeometry,
        enemyFaceMaterial
    );

    leftEye.position.set(
        -0.25,
        0.2,
        -0.61
    );

    body.add(leftEye);


    const rightEye = new THREE.Mesh(
        eyeGeometry,
        enemyFaceMaterial
    );

    rightEye.position.set(
        0.25,
        0.2,
        -0.61
    );

    body.add(rightEye);


    enemy.mesh = body;

    enemy.mesh.position.copy(pathPoints[0]);

    enemyGroup.add(enemy.mesh);

    enemies.push(enemy);
}


/* ======================================================
   REMOVE ENEMY
====================================================== */

function removeEnemy(enemy) {

    if (!enemy.alive) {
        return;
    }

    enemy.alive = false;

    enemyGroup.remove(enemy.mesh);

    GAME.coins += enemy.reward;

    updateUI();
}


/* ======================================================
   DAMAGE ENEMY
====================================================== */

function damageEnemy(enemy, amount) {

    if (!enemy.alive) {
        return;
    }

    enemy.health -= amount;

    if (enemy.health <= 0) {

        removeEnemy(enemy);

    }
}


/* ======================================================
   ENEMY MOVEMENT
====================================================== */

function updateEnemies(delta) {

    for (let i = enemies.length - 1; i >= 0; i--) {

        const enemy = enemies[i];

        if (!enemy.alive) {

            enemies.splice(i, 1);

            continue;
        }


        const target = pathPoints[enemy.pathIndex + 1];

        if (!target) {

            enemy.alive = false;

            enemyGroup.remove(enemy.mesh);

            GAME.baseHealth -= 10;

            updateUI();

            if (GAME.baseHealth <= 0) {
                endGame();
            }

            enemies.splice(i, 1);

            continue;
        }


        const direction = new THREE.Vector3()
            .subVectors(target, enemy.mesh.position)
            .normalize();


        enemy.mesh.position.addScaledVector(
            direction,
            enemy.speed * delta
        );


        enemy.mesh.lookAt(target);


        if (
            enemy.mesh.position.distanceTo(target) < 0.3
        ) {

            enemy.pathIndex++;
        }
    }
}


/* ======================================================
   TOWER SYSTEM
====================================================== */

const towers = [];

const TOWER_COST = 50;


function createTower(position) {

    if (GAME.coins < TOWER_COST) {

        showMessage("Not enough coins!");

        return;
    }


    GAME.coins -= TOWER_COST;


    const tower = {

        mesh: null,

        range: 7,

        damage: 25,

        fireRate: 0.7,

        cooldown: 0,

        target: null
    };


    const baseGeometry = new THREE.BoxGeometry(
        1.6,
        1.2,
        1.6
    );

    const base = new THREE.Mesh(
        baseGeometry,
        towerMaterial
    );

    base.position.y = 0.6;

    base.castShadow = true;


    const topGeometry = new THREE.BoxGeometry(
        1,
        1.4,
        1
    );

    const top = new THREE.Mesh(
        topGeometry,
        towerTopMaterial
    );

    top.position.y = 1.9;

    top.castShadow = true;

    base.add(top);


    const barrelGeometry = new THREE.BoxGeometry(
        0.35,
        0.35,
        1.6
    );

    const barrelMaterial = new THREE.MeshStandardMaterial({
        color: 0x374151
    });

    const barrel = new THREE.Mesh(
        barrelGeometry,
        barrelMaterial
    );

    barrel.position.set(
        0,
        1.9,
        -0.8
    );

    top.add(barrel);


    tower.mesh = base;

    tower.mesh.position.copy(position);

    towerGroup.add(tower.mesh);

    towers.push(tower);

    updateUI();

    showMessage("Tower placed!");

    GAME.towerMode = false;

    towerButton.textContent = "🏹 TOWER — $50";
}


/* ======================================================
   FIND TARGET
====================================================== */

function findTarget(tower) {

    let closestEnemy = null;

    let closestDistance = Infinity;


    for (const enemy of enemies) {

        if (!enemy.alive) {
            continue;
        }


        const distance =
            tower.mesh.position.distanceTo(
                enemy.mesh.position
            );


        if (
            distance <= tower.range &&
            distance < closestDistance
        ) {

            closestDistance = distance;

            closestEnemy = enemy;
        }
    }


    return closestEnemy;
}


/* ======================================================
   PROJECTILE SYSTEM
====================================================== */

const projectiles = [];


function fireProjectile(tower, target) {

    const geometry = new THREE.SphereGeometry(
        0.18,
        8,
        8
    );


    const projectile = new THREE.Mesh(
        geometry,
        projectileMaterial
    );


    projectile.position.copy(
        tower.mesh.position
    );

    projectile.position.y += 2;


    projectileGroup.add(projectile);


    projectiles.push({

        mesh: projectile,

        target: target,

        speed: 12,

        damage: tower.damage
    });
}


/* ======================================================
   UPDATE PROJECTILES
====================================================== */

function updateProjectiles(delta) {

    for (
        let i = projectiles.length - 1;
        i >= 0;
        i--
    ) {

        const projectile = projectiles[i];


        if (
            !projectile.target ||
            !projectile.target.alive
        ) {

            projectileGroup.remove(
                projectile.mesh
            );

            projectiles.splice(i, 1);

            continue;
        }


        const direction = new THREE.Vector3()
            .subVectors(
                projectile.target.mesh.position,
                projectile.mesh.position
            )
            .normalize();


        projectile.mesh.position.addScaledVector(
            direction,
            projectile.speed * delta
        );


        if (
            projectile.mesh.position.distanceTo(
                projectile.target.mesh.position
            ) < 0.5
        ) {

            damageEnemy(
                projectile.target,
                projectile.damage
            );


            projectileGroup.remove(
                projectile.mesh
            );

            projectiles.splice(i, 1);
        }
    }
}


/* ======================================================
   UPDATE TOWERS
====================================================== */

function updateTowers(delta) {

    for (const tower of towers) {

        tower.cooldown -= delta;


        if (
            !tower.target ||
            !tower.target.alive ||
            tower.mesh.position.distanceTo(
                tower.target.mesh.position
            ) > tower.range
        ) {

            tower.target = findTarget(tower);
        }


        if (
            tower.target &&
            tower.cooldown <= 0
        ) {

            fireProjectile(
                tower,
                tower.target
            );

            tower.cooldown = tower.fireRate;
        }


        if (tower.target) {

            const targetPosition =
                tower.target.mesh.position.clone();

            targetPosition.y = 1.9;

            tower.mesh.children[0].lookAt(
                targetPosition
            );
        }
    }
}


/* ======================================================
   WAVE SYSTEM
====================================================== */

function startWave() {

    if (GAME.waveRunning || GAME.gameOver) {
        return;
    }


    GAME.waveRunning = true;

    GAME.enemiesToSpawn =
        4 + GAME.wave * 2;

    GAME.enemiesSpawned = 0;

    GAME.spawnTimer = 0;


    startWaveButton.textContent =
        "🌊 WAVE RUNNING";

    showMessage(
        `Wave ${GAME.wave} started!`
    );
}


/* ======================================================
   SPAWN ENEMIES
====================================================== */

function updateWave(delta) {

    if (!GAME.waveRunning) {
        return;
    }


    GAME.spawnTimer -= delta;


    if (
        GAME.enemiesSpawned <
            GAME.enemiesToSpawn &&
        GAME.spawnTimer <= 0
    ) {

        createEnemy();

        GAME.enemiesSpawned++;

        GAME.spawnTimer = 0.8;
    }


    if (
        GAME.enemiesSpawned >=
            GAME.enemiesToSpawn &&
        enemies.length === 0
    ) {

        GAME.waveRunning = false;

        GAME.wave++;

        GAME.coins += 25;

        updateUI();

        startWaveButton.textContent =
            "▶ START WAVE";

        showMessage(
            "Wave complete! +25 coins"
        );
    }
}


/* ======================================================
   UI
====================================================== */

function updateUI() {

    coinsElement.textContent =
        GAME.coins;

    healthElement.textContent =
        GAME.baseHealth;

    waveElement.textContent =
        GAME.wave;
}


/* ======================================================
   MESSAGE SYSTEM
====================================================== */

let messageTimeout = null;


function showMessage(message) {

    messageElement.textContent = message;

    messageElement.classList.add("show");


    clearTimeout(messageTimeout);


    messageTimeout = setTimeout(() => {

        messageElement.classList.remove("show");

    }, 1800);
}


/* ======================================================
   GAME OVER
====================================================== */

function endGame() {

    GAME.gameOver = true;

    GAME.waveRunning = false;

    startWaveButton.textContent =
        "GAME OVER";

    showMessage(
        "💀 GAME OVER — Refresh to try again!"
    );
}


/* ======================================================
   TOWER PLACEMENT
====================================================== */

const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();


function getMousePosition(event) {

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


    const hits =
        raycaster.intersectObject(
            ground
        );


    if (hits.length === 0) {
        return null;
    }


    const position =
        hits[0].point.clone();


    position.y = 0;


    return position;
}


/* ======================================================
   CLICK HANDLER
====================================================== */

renderer.domElement.addEventListener(
    "click",
    event => {

        if (
            !GAME.towerMode ||
            GAME.gameOver
        ) {
            return;
        }


        const position =
            getMousePosition(event);


        if (!position) {
            return;
        }


        /*
        Don't allow towers directly
        on the enemy path.
        */

        for (let i = 0; i < pathPoints.length - 1; i++) {

            const a = pathPoints[i];

            const b = pathPoints[i + 1];


            const minX =
                Math.min(a.x, b.x) - 1.2;

            const maxX =
                Math.max(a.x, b.x) + 1.2;

            const minZ =
                Math.min(a.z, b.z) - 1.2;

            const maxZ =
                Math.max(a.z, b.z) + 1.2;


            if (
                position.x >= minX &&
                position.x <= maxX &&
                position.z >= minZ &&
                position.z <= maxZ
            ) {

                showMessage(
                    "You can't place a tower on the path!"
                );

                return;
            }
        }


        createTower(position);
    }
);


/* ======================================================
   BUTTON EVENTS
====================================================== */

startWaveButton.addEventListener(
    "click",
    startWave
);


towerButton.addEventListener(
    "click",
    () => {

        if (GAME.gameOver) {
            return;
        }


        if (GAME.coins < TOWER_COST) {

            showMessage(
                "You need 50 coins!"
            );

            return;
        }


        GAME.towerMode =
            !GAME.towerMode;


        if (GAME.towerMode) {

            towerButton.textContent =
                "❌ CANCEL TOWER";

            showMessage(
                "Click the map to place your tower!"
            );

        } else {

            towerButton.textContent =
                "🏹 TOWER — $50";
        }
    }
);


/* ======================================================
   WINDOW RESIZE
====================================================== */

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
    }
);


/* ======================================================
   GAME LOOP
====================================================== */

const clock = new THREE.Clock();


function animate() {

    requestAnimationFrame(animate);


    const delta =
        Math.min(
            clock.getDelta(),
            0.05
        );


    if (!GAME.gameOver) {

        updateWave(delta);

        updateEnemies(delta);

        updateTowers(delta);

        updateProjectiles(delta);
    }


    renderer.render(
        scene,
        camera
    );
}


/* ======================================================
   START GAME
====================================================== */

updateUI();

showMessage(
    "Welcome to GREAK TOWER!"
);

animate();
```
