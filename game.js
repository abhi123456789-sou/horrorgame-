/* =========================================================
   THE LAST ROOM
   COMPLETE GAME.JS
   PART 1 / 6
   PC + MOBILE
========================================================= */

"use strict";

/* =========================================================
   THREE.JS CHECK
========================================================= */

if (typeof THREE === "undefined") {
    alert("Three.js could not load. Check your internet connection.");
    throw new Error("THREE is not loaded.");
}

/* =========================================================
   DOM
========================================================= */

const gameRoot =
    document.getElementById("game");

const gameContainer =
    document.getElementById("gameContainer");

const loadingScreen =
    document.getElementById("loadingScreen");

const loadingProgress =
    document.getElementById("loadingProgress");

const loadingText =
    document.getElementById("loadingText");

const mainMenu =
    document.getElementById("mainMenu");

const pauseMenu =
    document.getElementById("pauseMenu");

const controlsPanel =
    document.getElementById("controlsPanel");

const gameOverOverlay =
    document.getElementById("gameOverOverlay");

const startButton =
    document.getElementById("startButton");

const controlsButton =
    document.getElementById("controlsButton");

const pauseControlsButton =
    document.getElementById("pauseControlsButton");

const closeControls =
    document.getElementById("closeControls");

const resumeButton =
    document.getElementById("resumeButton");

const restartButton =
    document.getElementById("restartButton");

const againButton =
    document.getElementById("againButton");

const overTitle =
    document.getElementById("overTitle");

const overHeading =
    document.getElementById("overHeading");

const overText =
    document.getElementById("overText");

const objectiveEl =
    document.getElementById("objective");

const messageEl =
    document.getElementById("message");

const messageTitle =
    document.getElementById("messageTitle");

const messageBody =
    document.getElementById("messageBody");

const interactionEl =
    document.getElementById("interaction");

const interactionMain =
    document.getElementById("interactionMain");

const interactionSub =
    document.getElementById("interactionSub");

const crosshair =
    document.getElementById("crosshair");

const healthFill =
    document.getElementById("playerHealthFill");

const healthText =
    document.getElementById("healthText");

const batteryFill =
    document.getElementById("batteryFill");

const batteryText =
    document.getElementById("batteryText");

const weaponName =
    document.getElementById("weaponName");

const ammoText =
    document.getElementById("ammoText");

/* =========================================================
   MOBILE DOM
========================================================= */

const mobileControls =
    document.getElementById("mobileControls");

const joystickBase =
    document.getElementById("joystickBase");

const joystickKnob =
    document.getElementById("joystickKnob");

const lookArea =
    document.getElementById("lookArea");

const mobileShoot =
    document.getElementById("mobileShoot");

const mobileReload =
    document.getElementById("mobileReload");

const mobileJump =
    document.getElementById("mobileJump");

const mobileCrouch =
    document.getElementById("mobileCrouch");

const mobileFlashlight =
    document.getElementById("mobileFlashlight");

const mobileInteract =
    document.getElementById("mobileInteract");

const mobileWeapons =
    document.getElementById("mobileWeapons");

/* =========================================================
   SCENE
========================================================= */

let scene;
let camera;
let renderer;

let flashlight;
let flashlightFill;
let ambientLight;

const ceilingLights = [];

let gunGroup;
let muzzleFlash;

let clock;

/* =========================================================
   WORLD
========================================================= */

const WORLD = {
    width: 30,
    depth: 30,
    wallHeight: 4,
    wallThickness: 0.5
};

const ROOM = {
    width: 26,
    depth: 24,
    wallHeight: 4
};

/* =========================================================
   PLAYER
========================================================= */

const player = {

    position:
        new THREE.Vector3(0, 1.7, 8),

    velocity:
        new THREE.Vector3(),

    yaw:
        Math.PI,

    pitch:
        0,

    radius:
        0.35,

    standingHeight:
        1.7,

    crouchHeight:
        1.05,

    moveSpeed:
        3.4,

    sprintSpeed:
        5.6,

    crouchSpeed:
        1.8,

    jumpForce:
        5.2,

    gravity:
        14,

    grounded:
        true,

    crouching:
        false,

    sprinting:
        false
};

/* =========================================================
   GAME STATE
========================================================= */

const state = {

    started:
        false,

    paused:
        false,

    gameOver:
        false,

    victory:
        false,

    elapsed:
        0,

    objective:
        "Find a way out.",

    doorUnlocked:
        false,

    doorOpen:
        false,

    keyFound:
        false,

    generatorActivated:
        false,

    horrorTriggered:
        false,

    finalTriggered:
        false,

    flashlightOn:
        true,

    battery:
        100,

    messageTimer:
        0,

    interactionObject:
        null
};

/* =========================================================
   INPUT
========================================================= */

const keys = {};

const joystick = {

    active:
        false,

    pointerId:
        null,

    x:
        0,

    y:
        0
};

const look = {

    active:
        false,

    pointerId:
        null,

    lastX:
        0,

    lastY:
        0
};

let mouseDown = false;

/* =========================================================
   HEALTH
========================================================= */

const health = {

    current:
        100,

    maximum:
        100
};

/* =========================================================
   WEAPON
========================================================= */

const weapon = {

    name:
        "Pistol",

    ammo:
        12,

    magazine:
        12,

    reserve:
        48,

    damage:
        25,

    fireRate:
        0.18,

    lastShot:
        0,

    reloading:
        false,

    reloadTimer:
        0,

    reloadDuration:
        1.25
};

/* =========================================================
   ENEMIES
========================================================= */

const enemies = [];

const enemyState = {

    idle:
        "idle",

    chase:
        "chase",

    attack:
        "attack",

    dead:
        "dead"
};

/* =========================================================
   WORLD OBJECTS
========================================================= */

const worldObjects = [];

let exitDoor = null;
let keyObject = null;
let generatorObject = null;

let horrorFigure = null;
let finalFigure = null;

/* =========================================================
   COLLISION OBJECTS
========================================================= */

const collisionBoxes = [];

/* =========================================================
   TEMP OBJECTS
========================================================= */

const tempVector =
    new THREE.Vector3();

const tempVector2 =
    new THREE.Vector3();

const tempVector3 =
    new THREE.Vector3();

const tempQuaternion =
    new THREE.Quaternion();

const raycaster =
    new THREE.Raycaster();

/* =========================================================
   MATERIALS
========================================================= */

let wallMaterial;
let floorMaterial;
let ceilingMaterial;
let metalMaterial;
let woodMaterial;
let darkMaterial;
let bloodMaterial;
let glassMaterial;

/* =========================================================
   TEXTURES
========================================================= */

let floorTexture = null;
let wallTexture = null;
let ceilingTexture = null;

/* =========================================================
   AUDIO
========================================================= */

let audioContext = null;

let masterGain = null;
let ambienceGain = null;
let effectsGain = null;

let ambienceOscillator = null;
let heartbeatTimer = null;

/* =========================================================
   AUDIO HELPERS
========================================================= */

function initAudio() {

    if (audioContext) {
        return;
    }

    try {

        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

        masterGain =
            audioContext.createGain();

        ambienceGain =
            audioContext.createGain();

        effectsGain =
            audioContext.createGain();

        masterGain.gain.value =
            0.35;

        ambienceGain.gain.value =
            0.12;

        effectsGain.gain.value =
            0.5;

        ambienceGain.connect(masterGain);
        effectsGain.connect(masterGain);
        masterGain.connect(
            audioContext.destination
        );

    } catch (error) {

        console.warn(
            "Audio initialization failed:",
            error
        );
    }
}

/* =========================================================
   SAFE AUDIO RESUME
========================================================= */

function resumeAudio() {

    if (!audioContext) {
        initAudio();
    }

    if (
        audioContext &&
        audioContext.state === "suspended"
    ) {

        audioContext.resume()
            .catch(function () {
                /* intentionally ignored */
            });
    }
}

/* =========================================================
   MESSAGE SYSTEM
========================================================= */

function showMessage(
    title,
    body,
    duration = 3
) {

    if (!messageEl) {
        return;
    }

    if (messageTitle) {
        messageTitle.textContent =
            title || "";
    }

    if (messageBody) {
        messageBody.textContent =
            body || "";
    }

    messageEl.classList.add("show");

    state.messageTimer =
        duration;
}

function hideMessage() {

    if (!messageEl) {
        return;
    }

    messageEl.classList.remove("show");

    state.messageTimer =
        0;
}

/* =========================================================
   OBJECTIVE SYSTEM
========================================================= */

function setObjective(text) {

    state.objective =
        text || "";

    if (objectiveEl) {
        objectiveEl.textContent =
            state.objective;
    }
}

/* =========================================================
   INTERACTION UI
========================================================= */

function clearInteraction() {

    state.interactionObject =
        null;

    if (interactionEl) {
        interactionEl.classList.remove(
            "show"
        );
    }

    if (interactionMain) {
        interactionMain.textContent =
            "";
    }

    if (interactionSub) {
        interactionSub.textContent =
            "";
    }
}

function setInteraction(
    main,
    sub,
    object = null
) {

    state.interactionObject =
        object;

    if (interactionMain) {
        interactionMain.textContent =
            main || "";
    }

    if (interactionSub) {
        interactionSub.textContent =
            sub || "";
    }

    if (interactionEl) {
        interactionEl.classList.add(
            "show"
        );
    }
}

/* =========================================================
   UI HEALTH
========================================================= */

function updateHealthUI() {

    const value =
        Math.max(
            0,
            Math.min(
                health.maximum,
                health.current
            )
        );

    const percent =
        health.maximum > 0
            ? (value / health.maximum) * 100
            : 0;

    if (healthFill) {

        healthFill.style.width =
            percent + "%";
    }

    if (healthText) {

        healthText.textContent =
            Math.ceil(value) +
            " / " +
            health.maximum;
    }
}

/* =========================================================
   UI BATTERY
========================================================= */

function updateBatteryUI() {

    const value =
        Math.max(
            0,
            Math.min(
                100,
                state.battery
            )
        );

    if (batteryFill) {

        batteryFill.style.width =
            value + "%";
    }

    if (batteryText) {

        batteryText.textContent =
            Math.ceil(value) +
            "%";
    }
}

/* =========================================================
   UI WEAPON
========================================================= */

function updateWeaponUI() {

    if (weaponName) {

        weaponName.textContent =
            weapon.name;
    }

    if (ammoText) {

        ammoText.textContent =
            weapon.ammo +
            " / " +
            weapon.reserve;
    }
}

/* =========================================================
   SAFE STATE CHECK
========================================================= */

function isGamePlayable() {

    return (
        state.started === true &&
        state.paused === false &&
        state.gameOver === false &&
        state.victory === false
    );
}

/* =========================================================
   INITIAL UI
========================================================= */

updateHealthUI();
updateBatteryUI();
updateWeaponUI();

if (objectiveEl) {
    objectiveEl.textContent =
        state.objective;
}
/* =========================================================
   PART 2
========================================================= */

/* =========================================================
   GAME STATE
========================================================= */

const gameState = {
    started: false,
    paused: false,
    gameOver: false,

    score: 0,
    level: 1,

    playerHealth: 100,
    playerMaxHealth: 100,

    playerSpeed: 0.12,

    keys: {},

    mouse: {
        x: 0,
        y: 0,
        down: false
    },

    touch: {
        active: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0
    },

    enemies: [],
    bullets: [],
    particles: [],

    lastTime: 0,
    elapsed: 0,

    spawnTimer: 0,
    spawnInterval: 3,

    shootTimer: 0,
    shootInterval: 0.25,

    damageCooldown: 0,

    wave: 1,
    enemiesKilled: 0,

    roomCleared: false
};


/* =========================================================
   PLAYER VARIABLES
========================================================= */

let player = null;

let playerVelocity = new THREE.Vector3();

let playerDirection = new THREE.Vector3();

let playerTargetRotation = 0;

let playerCanShoot = true;


/* =========================================================
   CAMERA VARIABLES
========================================================= */

let cameraTarget = new THREE.Vector3();

let cameraOffset = new THREE.Vector3(
    0,
    8,
    10
);


/* =========================================================
   WORLD VARIABLES
========================================================= */

let floor = null;
let room = null;

let walls = [];

let lights = [];

let clock = new THREE.Clock();


/* =========================================================
   MATERIALS
========================================================= */

const materials = {

    floor: new THREE.MeshStandardMaterial({
        color: 0x11151c,
        roughness: 0.9,
        metalness: 0.1
    }),

    wall: new THREE.MeshStandardMaterial({
        color: 0x242932,
        roughness: 0.8,
        metalness: 0.2
    }),

    player: new THREE.MeshStandardMaterial({
        color: 0x4da6ff,
        roughness: 0.5,
        metalness: 0.4
    }),

    enemy: new THREE.MeshStandardMaterial({
        color: 0xff3333,
        roughness: 0.7,
        metalness: 0.1
    }),

    bullet: new THREE.MeshBasicMaterial({
        color: 0xffff00
    }),

    particle: new THREE.MeshBasicMaterial({
        color: 0xff8800
    })
};


/* =========================================================
   CREATE ROOM
========================================================= */

function createRoom() {

    room = new THREE.Group();

    scene.add(room);


    /* -----------------------------------------------------
       FLOOR
    ----------------------------------------------------- */

    const floorGeometry =
        new THREE.PlaneGeometry(
            40,
            40
        );

    floor =
        new THREE.Mesh(
            floorGeometry,
            materials.floor
        );

    floor.rotation.x =
        -Math.PI / 2;

    floor.position.y = 0;

    floor.receiveShadow = true;

    room.add(floor);


    /* -----------------------------------------------------
       WALL CREATION FUNCTION
    ----------------------------------------------------- */

    function createWall(
        width,
        height,
        depth,
        x,
        y,
        z
    ) {

        const geometry =
            new THREE.BoxGeometry(
                width,
                height,
                depth
            );

        const wall =
            new THREE.Mesh(
                geometry,
                materials.wall
            );

        wall.position.set(
            x,
            y,
            z
        );

        wall.castShadow = true;
        wall.receiveShadow = true;

        room.add(wall);

        walls.push(wall);

        return wall;
    }


    /* -----------------------------------------------------
       OUTER WALLS
    ----------------------------------------------------- */

    createWall(
        40,
        5,
        1,
        0,
        2.5,
        -20
    );

    createWall(
        40,
        5,
        1,
        0,
        2.5,
        20
    );

    createWall(
        1,
        5,
        40,
        -20,
        2.5,
        0
    );

    createWall(
        1,
        5,
        40,
        20,
        2.5,
        0
    );


    /* -----------------------------------------------------
       INNER WALLS
    ----------------------------------------------------- */

    createWall(
        12,
        4,
        1,
        -8,
        2,
        -5
    );

    createWall(
        1,
        4,
        10,
        4,
        2,
        -10
    );

    createWall(
        10,
        4,
        1,
        9,
        2,
        5
    );

    createWall(
        1,
        4,
        10,
        -8,
        2,
        10
    );
}


/* =========================================================
   CREATE PLAYER
========================================================= */

function createPlayer() {

    const group =
        new THREE.Group();

    const bodyGeometry =
        new THREE.CapsuleGeometry(
            0.65,
            1.2,
            6,
            12
        );

    const body =
        new THREE.Mesh(
            bodyGeometry,
            materials.player
        );

    body.position.y = 1;

    body.castShadow = true;

    group.add(body);


    /* -----------------------------------------------------
       PLAYER HEAD
    ----------------------------------------------------- */

    const headGeometry =
        new THREE.SphereGeometry(
            0.42,
            16,
            16
        );

    const head =
        new THREE.Mesh(
            headGeometry,
            materials.player
        );

    head.position.y = 2;

    head.castShadow = true;

    group.add(head);


    /* -----------------------------------------------------
       PLAYER WEAPON
    ----------------------------------------------------- */

    const weaponGeometry =
        new THREE.BoxGeometry(
            0.18,
            0.18,
            1.1
        );

    const weaponMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.8,
            roughness: 0.3
        });

    const weapon =
        new THREE.Mesh(
            weaponGeometry,
            weaponMaterial
        );

    weapon.position.set(
        0.45,
        1.35,
        -0.5
    );

    weapon.rotation.x =
        Math.PI / 2;

    weapon.castShadow = true;

    group.add(weapon);


    /* -----------------------------------------------------
       PLAYER POSITION
    ----------------------------------------------------- */

    group.position.set(
        0,
        0,
        12
    );

    scene.add(group);

    player = group;

    return player;
}


/* =========================================================
   CREATE ENEMY
========================================================= */

function createEnemy(
    x,
    z
) {

    const enemy =
        new THREE.Group();


    /* -----------------------------------------------------
       BODY
    ----------------------------------------------------- */

    const bodyGeometry =
        new THREE.SphereGeometry(
            0.8,
            12,
            12
        );

    const body =
        new THREE.Mesh(
            bodyGeometry,
            materials.enemy
        );

    body.position.y = 0.9;

    body.castShadow = true;

    enemy.add(body);


    /* -----------------------------------------------------
       EYES
    ----------------------------------------------------- */

    const eyeGeometry =
        new THREE.SphereGeometry(
            0.12,
            8,
            8
        );

    const eyeMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xffffff
        });

    const eye1 =
        new THREE.Mesh(
            eyeGeometry,
            eyeMaterial
        );

    const eye2 =
        new THREE.Mesh(
            eyeGeometry,
            eyeMaterial
        );

    eye1.position.set(
        -0.25,
        1.05,
        -0.65
    );

    eye2.position.set(
        0.25,
        1.05,
        -0.65
    );

    enemy.add(eye1);
    enemy.add(eye2);


    /* -----------------------------------------------------
       ENEMY DATA
    ----------------------------------------------------- */

    enemy.position.set(
        x,
        0,
        z
    );

    enemy.userData = {

        health: 100,

        maxHealth: 100,

        speed:
            0.035 +
            gameState.level * 0.004,

        damage: 10,

        attackDistance: 1.6,

        attackCooldown: 0,

        alive: true

    };


    scene.add(enemy);

    gameState.enemies.push(enemy);

    return enemy;
}


/* =========================================================
   RANDOM ENEMY POSITION
========================================================= */

function getRandomEnemyPosition() {

    let x = 0;
    let z = 0;

    let valid = false;

    let attempts = 0;


    while (
        !valid &&
        attempts < 50
    ) {

        x =
            THREE.MathUtils.randFloat(
                -17,
                17
            );

        z =
            THREE.MathUtils.randFloat(
                -17,
                17
            );


        if (!player) {
            valid = true;
            break;
        }


        const distance =
            Math.sqrt(
                Math.pow(
                    x - player.position.x,
                    2
                ) +
                Math.pow(
                    z - player.position.z,
                    2
                )
            );


        if (distance > 8) {

            valid = true;

        }

        attempts++;
    }


    return {
        x,
        z
    };
}


/* =========================================================
   SPAWN ENEMY
========================================================= */

function spawnEnemy() {

    if (
        gameState.gameOver ||
        gameState.paused
    ) {
        return;
    }


    const position =
        getRandomEnemyPosition();


    createEnemy(
        position.x,
        position.z
    );
}


/* =========================================================
   INITIAL ENEMIES
========================================================= */

function spawnInitialEnemies() {

    for (
        let i = 0;
        i < 3;
        i++
    ) {

        spawnEnemy();

    }
}


/* =========================================================
   BULLET CREATION
========================================================= */

function createBullet(
    position,
    direction
) {

    const geometry =
        new THREE.SphereGeometry(
            0.12,
            8,
            8
        );

    const bullet =
        new THREE.Mesh(
            geometry,
            materials.bullet
        );


    bullet.position.copy(
        position
    );


    bullet.userData = {

        velocity:
            direction
                .clone()
                .normalize()
                .multiplyScalar(0.65),

        life: 2,

        damage: 35

    };


    scene.add(bullet);

    gameState.bullets.push(
        bullet
    );

    return bullet;
}


/* =========================================================
   SHOOT PLAYER BULLET
========================================================= */

function playerShoot() {

    if (
        !player ||
        gameState.gameOver ||
        gameState.paused
    ) {
        return;
    }


    if (
        gameState.shootTimer > 0
    ) {
        return;
    }


    gameState.shootTimer =
        gameState.shootInterval;


    const direction =
        new THREE.Vector3(
            0,
            0,
            -1
        );


    direction.applyQuaternion(
        player.quaternion
    );


    const position =
        player.position
            .clone();


    position.y = 1.2;


    position.add(
        direction
            .clone()
            .multiplyScalar(1)
    );


    createBullet(
        position,
        direction
    );
}


/* =========================================================
   UPDATE BULLETS
========================================================= */

function updateBullets(
    delta
) {

    for (
        let i =
            gameState.bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            gameState.bullets[i];


        if (!bullet) {
            continue;
        }


        const velocity =
            bullet.userData.velocity;


        bullet.position.add(
            velocity
                .clone()
                .multiplyScalar(
                    delta * 60
                )
        );


        bullet.userData.life -=
            delta;


        let removeBullet =
            bullet.userData.life <= 0;


        /* -------------------------------------------------
           WALL COLLISION
        ------------------------------------------------- */

        if (!removeBullet) {

            for (
                let w = 0;
                w < walls.length;
                w++
            ) {

                const wall =
                    walls[w];

                const box =
                    new THREE.Box3()
                        .setFromObject(
                            wall
                        );


                if (
                    box.containsPoint(
                        bullet.position
                    )
                ) {

                    removeBullet = true;

                    break;
                }
            }
        }


        /* -------------------------------------------------
           ENEMY COLLISION
        ------------------------------------------------- */

        if (!removeBullet) {

            for (
                let e =
                    gameState.enemies.length - 1;
                e >= 0;
                e--
            ) {

                const enemy =
                    gameState.enemies[e];


                if (
                    !enemy ||
                    !enemy.userData.alive
                ) {
                    continue;
                }


                const distance =
                    bullet.position.distanceTo(
                        enemy.position
                    );


                if (
                    distance < 1
                ) {

                    enemy.userData.health -=
                        bullet.userData.damage;


                    removeBullet = true;


                    createHitParticles(
                        enemy.position
                    );


                    if (
                        enemy.userData.health <= 0
                    ) {

                        killEnemy(
                            enemy
                        );

                    }

                    break;
                }
            }
        }


        if (removeBullet) {

            scene.remove(
                bullet
            );

            gameState.bullets.splice(
                i,
                1
            );
        }
    }
}


/* =========================================================
   KILL ENEMY
========================================================= */

function killEnemy(
    enemy
) {

    if (
        !enemy ||
        !enemy.userData.alive
    ) {
        return;
    }


    enemy.userData.alive =
        false;


    gameState.score +=
        100;


    gameState.enemiesKilled++;


    updateScoreUI();


    createExplosion(
        enemy.position
    );


    scene.remove(
        enemy
    );


    const index =
        gameState.enemies.indexOf(
            enemy
        );


    if (index !== -1) {

        gameState.enemies.splice(
            index,
            1
        );
    }


    checkWaveCompletion();
}


/* =========================================================
   HIT PARTICLES
========================================================= */

function createHitParticles(
    position
) {

    for (
        let i = 0;
        i < 5;
        i++
    ) {

        const geometry =
            new THREE.SphereGeometry(
                0.06,
                6,
                6
            );


        const particle =
            new THREE.Mesh(
                geometry,
                materials.particle
            );


        particle.position.copy(
            position
        );


        particle.userData = {

            velocity:
                new THREE.Vector3(
                    THREE.MathUtils.randFloat(
                        -0.08,
                        0.08
                    ),
                    THREE.MathUtils.randFloat(
                        0.02,
                        0.12
                    ),
                    THREE.MathUtils.randFloat(
                        -0.08,
                        0.08
                    )
                ),

            life: 0.5

        };


        scene.add(
            particle
        );


        gameState.particles.push(
            particle
        );
    }
}


/* =========================================================
   EXPLOSION
========================================================= */

function createExplosion(
    position
) {

    for (
        let i = 0;
        i < 15;
        i++
    ) {

        const geometry =
            new THREE.SphereGeometry(
                0.08,
                6,
                6
            );


        const particle =
            new THREE.Mesh(
                geometry,
                materials.particle
            );


        particle.position.copy(
            position
        );


        particle.userData = {

            velocity:
                new THREE.Vector3(
                    THREE.MathUtils.randFloat(
                        -0.15,
                        0.15
                    ),
                    THREE.MathUtils.randFloat(
                        0.05,
                        0.25
                    ),
                    THREE.MathUtils.randFloat(
                        -0.15,
                        0.15
                    )
                ),

            life: 0.8

        };


        scene.add(
            particle
        );


        gameState.particles.push(
            particle
        );
    }
}


/* =========================================================
   UPDATE PARTICLES
========================================================= */

function updateParticles(
    delta
) {

    for (
        let i =
            gameState.particles.length - 1;
        i >= 0;
        i--
    ) {

        const particle =
            gameState.particles[i];


        if (!particle) {
            continue;
        }


        particle.position.add(
            particle.userData.velocity
                .clone()
                .multiplyScalar(
                    delta * 60
                )
        );


        particle.userData.velocity.y -=
            0.005 * delta * 60;


        particle.userData.life -=
            delta;


        particle.scale.multiplyScalar(
            0.96
        );


        if (
            particle.userData.life <= 0
        ) {

            scene.remove(
                particle
            );


            gameState.particles.splice(
                i,
                1
            );
        }
    }
}


/* =========================================================
   ENEMY AI
========================================================= */

function updateEnemies(
    delta
) {

    if (
        !player ||
        gameState.gameOver
    ) {
        return;
    }


    for (
        let i =
            gameState.enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy =
            gameState.enemies[i];


        if (
            !enemy ||
            !enemy.userData.alive
        ) {
            continue;
        }


        const data =
            enemy.userData;


        const direction =
            new THREE.Vector3()
                .subVectors(
                    player.position,
                    enemy.position
                );


        const distance =
            direction.length();


        direction.y = 0;


        if (
            distance >
            data.attackDistance
        ) {

            direction.normalize();


            enemy.position.add(
                direction
                    .multiplyScalar(
                        data.speed *
                        delta *
                        60
                    )
            );

        }


        /* -------------------------------------------------
           FACE PLAYER
        ------------------------------------------------- */

        if (
            direction.lengthSq() > 0.001
        ) {

            const angle =
                Math.atan2(
                    direction.x,
                    direction.z
                );


            enemy.rotation.y =
                angle;
        }


        /* -------------------------------------------------
           ATTACK PLAYER
        ------------------------------------------------- */

        if (
            data.attackCooldown > 0
        ) {

            data.attackCooldown -=
                delta;
        }


        if (
            distance <=
                data.attackDistance &&
            data.attackCooldown <= 0 &&
            gameState.damageCooldown <= 0
        ) {

            damagePlayer(
                data.damage
            );


            data.attackCooldown =
                1;

        }
    }
}


/* =========================================================
   DAMAGE PLAYER
========================================================= */

function damagePlayer(
    damage
) {

    if (
        gameState.gameOver ||
        gameState.damageCooldown > 0
    ) {
        return;
    }


    gameState.playerHealth -=
        damage;


    gameState.damageCooldown =
        0.6;


    if (
        gameState.playerHealth < 0
    ) {

        gameState.playerHealth = 0;

    }


    updateHealthUI();


    if (
        gameState.playerHealth <= 0
    ) {

        endGame();

    }
}


/* =========================================================
   UPDATE PLAYER
========================================================= */

function updatePlayer(
    delta
) {

    if (
        !player ||
        gameState.gameOver ||
        gameState.paused
    ) {
        return;
    }


    const move =
        new THREE.Vector3();


    /* -----------------------------------------------------
       KEYBOARD MOVEMENT
    ----------------------------------------------------- */

    if (
        gameState.keys["KeyW"] ||
        gameState.keys["ArrowUp"]
    ) {

        move.z -= 1;

    }


    if (
        gameState.keys["KeyS"] ||
        gameState.keys["ArrowDown"]
    ) {

        move.z += 1;

    }


    if (
        gameState.keys["KeyA"] ||
        gameState.keys["ArrowLeft"]
    ) {

        move.x -= 1;

    }


    if (
        gameState.keys["KeyD"] ||
        gameState.keys["ArrowRight"]
    ) {

        move.x += 1;

    }


    /* -----------------------------------------------------
       MOBILE TOUCH MOVEMENT
    ----------------------------------------------------- */

    if (
        gameState.touch.active
    ) {

        const dx =
            gameState.touch.currentX -
            gameState.touch.startX;

        const dy =
            gameState.touch.currentY -
            gameState.touch.startY;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            distance > 10
        ) {

            move.x +=
                dx / 80;

            move.z +=
                dy / 80;

        }
    }


    /* -----------------------------------------------------
       NORMALIZE MOVEMENT
    ----------------------------------------------------- */

    if (
        move.lengthSq() > 0
    ) {

        move.normalize();


        player.position.add(
            move.multiplyScalar(
                gameState.playerSpeed *
                delta *
                60
            )
        );


        playerVelocity.copy(
            move
        );


        /* -------------------------------------------------
           PLAYER ROTATION
        ------------------------------------------------- */

        playerTargetRotation =
            Math.atan2(
                move.x,
                move.z
            );


        player.rotation.y =
            playerTargetRotation;

    }


    /* -----------------------------------------------------
       ROOM BOUNDS
    ----------------------------------------------------- */

    player.position.x =
        THREE.MathUtils.clamp(
            player.position.x,
            -18.5,
            18.5
        );


    player.position.z =
        THREE.MathUtils.clamp(
            player.position.z,
            -18.5,
            18.5
        );


    /* -----------------------------------------------------
       WALL COLLISION
    ----------------------------------------------------- */

    resolvePlayerWallCollision();
}


/* =========================================================
   PLAYER WALL COLLISION
========================================================= */

function resolvePlayerWallCollision() {

    if (!player) {
        return;
    }


    const playerRadius =
        0.65;


    for (
        let i = 0;
        i < walls.length;
        i++
    ) {

        const wall =
            walls[i];


        const box =
            new THREE.Box3()
                .setFromObject(
                    wall
                );


        const closest =
            new THREE.Vector3(
                THREE.MathUtils.clamp(
                    player.position.x,
                    box.min.x,
                    box.max.x
                ),
                0,
                THREE.MathUtils.clamp(
                    player.position.z,
                    box.min.z,
                    box.max.z
                )
            );


        const distance =
            player.position.distanceTo(
                closest
            );


        if (
            distance < playerRadius
        ) {

            const push =
                player.position
                    .clone()
                    .sub(
                        closest
                    );


            push.y = 0;


            if (
                push.lengthSq() > 0
            ) {

                push.normalize();


                player.position.add(
                    push.multiplyScalar(
                        playerRadius -
                        distance
                    )
                );

            }
        }
    }
}


/* =========================================================
   CAMERA UPDATE
========================================================= */

function updateCamera(
    delta
) {

    if (!player) {
        return;
    }


    cameraTarget.copy(
        player.position
    );


    const desiredPosition =
        player.position
            .clone()
            .add(
                cameraOffset
            );


    camera.position.lerp(
        desiredPosition,
        Math.min(
            1,
            delta * 5
        )
    );


    camera.lookAt(
        cameraTarget
    );
}


/* =========================================================
   WAVE COMPLETION
========================================================= */

function checkWaveCompletion() {

    if (
        gameState.enemies.length === 0 &&
        !gameState.roomCleared
    ) {

        gameState.roomCleared =
            true;


        setTimeout(
            function() {

                if (
                    !gameState.gameOver
                ) {

                    nextWave();

                }

            },
            1500
        );
    }
}


/* =========================================================
   NEXT WAVE
========================================================= */

function nextWave() {

    gameState.wave++;

    gameState.level =
        gameState.wave;


    gameState.roomCleared =
        false;


    gameState.spawnInterval =
        Math.max(
            0.8,
            3 -
            gameState.level *
            0.12
        );


    const enemyCount =
        Math.min(
            12,
            2 +
            gameState.wave
        );


    for (
        let i = 0;
        i < enemyCount;
        i++
    ) {

        spawnEnemy();

    }


    updateWaveUI();
}


/* =========================================================
   SCORE UI
========================================================= */

function updateScoreUI() {

    const scoreElement =
        document.getElementById(
            "score"
        );


    if (
        scoreElement
    ) {

        scoreElement.textContent =
            gameState.score;

    }
}


/* =========================================================
   HEALTH UI
========================================================= */

function updateHealthUI() {

    const healthElement =
        document.getElementById(
            "health"
        );


    if (
        healthElement
    ) {

        healthElement.textContent =
            gameState.playerHealth;

    }


    const healthBar =
        document.getElementById(
            "healthBar"
        );


    if (
        healthBar
    ) {

        const percent =
            (
                gameState.playerHealth /
                gameState.playerMaxHealth
            ) * 100;


        healthBar.style.width =
            percent + "%";

    }
}


/* =========================================================
   WAVE UI
========================================================= */

function updateWaveUI() {

    const waveElement =
        document.getElementById(
            "wave"
        );


    if (
        waveElement
    ) {

        waveElement.textContent =
            gameState.wave;

    }
}


/* =========================================================
   START GAME
========================================================= */

function startGame() {

    if (
        gameState.started
    ) {
        return;
    }


    gameState.started =
        true;

    gameState.paused =
        false;

    gameState.gameOver =
        false;


    gameState.score =
        0;

    gameState.level =
        1;

    gameState.wave =
        1;

    gameState.playerHealth =
        100;

    gameState.enemiesKilled =
        0;

    gameState.spawnTimer =
        0;

    gameState.shootTimer =
        0;

    gameState.damageCooldown =
        0;


    if (!player) {

        createPlayer();

    }


    spawnInitialEnemies();


    updateScoreUI();

    updateHealthUI();

    updateWaveUI();


    const startScreen =
        document.getElementById(
            "startScreen"
        );


    if (
        startScreen
    ) {

        startScreen.style.display =
            "none";

    }


    const gameOverScreen =
        document.getElementById(
            "gameOverScreen"
        );


    if (
        gameOverScreen
    ) {

        gameOverScreen.style.display =
            "none";

    }
}


/* =========================================================
   END GAME
========================================================= */

function endGame() {

    gameState.gameOver =
        true;

    gameState.paused =
        false;


    const finalScore =
        document.getElementById(
            "finalScore"
        );


    if (
        finalScore
    ) {

        finalScore.textContent =
            gameState.score;

    }


    const gameOverScreen =
        document.getElementById(
            "gameOverScreen"
        );


    if (
        gameOverScreen
    ) {

        gameOverScreen.style.display =
            "flex";

    }
}


/* =========================================================
   RESTART GAME
========================================================= */

function restartGame() {

    /* -----------------------------------------------------
       REMOVE ENEMIES
    ----------------------------------------------------- */

    for (
        let i =
            gameState.enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy =
            gameState.enemies[i];

        if (enemy) {

            scene.remove(
                enemy
            );

        }
    }


    /* -----------------------------------------------------
       REMOVE BULLETS
    ----------------------------------------------------- */

    for (
        let i =
            gameState.bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            gameState.bullets[i];

        if (bullet) {

            scene.remove(
                bullet
            );

        }
    }


    /* -----------------------------------------------------
       REMOVE PARTICLES
    ----------------------------------------------------- */

    for (
        let i =
            gameState.particles.length - 1;
        i >= 0;
        i--
    ) {

        const particle =
            gameState.particles[i];

        if (particle) {

            scene.remove(
                particle
            );

        }
    }


    gameState.enemies = [];

    gameState.bullets = [];

    gameState.particles = [];


    /* -----------------------------------------------------
       RESET PLAYER
    ----------------------------------------------------- */

    if (player) {

        player.position.set(
            0,
            0,
            12
        );

        player.rotation.set(
            0,
            0,
            0
        );

    }


    gameState.started =
        false;


    const gameOverScreen =
        document.getElementById(
            "gameOverScreen"
        );


    if (
        gameOverScreen
    ) {

        gameOverScreen.style.display =
            "none";

    }


    startGame();
}


/* =========================================================
   PAUSE / RESUME
========================================================= */

function togglePause() {

    if (
        !gameState.started ||
        gameState.gameOver
    ) {
        return;
    }


    gameState.paused =
        !gameState.paused;


    const pauseScreen =
        document.getElementById(
            "pauseScreen"
        );


    if (
        pauseScreen
    ) {

        pauseScreen.style.display =
            gameState.paused
                ? "flex"
                : "none";

    }
}


/* =========================================================
   MAIN GAME UPDATE
========================================================= */

function updateGame(
    delta
) {

    if (
        !gameState.started ||
        gameState.gameOver
    ) {
        return;
    }


    if (
        gameState.paused
    ) {
        return;
    }


    gameState.elapsed +=
        delta;


    if (
        gameState.shootTimer > 0
    ) {

        gameState.shootTimer -=
            delta;

    }


    if (
        gameState.damageCooldown > 0
    ) {

        gameState.damageCooldown -=
            delta;

    }


    gameState.spawnTimer +=
        delta;


    if (
        gameState.spawnTimer >=
            gameState.spawnInterval &&
        gameState.enemies.length <
            Math.min(
                15,
                3 +
                gameState.level
            )
    ) {

        gameState.spawnTimer =
            0;

        spawnEnemy();

    }


    updatePlayer(
        delta
    );


    updateEnemies(
        delta
    );


    updateBullets(
        delta
    );


    updateParticles(
        delta
    );


    updateCamera(
        delta
    );
}

/* =========================================================
   INTERACTABLES
========================================================= */

function createInteractableBox(
    width,
    height,
    depth,
    material,
    x,
    y,
    z,
    name
) {

    const object =
        createBox(
            width,
            height,
            depth,
            material,
            x,
            y,
            z
        );

    object.userData.interactable =
        true;

    object.userData.name =
        name;

    interactables.push(
        object
    );

    return object;
}


/* =========================================================
   CREATE INTERACTABLES
========================================================= */

function createInteractables() {

    interactables.length = 0;


    /* -----------------------------------------------------
       DOOR
    ----------------------------------------------------- */

    createInteractableBox(
        3,
        4,
        0.4,
        materials.door,
        0,
        2,
        -19.4,
        "Main Door"
    );


    /* -----------------------------------------------------
       CRATES
    ----------------------------------------------------- */

    createInteractableBox(
        1.5,
        1.5,
        1.5,
        materials.crate,
        -10,
        0.75,
        -10,
        "Crate 1"
    );


    createInteractableBox(
        1.5,
        1.5,
        1.5,
        materials.crate,
        -8,
        0.75,
        -10,
        "Crate 2"
    );


    createInteractableBox(
        1.5,
        1.5,
        1.5,
        materials.crate,
        10,
        0.75,
        -10,
        "Crate 3"
    );


    createInteractableBox(
        1.5,
        1.5,
        1.5,
        materials.crate,
        12,
        0.75,
        -10,
        "Crate 4"
    );
}


/* =========================================================
   INTERACTION CHECK
========================================================= */

function checkInteraction() {

    if (
        !player ||
        gameState.gameOver ||
        gameState.paused
    ) {
        return;
    }


    let nearest = null;

    let nearestDistance =
        Infinity;


    for (
        let i = 0;
        i < interactables.length;
        i++
    ) {

        const object =
            interactables[i];


        if (!object) {
            continue;
        }


        const distance =
            player.position.distanceTo(
                object.position
            );


        if (
            distance < nearestDistance
        ) {

            nearestDistance =
                distance;

            nearest =
                object;
        }
    }


    if (
        nearest &&
        nearestDistance <= 3
    ) {

        showInteractionPrompt(
            nearest.userData.name
        );

    } else {

        hideInteractionPrompt();

    }
}


/* =========================================================
   INTERACTION PROMPT
========================================================= */

function showInteractionPrompt(
    name
) {

    const prompt =
        document.getElementById(
            "interactionPrompt"
        );


    if (!prompt) {
        return;
    }


    prompt.textContent =
        "Press E to interact with " +
        name;


    prompt.style.display =
        "block";
}


function hideInteractionPrompt() {

    const prompt =
        document.getElementById(
            "interactionPrompt"
        );


    if (!prompt) {
        return;
    }


    prompt.style.display =
        "none";
}


/* =========================================================
   INTERACT WITH OBJECT
========================================================= */

function interact() {

    if (
        !player ||
        gameState.gameOver ||
        gameState.paused
    ) {
        return;
    }


    let nearest = null;

    let nearestDistance =
        Infinity;


    for (
        let i = 0;
        i < interactables.length;
        i++
    ) {

        const object =
            interactables[i];


        if (!object) {
            continue;
        }


        const distance =
            player.position.distanceTo(
                object.position
            );


        if (
            distance < nearestDistance
        ) {

            nearestDistance =
                distance;

            nearest =
                object;
        }
    }


    if (
        !nearest ||
        nearestDistance > 3
    ) {
        return;
    }


    const name =
        nearest.userData.name;


    if (
        name === "Main Door"
    ) {

        openDoor(
            nearest
        );

    } else {

        collectObject(
            nearest
        );
    }
}


/* =========================================================
   OPEN DOOR
========================================================= */

function openDoor(
    door
) {

    if (!door) {
        return;
    }


    door.userData.open =
        true;


    door.userData.targetRotation =
        Math.PI / 2;
}


/* =========================================================
   UPDATE DOOR
========================================================= */

function updateDoors(
    delta
) {

    for (
        let i = 0;
        i < interactables.length;
        i++
    ) {

        const object =
            interactables[i];


        if (
            !object ||
            object.userData.name !==
                "Main Door"
        ) {
            continue;
        }


        if (
            object.userData.open
        ) {

            const target =
                object.userData.targetRotation;


            object.rotation.y =
                THREE.MathUtils.lerp(
                    object.rotation.y,
                    target,
                    Math.min(
                        1,
                        delta * 5
                    )
                );
        }
    }
}


/* =========================================================
   COLLECT OBJECT
========================================================= */

function collectObject(
    object
) {

    if (!object) {
        return;
    }


    gameState.score +=
        25;


    updateScoreUI();


    createHitParticles(
        object.position
    );


    scene.remove(
        object
    );


    const index =
        interactables.indexOf(
            object
        );


    if (
        index !== -1
    ) {

        interactables.splice(
            index,
            1
        );
    }


    hideInteractionPrompt();
}


/* =========================================================
   PLAYER COLLISION WITH ENEMIES
========================================================= */

function resolveEnemyCollision() {

    if (!player) {
        return;
    }


    const radius =
        1.1;


    for (
        let i = 0;
        i < gameState.enemies.length;
        i++
    ) {

        const enemy =
            gameState.enemies[i];


        if (
            !enemy ||
            !enemy.userData.alive
        ) {
            continue;
        }


        const direction =
            new THREE.Vector3()
                .subVectors(
                    player.position,
                    enemy.position
                );


        direction.y = 0;


        const distance =
            direction.length();


        if (
            distance > 0 &&
            distance < radius
        ) {

            direction.normalize();


            const push =
                radius -
                distance;


            player.position.add(
                direction.multiplyScalar(
                    push
                )
            );
        }
    }
}


/* =========================================================
   WORLD COLLISION
========================================================= */

function resolveWorldCollision() {

    if (!player) {
        return;
    }


    resolvePlayerWallCollision();

    resolveEnemyCollision();


    player.position.x =
        THREE.MathUtils.clamp(
            player.position.x,
            -18.5,
            18.5
        );


    player.position.z =
        THREE.MathUtils.clamp(
            player.position.z,
            -18.5,
            18.5
        );
}


/* =========================================================
   AIM DIRECTION
========================================================= */

function getAimDirection() {

    if (!player) {

        return new THREE.Vector3(
            0,
            0,
            -1
        );
    }


    const direction =
        new THREE.Vector3(
            0,
            0,
            -1
        );


    direction.applyQuaternion(
        player.quaternion
    );


    direction.y = 0;


    if (
        direction.lengthSq() === 0
    ) {

        direction.set(
            0,
            0,
            -1
        );
    }


    return direction.normalize();
}


/* =========================================================
   AUTO AIM
========================================================= */

function getNearestEnemy() {

    if (
        !player ||
        gameState.enemies.length === 0
    ) {
        return null;
    }


    let nearest = null;

    let nearestDistance =
        Infinity;


    for (
        let i = 0;
        i < gameState.enemies.length;
        i++
    ) {

        const enemy =
            gameState.enemies[i];


        if (
            !enemy ||
            !enemy.userData.alive
        ) {
            continue;
        }


        const distance =
            player.position.distanceTo(
                enemy.position
            );


        if (
            distance < nearestDistance
        ) {

            nearestDistance =
                distance;

            nearest =
                enemy;
        }
    }


    return nearest;
}


/* =========================================================
   AIM AT ENEMY
========================================================= */

function aimAtNearestEnemy() {

    if (!player) {
        return;
    }


    const enemy =
        getNearestEnemy();


    if (!enemy) {
        return;
    }


    const direction =
        new THREE.Vector3()
            .subVectors(
                enemy.position,
                player.position
            );


    direction.y = 0;


    if (
        direction.lengthSq() === 0
    ) {
        return;
    }


    direction.normalize();


    player.rotation.y =
        Math.atan2(
            direction.x,
            direction.z
        );
}


/* =========================================================
   PLAYER SHOOT INPUT
========================================================= */

function handleShootInput() {

    if (
        !gameState.started ||
        gameState.paused ||
        gameState.gameOver
    ) {
        return;
    }


    if (
        gameState.mouse.down
    ) {

        playerShoot();

    }
}


/* =========================================================
   MOUSE MOVE
========================================================= */

window.addEventListener(
    "mousemove",
    function(event) {

        gameState.mouse.x =
            event.clientX;

        gameState.mouse.y =
            event.clientY;
    }
);


/* =========================================================
   MOUSE DOWN
========================================================= */

window.addEventListener(
    "mousedown",
    function(event) {

        if (
            event.button === 0
        ) {

            gameState.mouse.down =
                true;

        }
    }
);


/* =========================================================
   MOUSE UP
========================================================= */

window.addEventListener(
    "mouseup",
    function(event) {

        if (
            event.button === 0
        ) {

            gameState.mouse.down =
                false;

        }
    }
);


/* =========================================================
   TOUCH START
========================================================= */

window.addEventListener(
    "touchstart",
    function(event) {

        if (
            !event.touches ||
            event.touches.length === 0
        ) {
            return;
        }


        const touch =
            event.touches[0];


        gameState.touch.active =
            true;


        gameState.touch.startX =
            touch.clientX;

        gameState.touch.startY =
            touch.clientY;

        gameState.touch.currentX =
            touch.clientX;

        gameState.touch.currentY =
            touch.clientY;
    },
    {
        passive: true
    }
);


/* =========================================================
   TOUCH MOVE
========================================================= */

window.addEventListener(
    "touchmove",
    function(event) {

        if (
            !gameState.touch.active ||
            !event.touches ||
            event.touches.length === 0
        ) {
            return;
        }


        const touch =
            event.touches[0];


        gameState.touch.currentX =
            touch.clientX;

        gameState.touch.currentY =
            touch.clientY;
    },
    {
        passive: true
    }
);


/* =========================================================
   TOUCH END
========================================================= */

window.addEventListener(
    "touchend",
    function() {

        gameState.touch.active =
            false;

        gameState.touch.startX =
            0;

        gameState.touch.startY =
            0;

        gameState.touch.currentX =
            0;

        gameState.touch.currentY =
            0;
    }
);


/* =========================================================
   KEY DOWN
========================================================= */

window.addEventListener(
    "keydown",
    function(event) {

        const code =
            event.code;


        /* -------------------------------------------------
           IMPORTANT:
           ENTER IS NOT HANDLED HERE.
           ENTER IS HANDLED IN THE SAFE ENTER SECTION.
        ------------------------------------------------- */


        if (
            code === "Space"
        ) {

            event.preventDefault();


            if (
                gameState.started &&
                !gameState.gameOver &&
                !gameState.paused
            ) {

                playerShoot();

            }

            return;
        }


        if (
            code === "KeyE"
        ) {

            event.preventDefault();

            interact();

            return;
        }


        if (
            code === "Escape"
        ) {

            event.preventDefault();

            togglePause();

            return;
        }


        keys[code] =
            true;


        gameState.keys[code] =
            true;
    }
);


/* =========================================================
   KEY UP
========================================================= */

window.addEventListener(
    "keyup",
    function(event) {

        const code =
            event.code;


        /*
           IMPORTANT:
           Enter is NOT handled here.
           Enter must NEVER trigger gameplay
           through keyup.
        */


        keys[code] =
            false;


        gameState.keys[code] =
            false;
    }
);


/* =========================================================
   UPDATE INPUT
========================================================= */

function updateInput(
    delta
) {

    if (
        !gameState.started ||
        gameState.gameOver
    ) {
        return;
    }


    if (
        gameState.paused
    ) {
        return;
    }


    handleShootInput();


    checkInteraction();


    updateDoors(
        delta
    );


    resolveWorldCollision();


    /* -----------------------------------------------------
       SPRINT
    ----------------------------------------------------- */

    player.sprinting =
        !!(
            keys.ShiftLeft ||
            keys.ShiftRight
        );


    /*
       Crouching always disables sprinting.
    */

    if (
        player.crouching
    ) {

        player.sprinting =
            false;
    }
}


/* =========================================================
   END OF PART 3/6
========================================================= */

/* =========================================================
   PART 4/6
========================================================= */

/* =========================================================
   INTERACTION
========================================================= */

function getInteractable() {

    if (
        !state.started ||
        state.paused ||
        state.gameOver
    ) {
        return null;
    }

    const raycaster =
        new THREE.Raycaster();

    raycaster.setFromCamera(
        new THREE.Vector2(0, 0),
        camera
    );

    const objects = [];

    if (keyObject) {
        objects.push(keyObject);
    }

    if (generatorObject) {
        objects.push(generatorObject);
    }

    if (doorObject) {
        objects.push(doorObject);
    }

    if (exitObject && exitObject.visible) {
        objects.push(exitObject);
    }

    const hits =
        raycaster.intersectObjects(
            objects,
            true
        );

    if (
        hits.length === 0
    ) {
        return null;
    }

    const hit =
        hits[0].object;

    let object =
        hit;

    while (
        object &&
        object.parent &&
        !object.userData.interactable &&
        !object.userData.type
    ) {
        object =
            object.parent;
    }

    if (
        object &&
        (
            object.userData.interactable ||
            object.userData.type
        )
    ) {
        return object;
    }

    return null;
}


/* =========================================================
   INTERACTION PROMPT
========================================================= */

function updateInteraction() {

    const object =
        getInteractable();

    if (!object) {

        hideInteractionPrompt();

        return;
    }

    const type =
        object.userData.type;


    if (
        type === "key"
    ) {

        if (
            !state.hasKey
        ) {

            showInteractionPrompt(
                "Press E to pick up the key"
            );

        } else {

            hideInteractionPrompt();
        }

        return;
    }


    if (
        type === "generator"
    ) {

        if (
            !state.generatorOn
        ) {

            showInteractionPrompt(
                "Press E to start the generator"
            );

        } else {

            hideInteractionPrompt();
        }

        return;
    }


    if (
        type === "door"
    ) {

        if (
            !state.hasKey
        ) {

            showInteractionPrompt(
                "The door is locked"
            );

        } else if (
            !state.generatorOn
        ) {

            showInteractionPrompt(
                "The door has no power"
            );

        } else {

            showInteractionPrompt(
                "Press E to open the door"
            );
        }

        return;
    }


    if (
        type === "exit"
    ) {

        showInteractionPrompt(
            "Press E to escape"
        );

        return;
    }


    hideInteractionPrompt();
}


/* =========================================================
   INTERACTION ACTION
========================================================= */

function interact() {

    if (
        !state.started ||
        state.paused ||
        state.gameOver
    ) {
        return;
    }


    const object =
        getInteractable();


    if (!object) {

        return;
    }


    const type =
        object.userData.type;


    /* -----------------------------------------------------
       KEY
    ----------------------------------------------------- */

    if (
        type === "key"
    ) {

        if (
            state.hasKey
        ) {

            return;
        }


        state.hasKey =
            true;


        if (
            keyObject
        ) {

            keyObject.visible =
                false;
        }


        playPickupSound();


        showMessage(
            "You found the key.",
            2500
        );


        updateObjectives();


        hideInteractionPrompt();


        return;
    }


    /* -----------------------------------------------------
       GENERATOR
    ----------------------------------------------------- */

    if (
        type === "generator"
    ) {

        if (
            state.generatorOn
        ) {

            return;
        }


        state.generatorOn =
            true;


        activateGenerator();


        playGeneratorSound();


        showMessage(
            "The generator is running.",
            3000
        );


        updateObjectives();


        hideInteractionPrompt();


        return;
    }


    /* -----------------------------------------------------
       DOOR
    ----------------------------------------------------- */

    if (
        type === "door"
    ) {

        if (
            !state.hasKey
        ) {

            showMessage(
                "The door is locked. Find the key.",
                2500
            );

            return;
        }


        if (
            !state.generatorOn
        ) {

            showMessage(
                "There is no power. Start the generator.",
                2500
            );

            return;
        }


        openMainDoor();


        return;
    }


    /* -----------------------------------------------------
       EXIT
    ----------------------------------------------------- */

    if (
        type === "exit"
    ) {

        completeGame();


        return;
    }
}


/* =========================================================
   KEYBOARD
========================================================= */

window.addEventListener(
    "keydown",
    function(event) {

        const code =
            event.code;


        /* -------------------------------------------------
           PREVENT REPEATED ENTER
        ------------------------------------------------- */

        if (
            code === "Enter" &&
            event.repeat
        ) {

            event.preventDefault();

            return;
        }


        /* -------------------------------------------------
           ENTER
        ------------------------------------------------- */

        if (
            code === "Enter"
        ) {

            event.preventDefault();


            if (
                typeof handleEnterKey ===
                "function"
            ) {

                handleEnterKey();
            }


            return;
        }


        /* -------------------------------------------------
           ESCAPE
        ------------------------------------------------- */

        if (
            code === "Escape"
        ) {

            event.preventDefault();


            if (
                state.started &&
                !state.gameOver
            ) {

                togglePause();
            }


            return;
        }


        /* -------------------------------------------------
           INTERACTION
        ------------------------------------------------- */

        if (
            code === "KeyE"
        ) {

            if (
                !event.repeat
            ) {

                interact();
            }


            return;
        }


        /* -------------------------------------------------
           MOVEMENT
        ------------------------------------------------- */

        if (
            code === "KeyW" ||
            code === "ArrowUp"
        ) {

            keys.forward =
                true;
        }


        if (
            code === "KeyS" ||
            code === "ArrowDown"
        ) {

            keys.backward =
                true;
        }


        if (
            code === "KeyA" ||
            code === "ArrowLeft"
        ) {

            keys.left =
                true;
        }


        if (
            code === "KeyD" ||
            code === "ArrowRight"
        ) {

            keys.right =
                true;
        }


        /* -------------------------------------------------
           SPRINT
        ------------------------------------------------- */

        if (
            code === "ShiftLeft" ||
            code === "ShiftRight"
        ) {

            keys.sprint =
                true;
        }
    },
    {
        passive: false
    }
);


/* =========================================================
   KEY UP
========================================================= */

window.addEventListener(
    "keyup",
    function(event) {

        const code =
            event.code;


        if (
            code === "KeyW" ||
            code === "ArrowUp"
        ) {

            keys.forward =
                false;
        }


        if (
            code === "KeyS" ||
            code === "ArrowDown"
        ) {

            keys.backward =
                false;
        }


        if (
            code === "KeyA" ||
            code === "ArrowLeft"
        ) {

            keys.left =
                false;
        }


        if (
            code === "KeyD" ||
            code === "ArrowRight"
        ) {

            keys.right =
                false;
        }


        if (
            code === "ShiftLeft" ||
            code === "ShiftRight"
        ) {

            keys.sprint =
                false;
        }
    }
);


/* =========================================================
   RESET KEYBOARD
========================================================= */

function resetKeyboardState() {

    keys.forward =
        false;

    keys.backward =
        false;

    keys.left =
        false;

    keys.right =
        false;

    keys.sprint =
        false;
}


/* =========================================================
   MOUSE
========================================================= */

if (
    renderer &&
    renderer.domElement
) {

    renderer.domElement.addEventListener(
        "mousedown",
        function(event) {

            if (
                event.button !== 0
            ) {

                return;
            }


            if (
                !state.started ||
                state.paused ||
                state.gameOver
            ) {

                return;
            }


            mouseDown =
                true;


            shoot();
        }
    );


    renderer.domElement.addEventListener(
        "mouseup",
        function(event) {

            if (
                event.button === 0
            ) {

                mouseDown =
                    false;
            }
        }
    );


    renderer.domElement.addEventListener(
        "mouseleave",
        function() {

            mouseDown =
                false;
        }
    );
}


/* =========================================================
   POINTER LOCK
========================================================= */

if (
    renderer &&
    renderer.domElement
) {

    renderer.domElement.addEventListener(
        "click",
        function() {

            if (
                !state.started ||
                state.paused ||
                state.gameOver
            ) {

                return;
            }


            if (
                document.pointerLockElement !==
                renderer.domElement
            ) {

                try {

                    renderer.domElement.requestPointerLock();

                } catch (error) {}
            }
        }
    );
}


/* =========================================================
   MOUSE LOOK
========================================================= */

document.addEventListener(
    "mousemove",
    function(event) {

        if (
            !state.started ||
            state.paused ||
            state.gameOver
        ) {

            return;
        }


        if (
            document.pointerLockElement !==
            renderer.domElement
        ) {

            return;
        }


        const sensitivity =
            0.0022;


        yaw -=
            event.movementX *
            sensitivity;


        pitch -=
            event.movementY *
            sensitivity;


        const limit =
            Math.PI / 2 -
            0.08;


        pitch =
            Math.max(
                -limit,
                Math.min(
                    limit,
                    pitch
                )
            );


        player.rotation.y =
            yaw;


        camera.rotation.x =
            pitch;
    }
);


/* =========================================================
   MOBILE CONTROLS
========================================================= */

function setupMobileControls() {

    const joystick =
        document.getElementById(
            "joystick"
        );

    const joystickKnob =
        document.getElementById(
            "joystickKnob"
        );

    const lookArea =
        document.getElementById(
            "lookArea"
        );


    if (
        !joystick ||
        !joystickKnob
    ) {

        return;
    }


    let joystickActive =
        false;

    let joystickPointerId =
        null;


    function updateJoystick(
        clientX,
        clientY
    ) {

        const rect =
            joystick.getBoundingClientRect();


        const centerX =
            rect.left +
            rect.width / 2;


        const centerY =
            rect.top +
            rect.height / 2;


        let dx =
            clientX -
            centerX;


        let dy =
            clientY -
            centerY;


        const maxDistance =
            rect.width / 2;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            distance >
            maxDistance
        ) {

            const ratio =
                maxDistance /
                distance;


            dx *=
                ratio;

            dy *=
                ratio;
        }


        joystickKnob.style.transform =
            "translate(" +
            dx +
            "px, " +
            dy +
            "px)";


        const normalizedX =
            dx /
            maxDistance;


        const normalizedY =
            dy /
            maxDistance;


        keys.left =
            normalizedX < -0.18;

        keys.right =
            normalizedX > 0.18;

        keys.forward =
            normalizedY < -0.18;

        keys.backward =
            normalizedY > 0.18;
    }


    function resetJoystick() {

        joystickActive =
            false;

        joystickPointerId =
            null;


        joystickKnob.style.transform =
            "translate(0px, 0px)";


        keys.left =
            false;

        keys.right =
            false;

        keys.forward =
            false;

        keys.backward =
            false;
    }


    joystick.addEventListener(
        "pointerdown",
        function(event) {

            if (
                !state.started ||
                state.paused ||
                state.gameOver
            ) {

                return;
            }


            event.preventDefault();


            joystickActive =
                true;


            joystickPointerId =
                event.pointerId;


            try {

                joystick.setPointerCapture(
                    event.pointerId
                );

            } catch (error) {}


            updateJoystick(
                event.clientX,
                event.clientY
            );
        },
        {
            passive: false
        }
    );


    joystick.addEventListener(
        "pointermove",
        function(event) {

            if (
                !joystickActive ||
                event.pointerId !==
                joystickPointerId
            ) {

                return;
            }


            event.preventDefault();


            updateJoystick(
                event.clientX,
                event.clientY
            );
        },
        {
            passive: false
        }
    );


    joystick.addEventListener(
        "pointerup",
        function(event) {

            if (
                event.pointerId ===
                joystickPointerId
            ) {

                resetJoystick();
            }
        }
    );


    joystick.addEventListener(
        "pointercancel",
        function() {

            resetJoystick();
        }
    );


    /* -----------------------------------------------------
       MOBILE LOOK
    ----------------------------------------------------- */

    if (
        lookArea
    ) {

        let lookActive =
            false;

        let lookPointerId =
            null;

        let lastX =
            0;

        let lastY =
            0;


        lookArea.addEventListener(
            "pointerdown",
            function(event) {

                if (
                    !state.started ||
                    state.paused ||
                    state.gameOver
                ) {

                    return;
                }


                if (
                    event.target.closest(
                        ".mobileButton"
                    )
                ) {

                    return;
                }


                event.preventDefault();


                lookActive =
                    true;


                lookPointerId =
                    event.pointerId;


                lastX =
                    event.clientX;

                lastY =
                    event.clientY;


                try {

                    lookArea.setPointerCapture(
                        event.pointerId
                    );

                } catch (error) {}
            },
            {
                passive: false
            }
        );


        lookArea.addEventListener(
            "pointermove",
            function(event) {

                if (
                    !lookActive ||
                    event.pointerId !==
                    lookPointerId
                ) {

                    return;
                }


                event.preventDefault();


                const dx =
                    event.clientX -
                    lastX;


                const dy =
                    event.clientY -
                    lastY;


                lastX =
                    event.clientX;

                lastY =
                    event.clientY;


                const sensitivity =
                    0.004;


                yaw -=
                    dx *
                    sensitivity;


                pitch -=
                    dy *
                    sensitivity;


                const limit =
                    Math.PI / 2 -
                    0.08;


                pitch =
                    Math.max(
                        -limit,
                        Math.min(
                            limit,
                            pitch
                        )
                    );


                player.rotation.y =
                    yaw;

                camera.rotation.x =
                    pitch;
            },
            {
                passive: false
            }
        );


        lookArea.addEventListener(
            "pointerup",
            function(event) {

                if (
                    event.pointerId ===
                    lookPointerId
                ) {

                    lookActive =
                        false;

                    lookPointerId =
                        null;
                }
            }
        );


        lookArea.addEventListener(
            "pointercancel",
            function() {

                lookActive =
                    false;

                lookPointerId =
                    null;
            }
        );
    }


    /* -----------------------------------------------------
       MOBILE BUTTONS
    ----------------------------------------------------- */

    const interactButton =
        document.getElementById(
            "mobileInteract"
        );


    const flashlightButton =
        document.getElementById(
            "mobileFlashlight"
        );


    const sprintButton =
        document.getElementById(
            "mobileSprint"
        );


    const shootButton =
        document.getElementById(
            "mobileShoot"
        );


    if (
        interactButton
    ) {

        interactButton.addEventListener(
            "pointerdown",
            function(event) {

                event.preventDefault();

                interact();
            },
            {
                passive: false
            }
        );
    }


    if (
        flashlightButton
    ) {

        flashlightButton.addEventListener(
            "pointerdown",
            function(event) {

                event.preventDefault();

                toggleFlashlight();
            },
            {
                passive: false
            }
        );
    }


    if (
        sprintButton
    ) {

        sprintButton.addEventListener(
            "pointerdown",
            function(event) {

                event.preventDefault();

                keys.sprint =
                    true;
            },
            {
                passive: false
            }
        );


        sprintButton.addEventListener(
            "pointerup",
            function(event) {

                event.preventDefault();

                keys.sprint =
                    false;
            },
            {
                passive: false
            }
        );


        sprintButton.addEventListener(
            "pointercancel",
            function() {

                keys.sprint =
                    false;
            }
        );
    }


    if (
        shootButton
    ) {

        shootButton.addEventListener(
            "pointerdown",
            function(event) {

                event.preventDefault();

                mouseDown =
                    true;

                shoot();
            },
            {
                passive: false
            }
        );


        shootButton.addEventListener(
            "pointerup",
            function(event) {

                event.preventDefault();

                mouseDown =
                    false;
            },
            {
                passive: false
            }
        );


        shootButton.addEventListener(
            "pointercancel",
            function() {

                mouseDown =
                    false;
            }
        );
    }
}


/* =========================================================
   TOUCH SAFETY
========================================================= */

window.addEventListener(
    "blur",
    function() {

        resetKeyboardState();

        mouseDown =
            false;
    }
);


document.addEventListener(
    "visibilitychange",
    function() {

        if (
            document.hidden
        ) {

            resetKeyboardState();

            mouseDown =
                false;
        }
    }
);


/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
    "resize",
    function() {

        if (
            !camera ||
            !renderer
        ) {

            return;
        }


        const width =
            window.innerWidth;


        const height =
            window.innerHeight;


        camera.aspect =
            width /
            height;


        camera.updateProjectionMatrix();


        renderer.setSize(
            width,
            height,
            false
        );


        renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio ||
                1,
                2
            )
        );
    }
);


/* =========================================================
   MOBILE ORIENTATION
========================================================= */

window.addEventListener(
    "orientationchange",
    function() {

        setTimeout(
            function() {

                window.dispatchEvent(
                    new Event("resize")
                );

            },
            150
        );
    }
);


/* =========================================================
   PAUSE
========================================================= */

function togglePause() {

    if (
        !state.started ||
        state.gameOver
    ) {

        return;
    }


    state.paused =
        !state.paused;


    if (
        state.paused
    ) {

        showPauseScreen();


        resetKeyboardState();

        mouseDown =
            false;


        try {

            if (
                document.pointerLockElement
            ) {

                document.exitPointerLock();
            }

        } catch (error) {}


    } else {

        hidePauseScreen();


        requestPointerLock();
    }
}


/* =========================================================
   POINTER LOCK REQUEST
========================================================= */

function requestPointerLock() {

    if (
        !renderer ||
        !renderer.domElement
    ) {

        return;
    }


    if (
        window.matchMedia(
            "(pointer: coarse)"
        ).matches
    ) {

        return;
    }


    try {

        renderer.domElement.requestPointerLock();

    } catch (error) {}
}


/* =========================================================
   PAUSE SCREEN
========================================================= */

function showPauseScreen() {

    const pauseScreen =
        document.getElementById(
            "pauseScreen"
        );


    if (
        pauseScreen
    ) {

        pauseScreen.classList.add(
            "active"
        );
    }
}


function hidePauseScreen() {

    const pauseScreen =
        document.getElementById(
            "pauseScreen"
        );


    if (
        pauseScreen
    ) {

        pauseScreen.classList.remove(
            "active"
        );
    }
}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    text,
    duration
) {

    const message =
        document.getElementById(
            "message"
        );


    if (
        !message
    ) {

        return;
    }


    message.textContent =
        text;


    message.classList.add(
        "active"
    );


    state.messageTimer =
        duration ||
        2500;
}


function hideMessage() {

    const message =
        document.getElementById(
            "message"
        );


    if (
        message
    ) {

        message.classList.remove(
            "active"
        );
    }


    state.messageTimer =
        0;
}


/* =========================================================
   INTERACTION PROMPT UI
========================================================= */

function showInteractionPrompt(
    text
) {

    const prompt =
        document.getElementById(
            "interactionPrompt"
        );


    if (
        !prompt
    ) {

        return;
    }


    prompt.textContent =
        text;


    prompt.classList.add(
        "active"
    );
}


function hideInteractionPrompt() {

    const prompt =
        document.getElementById(
            "interactionPrompt"
        );


    if (
        prompt
    ) {

        prompt.classList.remove(
            "active"
        );
    }
}


/* =========================================================
   OBJECTIVES
========================================================= */

function updateObjectives() {

    const objective =
        document.getElementById(
            "objective"
        );


    if (
        !objective
    ) {

        return;
    }


    if (
        !state.hasKey
    ) {

        objective.textContent =
            "Find the key.";

        return;
    }


    if (
        !state.generatorOn
    ) {

        objective.textContent =
            "Start the generator.";

        return;
    }


    if (
        !state.doorOpened
    ) {

        objective.textContent =
            "Open the main door.";

        return;
    }


    objective.textContent =
        "Escape the room.";
}


/* =========================================================
   GENERATOR
========================================================= */

function activateGenerator() {

    if (
        generatorObject
    ) {

        generatorObject.userData.active =
            true;
    }


    if (
        generatorLight
    ) {

        generatorLight.visible =
            true;

        generatorLight.intensity =
            2.5;
    }


    if (
        roomLights
    ) {

        roomLights.forEach(
            function(light) {

                if (
                    light &&
                    light.userData
                ) {

                    light.userData.powered =
                        true;
                }
            }
        );
    }


    if (
        emergencyLights
    ) {

        emergencyLights.forEach(
            function(light) {

                if (
                    light
                ) {

                    light.visible =
                        true;
                }
            }
        );
    }


    state.power =
        true;
}


/* =========================================================
   DOOR
========================================================= */

function openMainDoor() {

    if (
        state.doorOpened
    ) {

        return;
    }


    state.doorOpened =
        true;


    if (
        doorObject
    ) {

        doorObject.userData.opening =
            true;
    }


    playDoorSound();


    showMessage(
        "The door opens slowly...",
        3000
    );


    updateObjectives();


    setTimeout(
        function() {

            if (
                doorObject
            ) {

                doorObject.visible =
                    false;
            }


            if (
                exitObject
            ) {

                exitObject.visible =
                    true;
            }


            state.exitAvailable =
                true;


            updateObjectives();

        },
        1600
    );
}


/* =========================================================
   GAME COMPLETE
========================================================= */

function completeGame() {

    if (
        state.gameOver
    ) {

        return;
    }


    state.gameOver =
        true;


    resetKeyboardState();

    mouseDown =
        false;


    try {

        if (
            document.pointerLockElement
        ) {

            document.exitPointerLock();
        }

    } catch (error) {}


    const winScreen =
        document.getElementById(
            "winScreen"
        );


    if (
        winScreen
    ) {

        winScreen.classList.add(
            "active"
        );
    }


    if (
        typeof playWinSound ===
        "function"
    ) {

        playWinSound();
    }
}


/* =========================================================
   GAME OVER
========================================================= */

function gameOver() {

    if (
        state.gameOver
    ) {

        return;
    }


    state.gameOver =
        true;


    resetKeyboardState();

    mouseDown =
        false;


    try {

        if (
            document.pointerLockElement
        ) {

            document.exitPointerLock();
        }

    } catch (error) {}


    const gameOverScreen =
        document.getElementById(
            "gameOverScreen"
        );


    if (
        gameOverScreen
    ) {

        gameOverScreen.classList.add(
            "active"
        );
    }
}


/* =========================================================
   RESTART
========================================================= */

function restartGame() {

    window.location.reload();
}


/* =========================================================
   FLASHLIGHT
========================================================= */

function toggleFlashlight() {

    if (
        !flashlight
    ) {

        return;
    }


    flashlight.visible =
        !flashlight.visible;


    state.flashlightOn =
        flashlight.visible;


    if (
        typeof playFlashlightSound ===
        "function"
    ) {

        playFlashlightSound();
    }
}


/* =========================================================
   FLASHLIGHT UPDATE
========================================================= */

function updateFlashlight(
    delta
) {

    if (
        !flashlight ||
        !camera
    ) {

        return;
    }


    flashlight.position.set(
        0,
        -0.08,
        -0.02
    );


    flashlight.target.position.set(
        0,
        0,
        -5
    );


    flashlight.target.updateMatrixWorld();


    if (
        flashlight.visible
    ) {

        flashlight.intensity =
            4.0;
    } else {

        flashlight.intensity =
            0;
    }
}


/* =========================================================
   SPRINT
========================================================= */

function updateSprint() {

    if (
        !state.started ||
        state.paused ||
        state.gameOver
    ) {

        return;
    }


    const moving =
        keys.forward ||
        keys.backward ||
        keys.left ||
        keys.right;


    if (
        keys.sprint &&
        moving &&
        state.stamina > 0
    ) {

        state.sprinting =
            true;

        state.stamina -=
            0.65;


        if (
            state.stamina < 0
        ) {

            state.stamina =
                0;
        }

    } else {

        state.sprinting =
            false;


        state.stamina +=
            0.35;


        if (
            state.stamina > 100
        ) {

            state.stamina =
                100;
        }
    }


    updateStaminaUI();
}


/* =========================================================
   STAMINA UI
========================================================= */

function updateStaminaUI() {

    const staminaFill =
        document.getElementById(
            "staminaFill"
        );


    if (
        !staminaFill
    ) {

        return;
    }


    staminaFill.style.width =
        state.stamina +
        "%";
}


/* =========================================================
   PLAYER MOVEMENT
========================================================= */

function updatePlayer(
    delta
) {

    if (
        !player ||
        !camera
    ) {

        return;
    }


    const direction =
        new THREE.Vector3();


    const forward =
        new THREE.Vector3(
            0,
            0,
            -1
        );


    const right =
        new THREE.Vector3(
            1,
            0,
            0
        );


    forward.applyQuaternion(
        player.quaternion
    );

    right.applyQuaternion(
        player.quaternion
    );


    if (
        keys.forward
    ) {

        direction.add(
            forward
        );
    }


    if (
        keys.backward
    ) {

        direction.sub(
            forward
        );
    }


    if (
        keys.right
    ) {

        direction.add(
            right
        );
    }


    if (
        keys.left
    ) {

        direction.sub(
            right
        );
    }


    if (
        direction.lengthSq() >
        0
    ) {

        direction.normalize();


        let speed =
            2.8;


        if (
            state.sprinting
        ) {

            speed =
                5.2;
        }


        const movement =
            direction.multiplyScalar(
                speed *
                delta
            );


        player.position.add(
            movement
        );


        constrainPlayer();
    }


    camera.position.copy(
        player.position
    );


    camera.position.y +=
        1.62;


    camera.rotation.order =
        "YXZ";


    player.rotation.y =
        yaw;


    camera.rotation.y =
        0;

}


/* =========================================================
   PLAYER CONSTRAINT
========================================================= */

function constrainPlayer() {

    if (
        !player
    ) {

        return;
    }


    const limit =
        14;


    player.position.x =
        Math.max(
            -limit,
            Math.min(
                limit,
                player.position.x
            )
        );


    player.position.z =
        Math.max(
            -limit,
            Math.min(
                limit,
                player.position.z
            )
        );
}


/* =========================================================
   ZOMBIES
========================================================= */

function updateZombies(
    delta
) {

    if (
        !zombies ||
        zombies.length === 0 ||
        !player
    ) {

        return;
    }


    zombies.forEach(
        function(zombie) {

            if (
                !zombie ||
                !zombie.visible
            ) {

                return;
            }


            const distance =
                zombie.position.distanceTo(
                    player.position
                );


            if (
                distance >
                25
            ) {

                return;
            }


            const direction =
                new THREE.Vector3()
                    .subVectors(
                        player.position,
                        zombie.position
                    );


            direction.y =
                0;


            if (
                direction.lengthSq() >
                0
            ) {

                direction.normalize();
            }


            const zombieSpeed =
                distance < 8
                    ? 1.4
                    : 0.8;


            zombie.position.add(
                direction.multiplyScalar(
                    zombieSpeed *
                    delta
                )
            );


            zombie.lookAt(
                player.position.x,
                zombie.position.y,
                player.position.z
            );


            if (
                distance <
                1.35
            ) {

                damagePlayer(
                    delta
                );
            }
        }
    );
}


/* =========================================================
   PLAYER DAMAGE
========================================================= */

function damagePlayer(
    delta
) {

    if (
        state.invulnerable ||
        state.gameOver
    ) {

        return;
    }


    state.health -=
        18 *
        delta;


    if (
        state.health <=
        0
    ) {

        state.health =
            0;


        updateHealthUI();


        gameOver();


        return;
    }


    updateHealthUI();
}


/* =========================================================
   HEALTH UI
========================================================= */

function updateHealthUI() {

    const healthFill =
        document.getElementById(
            "healthFill"
        );


    if (
        !healthFill
    ) {

        return;
    }


    healthFill.style.width =
        Math.max(
            0,
            state.health
        ) +
        "%";
}


/* =========================================================
   GUN
========================================================= */

function updateGun(
    delta
) {

    if (
        !gun
    ) {

        return;
    }


    gun.position.set(
        0.28,
        -0.28,
        -0.52
    );


    gun.rotation.set(
        -0.05,
        0.02,
        0
    );
}


/* =========================================================
   SHOOT
========================================================= */

function shoot() {

    if (
        !state.started ||
        state.paused ||
        state.gameOver
    ) {

        return;
    }


    if (
        state.ammo <=
        0
    ) {

        return;
    }


    const now =
        performance.now();


    if (
        now -
        state.lastShot <
        180
    ) {

        return;
    }


    state.lastShot =
        now;


    state.ammo--;


    updateAmmoUI();


    playShootSound();


    const raycaster =
        new THREE.Raycaster();


    raycaster.setFromCamera(
        new THREE.Vector2(0, 0),
        camera
    );


    const targets =
        [];


    zombies.forEach(
        function(zombie) {

            if (
                zombie &&
                zombie.visible
            ) {

                targets.push(
                    zombie
                );
            }
        }
    );


    const hits =
        raycaster.intersectObjects(
            targets,
            true
        );


    if (
        hits.length ===
        0
    ) {

        return;
    }


    let target =
        hits[0].object;


    while (
        target &&
        target.parent &&
        !target.userData.zombie
    ) {

        target =
            target.parent;
    }


    if (
        target &&
        target.userData.zombie
    ) {

        hitZombie(
            target
        );
    }
}


/* =========================================================
   ZOMBIE HIT
========================================================= */

function hitZombie(
    zombie
) {

    if (
        !zombie
    ) {

        return;
    }


    zombie.userData.health -=
        35;


    if (
        zombie.userData.health <=
        0
    ) {

        zombie.visible =
            false;


        zombie.userData.dead =
            true;


        state.kills++;


        updateKillsUI();


        return;
    }


    zombie.userData.hitTimer =
        0.15;
}


/* =========================================================
   AMMO UI
========================================================= */

function updateAmmoUI() {

    const ammo =
        document.getElementById(
            "ammo"
        );


    if (
        !ammo
    ) {

        return;
    }


    ammo.textContent =
        state.ammo;
}


/* =========================================================
   APPARITION
========================================================= */

function updateApparition(
    delta
) {

    if (
        !apparition
    ) {

        return;
    }


    state.apparitionTimer -=
        delta;


    if (
        state.apparitionTimer <=
        0
    ) {

        state.apparitionTimer =
            THREE.MathUtils.randFloat(
                12,
                24
            );


        if (
            Math.random() <
            0.45
        ) {

            apparition.visible =
                true;


            state.apparitionVisible =
                true;


            state.apparitionLife =
                THREE.MathUtils.randFloat(
                    1.5,
                    3.5
                );

        } else {

            apparition.visible =
                false;

            state.apparitionVisible =
                false;
        }
    }


    if (
        state.apparitionVisible
    ) {

        state.apparitionLife -=
            delta;


        if (
            state.apparitionLife <=
            0
        ) {

            apparition.visible =
                false;

            state.apparitionVisible =
                false;
        }
    }
}


/* =========================================================
   LIGHT FLICKER
========================================================= */

function updateLightFlicker(
    delta
) {

    if (
        !roomLights ||
        roomLights.length ===
        0
    ) {

        return;
    }


    flickerTimer -=
        delta;


    if (
        flickerTimer <=
        0
    ) {

        flickerTimer =
            THREE.MathUtils.randFloat(
                0.05,
                0.25
            );


        roomLights.forEach(
            function(light) {

                if (
                    !light ||
                    !light.userData.powered
                ) {

                    return;
                }


                const base =
                    light.userData.baseIntensity ||
                    1;


                light.intensity =
                    base *
                    THREE.MathUtils.randFloat(
                        0.72,
                        1.05
                    );
            }
        );
    }
}


/* =========================================================
   KILLS UI
========================================================= */

function updateKillsUI() {

    const kills =
        document.getElementById(
            "kills"
        );


    if (
        kills
    ) {

        kills.textContent =
            state.kills;
    }
}


/* =========================================================
   AUDIO
========================================================= */

function playPickupSound() {

    if (
        typeof audioPickup ===
        "function"
    ) {

        audioPickup();
    }
}


function playGeneratorSound() {

    if (
        typeof audioGenerator ===
        "function"
    ) {

        audioGenerator();
    }
}


function playDoorSound() {

    if (
        typeof audioDoor ===
        "function"
    ) {

        audioDoor();
    }
}


function playShootSound() {

    if (
        typeof audioShoot ===
        "function"
    ) {

        audioShoot();
    }
}


function playFlashlightSound() {

    if (
        typeof audioFlashlight ===
        "function"
    ) {

        audioFlashlight();
    }
}


/* =========================================================
   GAME LOOP
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


    if (
        state.messageTimer >
        0
    ) {

        state.messageTimer -=
            delta *
            1000;


        if (
            state.messageTimer <=
            0
        ) {

            hideMessage();
        }
    }


    if (
        state.started &&
        !state.paused &&
        !state.gameOver
    ) {

        updateSprint();

        updatePlayer(
            delta
        );

        updateZombies(
            delta
        );

        updateFlashlight(
            delta
        );

        updateGun(
            delta
        );

        updateApparition(
            delta
        );

        updateLightFlicker(
            delta
        );

        updateInteraction();


        if (
            mouseDown
        ) {

            shoot();
        }
    }


    renderer.render(
        scene,
        camera
    );
}


/* =========================================================
   STARTUP
========================================================= */

initializeGame();

animate();


/* =========================================================
   FINAL CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    function() {

        resetKeyboardState();


        try {

            if (
                document.pointerLockElement
            ) {

                document.exitPointerLock();
            }

        } catch (error) {}
    }
);

/* =========================================================
   PART 5/6
========================================================= */

/* =========================================================
   INPUT EVENTS
========================================================= */


/* =========================================================
   KEY DOWN
========================================================= */

window.addEventListener(
    "keydown",
    function(event) {

        const code =
            event.code;


            /*
               RESUME
            */

            if (
                state.paused &&
                !state.gameOver
            ) {

                resumeGame();

                return;
            }


            /*
               RESTART
            */

            if (
                state.gameOver
            ) {

                restartGame();

                return;
            }


            return;
        }


        /* =================================================
           ESCAPE / PAUSE
        ================================================= */

        if (
            code === "Escape"
        ) {

            event.preventDefault();


            if (
                state.started &&
                !state.gameOver
            ) {

                if (
                    state.paused
                ) {

                    resumeGame();

                } else {

                    pauseGame();
                }
            }

            return;
        }


        /* =================================================
           STORE KEY
        ================================================= */

        keys[code] =
            true;


        /* =================================================
           FLASHLIGHT
        ================================================= */

        if (
            code === "KeyF"
        ) {

            event.preventDefault();

            toggleFlashlight();

            return;
        }


        /* =================================================
           RELOAD
        ================================================= */

        if (
            code === "KeyR"
        ) {

            event.preventDefault();

            reload();

            return;
        }


        /* =================================================
           INTERACT
        ================================================= */

        if (
            code === "KeyE"
        ) {

            event.preventDefault();

            interact();

            return;
        }


        /* =================================================
           JUMP
        ================================================= */

        if (
            code === "Space"
        ) {

            event.preventDefault();

            jump();

            return;
        }


        /* =================================================
           CROUCH
        ================================================= */

        if (
            code === "ControlLeft" ||
            code === "ControlRight"
        ) {

            setCrouch(
                true
            );

            return;
        }


        /* =================================================
           WEAPON 1
        ================================================= */

        if (
            code === "Digit1"
        ) {

            currentWeaponIndex =
                0;

            updateWeaponUI();

            return;
        }


        /* =================================================
           WEAPON 2
        ================================================= */

        if (
            code === "Digit2"
        ) {

            currentWeaponIndex =
                1;

            updateWeaponUI();

            return;
        }


        /* =================================================
           WEAPON 3
        ================================================= */

        if (
            code === "Digit3"
        ) {

            currentWeaponIndex =
                2;

            updateWeaponUI();

            return;
        }


        /* =================================================
           WEAPON NEXT
        ================================================= */

        if (
            code === "KeyQ"
        ) {

            switchWeapon(
                1
            );

            return;
        }


        /* =================================================
           WEAPON PREVIOUS
        ================================================= */

        if (
            code === "KeyZ"
        ) {

            switchWeapon(
                -1
            );

            return;
        }
    },
    {
        passive: false
    }
);


/* =========================================================
   KEY UP
========================================================= */

window.addEventListener(
    "keyup",
    function(event) {

        const code =
            event.code;


        /*
           IMPORTANT:
           Enter is NOT handled here.
           This prevents the old Enter
           freeze/non-response problem.
        */


        if (
            code === "ControlLeft" ||
            code === "ControlRight"
        ) {

            setCrouch(
                false
            );
        }


        keys[code] =
            false;
    },
    {
        passive: false
    }
);


/* =========================================================
   MOUSE EVENTS
========================================================= */

window.addEventListener(
    "mousemove",
    handleMouseMove
);


if (
    renderer &&
    renderer.domElement
) {

    renderer.domElement.addEventListener(
        "mousedown",
        handleMouseDown
    );

    renderer.domElement.addEventListener(
        "mouseup",
        handleMouseUp
    );

} else {

    window.addEventListener(
        "mousedown",
        handleMouseDown
    );

    window.addEventListener(
        "mouseup",
        handleMouseUp
    );
}


/* =========================================================
   POINTER LOCK CHANGE
========================================================= */

document.addEventListener(
    "pointerlockchange",
    function() {

        if (
            !state.started ||
            state.gameOver
        ) {
            return;
        }


        if (
            document.pointerLockElement !==
            renderer.domElement
        ) {

            if (
                !state.paused
            ) {

                pauseGame();
            }
        }
    }
);


/* =========================================================
   WINDOW BLUR
========================================================= */

window.addEventListener(
    "blur",
    function() {

        resetKeyboardState();
    }
);


/* =========================================================
   WINDOW RESIZE
========================================================= */

window.addEventListener(
    "resize",
    function() {

        if (
            !camera ||
            !renderer
        ) {
            return;
        }


        camera.aspect =
            window.innerWidth /
            window.innerHeight;


        camera.updateProjectionMatrix();


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );


        renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio || 1,
                2
            )
        );


        updateMobileVisibility();
    }
);


/* =========================================================
   BUTTON EVENTS
========================================================= */

if (
    startButton
) {

    startButton.addEventListener(
        "click",
        function() {

            startGame();
        }
    );
}


if (
    resumeButton
) {

    resumeButton.addEventListener(
        "click",
        function() {

            resumeGame();
        }
    );
}


if (
    restartButton
) {

    restartButton.addEventListener(
        "click",
        function() {

            restartGame();
        }
    );
}


if (
    againButton
) {

    againButton.addEventListener(
        "click",
        function() {

            restartGame();
        }
    );
}


if (
    controlsButton
) {

    controlsButton.addEventListener(
        "click",
        function() {

            controlsPanel.classList.add(
                "visible"
            );
        }
    );
}


if (
    pauseControlsButton
) {

    pauseControlsButton.addEventListener(
        "click",
        function() {

            controlsPanel.classList.add(
                "visible"
            );
        }
    );
}


if (
    closeControls
) {

    closeControls.addEventListener(
        "click",
        function() {

            controlsPanel.classList.remove(
                "visible"
            );
        }
    );
}

/* =========================================================
   PART 6/6
========================================================= */

/* =========================================================
   MOBILE SHOOT
========================================================= */

if (
    mobileShoot
) {

    mobileShoot.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            shoot();
        }
    );
}


/* =========================================================
   MOBILE RELOAD
========================================================= */

if (
    mobileReload
) {

    mobileReload.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            reload();
        }
    );
}


/* =========================================================
   MOBILE JUMP
========================================================= */

if (
    mobileJump
) {

    mobileJump.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            jump();
        }
    );
}


/* =========================================================
   MOBILE CROUCH
========================================================= */

if (
    mobileCrouch
) {

    mobileCrouch.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            setCrouch(
                true
            );
        }
    );


    mobileCrouch.addEventListener(
        "pointerup",
        function(event) {

            event.preventDefault();

            setCrouch(
                false
            );
        }
    );


    mobileCrouch.addEventListener(
        "pointercancel",
        function() {

            setCrouch(
                false
            );
        }
    );
}


/* =========================================================
   MOBILE FLASHLIGHT
========================================================= */

if (
    mobileFlashlight
) {

    mobileFlashlight.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            toggleFlashlight();
        }
    );
}


/* =========================================================
   MOBILE INTERACT
========================================================= */

if (
    mobileInteract
) {

    mobileInteract.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            interact();
        }
    );
}


/* =========================================================
   MOBILE WEAPON SWITCH
========================================================= */

if (
    mobileWeapons
) {

    mobileWeapons.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            switchWeapon(
                1
            );
        }
    );
}


/* =========================================================
   MOBILE JOYSTICK
========================================================= */

if (
    joystickBase &&
    joystickKnob
) {

    joystickBase.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            joystick.active =
                true;

            joystick.pointerId =
                event.pointerId;

            joystickBase.setPointerCapture(
                event.pointerId
            );

            updateJoystick(
                event
            );
        }
    );


    joystickBase.addEventListener(
        "pointermove",
        function(event) {

            if (
                !joystick.active ||
                event.pointerId !==
                    joystick.pointerId
            ) {
                return;
            }

            event.preventDefault();

            updateJoystick(
                event
            );
        }
    );


    function endJoystick(
        event
    ) {

        if (
            event.pointerId !==
            joystick.pointerId
        ) {
            return;
        }


        joystick.active =
            false;

        joystick.pointerId =
            null;

        joystick.x =
            0;

        joystick.y =
            0;


        joystickKnob.style.transform =
            "translate(-50%, -50%)";
    }


    joystickBase.addEventListener(
        "pointerup",
        endJoystick
    );

    joystickBase.addEventListener(
        "pointercancel",
        endJoystick
    );
}


/* =========================================================
   JOYSTICK UPDATE
========================================================= */

function updateJoystick(
    event
) {

    const rect =
        joystickBase.getBoundingClientRect();


    const centerX =
        rect.left +
        rect.width / 2;


    const centerY =
        rect.top +
        rect.height / 2;


    let dx =
        event.clientX -
        centerX;


    let dy =
        event.clientY -
        centerY;


    const radius =
        rect.width / 2;


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    if (
        distance > radius
    ) {

        dx =
            dx /
            distance *
            radius;

        dy =
            dy /
            distance *
            radius;
    }


    joystick.x =
        dx / radius;

    joystick.y =
        dy / radius;


    joystickKnob.style.transform =
        `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}


/* =========================================================
   MOBILE LOOK
========================================================= */

if (
    lookArea
) {

    lookArea.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            look.active =
                true;

            look.pointerId =
                event.pointerId;

            look.lastX =
                event.clientX;

            look.lastY =
                event.clientY;

            lookArea.setPointerCapture(
                event.pointerId
            );
        }
    );


    lookArea.addEventListener(
        "pointermove",
        function(event) {

            if (
                !look.active ||
                event.pointerId !==
                    look.pointerId
            ) {
                return;
            }


            event.preventDefault();


            const dx =
                event.clientX -
                look.lastX;


            const dy =
                event.clientY -
                look.lastY;


            look.lastX =
                event.clientX;

            look.lastY =
                event.clientY;


            const sensitivity =
                0.006;


            player.yaw -=
                dx *
                sensitivity;


            player.pitch -=
                dy *
                sensitivity;


            const limit =
                Math.PI / 2 -
                0.05;


            player.pitch =
                clamp(
                    player.pitch,
                    -limit,
                    limit
                );


            updateCamera();
        }
    );


    function endLook(
        event
    ) {

        if (
            event.pointerId !==
            look.pointerId
        ) {
            return;
        }


        look.active =
            false;

        look.pointerId =
            null;
    }


    lookArea.addEventListener(
        "pointerup",
        endLook
    );

    lookArea.addEventListener(
        "pointercancel",
        endLook
    );
}


/* =========================================================
   INITIALIZE GAME
========================================================= */

function initializeGame() {

    try {

        initThree();

        createGun();

        initZombies();

        updateHealthUI();

        updateWeaponUI();

        setObjective(
            state.objective
        );

        updateFlashlight(
            0
        );

        updateCamera();


        if (
            loadingProgress
        ) {

            loadingProgress.style.width =
                "100%";
        }


        if (
            loadingText
        ) {

            loadingText.textContent =
                "READY";
        }


        setTimeout(
            function() {

                if (
                    loadingScreen
                ) {

                    loadingScreen.classList.add(
                        "hidden"
                    );
                }


                if (
                    mainMenu
                ) {

                    mainMenu.classList.add(
                        "visible"
                    );
                }

            },
            450
        );


    } catch (error) {

        console.error(
            "GAME INITIALIZATION ERROR:",
            error
        );


        if (
            loadingText
        ) {

            loadingText.textContent =
                "ERROR: " +
                error.message;
        }


        throw error;
    }
}


/* =========================================================
   MAIN GAME LOOP
========================================================= */

function animate() {

    requestAnimationFrame(
        animate
    );


    if (
        !clock
    ) {

        clock =
            new THREE.Clock();
    }


    const delta =
        Math.min(
            clock.getDelta(),
            0.05
        );


    state.elapsed +=
        delta;


    if (
        state.messageTimer > 0
    ) {

        state.messageTimer -=
            delta * 1000;


        if (
            state.messageTimer <= 0
        ) {

            hideMessage();
        }
    }


    if (
        state.started &&
        !state.paused &&
        !state.gameOver
    ) {

        updateSprint();

        updatePlayer(
            delta
        );

        updateZombies(
            delta
        );

        updateFlashlight(
            delta
        );

        updateGun(
            delta
        );

        updateApparition(
            delta
        );

        updateLightFlicker(
            delta
        );

        updateInteraction();


        if (
            mouseDown
        ) {

            shoot();
        }
    }


    renderer.render(
        scene,
        camera
    );
}


/* =========================================================
   STARTUP
========================================================= */

initializeGame();

animate();


/* =========================================================
   FINAL CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    function() {

        resetKeyboardState();


        try {

            if (
                document.pointerLockElement
            ) {

                document.exitPointerLock();
            }

        } catch (error) {}
    }
);

