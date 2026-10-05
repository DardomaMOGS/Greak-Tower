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

    syncing: false

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
            "enemy_" + Date.now() + "_" + Math.random(),

        type,

        group,

        health: data.health,

        maxHealth: data.health,

        speed: data.speed,

        reward: data.reward,

        armor: data.armor,

        pathIndex: 0

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
            type = "fast";
        }


        if (
            wave >= 3 &&
            i % 6 === 0
        ) {
            type = "tank";
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

function startWave(fromRemote = false) {

    if (
        GAME.waveRunning ||
        GAME.gameOver ||
        GAME.victory
    ) {
        return;
    }

    /* Player 2 asks the host to start the wave. */
    if (
        MULTI.connected &&
        !MULTI.host &&
        !fromRemote
    ) {
        sendMultiplayerAction({
            type: "startWave"
        });
        return;
    }

    GAME.spawnQueue = buildWave(GAME.wave);
    GAME.spawnIndex = 0;
    GAME.spawnTimer = 0;
    GAME.waveKills = 0;
    GAME.waveRunning = true;

    startWaveButton.disabled = true;

    message(`🌊 Wave ${GAME.wave} started!`);

    multiplayerPush();
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

        GAME.enemies.splice(
            index,
            1
        );
    }


    scene.remove(
        enemy.group
    );
}


/* =========================================================
   TOWER
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

    body.position.y =
        .7;

    group.add(body);


    const turret =
        new THREE.Group();

    turret.position.y =
        1.25;

    group.add(turret);


    const head =
        new THREE.Mesh(

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


    const barrel =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                .25,
                .25,
                1.6
            ),

            new THREE.MeshLambertMaterial({
                color: 0x222222
            })

        );

    barrel.position.z =
        -.8;

    turret.add(barrel);


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

        mesh: group,

        turret,

        level: 1,

        cooldown: 0,

        targetMode: "First",

        spent: data.cost

    };


    GAME.towers.push(
        tower
    );


    return tower;
}


/* =========================================================
   TARGET
========================================================= */

function getTarget(tower) {

    const data =
        TOWER_TYPES[
            tower.type
        ];


    const enemies =
        GAME.enemies.filter(
            enemy =>

                enemy.group
                    .position
                    .distanceTo(
                        tower.mesh.position
                    )
                <= data.range
        );


    if (
        enemies.length === 0
    ) {
        return null;
    }


    if (
        tower.targetMode ===
        "Strongest"
    ) {

        return enemies.reduce(
            (a,b) =>
                a.health >
                b.health
                    ? a
                    : b
        );
    }


    if (
        tower.targetMode ===
        "Closest"
    ) {

        return enemies.reduce(
            (a,b) => {

                const da =
                    a.group.position
                        .distanceTo(
                            tower.mesh.position
                        );

                const db =
                    b.group.position
                        .distanceTo(
                            tower.mesh.position
                        );

                return da < db
                    ? a
                    : b;
            }
        );
    }


    if (
        tower.targetMode ===
        "Last"
    ) {

        return enemies.reduce(
            (a,b) =>
                a.pathIndex <
                b.pathIndex
                    ? a
                    : b
        );
    }


    return enemies.reduce(
        (a,b) =>
            a.pathIndex >
            b.pathIndex
                ? a
                : b
    );
}


/* =========================================================
   TOWERS
========================================================= */

function updateTowers(delta) {

    GAME.towers.forEach(
        tower => {

            tower.cooldown -=
                delta;


            const target =
                getTarget(tower);


            if (!target) {
                return;
            }


            tower.turret.lookAt(
                target.group.position
            );


            if (
                tower.cooldown <= 0
            ) {

                fireProjectile(
                    tower,
                    target
                );


                const data =
                    TOWER_TYPES[
                        tower.type
                    ];


                tower.cooldown =
                    data.fireRate *
                    (
                        tower.level === 1
                            ? 1
                            : tower.level === 2
                                ? .82
                                : .68
                    );
            }
        }
    );
}


/* =========================================================
   PROJECTILE
========================================================= */

function fireProjectile(
    tower,
    target
) {

    const data =
        TOWER_TYPES[
            tower.type
        ];


    const projectile =
        new THREE.Mesh(

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


    projectile.position.y +=
        1.5;


    scene.add(
        projectile
    );


    GAME.projectiles.push({

        mesh: projectile,

        target,

        tower,

        speed: data.speed

    });
}


/* =========================================================
   PROJECTILES
========================================================= */

function updateProjectiles(delta) {

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


        const direction =
            projectile.target
                .group
                .position
                .clone()
                .sub(
                    projectile.mesh.position
                );


        const distance =
            direction.length();


        if (
            distance < .5
        ) {

            let damage =
                TOWER_TYPES[
                    projectile.tower.type
                ].damage;


            if (
                projectile.tower.level === 2
            ) {
                damage *= 1.5;
            }


            if (
                projectile.tower.level === 3
            ) {
                damage *= 2.2;
            }


            damageEnemy(
                projectile.target,
                damage,
                projectile.tower.type
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


        projectile.mesh
            .position
            .addScaledVector(
                direction,
                projectile.speed *
                delta
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

    if (
        !GAME.enemies.includes(
            enemy
        )
    ) {
        return;
    }


    if (
        towerType === "archer" &&
        enemy.type === "fast"
    ) {
        damage *= 1.25;
    }


    if (
        towerType === "cannon" &&
        enemy.type === "tank"
    ) {
        damage *= 1.35;
    }


    if (
        towerType === "magic" &&
        enemy.type === "boss"
    ) {
        damage *= 1.15;
    }


    damage *=
        1 - enemy.armor;


    enemy.health -=
        damage;


    if (
        enemy.health <= 0
    ) {

        killEnemy(enemy);
    }
}


/* =========================================================
   KILL
========================================================= */

function killEnemy(enemy) {

    if (
        !GAME.enemies.includes(
            enemy
        )
    ) {
        return;
    }


    GAME.coins +=
        enemy.reward;


    GAME.xp +=
        enemy.type === "boss"
            ? 100
            : 10;


    GAME.waveKills++;

    GAME.totalKills++;


    removeEnemy(
        enemy
    );


    updateHUD();
}


/* =========================================================
   FINISH WAVE
========================================================= */

function finishWave() {

    GAME.waveRunning =
        false;


    const reward =
        25 +
        GAME.wave * 5;


    GAME.coins +=
        reward;


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
            `🎉 Wave cleared! +${reward}`
        );
    }


    updateHUD();

    multiplayerPush();
}


/* =========================================================
   END GAME
========================================================= */

function endGame() {

    GAME.gameOver =
        true;

    GAME.waveRunning =
        false;


    message(
        "💀 GAME OVER"
    );


    multiplayerPush();
}


/* =========================================================
   HUD
========================================================= */

function updateHUD() {

    coinsEl.textContent =
        Math.floor(
            GAME.coins
        );

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

let messageTimer;


function message(
    text,
    duration = 1800
) {

    messageEl.innerHTML =
        text;


    messageEl.style.opacity =
        "1";


    clearTimeout(
        messageTimer
    );


    messageTimer =
        setTimeout(
            () => {

                messageEl.style.opacity =
                    "0";

            },
            duration
        );
}


/* =========================================================
   MULTIPLAYER PANEL
========================================================= */

function multiplayerMenu() {

    if (
        MULTI.connected
    ) {

        showRoomPanel();

        return;
    }


    openPanel(

        "🌐 MULTIPLAYER",

        `
            <div style="
                text-align:center;
                line-height:1.8;
            ">

                <b>GREAK TOWER CO-OP</b>

                <br><br>

                Play together with
                another player.

                <br><br>

                Create a room or
                enter a room code.

            </div>
        `,

        [

            {
                text:
                    "🏠 CREATE ROOM",

                action:
                    createMultiplayerRoom
            },

            {
                text:
                    "🔑 JOIN ROOM",

                action:
                    showJoinRoom
            },

            {
                text:
                    "CLOSE",

                action:
                    closePanel
            }

        ]
    );
}


/* =========================================================
   CREATE ROOM
========================================================= */

async function createMultiplayerRoom() {

    closePanel();


    if (
        SERVER_URL.includes(
            "PASTE_YOUR"
        )
    ) {

        message(
            "⚠️ Add your Apps Script URL first."
        );

        return;
    }


    message(
        "🌐 Creating room..."
    );


    try {

        const response =
            await fetch(
                SERVER_URL +
                "?action=create"
            );


        const data =
            await response.json();


        if (!data.ok) {

            throw new Error(
                data.error
            );
        }


        MULTI.room =
            data.room;

        MULTI.player =
            data.player;

        MULTI.host =
            true;

        MULTI.connected =
            true;


        updateConnectionUI();


        showRoomPanel();


        startMultiplayerPolling();
        startStateSync();


    } catch (error) {

        message(
            "❌ Could not create room."
        );
    }
}


/* =========================================================
   JOIN ROOM
========================================================= */

function showJoinRoom() {

    openPanel(

        "🔑 JOIN ROOM",

        `
            <input
                id="roomCodeInput"
                maxlength="6"
                placeholder="ROOM CODE"
                style="
                    width:100%;
                    padding:14px;
                    border-radius:10px;
                    border:none;
                    font-size:20px;
                    text-align:center;
                    text-transform:uppercase;
                "
            >
        `,

        [

            {
                text:
                    "🚀 JOIN",

                action:
                    joinMultiplayerRoom
            },

            {
                text:
                    "BACK",

                action:
                    multiplayerMenu
            }

        ]
    );
}


async function joinMultiplayerRoom() {

    const input =
        document.getElementById(
            "roomCodeInput"
        );


    if (!input) return;


    const code =
        input.value
            .trim()
            .toUpperCase();


    if (
        code.length !== 6
    ) {

        message(
            "❌ Enter a 6-character room code."
        );

        return;
    }


    closePanel();


    message(
        "🌐 Joining room..."
    );


    try {

        const url =
            SERVER_URL +
            "?action=join" +
            "&room=" +
            encodeURIComponent(
                code
            ) +
            "&player=guest";


        const response =
            await fetch(url);


        const data =
            await response.json();


        if (!data.ok) {

            throw new Error(
                data.error
            );
        }


        MULTI.room =
            data.room;

        MULTI.player =
            "guest";

        MULTI.host =
            false;

        MULTI.connected =
            true;


        updateConnectionUI();


        startMultiplayerPolling();


        message(
            "🤝 Joined room!"
        );


    } catch (error) {

        message(
            "❌ " +
            error.message
        );
    }
}


/* =========================================================
   ROOM PANEL
========================================================= */

function showRoomPanel() {

    const status =
        MULTI.host
            ? "👑 YOU ARE HOST"
            : "👤 YOU ARE PLAYER 2";


    const guest =
        MULTI.guestOnline
            ? "🟢 Player 2 connected"
            : "🟡 Waiting for Player 2";


    openPanel(

        "🌐 MULTIPLAYER ROOM",

        `
            <div style="
                text-align:center;
            ">

                <div style="
                    font-size:13px;
                    opacity:.7;
                ">
                    ROOM CODE
                </div>

                <div style="
                    font-size:38px;
                    font-weight:900;
                    letter-spacing:7px;
                    margin:10px 0;
                ">
                    ${MULTI.room}
                </div>

                <div>
                    ${status}
                </div>

                <br>

                <div>
                    ${guest}
                </div>

                <br>

                <small>
                    Share this code with
                    your teammate.
                </small>

            </div>
        `,

        [

            {
                text:
                    "🚪 LEAVE ROOM",

                action:
                    leaveMultiplayer
            },

            {
                text:
                    "CLOSE",

                action:
                    closePanel
            }

        ]
    );
}


/* =========================================================
   MULTIPLAYER POLLING + ACTIONS
========================================================= */

function startMultiplayerPolling() {

    clearInterval(MULTI.pollTimer);

    MULTI.pollTimer = setInterval(
        multiplayerPoll,
        700
    );

    multiplayerPoll();
}


async function multiplayerPoll() {

    if (!MULTI.connected || !MULTI.room) {
        return;
    }

    try {

        const url =
            SERVER_URL +
            "?action=state" +
            "&room=" + encodeURIComponent(MULTI.room) +
            "&player=" + encodeURIComponent(MULTI.player);

        const response = await fetch(url, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`Server HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data.ok) {
            throw new Error(data.error || "Room unavailable");
        }

        MULTI.guestOnline = !!data.guestOnline;
        updateConnectionUI();

        /* HOST consumes Player 2's queued actions. */
        if (MULTI.host && Array.isArray(data.actions)) {
            for (const action of data.actions) {
                processMultiplayerAction(action);
            }
        }

        /* PLAYER 2 receives the host-authoritative game state. */
        if (!MULTI.host && data.state) {
            applyRemoteState(data.state);
        }

    } catch (error) {
        console.warn("GREAK TOWER multiplayer poll:", error);
        updateConnectionUI(false);
    }
}


/* =========================================================
   SEND PLAYER 2 ACTION
========================================================= */

async function sendMultiplayerAction(action) {

    if (
        !MULTI.connected ||
        !MULTI.room ||
        MULTI.host
    ) {
        return false;
    }

    try {

        const response = await fetch(
            SERVER_URL,
            {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify({
                    action: "command",
                    room: MULTI.room,
                    player: "guest",
                    command: action
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Server HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data.ok) {
            throw new Error(data.error || "Action rejected");
        }

        return true;

    } catch (error) {

        console.error("Cannot send multiplayer action:", error);
        message("❌ Cannot send multiplayer action. Check that the Apps Script is deployed as the latest version.", 3500);
        return false;
    }
}


/* =========================================================
   HOST ACTION PROCESSOR
========================================================= */

function processMultiplayerAction(action) {

    if (!action || !action.type) {
        return;
    }

    if (action.type === "startWave") {
        startWave(true);
        return;
    }

    if (action.type === "placeTower") {

        const type = action.towerType;
        const x = Number(action.x);
        const z = Number(action.z);

        if (!TOWER_TYPES[type]) {
            return;
        }

        if (!Number.isFinite(x) || !Number.isFinite(z)) {
            return;
        }

        const position = new THREE.Vector3(x, 0, z);
        const cost = TOWER_TYPES[type].cost;

        if (GAME.gameOver || GAME.victory) {
            return;
        }

        if (GAME.coins < cost) {
            return;
        }

        /* Host performs the authoritative placement checks. */
        let blocked = false;

        pathMeshes.forEach(path => {
            const box = new THREE.Box3().setFromObject(path);
            if (box.containsPoint(position)) {
                blocked = true;
            }
        });

        if (blocked) {
            return;
        }

        for (const tower of GAME.towers) {
            if (tower.mesh.position.distanceTo(position) < 2.0) {
                return;
            }
        }

        GAME.coins -= cost;
        createTower(type, position, "guest");
        updateHUD();
        multiplayerPush();
    }
}


/* =========================================================
   HOST STATE PUSH
========================================================= */

function startStateSync() {

    clearInterval(MULTI.pushTimer);

    MULTI.pushTimer = setInterval(() => {

        if (MULTI.host && MULTI.connected) {
            multiplayerPush();
        }

    }, 700);
}


async function multiplayerPush() {

    if (!MULTI.host || !MULTI.connected || !MULTI.room) {
        return;
    }

    try {

        const response = await fetch(
            SERVER_URL,
            {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify({
                    action: "push",
                    room: MULTI.room,
                    player: "host",
                    state: serializeGame()
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Server HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data.ok) {
            throw new Error(data.error || "State push rejected");
        }

    } catch (error) {
        console.warn("GREAK TOWER state push:", error);
        updateConnectionUI(false);
    }
}


/* =========================================================
   SERIALIZE GAME
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
                        tower.mesh
                            .position.x,

                    z:
                        tower.mesh
                            .position.z,

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
                        enemy.group
                            .position.x,

                    z:
                        enemy.group
                            .position.z,

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

    if (!state) return;


    MULTI.syncing =
        true;


    GAME.coins =
        state.coins;

    GAME.baseHealth =
        state.baseHealth;

    GAME.wave =
        state.wave;

    GAME.xp =
        state.xp;

    GAME.waveRunning =
        state.waveRunning;

    GAME.gameOver =
        state.gameOver;

    GAME.victory =
        state.victory;

    GAME.totalKills =
        state.totalKills || 0;

    startWaveButton.disabled =
        !!state.waveRunning ||
        !!state.gameOver ||
        !!state.victory;


    syncTowers(
        state.towers || []
    );


    syncEnemies(
        state.enemies || []
    );


    updateHUD();


    MULTI.syncing =
        false;
}


/* =========================================================
   SYNC TOWERS
========================================================= */

function syncTowers(
    remoteTowers
) {

    const remoteIds =
        remoteTowers.map(
            tower => tower.id
        );


    /*
       CREATE MISSING TOWERS
    */

    remoteTowers.forEach(
        remote => {

            let tower =
                GAME.towers.find(
                    t =>
                        t.id ===
                        remote.id
                );


            if (!tower) {

                tower =
                    createTower(

                        remote.type,

                        new THREE.Vector3(
                            remote.x,
                            0,
                            remote.z
                        ),

                        remote.owner

                    );


                tower.id =
                    remote.id;
            }


            tower.level =
                remote.level;

            tower.targetMode =
                remote.targetMode;

            tower.mesh.position.x =
                remote.x;

            tower.mesh.position.z =
                remote.z;


            tower.mesh.scale.setScalar(
                1 +
                .08 *
                (tower.level - 1)
            );
        }
    );


    /*
       REMOVE TOWERS THAT
       NO LONGER EXIST
    */

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
                tower.mesh
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

function syncEnemies(remoteEnemies) {

    const remoteIds = remoteEnemies.map(enemy => enemy.id);

    remoteEnemies.forEach(remote => {
        let enemy = GAME.enemies.find(e => e.id === remote.id);

        if (!enemy) {
            createEnemy(remote.type);
            enemy = GAME.enemies[GAME.enemies.length - 1];
            enemy.id = remote.id;
        }

        if (enemy.type !== remote.type) {
            scene.remove(enemy.group);
            const index = GAME.enemies.indexOf(enemy);
            if (index !== -1) GAME.enemies.splice(index, 1);
            createEnemy(remote.type);
            enemy = GAME.enemies[GAME.enemies.length - 1];
            enemy.id = remote.id;
        }

        enemy.group.position.x = remote.x;
        enemy.group.position.z = remote.z;
        enemy.health = remote.health;
        enemy.pathIndex = remote.pathIndex;
    });

    for (let i = GAME.enemies.length - 1; i >= 0; i--) {
        const enemy = GAME.enemies[i];
        if (!remoteIds.includes(enemy.id)) {
            scene.remove(enemy.group);
            GAME.enemies.splice(i, 1);
        }
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
        MULTI.guestOnline ||
        !MULTI.host
            ? "#24d05a"
            : "#ffc107";


    connectionText.textContent =
        MULTI.host
            ? (
                MULTI.guestOnline
                    ? "2 Players"
                    : "Waiting..."
            )
            : "Connected";
}


/* =========================================================
   LEAVE
========================================================= */

async function leaveMultiplayer() {

    try {

        await fetch(
            SERVER_URL +
            "?action=leave" +
            "&room=" +
            encodeURIComponent(
                MULTI.room
            ) +
            "&player=" +
            MULTI.player
        );

    } catch (error) {}


    leaveLocalRoom();

    closePanel();

    message(
        "🚪 Left multiplayer room."
    );
}


function leaveLocalRoom() {

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


    clearInterval(
        MULTI.pollTimer
    );

    clearInterval(
        MULTI.pushTimer
    );


    updateConnectionUI(
        true
    );
}


/* =========================================================
   PANEL
========================================================= */

let currentPanel =
    null;


function openPanel(
    title,
    content,
    buttons
) {

    closePanel();


    const panel =
        document.createElement(
            "div"
        );


    Object.assign(
        panel.style,
        {

            position:
                "fixed",

            top:
                "50%",

            left:
                "50%",

            transform:
                "translate(-50%,-50%)",

            zIndex:
                "100",

            width:
                "min(400px,92vw)",

            padding:
                "22px",

            borderRadius:
                "18px",

            background:
                "rgba(12,18,30,.97)",

            color:
                "white",

            boxShadow:
                "0 20px 60px rgba(0,0,0,.5)"

        }
    );


    const heading =
        document.createElement(
            "h2"
        );


    heading.innerHTML =
        title;


    heading.style.marginBottom =
        "14px";


    panel.appendChild(
        heading
    );


    const contentDiv =
        document.createElement(
            "div"
        );


    contentDiv.innerHTML =
        content;


    contentDiv.style.lineHeight =
        "1.7";


    panel.appendChild(
        contentDiv
    );


    buttons.forEach(
        data => {

            const button =
                document.createElement(
                    "button"
                );


            button.textContent =
                data.text;


            button.style.width =
                "100%";


            button.style.marginTop =
                "8px";


            button.addEventListener(
                "click",
                data.action
            );


            panel.appendChild(
                button
            );
        }
    );


    document.body.appendChild(
        panel
    );


    currentPanel =
        panel;
}


function closePanel() {

    if (
        currentPanel
    ) {

        currentPanel.remove();

        currentPanel =
            null;
    }
}


/* =========================================================
   TOWER MENU
========================================================= */

function towerMenu() {

    openPanel(

        "🏰 BUILD TOWER",

        `
            Choose a tower:

            <br><br>

            🏹 Archer — 50<br>
            💣 Cannon — 100<br>
            🔮 Magic — 150
        `,

        [

            {
                text:
                    "🏹 ARCHER",

                action: () =>
                    selectTower(
                        "archer"
                    )
            },

            {
                text:
                    "💣 CANNON",

                action: () =>
                    selectTower(
                        "cannon"
                    )
            },

            {
                text:
                    "🔮 MAGIC",

                action: () =>
                    selectTower(
                        "magic"
                    )
            },

            {
                text:
                    "CLOSE",

                action:
                    closePanel
            }

        ]
    );
}


function selectTower(
    type
) {

    GAME.selectedTowerType =
        type;

    GAME.towerMode =
        true;

    closePanel();


    message(
        "🖱️ Click the map to place your tower."
    );
}


/* =========================================================
   MAP CLICK
========================================================= */

const raycaster =
    new THREE.Raycaster();


const mouse =
    new THREE.Vector2();


renderer.domElement.addEventListener(
    "pointerdown",
    event => {

        mouse.x =
            event.clientX /
            innerWidth *
            2 - 1;

        mouse.y =
            -(event.clientY /
                innerHeight *
                2 - 1);


        raycaster.setFromCamera(
            mouse,
            camera
        );


        if (
            GAME.towerMode
        ) {

            const hits =
                raycaster
                    .intersectObject(
                        ground
                    );


            if (
                !hits.length
            ) {
                return;
            }


            const position =
                hits[0].point;


            let blocked =
                false;


            pathMeshes.forEach(
                path => {

                    const box =
                        new THREE.Box3()
                            .setFromObject(
                                path
                            );


                    if (
                        box.containsPoint(
                            position
                        )
                    ) {

                        blocked =
                            true;
                    }
                }
            );


            if (
                blocked
            ) {

                message(
                    "❌ Can't build on the path!"
                );

                return;
            }


            const type =
                GAME.selectedTowerType;


            const cost =
                TOWER_TYPES[
                    type
                ].cost;


            if (
                GAME.coins <
                cost
            ) {

                message(
                    "❌ Not enough coins!"
                );

                return;
            }


            /* Player 2 sends the placement to the host.
               The host then validates the position, charges coins,
               creates the tower, and broadcasts the result. */
            if (MULTI.connected && !MULTI.host) {

                sendMultiplayerAction({
                    type: "placeTower",
                    towerType: type,
                    x: Number(position.x.toFixed(3)),
                    z: Number(position.z.toFixed(3))
                });

                GAME.towerMode = false;
                GAME.selectedTowerType = null;

                message("📡 Sending tower to Player 1...");
                return;
            }

            GAME.coins -= cost;

            createTower(
                type,
                position,
                MULTI.host ? "host" : MULTI.player
            );

            GAME.towerMode = false;
            GAME.selectedTowerType = null;

            updateHUD();
            multiplayerPush();

            return;
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
    towerMenu
);


multiplayerButton.addEventListener(
    "click",
    multiplayerMenu
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


    /*
       HOST SIMULATES THE GAME.

       GUEST mainly receives
       the host's state.
    */

    if (
        !GAME.gameOver &&
        !GAME.victory
    ) {

        if (
            MULTI.connected &&
            !MULTI.host
        ) {

            /*
               Guest doesn't run
               the authoritative
               simulation.
            */

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
