"use strict";

/* =========================================================
   GREAK TOWER V0.3
   Enemy Variety + Health Bars + Bosses
   ========================================================= */

/* =========================
   GAME STATE
========================= */

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
    selectedTower: null
};


/* =========================
   THREE.JS
========================= */

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

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

document.getElementById("game").appendChild(renderer.domElement);


/* =========================
   LIGHTING
========================= */

const ambientLight = new THREE.AmbientLight(
    0xffffff,
    0.7
);

scene.add(ambientLight);

const sun = new THREE.DirectionalLight(
    0xffffff,
    1.1
);

sun.position.set(10, 25, 10);
sun.castShadow = true;

scene.add(sun);


/* =========================
   GAME ARRAYS
========================= */

const towers = [];
const enemies = [];
const projectiles = [];

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


/* =========================
   ENEMY TYPES
========================= */

const ENEMY_TYPES = {

    basic: {
        name: "Basic",
        emoji: "👾",
        health: 100,
        speed: 2.2,
        reward: 10,
        scale: 1,
        bodyColor: 0xe53935,
        headColor: 0xff7043
    },

    fast: {
        name: "Fast",
        emoji: "⚡",
        health: 60,
        speed: 4.2,
        reward: 15,
        scale: 0.82,
        bodyColor: 0x00a86b,
        headColor: 0x00e676
    },

    tank: {
        name: "Tank",
        emoji: "🛡️",
        health: 300,
        speed: 1.15,
        reward: 30,
        scale: 1.35,
        bodyColor: 0x4a148c,
        headColor: 0x7b1fa2
    },

    boss: {
        name: "Boss",
        emoji: "👑",
        health: 1000,
        speed: 0.85,
        reward: 100,
        scale: 1.8,
        bodyColor: 0x7f0000,
        headColor: 0xd32f2f
    }
};


/* =========================
   TOWER TYPES
========================= */

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


/* =========================
   GROUND
========================= */

const ground = new THREE.Mesh(
    new THREE.BoxGeometry(34, 1, 26),
    new THREE.MeshStandardMaterial({
        color: 0x4caf50
    })
);

ground.position.y = -0.5;
ground.receiveShadow = true;

scene.add(ground);


/* =========================
   PATH
========================= */

const pathMaterial = new THREE.MeshStandardMaterial({
    color: 0xd7b98e
});

for (let i = 0; i < pathPoints.length - 1; i++) {

    const a = pathPoints[i];
    const b = pathPoints[i + 1];

    const dx = b.x - a.x;
    const dz = b.z - a.z;

    const length = Math.sqrt(dx * dx + dz * dz);

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

    if (Math.abs(dx) > Math.abs(dz)) {
        path.scale.z = 3.5 / path.geometry.parameters.depth;
    } else {
        path.scale.x = 3.5 / path.geometry.parameters.width;
    }

    scene.add(path);
}


/* =========================
   TREES
========================= */

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

    const tree = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.45, 2, 6),
        new THREE.MeshStandardMaterial({
            color: 0x795548
        })
    );

    trunk.position.y = 1;

    const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(1.5, 3, 7),
        new THREE.MeshStandardMaterial({
            color: 0x1b5e20
        })
    );

    leaves.position.y = 3;

    tree.add(trunk);
    tree.add(leaves);

    tree.position.set(x, 0, z);

    trunk.castShadow = true;
    leaves.castShadow = true;

    scene.add(tree);
}

treePositions.forEach(pos => {
    createTree(pos[0], pos[1]);
});


/* =========================
   BASE
========================= */

const base = new THREE.Group();

const baseBody = new THREE.Mesh(
    new THREE.BoxGeometry(3, 3, 3),
    new THREE.MeshStandardMaterial({
        color: 0x673ab7
    })
);

baseBody.position.y = 1.5;

const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.2, 2.5, 4),
    new THREE.MeshStandardMaterial({
        color: 0xff9800
    })
);

roof.position.y = 4.2;
roof.rotation.y = Math.PI / 4;

base.add(baseBody);
base.add(roof);

base.position.set(15, 0, 9);

baseBody.castShadow = true;
roof.castShadow = true;

scene.add(base);


/* =========================================================
   HEALTH BAR SYSTEM
========================================================= */

function createHealthBar(width = 1.7, height = 0.2) {

    const group = new THREE.Group();

    const background = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, 0.08),
        new THREE.MeshBasicMaterial({
            color: 0x222222
        })
    );

    const fill = new THREE.Mesh(
        new THREE.BoxGeometry(width - 0.04, height - 0.04, 0.1),
        new THREE.MeshBasicMaterial({
            color: 0x32cd32
        })
    );

    fill.position.z = 0.05;

    group.add(background);
    group.add(fill);

    group.userData.fill = fill;
    group.userData.width = width - 0.04;

    return group;
}


function updateHealthBar(enemy) {

    if (!enemy.healthBar) return;

    const ratio = Math.max(
        0,
        Math.min(1, enemy.health / enemy.maxHealth)
    );

    const fill = enemy.healthBar.userData.fill;
    const width = enemy.healthBar.userData.width;

    fill.scale.x = ratio;

    fill.position.x =
        -(width * (1 - ratio)) / 2;

    if (ratio > 0.5) {
        fill.material.color.set(0x32cd32);
    } else if (ratio > 0.25) {
        fill.material.color.set(0xffd600);
    } else {
        fill.material.color.set(0xf44336);
    }

    enemy.healthBar.lookAt(camera.position);
}


function updateHealthBarPosition(enemy) {

    if (!enemy.healthBar) return;

    enemy.healthBar.position.set(
        enemy.mesh.position.x,
        enemy.mesh.position.y + enemy.barHeight,
        enemy.mesh.position.z
    );

    enemy.healthBar.lookAt(camera.position);
}


/* =========================================================
   BOSS UI
========================================================= */

let bossBar = null;
let bossBarFill = null;
let bossBarName = null;

function createBossUI() {

    if (bossBar) return;

    bossBar = document.createElement("div");

    bossBar.style.position = "fixed";
    bossBar.style.top = "75px";
    bossBar.style.left = "50%";
    bossBar.style.transform = "translateX(-50%)";
    bossBar.style.width = "min(500px, 80vw)";
    bossBar.style.padding = "8px";
    bossBar.style.background = "rgba(0,0,0,0.75)";
    bossBar.style.border = "2px solid #ffca28";
    bossBar.style.borderRadius = "10px";
    bossBar.style.zIndex = "20";
    bossBar.style.display = "none";
    bossBar.style.boxSizing = "border-box";
    bossBar.style.textAlign = "center";
    bossBar.style.fontFamily = "Arial, sans-serif";

    bossBarName = document.createElement("div");

    bossBarName.textContent = "👑 BOSS";

    bossBarName.style.color = "#ffd54f";
    bossBarName.style.fontWeight = "bold";
    bossBarName.style.marginBottom = "5px";

    const outer = document.createElement("div");

    outer.style.width = "100%";
    outer.style.height = "18px";
    outer.style.background = "#330000";
    outer.style.borderRadius = "9px";
    outer.style.overflow = "hidden";

    bossBarFill = document.createElement("div");

    bossBarFill.style.width = "100%";
    bossBarFill.style.height = "100%";
    bossBarFill.style.background = "#e53935";
    bossBarFill.style.transition = "width 0.1s";

    outer.appendChild(bossBarFill);

    bossBar.appendChild(bossBarName);
    bossBar.appendChild(outer);

    document.body.appendChild(bossBar);
}


function showBossBar(enemy) {

    createBossUI();

    bossBar.style.display = "block";

    updateBossBar(enemy);
}


function updateBossBar(enemy) {

    if (!bossBar || !bossBarFill) return;

    const ratio = Math.max(
        0,
        Math.min(1, enemy.health / enemy.maxHealth)
    );

    bossBarFill.style.width =
        `${ratio * 100}%`;

    bossBarName.textContent =
        `👑 BOSS — ${Math.max(0, Math.ceil(enemy.health))} HP`;
}


function hideBossBar() {

    if (bossBar) {
        bossBar.style.display = "none";
    }
}


/* =========================
   ENEMY MODEL
========================= */

function createEnemyModel(typeKey) {

    const type = ENEMY_TYPES[typeKey];

    const enemy = new THREE.Group();

    /* Body */

    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.65,
            0.75,
            1.4,
            8
        ),
        new THREE.MeshStandardMaterial({
            color: type.bodyColor
        })
    );

    body.position.y = 1.25;


    /* Head */

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(
            0.55,
            10,
            10
        ),
        new THREE.MeshStandardMaterial({
            color: type.headColor
        })
    );

    head.position.y = 2.25;


    /* Eyes */

    const eyeMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x111111
        });

    const leftEye = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, 0.18, 0.08),
        eyeMaterial
    );

    leftEye.position.set(
        -0.2,
        2.3,
        -0.48
    );

    const rightEye = leftEye.clone();

    rightEye.position.x = 0.2;


    /* Arms */

    const armGeometry =
        new THREE.CylinderGeometry(
            0.16,
            0.16,
            1.1,
            6
        );

    const leftArm = new THREE.Mesh(
        armGeometry,
        new THREE.MeshStandardMaterial({
            color: type.bodyColor
        })
    );

    leftArm.position.set(
        -0.8,
        1.25,
        0
    );

    leftArm.rotation.z = -0.25;


    const rightArm = leftArm.clone();

    rightArm.position.x = 0.8;
    rightArm.rotation.z = 0.25;


    /* Legs */

    const legGeometry =
        new THREE.CylinderGeometry(
            0.18,
            0.18,
            0.9,
            6
        );

    const leftLeg = new THREE.Mesh(
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

    const rightLeg = leftLeg.clone();

    rightLeg.position.x = 0.3;


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


    /* Fast enemy special marker */

    if (typeKey === "fast") {

        const speedFin = new THREE.Mesh(
            new THREE.ConeGeometry(
                0.25,
                0.7,
                5
            ),
            new THREE.MeshStandardMaterial({
                color: 0x00ffff
            })
        );

        speedFin.rotation.z = Math.PI / 2;
        speedFin.position.set(
            0,
            1.7,
            0
        );

        enemy.add(speedFin);
    }


    /* Tank armor */

    if (typeKey === "tank") {

        const armor = new THREE.Mesh(
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

        armor.position.y = 1.35;

        enemy.add(armor);
    }


    /* Boss crown */

    if (typeKey === "boss") {

        const crown = new THREE.Mesh(
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

        crown.position.y = 3.05;

        enemy.add(crown);

        const bossGem = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.18),
            new THREE.MeshStandardMaterial({
                color: 0x00e5ff,
                emissive: 0x0088aa
            })
        );

        bossGem.position.set(
            0,
            2.3,
            -0.55
        );

        enemy.add(bossGem);
    }


    enemy.scale.setScalar(type.scale);

    enemy.traverse(object => {

        if (object.isMesh) {
            object.castShadow = true;
        }

    });

    return enemy;
}


/* =========================================================
   WAVE GENERATION
========================================================= */

function buildWaveQueue(wave) {

    const queue = [];

    const normalCount =
        4 + wave * 2;

    for (let i = 0; i < normalCount; i++) {

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


    /* Boss every 5 waves */

    if (wave % 5 === 0) {
        queue.push("boss");
    }

    return queue;
}


/* =========================================================
   CREATE ENEMY
========================================================= */

function createEnemy(typeKey) {

    const type = ENEMY_TYPES[typeKey];

    const mesh = createEnemyModel(typeKey);

    const start = pathPoints[0];

    mesh.position.set(
        start.x,
        0,
        start.z
    );

    scene.add(mesh);


    const healthBar =
        createHealthBar(
            typeKey === "boss" ? 2.7 : 1.7,
            typeKey === "boss" ? 0.28 : 0.2
        );

    scene.add(healthBar);


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
                    : Math.min((GAME.wave - 1) * 0.03, 0.6)
            ),

        reward: type.reward,

        pathIndex: 0,

        healthBar,

        barHeight:
            typeKey === "boss"
                ? 6
                : 3.6 * type.scale
    };


    enemies.push(enemy);

    updateHealthBarPosition(enemy);
    updateHealthBar(enemy);


    if (typeKey === "boss") {
        showBossBar(enemy);
    }
}


/* =========================================================
   START WAVE
========================================================= */

function startWave() {

    if (GAME.waveRunning || GAME.gameOver) {
        return;
    }

    GAME.spawnQueue =
        buildWaveQueue(GAME.wave);

    GAME.spawnIndex = 0;
    GAME.spawnTimer = 0;
    GAME.waveRunning = true;

    updateUI();

    showMessage(
        `🌊 Wave ${GAME.wave} started!`
    );
}


/* =========================================================
   SPAWN SYSTEM
========================================================= */

function updateSpawning(delta) {

    if (!GAME.waveRunning) {
        return;
    }

    if (
        GAME.spawnIndex >=
        GAME.spawnQueue.length
    ) {
        return;
    }

    GAME.spawnTimer -= delta;

    if (GAME.spawnTimer <= 0) {

        const type =
            GAME.spawnQueue[
                GAME.spawnIndex
            ];

        createEnemy(type);

        GAME.spawnIndex++;

        /*
         * Boss gets a small dramatic delay.
         */

        if (type === "boss") {
            GAME.spawnTimer = 2;
        } else {
            GAME.spawnTimer =
                Math.max(
                    0.35,
                    0.8 -
                    GAME.wave * 0.015
                );
        }
    }
}


/* =========================================================
   ENEMY MOVEMENT
========================================================= */

function updateEnemies(delta) {

    for (let i = enemies.length - 1; i >= 0; i--) {

        const enemy = enemies[i];

        if (!enemy.mesh.parent) {
            continue;
        }

        const target =
            pathPoints[
                enemy.pathIndex + 1
            ];

        if (!target) {

            reachBase(enemy, i);

            continue;
        }


        const current =
            enemy.mesh.position;

        const direction =
            new THREE.Vector3(
                target.x - current.x,
                0,
                target.z - current.z
            );

        const distance =
            direction.length();


        if (distance < 0.2) {

            enemy.pathIndex++;

            continue;
        }


        direction.normalize();

        current.x +=
            direction.x *
            enemy.speed *
            delta;

        current.z +=
            direction.z *
            enemy.speed *
            delta;


        const angle =
            Math.atan2(
                direction.x,
                -direction.z
            );

        enemy.mesh.rotation.y = angle;


        updateHealthBarPosition(enemy);

        updateHealthBar(enemy);


        if (enemy.type === "boss") {
            updateBossBar(enemy);
        }
    }
}


/* =========================================================
   ENEMY REACHES BASE
========================================================= */

function reachBase(enemy, index) {

    scene.remove(enemy.mesh);
    scene.remove(enemy.healthBar);

    enemies.splice(index, 1);

    if (enemy.type === "boss") {
        hideBossBar();

        GAME.baseHealth -= 40;

        showMessage(
            "👑 THE BOSS REACHED YOUR BASE! -40 HP"
        );

    } else if (enemy.type === "tank") {

        GAME.baseHealth -= 20;

    } else {

        GAME.baseHealth -= 10;
    }


    GAME.baseHealth =
        Math.max(0, GAME.baseHealth);

    updateUI();


    if (GAME.baseHealth <= 0) {
        gameOver();
    }
}


/* =========================================================
   TOWER CREATION
========================================================= */

function createTower(x, z, typeKey) {

    const type =
        TOWER_TYPES[typeKey];

    const group = new THREE.Group();


    const baseMesh = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.7,
            1.8,
            1.7
        ),
        new THREE.MeshStandardMaterial({
            color: type.baseColor
        })
    );

    baseMesh.position.y = 0.9;


    const turret = new THREE.Group();

    turret.position.y = 1.8;


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


    const barrelLength =
        typeKey === "cannon"
            ? 1.6
            : 1.25;

    const barrelRadius =
        typeKey === "cannon"
            ? 0.3
            : 0.14;

    const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(
            barrelRadius,
            barrelRadius,
            barrelLength,
            8
        ),
        new THREE.MeshStandardMaterial({
            color: type.barrelColor
        })
    );

    barrel.rotation.x =
        Math.PI / 2;

    barrel.position.z =
        -barrelLength / 2;


    turret.add(top);
    turret.add(barrel);


    if (typeKey === "magic") {

        const crystal = new THREE.Mesh(
            new THREE.OctahedronGeometry(
                0.35
            ),
            new THREE.MeshStandardMaterial({
                color: 0xe040fb,
                emissive: 0x6a0080
            })
        );

        crystal.position.y = 1;

        turret.add(crystal);
    }


    group.add(baseMesh);
    group.add(turret);


    group.position.set(
        x,
        0,
        z
    );


    group.traverse(object => {

        if (object.isMesh) {
            object.castShadow = true;
        }

    });


    scene.add(group);


    towers.push({

        mesh: group,

        turret,

        type: typeKey,

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
    });


    GAME.coins -= type.cost;

    updateUI();

    showMessage(
        `${type.emoji} ${type.name} placed!`
    );
}


/* =========================================================
   TOWER TARGETING
========================================================= */

function findTarget(tower) {

    let bestTarget = null;
    let bestDistance = Infinity;

    for (const enemy of enemies) {

        const distance =
            tower.mesh.position.distanceTo(
                enemy.mesh.position
            );

        if (
            distance <= tower.range &&
            distance < bestDistance
        ) {

            bestDistance = distance;
            bestTarget = enemy;
        }
    }

    return bestTarget;
}


/* =========================================================
   TOWER UPDATES
========================================================= */

function updateTowers(delta) {

    for (const tower of towers) {

        tower.cooldown -= delta;

        if (
            !tower.target ||
            !enemies.includes(tower.target) ||
            tower.mesh.position.distanceTo(
                tower.target.mesh.position
            ) > tower.range
        ) {

            tower.target =
                findTarget(tower);
        }


        if (!tower.target) {
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


        let currentAngle =
            tower.turret.rotation.y;


        let difference =
            desiredAngle -
            currentAngle;


        while (difference > Math.PI) {
            difference -= Math.PI * 2;
        }

        while (difference < -Math.PI) {
            difference += Math.PI * 2;
        }


        tower.turret.rotation.y +=
            difference *
            Math.min(1, delta * 8);


        if (tower.cooldown <= 0) {

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

    const projectile = new THREE.Mesh(
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
            emissiveIntensity: 0.35
        })
    );


    const position =
        tower.turret.getWorldPosition(
            new THREE.Vector3()
        );


    projectile.position.copy(
        position
    );

    scene.add(projectile);


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


        if (distance < 0.65) {

            damageEnemy(
                target,
                projectile.damage,
                projectile.type
            );


            scene.remove(
                projectile.mesh
            );

            projectiles.splice(i, 1);

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
   DAMAGE ENEMY
========================================================= */

function damageEnemy(
    enemy,
    damage,
    towerType
) {

    let finalDamage = damage;


    /*
     * V0.3 tower roles
     *
     * Archer = stronger against Fast
     * Cannon = stronger against Tank
     * Magic = stronger against Boss
     */

    if (
        towerType === "archer" &&
        enemy.type === "fast"
    ) {

        finalDamage *= 1.25;
    }


    if (
        towerType === "cannon" &&
        enemy.type === "tank"
    ) {

        finalDamage *= 1.35;
    }


    if (
        towerType === "magic" &&
        enemy.type === "boss"
    ) {

        finalDamage *= 1.15;
    }


    enemy.health -= finalDamage;

    updateHealthBar(enemy);


    if (enemy.type === "boss") {
        updateBossBar(enemy);
    }


    if (enemy.health <= 0) {

        destroyEnemy(enemy);
    }
}


/* =========================================================
   DESTROY ENEMY
========================================================= */

function destroyEnemy(enemy) {

    const index =
        enemies.indexOf(enemy);

    if (index === -1) {
        return;
    }


    GAME.coins += enemy.reward;


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


    if (enemy.type === "boss") {

        hideBossBar();

        showMessage(
            "👑 BOSS DEFEATED! +100 COINS!"
        );

    } else {

        showMessage(
            `+${enemy.reward} coins`
        );
    }


    updateUI();
}


/* =========================================================
   WAVE COMPLETE
========================================================= */

function checkWaveComplete() {

    if (!GAME.waveRunning) {
        return;
    }


    if (
        GAME.spawnIndex >=
        GAME.spawnQueue.length &&
        enemies.length === 0
    ) {

        GAME.waveRunning = false;

        const waveReward = 25;

        GAME.coins += waveReward;

        showMessage(
            `🎉 Wave ${GAME.wave} complete! +${waveReward} coins`
        );

        GAME.wave++;

        updateUI();
    }
}


/* =========================================================
   TOWER MENU
========================================================= */

let towerMenu = null;

function openTowerMenu() {

    if (towerMenu) {
        return;
    }


    towerMenu =
        document.createElement("div");


    towerMenu.style.position =
        "fixed";

    towerMenu.style.bottom =
        "75px";

    towerMenu.style.left =
        "50%";

    towerMenu.style.transform =
        "translateX(-50%)";

    towerMenu.style.display =
        "flex";

    towerMenu.style.gap =
        "8px";

    towerMenu.style.padding =
        "10px";

    towerMenu.style.background =
        "rgba(0,0,0,0.8)";

    towerMenu.style.borderRadius =
        "12px";

    towerMenu.style.zIndex =
        "15";

    towerMenu.style.flexWrap =
        "wrap";

    towerMenu.style.justifyContent =
        "center";


    Object.entries(
        TOWER_TYPES
    ).forEach(
        ([key, type]) => {

            const button =
                document.createElement(
                    "button"
                );

            button.textContent =
                `${type.emoji} ${type.name} - ${type.cost}`;

            button.style.padding =
                "10px 14px";

            button.style.border =
                "none";

            button.style.borderRadius =
                "8px";

            button.style.cursor =
                "pointer";

            button.style.fontWeight =
                "bold";


            button.onclick = () => {

                if (
                    GAME.coins <
                    type.cost
                ) {

                    showMessage(
                        "❌ Not enough coins!"
                    );

                    return;
                }


                GAME.selectedTower =
                    key;

                GAME.towerMode = true;

                document.getElementById(
                    "towerButton"
                ).textContent =
                    "❌ CANCEL";

                showMessage(
                    `Place your ${type.name} tower!`
                );

                closeTowerMenu();
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

    GAME.towerMode = false;
    GAME.selectedTower = null;

    document.getElementById(
        "towerButton"
    ).textContent =
        "🏰 TOWER";

    closeTowerMenu();
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
                z >=
                    Math.min(a.z, b.z) - width &&
                z <=
                    Math.max(a.z, b.z) + width
            ) {

                return true;
            }

        } else {

            if (
                Math.abs(z - a.z) < width &&
                x >=
                    Math.min(a.x, b.x) - width &&
                x <=
                    Math.max(a.x, b.x) + width
            ) {

                return true;
            }
        }
    }

    return false;
}


/* =========================================================
   MAP CLICK
========================================================= */

renderer.domElement.addEventListener(
    "pointerdown",
    event => {

        if (
            !GAME.towerMode ||
            GAME.gameOver
        ) {
            return;
        }


        const rect =
            renderer.domElement.getBoundingClientRect();


        const mouse =
            new THREE.Vector2(
                (
                    (event.clientX -
                        rect.left) /
                    rect.width
                ) * 2 - 1,

                -(
                    (
                        event.clientY -
                        rect.top
                    ) /
                    rect.height
                ) * 2 + 1
            );


        const raycaster =
            new THREE.Raycaster();

        raycaster.setFromCamera(
            mouse,
            camera
        );


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


        if (isOnPath(x, z)) {

            showMessage(
                "❌ You cannot build on the path!"
            );

            return;
        }


        const baseDistance =
            Math.sqrt(
                Math.pow(x - 15, 2) +
                Math.pow(z - 9, 2)
            );


        if (baseDistance < 3) {

            showMessage(
                "❌ Too close to the base!"
            );

            return;
        }


        for (const tower of towers) {

            const distance =
                tower.mesh.position.distanceTo(
                    new THREE.Vector3(
                        x,
                        0,
                        z
                    )
                );

            if (distance < 2.5) {

                showMessage(
                    "❌ Towers are too close!"
                );

                return;
            }
        }


        const type =
            TOWER_TYPES[
                GAME.selectedTower
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
            GAME.selectedTower
        );


        cancelTowerMode();
    }
);


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

    message.style.opacity = "1";

    clearTimeout(
        messageTimer
    );

    messageTimer =
        setTimeout(() => {

            message.style.opacity =
                "0";

        }, 1800);
}


/* =========================================================
   GAME OVER
========================================================= */

function gameOver() {

    GAME.gameOver = true;
    GAME.waveRunning = false;

    cancelTowerMode();

    hideBossBar();

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

        if (GAME.gameOver) {
            return;
        }


        if (GAME.towerMode) {

            cancelTowerMode();

            return;
        }


        if (towerMenu) {

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
   MAIN LOOP
========================================================= */

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


    if (!GAME.gameOver) {

        updateSpawning(delta);

        updateEnemies(delta);

        updateTowers(delta);

        updateProjectiles(delta);

        checkWaveComplete();
    }


    renderer.render(
        scene,
        camera
    );
}


/* =========================
   START GAME
========================= */

createBossUI();

updateUI();

animate();

showMessage(
    "🏰 Welcome to GREAK TOWER V0.3!"
);
