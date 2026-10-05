"use strict";

/* =========================================================
   GREAK TOWER V0.7
   MULTIPLAYER UPDATE
========================================================= */


/* =========================================================
   GOOGLE APPS SCRIPT URL
========================================================= */

/*
   AFTER DEPLOYING Code.gs:

   Paste your Google Apps Script Web App URL here.

   Example:

   const SERVER_URL =
       "https://script.google.com/macros/s/XXXXX/exec";
*/

const SERVER_URL =
    "https://script.google.com/macros/s/AKfycbzOzf7OKknOGAR_A--H0AVi1a1Rzt2OHQO5oVzYkeTKMATzqbhhoRPMMNLV4INxhvk6Eg/exec";


/* =========================================================
   GAME
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

    towers: [],

    enemies: [],

    projectiles: [],

    effects: [],

    selectedTower: null,

    selectedTowerType: null,

    towerMode: false

};


/* =========================================================
   MULTIPLAYER
========================================================= */

const MULTI = {

    connected: false,

    room: null,

    player: null,

    host: false,

    guestOnline: false,

    pollTimer: null,

    pushTimer: null,

    lastRemoteState: null,

    syncing: false,

    smoothTimer: 0

};


/* =========================================================
   DOM
========================================================= */

const $ = id =>
    document.getElementById(id);

const coinsEl =
    $("coins");

const healthEl =
    $("baseHealth");

const waveEl =
    $("wave");

const xpEl =
    $("xp");

const startWaveButton =
    $("startWave");

const towerButton =
    $("towerButton");

const multiplayerButton =
    $("multiplayerButton");

const connectionDot =
    $("connectionDot");

const connectionText =
    $("connectionText");

const messageEl =
    $("message");


/* =========================================================
   THREE
========================================================= */

const scene =
    new THREE.Scene();

scene.background =
    new THREE.Color(0x87ceeb);


const camera =
    new THREE.PerspectiveCamera(
        55,
        innerWidth / innerHeight,
        .1,
        200
    );

camera.position.set(
    0,
    28,
    27
);

camera.lookAt(
    0,
    0,
    0
);


const renderer =
    new THREE.WebGLRenderer({
        antialias: true
    });

renderer.setSize(
    innerWidth,
    innerHeight
);

renderer.shadowMap.enabled =
    true;

document
    .getElementById("game")
    .appendChild(renderer.domElement);


/* =========================================================
   LIGHTS
========================================================= */

scene.add(
    new THREE.HemisphereLight(
        0xffffff,
        0x557755,
        1.5
    )
);


const sun =
    new THREE.DirectionalLight(
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
   GROUND
========================================================= */

const ground =
    new THREE.Mesh(

        new THREE.BoxGeometry(
            34,
            1,
            26
        ),

        new THREE.MeshLambertMaterial({
            color: 0x49a942
        })

    );

ground.position.y =
    -.5;

ground.receiveShadow =
    true;

scene.add(ground);


/* =========================================================
   PATH
========================================================= */

const pathPoints = [

    new THREE.Vector3(
        -15, 0, -9
    ),

    new THREE.Vector3(
        -8, 0, -9
    ),

    new THREE.Vector3(
        -8, 0, 5
    ),

    new THREE.Vector3(
        2, 0, 5
    ),

    new THREE.Vector3(
        2, 0, -5
    ),

    new THREE.Vector3(
        10, 0, -5
    ),

    new THREE.Vector3(
        10, 0, 9
    ),

    new THREE.Vector3(
        15, 0, 9
    )

];


const pathMeshes = [];


for (
    let i = 0;
    i < pathPoints.length - 1;
    i++
) {

    const a =
        pathPoints[i];

    const b =
        pathPoints[i + 1];


    const horizontal =
        Math.abs(
            b.x - a.x
        ) >
        Math.abs(
            b.z - a.z
        );


    const length =
        horizontal
            ? Math.abs(b.x - a.x)
            : Math.abs(b.z - a.z);


    const mesh =
        new THREE.Mesh(

            new THREE.BoxGeometry(

                horizontal
                    ? length
                    : 3.5,

                .15,

                horizontal
                    ? 3.5
                    : length

            ),

            new THREE.MeshLambertMaterial({
                color: 0x9b7447
            })

        );


    mesh.position.set(

        (a.x + b.x) / 2,

        .05,

        (a.z + b.z) / 2

    );


    scene.add(mesh);

    pathMeshes.push(mesh);
}


/* =========================================================
   TREES
========================================================= */

function createTree(x, z) {

    const group =
        new THREE.Group();


    const trunk =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                .7,
                2.8,
                .7
            ),

            new THREE.MeshLambertMaterial({
                color: 0x6d4528
            })

        );

    trunk.position.y =
        1.4;

    trunk.castShadow =
        true;

    group.add(trunk);


    const leaves =
        new THREE.Mesh(

            new THREE.DodecahedronGeometry(
                1.6
            ),

            new THREE.MeshLambertMaterial({
                color: 0x187d32
            })

        );

    leaves.position.y =
        3.2;

    leaves.castShadow =
        true;

    group.add(leaves);


    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);
}


[
    [-14,5],
    [-14,-4],
    [-4,-4],
    [-4,9],
    [6,9],
    [7,2],
    [13,3],
    [13,-9],
    [0,-9]
].forEach(p =>
    createTree(
        p[0],
        p[1]
    )
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

        new THREE.MeshLambertMaterial({
            color: 0x7030a0
        })

    );

baseBody.position.y =
    1.5;

base.add(baseBody);


const roof =
    new THREE.Mesh(

        new THREE.ConeGeometry(
            2.2,
            2,
            4
        ),

        new THREE.MeshLambertMaterial({
            color: 0xff8c00
        })

    );

roof.position.y =
    4;

roof.rotation.y =
    Math.PI / 4;

base.add(roof);


base.position.set(
    15,
    0,
    9
);

scene.add(base);


/* =========================================================
   TOWER TYPES
========================================================= */

const TOWER_TYPES = {

    archer: {

        name: "Archer",

        cost: 50,

        range: 7,

        damage: 20,

        fireRate: .45,

        speed: 15,

        color: 0x1976d2

    },

    cannon: {

        name: "Cannon",

        cost: 100,

        range: 6.5,

        damage: 55,

        fireRate: 1.5,

        speed: 9,

        color: 0x444444

    },

    magic: {

        name: "Magic",

        cost: 150,

        range: 10,

        damage: 40,

        fireRate: .8,

        speed: 13,

        color: 0x9c27b0

    }

};


/* =========================================================
   ENEMIES
========================================================= */

const ENEMY_TYPES = {

    basic: {

        health: 100,

        speed: 2.2,

        reward: 10,

        scale: 1,

        color: 0xe53935,

        armor: 0

    },

    fast: {

        health: 60,

        speed: 4.2,

        reward: 15,

        scale: .82,

        color: 0x00a86b,

        armor: 0

    },

    tank: {

        health: 300,

        speed: 1.15,

        reward: 30,

        scale: 1.35,

        color: 0x4a148c,

        armor: .15

    },

    boss: {

        health: 1000,

        speed: .85,

        reward: 100,

        scale: 1.8,

        color: 0x7f0000,

        armor: .25

    }

};


/* =========================================================
   ENEMY
========================================================= */

function createEnemy(type) {

    const data =
        ENEMY_TYPES[type];


    const group =
        new THREE.Group();


    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                1,
                1.6,
                1
            ),

            new THREE.MeshLambertMaterial({
                color: data.color
            })

        );

    body.position.y =
        1.1;

    group.add(body);


    const head =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                .55,
                12,
                12
            ),

            new THREE.MeshLambertMaterial({
                color: data.color
            })

        );

    head.position.y =
        2.35;

    group.add(head);


    group.scale.setScalar(
        data.scale
    );


    group.position.copy(
        pathPoints[0]
    );


    scene.add(group);


    const enemy = {

        id:
            "enemy_" +
            Date.now() +
            "_" +
            Math.random(),

        type,

        group,

        health: data.health,

        maxHealth: data.health,

        speed: data.speed,

        reward: data.reward,

        armor: data.armor,

        pathIndex: 0,

        remoteTargetX: null,

        remoteTargetZ: null

    };


    GAME.enemies.push(
        enemy
    );
}


/* =========================================================
   WAVE
========================================================= */

function buildWave(wave) {

    const queue = [];

    const amount =
        4 + wave * 2;


    for (
        let i = 0;
        i < amount;
        i++
    ) {

        let type =
            "basic";


        if (
            wave >= 2 &&
            i % 4 === 0
        ) {

            type =
                "fast";
        }


        if (
            wave >= 3 &&
            i % 6 === 0
        ) {

            type =
                "tank";
        }


        queue.push(type);
    }


    if (
        wave % 5 === 0
    ) {

        queue.push("boss");
    }


    return queue;
}


/* =========================================================
   START WAVE
========================================================= */

function startWave(
    fromRemote = false
) {

    if (
        !MULTI.host &&
        MULTI.connected &&
        !fromRemote
    ) {

        sendMultiplayerAction({
            type:
                "startWave"
        });

        return;
    }


    if (
        GAME.waveRunning ||
        GAME.gameOver ||
        GAME.victory
    ) {

        return;
    }


    GAME.spawnQueue =
        buildWave(
            GAME.wave
        );


    GAME.spawnIndex =
        0;

    GAME.spawnTimer =
        0;

    GAME.waveKills =
        0;

    GAME.waveRunning =
        true;


    startWaveButton.disabled =
        true;


    message(
        `🌊 Wave ${GAME.wave} started!`
    );


    if (MULTI.host) {
        multiplayerPush();
    }
}


/* =========================================================
   SPAWN
========================================================= */

function updateSpawning(delta) {

    if (
        !GAME.waveRunning
    ) {

        return;
    }


    if (
        GAME.spawnIndex >=
        GAME.spawnQueue.length
    ) {

        if (
            GAME.enemies.length === 0
        ) {

            finishWave();
        }

        return;
    }


    GAME.spawnTimer -=
        delta;


    if (
        GAME.spawnTimer <= 0
    ) {

        createEnemy(
            GAME.spawnQueue[
                GAME.spawnIndex
            ]
        );


        GAME.spawnIndex++;

        GAME.spawnTimer =
            .8;
    }
}


/* =========================================================
   ENEMY UPDATE
========================================================= */

function updateEnemies(delta) {

    for (
        let i =
            GAME.enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy =
            GAME.enemies[i];


        const target =
            pathPoints[
                enemy.pathIndex + 1
            ];


        if (!target) {

            reachBase(enemy);

            continue;
        }


        const direction =
            target.clone()
                .sub(
                    enemy.group.position
                )
                .normalize();


        enemy.group
            .position
            .addScaledVector(
                direction,
                enemy.speed *
                delta
            );


        if (
            enemy.group.position
                .distanceTo(target)
            < .35
        ) {

            enemy.pathIndex++;
        }
    }
}


/* =========================================================
   BASE
========================================================= */

function reachBase(enemy) {

    GAME.baseHealth -=
        enemy.type === "boss"
            ? 20
            : 10;


    GAME.baseHealth =
        Math.max(
            0,
            GAME.baseHealth
        );


    removeEnemy(enemy);

    updateHUD();


    if (
        GAME.baseHealth <= 0
    ) {

        endGame();
    }
}


/* =========================================================
   REMOVE ENEMY
========================================================= */

function removeEnemy(enemy) {

    const index =
        GAME.enemies.indexOf(
            enemy
        );


    if (index !== -1) {

        scene.remove(
            enemy.group
        );

        GAME.enemies.splice(
            index,
            1
        );
    }
}


/* =========================================================
   DAMAGE ENEMY
========================================================= */

function damageEnemy(
    enemy,
    damage
) {

    if (!enemy) {
        return;
    }


    const reduced =
        damage *
        (1 - enemy.armor);


    enemy.health -=
        reduced;


    if (
        enemy.health <= 0
    ) {

        GAME.coins +=
            enemy.reward;

        GAME.xp +=
            enemy.reward;

        GAME.waveKills++;

        GAME.totalKills++;


        removeEnemy(enemy);

        updateHUD();

        createHitEffect(
            enemy.group.position,
            0xffd54f
        );
    }
}


/* =========================================================
   TOWERS
========================================================= */

function createTower(
    type,
    position,
    owner = MULTI.player
) {

    const data =
        TOWER_TYPES[type];


    const group =
        new THREE.Group();


    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                1.6,
                1.5,
                1.6
            ),

            new THREE.MeshLambertMaterial({
                color:
                    data.color
            })

        );


    body.position.y =
        .75;

    body.castShadow =
        true;

    group.add(body);


    const turret =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                .65,
                1.2,
                .65
            ),

            new THREE.MeshLambertMaterial({
                color:
                    0xffffff
            })

        );


    turret.position.y =
        1.7;

    turret.castShadow =
        true;

    group.add(turret);


    group.position.copy(
        position
    );


    scene.add(group);


    const tower = {

        id:
            "tower_" +
            Date.now() +
            "_" +
            Math.random(),

        type,

        owner,

        group,

        level: 1,

        damage:
            data.damage,

        range:
            data.range,

        fireRate:
            data.fireRate,

        cooldown: 0,

        totalSpent:
            data.cost,

        targetMode:
            "first"

    };


    GAME.towers.push(
        tower
    );

    return tower;
}


/* =========================================================
   TOWER STATS
========================================================= */

function getTowerStats(
    tower
) {

    const data =
        TOWER_TYPES[
            tower.type
        ];


    let multiplier =
        1;

    let rangeMultiplier =
        1;

    let fireMultiplier =
        1;


    if (
        tower.level >= 2
    ) {

        multiplier =
            1.5;

        rangeMultiplier =
            1.15;

        fireMultiplier =
            .82;
    }


    if (
        tower.level >= 3
    ) {

        multiplier =
            2.2;

        rangeMultiplier =
            1.3;

        fireMultiplier =
            .68;
    }


    return {

        damage:
            data.damage *
            multiplier,

        range:
            data.range *
            rangeMultiplier,

        fireRate:
            data.fireRate *
            fireMultiplier,

        speed:
            data.speed

    };
}


/* =========================================================
   TARGET
========================================================= */

function chooseTarget(
    tower
) {

    const stats =
        getTowerStats(
            tower
        );


    const candidates =
        GAME.enemies.filter(
            enemy =>
                enemy.group
                    .position
                    .distanceTo(
                        tower.group.position
                    ) <=
                stats.range
        );


    if (
        candidates.length === 0
    ) {

        return null;
    }


    if (
        tower.targetMode ===
        "strongest"
    ) {

        return candidates.reduce(
            (best, enemy) =>
                enemy.health >
                best.health
                    ? enemy
                    : best
        );
    }


    if (
        tower.targetMode ===
        "closest"
    ) {

        return candidates.reduce(
            (best, enemy) =>
                enemy.group.position
                    .distanceTo(
                        tower.group.position
                    ) <
                best.group.position
                    .distanceTo(
                        tower.group.position
                    )
                    ? enemy
                    : best
        );
    }


    if (
        tower.targetMode ===
        "last"
    ) {

        return candidates.reduce(
            (best, enemy) =>
                enemy.pathIndex <
                best.pathIndex
                    ? enemy
                    : best
        );
    }


    return candidates.reduce(
        (best, enemy) =>
            enemy.pathIndex >
            best.pathIndex
                ? enemy
                : best
    );
}


/* =========================================================
   TOWER UPDATE
========================================================= */

function updateTowers(
    delta
) {

    for (
        const tower of GAME.towers
    ) {

        tower.cooldown -=
            delta;


        if (
            tower.cooldown > 0
        ) {

            continue;
        }


        const target =
            chooseTarget(
                tower
            );


        if (!target) {
            continue;
        }


        const stats =
            getTowerStats(
                tower
            );


        fireProjectile(
            tower,
            target,
            stats
        );


        tower.cooldown =
            stats.fireRate;
    }
}


/* =========================================================
   PROJECTILE
========================================================= */

function fireProjectile(
    tower,
    target,
    stats
) {

    const projectile =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                .16,
                8,
                8
            ),

            new THREE.MeshBasicMaterial({
                color:
                    TOWER_TYPES[
                        tower.type
                    ].color
            })

        );


    projectile.position.copy(
        tower.group.position
    );

    projectile.position.y +=
        1.6;


    scene.add(
        projectile
    );


    GAME.projectiles.push({

        mesh:
            projectile,

        target,

        damage:
            stats.damage,

        speed:
            stats.speed,

        towerType:
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
        let i =
            GAME.projectiles.length - 1;
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

            scene.remove(
                projectile.mesh
            );

            GAME.projectiles.splice(
                i,
                1
            );

            continue;
        }


        const target =
            projectile.target;


        const direction =
            target.group.position
                .clone()
                .add(
                    new THREE.Vector3(
                        0,
                        1.2,
                        0
                    )
                )
                .sub(
                    projectile.mesh.position
                );


        const distance =
            direction.length();


        direction.normalize();


        projectile.mesh
            .position
            .addScaledVector(
                direction,
                projectile.speed *
                delta
            );


        if (
            distance < .5
        ) {

            damageEnemy(
                target,
                projectile.damage
            );


            createHitEffect(
                projectile.mesh.position,
                TOWER_TYPES[
                    projectile.towerType
                ].color
            );


            scene.remove(
                projectile.mesh
            );

            GAME.projectiles.splice(
                i,
                1
            );
        }
    }
}


/* =========================================================
   EFFECT
========================================================= */

function createHitEffect(
    position,
    color
) {

    const mesh =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                .2,
                8,
                8
            ),

            new THREE.MeshBasicMaterial({
                color:
                    color,
                transparent:
                    true
            })

        );


    mesh.position.copy(
        position
    );


    scene.add(
        mesh
    );


    GAME.effects.push({

        mesh,

        life:
            .35

    });
}


/* =========================================================
   EFFECT UPDATE
========================================================= */

function updateEffects(
    delta
) {

    for (
        let i =
            GAME.effects.length - 1;
        i >= 0;
        i--
    ) {

        const effect =
            GAME.effects[i];


        effect.life -=
            delta;


        effect.mesh.scale
            .multiplyScalar(
                1.1
            );


        if (
            effect.life <= 0
        ) {

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
   FINISH WAVE
========================================================= */

function finishWave() {

    if (
        !GAME.waveRunning
    ) {

        return;
    }


    GAME.waveRunning =
        false;


    GAME.coins +=
        25 +
        GAME.wave * 5;


    GAME.xp +=
        25 +
        GAME.wave * 5;


    if (
        GAME.wave >=
        GAME.maxVictoryWave
    ) {

        GAME.victory =
            true;

        message(
            "🏆 VICTORY!"
        );

    } else {

        GAME.wave++;

        startWaveButton.disabled =
            false;

        message(
            `✅ Wave complete! Next wave: ${GAME.wave}`
        );
    }


    updateHUD();

    if (MULTI.host) {
        multiplayerPush();
    }
}


/* =========================================================
   GAME OVER
========================================================= */

function endGame() {

    GAME.gameOver =
        true;

    GAME.waveRunning =
        false;

    startWaveButton.disabled =
        true;

    message(
        "💀 GAME OVER"
    );

    if (MULTI.host) {
        multiplayerPush();
    }
}


/* =========================================================
   HUD
========================================================= */

function updateHUD() {

    if (coinsEl) {

        coinsEl.textContent =
            GAME.coins;
    }


    if (healthEl) {

        healthEl.textContent =
            GAME.baseHealth;
    }


    if (waveEl) {

        waveEl.textContent =
            GAME.wave;
    }


    if (xpEl) {

        xpEl.textContent =
            GAME.xp;
    }
}


/* =========================================================
   MESSAGE
========================================================= */

function message(
    text
) {

    if (!messageEl) {
        return;
    }


    messageEl.textContent =
        text;


    clearTimeout(
        message._timer
    );


    message._timer =
        setTimeout(
            () => {

                messageEl.textContent =
                    "";

            },
            2500
        );
}


/* =========================================================
   TOWER COSTS
========================================================= */

const UPGRADE_COSTS = {

    archer:
        [0, 75, 125],

    cannon:
        [0, 125, 200],

    magic:
        [0, 175, 275]

};


/* =========================================================
   UPGRADE TOWER
========================================================= */

function upgradeTower(
    tower
) {

    if (!tower) {
        return;
    }


    if (
        tower.level >= 3
    ) {

        message(
            "⭐ Tower is already max level!"
        );

        return;
    }


    const cost =
        UPGRADE_COSTS[
            tower.type
        ][
            tower.level
        ];


    if (
        GAME.coins < cost
    ) {

        message(
            "❌ Not enough coins!"
        );

        return;
    }


    GAME.coins -=
        cost;


    tower.level++;


    tower.totalSpent +=
        cost;


    tower.group.scale.setScalar(
        1 +
        .08 *
        (tower.level - 1)
    );


    message(
        `⬆️ ${TOWER_TYPES[tower.type].name} upgraded to Level ${tower.level}!`
    );


    updateHUD();


    if (MULTI.host) {
        multiplayerPush();
    }
}


/* =========================================================
   SELL TOWER
========================================================= */

function sellTower(
    tower
) {

    if (!tower) {
        return;
    }


    const refund =
        Math.floor(
            tower.totalSpent *
            .6
        );


    GAME.coins +=
        refund;


    const index =
        GAME.towers.indexOf(
            tower
        );


    if (
        index !== -1
    ) {

        scene.remove(
            tower.group
        );

        GAME.towers.splice(
            index,
            1
        );
    }


    GAME.selectedTower =
        null;


    message(
        `💰 Tower sold for ${refund} coins!`
    );


    updateHUD();


    if (MULTI.host) {
        multiplayerPush();
    }
}


/* =========================================================
   TARGETING
========================================================= */

function cycleTargetMode(
    tower
) {

    if (!tower) {
        return;
    }


    const modes = [
        "first",
        "last",
        "closest",
        "strongest"
    ];


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


    if (MULTI.host) {
        multiplayerPush();
    }
}


/* =========================================================
   ABILITIES
========================================================= */

const ABILITIES = {

    archer: {
        name:
            "Rapid Fire",
        duration:
            15
    },

    cannon: {
        name:
            "Big Blast",
        duration:
            20
    },

    magic: {
        name:
            "Lightning",
        duration:
            18
    }

};


function useAbility(
    tower
) {

    if (!tower) {
        return;
    }


    if (
        tower.type ===
        "archer"
    ) {

        const old =
            tower.fireRate;


        tower.fireRate =
            .12;


        setTimeout(
            () => {

                tower.fireRate =
                    old;

            },
            15000
        );


        message(
            "🏹 RAPID FIRE!"
        );
    }


    if (
        tower.type ===
        "cannon"
    ) {

        const stats =
            getTowerStats(
                tower
            );


        GAME.enemies
            .forEach(
                enemy => {

                    if (
                        enemy.group
                            .position
                            .distanceTo(
                                tower.group.position
                            ) <=
                        stats.range
                    ) {

                        damageEnemy(
                            enemy,
                            stats.damage * 3
                        );
                    }

                }
            );


        message(
            "💥 BIG BLAST!"
        );
    }


    if (
        tower.type ===
        "magic"
    ) {

        const stats =
            getTowerStats(
                tower
            );


        const targets =
            GAME.enemies.filter(
                enemy =>
                    enemy.group
                        .position
                        .distanceTo(
                            tower.group.position
                        ) <=
                    stats.range
            );


        targets
            .forEach(
                enemy =>
                    damageEnemy(
                        enemy,
                        stats.damage * 2
                    )
            );


        message(
            "⚡ LIGHTNING!"
        );
    }


    if (MULTI.host) {
        multiplayerPush();
    }
}


/* =========================================================
   MULTIPLAYER ACTION
========================================================= */

async function sendMultiplayerAction(
    action
) {

    if (
        !MULTI.connected ||
        MULTI.host
    ) {

        return false;
    }


    try {

        const response =
            await fetch(
                SERVER_URL,
                {

                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body:
                        JSON.stringify({

                            action:
                                "command",

                            room:
                                MULTI.room,

                            player:
                                "guest",

                            command:
                                action

                        })

                }
            );


        const data =
            await response.json();


        if (!data.ok) {

            message(
                "❌ Cannot send multiplayer action."
            );

            return false;
        }


        return true;

    } catch (error) {

        console.error(
            error
        );


        message(
            "❌ Cannot send multiplayer action."
        );


        return false;
    }
}


/* =========================================================
   PROCESS GUEST ACTION
========================================================= */

function processMultiplayerAction(
    action
) {

    if (
        !action ||
        !MULTI.host
    ) {

        return;
    }


    if (
        action.type ===
        "startWave"
    ) {

        startWave(true);

        return;
    }


    if (
        action.type ===
        "placeTower"
    ) {

        const type =
            String(
                action.towerType
            );


        if (
            !TOWER_TYPES[type]
        ) {

            return;
        }


        const x =
            Number(action.x);

        const z =
            Number(action.z);


        if (
            !Number.isFinite(x) ||
            !Number.isFinite(z)
        ) {

            return;
        }


        const cost =
            TOWER_TYPES[type].cost;


        if (
            GAME.coins < cost
        ) {

            return;
        }


        const position =
            new THREE.Vector3(
                x,
                0,
                z
            );


        const tooClose =
            GAME.towers.some(
                tower =>
                    tower.group
                        .position
                        .distanceTo(
                            position
                        ) < 1.8
            );


        if (
            tooClose
        ) {

            return;
        }


        const tower =
            createTower(
                type,
                position,
                "guest"
            );


        GAME.coins -=
            cost;


        tower.totalSpent =
            cost;


        updateHUD();

        multiplayerPush();
    }
}


/* =========================================================
   MULTIPLAYER STATE SERIALIZE
========================================================= */

function serializeGame() {

    return {

        coins:
            GAME.coins,

        baseHealth:
            GAME.baseHealth,

        wave:
            GAME.wave,

        xp:
            GAME.xp,

        waveRunning:
            GAME.waveRunning,

        gameOver:
            GAME.gameOver,

        victory:
            GAME.victory,

        waveKills:
            GAME.waveKills,

        totalKills:
            GAME.totalKills,

        towers:
            GAME.towers.map(
                tower => ({

                    id:
                        tower.id,

                    type:
                        tower.type,

                    owner:
                        tower.owner,

                    x:
                        tower.group.position.x,

                    z:
                        tower.group.position.z,

                    level:
                        tower.level,

                    targetMode:
                        tower.targetMode

                })
            ),

        enemies:
            GAME.enemies.map(
                enemy => ({

                    id:
                        enemy.id,

                    type:
                        enemy.type,

                    x:
                        enemy.group.position.x,

                    z:
                        enemy.group.position.z,

                    health:
                        enemy.health,

                    pathIndex:
                        enemy.pathIndex

                })
            )

    };
}


/* =========================================================
   APPLY REMOTE STATE
========================================================= */

function applyRemoteState(
    state
) {

    if (
        !state ||
        MULTI.host
    ) {

        return;
    }


    MULTI.lastRemoteState =
        state;


    GAME.coins =
        Number(
            state.coins ??
            GAME.coins
        );


    GAME.baseHealth =
        Number(
            state.baseHealth ??
            GAME.baseHealth
        );


    GAME.wave =
        Number(
            state.wave ??
            GAME.wave
        );


    GAME.xp =
        Number(
            state.xp ??
            GAME.xp
        );


    GAME.waveRunning =
        Boolean(
            state.waveRunning
        );


    GAME.gameOver =
        Boolean(
            state.gameOver
        );


    GAME.victory =
        Boolean(
            state.victory
        );


    GAME.waveKills =
        Number(
            state.waveKills ??
            GAME.waveKills
        );


    GAME.totalKills =
        Number(
            state.totalKills ??
            GAME.totalKills
        );


    syncTowers(
        state.towers || []
    );


    syncEnemies(
        state.enemies || []
    );


    startWaveButton.disabled =
        GAME.waveRunning ||
        GAME.gameOver ||
        GAME.victory;


    updateHUD();
}


/* =========================================================
   SYNC TOWERS
========================================================= */

function syncTowers(
    remoteTowers
) {

    const remoteIds =
        remoteTowers.map(
            tower =>
                tower.id
        );


    remoteTowers.forEach(
        remote => {

            let tower =
                GAME.towers.find(
                    t =>
                        t.id ===
                        remote.id
                );


            if (!tower) {

                const position =
                    new THREE.Vector3(
                        remote.x,
                        0,
                        remote.z
                    );


                tower =
                    createTower(
                        remote.type,
                        position,
                        remote.owner
                    );


                tower.id =
                    remote.id;
            }


            tower.group
                .position
                .x =
                remote.x;


            tower.group
                .position
                .z =
                remote.z;


            tower.level =
                remote.level;


            tower.targetMode =
                remote.targetMode ||
                "first";


            tower.group.scale.setScalar(
                1 +
                .08 *
                (tower.level - 1)
            );
        }
    );


    for (
        let i =
            GAME.towers.length - 1;
        i >= 0;
        i--
    ) {

        const tower =
            GAME.towers[i];


        if (
            !remoteIds.includes(
                tower.id
            )
        ) {

            scene.remove(
                tower.group
            );


            GAME.towers.splice(
                i,
                1
            );
        }
    }
}


/* =========================================================
   SYNC ENEMIES
========================================================= */

function syncEnemies(
    remoteEnemies
) {

    const remoteIds =
        remoteEnemies.map(
            enemy =>
                enemy.id
        );


    remoteEnemies.forEach(
        remote => {

            let enemy =
                GAME.enemies.find(
                    e =>
                        e.id ===
                        remote.id
                );


            if (!enemy) {

                createEnemy(
                    remote.type
                );


                enemy =
                    GAME.enemies[
                        GAME.enemies.length - 1
                    ];


                enemy.id =
                    remote.id;

                enemy.remoteTargetX =
                    Number(remote.x);

                enemy.remoteTargetZ =
                    Number(remote.z);

            }


            if (
                enemy.type !==
                remote.type
            ) {

                scene.remove(
                    enemy.group
                );


                const index =
                    GAME.enemies.indexOf(
                        enemy
                    );


                if (
                    index !== -1
                ) {

                    GAME.enemies.splice(
                        index,
                        1
                    );
                }


                createEnemy(
                    remote.type
                );


                enemy =
                    GAME.enemies[
                        GAME.enemies.length - 1
                    ];


                enemy.id =
                    remote.id;

                enemy.remoteTargetX =
                    Number(remote.x);

                enemy.remoteTargetZ =
                    Number(remote.z);

            } else {

                enemy.remoteTargetX =
                    Number(remote.x);

                enemy.remoteTargetZ =
                    Number(remote.z);
            }


            enemy.health =
                remote.health;


            enemy.pathIndex =
                remote.pathIndex;
        }
    );


    for (
        let i =
            GAME.enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy =
            GAME.enemies[i];


        if (
            !remoteIds.includes(
                enemy.id
            )
        ) {

            scene.remove(
                enemy.group
            );


            GAME.enemies.splice(
                i,
                1
            );
        }
    }
}


/* =========================================================
   V0.8 PLAYER 2 SMOOTH MOVEMENT
   Host remains authoritative.
   Player 2 smoothly moves enemies toward the latest
   positions received from the host.
========================================================= */

function smoothRemoteEnemies(
    delta
) {

    if (
        !MULTI.connected ||
        MULTI.host
    ) {

        return;
    }


    const blend =
        1 -
        Math.exp(
            -12 *
            delta
        );


    for (
        const enemy of GAME.enemies
    ) {

        if (
            !Number.isFinite(
                enemy.remoteTargetX
            ) ||
            !Number.isFinite(
                enemy.remoteTargetZ
            )
        ) {

            continue;
        }


        enemy.group
            .position
            .x +=
            (
                enemy.remoteTargetX -
                enemy.group.position.x
            ) *
            blend;


        enemy.group
            .position
            .z +=
            (
                enemy.remoteTargetZ -
                enemy.group.position.z
            ) *
            blend;
    }
}


/* =========================================================
   CONNECTION UI
========================================================= */

function updateConnectionUI(
    forceOffline = false
) {

    if (
        forceOffline ||
        !MULTI.connected
    ) {

        connectionDot.style.background =
            "#777";

        connectionText.textContent =
            "Offline";

        return;
    }


    connectionDot.style.background =
        "#00c853";


    if (
        MULTI.host
    ) {

        connectionText.textContent =
            MULTI.guestOnline
                ? "2 Players"
                : "Waiting for Player 2";

    } else {

        connectionText.textContent =
            MULTI.guestOnline
                ? "2 Players"
                : "Connected";
    }
}


/* =========================================================
   MULTIPLAYER POLLING
========================================================= */

function startMultiplayerPolling() {

    clearInterval(
        MULTI.pollTimer
    );


    MULTI.pollTimer =
        setInterval(
            multiplayerPoll,
            700
        );
}


async function multiplayerPoll() {

    if (
        !MULTI.connected ||
        !MULTI.room
    ) {

        return;
    }


    try {

        const url =
            SERVER_URL +
            "?action=state" +
            "&room=" +
            encodeURIComponent(
                MULTI.room
            ) +
            "&player=" +
            encodeURIComponent(
                MULTI.player
            ) +
            "&t=" +
            Date.now();


        const response =
            await fetch(
                url,
                {
                    cache:
                        "no-store"
                }
            );


        const data =
            await response.json();


        if (
            !data.ok
        ) {

            return;
        }


        MULTI.guestOnline =
            Boolean(
                data.guestOnline
            );


        updateConnectionUI();


        if (
            MULTI.host
        ) {

            const actions =
                Array.isArray(
                    data.actions
                )
                    ? data.actions
                    : [];


            actions.forEach(
                processMultiplayerAction
            );

        } else {

            applyRemoteState(
                data.state
            );
        }

    } catch (
        error
    ) {

        console.warn(
            "Multiplayer poll failed:",
            error
        );
    }
}


/* =========================================================
   MULTIPLAYER PUSH
========================================================= */

async function multiplayerPush() {

    if (
        !MULTI.connected ||
        !MULTI.host ||
        !MULTI.room
    ) {

        return;
    }


    if (
        MULTI.syncing
    ) {

        return;
    }


    MULTI.syncing =
        true;


    try {

        const response =
            await fetch(
                SERVER_URL,
                {

                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body:
                        JSON.stringify({

                            action:
                                "push",

                            room:
                                MULTI.room,

                            player:
                                "host",

                            state:
                                serializeGame()

                        })

                }
            );


        const data =
            await response.json();


        if (
            !data.ok
        ) {

            console.warn(
                "State push rejected:",
                data.error
            );
        }

    } catch (
        error
    ) {

        console.warn(
            "State push failed:",
            error
        );

    } finally {

        MULTI.syncing =
            false;
    }
}


/* =========================================================
   STATE SYNC
========================================================= */

function startStateSync() {

    clearInterval(
        MULTI.pushTimer
    );


    if (
        !MULTI.host
    ) {

        return;
    }


    MULTI.pushTimer =
        setInterval(
            multiplayerPush,
            700
        );
}


/* =========================================================
   CREATE ROOM
========================================================= */

async function createRoom() {

    try {

        const response =
            await fetch(
                SERVER_URL +
                "?action=create&t=" +
                Date.now(),
                {
                    cache:
                        "no-store"
                }
            );


        const data =
            await response.json();


        if (
            !data.ok
        ) {

            message(
                "❌ Could not create room."
            );

            return;
        }


        MULTI.connected =
            true;

        MULTI.room =
            data.room;

        MULTI.player =
            "host";

        MULTI.host =
            true;

        MULTI.guestOnline =
            false;


        updateConnectionUI();


        message(
            `Room created: ${MULTI.room}`
        );


        startMultiplayerPolling();

        startStateSync();

    } catch (
        error
    ) {

        console.error(
            error
        );


        message(
            "❌ Multiplayer connection failed."
        );
    }
}


/* =========================================================
   JOIN ROOM
========================================================= */

async function joinRoom(
    roomCode
) {

    const code =
        String(
            roomCode || ""
        )
        .trim()
        .toUpperCase();


    if (!code) {

        message(
            "Enter a room code."
        );

        return;
    }


    try {

        const response =
            await fetch(
                SERVER_URL +
                "?action=join" +
                "&room=" +
                encodeURIComponent(
                    code
                ) +
                "&player=guest" +
                "&t=" +
                Date.now(),
                {
                    cache:
                        "no-store"
                }
            );


        const data =
            await response.json();


        if (
            !data.ok
        ) {

            message(
                "❌ " +
                (
                    data.error ||
                    "Could not join room."
                )
            );

            return;
        }


        MULTI.connected =
            true;

        MULTI.room =
            data.room;

        MULTI.player =
            "guest";

        MULTI.host =
            false;

        MULTI.guestOnline =
            true;


        updateConnectionUI();


        if (
            data.state
        ) {

            applyRemoteState(
                data.state
            );
        }


        startMultiplayerPolling();


        message(
            `Joined room ${MULTI.room}`
        );

    } catch (
        error
    ) {

        console.error(
            error
        );


        message(
            "❌ Multiplayer connection failed."
        );
    }
}


/* =========================================================
   LEAVE ROOM
========================================================= */

async function leaveRoom() {

    if (
        !MULTI.room
    ) {

        return;
    }


    try {

        await fetch(
            SERVER_URL +
            "?action=leave" +
            "&room=" +
            encodeURIComponent(
                MULTI.room
            ) +
            "&player=" +
            encodeURIComponent(
                MULTI.player
            ) +
            "&t=" +
            Date.now()
        );

    } catch (
        error
    ) {

        console.warn(
            error
        );
    }


    clearInterval(
        MULTI.pollTimer
    );

    clearInterval(
        MULTI.pushTimer
    );


    MULTI.connected =
        false;

    MULTI.room =
        null;

    MULTI.player =
        null;

    MULTI.host =
        false;

    MULTI.guestOnline =
        false;

    MULTI.lastRemoteState =
        null;


    updateConnectionUI(
        true
    );
}


/* =========================================================
   MULTIPLAYER UI
========================================================= */

if (
    multiplayerButton
) {

    multiplayerButton.addEventListener(
        "click",
        async () => {

            const choice =
                prompt(
                    "Type CREATE to make a room, or JOIN to join one:"
                );


            if (!choice) {
                return;
            }


            if (
                choice
                    .trim()
                    .toUpperCase() ===
                "CREATE"
            ) {

                await createRoom();

                return;
            }


            if (
                choice
                    .trim()
                    .toUpperCase() ===
                "JOIN"
            ) {

                const room =
                    prompt(
                        "Enter the room code:"
                    );


                if (room) {

                    await joinRoom(
                        room
                    );
                }
            }

        }
    );
}


/* =========================================================
   START WAVE BUTTON
========================================================= */

if (
    startWaveButton
) {

    startWaveButton.addEventListener(
        "click",
        () => {

            startWave();

        }
    );
}


/* =========================================================
   TOWER BUTTON
========================================================= */

if (
    towerButton
) {

    towerButton.addEventListener(
        "click",
        () => {

            GAME.towerMode =
                !GAME.towerMode;

            GAME.selectedTowerType =
                GAME.towerMode
                    ? "archer"
                    : null;

        }
    );
}


/* =========================================================
   RAYCAST
========================================================= */

const raycaster =
    new THREE.Raycaster();

const mouse =
    new THREE.Vector2();


renderer.domElement.addEventListener(
    "pointerdown",
    event => {

        mouse.x =
            (
                event.clientX /
                innerWidth
            ) *
            2 -
            1;


        mouse.y =
            -(
                event.clientY /
                innerHeight
            ) *
            2 +
            1;


        raycaster.setFromCamera(
            mouse,
            camera
        );


        const intersects =
            raycaster.intersectObjects(
                scene.children,
                true
            );


        if (
            intersects.length === 0
        ) {

            return;
        }


        const point =
            intersects[0]
                .point;


        if (
            GAME.towerMode
        ) {

            const type =
                GAME.selectedTowerType ||
                "archer";


            if (
                !TOWER_TYPES[type]
            ) {

                return;
            }


            const cost =
                TOWER_TYPES[type].cost;


            if (
                GAME.coins < cost
            ) {

                message(
                    "❌ Not enough coins!"
                );

                return;
            }


            const pathHit =
                pathMeshes.some(
                    mesh =>
                        intersects.some(
                            hit =>
                                hit.object ===
                                mesh
                        )
                );


            if (
                pathHit
            ) {

                message(
                    "❌ You cannot build on the path."
                );

                return;
            }


            if (
                MULTI.connected &&
                !MULTI.host
            ) {

                sendMultiplayerAction({

                    type:
                        "placeTower",

                    towerType:
                        type,

                    x:
                        point.x,

                    z:
                        point.z

                });


                GAME.towerMode =
                    false;

                GAME.selectedTowerType =
                    null;


                message(
                    "📡 Sending tower to Player 1..."
                );


                return;
            }


            GAME.coins -=
                cost;


            createTower(
                type,
                new THREE.Vector3(
                    point.x,
                    0,
                    point.z
                ),
                MULTI.player
            );


            GAME.towerMode =
                false;

            GAME.selectedTowerType =
                null;


            updateHUD();


            if (MULTI.host) {
                multiplayerPush();
            }


            return;
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
            innerWidth /
            innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            innerWidth,
            innerHeight
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


    lastTime =
        now;


    if (
        !GAME.gameOver &&
        !GAME.victory
    ) {

        if (
            MULTI.connected &&
            !MULTI.host
        ) {

            /*
               Player 2 does NOT run the authoritative
               simulation.

               Instead, V0.8 smoothly interpolates the
               latest positions received from Player 1.
            */

            smoothRemoteEnemies(
                delta
            );

        } else {

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

            updateEffects(
                delta
            );
        }
    }


    renderer.render(
        scene,
        camera
    );
}


/* =========================================================
   START
========================================================= */

updateHUD();

updateConnectionUI(
    true
);

animate(
    performance.now()
);
