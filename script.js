"use strict";

/* =========================================================
   GREAK TOWER V0.4
   Tower Upgrades + Selection + Selling
   ========================================================= */

const GAME = {
    coins: 100,
    baseHealth: 100,
    wave: 1,

    waveRunning: false,
    gameOver: false,

    spawnQueue: [],
    spawnIndex: 0,
    spawnTimer: 0,

    towerMode: false,
    selectedTowerType: null,
    selectedTower: null
};


/* =========================================================
   THREE.JS
========================================================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(0, 28, 27);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
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

document
    .getElementById("game")
    .appendChild(renderer.domElement);


/* =========================================================
   LIGHTING
========================================================= */

scene.add(
    new THREE.AmbientLight(
        0xffffff,
        0.7
    )
);

const sun = new THREE.DirectionalLight(
    0xffffff,
    1.1
);

sun.position.set(
    10,
    25,
    10
);

sun.castShadow = true;

scene.add(sun);


/* =========================================================
   ARRAYS
========================================================= */

const towers = [];
const enemies = [];
const projectiles = [];


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
   ENEMY TYPES
========================================================= */

const ENEMY_TYPES = {

    basic: {
        name: "Basic",
        health: 100,
        speed: 2.2,
        reward: 10,
        scale: 1,
        body: 0xe53935,
        head: 0xff7043
    },

    fast: {
        name: "Fast",
        health: 60,
        speed: 4.2,
        reward: 15,
        scale: 0.82,
        body: 0x00a86b,
        head: 0x00e676
    },

    tank: {
        name: "Tank",
        health: 300,
        speed: 1.15,
        reward: 30,
        scale: 1.35,
        body: 0x4a148c,
        head: 0x7b1fa2
    },

    boss: {
        name: "Boss",
        health: 1000,
        speed: 0.85,
        reward: 100,
        scale: 1.8,
        body: 0x7f0000,
        head: 0xd32f2f
    }
};


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

        base: 0x2196f3,
        top: 0x4fc3f7,
        barrel: 0x263238,
        projectile: 0xffeb3b
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

        base: 0x424242,
        top: 0x757575,
        barrel: 0x212121,
        projectile: 0xff5722
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

        base: 0x673ab7,
        top: 0xab47bc,
        barrel: 0x7e57c2,
        projectile: 0xe040fb
    }
};


/* =========================================================
   UPGRADE SYSTEM
========================================================= */

const UPGRADE_COSTS = {

    archer: [
        0,
        75,
        125
    ],

    cannon: [
        0,
        125,
        200
    ],

    magic: [
        0,
        175,
        275
    ]
};


const UPGRADE_MULTIPLIERS = {

    1: {
        damage: 1,
        range: 1,
        fireRate: 1
    },

    2: {
        damage: 1.5,
        range: 1.15,
        fireRate: 0.82
    },

    3: {
        damage: 2.2,
        range: 1.3,
        fireRate: 0.68
    }
};


/* =========================================================
   GROUND
========================================================= */

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


/* =========================================================
   PATH
========================================================= */

const pathMaterial =
    new THREE.MeshStandardMaterial({
        color: 0xd7b98e
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

    const path = new THREE.Mesh(

        new THREE.BoxGeometry(
            Math.abs(dx) || 3.5,
            0.15,
            Math.abs(dz) || 3.5
        ),

        pathMaterial
    );

    path.position.set(
        (a.x + b.x) / 2,
        0.05,
        (a.z + b.z) / 2
    );


    if (
        Math.abs(dx) >
        Math.abs(dz)
    ) {

        path.scale.z =
            3.5 /
            path.geometry.parameters.depth;

    } else {

        path.scale.x =
            3.5 /
            path.geometry.parameters.width;
    }


    scene.add(path);
}


/* =========================================================
   TREES
========================================================= */

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


function createTree(x, z) {

    const tree =
        new THREE.Group();


    const trunk =
        new THREE.Mesh(

            new THREE.CylinderGeometry(
                0.35,
                0.45,
                2,
                6
            ),

            new THREE.MeshStandardMaterial({
                color: 0x795548
            })
        );

    trunk.position.y = 1;


    const leaves =
        new THREE.Mesh(

            new THREE.ConeGeometry(
                1.5,
                3,
                7
            ),

            new THREE.MeshStandardMaterial({
                color: 0x1b5e20
            })
        );

    leaves.position.y = 3;


    tree.add(
        trunk,
        leaves
    );

    tree.position.set(
        x,
        0,
        z
    );


    scene.add(tree);
}


treePositions.forEach(
    position => {

        createTree(
            position[0],
            position[1]
        );

    }
);


/* =========================================================
   BASE
========================================================= */

const base =
    new THREE.Group();


const baseBody =
    new THREE.Mesh(

        new THREE.BoxGeometry(
            3,
            3,
            3
        ),

        new THREE.MeshStandardMaterial({
            color: 0x673ab7
        })
    );

baseBody.position.y = 1.5;


const roof =
    new THREE.Mesh(

        new THREE.ConeGeometry(
            2.2,
            2.5,
            4
        ),

        new THREE.MeshStandardMaterial({
            color: 0xff9800
        })
    );

roof.position.y = 4.2;
roof.rotation.y =
    Math.PI / 4;


base.add(
    baseBody,
    roof
);

base.position.set(
    15,
    0,
    9
);

scene.add(base);


/* =========================================================
   HEALTH BARS
========================================================= */

function createHealthBar(
    width = 1.7,
    height = 0.2
) {

    const group =
        new THREE.Group();


    const background =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                width,
                height,
                0.08
            ),

            new THREE.MeshBasicMaterial({
                color: 0x222222
            })
        );


    const fill =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                width - 0.04,
                height - 0.04,
                0.1
            ),

            new THREE.MeshBasicMaterial({
                color: 0x32cd32
            })
        );


    fill.position.z = 0.05;


    group.add(
        background,
        fill
    );


    group.userData = {
        fill,
        width: width - 0.04
    };


    return group;
}


function updateHealthBar(enemy) {

    if (!enemy.healthBar) {
        return;
    }


    const ratio =
        Math.max(
            0,
            Math.min(
                1,
                enemy.health /
                enemy.maxHealth
            )
        );


    const fill =
        enemy.healthBar.userData.fill;


    const width =
        enemy.healthBar.userData.width;


    fill.scale.x =
        ratio;


    fill.position.x =
        -(width * (1 - ratio)) / 2;


    if (ratio > 0.5) {

        fill.material.color.set(
            0x32cd32
        );

    } else if (ratio > 0.25) {

        fill.material.color.set(
            0xffd600
        );

    } else {

        fill.material.color.set(
            0xf44336
        );
    }


    enemy.healthBar.position.set(

        enemy.mesh.position.x,

        enemy.mesh.position.y +
            enemy.barHeight,

        enemy.mesh.position.z
    );


    enemy.healthBar.lookAt(
        camera.position
    );
}


/* =========================================================
   BOSS BAR
========================================================= */

let bossBar = null;
let bossFill = null;
let bossName = null;


function createBossUI() {

    if (bossBar) {
        return;
    }


    bossBar =
        document.createElement("div");


    Object.assign(
        bossBar.style,
        {
            position: "fixed",
            top: "75px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(500px, 80vw)",
            padding: "8px",
            background: "rgba(0,0,0,0.75)",
            border: "2px solid #ffca28",
            borderRadius: "10px",
            zIndex: "20",
            display: "none",
            boxSizing: "border-box",
            textAlign: "center",
            fontFamily: "Arial, sans-serif"
        }
    );


    bossName =
        document.createElement("div");


    bossName.textContent =
        "👑 BOSS";


    Object.assign(
        bossName.style,
        {
            color: "#ffd54f",
            fontWeight: "bold",
            marginBottom: "5px"
        }
    );


    const outer =
        document.createElement("div");


    Object.assign(
        outer.style,
        {
            height: "18px",
            background: "#330000",
            borderRadius: "9px",
            overflow: "hidden"
        }
    );


    bossFill =
        document.createElement("div");


    Object.assign(
        bossFill.style,
        {
            width: "100%",
            height: "100%",
            background: "#e53935"
        }
    );


    outer.appendChild(
        bossFill
    );


    bossBar.append(
        bossName,
        outer
    );


    document.body.appendChild(
        bossBar
    );
}


function showBoss(enemy) {

    createBossUI();

    bossBar.style.display =
        "block";

    updateBoss(enemy);
}


function updateBoss(enemy) {

    if (!bossFill) {
        return;
    }


    const ratio =
        Math.max(
            0,
            Math.min(
                1,
                enemy.health /
                enemy.maxHealth
            )
        );


    bossFill.style.width =
        `${ratio * 100}%`;


    bossName.textContent =
        `👑 BOSS — ${Math.max(
            0,
            Math.ceil(enemy.health)
        )} HP`;
}


function hideBoss() {

    if (bossBar) {
        bossBar.style.display =
            "none";
    }
}


/* =========================================================
   ENEMY MODEL
========================================================= */

function createEnemyModel(
    typeKey
) {

    const type =
        ENEMY_TYPES[typeKey];


    const enemy =
        new THREE.Group();


    const body =
        new THREE.Mesh(

            new THREE.CylinderGeometry(
                0.65,
                0.75,
                1.4,
                8
            ),

            new THREE.MeshStandardMaterial({
                color: type.body
            })
        );

    body.position.y =
        1.25;


    const head =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.55,
                10,
                10
            ),

            new THREE.MeshStandardMaterial({
                color: type.head
            })
        );

    head.position.y =
        2.25;


    const eyeMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x111111
        });


    const leftEye =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.13,
                0.18,
                0.08
            ),

            eyeMaterial
        );


    leftEye.position.set(
        -0.2,
        2.3,
        -0.48
    );


    const rightEye =
        leftEye.clone();


    rightEye.position.x =
        0.2;


    const armGeometry =
        new THREE.CylinderGeometry(
            0.16,
            0.16,
            1.1,
            6
        );


    const leftArm =
        new THREE.Mesh(
            armGeometry,
            new THREE.MeshStandardMaterial({
                color: type.body
            })
        );


    leftArm.position.set(
        -0.8,
        1.25,
        0
    );


    leftArm.rotation.z =
        -0.25;


    const rightArm =
        leftArm.clone();


    rightArm.position.x =
        0.8;


    rightArm.rotation.z =
        0.25;


    const legGeometry =
        new THREE.CylinderGeometry(
            0.18,
            0.18,
            0.9,
            6
        );


    const leftLeg =
        new THREE.Mesh(
            legGeometry,
            new THREE.MeshStandardMaterial({
                color: 0x263238
            })
        );


    leftLeg.position.set(
        -0.3,
        0.45,
        0
    );


    const rightLeg =
        leftLeg.clone();


    rightLeg.position.x =
        0.3;


    enemy.add(
        body,
        head,
        leftEye,
        rightEye,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg
    );


    /* FAST */

    if (typeKey === "fast") {

        const fin =
            new THREE.Mesh(

                new THREE.ConeGeometry(
                    0.25,
                    0.7,
                    5
                ),

                new THREE.MeshStandardMaterial({
                    color: 0x00ffff
                })
            );


        fin.rotation.z =
            Math.PI / 2;

        fin.position.y =
            1.7;


        enemy.add(fin);
    }


    /* TANK */

    if (typeKey === "tank") {

        const armor =
            new THREE.Mesh(

                new THREE.BoxGeometry(
                    1.8,
                    1.4,
                    1.8
                ),

                new THREE.MeshStandardMaterial({
                    color: 0x311b92,
                    transparent: true,
                    opacity: 0.75
                })
            );


        armor.position.y =
            1.35;


        enemy.add(armor);
    }


    /* BOSS */

    if (typeKey === "boss") {

        const crown =
            new THREE.Mesh(

                new THREE.ConeGeometry(
                    0.7,
                    0.8,
                    5
                ),

                new THREE.MeshStandardMaterial({
                    color: 0xffd600,
                    emissive: 0x8a6500
                })
            );


        crown.position.y =
            3.05;


        enemy.add(crown);
    }


    enemy.scale.setScalar(
        type.scale
    );


    enemy.traverse(
        object => {

            if (object.isMesh) {
                object.castShadow = true;
            }

        }
    );


    return enemy;
}


/* =========================================================
   WAVES
========================================================= */

function buildWaveQueue(wave) {

    const queue = [];

    const amount =
        4 + wave * 2;


    for (
        let i = 0;
        i < amount;
        i++
    ) {

        if (wave >= 4) {

            if (i % 5 === 0) {
                queue.push("tank");

            } else if (i % 3 === 0) {
                queue.push("fast");

            } else {
                queue.push("basic");
            }

        } else if (wave === 3) {

            if (i % 3 === 0) {
                queue.push("tank");

            } else if (i % 2 === 0) {
                queue.push("fast");

            } else {
                queue.push("basic");
            }

        } else if (wave === 2) {

            if (i % 3 === 0) {
                queue.push("fast");

            } else {
                queue.push("basic");
            }

        } else {

            queue.push("basic");
        }
    }


    if (wave % 5 === 0) {
        queue.push("boss");
    }


    return queue;
}


/* =========================================================
   CREATE ENEMY
========================================================= */

function createEnemy(
    typeKey
) {

    const type =
        ENEMY_TYPES[typeKey];


    const mesh =
        createEnemyModel(
            typeKey
        );


    mesh.position.copy(
        pathPoints[0]
    );


    mesh.position.y = 0;


    scene.add(mesh);


    const healthBar =
        createHealthBar(
            typeKey === "boss"
                ? 2.7
                : 1.7,

            typeKey === "boss"
                ? 0.28
                : 0.2
        );


    scene.add(
        healthBar
    );


    const enemy = {

        mesh,

        type: typeKey,

        health: type.health,

        maxHealth: type.health,

        speed:
            type.speed +
            (
                typeKey === "boss"
                    ? 0
                    : Math.min(
                        (GAME.wave - 1) * 0.03,
                        0.6
                    )
            ),

        reward: type.reward,

        pathIndex: 0,

        healthBar,

        barHeight:
            typeKey === "boss"
                ? 6
                : 3.6 * type.scale
    };


    enemies.push(
        enemy
    );


    updateHealthBar(
        enemy
    );


    if (typeKey === "boss") {
        showBoss(enemy);
    }
}


/* =========================================================
   START WAVE
========================================================= */

function startWave() {

    if (
        GAME.waveRunning ||
        GAME.gameOver
    ) {
        return;
    }


    GAME.spawnQueue =
        buildWaveQueue(
            GAME.wave
        );


    GAME.spawnIndex = 0;

    GAME.spawnTimer = 0;

    GAME.waveRunning = true;


    updateUI();


    showMessage(
        `🌊 Wave ${GAME.wave} started!`
    );
}


/* =========================================================
   SPAWNING
========================================================= */

function updateSpawning(
    delta
) {

    if (
        !GAME.waveRunning
    ) {
        return;
    }


    if (
        GAME.spawnIndex >=
        GAME.spawnQueue.length
    ) {
        return;
    }


    GAME.spawnTimer -=
        delta;


    if (
        GAME.spawnTimer <= 0
    ) {

        const type =
            GAME.spawnQueue[
                GAME.spawnIndex
            ];


        GAME.spawnIndex++;


        createEnemy(
            type
        );


        GAME.spawnTimer =
            type === "boss"
                ? 2
                : Math.max(
                    0.35,
                    0.8 -
                    GAME.wave * 0.015
                );
    }
}


/* =========================================================
   ENEMY MOVEMENT
========================================================= */

function updateEnemies(
    delta
) {

    for (
        let i = enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy =
            enemies[i];


        const target =
            pathPoints[
                enemy.pathIndex + 1
            ];


        if (!target) {

            reachBase(
                enemy,
                i
            );

            continue;
        }


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
            distance < 0.2
        ) {

            enemy.pathIndex++;

            continue;
        }


        direction.normalize();


        enemy.mesh.position.x +=
            direction.x *
            enemy.speed *
            delta;


        enemy.mesh.position.z +=
            direction.z *
            enemy.speed *
            delta;


        enemy.mesh.rotation.y =
            Math.atan2(
                direction.x,
                -direction.z
            );


        updateHealthBar(
            enemy
        );


        if (
            enemy.type === "boss"
        ) {

            updateBoss(
                enemy
            );
        }
    }
}


/* =========================================================
   BASE DAMAGE
========================================================= */

function reachBase(
    enemy,
    index
) {

    scene.remove(
        enemy.mesh
    );

    scene.remove(
        enemy.healthBar
    );


    enemies.splice(
        index,
        1
    );


    if (
        enemy.type === "boss"
    ) {

        hideBoss();

        GAME.baseHealth -=
            40;

        showMessage(
            "👑 BOSS REACHED THE BASE! -40 HP"
        );

    } else if (
        enemy.type === "tank"
    ) {

        GAME.baseHealth -=
            20;

    } else {

        GAME.baseHealth -=
            10;
    }


    GAME.baseHealth =
        Math.max(
            0,
            GAME.baseHealth
        );


    updateUI();


    if (
        GAME.baseHealth <= 0
    ) {

        gameOver();
    }
}


/* =========================================================
   TOWER STATS
========================================================= */

function updateTowerStats(
    tower
) {

    const base =
        TOWER_TYPES[
            tower.type
        ];


    const multiplier =
        UPGRADE_MULTIPLIERS[
            tower.level
        ];


    tower.damage =
        base.damage *
        multiplier.damage;


    tower.range =
        base.range *
        multiplier.range;


    tower.fireRate =
        base.fireRate *
        multiplier.fireRate;


    tower.projectileSpeed =
        base.projectileSpeed;
}


/* =========================================================
   CREATE TOWER
========================================================= */

function createTower(
    x,
    z,
    typeKey
) {

    const type =
        TOWER_TYPES[
            typeKey
        ];


    const group =
        new THREE.Group();


    const baseMesh =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                1.7,
                1.8,
                1.7
            ),

            new THREE.MeshStandardMaterial({
                color: type.base
            })
        );


    baseMesh.position.y =
        0.9;


    const turret =
        new THREE.Group();


    turret.position.y =
        1.8;


    const top =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                1.3,
                0.9,
                1.3
            ),

            new THREE.MeshStandardMaterial({
                color: type.top
            })
        );


    top.position.y =
        0.45;


    const length =
        typeKey === "cannon"
            ? 1.6
            : 1.25;


    const radius =
        typeKey === "cannon"
            ? 0.3
            : 0.14;


    const barrel =
        new THREE.Mesh(

            new THREE.CylinderGeometry(
                radius,
                radius,
                length,
                8
            ),

            new THREE.MeshStandardMaterial({
                color: type.barrel
            })
        );


    barrel.rotation.x =
        Math.PI / 2;


    barrel.position.z =
        -length / 2;


    turret.add(
        top,
        barrel
    );


    if (
        typeKey === "magic"
    ) {

        const crystal =
            new THREE.Mesh(

                new THREE.OctahedronGeometry(
                    0.35
                ),

                new THREE.MeshStandardMaterial({
                    color: 0xe040fb,
                    emissive: 0x6a0080
                })
            );


        crystal.position.y =
            1;


        turret.add(
            crystal
        );
    }


    group.add(
        baseMesh,
        turret
    );


    group.position.set(
        x,
        0,
        z
    );


    group.traverse(
        object => {

            if (object.isMesh) {
                object.castShadow = true;
            }

        }
    );


    scene.add(
        group
    );


    const tower = {

        mesh: group,

        turret,

        type: typeKey,

        level: 1,

        totalSpent: type.cost,

        target: null,

        cooldown: 0,

        damage: 0,

        range: 0,

        fireRate: 0,

        projectileSpeed:
            type.projectileSpeed,

        projectileSize:
            type.projectileSize,

        projectileColor:
            type.projectile
    };


    updateTowerStats(
        tower
    );


    towers.push(
        tower
    );


    GAME.coins -=
        type.cost;


    updateUI();


    showMessage(
        `${type.emoji} ${type.name} placed!`
    );


    selectTower(
        tower
    );
}


/* =========================================================
   TOWER PANEL
========================================================= */

let towerPanel = null;


function createTowerPanel() {

    if (towerPanel) {
        return;
    }


    towerPanel =
        document.createElement(
            "div"
        );


    Object.assign(
        towerPanel.style,
        {
            position: "fixed",
            right: "15px",
            bottom: "75px",
            width: "240px",
            padding: "12px",
            background: "rgba(0,0,0,0.88)",
            color: "white",
            borderRadius: "12px",
            zIndex: "30",
            fontFamily: "Arial, sans-serif",
            boxSizing: "border-box"
        }
    );


    document.body.appendChild(
        towerPanel
    );
}


function selectTower(
    tower
) {

    GAME.selectedTower =
        tower;


    createTowerPanel();

    renderTowerPanel();
}


function closeTowerPanel() {

    if (towerPanel) {

        towerPanel.remove();

        towerPanel = null;
    }


    GAME.selectedTower =
        null;
}


function renderTowerPanel() {

    if (
        !towerPanel ||
        !GAME.selectedTower
    ) {
        return;
    }


    const tower =
        GAME.selectedTower;


    const data =
        TOWER_TYPES[
            tower.type
        ];


    const upgradeCost =
        tower.level < 3
            ? UPGRADE_COSTS[
                tower.type
            ][tower.level]
            : null;


    towerPanel.innerHTML = "";


    const title =
        document.createElement(
            "div"
        );


    title.innerHTML =
        `${data.emoji} <b>${data.name}</b> — Level ${tower.level}`;


    title.style.fontSize =
        "18px";


    title.style.marginBottom =
        "8px";


    towerPanel.appendChild(
        title
    );


    const stats =
        document.createElement(
            "div"
        );


    stats.innerHTML = `
        💥 Damage: ${Math.round(tower.damage)}<br>
        📏 Range: ${tower.range.toFixed(1)}<br>
        ⚡ Fire Rate: ${tower.fireRate.toFixed(2)}s
    `;


    stats.style.lineHeight =
        "1.6";


    towerPanel.appendChild(
        stats
    );


    const upgrade =
        document.createElement(
            "button"
        );


    upgrade.textContent =
        upgradeCost
            ? `⬆️ Upgrade — ${upgradeCost} coins`
            : "⭐ MAX LEVEL";


    upgrade.disabled =
        !upgradeCost;


    Object.assign(
        upgrade.style,
        {
            width: "100%",
            padding: "9px",
            marginTop: "10px",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: upgradeCost
                ? "pointer"
                : "default"
        }
    );


    upgrade.onclick =
        upgradeTower;


    towerPanel.appendChild(
        upgrade
    );


    const sell =
        document.createElement(
            "button"
        );


    sell.textContent =
        `💰 Sell — ${Math.floor(
            tower.totalSpent * 0.6
        )} coins`;


    Object.assign(
        sell.style,
        {
            width: "100%",
            padding: "9px",
            marginTop: "6px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
        }
    );


    sell.onclick =
        sellTower;


    towerPanel.appendChild(
        sell
    );


    const close =
        document.createElement(
            "button"
        );


    close.textContent =
        "✖ Close";


    Object.assign(
        close.style,
        {
            width: "100%",
            padding: "7px",
            marginTop: "6px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
        }
    );


    close.onclick =
        closeTowerPanel;


    towerPanel.appendChild(
        close
    );
}


/* =========================================================
   UPGRADE TOWER
========================================================= */

function upgradeTower() {

    const tower =
        GAME.selectedTower;


    if (
        !tower ||
        tower.level >= 3
    ) {
        return;
    }


    const cost =
        UPGRADE_COSTS[
            tower.type
        ][tower.level];


    if (
        GAME.coins < cost
    ) {

        showMessage(
            "❌ Not enough coins!"
        );

        return;
    }


    GAME.coins -=
        cost;


    tower.totalSpent +=
        cost;


    tower.level++;


    updateTowerStats(
        tower
    );


    /*
     * Make upgraded towers
     * physically bigger.
     */

    tower.mesh.scale.setScalar(
        1 +
        0.08 *
        (tower.level - 1)
    );


    showMessage(
        `⭐ ${TOWER_TYPES[tower.type].name} upgraded to Level ${tower.level}!`
    );


    updateUI();

    renderTowerPanel();
}


/* =========================================================
   SELL TOWER
========================================================= */

function sellTower() {

    const tower =
        GAME.selectedTower;


    if (!tower) {
        return;
    }


    const refund =
        Math.floor(
            tower.totalSpent *
            0.6
        );


    GAME.coins +=
        refund;


    const index =
        towers.indexOf(
            tower
        );


    if (index >= 0) {

        towers.splice(
            index,
            1
        );
    }


    scene.remove(
        tower.mesh
    );


    closeTowerPanel();

    updateUI();


    showMessage(
        `💰 Tower sold for ${refund} coins!`
    );
}


/* =========================================================
   TARGETING
========================================================= */

function findTarget(
    tower
) {

    let bestTarget =
        null;

    let bestDistance =
        Infinity;


    for (
        const enemy of enemies
    ) {

        const distance =
            tower.mesh.position.distanceTo(
                enemy.mesh.position
            );


        if (
            distance <=
                tower.range &&
            distance <
                bestDistance
        ) {

            bestDistance =
                distance;

            bestTarget =
                enemy;
        }
    }


    return bestTarget;
}


/* =========================================================
   TOWER UPDATE
========================================================= */

function updateTowers(
    delta
) {

    for (
        const tower of towers
    ) {

        tower.cooldown -=
            delta;


        if (
            !tower.target ||
            !enemies.includes(
                tower.target
            ) ||
            tower.mesh.position.distanceTo(
                tower.target.mesh.position
            ) > tower.range
        ) {

            tower.target =
                findTarget(
                    tower
                );
        }


        if (
            !tower.target
        ) {
            continue;
        }


        const target =
            tower.target.mesh.position;


        const turretPosition =
            tower.turret.getWorldPosition(
                new THREE.Vector3()
            );


        const dx =
            target.x -
            turretPosition.x;


        const dz =
            target.z -
            turretPosition.z;


        const desiredAngle =
            Math.atan2(
                dx,
                -dz
            );


        let difference =
            desiredAngle -
            tower.turret.rotation.y;


        while (
            difference >
            Math.PI
        ) {

            difference -=
                Math.PI * 2;
        }


        while (
            difference <
            -Math.PI
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
                tower.target
            );


            tower.cooldown =
                tower.fireRate;
        }
    }
}


/* =========================================================
   PROJECTILES
========================================================= */

function fireProjectile(
    tower,
    target
) {

    const projectile =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                tower.projectileSize,
                10,
                10
            ),

            new THREE.MeshStandardMaterial({
                color:
                    tower.projectileColor,

                emissive:
                    tower.projectileColor,

                emissiveIntensity:
                    0.35
            })
        );


    projectile.position.copy(
        tower.turret.getWorldPosition(
            new THREE.Vector3()
        )
    );


    scene.add(
        projectile
    );


    projectiles.push({

        mesh: projectile,

        target,

        speed:
            tower.projectileSpeed,

        damage:
            tower.damage,

        type:
            tower.type
    });
}


/* =========================================================
   PROJECTILE UPDATE
========================================================= */

function updateProjectiles(
    delta
) {

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
            !enemies.includes(
                target
            )
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
            distance < 0.65
        ) {

            damageEnemy(
                target,
                projectile.damage,
                projectile.type
            );


            scene.remove(
                projectile.mesh
            );


            projectiles.splice(
                i,
                1
            );


            continue;
        }


        direction.normalize();


        projectile.mesh.position.add(
            direction.multiplyScalar(
                projectile.speed *
                delta
            )
        );
    }
}


/* =========================================================
   DAMAGE
========================================================= */

function damageEnemy(
    enemy,
    damage,
    towerType
) {

    let finalDamage =
        damage;


    if (
        towerType === "archer" &&
        enemy.type === "fast"
    ) {

        finalDamage *=
            1.25;
    }


    if (
        towerType === "cannon" &&
        enemy.type === "tank"
    ) {

        finalDamage *=
            1.35;
    }


    if (
        towerType === "magic" &&
        enemy.type === "boss"
    ) {

        finalDamage *=
            1.15;
    }


    enemy.health -=
        finalDamage;


    updateHealthBar(
        enemy
    );


    if (
        enemy.type === "boss"
    ) {

        updateBoss(
            enemy
        );
    }


    if (
        enemy.health <= 0
    ) {

        destroyEnemy(
            enemy
        );
    }
}


/* =========================================================
   DESTROY ENEMY
========================================================= */

function destroyEnemy(
    enemy
) {

    const index =
        enemies.indexOf(
            enemy
        );


    if (index === -1) {
        return;
    }


    GAME.coins +=
        enemy.reward;


    scene.remove(
        enemy.mesh
    );


    scene.remove(
        enemy.healthBar
    );


    enemies.splice(
        index,
        1
    );


    if (
        enemy.type === "boss"
    ) {

        hideBoss();


        showMessage(
            "👑 BOSS DEFEATED! +100 COINS!"
        );
    }


    updateUI();
}


/* =========================================================
   WAVE COMPLETE
========================================================= */

function checkWaveComplete() {

    if (
        !GAME.waveRunning
    ) {
        return;
    }


    if (
        GAME.spawnIndex >=
            GAME.spawnQueue.length &&
        enemies.length === 0
    ) {

        GAME.waveRunning =
            false;


        GAME.coins +=
            25;


        showMessage(
            `🎉 Wave ${GAME.wave} complete! +25 coins`
        );


        GAME.wave++;


        updateUI();
    }
}


/* =========================================================
   PATH CHECK
========================================================= */

function isOnPath(
    x,
    z
) {

    const width =
        2.4;


    for (
        let i = 0;
        i < pathPoints.length - 1;
        i++
    ) {

        const a =
            pathPoints[i];

        const b =
            pathPoints[i + 1];


        if (
            a.x === b.x
        ) {

            if (
                Math.abs(
                    x - a.x
                ) < width &&
                z >=
                    Math.min(
                        a.z,
                        b.z
                    ) - width &&
                z <=
                    Math.max(
                        a.z,
                        b.z
                    ) + width
            ) {

                return true;
            }

        } else {

            if (
                Math.abs(
                    z - a.z
                ) < width &&
                x >=
                    Math.min(
                        a.x,
                        b.x
                    ) - width &&
                x <=
                    Math.max(
                        a.x,
                        b.x
                    ) + width
            ) {

                return true;
            }
        }
    }


    return false;
}


/* =========================================================
   MOUSE / TOWER SELECTION
========================================================= */

const raycaster =
    new THREE.Raycaster();

const mouse =
    new THREE.Vector2();


renderer.domElement.addEventListener(
    "pointerdown",
    event => {

        const rect =
            renderer.domElement.getBoundingClientRect();


        mouse.x =
            (
                (event.clientX -
                    rect.left) /
                rect.width
            ) * 2 - 1;


        mouse.y =
            -(
                (
                    event.clientY -
                    rect.top
                ) /
                rect.height
            ) * 2 + 1;


        raycaster.setFromCamera(
            mouse,
            camera
        );


        /*
         * Check towers first.
         */

        const towerMeshes =
            towers.map(
                tower =>
                    tower.mesh
            );


        const hits =
            raycaster.intersectObjects(
                towerMeshes,
                true
            );


        if (
            hits.length > 0
        ) {

            let object =
                hits[0].object;


            while (
                object.parent &&
                !towers.some(
                    tower =>
                        tower.mesh ===
                        object
                )
            ) {

                object =
                    object.parent;
            }


            const tower =
                towers.find(
                    tower =>
                        tower.mesh ===
                        object
                );


            if (tower) {

                if (
                    GAME.towerMode
                ) {

                    cancelTowerMode();
                }


                selectTower(
                    tower
                );


                return;
            }
        }


        /*
         * Otherwise place a tower.
         */

        if (
            !GAME.towerMode ||
            GAME.gameOver
        ) {

            return;
        }


        const hit =
            raycaster.intersectObject(
                ground
            )[0];


        if (!hit) {
            return;
        }


        const x =
            hit.point.x;

        const z =
            hit.point.z;


        if (
            x < -16 ||
            x > 16 ||
            z < -12 ||
            z > 12
        ) {

            showMessage(
                "❌ Outside build area!"
            );

            return;
        }


        if (
            isOnPath(
                x,
                z
            )
        ) {

            showMessage(
                "❌ You cannot build on the path!"
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
                "❌ Too close to the base!"
            );

            return;
        }


        for (
            const tower of towers
        ) {

            const distance =
                tower.mesh.position.distanceTo(
                    new THREE.Vector3(
                        x,
                        0,
                        z
                    )
                );


            if (
                distance < 2.5
            ) {

                showMessage(
                    "❌ Towers are too close!"
                );

                return;
            }
        }


        const type =
            TOWER_TYPES[
                GAME.selectedTowerType
            ];


        if (
            GAME.coins <
            type.cost
        ) {

            showMessage(
                "❌ Not enough coins!"
            );

            return;
        }


        createTower(
            x,
            z,
            GAME.selectedTowerType
        );


        cancelTowerMode();
    }
);


/* =========================================================
   TOWER MENU
========================================================= */

let towerMenu = null;


function openTowerMenu() {

    if (towerMenu) {
        return;
    }


    towerMenu =
        document.createElement(
            "div"
        );


    Object.assign(
        towerMenu.style,
        {
            position: "fixed",
            bottom: "75px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "8px",
            padding: "10px",
            background: "rgba(0,0,0,0.8)",
            borderRadius: "12px",
            zIndex: "15",
            flexWrap: "wrap",
            justifyContent: "center"
        }
    );


    Object.entries(
        TOWER_TYPES
    ).forEach(
        ([key, tower]) => {

            const button =
                document.createElement(
                    "button"
                );


            button.textContent =
                `${tower.emoji} ${tower.name} - ${tower.cost}`;


            Object.assign(
                button.style,
                {
                    padding: "10px 14px",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold"
                }
            );


            button.onclick =
                () => {

                    if (
                        GAME.coins <
                        tower.cost
                    ) {

                        showMessage(
                            "❌ Not enough coins!"
                        );

                        return;
                    }


                    GAME.selectedTowerType =
                        key;


                    GAME.towerMode =
                        true;


                    document.getElementById(
                        "towerButton"
                    ).textContent =
                        "❌ CANCEL";


                    closeTowerMenu();


                    showMessage(
                        `Place your ${tower.name} tower!`
                    );
                };


            towerMenu.appendChild(
                button
            );
        }
    );


    document.body.appendChild(
        towerMenu
    );
}


function closeTowerMenu() {

    if (towerMenu) {

        towerMenu.remove();

        towerMenu = null;
    }
}


function cancelTowerMode() {

    GAME.towerMode =
        false;

    GAME.selectedTowerType =
        null;


    document.getElementById(
        "towerButton"
    ).textContent =
        "🏰 TOWER";


    closeTowerMenu();
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


let messageTimer = null;


function showMessage(
    text
) {

    const message =
        document.getElementById(
            "message"
        );


    message.textContent =
        text;


    message.style.opacity =
        "1";


    clearTimeout(
        messageTimer
    );


    messageTimer =
        setTimeout(
            () => {

                message.style.opacity =
                    "0";

            },
            1800
        );
}


/* =========================================================
   GAME OVER
========================================================= */

function gameOver() {

    GAME.gameOver =
        true;

    GAME.waveRunning =
        false;


    cancelTowerMode();

    closeTowerPanel();

    hideBoss();


    showMessage(
        "💀 GAME OVER — Refresh to play again."
    );
}


/* =========================================================
   BUTTONS
========================================================= */

document.getElementById(
    "startWave"
).addEventListener(
    "click",
    startWave
);


document.getElementById(
    "towerButton"
).addEventListener(
    "click",
    () => {

        if (
            GAME.gameOver
        ) {
            return;
        }


        if (
            GAME.towerMode
        ) {

            cancelTowerMode();

            return;
        }


        if (
            towerMenu
        ) {

            closeTowerMenu();

        } else {

            openTowerMenu();
        }
    }
);


/* =========================================================
   RESIZE
========================================================= */

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


/* =========================================================
   START
========================================================= */

createBossUI();

updateUI();


const clock =
    new THREE.Clock();


function animate() {

    requestAnimationFrame(
        animate
    );


    const delta =
        Math.min(
            clock.getDelta(),
            0.05
        );


    if (
        !GAME.gameOver
    ) {

        updateSpawning(
            delta
        );

        updateEnemies(
            delta
        );

        updateTowers(
            delta
        );

        updateProjectiles(
            delta
        );

        checkWaveComplete();
    }


    renderer.render(
        scene,
        camera
    );
}


animate();


showMessage(
    "🏰 GREAK TOWER V0.4!"
);
