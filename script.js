"use strict";

/* =========================================================
   GREAK TOWER V0.6
   POLISH + STRATEGY UPDATE
========================================================= */


/* =========================================================
   GAME STATE
========================================================= */

const GAME = {

    coins: 100,
    baseHealth: 100,

    wave: 1,

    xp: 0,

    waveRunning: false,
    gameOver: false,
    victory: false,

    maxVictoryWave: 15,

    spawnQueue: [],
    spawnIndex: 0,
    spawnTimer: 0,

    waveKills: 0,
    totalKills: 0,

    selectedTower: null,
    selectedTowerType: null,

    towers: [],
    enemies: [],
    projectiles: [],
    effects: [],

    towerMode: false,

    targetModes: [
        "First",
        "Last",
        "Strongest",
        "Closest"
    ]

};


/* =========================================================
   DOM
========================================================= */

const $ = id => document.getElementById(id);

const coinsEl = $("coins");
const healthEl = $("baseHealth");
const waveEl = $("wave");
const xpEl = $("xp");

const startWaveButton = $("startWave");
const towerButton = $("towerButton");
const achievementsButton = $("achievementsButton");
const messageEl = $("message");


/* =========================================================
   THREE.JS
========================================================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    200
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

renderer.shadowMap.enabled = true;

renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

document
    .getElementById("game")
    .appendChild(renderer.domElement);


/* =========================================================
   LIGHTING
========================================================= */

const ambientLight = new THREE.HemisphereLight(
    0xffffff,
    0x557755,
    1.5
);

scene.add(ambientLight);


const sun = new THREE.DirectionalLight(
    0xffffff,
    1.7
);

sun.position.set(
    -15,
    30,
    10
);

sun.castShadow = true;

scene.add(sun);


/* =========================================================
   WORLD
========================================================= */

const ground = new THREE.Mesh(
    new THREE.BoxGeometry(
        34,
        1,
        26
    ),
    new THREE.MeshLambertMaterial({
        color: 0x49a942
    })
);

ground.position.y = -0.5;

ground.receiveShadow = true;

scene.add(ground);


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


const pathMeshes = [];


function createPath() {

    for (let i = 0; i < pathPoints.length - 1; i++) {

        const a = pathPoints[i];
        const b = pathPoints[i + 1];

        const dx = b.x - a.x;
        const dz = b.z - a.z;

        const length =
            Math.sqrt(dx * dx + dz * dz);

        const mesh = new THREE.Mesh(

            new THREE.BoxGeometry(
                Math.abs(dx) > Math.abs(dz)
                    ? length
                    : 3.5,

                .15,

                Math.abs(dz) > Math.abs(dx)
                    ? length
                    : 3.5
            ),

            new THREE.MeshLambertMaterial({
                color: 0x9b7447
            })

        );

        mesh.position.set(
            (a.x + b.x) / 2,
            0.05,
            (a.z + b.z) / 2
        );

        mesh.receiveShadow = true;

        scene.add(mesh);

        pathMeshes.push(mesh);
    }
}

createPath();


/* =========================================================
   DECORATION
========================================================= */

function createTree(x, z) {

    const group = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 2.8, 0.7),
        new THREE.MeshLambertMaterial({
            color: 0x6d4528
        })
    );

    trunk.position.y = 1.4;

    trunk.castShadow = true;

    group.add(trunk);


    const leaves = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.6),
        new THREE.MeshLambertMaterial({
            color: 0x187d32
        })
    );

    leaves.position.y = 3.2;

    leaves.castShadow = true;

    group.add(leaves);


    group.position.set(x, 0, z);

    scene.add(group);
}


[
    [-14, 5],
    [-14, -4],
    [-4, -4],
    [-4, 9],
    [6, 9],
    [7, 2],
    [13, 3],
    [13, -9],
    [0, -9]
].forEach(p => createTree(p[0], p[1]));


/* =========================================================
   BASE
========================================================= */

const base = new THREE.Group();

const baseBody = new THREE.Mesh(
    new THREE.BoxGeometry(3, 3, 3),
    new THREE.MeshLambertMaterial({
        color: 0x7030a0
    })
);

baseBody.position.y = 1.5;

baseBody.castShadow = true;

base.add(baseBody);


const roof = new THREE.Mesh(
    new THREE.ConeGeometry(
        2.2,
        2,
        4
    ),
    new THREE.MeshLambertMaterial({
        color: 0xff8c00
    })
);

roof.position.y = 4;

roof.rotation.y = Math.PI / 4;

roof.castShadow = true;

base.add(roof);

base.position.set(15, 0, 9);

scene.add(base);


/* =========================================================
   TOWER DATA
========================================================= */

const TOWER_TYPES = {

    archer: {

        name: "Archer",

        cost: 50,

        range: 7,

        damage: 20,

        fireRate: .45,

        projectileSpeed: 15,

        color: 0x1976d2,

        ability: "Rapid Fire",

        cooldown: 15

    },

    cannon: {

        name: "Cannon",

        cost: 100,

        range: 6.5,

        damage: 55,

        fireRate: 1.5,

        projectileSpeed: 9,

        color: 0x444444,

        ability: "Big Blast",

        cooldown: 20

    },

    magic: {

        name: "Magic",

        cost: 150,

        range: 10,

        damage: 40,

        fireRate: .8,

        projectileSpeed: 13,

        color: 0x9c27b0,

        ability: "Lightning",

        cooldown: 18

    }

};


/* =========================================================
   ENEMY DATA
========================================================= */

const ENEMY_TYPES = {

    basic: {

        name: "Basic",

        health: 100,

        speed: 2.2,

        reward: 10,

        scale: 1,

        body: 0xe53935,
        head: 0xff7043,

        armor: 0

    },

    fast: {

        name: "Fast",

        health: 60,

        speed: 4.2,

        reward: 15,

        scale: .82,

        body: 0x00a86b,
        head: 0x00e676,

        armor: 0

    },

    tank: {

        name: "Tank",

        health: 300,

        speed: 1.15,

        reward: 30,

        scale: 1.35,

        body: 0x4a148c,
        head: 0x7b1fa2,

        armor: .15

    },

    boss: {

        name: "Boss",

        health: 1000,

        speed: .85,

        reward: 100,

        scale: 1.8,

        body: 0x7f0000,
        head: 0xd32f2f,

        armor: .25

    }

};


/* =========================================================
   HEALTH BAR
========================================================= */

function createHealthBar(enemy) {

    const group = new THREE.Group();

    const bg = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, .18),
        new THREE.MeshBasicMaterial({
            color: 0x222222,
            side: THREE.DoubleSide
        })
    );

    group.add(bg);


    const fill = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, .12),
        new THREE.MeshBasicMaterial({
            color: 0x25d94f,
            side: THREE.DoubleSide
        })
    );

    fill.position.z = .01;

    group.add(fill);

    group.position.y = 3;

    enemy.group.add(group);

    enemy.healthBar = group;
    enemy.healthFill = fill;
}


/* =========================================================
   ENEMY CREATION
========================================================= */

function createEnemy(type) {

    const data = ENEMY_TYPES[type];

    const group = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(
            1,
            1.6,
            1
        ),
        new THREE.MeshLambertMaterial({
            color: data.body
        })
    );

    body.position.y = 1.1;

    body.castShadow = true;

    group.add(body);


    const head = new THREE.Mesh(
        new THREE.SphereGeometry(
            .55,
            12,
            12
        ),
        new THREE.MeshLambertMaterial({
            color: data.head
        })
    );

    head.position.y = 2.35;

    head.castShadow = true;

    group.add(head);


    const eyeMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xffffff
        });


    const eye1 = new THREE.Mesh(
        new THREE.BoxGeometry(.13,.13,.13),
        eyeMaterial
    );

    const eye2 = eye1.clone();

    eye1.position.set(-.2, 2.4, -.5);
    eye2.position.set(.2, 2.4, -.5);

    group.add(eye1);
    group.add(eye2);


    const armGeometry =
        new THREE.BoxGeometry(.25, 1.1, .25);

    const armMaterial =
        new THREE.MeshLambertMaterial({
            color: data.body
        });


    const arm1 = new THREE.Mesh(
        armGeometry,
        armMaterial
    );

    const arm2 = arm1.clone();

    arm1.position.set(-.7, 1.1, 0);
    arm2.position.set(.7, 1.1, 0);

    group.add(arm1);
    group.add(arm2);


    const legGeometry =
        new THREE.BoxGeometry(.3, .8, .3);


    const leg1 = new THREE.Mesh(
        legGeometry,
        armMaterial
    );

    const leg2 = leg1.clone();

    leg1.position.set(-.25, .1, 0);
    leg2.position.set(.25, .1, 0);

    group.add(leg1);
    group.add(leg2);


    if (type === "tank") {

        const armor = new THREE.Mesh(
            new THREE.BoxGeometry(1.45, 1.9, 1.45),
            new THREE.MeshLambertMaterial({
                color: 0x777777,
                transparent: true,
                opacity: .35
            })
        );

        armor.position.y = 1.2;

        group.add(armor);
    }


    if (type === "boss") {

        const crown = new THREE.Mesh(
            new THREE.ConeGeometry(
                .9,
                1.2,
                5
            ),
            new THREE.MeshLambertMaterial({
                color: 0xffd700
            })
        );

        crown.position.y = 3.5;

        group.add(crown);
    }


    group.scale.setScalar(data.scale);

    group.position.copy(pathPoints[0]);

    scene.add(group);


    const enemy = {

        type,

        group,

        health: data.health,

        maxHealth: data.health,

        speed: data.speed,

        reward: data.reward,

        pathIndex: 0,

        distanceTravelled: 0,

        armor: data.armor,

        bossTimer: 5,

        speedBoostTimer: 0,

        healthBar: null,
        healthFill: null

    };


    createHealthBar(enemy);

    GAME.enemies.push(enemy);

    if (type === "boss") {
        showBossWarning();
    }
}


/* =========================================================
   BOSS WARNING
========================================================= */

function showBossWarning() {

    message("⚠️ BOSS INCOMING!", 2500);

    playSound(90, .35, "sawtooth");
}


/* =========================================================
   WAVE BUILDING
========================================================= */

function buildWave(wave) {

    const queue = [];

    const amount = 4 + wave * 2;

    for (let i = 0; i < amount; i++) {

        let type = "basic";

        if (wave >= 2 && i % 4 === 0) {
            type = "fast";
        }

        if (wave >= 3 && i % 6 === 0) {
            type = "tank";
        }

        queue.push(type);
    }


    if (wave % 5 === 0) {
        queue.push("boss");
    }


    return queue;
}


/* =========================================================
   START WAVE
========================================================= */

function startWave() {

    if (GAME.gameOver || GAME.victory) return;

    if (GAME.waveRunning) return;

    GAME.spawnQueue = buildWave(GAME.wave);

    GAME.spawnIndex = 0;

    GAME.spawnTimer = 0;

    GAME.waveKills = 0;

    GAME.waveRunning = true;

    startWaveButton.disabled = true;

    startWaveButton.style.opacity = ".5";

    message(
        `🌊 Wave ${GAME.wave} started!`
    );

    playSound(330, .12, "square");
}


/* =========================================================
   WAVE PREVIEW
========================================================= */

function wavePreview() {

    if (GAME.waveRunning) return;

    const queue = buildWave(GAME.wave);

    const counts = {};

    queue.forEach(type => {

        counts[type] =
            (counts[type] || 0) + 1;

    });


    let text =
        `<b>WAVE ${GAME.wave}</b><br><br>`;

    Object.keys(counts).forEach(type => {

        text +=
            `${ENEMY_TYPES[type].name}: ${counts[type]}<br>`;

    });


    text +=
        `<br>Difficulty: ${
            GAME.wave < 5
                ? "Easy"
                : GAME.wave < 10
                    ? "Medium"
                    : "Hard"
        }`;


    openPanel(
        "🌊 WAVE PREVIEW",
        text,
        [
            {
                text: "START WAVE",
                action: startWave
            },
            {
                text: "CLOSE",
                action: closePanel
            }
        ]
    );
}


/* =========================================================
   SPAWNING
========================================================= */

function updateSpawning(delta) {

    if (!GAME.waveRunning) return;

    if (
        GAME.spawnIndex >=
        GAME.spawnQueue.length
    ) {

        if (GAME.enemies.length === 0) {
            finishWave();
        }

        return;
    }


    GAME.spawnTimer -= delta;

    if (GAME.spawnTimer <= 0) {

        const type =
            GAME.spawnQueue[GAME.spawnIndex];

        createEnemy(type);

        GAME.spawnIndex++;

        GAME.spawnTimer = .8;
    }
}


/* =========================================================
   ENEMY UPDATE
========================================================= */

function updateEnemies(delta) {

    for (
        let i = GAME.enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy = GAME.enemies[i];

        let speed = enemy.speed;


        /* FAST ENEMY SPECIAL */
        if (enemy.type === "fast") {

            enemy.speedBoostTimer -= delta;

            if (enemy.speedBoostTimer <= 0) {

                enemy.speedBoostTimer = 5;

                if (Math.random() < .35) {

                    enemy.speedBoostTimer = 1.2;

                    enemy.speedBoostActive = true;
                }
            }

            if (enemy.speedBoostActive) {

                speed *= 1.7;

                enemy.speedBoostTimer -= delta;

                if (enemy.speedBoostTimer <= 0) {
                    enemy.speedBoostActive = false;
                    enemy.speedBoostTimer = 5;
                }
            }
        }


        /* BOSS SPECIAL */
        if (enemy.type === "boss") {

            enemy.bossTimer -= delta;

            if (enemy.bossTimer <= 0) {

                enemy.bossTimer = 7;

                bossAbility(enemy);
            }
        }


        const target =
            pathPoints[enemy.pathIndex + 1];


        if (!target) {

            reachBase(enemy);

            continue;
        }


        const direction =
            target.clone()
                .sub(enemy.group.position)
                .normalize();


        enemy.group.position.addScaledVector(
            direction,
            speed * delta
        );


        enemy.distanceTravelled +=
            speed * delta;


        if (
            enemy.group.position.distanceTo(target)
            < .35
        ) {

            enemy.pathIndex++;
        }


        if (enemy.healthBar) {

            enemy.healthBar.lookAt(
                camera.position
            );

            const ratio =
                Math.max(
                    0,
                    enemy.health /
                    enemy.maxHealth
                );

            enemy.healthFill.scale.x =
                ratio;

            enemy.healthFill.position.x =
                -(1.4 * (1 - ratio)) / 2;
        }
    }
}


/* =========================================================
   BOSS ABILITY
========================================================= */

function bossAbility(boss) {

    message("👑 BOSS ROAR!");

    playSound(70, .45, "sawtooth");


    GAME.towers.forEach(tower => {

        const distance =
            tower.mesh.position.distanceTo(
                boss.group.position
            );

        if (distance < 8) {

            tower.stunned =
                2.5;
        }
    });


    createExplosion(
        boss.group.position.clone(),
        0xff2200,
        2.5
    );
}


/* =========================================================
   REACH BASE
========================================================= */

function reachBase(enemy) {

    const damage =
        enemy.type === "boss"
            ? 20
            : 10;

    GAME.baseHealth -= damage;

    GAME.baseHealth =
        Math.max(
            0,
            GAME.baseHealth
        );

    updateHUD();

    createExplosion(
        enemy.group.position.clone(),
        0xff3333,
        1.2
    );

    removeEnemy(enemy);

    if (GAME.baseHealth <= 0) {
        gameOver();
    }
}


/* =========================================================
   REMOVE ENEMY
========================================================= */

function removeEnemy(enemy) {

    const index =
        GAME.enemies.indexOf(enemy);

    if (index !== -1) {
        GAME.enemies.splice(index, 1);
    }

    scene.remove(enemy.group);
}


/* =========================================================
   DAMAGE ENEMY
========================================================= */

function damageEnemy(enemy, amount, towerType) {

    if (!GAME.enemies.includes(enemy)) {
        return;
    }


    const data =
        ENEMY_TYPES[enemy.type];


    /* TYPE BONUSES */

    if (
        towerType === "archer" &&
        enemy.type === "fast"
    ) {
        amount *= 1.25;
    }


    if (
        towerType === "cannon" &&
        enemy.type === "tank"
    ) {
        amount *= 1.35;
    }


    if (
        towerType === "magic" &&
        enemy.type === "boss"
    ) {
        amount *= 1.15;
    }


    /* ARMOR */

    amount *=
        1 - enemy.armor;


    enemy.health -= amount;


    createDamageNumber(
        enemy.group.position.clone(),
        Math.round(amount)
    );


    createHitEffect(
        enemy.group.position.clone()
    );


    if (enemy.health <= 0) {

        killEnemy(enemy, towerType);
    }
}


/* =========================================================
   KILL ENEMY
========================================================= */

function killEnemy(enemy, towerType) {

    if (!GAME.enemies.includes(enemy)) {
        return;
    }


    GAME.coins += enemy.reward;

    GAME.xp +=
        enemy.type === "boss"
            ? 100
            : enemy.type === "tank"
                ? 30
                : 10;


    GAME.waveKills++;

    GAME.totalKills++;


    checkAchievements(enemy);


    createExplosion(
        enemy.group.position.clone(),
        enemy.type === "boss"
            ? 0xffaa00
            : 0xffffff,
        enemy.type === "boss"
            ? 3
            : 1
    );


    playSound(
        enemy.type === "boss"
            ? 120
            : 500,
        .08,
        "square"
    );


    removeEnemy(enemy);

    updateHUD();
}


/* =========================================================
   TOWER CREATION
========================================================= */

function createTower(type, position) {

    const data =
        TOWER_TYPES[type];


    const group =
        new THREE.Group();


    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(
            .9,
            1.1,
            1.4,
            8
        ),
        new THREE.MeshLambertMaterial({
            color: data.color
        })
    );

    body.position.y = .7;

    body.castShadow = true;

    group.add(body);


    const turret = new THREE.Group();

    turret.position.y = 1.25;

    group.add(turret);


    const head = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.1,
            .7,
            1.1
        ),
        new THREE.MeshLambertMaterial({
            color: data.color
        })
    );

    turret.add(head);


    const barrel = new THREE.Mesh(
        new THREE.BoxGeometry(
            .25,
            .25,
            1.6
        ),
        new THREE.MeshLambertMaterial({
            color: 0x222222
        })
    );

    barrel.position.z = -.8;

    turret.add(barrel);


    group.position.copy(position);

    scene.add(group);


    const tower = {

        type,

        mesh: group,

        turret,

        level: 1,

        cooldown: 0,

        abilityCooldown: 0,

        targetMode: "First",

        spent: data.cost,

        stunned: 0

    };


    GAME.towers.push(tower);

    return tower;
}


/* =========================================================
   TARGETING
========================================================= */

function getTarget(tower) {

    const data =
        TOWER_TYPES[tower.type];


    const available =
        GAME.enemies.filter(enemy => {

            return enemy.group.position
                .distanceTo(tower.mesh.position)
                <= data.range;

        });


    if (!available.length) {
        return null;
    }


    switch (tower.targetMode) {

        case "First":

            return available.reduce(
                (best, enemy) =>
                    enemy.pathIndex >
                    best.pathIndex
                        ? enemy
                        : best
            );


        case "Last":

            return available.reduce(
                (best, enemy) =>
                    enemy.pathIndex <
                    best.pathIndex
                        ? enemy
                        : best
            );


        case "Strongest":

            return available.reduce(
                (best, enemy) =>
                    enemy.health >
                    best.health
                        ? enemy
                        : best
            );


        case "Closest":

            return available.reduce(
                (best, enemy) => {

                    const d1 =
                        enemy.group.position
                            .distanceTo(
                                tower.mesh.position
                            );

                    const d2 =
                        best.group.position
                            .distanceTo(
                                tower.mesh.position
                            );

                    return d1 < d2
                        ? enemy
                        : best;

                }
            );

    }

    return available[0];
}


/* =========================================================
   TOWER UPDATE
========================================================= */

function updateTowers(delta) {

    GAME.towers.forEach(tower => {

        if (tower.stunned > 0) {

            tower.stunned -= delta;

            return;
        }


        tower.cooldown -= delta;

        tower.abilityCooldown -= delta;


        const target =
            getTarget(tower);


        if (!target) {
            return;
        }


        const targetPosition =
            target.group.position.clone();


        targetPosition.y = tower.turret.position.y;


        tower.turret.lookAt(
            targetPosition
        );


        if (tower.cooldown <= 0) {

            fireProjectile(
                tower,
                target
            );

            const data =
                TOWER_TYPES[tower.type];


            const levelMultiplier =
                tower.level === 1
                    ? 1
                    : tower.level === 2
                        ? .82
                        : .68;


            tower.cooldown =
                data.fireRate *
                levelMultiplier;
        }
    });
}


/* =========================================================
   PROJECTILES
========================================================= */

function fireProjectile(tower, target) {

    const data =
        TOWER_TYPES[tower.type];


    const projectile = new THREE.Mesh(

        new THREE.SphereGeometry(
            tower.type === "cannon"
                ? .22
                : .14,
            8,
            8
        ),

        new THREE.MeshBasicMaterial({
            color: data.color
        })

    );


    projectile.position.copy(
        tower.mesh.position
    );

    projectile.position.y += 1.5;

    scene.add(projectile);


    GAME.projectiles.push({

        mesh: projectile,

        target,

        tower,

        speed: data.projectileSpeed

    });
}


/* =========================================================
   PROJECTILE UPDATE
========================================================= */

function updateProjectiles(delta) {

    for (
        let i = GAME.projectiles.length - 1;
        i >= 0;
        i--
    ) {

        const projectile =
            GAME.projectiles[i];


        if (
            !GAME.enemies.includes(
                projectile.target
            )
        ) {

            scene.remove(projectile.mesh);

            GAME.projectiles.splice(i, 1);

            continue;
        }


        const target =
            projectile.target.group.position;


        const direction =
            target.clone()
                .sub(projectile.mesh.position);


        const distance =
            direction.length();


        if (distance < .5) {

            const tower =
                projectile.tower;

            const data =
                TOWER_TYPES[tower.type];


            let damage =
                data.damage;


            if (tower.level === 2) {
                damage *= 1.5;
            }

            if (tower.level === 3) {
                damage *= 2.2;
            }


            damageEnemy(
                projectile.target,
                damage,
                tower.type
            );


            scene.remove(
                projectile.mesh
            );

            GAME.projectiles.splice(
                i,
                1
            );

            continue;
        }


        direction.normalize();


        projectile.mesh.position.addScaledVector(
            direction,
            projectile.speed * delta
        );
    }
}


/* =========================================================
   SPECIAL ABILITIES
========================================================= */

function useAbility(tower) {

    if (
        tower.abilityCooldown > 0 ||
        tower.stunned > 0
    ) {
        return;
    }


    if (tower.type === "archer") {

        const target =
            getTarget(tower);

        if (!target) return;


        for (let i = 0; i < 6; i++) {

            setTimeout(() => {

                if (
                    GAME.enemies.includes(target)
                ) {

                    damageEnemy(
                        target,
                        TOWER_TYPES.archer.damage,
                        "archer"
                    );

                }

            }, i * 100);
        }


        tower.abilityCooldown = 15;

        message("⚡ RAPID FIRE!");

    }


    else if (tower.type === "cannon") {

        const center =
            tower.mesh.position;


        GAME.enemies.forEach(enemy => {

            const distance =
                enemy.group.position
                    .distanceTo(center);


            if (distance <= 3.5) {

                damageEnemy(
                    enemy,
                    TOWER_TYPES.cannon.damage * 2.5,
                    "cannon"
                );

            }
        });


        createExplosion(
            center.clone(),
            0xff6600,
            3.5
        );


        tower.abilityCooldown = 20;

        message("💥 BIG BLAST!");

    }


    else if (tower.type === "magic") {

        const targets =
            GAME.enemies
                .filter(enemy =>
                    enemy.group.position
                        .distanceTo(
                            tower.mesh.position
                        ) <= 10
                )
                .slice(0, 5);


        targets.forEach(enemy => {

            damageEnemy(
                enemy,
                TOWER_TYPES.magic.damage * 2,
                "magic"
            );

            createLightning(
                tower.mesh.position.clone(),
                enemy.group.position.clone()
            );

        });


        tower.abilityCooldown = 18;

        message("⚡ LIGHTNING!");
    }
}


/* =========================================================
   UPGRADE SYSTEM
========================================================= */

const UPGRADE_COSTS = {

    archer: [0, 75, 125],

    cannon: [0, 125, 200],

    magic: [0, 175, 275]

};


function upgradeTower(tower) {

    if (!tower) return;


    if (tower.level >= 3) {

        message("⭐ MAX LEVEL!");

        return;
    }


    const cost =
        UPGRADE_COSTS[tower.type]
            [tower.level];


    if (GAME.coins < cost) {

        message("❌ NOT ENOUGH COINS!");

        return;
    }


    GAME.coins -= cost;

    tower.level++;


    tower.mesh.scale.setScalar(
        1 + .08 * (tower.level - 1)
    );


    tower.spent += cost;


    message(
        `⬆️ ${TOWER_TYPES[tower.type].name} LEVEL ${tower.level}!`
    );


    updateHUD();
    openTowerPanel(tower);
}


/* =========================================================
   SELL
========================================================= */

function sellTower(tower) {

    if (!tower) return;


    const refund =
        Math.floor(
            tower.spent * .6
        );


    GAME.coins += refund;


    scene.remove(tower.mesh);


    const index =
        GAME.towers.indexOf(tower);


    if (index !== -1) {
        GAME.towers.splice(index, 1);
    }


    GAME.selectedTower = null;

    closePanel();


    message(
        `💰 Sold for ${refund} coins`
    );


    updateHUD();
}


/* =========================================================
   TOWER PANEL
========================================================= */

function openTowerPanel(tower) {

    GAME.selectedTower = tower;

    const data =
        TOWER_TYPES[tower.type];


    const nextCost =
        tower.level < 3
            ? UPGRADE_COSTS[tower.type][tower.level]
            : 0;


    const abilityText =
        tower.abilityCooldown <= 0
            ? "READY"
            : `${tower.abilityCooldown.toFixed(1)}s`;


    openPanel(

        `🏰 ${data.name} TOWER`,

        `
        <b>Level:</b> ${tower.level}/3<br>
        <b>Damage:</b> ${Math.round(
            data.damage *
            (tower.level === 1
                ? 1
                : tower.level === 2
                    ? 1.5
                    : 2.2)
        )}<br>
        <b>Range:</b> ${data.range}<br>
        <b>Target:</b> ${tower.targetMode}<br>
        <b>Ability:</b> ${data.ability}<br>
        <b>Ability:</b> ${abilityText}
        `,

        [

            {
                text:
                    tower.level < 3
                        ? `⬆️ UPGRADE (${nextCost})`
                        : "⭐ MAX LEVEL",

                action: () => {

                    if (tower.level < 3) {
                        upgradeTower(tower);
                    }
                }
            },

            {
                text:
                    `🎯 TARGET: ${tower.targetMode}`,

                action: () => {

                    cycleTargetMode(tower);

                    openTowerPanel(tower);
                }
            },

            {
                text:
                    `⚡ ${data.ability}`,

                action: () => {

                    useAbility(tower);

                    openTowerPanel(tower);
                }
            },

            {
                text:
                    "💰 SELL",

                action: () => {
                    sellTower(tower);
                }
            },

            {
                text:
                    "CLOSE",

                action: closePanel
            }

        ]
    );
}


/* =========================================================
   TARGET MODE
========================================================= */

function cycleTargetMode(tower) {

    const modes =
        GAME.targetModes;

    const index =
        modes.indexOf(
            tower.targetMode
        );


    tower.targetMode =
        modes[
            (index + 1) %
            modes.length
        ];


    message(
        `🎯 Targeting: ${tower.targetMode}`
    );
}


/* =========================================================
   TOWER MENU
========================================================= */

function openTowerMenu() {

    openPanel(

        "🏰 BUILD TOWER",

        `
        Choose a tower to place.

        <br><br>

        🏹 Archer — 50<br>
        💣 Cannon — 100<br>
        🔮 Magic — 150
        `,

        [

            {
                text: "🏹 ARCHER — 50",

                action: () => {

                    GAME.selectedTowerType =
                        "archer";

                    GAME.towerMode = true;

                    closePanel();

                    message(
                        "Click the map to place Archer"
                    );
                }
            },

            {
                text: "💣 CANNON — 100",

                action: () => {

                    GAME.selectedTowerType =
                        "cannon";

                    GAME.towerMode = true;

                    closePanel();

                    message(
                        "Click the map to place Cannon"
                    );
                }
            },

            {
                text: "🔮 MAGIC — 150",

                action: () => {

                    GAME.selectedTowerType =
                        "magic";

                    GAME.towerMode = true;

                    closePanel();

                    message(
                        "Click the map to place Magic"
                    );
                }
            },

            {
                text: "CLOSE",
                action: closePanel
            }

        ]
    );
}


/* =========================================================
   GENERIC PANEL
========================================================= */

let currentPanel = null;


function openPanel(title, content, buttons) {

    closePanel();


    const panel =
        document.createElement("div");


    panel.style.position = "fixed";
    panel.style.top = "50%";
    panel.style.left = "50%";

    panel.style.transform =
        "translate(-50%, -50%)";

    panel.style.zIndex = "100";

    panel.style.width = "min(380px, 92vw)";

    panel.style.padding = "22px";

    panel.style.borderRadius = "18px";

    panel.style.background =
        "rgba(12,18,30,.96)";

    panel.style.color = "white";

    panel.style.boxShadow =
        "0 20px 60px rgba(0,0,0,.5)";

    panel.style.border =
        "1px solid rgba(255,255,255,.15)";


    const heading =
        document.createElement("h2");

    heading.innerHTML = title;

    heading.style.marginBottom = "14px";

    panel.appendChild(heading);


    const contentDiv =
        document.createElement("div");

    contentDiv.innerHTML = content;

    contentDiv.style.lineHeight = "1.7";

    contentDiv.style.marginBottom = "18px";

    panel.appendChild(contentDiv);


    buttons.forEach(buttonData => {

        const button =
            document.createElement("button");

        button.textContent =
            buttonData.text;

        button.style.width = "100%";
        button.style.marginTop = "7px";

        button.addEventListener(
            "click",
            buttonData.action
        );

        panel.appendChild(button);
    });


    document.body.appendChild(panel);

    currentPanel = panel;
}


function closePanel() {

    if (currentPanel) {

        currentPanel.remove();

        currentPanel = null;
    }
}


/* =========================================================
   ACHIEVEMENTS
========================================================= */

const ACHIEVEMENTS = {

    firstBlood: {
        name: "🩸 First Blood",
        description: "Defeat your first enemy.",
        unlocked: false
    },

    bossSlayer: {
        name: "👑 Boss Slayer",
        description: "Defeat a boss.",
        unlocked: false
    },

    towerMaster: {
        name: "🏰 Tower Master",
        description: "Reach level 3 with a tower.",
        unlocked: false
    },

    survivor: {
        name: "❤️ Survivor",
        description: "Finish a wave without losing base health.",
        unlocked: false
    },

    rich: {
        name: "💰 Rich",
        description: "Reach 500 coins.",
        unlocked: false
    },

    champion: {
        name: "🏆 Champion",
        description: "Complete 15 waves.",
        unlocked: false
    }

};


function checkAchievements(enemy) {

    if (GAME.totalKills >= 1) {
        unlockAchievement("firstBlood");
    }


    if (enemy.type === "boss") {
        unlockAchievement("bossSlayer");
    }


    GAME.towers.forEach(tower => {

        if (tower.level >= 3) {
            unlockAchievement("towerMaster");
        }
    });


    if (GAME.coins >= 500) {
        unlockAchievement("rich");
    }
}


function unlockAchievement(id) {

    const achievement =
        ACHIEVEMENTS[id];


    if (!achievement.unlocked) {

        achievement.unlocked = true;

        message(
            `🏆 Achievement Unlocked: ${achievement.name}`,
            3000
        );

        playSound(800, .2, "square");

        saveGame();
    }
}


function showAchievements() {

    let content = "";

    Object.keys(ACHIEVEMENTS).forEach(id => {

        const a =
            ACHIEVEMENTS[id];

        content += `

            <div style="
                margin-bottom:12px;
                padding:10px;
                border-radius:10px;
                background:${
                    a.unlocked
                        ? "rgba(45,180,80,.2)"
                        : "rgba(255,255,255,.06)"
                };
            ">

                <b>
                    ${a.name}
                </b>

                <br>

                <small>
                    ${a.description}
                </small>

                <br>

                ${
                    a.unlocked
                        ? "✅ UNLOCKED"
                        : "🔒 LOCKED"
                }

            </div>

        `;
    });


    openPanel(
        "🏆 ACHIEVEMENTS",
        content,
        [
            {
                text: "CLOSE",
                action: closePanel
            }
        ]
    );
}


/* =========================================================
   WAVE FINISH
========================================================= */

function finishWave() {

    GAME.waveRunning = false;

    const reward =
        25 + GAME.wave * 5;


    GAME.coins += reward;


    if (GAME.waveKills > 0) {
        GAME.xp += GAME.waveKills * 2;
    }


    if (GAME.waveKills > 0) {
        unlockAchievement("survivor");
    }


    message(
        `🎉 Wave cleared! +${reward} coins`
    );


    if (
        GAME.wave >=
        GAME.maxVictoryWave
    ) {

        victory();

        return;
    }


    GAME.wave++;

    startWaveButton.disabled = false;

    startWaveButton.style.opacity = "1";


    updateHUD();

    saveGame();
}


/* =========================================================
   VICTORY
========================================================= */

function victory() {

    GAME.victory = true;

    GAME.waveRunning = false;

    unlockAchievement("champion");


    openPanel(

        "🏆 VICTORY!",

        `
        <div style="text-align:center">

            <div style="font-size:50px">
                👑
            </div>

            <h3>
                You defeated 15 waves!
            </h3>

            <br>

            💰 Coins: ${GAME.coins}<br>
            ⭐ XP: ${GAME.xp}<br>
            ☠️ Kills: ${GAME.totalKills}

        </div>
        `,

        [

            {
                text: "🔄 PLAY AGAIN",

                action: () => {
                    location.reload();
                }
            }

        ]

    );
}


/* =========================================================
   GAME OVER
========================================================= */

function gameOver() {

    GAME.gameOver = true;

    GAME.waveRunning = false;


    openPanel(

        "💀 GAME OVER",

        `
        <div style="text-align:center">

            <div style="font-size:50px">
                💀
            </div>

            <h3>
                The base was destroyed.
            </h3>

            <br>

            Wave reached: ${GAME.wave}<br>
            Kills: ${GAME.totalKills}

        </div>
        `,

        [

            {
                text: "🔄 TRY AGAIN",

                action: () => {
                    localStorage.removeItem(
                        "greakTowerV06"
                    );

                    location.reload();
                }
            }

        ]

    );
}


/* =========================================================
   EFFECTS
========================================================= */

function createExplosion(position, color, size) {

    const geometry =
        new THREE.SphereGeometry(
            .25,
            12,
            12
        );


    const material =
        new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: .8
        });


    const mesh =
        new THREE.Mesh(
            geometry,
            material
        );


    mesh.position.copy(position);

    scene.add(mesh);


    GAME.effects.push({

        mesh,

        life: .35,

        maxLife: .35,

        size

    });
}


function createHitEffect(position) {

    createExplosion(
        position,
        0xffffaa,
        .6
    );
}


function createLightning(start, end) {

    const geometry =
        new THREE.BufferGeometry()
            .setFromPoints([
                start,
                end
            ]);


    const material =
        new THREE.LineBasicMaterial({
            color: 0xffff00
        });


    const line =
        new THREE.Line(
            geometry,
            material
        );


    scene.add(line);


    GAME.effects.push({

        mesh: line,

        life: .15,

        maxLife: .15,

        size: 1

    });
}


/* =========================================================
   DAMAGE NUMBERS
========================================================= */

function createDamageNumber(position, damage) {

    const div =
        document.createElement("div");


    div.textContent =
        `-${damage}`;


    div.style.position = "fixed";

    div.style.zIndex = "80";

    div.style.color = "white";

    div.style.fontWeight = "900";

    div.style.fontSize = "15px";

    div.style.pointerEvents = "none";


    document.body.appendChild(div);


    let life = 0;


    function animateNumber() {

        life += .04;


        div.style.opacity =
            String(
                Math.max(
                    0,
                    1 - life
                )
            );


        div.style.transform =
            `translate(-50%, -${life * 40}px)`;


        if (life < 1) {

            requestAnimationFrame(
                animateNumber
            );

        } else {

            div.remove();
        }
    }


    const projected =
        position.clone().project(camera);


    div.style.left =
        `${(projected.x + 1) / 2 * innerWidth}px`;

    div.style.top =
        `${(-projected.y + 1) / 2 * innerHeight}px`;


    animateNumber();
}


/* =========================================================
   EFFECT UPDATE
========================================================= */

function updateEffects(delta) {

    for (
        let i = GAME.effects.length - 1;
        i >= 0;
        i--
    ) {

        const effect =
            GAME.effects[i];


        effect.life -= delta;


        const progress =
            1 -
            effect.life /
            effect.maxLife;


        effect.mesh.scale.setScalar(
            1 + progress * effect.size * 4
        );


        if (
            effect.mesh.material
        ) {

            effect.mesh.material.opacity =
                Math.max(
                    0,
                    effect.life /
                    effect.maxLife
                );
        }


        if (effect.life <= 0) {

            scene.remove(
                effect.mesh
            );

            GAME.effects.splice(
                i,
                1
            );
        }
    }
}


/* =========================================================
   SAVE SYSTEM
========================================================= */

const SAVE_KEY =
    "greakTowerV06";


function saveGame() {

    const save = {

        coins: GAME.coins,

        xp: GAME.xp,

        wave: GAME.wave,

        totalKills: GAME.totalKills,

        achievements:
            Object.fromEntries(
                Object.entries(
                    ACHIEVEMENTS
                ).map(
                    ([key, value]) =>
                        [key, value.unlocked]
                )
            )

    };


    localStorage.setItem(
        SAVE_KEY,
        JSON.stringify(save)
    );
}


function loadGame() {

    const raw =
        localStorage.getItem(
            SAVE_KEY
        );


    if (!raw) return;


    try {

        const save =
            JSON.parse(raw);


        GAME.coins =
            save.coins ?? 100;

        GAME.xp =
            save.xp ?? 0;

        GAME.wave =
            save.wave ?? 1;

        GAME.totalKills =
            save.totalKills ?? 0;


        if (save.achievements) {

            Object.keys(
                save.achievements
            ).forEach(id => {

                if (
                    ACHIEVEMENTS[id]
                ) {

                    ACHIEVEMENTS[id].unlocked =
                        save.achievements[id];
                }

            });
        }

    } catch (error) {

        console.warn(
            "Save data could not be loaded."
        );
    }
}


/* =========================================================
   HUD
========================================================= */

function updateHUD() {

    coinsEl.textContent =
        GAME.coins;

    healthEl.textContent =
        GAME.baseHealth;

    waveEl.textContent =
        GAME.wave;

    xpEl.textContent =
        GAME.xp;
}


/* =========================================================
   MESSAGE
========================================================= */

let messageTimer = null;


function message(text, duration = 1800) {

    messageEl.innerHTML =
        text;

    messageEl.style.opacity =
        "1";


    clearTimeout(messageTimer);


    messageTimer =
        setTimeout(() => {

            messageEl.style.opacity =
                "0";

        }, duration);
}


/* =========================================================
   AUDIO
========================================================= */

let audioContext = null;


function playSound(
    frequency,
    duration,
    type = "sine"
) {

    try {

        if (!audioContext) {

            audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();
        }


        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();


        oscillator.type = type;

        oscillator.frequency.value =
            frequency;


        gain.gain.setValueAtTime(
            .08,
            audioContext.currentTime
        );


        gain.gain.exponentialRampToValueAtTime(
            .001,
            audioContext.currentTime +
            duration
        );


        oscillator.connect(gain);

        gain.connect(
            audioContext.destination
        );


        oscillator.start();

        oscillator.stop(
            audioContext.currentTime +
            duration
        );

    } catch (error) {
        /* Audio unavailable */
    }
}


/* =========================================================
   RAYCASTING
========================================================= */

const raycaster =
    new THREE.Raycaster();

const mouse =
    new THREE.Vector2();


function getMousePosition(event) {

    mouse.x =
        (event.clientX /
            window.innerWidth) *
            2 - 1;

    mouse.y =
        -(event.clientY /
            window.innerHeight) *
            2 + 1;


    raycaster.setFromCamera(
        mouse,
        camera
    );
}


/* =========================================================
   MAP CLICK
========================================================= */

renderer.domElement.addEventListener(
    "pointerdown",
    event => {

        getMousePosition(event);


        /* TOWER PLACEMENT */

        if (GAME.towerMode) {

            const hits =
                raycaster.intersectObject(
                    ground
                );


            if (!hits.length) {
                return;
            }


            const position =
                hits[0].point;


            position.y = 0;


            /* DON'T PLACE ON PATH */

            let blocked = false;


            pathMeshes.forEach(path => {

                const box =
                    new THREE.Box3()
                        .setFromObject(path);


                if (
                    box.containsPoint(
                        position
                    )
                ) {

                    blocked = true;
                }
            });


            if (blocked) {

                message(
                    "❌ You can't build on the path!"
                );

                return;
            }


            const type =
                GAME.selectedTowerType;


            const data =
                TOWER_TYPES[type];


            if (
                GAME.coins <
                data.cost
            ) {

                message(
                    "❌ Not enough coins!"
                );

                return;
            }


            GAME.coins -=
                data.cost;


            createTower(
                type,
                position
            );


            GAME.towerMode = false;

            GAME.selectedTowerType =
                null;


            updateHUD();

            saveGame();

            message(
                `🏰 ${data.name} placed!`
            );

            return;
        }


        /* TOWER SELECTION */

        const objects =
            [];


        GAME.towers.forEach(tower => {

            tower.mesh.traverse(
                child => {

                    if (
                        child.isMesh
                    ) {
                        objects.push({
                            mesh: child,
                            tower
                        });
                    }

                }
            );

        });


        const intersects =
            raycaster.intersectObjects(
                objects.map(
                    object => object.mesh
                ),
                true
            );


        if (intersects.length) {

            const selected =
                objects.find(
                    object =>
                        object.mesh ===
                        intersects[0].object
                );


            if (selected) {

                openTowerPanel(
                    selected.tower
                );
            }
        }

    }
);


/* =========================================================
   BUTTONS
========================================================= */

startWaveButton.addEventListener(
    "click",
    startWave
);


towerButton.addEventListener(
    "click",
    openTowerMenu
);


achievementsButton.addEventListener(
    "click",
    showAchievements
);


/* =========================================================
   START BUTTON RIGHT CLICK
   Opens wave preview
========================================================= */

startWaveButton.addEventListener(
    "contextmenu",
    event => {

        event.preventDefault();

        wavePreview();
    }
);


/* =========================================================
   KEYBOARD
========================================================= */

window.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {

            GAME.towerMode = false;

            GAME.selectedTowerType =
                null;

            closePanel();

            message(
                "Cancelled"
            );
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
   GAME LOOP
========================================================= */

let lastTime =
    performance.now();


function animate(now) {

    requestAnimationFrame(
        animate
    );


    const delta =
        Math.min(
            .05,
            (now - lastTime) /
            1000
        );


    lastTime = now;


    if (
        !GAME.gameOver &&
        !GAME.victory
    ) {

        updateSpawning(delta);

        updateEnemies(delta);

        updateTowers(delta);

        updateProjectiles(delta);

        updateEffects(delta);
    }


    renderer.render(
        scene,
        camera
    );
}


/* =========================================================
   INITIALIZATION
========================================================= */

loadGame();

updateHUD();

message(
    "🎮 Welcome to GREAK TOWER V0.6!",
    2500
);

animate(
    performance.now()
);
