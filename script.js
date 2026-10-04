"use strict";

/* =========================================================
   GREAK TOWER V0.5
   Strategy + Abilities + Targeting + Wave Preview
   ========================================================= */

const $ = id => document.getElementById(id);

/* =========================================================
   GAME STATE
   ========================================================= */

const GAME = {
    coins: 100,
    baseHealth: 100,
    wave: 1,

    waveRunning: false,
    gameOver: false,
    victory: false,

    spawnQueue: [],
    spawnIndex: 0,
    spawnTimer: 0,

    towerMode: false,
    selectedTowerType: null,
    selectedTower: null,

    enemies: [],
    towers: [],
    projectiles: [],
    effects: [],

    waveBonus: 25,

    maxVictoryWave: 15
};

/* =========================================================
   THREE.JS SETUP
   ========================================================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
    55,
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

$("game").appendChild(renderer.domElement);

/* =========================================================
   LIGHTING
   ========================================================= */

const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambientLight);

const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 25, 10);
sun.castShadow = true;

scene.add(sun);

/* =========================================================
   MATERIALS
   ========================================================= */

const materials = {
    grass: new THREE.MeshLambertMaterial({ color: 0x43a047 }),
    path: new THREE.MeshLambertMaterial({ color: 0xd6b27a }),
    tree: new THREE.MeshLambertMaterial({ color: 0x2e7d32 }),
    trunk: new THREE.MeshLambertMaterial({ color: 0x795548 }),
    base: new THREE.MeshLambertMaterial({ color: 0x7e57c2 }),
    roof: new THREE.MeshLambertMaterial({ color: 0xff9800 })
};

/* =========================================================
   GROUND
   ========================================================= */

const ground = new THREE.Mesh(
    new THREE.BoxGeometry(34, 1, 26),
    materials.grass
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

for (let i = 0; i < pathPoints.length - 1; i++) {
    const a = pathPoints[i];
    const b = pathPoints[i + 1];

    const horizontal = Math.abs(a.x - b.x) > Math.abs(a.z - b.z);

    const length = horizontal
        ? Math.abs(a.x - b.x)
        : Math.abs(a.z - b.z);

    const geometry = new THREE.BoxGeometry(
        horizontal ? length + 3.5 : 3.5,
        0.18,
        horizontal ? 3.5 : length + 3.5
    );

    const mesh = new THREE.Mesh(
        geometry,
        materials.path
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
    const group = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.45, 2.5, 8),
        materials.trunk
    );

    trunk.position.y = 1.25;
    trunk.castShadow = true;

    const leaves = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 8, 8),
        materials.tree
    );

    leaves.position.y = 3;
    leaves.castShadow = true;

    group.add(trunk);
    group.add(leaves);

    group.position.set(x, 0, z);

    scene.add(group);
}

treePositions.forEach(p => createTree(p[0], p[1]));

/* =========================================================
   BASE
   ========================================================= */

const base = new THREE.Group();

const baseBody = new THREE.Mesh(
    new THREE.BoxGeometry(3, 3, 3),
    materials.base
);

baseBody.position.y = 1.5;
baseBody.castShadow = true;

const baseRoof = new THREE.Mesh(
    new THREE.ConeGeometry(2.3, 2, 4),
    materials.roof
);

baseRoof.position.y = 4;

base.add(baseBody);
base.add(baseRoof);

base.position.set(15, 0, 9);

scene.add(base);

/* =========================================================
   TOWER TYPES
   ========================================================= */

const TOWER_TYPES = {
    archer: {
        name: "Archer",
        icon: "🏹",
        cost: 50,
        range: 7,
        damage: 20,
        fireRate: 0.45,
        projectileSpeed: 18,
        projectileSize: 0.18,
        bodyColor: 0x1976d2,
        headColor: 0x90caf9,
        barrelColor: 0x222222,
        bonusType: "fast",
        abilityName: "RAPID FIRE",
        abilityCooldown: 15
    },

    cannon: {
        name: "Cannon",
        icon: "💣",
        cost: 100,
        range: 6.5,
        damage: 55,
        fireRate: 1.5,
        projectileSpeed: 11,
        projectileSize: 0.32,
        bodyColor: 0x555555,
        headColor: 0x777777,
        barrelColor: 0xff9800,
        bonusType: "tank",
        abilityName: "BIG BLAST",
        abilityCooldown: 20
    },

    magic: {
        name: "Magic",
        icon: "🔮",
        cost: 150,
        range: 10,
        damage: 40,
        fireRate: 0.8,
        projectileSpeed: 15,
        projectileSize: 0.25,
        bodyColor: 0x7b1fa2,
        headColor: 0xce93d8,
        barrelColor: 0xff00ff,
        bonusType: "boss",
        abilityName: "LIGHTNING",
        abilityCooldown: 18
    }
};

/* =========================================================
   UPGRADE DATA
   ========================================================= */

const UPGRADE_COSTS = {
    archer: [0, 75, 125],
    cannon: [0, 125, 200],
    magic: [0, 175, 275]
};

const LEVEL_STATS = [
    {
        damage: 1,
        range: 1,
        fireRate: 1
    },
    {
        damage: 1.5,
        range: 1.15,
        fireRate: 0.82
    },
    {
        damage: 2.2,
        range: 1.3,
        fireRate: 0.68
    }
];

/* =========================================================
   SOUND SYSTEM
   ========================================================= */

let audioContext = null;

function sound(frequency, duration = 0.08, type = "square") {
    try {
        if (!audioContext) {
            audioContext = new (
                window.AudioContext ||
                window.webkitAudioContext
            )();
        }

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(
            0.04,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + duration
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(
            audioContext.currentTime + duration
        );
    } catch (e) {}
}

/* =========================================================
   MESSAGE
   ========================================================= */

function message(text, duration = 1800) {
    const box = $("message");

    box.textContent = text;
    box.style.opacity = "1";

    clearTimeout(box._timer);

    box._timer = setTimeout(() => {
        box.style.opacity = "0";
    }, duration);
}

/* =========================================================
   HUD
   ========================================================= */

function updateHUD() {
    $("coins").textContent = Math.floor(GAME.coins);
    $("baseHealth").textContent = Math.max(
        0,
        Math.floor(GAME.baseHealth)
    );
    $("wave").textContent = GAME.wave;
}

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
   BOSS UI
   ========================================================= */

let bossUI = null;

function createBossUI() {
    if (bossUI) return;

    bossUI = document.createElement("div");

    bossUI.style.position = "fixed";
    bossUI.style.top = "75px";
    bossUI.style.left = "50%";
    bossUI.style.transform = "translateX(-50%)";
    bossUI.style.width = "min(500px, 80vw)";
    bossUI.style.background = "#222";
    bossUI.style.border = "3px solid gold";
    bossUI.style.padding = "5px";
    bossUI.style.borderRadius = "8px";
    bossUI.style.zIndex = "20";
    bossUI.style.display = "none";

    const title = document.createElement("div");

    title.id = "bossTitle";
    title.style.color = "white";
    title.style.textAlign = "center";
    title.style.fontWeight = "bold";

    const barOuter = document.createElement("div");

    barOuter.style.height = "18px";
    barOuter.style.background = "#111";
    barOuter.style.marginTop = "4px";
    barOuter.style.borderRadius = "5px";
    barOuter.style.overflow = "hidden";

    const bar = document.createElement("div");

    bar.id = "bossBar";
    bar.style.height = "100%";
    bar.style.width = "100%";
    bar.style.background = "#e53935";

    barOuter.appendChild(bar);

    bossUI.appendChild(title);
    bossUI.appendChild(barOuter);

    document.body.appendChild(bossUI);
}

createBossUI();

function updateBossUI(enemy) {
    if (!bossUI || !enemy || enemy.type !== "boss") return;

    bossUI.style.display = "block";

    const percent = Math.max(
        0,
        enemy.health / enemy.maxHealth * 100
    );

    $("bossTitle").textContent =
        `👑 BOSS — ${Math.ceil(enemy.health)} HP`;

    $("bossBar").style.width = `${percent}%`;
}

function hideBossUI() {
    if (bossUI) {
        bossUI.style.display = "none";
    }
}

/* =========================================================
   ENEMY HEALTH BAR
   ========================================================= */

function createHealthBar(enemy) {
    const group = new THREE.Group();

    const background = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 0.16),
        new THREE.MeshBasicMaterial({
            color: 0x111111,
            side: THREE.DoubleSide
        })
    );

    const fill = new THREE.Mesh(
        new THREE.PlaneGeometry(1.35, 0.11),
        new THREE.MeshBasicMaterial({
            color: 0x32cd32,
            side: THREE.DoubleSide
        })
    );

    fill.position.z = 0.01;

    group.add(background);
    group.add(fill);

    group.position.y = 2.7;

    enemy.model.add(group);

    enemy.healthBar = group;
    enemy.healthFill = fill;
}

function updateHealthBar(enemy) {
    if (!enemy.healthFill) return;

    const ratio = Math.max(
        0,
        enemy.health / enemy.maxHealth
    );

    enemy.healthFill.scale.x = ratio;
    enemy.healthFill.position.x =
        -0.675 + 0.675 * ratio;

    enemy.healthBar.lookAt(camera.position);
}

/* =========================================================
   CREATE ENEMY
   ========================================================= */

function createEnemy(typeName) {
    const type = ENEMY_TYPES[typeName];

    const group = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.45,
            0.55,
            1.1,
            8
        ),
        new THREE.MeshLambertMaterial({
            color: type.body
        })
    );

    body.position.y = 1;
    body.castShadow = true;

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(
            0.45,
            12,
            12
        ),
        new THREE.MeshLambertMaterial({
            color: type.head
        })
    );

    head.position.y = 1.85;
    head.castShadow = true;

    const eyeMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xffffff
        });

    const eye1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 6, 6),
        eyeMaterial
    );

    const eye2 = eye1.clone();

    eye1.position.set(-0.16, 1.92, -0.38);
    eye2.position.set(0.16, 1.92, -0.38);

    const armGeometry =
        new THREE.BoxGeometry(0.2, 0.8, 0.2);

    const arm1 = new THREE.Mesh(
        armGeometry,
        new THREE.MeshLambertMaterial({
            color: type.body
        })
    );

    const arm2 = arm1.clone();

    arm1.position.set(-0.62, 1, 0);
    arm2.position.set(0.62, 1, 0);

    const legGeometry =
        new THREE.BoxGeometry(0.25, 0.8, 0.25);

    const leg1 = new THREE.Mesh(
        legGeometry,
        new THREE.MeshLambertMaterial({
            color: type.body
        })
    );

    const leg2 = leg1.clone();

    leg1.position.set(-0.2, 0.35, 0);
    leg2.position.set(0.2, 0.35, 0);

    group.add(
        body,
        head,
        eye1,
        eye2,
        arm1,
        arm2,
        leg1,
        leg2
    );

    if (typeName === "fast") {
        const fin = new THREE.Mesh(
            new THREE.ConeGeometry(0.35, 0.8, 4),
            new THREE.MeshLambertMaterial({
                color: 0x00ffff
            })
        );

        fin.rotation.z = Math.PI / 2;
        fin.position.set(0, 1.6, 0.6);

        group.add(fin);
    }

    if (typeName === "tank") {
        const armor = new THREE.Mesh(
            new THREE.BoxGeometry(1.25, 1.4, 1.25),
            new THREE.MeshLambertMaterial({
                color: 0x7b1fa2,
                transparent: true,
                opacity: 0.45
            })
        );

        armor.position.y = 1.1;

        group.add(armor);
    }

    if (typeName === "boss") {
        const crown = new THREE.Mesh(
            new THREE.ConeGeometry(0.65, 0.8, 5),
            new THREE.MeshLambertMaterial({
                color: 0xffd700
            })
        );

        crown.position.y = 2.55;

        group.add(crown);
    }

    group.scale.setScalar(type.scale);

    group.position.copy(pathPoints[0]);
    group.position.y = 0;

    scene.add(group);

    const enemy = {
        type: typeName,
        model: group,

        health: type.health,
        maxHealth: type.health,

        speed: type.speed,
        reward: type.reward,

        pathIndex: 0,
        alive: true
    };

    createHealthBar(enemy);

    GAME.enemies.push(enemy);

    if (typeName === "boss") {
        updateBossUI(enemy);
        message("👑 BOSS HAS ENTERED THE BATTLE!", 2500);
        sound(90, 0.5, "sawtooth");
    }
}

/* =========================================================
   WAVE GENERATION
   ========================================================= */

function buildWave(wave) {
    const queue = [];

    const amount = 4 + wave * 2;

    for (let i = 0; i < amount; i++) {
        if (wave === 1) {
            queue.push("basic");
        } else if (wave === 2) {
            queue.push(
                i % 3 === 0 ? "fast" : "basic"
            );
        } else if (wave === 3) {
            if (i % 5 === 0) {
                queue.push("tank");
            } else if (i % 3 === 0) {
                queue.push("fast");
            } else {
                queue.push("basic");
            }
        } else {
            const roll = Math.random();

            if (roll < 0.15) {
                queue.push("tank");
            } else if (roll < 0.40) {
                queue.push("fast");
            } else {
                queue.push("basic");
            }
        }
    }

    if (wave % 5 === 0) {
        queue.push("boss");
    }

    return queue;
}

/* =========================================================
   WAVE PREVIEW
   ========================================================= */

function showWavePreview() {
    const queue = buildWave(GAME.wave);

    const counts = {
        basic: 0,
        fast: 0,
        tank: 0,
        boss: 0
    };

    queue.forEach(type => {
        counts[type]++;
    });

    const panel = document.createElement("div");

    panel.id = "wavePreview";

    panel.style.position = "fixed";
    panel.style.left = "50%";
    panel.style.top = "50%";
    panel.style.transform = "translate(-50%, -50%)";
    panel.style.background = "rgba(15,15,25,0.96)";
    panel.style.color = "white";
    panel.style.padding = "24px";
    panel.style.borderRadius = "14px";
    panel.style.border = "2px solid #777";
    panel.style.zIndex = "50";
    panel.style.minWidth = "280px";
    panel.style.textAlign = "center";
    panel.style.boxShadow = "0 10px 40px rgba(0,0,0,.5)";

    panel.innerHTML = `
        <h2 style="margin-top:0">
            🌊 WAVE ${GAME.wave}
        </h2>

        <div style="font-size:18px;line-height:1.8">
            🔴 Basic × ${counts.basic}<br>
            🟢 Fast × ${counts.fast}<br>
            🟣 Tank × ${counts.tank}<br>
            👑 Boss × ${counts.boss}
        </div>

        <div style="margin:15px 0;font-size:18px">
            ${getDifficultyText()}
        </div>

        <button id="previewStart"
            style="
                padding:12px 22px;
                border:0;
                border-radius:8px;
                cursor:pointer;
                font-weight:bold;
            ">
            START WAVE
        </button>

        <button id="previewCancel"
            style="
                padding:12px 22px;
                margin-left:8px;
                border:0;
                border-radius:8px;
                cursor:pointer;
            ">
            CANCEL
        </button>
    `;

    document.body.appendChild(panel);

    $("previewStart").onclick = () => {
        panel.remove();
        beginWave(queue);
    };

    $("previewCancel").onclick = () => {
        panel.remove();
    };
}

function getDifficultyText() {
    if (GAME.wave <= 3) {
        return "Difficulty: ⭐";
    }

    if (GAME.wave <= 6) {
        return "Difficulty: ⭐⭐";
    }

    if (GAME.wave <= 10) {
        return "Difficulty: ⭐⭐⭐";
    }

    if (GAME.wave <= 14) {
        return "Difficulty: ⭐⭐⭐⭐";
    }

    return "Difficulty: ⭐⭐⭐⭐⭐";
}

/* =========================================================
   START WAVE
   ========================================================= */

function beginWave(queue) {
    if (
        GAME.waveRunning ||
        GAME.gameOver ||
        GAME.victory
    ) {
        return;
    }

    GAME.waveRunning = true;
    GAME.spawnQueue = queue;
    GAME.spawnIndex = 0;
    GAME.spawnTimer = 0;

    message(`🌊 WAVE ${GAME.wave} STARTED!`);

    sound(500, 0.12);
}

/* =========================================================
   START BUTTON
   ========================================================= */

$("startWave").onclick = () => {
    if (GAME.gameOver || GAME.victory) return;

    if (GAME.waveRunning) {
        message("Wave already running!");
        return;
    }

    showWavePreview();
};

/* =========================================================
   CREATE TOWER
   ========================================================= */

function createTower(typeName, position) {
    const type = TOWER_TYPES[typeName];

    if (GAME.coins < type.cost) {
        message("❌ Not enough coins!");
        return null;
    }

    GAME.coins -= type.cost;

    const group = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.7,
            0.8,
            0.8,
            8
        ),
        new THREE.MeshLambertMaterial({
            color: type.bodyColor
        })
    );

    body.position.y = 0.7;
    body.castShadow = true;

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.65, 10, 10),
        new THREE.MeshLambertMaterial({
            color: type.headColor
        })
    );

    head.position.y = 1.35;
    head.castShadow = true;

    const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.18,
            0.18,
            1.6,
            8
        ),
        new THREE.MeshLambertMaterial({
            color: type.barrelColor
        })
    );

    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.8, 1.35, 0);

    barrel.castShadow = true;

    group.add(body);
    group.add(head);
    group.add(barrel);

    group.position.copy(position);

    scene.add(group);

    const tower = {
        type: typeName,
        mesh: group,

        level: 1,

        range: type.range,
        damage: type.damage,
        fireRate: type.fireRate,

        cooldown: 0,

        targeting: "first",

        abilityCooldown: 0,
        abilityActive: false,

        spent: type.cost,

        barrel
    };

    GAME.towers.push(tower);

    group.userData.tower = tower;

    updateHUD();

    message(`${type.icon} ${type.name} placed!`);

    sound(700, 0.08);

    return tower;
}

/* =========================================================
   TOWER STATS
   ========================================================= */

function updateTowerStats(tower) {
    const base = TOWER_TYPES[tower.type];
    const multiplier = LEVEL_STATS[tower.level - 1];

    tower.damage =
        base.damage * multiplier.damage;

    tower.range =
        base.range * multiplier.range;

    tower.fireRate =
        base.fireRate * multiplier.fireRate;
}

/* =========================================================
   TOWER MENU
   ========================================================= */

let towerMenu = null;

function openTowerMenu() {
    if (towerMenu) return;

    towerMenu = document.createElement("div");

    towerMenu.style.position = "fixed";
    towerMenu.style.bottom = "90px";
    towerMenu.style.left = "50%";
    towerMenu.style.transform = "translateX(-50%)";
    towerMenu.style.background = "rgba(20,20,25,.96)";
    towerMenu.style.padding = "12px";
    towerMenu.style.borderRadius = "12px";
    towerMenu.style.display = "flex";
    towerMenu.style.gap = "8px";
    towerMenu.style.zIndex = "30";

    Object.entries(TOWER_TYPES).forEach(
        ([key, type]) => {

            const button =
                document.createElement("button");

            button.textContent =
                `${type.icon} ${type.name} ${type.cost}💰`;

            button.style.padding = "10px";
            button.style.cursor = "pointer";

            button.onclick = () => {
                GAME.selectedTowerType = key;
                GAME.towerMode = true;

                towerMenu.remove();
                towerMenu = null;

                message(
                    `Click the ground to place a ${type.name}.`
                );
            };

            towerMenu.appendChild(button);
        }
    );

    const close = document.createElement("button");

    close.textContent = "✖";

    close.onclick = () => {
        towerMenu.remove();
        towerMenu = null;
    };

    towerMenu.appendChild(close);

    document.body.appendChild(towerMenu);
}

/* =========================================================
   TOWER BUTTON
   ========================================================= */

$("towerButton").onclick = () => {
    if (GAME.gameOver || GAME.victory) return;

    if (GAME.towerMode) {
        GAME.towerMode = false;
        GAME.selectedTowerType = null;

        message("Tower placement cancelled.");
        return;
    }

    openTowerMenu();
};

/* =========================================================
   TOWER SELECTION PANEL
   ========================================================= */

let towerPanel = null;

function closeTowerPanel() {
    if (towerPanel) {
        towerPanel.remove();
        towerPanel = null;
    }

    GAME.selectedTower = null;
}

function openTowerPanel(tower) {
    closeTowerPanel();

    GAME.selectedTower = tower;

    const type = TOWER_TYPES[tower.type];

    towerPanel = document.createElement("div");

    towerPanel.style.position = "fixed";
    towerPanel.style.right = "15px";
    towerPanel.style.top = "100px";
    towerPanel.style.width = "250px";
    towerPanel.style.background = "rgba(20,20,25,.97)";
    towerPanel.style.color = "white";
    towerPanel.style.padding = "16px";
    towerPanel.style.borderRadius = "12px";
    towerPanel.style.zIndex = "40";

    towerPanel.innerHTML = `
        <button id="closeTowerPanel"
            style="float:right">✖</button>

        <h2>
            ${type.icon} ${type.name}
        </h2>

        <div id="towerPanelStats"></div>

        <div style="margin-top:10px">
            Target:
        </div>

        <select id="targetSelect"
            style="width:100%;padding:8px;margin-top:5px">

            <option value="first">First</option>
            <option value="last">Last</option>
            <option value="strongest">Strongest</option>
            <option value="closest">Closest</option>

        </select>

        <button id="upgradeTower"
            style="
                width:100%;
                margin-top:12px;
                padding:10px;
            ">
        </button>

        <button id="abilityTower"
            style="
                width:100%;
                margin-top:8px;
                padding:10px;
            ">
        </button>

        <button id="sellTower"
            style="
                width:100%;
                margin-top:8px;
                padding:10px;
            ">
            💰 SELL
        </button>
    `;

    document.body.appendChild(towerPanel);

    $("closeTowerPanel").onclick =
        closeTowerPanel;

    $("targetSelect").value =
        tower.targeting;

    $("targetSelect").onchange = e => {
        tower.targeting = e.target.value;

        message(
            `🎯 Targeting: ${e.target.options[e.target.selectedIndex].text}`
        );
    };

    $("upgradeTower").onclick = () => {
        upgradeTower(tower);
    };

    $("abilityTower").onclick = () => {
        activateAbility(tower);
    };

    $("sellTower").onclick = () => {
        sellTower(tower);
    };

    updateTowerPanel();
}

function updateTowerPanel() {
    if (!towerPanel || !GAME.selectedTower) {
        return;
    }

    const tower = GAME.selectedTower;
    const type = TOWER_TYPES[tower.type];

    const upgradeCost =
        tower.level < 3
            ? UPGRADE_COSTS[tower.type][tower.level]
            : 0;

    const stats = $("towerPanelStats");

    stats.innerHTML = `
        <b>Level:</b> ${tower.level}/3<br>
        <b>Damage:</b> ${Math.round(tower.damage)}<br>
        <b>Range:</b> ${tower.range.toFixed(1)}<br>
        <b>Attack:</b> ${tower.fireRate.toFixed(2)}s<br>
        <b>Ability:</b> ${type.abilityName}
    `;

    const upgradeButton =
        $("upgradeTower");

    if (tower.level >= 3) {
        upgradeButton.textContent =
            "⭐ MAX LEVEL";
        upgradeButton.disabled = true;
    } else {
        upgradeButton.textContent =
            `⬆️ UPGRADE — ${upgradeCost}💰`;

        upgradeButton.disabled =
            GAME.coins < upgradeCost;
    }

    const abilityButton =
        $("abilityTower");

    if (tower.abilityCooldown > 0) {
        abilityButton.textContent =
            `⚡ ${type.abilityName} — ${tower.abilityCooldown.toFixed(1)}s`;
    } else {
        abilityButton.textContent =
            `⚡ ${type.abilityName} READY`;
    }
}

/* =========================================================
   UPGRADE
   ========================================================= */

function upgradeTower(tower) {
    if (tower.level >= 3) {
        message("⭐ Tower is already max level!");
        return;
    }

    const cost =
        UPGRADE_COSTS[tower.type][tower.level];

    if (GAME.coins < cost) {
        message("❌ Not enough coins!");
        return;
    }

    GAME.coins -= cost;

    tower.level++;
    tower.spent += cost;

    updateTowerStats(tower);

    const scale =
        1 + 0.08 * (tower.level - 1);

    tower.mesh.scale.setScalar(scale);

    message(
        `⬆️ ${TOWER_TYPES[tower.type].name} upgraded to Level ${tower.level}!`
    );

    sound(850, 0.15);

    updateHUD();
    updateTowerPanel();
}

/* =========================================================
   SELL
   ========================================================= */

function sellTower(tower) {
    const refund =
        Math.floor(tower.spent * 0.6);

    GAME.coins += refund;

    scene.remove(tower.mesh);

    const index =
        GAME.towers.indexOf(tower);

    if (index !== -1) {
        GAME.towers.splice(index, 1);
    }

    closeTowerPanel();

    message(`💰 Tower sold for ${refund} coins.`);

    sound(300, 0.1);

    updateHUD();
}

/* =========================================================
   TARGETING
   ========================================================= */

function selectTarget(tower) {
    const valid = GAME.enemies.filter(enemy => {
        if (!enemy.alive) return false;

        const distance =
            tower.mesh.position.distanceTo(
                enemy.model.position
            );

        return distance <= tower.range;
    });

    if (!valid.length) return null;

    if (tower.targeting === "strongest") {
        return valid.reduce(
            (best, enemy) =>
                enemy.health > best.health
                    ? enemy
                    : best
        );
    }

    if (tower.targeting === "closest") {
        return valid.reduce(
            (best, enemy) =>
                tower.mesh.position.distanceTo(
                    enemy.model.position
                ) <
                tower.mesh.position.distanceTo(
                    best.model.position
                )
                    ? enemy
                    : best
        );
    }

    if (tower.targeting === "last") {
        return valid.reduce(
            (best, enemy) =>
                enemy.pathIndex < best.pathIndex
                    ? enemy
                    : best
        );
    }

    return valid.reduce(
        (best, enemy) =>
            enemy.pathIndex > best.pathIndex
                ? enemy
                : best
    );
}

/* =========================================================
   PROJECTILE
   ========================================================= */

function fireProjectile(tower, target) {
    const type = TOWER_TYPES[tower.type];

    const projectile = new THREE.Mesh(
        new THREE.SphereGeometry(
            type.projectileSize,
            8,
            8
        ),
        new THREE.MeshBasicMaterial({
            color:
                tower.type === "archer"
                    ? 0x00bfff
                    : tower.type === "cannon"
                        ? 0xff9800
                        : 0xff00ff
        })
    );

    projectile.position.copy(
        tower.mesh.position
    );

    projectile.position.y += 1.4;

    scene.add(projectile);

    GAME.projectiles.push({
        mesh: projectile,
        tower,
        target,
        speed: type.projectileSpeed
    });

    sound(
        tower.type === "magic"
            ? 900
            : tower.type === "cannon"
                ? 180
                : 600,
        0.05
    );
}

/* =========================================================
   DAMAGE
   ========================================================= */

function damageEnemy(enemy, amount, tower) {
    if (!enemy.alive) return;

    let damage = amount;

    if (
        tower.type === "archer" &&
        enemy.type === "fast"
    ) {
        damage *= 1.25;
    }

    if (
        tower.type === "cannon" &&
        enemy.type === "tank"
    ) {
        damage *= 1.35;
    }

    if (
        tower.type === "magic" &&
        enemy.type === "boss"
    ) {
        damage *= 1.15;
    }

    enemy.health -= damage;

    createHitEffect(
        enemy.model.position.clone(),
        tower.type
    );

    if (enemy.type === "boss") {
        updateBossUI(enemy);
    }

    updateHealthBar(enemy);

    if (enemy.health <= 0) {
        destroyEnemy(enemy);
    }
}

/* =========================================================
   HIT EFFECT
   ========================================================= */

function createHitEffect(position, type) {
    const color =
        type === "magic"
            ? 0xff00ff
            : type === "cannon"
                ? 0xff9800
                : 0x00bfff;

    const geometry =
        new THREE.SphereGeometry(
            0.18,
            6,
            6
        );

    const material =
        new THREE.MeshBasicMaterial({
            color,
            transparent: true
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
        life: 0.25
    });
}

/* =========================================================
   DESTROY ENEMY
   ========================================================= */

function destroyEnemy(enemy) {
    if (!enemy.alive) return;

    enemy.alive = false;

    GAME.coins += enemy.reward;

    scene.remove(enemy.model);

    const index =
        GAME.enemies.indexOf(enemy);

    if (index !== -1) {
        GAME.enemies.splice(index, 1);
    }

    if (enemy.type === "boss") {
        hideBossUI();
        message("👑 BOSS DEFEATED! +100 COINS!", 2200);
        sound(1000, 0.35, "triangle");
    }

    updateHUD();
}

/* =========================================================
   REACH BASE
   ========================================================= */

function reachBase(enemy) {
    enemy.alive = false;

    scene.remove(enemy.model);

    const index =
        GAME.enemies.indexOf(enemy);

    if (index !== -1) {
        GAME.enemies.splice(index, 1);
    }

    let damage = 10;

    if (enemy.type === "tank") {
        damage = 20;
    }

    if (enemy.type === "boss") {
        damage = 40;
        hideBossUI();
    }

    GAME.baseHealth -= damage;

    message(
        `💥 ${ENEMY_TYPES[enemy.type].name} reached the base! -${damage} HP`
    );

    sound(100, 0.15, "sawtooth");

    updateHUD();

    if (GAME.baseHealth <= 0) {
        gameOver();
    }
}

/* =========================================================
   MOVE ENEMIES
   ========================================================= */

function updateEnemies(delta) {
    for (const enemy of [...GAME.enemies]) {
        if (!enemy.alive) continue;

        if (
            enemy.pathIndex >=
            pathPoints.length - 1
        ) {
            reachBase(enemy);
            continue;
        }

        const target =
            pathPoints[enemy.pathIndex + 1];

        const direction =
            new THREE.Vector3()
                .subVectors(
                    target,
                    enemy.model.position
                )
                .normalize();

        const speedMultiplier =
            enemy.type === "boss"
                ? 1
                : 1 + GAME.wave * 0.025;

        enemy.model.position.add(
            direction.multiplyScalar(
                enemy.speed *
                speedMultiplier *
                delta
            )
        );

        const distance =
            enemy.model.position.distanceTo(target);

        if (distance < 0.25) {
            enemy.pathIndex++;
        }

        updateHealthBar(enemy);

        if (enemy.type === "boss") {
            updateBossUI(enemy);
        }
    }
}

/* =========================================================
   TOWERS
   ========================================================= */

function updateTowers(delta) {
    for (const tower of GAME.towers) {
        tower.cooldown -= delta;
        tower.abilityCooldown -= delta;

        const target =
            selectTarget(tower);

        if (!target) continue;

        const targetPosition =
            target.model.position.clone();

        targetPosition.y = 1.3;

        tower.mesh.lookAt(targetPosition);

        if (tower.cooldown <= 0) {
            fireProjectile(
                tower,
                target
            );

            tower.cooldown =
                tower.fireRate;
        }
    }

    if (GAME.selectedTower) {
        updateTowerPanel();
    }
}

/* =========================================================
   PROJECTILES
   ========================================================= */

function updateProjectiles(delta) {
    for (const projectile of [...GAME.projectiles]) {
        const target = projectile.target;

        if (
            !target ||
            !target.alive ||
            !GAME.enemies.includes(target)
        ) {
            scene.remove(projectile.mesh);

            const index =
                GAME.projectiles.indexOf(projectile);

            if (index !== -1) {
                GAME.projectiles.splice(index, 1);
            }

            continue;
        }

        const direction =
            new THREE.Vector3()
                .subVectors(
                    target.model.position,
                    projectile.mesh.position
                );

        const distance =
            direction.length();

        direction.normalize();

        projectile.mesh.position.add(
            direction.multiplyScalar(
                projectile.speed * delta
            )
        );

        if (distance < 0.6) {
            damageEnemy(
                target,
                projectile.tower.damage,
                projectile.tower
            );

            scene.remove(projectile.mesh);

            const index =
                GAME.projectiles.indexOf(projectile);

            if (index !== -1) {
                GAME.projectiles.splice(index, 1);
            }
        }
    }
}

/* =========================================================
   SPECIAL ABILITIES
   ========================================================= */

function activateAbility(tower) {
    if (!tower) return;

    const type =
        TOWER_TYPES[tower.type];

    if (tower.abilityCooldown > 0) {
        message(
            `⚡ Ability ready in ${tower.abilityCooldown.toFixed(1)}s`
        );
        return;
    }

    if (tower.type === "archer") {
        const targets =
            GAME.enemies.filter(enemy => {
                return (
                    enemy.alive &&
                    tower.mesh.position.distanceTo(
                        enemy.model.position
                    ) <= tower.range
                );
            });

        if (!targets.length) {
            message("No enemies in range!");
            return;
        }

        tower.abilityActive = true;

        let shots = 0;

        const rapidFire =
            setInterval(() => {
                if (
                    shots >= 6 ||
                    !tower.abilityActive
                ) {
                    clearInterval(rapidFire);
                    tower.abilityActive = false;
                    return;
                }

                const target =
                    selectTarget(tower);

                if (target) {
                    fireProjectile(
                        tower,
                        target
                    );
                }

                shots++;
            }, 120);

        tower.abilityCooldown =
            type.abilityCooldown;

        message("🏹 RAPID FIRE!");

        sound(1000, 0.2);
    }

    else if (tower.type === "cannon") {
        const targets =
            GAME.enemies.filter(enemy => {
                return (
                    enemy.alive &&
                    tower.mesh.position.distanceTo(
                        enemy.model.position
                    ) <= tower.range
                );
            });

        if (!targets.length) {
            message("No enemies in range!");
            return;
        }

        const target =
            selectTarget(tower);

        const center =
            target.model.position;

        for (const enemy of [...GAME.enemies]) {
            if (
                enemy.alive &&
                enemy.model.position.distanceTo(
                    center
                ) <= 3.5
            ) {
                damageEnemy(
                    enemy,
                    tower.damage * 2.5,
                    tower
                );
            }
        }

        createExplosion(center);

        tower.abilityCooldown =
            type.abilityCooldown;

        message("💣 BIG BLAST!");

        sound(120, 0.4, "sawtooth");
    }

    else if (tower.type === "magic") {
        const targets =
            GAME.enemies.filter(enemy => {
                return (
                    enemy.alive &&
                    tower.mesh.position.distanceTo(
                        enemy.model.position
                    ) <= tower.range
                );
            });

        if (!targets.length) {
            message("No enemies in range!");
            return;
        }

        targets
            .sort(
                (a, b) =>
                    b.pathIndex -
                    a.pathIndex
            )
            .slice(0, 5)
            .forEach(enemy => {
                damageEnemy(
                    enemy,
                    tower.damage * 2,
                    tower
                );

                createLightning(
                    tower.mesh.position,
                    enemy.model.position
                );
            });

        tower.abilityCooldown =
            type.abilityCooldown;

        message("🔮 LIGHTNING!");

        sound(1200, 0.3, "sine");
    }

    updateTowerPanel();
}

/* =========================================================
   EXPLOSION
   ========================================================= */

function createExplosion(position) {
    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(
            0.5,
            12,
            12
        ),
        new THREE.MeshBasicMaterial({
            color: 0xff9800,
            transparent: true
        })
    );

    mesh.position.copy(position);

    scene.add(mesh);

    GAME.effects.push({
        mesh,
        life: 0.5,
        explosion: true
    });
}

/* =========================================================
   LIGHTNING
   ========================================================= */

function createLightning(start, end) {
    const points = [
        start.clone().setY(1.5),
        end.clone().setY(1.5)
    ];

    const geometry =
        new THREE.BufferGeometry()
            .setFromPoints(points);

    const material =
        new THREE.LineBasicMaterial({
            color: 0x00ffff
        });

    const line =
        new THREE.Line(
            geometry,
            material
        );

    scene.add(line);

    GAME.effects.push({
        mesh: line,
        life: 0.2
    });
}

/* =========================================================
   EFFECTS
   ========================================================= */

function updateEffects(delta) {
    for (const effect of [...GAME.effects]) {
        effect.life -= delta;

        if (effect.explosion) {
            effect.mesh.scale.multiplyScalar(
                1 + delta * 5
            );
        }

        effect.mesh.material.opacity =
            Math.max(
                0,
                effect.life * 4
            );

        if (effect.life <= 0) {
            scene.remove(effect.mesh);

            const index =
                GAME.effects.indexOf(effect);

            if (index !== -1) {
                GAME.effects.splice(index, 1);
            }
        }
    }
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

        GAME.spawnTimer =
            type === "boss"
                ? 2.5
                : 0.9;
    }
}

/* =========================================================
   WAVE COMPLETE
   ========================================================= */

function checkWaveComplete() {
    if (!GAME.waveRunning) return;

    const allSpawned =
        GAME.spawnIndex >=
        GAME.spawnQueue.length;

    if (
        allSpawned &&
        GAME.enemies.length === 0
    ) {
        GAME.waveRunning = false;

        const bonus =
            GAME.waveBonus +
            GAME.wave * 5;

        GAME.coins += bonus;

        message(
            `🏆 WAVE ${GAME.wave} COMPLETE! +${bonus} COINS`,
            2500
        );

        sound(700, 0.15);
        setTimeout(
            () => sound(1000, 0.2),
            150
        );

        if (
            GAME.wave >=
            GAME.maxVictoryWave
        ) {
            victory();
            return;
        }

        GAME.wave++;

        updateHUD();
    }
}

/* =========================================================
   GAME OVER
   ========================================================= */

function gameOver() {
    GAME.gameOver = true;
    GAME.waveRunning = false;
    GAME.towerMode = false;

    closeTowerPanel();
    hideBossUI();

    message(
        "💀 GAME OVER — Refresh to play again.",
        100000
    );

    sound(80, 0.8, "sawtooth");
}

/* =========================================================
   VICTORY
   ========================================================= */

function victory() {
    GAME.victory = true;
    GAME.waveRunning = false;
    GAME.towerMode = false;

    closeTowerPanel();
    hideBossUI();

    const panel =
        document.createElement("div");

    panel.style.position = "fixed";
    panel.style.left = "50%";
    panel.style.top = "50%";
    panel.style.transform =
        "translate(-50%, -50%)";
    panel.style.background =
        "rgba(10,20,15,.97)";
    panel.style.color = "white";
    panel.style.padding = "30px";
    panel.style.borderRadius = "18px";
    panel.style.border =
        "3px solid gold";
    panel.style.textAlign = "center";
    panel.style.zIndex = "100";
    panel.style.minWidth = "300px";

    panel.innerHTML = `
        <div style="font-size:50px">
            🏆
        </div>

        <h1>VICTORY!</h1>

        <p>
            You survived all
            ${GAME.maxVictoryWave} waves!
        </p>

        <p>
            💰 Final Coins:
            ${Math.floor(GAME.coins)}
        </p>

        <button
            onclick="location.reload()"
            style="
                padding:12px 25px;
                font-weight:bold;
                cursor:pointer;
            ">
            PLAY AGAIN
        </button>
    `;

    document.body.appendChild(panel);

    sound(600, 0.15, "triangle");

    setTimeout(
        () => sound(900, 0.2, "triangle"),
        150
    );

    setTimeout(
        () => sound(1200, 0.3, "triangle"),
        300
    );
}

/* =========================================================
   RAYCASTING
   ========================================================= */

const raycaster =
    new THREE.Raycaster();

const mouse =
    new THREE.Vector2();

renderer.domElement.addEventListener(
    "pointerdown",
    event => {

        if (
            GAME.gameOver ||
            GAME.victory
        ) {
            return;
        }

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

        /* -----------------------------------------
           TOWER PLACEMENT
           ----------------------------------------- */

        if (
            GAME.towerMode &&
            GAME.selectedTowerType
        ) {
            const hits =
                raycaster.intersectObject(
                    ground
                );

            if (!hits.length) return;

            const point =
                hits[0].point;

            if (point.x > 12 &&
                point.z > 6) {
                message(
                    "❌ Too close to the base!"
                );
                return;
            }

            for (const pathMesh of pathMeshes) {
                const box =
                    new THREE.Box3()
                        .setFromObject(
                            pathMesh
                        );

                if (
                    box.containsPoint(
                        point
                    )
                ) {
                    message(
                        "❌ You can't build on the path!"
                    );
                    return;
                }
            }

            for (const tower of GAME.towers) {
                if (
                    tower.mesh.position.distanceTo(
                        point
                    ) < 2.2
                ) {
                    message(
                        "❌ Too close to another tower!"
                    );
                    return;
                }
            }

            createTower(
                GAME.selectedTowerType,
                new THREE.Vector3(
                    point.x,
                    0,
                    point.z
                )
            );

            GAME.towerMode = false;
            GAME.selectedTowerType = null;

            return;
        }

        /* -----------------------------------------
           TOWER SELECTION
           ----------------------------------------- */

        const objects =
            GAME.towers.map(
                tower => tower.mesh
            );

        const hits =
            raycaster.intersectObjects(
                objects,
                true
            );

        if (!hits.length) {
            closeTowerPanel();
            return;
        }

        let object =
            hits[0].object;

        while (
            object &&
            !object.userData.tower
        ) {
            object = object.parent;
        }

        if (
            object &&
            object.userData.tower
        ) {
            openTowerPanel(
                object.userData.tower
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

let lastTime = performance.now();

function animate(now) {
    requestAnimationFrame(animate);

    const delta =
        Math.min(
            (now - lastTime) / 1000,
            0.05
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
        checkWaveComplete();
    }

    renderer.render(
        scene,
        camera
    );
}

updateHUD();

animate(performance.now());
