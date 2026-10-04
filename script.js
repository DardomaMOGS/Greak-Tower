```javascript
"use strict";

/*
=========================================================
GREAK TOWER V0.1
COMPLETE FIXED BUILD
=========================================================
*/

/* ======================================================
   HTML ELEMENTS
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
   THREE.JS SCENE
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

camera.position.set(0, 30, 25);

camera.lookAt(0, 0, 0);


/* ======================================================
   RENDERER
====================================================== */

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.shadowMap.enabled = true;

game.appendChild(renderer.domElement);


/* ======================================================
   LIGHTS
====================================================== */

const ambientLight =
    new THREE.HemisphereLight(
        0xffffff,
        0x557755,
        1.8
    );

scene.add(ambientLight);


const sunlight =
    new THREE.DirectionalLight(
        0xffffff,
        2
    );

sunlight.position.set(
    10,
    30,
    10
);

sunlight.castShadow = true;

sunlight.shadow.mapSize.width = 2048;
sunlight.shadow.mapSize.height = 2048;

scene.add(sunlight);


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

const grassMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x55a630
    });


const pathMaterial =
    new THREE.MeshStandardMaterial({
        color: 0xc2a878
    });


const towerMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x2563eb
    });


const towerTopMaterial =
    new THREE.MeshStandardMaterial({
        color: 0xfacc15
    });


const enemyMaterial =
    new THREE.MeshStandardMaterial({
        color: 0xdc2626
    });


const enemyFaceMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x111827
    });


const projectileMaterial =
    new THREE.MeshStandardMaterial({
        color: 0xfde047,
        emissive: 0xfacc15,
        emissiveIntensity: 1
    });


/* ======================================================
   GROUND
====================================================== */

const ground =
    new THREE.Mesh(
        new THREE.BoxGeometry(
            34,
            1,
            26
        ),
        grassMaterial
    );

ground.position.y = -0.5;

ground.receiveShadow = true;

scene.add(ground);


/* ======================================================
   PATH
====================================================== */

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


function createPathSegment(start, end) {

    const horizontal =
        Math.abs(end.x - start.x) >
        Math.abs(end.z - start.z);


    const length = horizontal
        ? Math.abs(end.x - start.x)
        : Math.abs(end.z - start.z);


    const geometry = horizontal
        ? new THREE.BoxGeometry(
            length + 1.5,
            0.2,
            2.5
        )
        : new THREE.BoxGeometry(
            2.5,
            0.2,
            length + 1.5
        );


    const path =
        new THREE.Mesh(
            geometry,
            pathMaterial
        );


    path.position.set(
        (start.x + end.x) / 2,
        0.08,
        (start.z + end.z) / 2
    );


    path.receiveShadow = true;

    scene.add(path);
}


for (
    let i = 0;
    i < pathPoints.length - 1;
    i++
) {

    createPathSegment(
        pathPoints[i],
        pathPoints[i + 1]
    );
}


/* ======================================================
   TREES
====================================================== */

function createTree(x, z) {

    const trunk =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.7,
                2,
                0.7
            ),
            new THREE.MeshStandardMaterial({
                color: 0x7c4a21
            })
        );


    trunk.position.set(
        x,
        1,
        z
    );


    trunk.castShadow = true;

    scene.add(trunk);


    const leaves =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.2,
                2.2,
                2.2
            ),
            new THREE.MeshStandardMaterial({
                color: 0x15803d
            })
        );


    leaves.position.set(
        x,
        2.7,
        z
    );


    leaves.castShadow = true;

    scene.add(leaves);
}


[
    [-13, 6],
    [-13, -3],
    [-3, -10],
    [6, 11],
    [14, 4],
    [14, -9]
].forEach(
    position => createTree(
        position[0],
        position[1]
    )
);


/* ======================================================
   BASE
====================================================== */

function createBase() {

    const base =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                3,
                3,
                3
            ),
            new THREE.MeshStandardMaterial({
                color: 0x7c3aed
            })
        );


    base.position.set(
        15,
        1.5,
        9
    );


    base.castShadow = true;

    scene.add(base);


    const roof =
        new THREE.Mesh(
            new THREE.ConeGeometry(
                2.4,
                2,
                4
            ),
            new THREE.MeshStandardMaterial({
                color: 0xf97316
            })
        );


    roof.position.set(
        15,
        4,
        9
    );


    roof.rotation.y =
        Math.PI / 4;


    roof.castShadow = true;

    scene.add(roof);
}


createBase();


/* ======================================================
   ENEMIES
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


    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.2,
                1.2,
                1.2
            ),
            enemyMaterial
        );


    body.position.copy(
        pathPoints[0]
    );


    body.position.y = 0.7;


    body.castShadow = true;


    /*
    FACE
    */

    const eyeGeometry =
        new THREE.BoxGeometry(
            0.18,
            0.18,
            0.1
        );


    const leftEye =
        new THREE.Mesh(
            eyeGeometry,
            enemyFaceMaterial
        );


    leftEye.position.set(
        -0.25,
        0.2,
        -0.61
    );


    body.add(leftEye);


    const rightEye =
        new THREE.Mesh(
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

    enemyGroup.add(body);

    enemies.push(enemy);
}


/* ======================================================
   ENEMY DEATH
====================================================== */

function killEnemy(enemy) {

    if (!enemy.alive) {
        return;
    }


    enemy.alive = false;

    enemyGroup.remove(
        enemy.mesh
    );


    GAME.coins += enemy.reward;

    updateUI();
}


/* ======================================================
   DAMAGE
====================================================== */

function damageEnemy(
    enemy,
    amount
) {

    if (!enemy.alive) {
        return;
    }


    enemy.health -= amount;


    if (enemy.health <= 0) {

        killEnemy(enemy);
    }
}


/* ======================================================
   ENEMY MOVEMENT
====================================================== */

function updateEnemies(delta) {

    for (
        let i = enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy = enemies[i];


        if (!enemy.alive) {

            enemies.splice(i, 1);

            continue;
        }


        const nextPoint =
            pathPoints[
                enemy.pathIndex + 1
            ];


        if (!nextPoint) {

            enemy.alive = false;

            enemyGroup.remove(
                enemy.mesh
            );


            GAME.baseHealth -= 10;

            updateUI();


            if (
                GAME.baseHealth <= 0
            ) {

                endGame();
            }


            enemies.splice(i, 1);

            continue;
        }


        const direction =
            new THREE.Vector3()
                .subVectors(
                    nextPoint,
                    enemy.mesh.position
                )
                .normalize();


        enemy.mesh.position.addScaledVector(
            direction,
            enemy.speed * delta
        );


        if (
            enemy.mesh.position.distanceTo(
                nextPoint
            ) < 0.35
        ) {

            enemy.pathIndex++;
        }
    }
}


/* ======================================================
   TOWERS
====================================================== */

const towers = [];

const TOWER_COST = 50;


function createTower(position) {

    if (
        GAME.coins <
        TOWER_COST
    ) {

        showMessage(
            "Not enough coins!"
        );

        return;
    }


    GAME.coins -=
        TOWER_COST;


    const tower = {

        mesh: null,

        range: 7,

        damage: 25,

        fireRate: 0.7,

        cooldown: 0,

        target: null
    };


    const towerBase =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.6,
                1.2,
                1.6
            ),
            towerMaterial
        );


    towerBase.position.y =
        0.6;


    towerBase.castShadow = true;


    const towerTop =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1,
                1.4,
                1
            ),
            towerTopMaterial
        );


    towerTop.position.y =
        1.9;


    towerTop.castShadow = true;


    towerBase.add(
        towerTop
    );


    const barrel =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.35,
                0.35,
                1.6
            ),
            new THREE.MeshStandardMaterial({
                color: 0x374151
            })
        );


    barrel.position.set(
        0,
        0,
        -0.8
    );


    towerTop.add(
        barrel
    );


    tower.mesh =
        towerBase;


    tower.mesh.position.copy(
        position
    );


    towerGroup.add(
        tower.mesh
    );


    towers.push(
        tower
    );


    updateUI();


    showMessage(
        "🏰 Tower placed!"
    );


    GAME.towerMode =
        false;


    towerButton.textContent =
        "🏹 TOWER — $50";
}


/* ======================================================
   TARGETING
====================================================== */

function findTarget(tower) {

    let bestTarget = null;

    let bestDistance =
        Infinity;


    for (
        const enemy of enemies
    ) {

        if (!enemy.alive) {
            continue;
        }


        const distance =
            tower.mesh.position.distanceTo(
                enemy.mesh.position
            );


        if (
            distance <= tower.range &&
            distance < bestDistance
        ) {

            bestDistance =
                distance;

            bestTarget =
                enemy;
        }
    }


    return bestTarget;
}


/* ======================================================
   PROJECTILES
====================================================== */

const projectiles = [];


function fireProjectile(
    tower,
    target
) {

    const projectile =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.2,
                8,
                8
            ),
            projectileMaterial
        );


    projectile.position.copy(
        tower.mesh.position
    );


    projectile.position.y += 2;


    projectileGroup.add(
        projectile
    );


    projectiles.push({

        mesh: projectile,

        target: target,

        speed: 14,

        damage: tower.damage
    });
}


/* ======================================================
   PROJECTILE UPDATE
====================================================== */

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


        if (
            !projectile.target ||
            !projectile.target.alive
        ) {

            projectileGroup.remove(
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


            projectiles.splice(
                i,
                1
            );
        }
    }
}


/* ======================================================
   TOWER UPDATE
====================================================== */

function updateTowers(delta) {

    for (
        const tower of towers
    ) {

        tower.cooldown -=
            delta;


        if (
            !tower.target ||
            !tower.target.alive ||
            tower.mesh.position.distanceTo(
                tower.target.mesh.position
            ) > tower.range
        ) {

            tower.target =
                findTarget(tower);
        }


        if (
            tower.target &&
            tower.cooldown <= 0
        ) {

            fireProjectile(
                tower,
                tower.target
            );


            tower.cooldown =
                tower.fireRate;
        }


        if (tower.target) {

            const target =
                tower.target.mesh.position.clone();


            target.y =
                1.9;


            const towerHead =
                tower.mesh.children[0];


            towerHead.lookAt(
                target
            );
        }
    }
}


/* ======================================================
   WAVES
====================================================== */

function startWave() {

    if (
        GAME.waveRunning ||
        GAME.gameOver
    ) {
        return;
    }


    GAME.waveRunning =
        true;


    GAME.enemiesToSpawn =
        4 + GAME.wave * 2;


    GAME.enemiesSpawned =
        0;


    GAME.spawnTimer =
        0;


    startWaveButton.textContent =
        "🌊 WAVE RUNNING";


    showMessage(
        `🌊 Wave ${GAME.wave} started!`
    );
}


function updateWave(delta) {

    if (!GAME.waveRunning) {
        return;
    }


    GAME.spawnTimer -=
        delta;


    if (
        GAME.enemiesSpawned <
            GAME.enemiesToSpawn &&
        GAME.spawnTimer <= 0
    ) {

        createEnemy();


        GAME.enemiesSpawned++;


        GAME.spawnTimer =
            Math.max(
                0.45,
                0.9 -
                GAME.wave * 0.02
            );
    }


    if (
        GAME.enemiesSpawned >=
            GAME.enemiesToSpawn &&
        enemies.length === 0
    ) {

        GAME.waveRunning =
            false;


        GAME.wave++;


        GAME.coins += 25;


        updateUI();


        startWaveButton.textContent =
            "▶ START WAVE";


        showMessage(
            "🏆 Wave complete! +25 coins"
        );
    }
}


/* ======================================================
   PATH COLLISION
====================================================== */

function isOnPath(position) {

    const PATH_WIDTH =
        2.2;


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


        if (horizontal) {

            const minX =
                Math.min(
                    a.x,
                    b.x
                ) - 0.8;


            const maxX =
                Math.max(
                    a.x,
                    b.x
                ) + 0.8;


            if (
                position.x >= minX &&
                position.x <= maxX &&
                Math.abs(
                    position.z - a.z
                ) < PATH_WIDTH
            ) {

                return true;
            }

        } else {

            const minZ =
                Math.min(
                    a.z,
                    b.z
                ) - 0.8;


            const maxZ =
                Math.max(
                    a.z,
                    b.z
                ) + 0.8;


            if (
                position.z >= minZ &&
                position.z <= maxZ &&
                Math.abs(
                    position.x - a.x
                ) < PATH_WIDTH
            ) {

                return true;
            }
        }
    }


    return false;
}


/* ======================================================
   TOWER PLACEMENT
====================================================== */

const raycaster =
    new THREE.Raycaster();


const mouse =
    new THREE.Vector2();


const placementPlane =
    new THREE.Plane(
        new THREE.Vector3(
            0,
            1,
            0
        ),
        0
    );


function getPlacementPosition(
    event
) {

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
            (event.clientY -
                rect.top) /
            rect.height
        ) * 2 + 1;


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
        return null;
    }


    return position;
}


/* ======================================================
   MAP CLICK
====================================================== */

renderer.domElement.addEventListener(
    "pointerdown",
    event => {

        if (
            !GAME.towerMode ||
            GAME.gameOver
        ) {

            return;
        }


        const position =
            getPlacementPosition(
                event
            );


        if (!position) {

            showMessage(
                "Can't place a tower here."
            );

            return;
        }


        /*
        Keep towers inside the map.
        */

        if (
            position.x < -16 ||
            position.x > 16 ||
            position.z < -12 ||
            position.z > 12
        ) {

            showMessage(
                "Stay inside the map!"
            );

            return;
        }


        /*
        Don't place on the path.
        */

        if (
            isOnPath(position)
        ) {

            showMessage(
                "🚫 You can't place a tower on the path!"
            );

            return;
        }


        /*
        Don't place too close
        to another tower.
        */

        for (
            const tower of towers
        ) {

            if (
                tower.mesh.position.distanceTo(
                    position
                ) < 2
            ) {

                showMessage(
                    "🚫 Too close to another tower!"
                );

                return;
            }
        }


        createTower(
            position
        );
    }
);


/* ======================================================
   START WAVE BUTTON
====================================================== */

startWaveButton.addEventListener(
    "click",
    startWave
);


/* ======================================================
   TOWER BUTTON
====================================================== */

towerButton.addEventListener(
    "click",
    () => {

        if (GAME.gameOver) {
            return;
        }


        if (
            GAME.coins <
            TOWER_COST
        ) {

            showMessage(
                "💰 You need 50 coins!"
            );

            return;
        }


        GAME.towerMode =
            !GAME.towerMode;


        if (
            GAME.towerMode
        ) {

            towerButton.textContent =
                "❌ CANCEL TOWER";


            showMessage(
                "🏹 Click an empty area to place your tower!"
            );

        } else {

            towerButton.textContent =
                "🏹 TOWER — $50";
        }
    }
);


/* ======================================================
   UI
====================================================== */

function updateUI() {

    coinsElement.textContent =
        GAME.coins;


    healthElement.textContent =
        Math.max(
            0,
            GAME.baseHealth
        );


    waveElement.textContent =
        GAME.wave;
}


/* ======================================================
   MESSAGE
====================================================== */

let messageTimeout;


function showMessage(
    message
) {

    messageElement.textContent =
        message;


    messageElement.classList.add(
        "show"
    );


    clearTimeout(
        messageTimeout
    );


    messageTimeout =
        setTimeout(
            () => {

                messageElement.classList.remove(
                    "show"
                );

            },
            1800
        );
}


/* ======================================================
   GAME OVER
====================================================== */

function endGame() {

    if (GAME.gameOver) {
        return;
    }


    GAME.gameOver =
        true;


    GAME.waveRunning =
        false;


    GAME.towerMode =
        false;


    startWaveButton.textContent =
        "💀 GAME OVER";


    towerButton.textContent =
        "🏹 TOWER — $50";


    showMessage(
        "💀 GAME OVER! Refresh to play again."
    );
}


/* ======================================================
   RESIZE
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

        updateWave(
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


    renderer.render(
        scene,
        camera
    );
}


/* ======================================================
   START
====================================================== */

updateUI();


showMessage(
    "🏰 Welcome to GREAK TOWER!"
);


animate();
```
