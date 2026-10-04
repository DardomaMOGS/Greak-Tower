"use strict";

/* =========================================================
   GREAK TOWER V0.2
   MULTIPLE TOWERS UPDATE
   ========================================================= */

const GAME = {
    coins: 100,
    baseHealth: 100,
    wave: 1,

    waveRunning: false,
    gameOver: false,

    enemiesToSpawn: 0,
    enemiesSpawned: 0,
    spawnTimer: 0,

    towerMode: false,
    selectedTower: null
};

let scene;
let camera;
let renderer;
let raycaster;
let mouse;
let placementPlane;

const enemies = [];
const towers = [];
const projectiles = [];

/* =========================================================
   TOWER TYPES
   ========================================================= */

const TOWER_TYPES = {

    archer: {
        name: "Archer",
        emoji: "🏹",
        cost: 50,
        range: 7,
        damage: 20,
        fireRate: 0.45,
        projectileSpeed: 18,
        projectileSize: 0.18,

        baseColor: 0x2196f3,
        topColor: 0x4fc3f7,
        barrelColor: 0x263238,
        projectileColor: 0xffeb3b
    },

    cannon: {
        name: "Cannon",
        emoji: "💥",
        cost: 100,
        range: 6.5,
        damage: 55,
        fireRate: 1.5,
        projectileSpeed: 11,
        projectileSize: 0.32,

        baseColor: 0x424242,
        topColor: 0x757575,
        barrelColor: 0x212121,
        projectileColor: 0xff5722
    },

    magic: {
        name: "Magic",
        emoji: "🔮",
        cost: 150,
        range: 10,
        damage: 40,
        fireRate: 0.8,
        projectileSpeed: 15,
        projectileSize: 0.25,

        baseColor: 0x673ab7,
        topColor: 0xab47bc,
        barrelColor: 0x7e57c2,
        projectileColor: 0xe040fb
    }
};

/* =========================================================
   PATH
   ========================================================= */

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

/* =========================================================
   START GAME
   ========================================================= */

function startGame() {

    if (typeof THREE === "undefined") {
        showMessage("Three.js failed to load.");
        return;
    }

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    camera.position.set(0, 28, 27);
    camera.lookAt(0, 0, 0);

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

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    placementPlane = new THREE.Plane(
        new THREE.Vector3(0, 1, 0),
        0
    );

    createLights();
    createGround();
    createPath();
    createTrees();
    createBase();

    setupButtons();
    updateUI();

    renderer.domElement.addEventListener(
        "click",
        handleMapClick
    );

    window.addEventListener(
        "resize",
        handleResize
    );

    animate();

    console.log("GREAK TOWER V0.2 started");
}

/* =========================================================
   LIGHTS
   ========================================================= */

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

/* =========================================================
   GROUND
   ========================================================= */

function createGround() {

    const ground = new THREE.Mesh(
        new THREE.BoxGeometry(
            34,
            1,
            26
        ),
        new THREE.MeshStandardMaterial({
            color: 0x4caf50
        })
    );

    ground.position.y = -0.5;
    ground.receiveShadow = true;

    scene.add(ground);
}

/* =========================================================
   PATH
   ========================================================= */

function createPath() {

    const material =
        new THREE.MeshStandardMaterial({
            color: 0xd8b36a
        });

    for (
        let i = 0;
        i < pathPoints.length - 1;
        i++
    ) {

        const a = pathPoints[i];
        const b = pathPoints[i + 1];

        const dx = b.x - a.x;
        const dz = b.z - a.z;

        const length = Math.sqrt(
            dx * dx + dz * dz
        );

        const horizontal =
            Math.abs(dx) > Math.abs(dz);

        const geometry =
            new THREE.BoxGeometry(
                horizontal ? length : 3.5,
                0.15,
                horizontal ? 3.5 : length
            );

        const part = new THREE.Mesh(
            geometry,
            material
        );

        part.position.set(
            (a.x + b.x) / 2,
            0.08,
            (a.z + b.z) / 2
        );

        scene.add(part);
    }
}

/* =========================================================
   TREES
   ========================================================= */

function createTrees() {

    const positions = [
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

    for (const [x, z] of positions) {

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

        trunk.position.set(x, 1, z);
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

/* =========================================================
   BASE
   ========================================================= */

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

/* =========================================================
   BUTTON SETUP
   ========================================================= */

function setupButtons() {

    document.getElementById(
        "startWave"
    ).onclick = startWave;

    document.getElementById(
        "towerButton"
    ).onclick = openTowerMenu;
}

/* =========================================================
   TOWER MENU
   ========================================================= */

function openTowerMenu() {

    if (GAME.gameOver)
        return;

    const oldMenu =
        document.getElementById(
            "towerMenu"
        );

    if (oldMenu) {
        oldMenu.remove();
        return;
    }

    const menu =
        document.createElement("div");

    menu.id = "towerMenu";

    menu.style.position = "fixed";
    menu.style.left = "50%";
    menu.style.bottom = "95px";
    menu.style.transform = "translateX(-50%)";

    menu.style.display = "flex";
    menu.style.gap = "10px";
    menu.style.padding = "12px";

    menu.style.background =
        "rgba(20,20,30,0.95)";

    menu.style.border =
        "2px solid rgba(255,255,255,0.2)";

    menu.style.borderRadius = "14px";

    menu.style.zIndex = "1000";

    for (const key of Object.keys(TOWER_TYPES)) {

        const type =
            TOWER_TYPES[key];

        const button =
            document.createElement("button");

        button.textContent =
            `${type.emoji} ${type.name} - ${type.cost}`;

        button.style.padding = "10px 14px";
        button.style.border = "none";
        button.style.borderRadius = "10px";
        button.style.cursor = "pointer";
        button.style.fontWeight = "bold";

        button.onclick = function () {

            GAME.selectedTower = key;
            GAME.towerMode = true;

            menu.remove();

            document.getElementById(
                "towerButton"
            ).textContent =
                "❌ CANCEL";

            showMessage(
                `${type.emoji} ${type.name} selected — click the map to place it.`
            );
        };

        menu.appendChild(button);
    }

    document.body.appendChild(menu);
}

/* =========================================================
   MAP CLICK
   ========================================================= */

function handleMapClick(event) {

    if (
        !GAME.towerMode ||
        GAME.gameOver ||
        !GAME.selectedTower
    ) {
        return;
    }

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

    if (
        !raycaster.ray.intersectPlane(
            placementPlane,
            position
        )
    ) {

        showMessage(
            "Invalid location."
        );

        return;
    }

    placeTower(
        position.x,
        position.z
    );
}

/* =========================================================
   PLACE TOWER
   ========================================================= */

function placeTower(x, z) {

    const type =
        TOWER_TYPES[
            GAME.selectedTower
        ];

    if (!type)
        return;

    if (
        x < -16 ||
        x > 16 ||
        z < -12 ||
        z > 12
    ) {

        showMessage(
            "You cannot build there."
        );

        return;
    }

    if (isOnPath(x, z)) {

        showMessage(
            "You cannot build on the path."
        );

        return;
    }

    if (
        Math.hypot(
            x - 15,
            z - 9
        ) < 3
    ) {

        showMessage(
            "You cannot build near the base."
        );

        return;
    }

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

    if (GAME.coins < type.cost) {

        showMessage(
            `You need ${type.cost} coins.`
        );

        return;
    }

    towers.push(
        createTower(
            x,
            z,
            type
        )
    );

    GAME.coins -= type.cost;

    GAME.towerMode = false;
    GAME.selectedTower = null;

    document.getElementById(
        "towerButton"
    ).textContent = "🏰 TOWER";

    updateUI();

    showMessage(
        `${type.emoji} ${type.name} tower placed!`
    );
}

/* =========================================================
   PATH CHECK
   ========================================================= */

function isOnPath(x, z) {

    const width = 2.4;

    for (
        let i = 0;
        i < pathPoints.length - 1;
        i++
    ) {

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

/* =========================================================
   CREATE TOWER
   ========================================================= */

function createTower(x, z, type) {

    const group =
        new THREE.Group();

    /* Tower base */

    const base = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.7,
            1.8,
            1.7
        ),
        new THREE.MeshStandardMaterial({
            color: type.baseColor
        })
    );

    base.position.y = 0.9;
    base.castShadow = true;

    group.add(base);

    /* Rotating turret */

    const turret =
        new THREE.Group();

    turret.position.y = 1.8;

    group.add(turret);

    /* Turret top */

    const top = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.3,
            0.9,
            1.3
        ),
        new THREE.MeshStandardMaterial({
            color: type.topColor
        })
    );

    top.position.y = 0.45;
    top.castShadow = true;

    turret.add(top);

    /* Barrel */

    const barrel = new THREE.Mesh(
        new THREE.BoxGeometry(
            type === TOWER_TYPES.cannon
                ? 0.55
                : 0.35,

            type === TOWER_TYPES.cannon
                ? 0.55
                : 0.35,

            type === TOWER_TYPES.cannon
                ? 1.8
                : 1.5
        ),

        new THREE.MeshStandardMaterial({
            color: type.barrelColor
        })
    );

    barrel.position.set(
        0,
        0.45,
        type === TOWER_TYPES.cannon
            ? -0.95
            : -0.85
    );

    barrel.castShadow = true;

    turret.add(barrel);

    /* Magic crystal */

    if (type === TOWER_TYPES.magic) {

        const crystal = new THREE.Mesh(
            new THREE.OctahedronGeometry(
                0.35
            ),
            new THREE.MeshStandardMaterial({
                color: 0xe040fb,
                emissive: 0x7b1fa2,
                emissiveIntensity: 0.5
            })
        );

        crystal.position.y = 1;

        turret.add(crystal);
    }

    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);

    return {

        mesh: group,

        turret: turret,

        type: type,

        range: type.range,

        damage: type.damage,

        fireRate: type.fireRate,

        projectileSpeed:
            type.projectileSpeed,

        projectileSize:
            type.projectileSize,

        projectileColor:
            type.projectileColor,

        cooldown: 0,

        target: null
    };
}

/* =========================================================
   START WAVE
   ========================================================= */

function startWave() {

    if (GAME.gameOver)
        return;

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
        "Wave " +
        GAME.wave +
        " started!"
    );
}

/* =========================================================
   ENEMY MODEL
   ========================================================= */

function createEnemyModel() {

    const enemy =
        new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.55,
            0.65,
            1.25,
            8
        ),
        new THREE.MeshStandardMaterial({
            color: 0xe53935
        })
    );

    body.position.y = 1.25;
    body.castShadow = true;

    enemy.add(body);

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(
            0.55,
            12,
            8
        ),
        new THREE.MeshStandardMaterial({
            color: 0xff7043
        })
    );

    head.position.y = 2.25;
    head.castShadow = true;

    enemy.add(head);

    const eyeMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x111111
        });

    const leftEye = new THREE.Mesh(
        new THREE.SphereGeometry(
            0.09,
            8,
            8
        ),
        eyeMaterial
    );

    leftEye.position.set(
        -0.2,
        2.32,
        -0.48
    );

    enemy.add(leftEye);

    const rightEye = new THREE.Mesh(
        new THREE.SphereGeometry(
            0.09,
            8,
            8
        ),
        eyeMaterial
    );

    rightEye.position.set(
        0.2,
        2.32,
        -0.48
    );

    enemy.add(rightEye);

    const armMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xe53935
        });

    const leftArm = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.16,
            0.16,
            1,
            8
        ),
        armMaterial
    );

    leftArm.position.set(
        -0.75,
        1.3,
        0
    );

    leftArm.rotation.z = -0.25;

    enemy.add(leftArm);

    const rightArm = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.16,
            0.16,
            1,
            8
        ),
        armMaterial
    );

    rightArm.position.set(
        0.75,
        1.3,
        0
    );

    rightArm.rotation.z = 0.25;

    enemy.add(rightArm);

    const legMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x8e24aa
        });

    const leftLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.18,
            0.18,
            0.9,
            8
        ),
        legMaterial
    );

    leftLeg.position.set(
        -0.3,
        0.45,
        0
    );

    enemy.add(leftLeg);

    const rightLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.18,
            0.18,
            0.9,
            8
        ),
        legMaterial
    );

    rightLeg.position.set(
        0.3,
        0.45,
        0
    );

    enemy.add(rightLeg);

    return enemy;
}

/* =========================================================
   SPAWN ENEMY
   ========================================================= */

function spawnEnemy() {

    const mesh =
        createEnemyModel();

    mesh.position.copy(
        pathPoints[0]
    );

    scene.add(mesh);

    enemies.push({

        mesh: mesh,

        pathIndex: 0,

        health: 100,
        maxHealth: 100,

        speed:
            2.2 +
            GAME.wave * 0.05,

        reward: 10
    });
}

/* =========================================================
   UPDATE ENEMIES
   ========================================================= */

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

            if (
                GAME.baseHealth <= 0
            ) {

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
                0,
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

        if (
            direction.lengthSq() > 0
        ) {

            enemy.mesh.rotation.y =
                Math.atan2(
                    direction.x,
                    direction.z
                );
        }
    }
}

/* =========================================================
   UPDATE TOWERS
   ========================================================= */

function updateTowers(delta) {

    for (const tower of towers) {

        tower.cooldown -= delta;

        let closest = null;
        let closestDistance =
            Infinity;

        for (const enemy of enemies) {

            const dx =
                enemy.mesh.position.x -
                tower.mesh.position.x;

            const dz =
                enemy.mesh.position.z -
                tower.mesh.position.z;

            const distance =
                Math.sqrt(
                    dx * dx +
                    dz * dz
                );

            if (
                distance <= tower.range &&
                distance < closestDistance
            ) {

                closest = enemy;
                closestDistance = distance;
            }
        }

        tower.target = closest;

        if (closest) {

            const dx =
                closest.mesh.position.x -
                tower.mesh.position.x;

            const dz =
                closest.mesh.position.z -
                tower.mesh.position.z;

            const desiredRotation =
                Math.atan2(
                    dx,
                    -dz
                );

            let difference =
                desiredRotation -
                tower.turret.rotation.y;

            while (
                difference > Math.PI
            ) {
                difference -=
                    Math.PI * 2;
            }

            while (
                difference < -Math.PI
            ) {
                difference +=
                    Math.PI * 2;
            }

            tower.turret.rotation.y +=
                difference *
                Math.min(
                    1,
                    delta * 8
                );

            if (
                tower.cooldown <= 0
            ) {

                fireProjectile(
                    tower,
                    closest
                );

                tower.cooldown =
                    tower.fireRate;
            }
        }
    }
}

/* =========================================================
   FIRE PROJECTILE
   ========================================================= */

function fireProjectile(
    tower,
    enemy
) {

    const projectile =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                tower.projectileSize,
                12,
                12
            ),
            new THREE.MeshStandardMaterial({
                color:
                    tower.projectileColor,
                emissive:
                    tower.projectileColor,
                emissiveIntensity:
                    0.25
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

        speed:
            tower.projectileSpeed
    });
}

/* =========================================================
   UPDATE PROJECTILES
   ========================================================= */

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

            projectiles.splice(
                i,
                1
            );

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

            projectiles.splice(
                i,
                1
            );

            if (
                target.health <= 0
            ) {

                destroyEnemy(
                    target
                );
            }

        } else {

            direction.normalize();

            projectile.mesh.position.add(
                direction.multiplyScalar(
                    projectile.speed *
                    delta
                )
            );
        }
    }
}

/* =========================================================
   DESTROY ENEMY
   ========================================================= */

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

    GAME.coins +=
        enemy.reward;

    updateUI();
}

/* =========================================================
   WAVE UPDATE
   ========================================================= */

function updateWave(delta) {

    if (!GAME.waveRunning)
        return;

    GAME.spawnTimer -= delta;

    if (
        GAME.enemiesSpawned <
        GAME.enemiesToSpawn
    ) {

        if (
            GAME.spawnTimer <= 0
        ) {

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

/* =========================================================
   FINISH WAVE
   ========================================================= */

function finishWave() {

    GAME.waveRunning = false;

    GAME.coins += 25;
    GAME.wave++;

    updateUI();

    showMessage(
        "Wave complete! +25 coins"
    );
}

/* =========================================================
   GAME OVER
   ========================================================= */

function gameOver() {

    if (GAME.gameOver)
        return;

    GAME.gameOver = true;
    GAME.waveRunning = false;
    GAME.towerMode = false;
    GAME.selectedTower = null;

    const menu =
        document.getElementById(
            "towerMenu"
        );

    if (menu)
        menu.remove();

    document.getElementById(
        "towerButton"
    ).textContent = "🏰 TOWER";

    showMessage(
        "GAME OVER — Refresh to play again."
    );
}

/* =========================================================
   UI
   ========================================================= */

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

/* =========================================================
   MESSAGE
   ========================================================= */

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

/* =========================================================
   RESIZE
   ========================================================= */

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

/* =========================================================
   MAIN LOOP
   ========================================================= */

let lastTime =
    performance.now();

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

/* =========================================================
   START
   ========================================================= */

startGame();
