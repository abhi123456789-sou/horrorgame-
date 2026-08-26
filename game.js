/* =========================================================
   THE LAST ROOM
   COMPLETE GAME.JS
   PART 1 → PART 4
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

const gameRoot = document.getElementById("game");
const gameContainer = document.getElementById("gameContainer");

const loadingScreen = document.getElementById("loadingScreen");
const loadingProgress = document.getElementById("loadingProgress");
const loadingText = document.getElementById("loadingText");

const mainMenu = document.getElementById("mainMenu");
const pauseMenu = document.getElementById("pauseMenu");
const controlsPanel = document.getElementById("controlsPanel");
const gameOverOverlay = document.getElementById("gameOverOverlay");

const startButton = document.getElementById("startButton");
const controlsButton = document.getElementById("controlsButton");
const pauseControlsButton =
    document.getElementById("pauseControlsButton");
const closeControls =
    document.getElementById("closeControls");

const resumeButton = document.getElementById("resumeButton");
const restartButton = document.getElementById("restartButton");
const againButton = document.getElementById("againButton");

const overTitle = document.getElementById("overTitle");
const overHeading = document.getElementById("overHeading");
const overText = document.getElementById("overText");

const objectiveEl = document.getElementById("objective");

const messageEl = document.getElementById("message");
const messageTitle = document.getElementById("messageTitle");
const messageBody = document.getElementById("messageBody");

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
let ambientLight;

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
    position: new THREE.Vector3(0, 1.7, 8),

    velocity: new THREE.Vector3(),

    yaw: Math.PI,

    pitch: 0,

    radius: 0.35,

    standingHeight: 1.7,
    crouchHeight: 1.05,

    moveSpeed: 3.4,
    sprintSpeed: 5.6,
    crouchSpeed: 1.8,

    jumpForce: 5.2,

    gravity: 14,

    grounded: true,

    crouching: false,

    sprinting: false
};

/* =========================================================
   GAME STATE
========================================================= */

const state = {

    started: false,

    paused: false,

    gameOver: false,

    victory: false,

    elapsed: 0,

    objective: "Find a way out.",

    doorUnlocked: false,

    doorOpen: false,

    keyFound: false,

    generatorActivated: false,

    horrorTriggered: false,

    finalTriggered: false,

    flashlightOn: true,

    battery: 100,

    messageTimer: 0,

    interactionObject: null
};

/* =========================================================
   INPUT
========================================================= */

const keys = {};

const joystick = {
    active: false,
    pointerId: null,
    x: 0,
    y: 0
};

const look = {
    active: false,
    pointerId: null,
    lastX: 0,
    lastY: 0
};

let mouseDown = false;

/* =========================================================
   HEALTH
========================================================= */

const health = {
    current: 100,
    maximum: 100,

    damageCooldown: 0,

    damageCooldownTime: 700
};

/* =========================================================
   WEAPONS
========================================================= */

const weapons = {

    pistol: {
        name: "PISTOL",
        magazine: 12,
        magazineSize: 12,
        reserve: 48,
        damage: 35,
        fireRate: 280,
        reloadTime: 1100
    },

    shotgun: {
        name: "SHOTGUN",
        magazine: 5,
        magazineSize: 5,
        reserve: 25,
        damage: 80,
        fireRate: 850,
        reloadTime: 1500
    },

    revolver: {
        name: "REVOLVER",
        magazine: 6,
        magazineSize: 6,
        reserve: 30,
        damage: 55,
        fireRate: 500,
        reloadTime: 1300
    }

};

const weaponOrder = [
    "pistol",
    "shotgun",
    "revolver"
];

let currentWeaponIndex = 0;

let lastShotTime = 0;

let reloading = false;

/* =========================================================
   ZOMBIES
========================================================= */

const zombies = [];

const ZOMBIE_CONFIG = {

    count: 5,

    health: 100,

    speed: 1.15,

    chaseSpeed: 1.8,

    detectionDistance: 18,

    attackDistance: 1.45,

    attackDamage: 12,

    attackCooldown: 1100
};

/* =========================================================
   INTERACTABLES
========================================================= */

let doorObject = null;
let keyObject = null;
let generatorObject = null;
let exitObject = null;

/* =========================================================
   HORROR OBJECTS
========================================================= */

let apparition = null;

let flickerTimer = 0;

let lastFootstep = 0;

/* =========================================================
   AUDIO
========================================================= */

let audioContext = null;

function initAudio() {

    if (audioContext) {
        return;
    }

    try {
        audioContext =
            new (window.AudioContext ||
                window.webkitAudioContext)();

    } catch (error) {

        audioContext = null;
    }
}

function sound(
    frequency = 180,
    duration = 0.08,
    volume = 0.025,
    type = "sine"
) {

    if (!audioContext) {
        return;
    }

    try {

        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();

        oscillator.type = type;

        oscillator.frequency.value =
            frequency;

        gain.gain.setValueAtTime(
            volume,
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

    } catch (error) {}
}

/* =========================================================
   UTILITY
========================================================= */

function clamp(value, min, max) {

    return Math.max(
        min,
        Math.min(max, value)
    );
}

function distance2D(a, b) {

    const dx = a.x - b.x;
    const dz = a.z - b.z;

    return Math.sqrt(
        dx * dx +
        dz * dz
    );
}

function random(min, max) {

    return Math.random() *
        (max - min) +
        min;
}

/* =========================================================
   DEVICE
========================================================= */

function isMobile() {

    return (
        window.innerWidth <= 900 ||
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0
    );
}

function updateMobileVisibility() {

    if (!mobileControls) {
        return;
    }

    mobileControls.style.display =
        isMobile() ? "block" : "none";

    crosshair.style.display =
        "block";
}

/* =========================================================
   MESSAGE SYSTEM
========================================================= */

function showMessage(
    title,
    body,
    duration = 2500
) {

    messageTitle.textContent =
        title || "";

    messageBody.textContent =
        body || "";

    messageEl.classList.add("visible");

    state.messageTimer =
        duration;
}

function hideMessage() {

    messageEl.classList.remove(
        "visible"
    );
}

/* =========================================================
   OBJECTIVE
========================================================= */

function setObjective(text) {

    state.objective = text;

    objectiveEl.textContent =
        text;
}

/* =========================================================
   THREE INITIALIZATION
========================================================= */

function initThree() {

    scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(0x030303);

    scene.fog =
        new THREE.Fog(
            0x030303,
            5,
            32
        );

    camera =
        new THREE.PerspectiveCamera(
            75,
            window.innerWidth /
            window.innerHeight,
            0.05,
            100
        );

    camera.position.copy(
        player.position
    );

    renderer =
        new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance"
        });

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            2
        )
    );

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.shadowMap.enabled = true;

    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;

    gameContainer.appendChild(
        renderer.domElement
    );

    clock =
        new THREE.Clock();

    /* -----------------------------------------------------
       LIGHTING
    ----------------------------------------------------- */

    ambientLight =
        new THREE.HemisphereLight(
            0x606060,
            0x080808,
            0.18
        );

    scene.add(
        ambientLight
    );

    flashlight =
        new THREE.SpotLight(
            0xffffff,
            3.2,
            22,
            Math.PI / 7,
            0.55,
            1.4
        );

    flashlight.castShadow = true;

    flashlight.shadow.mapSize.width =
        1024;

    flashlight.shadow.mapSize.height =
        1024;

    scene.add(
        flashlight
    );

    scene.add(
        flashlight.target
    );

    createWorld();

    createGun();

    createInteractables();

    createZombies();

    createApparition();

    resize();

    loadingProgress.style.width =
        "100%";

    loadingText.textContent =
        "Ready.";

    setTimeout(
        () => {

            loadingScreen.classList.add(
                "hidden"
            );

            mainMenu.classList.remove(
                "hidden"
            );

        },
        500
    );
}

/* =========================================================
   MATERIALS
========================================================= */

function wallMaterial() {

    return new THREE.MeshStandardMaterial({

        color: 0x252525,

        roughness: 0.95,

        metalness: 0.05
    });
}

function floorMaterial() {

    return new THREE.MeshStandardMaterial({

        color: 0x111111,

        roughness: 1,

        metalness: 0
    });
}

/* =========================================================
   BOX HELPER
========================================================= */

function createBox(
    x,
    y,
    z,
    width,
    height,
    depth,
    material,
    name = ""
) {

    const mesh =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                width,
                height,
                depth
            ),

            material
        );

    mesh.position.set(
        x,
        y,
        z
    );

    mesh.name = name;

    mesh.castShadow = true;

    mesh.receiveShadow = true;

    scene.add(mesh);

    return mesh;
}

/* =========================================================
   WORLD
========================================================= */

function createWorld() {

    /* -----------------------------------------------------
       FLOOR
    ----------------------------------------------------- */

    createBox(
        0,
        -0.1,
        0,
        ROOM.width,
        0.2,
        ROOM.depth,
        floorMaterial(),
        "Floor"
    );

    /* -----------------------------------------------------
       CEILING
    ----------------------------------------------------- */

    createBox(
        0,
        ROOM.wallHeight,
        0,
        ROOM.width,
        0.2,
        ROOM.depth,
        new THREE.MeshStandardMaterial({
            color: 0x090909,
            roughness: 1
        }),
        "Ceiling"
    );

    /* -----------------------------------------------------
       WALLS
    ----------------------------------------------------- */

    const wm =
        wallMaterial();

    createBox(
        0,
        ROOM.wallHeight / 2,
        -ROOM.depth / 2,
        ROOM.width,
        ROOM.wallHeight,
        0.5,
        wm,
        "NorthWall"
    );

    createBox(
        0,
        ROOM.wallHeight / 2,
        ROOM.depth / 2,
        ROOM.width,
        ROOM.wallHeight,
        0.5,
        wm,
        "SouthWall"
    );

    createBox(
        -ROOM.width / 2,
        ROOM.wallHeight / 2,
        0,
        0.5,
        ROOM.wallHeight,
        ROOM.depth,
        wm,
        "WestWall"
    );

    /* -----------------------------------------------------
       EAST WALL - DOOR OPENING
    ----------------------------------------------------- */

    createBox(
        ROOM.width / 2,
        ROOM.wallHeight / 2,
        -7,
        0.5,
        ROOM.wallHeight,
        10,
        wm,
        "EastWallA"
    );

    createBox(
        ROOM.width / 2,
        ROOM.wallHeight / 2,
        7,
        0.5,
        ROOM.wallHeight,
        10,
        wm,
        "EastWallB"
    );

    /* -----------------------------------------------------
       ROOM DIVIDER
    ----------------------------------------------------- */

    createBox(
        -4,
        ROOM.wallHeight / 2,
        0,
        0.45,
        ROOM.wallHeight,
        10,
        wm,
        "Divider"
    );

    /* -----------------------------------------------------
       TABLE
    ----------------------------------------------------- */

    createBox(
        4,
        0.8,
        -3,
        3,
        0.2,
        1.8,
        new THREE.MeshStandardMaterial({
            color: 0x171717,
            roughness: 0.9
        }),
        "TableTop"
    );

    createBox(
        2.8,
        0.4,
        -3,
        0.2,
        0.8,
        0.2,
        wm,
        "TableLeg"
    );

    createBox(
        5.2,
        0.4,
        -3,
        0.2,
        0.8,
        0.2,
        wm,
        "TableLeg"
    );

    /* -----------------------------------------------------
       OLD CABINET
    ----------------------------------------------------- */

    createBox(
        7,
        1.5,
        3,
        2,
        3,
        0.8,
        new THREE.MeshStandardMaterial({
            color: 0x151515,
            roughness: 0.85
        }),
        "Cabinet"
    );

    /* -----------------------------------------------------
       CRATES
    ----------------------------------------------------- */

    for (let i = 0; i < 6; i++) {

        const x =
            random(-8, 8);

        const z =
            random(-8, 8);

        if (
            Math.abs(x) < 2 &&
            Math.abs(z - 8) < 2
        ) {
            continue;
        }

        createBox(
            x,
            0.45,
            z,
            0.9,
            0.9,
            0.9,
            new THREE.MeshStandardMaterial({
                color: 0x30251a,
                roughness: 1
            }),
            "Crate"
        );
    }

    /* -----------------------------------------------------
       CEILING LIGHTS
    ----------------------------------------------------- */

    createCeilingLight(
        -7,
        -5
    );

    createCeilingLight(
        2,
        -5
    );

    createCeilingLight(
        7,
        5
    );
}

/* =========================================================
   CEILING LIGHT
========================================================= */

function createCeilingLight(x, z) {

    const bulb =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.12,
                12,
                12
            ),

            new THREE.MeshBasicMaterial({
                color: 0xffffdd
            })
        );

    bulb.position.set(
        x,
        3.85,
        z
    );

    scene.add(
        bulb
    );

    const light =
        new THREE.PointLight(
            0xfff4cc,
            0.45,
            8
        );

    light.position.set(
        x,
        3.6,
        z
    );

    light.castShadow = false;

    scene.add(
        light
    );
}

/* =========================================================
   DOOR / KEY / GENERATOR
========================================================= */

function createInteractables() {

    /* -----------------------------------------------------
       DOOR
    ----------------------------------------------------- */

    doorObject =
        createBox(
            ROOM.width / 2 + 0.02,
            1.8,
            0,
            0.35,
            3.6,
            4,
            new THREE.MeshStandardMaterial({
                color: 0x302020,
                roughness: 0.7
            }),
            "ExitDoor"
        );

    doorObject.userData.type =
        "door";

    /* -----------------------------------------------------
       KEY
    ----------------------------------------------------- */

    keyObject =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.22,
                0.06,
                0.06
            ),

            new THREE.MeshStandardMaterial({
                color: 0xd0b35a,
                metalness: 0.8,
                roughness: 0.25
            })
        );

    keyObject.position.set(
        4,
        1.05,
        -3
    );

    keyObject.rotation.y =
        Math.PI / 4;

    keyObject.castShadow = true;

    keyObject.userData.type =
        "key";

    scene.add(
        keyObject
    );

    /* -----------------------------------------------------
       GENERATOR
    ----------------------------------------------------- */

    generatorObject =
        createBox(
            -7,
            0.9,
            -6,
            1.8,
            1.8,
            1.2,
            new THREE.MeshStandardMaterial({
                color: 0x242424,
                roughness: 0.8
            }),
            "Generator"
        );

    generatorObject.userData.type =
        "generator";

    /* -----------------------------------------------------
       EXIT
    ----------------------------------------------------- */

    exitObject =
        createBox(
            ROOM.width / 2 + 3,
            1,
            0,
            4,
            2,
            4,
            new THREE.MeshStandardMaterial({
                color: 0x101010
            }),
            "ExitArea"
        );

    exitObject.visible = false;
}

/* =========================================================
   GUN
========================================================= */

function createGun() {

    gunGroup =
        new THREE.Group();

    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.24,
                0.18,
                0.7
            ),

            new THREE.MeshStandardMaterial({
                color: 0x151515,
                metalness: 0.75,
                roughness: 0.3
            })
        );

    body.position.set(
        0.32,
        -0.28,
        -0.65
    );

    gunGroup.add(
        body
    );

    const barrel =
        new THREE.Mesh(

            new THREE.CylinderGeometry(
                0.045,
                0.045,
                0.42,
                12
            ),

            new THREE.MeshStandardMaterial({
                color: 0x080808,
                metalness: 0.85,
                roughness: 0.2
            })
        );

    barrel.rotation.x =
        Math.PI / 2;

    barrel.position.set(
        0.32,
        -0.26,
        -1.05
    );

    gunGroup.add(
        barrel
    );

    const grip =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.16,
                0.42,
                0.2
            ),

            new THREE.MeshStandardMaterial({
                color: 0x202020,
                roughness: 0.8
            })
        );

    grip.position.set(
        0.32,
        -0.52,
        -0.55
    );

    grip.rotation.z =
        -0.15;

    gunGroup.add(
        grip
    );

    /* -----------------------------------------------------
       MUZZLE FLASH
    ----------------------------------------------------- */

    muzzleFlash =
        new THREE.PointLight(
            0xffbb66,
            0,
            4
        );

    muzzleFlash.position.set(
        0.32,
        -0.26,
        -1.28
    );

    gunGroup.add(
        muzzleFlash
    );

    camera.add(
        gunGroup
    );

    scene.add(
        camera
    );
}

/* =========================================================
   GUN ANIMATION
========================================================= */

let gunRecoil = 0;

function updateGun(delta) {

    if (!gunGroup) {
        return;
    }

    gunRecoil =
        Math.max(
            0,
            gunRecoil -
            delta * 5
        );

    gunGroup.position.z =
        gunRecoil * 0.08;

    gunGroup.rotation.x =
        gunRecoil * 0.15;

    muzzleFlash.intensity =
        Math.max(
            0,
            muzzleFlash.intensity -
            delta * 25
        );

    const moving =
        keys.KeyW ||
        keys.KeyA ||
        keys.KeyS ||
        keys.KeyD ||
        joystick.x !== 0 ||
        joystick.y !== 0;

    if (moving) {

        const t =
            performance.now();

        gunGroup.position.y =
            Math.sin(t * 0.012) *
            0.008;

    } else {

        gunGroup.position.y = 0;
    }
}

/* =========================================================
   ZOMBIE CREATION
========================================================= */

function createZombie(position) {

    const group =
        new THREE.Group();

    /* BODY */

    const body =
        new THREE.Mesh(

            new THREE.CapsuleGeometry(
                0.38,
                1.1,
                5,
                8
            ),

            new THREE.MeshStandardMaterial({
                color: 0x3c4740,
                roughness: 1
            })
        );

    body.position.y =
        1.0;

    body.castShadow = true;

    group.add(
        body
    );

    /* HEAD */

    const head =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.34,
                12,
                12
            ),

            new THREE.MeshStandardMaterial({
                color: 0x59645a,
                roughness: 1
            })
        );

    head.position.y =
        1.85;

    head.castShadow = true;

    group.add(
        head
    );

    /* EYES */

    const eyeMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xff2222
        });

    const eye1 =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.035,
                8,
                8
            ),
            eyeMaterial
        );

    const eye2 =
        eye1.clone();

    eye1.position.set(
        -0.12,
        1.9,
        -0.29
    );

    eye2.position.set(
        0.12,
        1.9,
        -0.29
    );

    group.add(
        eye1,
        eye2
    );

    group.position.copy(
        position
    );

    scene.add(
        group
    );

    const zombie = {

        object: group,

        health: ZOMBIE_CONFIG.health,

        attackTimer: 0,

        active: false,

        dead: false,

        speed:
            random(
                ZOMBIE_CONFIG.speed * 0.85,
                ZOMBIE_CONFIG.speed * 1.15
            )
    };

    zombies.push(
        zombie
    );

    return zombie;
}

/* =========================================================
   ZOMBIES
========================================================= */

function createZombies() {

    const positions = [

        new THREE.Vector3(
            -8,
            0,
            -8
        ),

        new THREE.Vector3(
            7,
            0,
            -8
        ),

        new THREE.Vector3(
            8,
            0,
            7
        ),

        new THREE.Vector3(
            -7,
            0,
            6
        ),

        new THREE.Vector3(
            4,
            0,
            7
        )

    ];

    positions.forEach(
        position => {

            createZombie(
                position
            );

        }
    );
}

/* =========================================================
   ZOMBIE AI
========================================================= */

function updateZombies(delta) {

    if (
        !state.started ||
        state.gameOver
    ) {
        return;
    }

    zombies.forEach(
        zombie => {

            if (zombie.dead) {
                return;
            }

            const distance =
                distance2D(
                    zombie.object.position,
                    player.position
                );

            if (
                distance <
                ZOMBIE_CONFIG.detectionDistance
            ) {

                zombie.active = true;
            }

            if (!zombie.active) {
                return;
            }

            if (
                distance >
                ZOMBIE_CONFIG.attackDistance
            ) {

                const dx =
                    player.position.x -
                    zombie.object.position.x;

                const dz =
                    player.position.z -
                    zombie.object.position.z;

                const length =
                    Math.sqrt(
                        dx * dx +
                        dz * dz
                    );

                if (length > 0.001) {

                    zombie.object.position.x +=
                        (dx / length) *
                        zombie.speed *
                        delta;

                    zombie.object.position.z +=
                        (dz / length) *
                        zombie.speed *
                        delta;

                    zombie.object.rotation.y =
                        Math.atan2(
                            dx,
                            dz
                        );
                }

            } else {

                zombie.attackTimer -=
                    delta * 1000;

                if (
                    zombie.attackTimer <= 0
                ) {

                    damagePlayer(
                        ZOMBIE_CONFIG.attackDamage
                    );

                    zombie.attackTimer =
                        ZOMBIE_CONFIG.attackCooldown;
                }
            }

            /* -------------------------------------------------
               SMALL ANIMATION
            ------------------------------------------------- */

            zombie.object.position.y =
                Math.sin(
                    performance.now() *
                    0.006
                ) * 0.025;

        }
    );
}

/* =========================================================
   SHOOTING
========================================================= */

function shoot() {

    if (
        !state.started ||
        state.paused ||
        state.gameOver ||
        reloading
    ) {
        return;
    }

    const weapon =
        weapons[
            weaponOrder[
                currentWeaponIndex
            ]
        ];

    const now =
        performance.now();

    if (
        now - lastShotTime <
        weapon.fireRate
    ) {
        return;
    }

    if (
        weapon.magazine <= 0
    ) {

        sound(
            90,
            0.08,
            0.035,
            "square"
        );

        showMessage(
            "EMPTY",
            "Reload your weapon.",
            1000
        );

        return;
    }

    lastShotTime =
        now;

    weapon.magazine--;

    gunRecoil =
        1;

    muzzleFlash.intensity =
        5;

    sound(
        weapon === weapons.shotgun
            ? 70
            : 140,
        weapon === weapons.shotgun
            ? 0.18
            : 0.08,
        0.06,
        "sawtooth"
    );

    renderer.domElement.classList.add(
        "shot"
    );

    setTimeout(
        () => {
            renderer.domElement.classList.remove(
                "shot"
            );
        },
        60
    );

    raycastShoot(
        weapon.damage,
        weapon === weapons.shotgun
            ? 5
            : 1
    );

    updateAmmoHUD();
}

/* =========================================================
   RAYCAST SHOOT
========================================================= */

function raycastShoot(
    damage,
    pellets = 1
) {

    const raycaster =
        new THREE.Raycaster();

    for (
        let i = 0;
        i < pellets;
        i++
    ) {

        const spread =
            pellets > 1
                ? 0.06
                : 0;

        const direction =
            new THREE.Vector3(
                random(
                    -spread,
                    spread
                ),
                random(
                    -spread,
                    spread
                ),
                -1
            );

        direction.applyQuaternion(
            camera.quaternion
        );

        raycaster.set(
            camera.position,
            direction.normalize()
        );

        const objects = [];

        zombies.forEach(
            zombie => {

                if (
                    !zombie.dead
                ) {

                    objects.push(
                        ...zombie.object.children
                    );
                }

            }
        );

        const hits =
            raycaster.intersectObjects(
                objects,
                false
            );

        if (
            hits.length === 0
        ) {
            continue;
        }

        const hit =
            hits[0];

        const zombie =
            zombies.find(
                z =>
                    z.object.children.includes(
                        hit.object
                    )
            );

        if (zombie) {

            damageZombie(
                zombie,
                damage
            );
        }
    }
}

/* =========================================================
   ZOMBIE DAMAGE
========================================================= */

function damageZombie(
    zombie,
    damage
) {

    if (zombie.dead) {
        return;
    }

    zombie.health -=
        damage;

    zombie.object.children.forEach(
        child => {

            if (
                child.material &&
                child.material.emissive
            ) {

                child.material.emissive.set(
                    0x660000
                );

            }

        }
    );

    setTimeout(
        () => {

            zombie.object.children.forEach(
                child => {

                    if (
                        child.material &&
                        child.material.emissive
                    ) {

                        child.material.emissive.set(
                            0x000000
                        );

                    }

                }
            );

        },
        80
    );

    if (
        zombie.health <= 0
    ) {

        killZombie(
            zombie
        );
    }
}

/* =========================================================
   KILL ZOMBIE
========================================================= */

function killZombie(
    zombie
) {

    if (zombie.dead) {
        return;
    }

    zombie.dead = true;

    sound(
        70,
        0.15,
        0.04,
        "sawtooth"
    );

    const startY =
        zombie.object.position.y;

    const startRotation =
        zombie.object.rotation.z;

    let progress = 0;

    function fall() {

        progress += 0.04;

        zombie.object.rotation.z =
            startRotation +
            progress *
            1.45;

        zombie.object.position.y =
            startY -
            progress *
            0.8;

        if (
            progress < 1
        ) {

            requestAnimationFrame(
                fall
            );

        } else {

            zombie.object.visible =
                false;
        }
    }

    fall();

    if (
        zombies.every(
            z => z.dead
        )
    ) {

        showMessage(
            "SILENCE",
            "The room is finally quiet...",
            2500
        );
    }
}

/* =========================================================
   RELOAD
========================================================= */

function reload() {

    if (
        reloading ||
        state.gameOver
    ) {
        return;
    }

    const weapon =
        weapons[
            weaponOrder[
                currentWeaponIndex
            ]
        ];

    if (
        weapon.magazine >=
        weapon.magazineSize
    ) {
        return;
    }

    if (
        weapon.reserve <= 0
    ) {
        return;
    }

    reloading = true;

    showMessage(
        "RELOADING",
        weapon.name,
        weapon.reloadTime
    );

    sound(
        280,
        0.08,
        0.025,
        "square"
    );

    setTimeout(
        () => {

            const needed =
                weapon.magazineSize -
                weapon.magazine;

            const amount =
                Math.min(
                    needed,
                    weapon.reserve
                );

            weapon.magazine +=
                amount;

            weapon.reserve -=
                amount;

            reloading = false;

            updateAmmoHUD();

        },
        weapon.reloadTime
    );
}

/* =========================================================
   SWITCH WEAPON
========================================================= */

function switchWeapon() {

    if (reloading) {
        return;
    }

    currentWeaponIndex++;

    if (
        currentWeaponIndex >=
        weaponOrder.length
    ) {

        currentWeaponIndex = 0;
    }

    updateAmmoHUD();

    const weapon =
        weapons[
            weaponOrder[
                currentWeaponIndex
            ]
        ];

    showMessage(
        "WEAPON",
        weapon.name,
        800
    );

    sound(
        260,
        0.06,
        0.025,
        "square"
    );
}

/* =========================================================
   AMMO HUD
========================================================= */

function updateAmmoHUD() {

    const weapon =
        weapons[
            weaponOrder[
                currentWeaponIndex
            ]
        ];

    weaponName.textContent =
        weapon.name;

    ammoText.textContent =
        `${weapon.magazine} / ${weapon.reserve}`;
}

/* =========================================================
   FLASHLIGHT
========================================================= */

function toggleFlashlight() {

    if (
        state.battery <= 0
    ) {

        state.flashlightOn =
            false;

        flashlight.intensity =
            0;

        showMessage(
            "FLASHLIGHT",
            "Battery depleted.",
            1500
        );

        return;
    }

    state.flashlightOn =
        !state.flashlightOn;

    flashlight.intensity =
        state.flashlightOn
            ? 3.2
            : 0;

    sound(
        state.flashlightOn
            ? 600
            : 350,
        0.05,
        0.02,
        "square"
    );
}

/* =========================================================
   FLASHLIGHT BATTERY
========================================================= */

function updateFlashlight(
    delta
) {

    if (
        state.flashlightOn &&
        state.started &&
        !state.paused
    ) {

        state.battery -=
            delta * 0.85;

        state.battery =
            clamp(
                state.battery,
                0,
                100
            );

        if (
            state.battery <= 0
        ) {

            state.flashlightOn =
                false;

            flashlight.intensity =
                0;

            showMessage(
                "DARKNESS",
                "The flashlight battery is dead.",
                2500
            );
        }
    }

    batteryFill.style.width =
        `${state.battery}%`;

    batteryText.textContent =
        `${Math.ceil(state.battery)}%`;

    if (
        state.battery < 20
    ) {

        batteryFill.style.opacity =
            "0.55";
    } else {

        batteryFill.style.opacity =
            "1";
    }
}

/* =========================================================
   FLASHLIGHT AIM
========================================================= */

function updateFlashlightAim() {

    if (!flashlight) {
        return;
    }

    flashlight.position.copy(
        camera.position
    );

    const target =
        new THREE.Vector3(
            0,
            0,
            -1
        );

    target.applyQuaternion(
        camera.quaternion
    );

    target.multiplyScalar(
        10
    );

    target.add(
        camera.position
    );

    flashlight.target.position.copy(
        target
    );
}

/* =========================================================
   PLAYER DAMAGE
========================================================= */

function damagePlayer(
    amount
) {

    if (
        state.gameOver ||
        health.damageCooldown > 0
    ) {
        return;
    }

    health.current -=
        amount;

    health.current =
        clamp(
            health.current,
            0,
            health.maximum
        );

    health.damageCooldown =
        health.damageCooldownTime;

    updateHealthHUD();

    gameRoot.classList.add(
        "damageFlash"
    );

    gameRoot.classList.add(
        "shake"
    );

    setTimeout(
        () => {

            gameRoot.classList.remove(
                "damageFlash"
            );

            gameRoot.classList.remove(
                "shake"
            );

        },
        300
    );

    sound(
        55,
        0.18,
        0.05,
        "sawtooth"
    );

    if (
        health.current <= 0
    ) {

        die();
    }
}

/* =========================================================
   HEALTH HUD
========================================================= */

function updateHealthHUD() {

    const percentage =
        (
            health.current /
            health.maximum
        ) * 100;

    healthFill.style.width =
        `${percentage}%`;

    healthText.textContent =
        Math.ceil(
            health.current
        );
}

/* =========================================================
   PLAYER MOVEMENT
========================================================= */

function getMovementInput() {

    let forward = 0;
    let right = 0;

    if (keys.KeyW) {
        forward += 1;
    }

    if (keys.KeyS) {
        forward -= 1;
    }

    if (keys.KeyD) {
        right += 1;
    }

    if (keys.KeyA) {
        right -= 1;
    }

    if (
        Math.abs(joystick.x) >
        0.05 ||
        Math.abs(joystick.y) >
        0.05
    ) {

        right +=
            joystick.x;

        forward +=
            -joystick.y;
    }

    const length =
        Math.sqrt(
            forward * forward +
            right * right
        );

    if (length > 1) {

        forward /= length;
        right /= length;
    }

    return {
        forward,
        right
    };
}

/* =========================================================
   COLLISION
========================================================= */

function isBlocked(
    x,
    z
) {

    const r =
        player.radius;

    /* outer walls */

    if (
        x < -ROOM.width / 2 + r ||
        x > ROOM.width / 2 - r
    ) {
        return true;
    }

    if (
        z < -ROOM.depth / 2 + r ||
        z > ROOM.depth / 2 - r
    ) {
        return true;
    }

    /* divider */

    if (
        x > -4.25 &&
        x < -3.75 &&
        z > -5 &&
        z < 5
    ) {

        return true;
    }

    /* cabinet */

    if (
        x > 6 &&
        x < 8 &&
        z > 2.4 &&
        z < 3.6
    ) {

        return true;
    }

    /* table */

    if (
        x > 2.3 &&
        x < 5.7 &&
        z > -4 &&
        z < -2
    ) {

        return true;
    }

    /* door */

    if (
        !state.doorOpen &&
        x > ROOM.width / 2 - 1 &&
        z > -2 &&
        z < 2
    ) {

        return true;
    }

    return false;
}

/* =========================================================
   MOVEMENT UPDATE
========================================================= */

function updatePlayer(
    delta
) {

    const input =
        getMovementInput();

    player.crouching =
        keys.KeyC;

    player.sprinting =
        keys.ShiftLeft ||
        keys.ShiftRight;

    let speed =
        player.moveSpeed;

    if (
        player.crouching
    ) {

        speed =
            player.crouchSpeed;

    } else if (
        player.sprinting &&
        input.forward > 0
    ) {

        speed =
            player.sprintSpeed;
    }

    const sin =
        Math.sin(
            player.yaw
        );

    const cos =
        Math.cos(
            player.yaw
        );

    const moveX =
        (
            rightVector(
                input.right,
                input.forward,
                sin,
                cos
            )
        );

    const moveZ =
        (
            forwardVector(
                input.right,
                input.forward,
                sin,
                cos
            )
        );

    const nextX =
        player.position.x +
        moveX * speed * delta;

    const nextZ =
        player.position.z +
        moveZ * speed * delta;

    if (
        !isBlocked(
            nextX,
            player.position.z
        )
    ) {

        player.position.x =
            nextX;
    }

    if (
        !isBlocked(
            player.position.x,
            nextZ
        )
    ) {

        player.position.z =
            nextZ;
    }

    /* -----------------------------------------------------
       GRAVITY
    ----------------------------------------------------- */

    player.velocity.y -=
        player.gravity *
        delta;

    player.position.y +=
        player.velocity.y *
        delta;

    const targetHeight =
        player.crouching
            ? player.crouchHeight
            : player.standingHeight;

    if (
        player.position.y <=
        targetHeight
    ) {

        player.position.y =
            targetHeight;

        player.velocity.y =
            0;

        player.grounded =
            true;

    } else {

        player.grounded =
            false;
    }

    camera.position.copy(
        player.position
    );

    camera.rotation.order =
        "YXZ";

    camera.rotation.y =
        player.yaw;

    camera.rotation.x =
        player.pitch;
}

/* =========================================================
   DIRECTION HELPERS
========================================================= */

function rightVector(
    right,
    forward,
    sin,
    cos
) {

    return (
        right * cos +
        forward * sin
    );
}

function forwardVector(
    right,
    forward,
    sin,
    cos
) {

    return (
        right * -sin +
        forward * cos
    );
}

/* =========================================================
   JUMP
========================================================= */

function jump() {

    if (
        !state.started ||
        state.paused ||
        state.gameOver
    ) {
        return;
    }

    if (
        player.grounded &&
        !player.crouching
    ) {

        player.velocity.y =
            player.jumpForce;

        player.grounded =
            false;

        sound(
            180,
            0.07,
            0.02,
            "square"
        );
    }
}

/* =========================================================
   INTERACTION
========================================================= */

function getInteractionTarget() {

    const raycaster =
        new THREE.Raycaster();

    const direction =
        new THREE.Vector3(
            0,
            0,
            -1
        );

    direction.applyQuaternion(
        camera.quaternion
    );

    raycaster.set(
        camera.position,
        direction
    );

    const targets = [];

    if (doorObject) {
        targets.push(
            doorObject
        );
    }

    if (
        keyObject &&
        keyObject.visible
    ) {

        targets.push(
            keyObject
        );
    }

    if (generatorObject) {
        targets.push(
            generatorObject
        );
    }

    const hits =
        raycaster.intersectObjects(
            targets,
            true
        );

    if (
        hits.length === 0
    ) {

        return null;
    }

    if (
        hits[0].distance >
        3
    ) {

        return null;
    }

    return hits[0].object;
}

/* =========================================================
   INTERACTION UI
========================================================= */

function updateInteraction() {

    if (
        !state.started ||
        state.paused ||
        state.gameOver
    ) {

        interactionEl.classList.remove(
            "visible"
        );

        return;
    }

    const target =
        getInteractionTarget();

    if (!target) {

        state.interactionObject =
            null;

        interactionEl.classList.remove(
            "visible"
        );

        return;
    }

    let object =
        target;

    while (
        object &&
        !object.userData.type
    ) {

        object =
            object.parent;
    }

    if (!object) {
        return;
    }

    const type =
        object.userData.type;

    state.interactionObject =
        object;

    if (
        type === "key"
    ) {

        interactionMain.textContent =
            "PICK UP KEY";

        interactionSub.textContent =
            "Press E";

    } else if (
        type === "generator"
    ) {

        interactionMain.textContent =
            state.generatorActivated
                ? "GENERATOR ACTIVE"
                : "START GENERATOR";

        interactionSub.textContent =
            "Press E";

    } else if (
        type === "door"
    ) {

        interactionMain.textContent =
            state.doorOpen
                ? "EXIT"
                : state.doorUnlocked
                    ? "OPEN DOOR"
                    : "DOOR LOCKED";

        interactionSub.textContent =
            "Press E";
    }

    interactionEl.classList.add(
        "visible"
    );
}

/* =========================================================
   INTERACT
========================================================= */

function interact() {

    if (
        !state.started ||
        state.paused ||
        state.gameOver
    ) {
        return;
    }

    const target =
        state.interactionObject ||
        getInteractionTarget();

    if (!target) {
        return;
    }

    let object =
        target;

    while (
        object &&
        !object.userData.type
    ) {

        object =
            object.parent;
    }

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

        state.keyFound =
            true;

        state.doorUnlocked =
            true;

        keyObject.visible =
            false;

        setObjective(
            "Activate the generator."
        );

        showMessage(
            "KEY FOUND",
            "The exit door can now be unlocked.",
            2500
        );

        sound(
            500,
            0.12,
            0.035,
            "sine"
        );

        return;
    }

    /* -----------------------------------------------------
       GENERATOR
    ----------------------------------------------------- */

    if (
        type === "generator"
    ) {

        if (
            state.generatorActivated
        ) {

            showMessage(
                "GENERATOR",
                "It is already running.",
                1200
            );

            return;
        }

        state.generatorActivated =
            true;

        ambientLight.intensity =
            0.25;

        setObjective(
            "Reach the exit door."
        );

        showMessage(
            "POWER RESTORED",
            "Something else has awakened...",
            3000
        );

        activateHorrorEvent();

        sound(
            55,
            0.4,
            0.05,
            "sawtooth"
        );

        return;
    }

    /* -----------------------------------------------------
       DOOR
    ----------------------------------------------------- */

    if (
        type === "door"
    ) {

        if (
            !state.doorUnlocked
        ) {

            showMessage(
                "LOCKED",
                "Find the key first.",
                1500
            );

            sound(
                100,
                0.1,
                0.03,
                "square"
            );

            return;
        }

        if (
            !state.generatorActivated
        ) {

            showMessage(
                "NO POWER",
                "The generator must be activated.",
                1800
            );

            return;
        }

        openDoor();
    }
}

/* =========================================================
   OPEN DOOR
========================================================= */

function openDoor() {

    if (
        state.doorOpen
    ) {
        return;
    }

    state.doorOpen =
        true;

    showMessage(
        "DOOR OPEN",
        "RUN.",
        1800
    );

    setObjective(
        "Escape the room."
    );

    sound(
        80,
        0.6,
        0.06,
        "sawtooth"
    );

    const start =
        doorObject.rotation.y;

    const target =
        -Math.PI / 2;

    let progress = 0;

    function animateDoor() {

        progress +=
            0.035;

        doorObject.rotation.y =
            THREE.MathUtils.lerp(
                start,
                target,
                clamp(
                    progress,
                    0,
                    1
                )
            );

        if (
            progress < 1
        ) {

            requestAnimationFrame(
                animateDoor
            );
        }
    }

    animateDoor();
}

/* =========================================================
   HORROR EVENT
========================================================= */

function activateHorrorEvent() {

    if (
        state.horrorTriggered
    ) {
        return;
    }

    state.horrorTriggered =
        true;

    zombies.forEach(
        zombie => {

            zombie.active =
                true;

            zombie.speed =
                ZOMBIE_CONFIG.chaseSpeed;
        }
    );

    setTimeout(
        () => {

            if (
                apparition
            ) {

                apparition.visible =
                    true;

                apparition.position.set(
                    0,
                    1.3,
                    -7
                );

                sound(
                    40,
                    0.7,
                    0.05,
                    "sine"
                );

                showMessage(
                    "RUN",
                    "You are not alone.",
                    2200
                );

                setTimeout(
                    () => {

                        if (apparition) {
                            apparition.visible =
                                false;
                        }

                    },
                    1800
                );
            }

        },
        1000
    );
}

/* =========================================================
   APPARITION
========================================================= */

function createApparition() {

    apparition =
        new THREE.Group();

    const body =
        new THREE.Mesh(

            new THREE.CapsuleGeometry(
                0.35,
                1.5,
                4,
                8
            ),

            new THREE.MeshBasicMaterial({
                color: 0xdddddd,
                transparent: true,
                opacity: 0.16
            })
        );

    body.position.y =
        1;

    apparition.add(
        body
    );

    const head =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.34,
                12,
                12
            ),

            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.2
            })
        );

    head.position.y =
        2;

    apparition.add(
        head
    );

    apparition.visible =
        false;

    scene.add(
        apparition
    );
}

/* =========================================================
   FLICKER
========================================================= */

function updateFlicker(
    delta
) {

    if (
        !state.flashlightOn
    ) {
        return;
    }

    flickerTimer -=
        delta;

    if (
        flickerTimer <= 0
    ) {

        flickerTimer =
            random(
                2,
                7
            );

        if (
            Math.random() <
            0.18
        ) {

            flashlight.intensity =
                random(
                    1.4,
                    3.2
                );

            setTimeout(
                () => {

                    if (
                        state.flashlightOn
                    ) {

                        flashlight.intensity =
                            3.2;
                    }

                },
                random(
                    40,
                    180
                )
            );
        }
    }
}

/* =========================================================
   WIN CONDITION
========================================================= */

function checkVictory() {

    if (
        !state.doorOpen ||
        state.gameOver
    ) {
        return;
    }

    const distance =
        distance2D(
            player.position,
            new THREE.Vector3(
                ROOM.width / 2 + 2,
                0,
                0
            )
        );

    if (
        distance < 2.8
    ) {

        victory();
    }
}

/* =========================================================
   DEATH
========================================================= */

function die() {

    if (
        state.gameOver
    ) {
        return;
    }

    state.gameOver =
        true;

    state.paused =
        false;

    document.exitPointerLock?.();

    overTitle.textContent =
        "YOU DIED";

    overHeading.textContent =
        "THE LAST ROOM";

    overText.textContent =
        "The darkness found you.";

    gameOverOverlay.classList.remove(
        "hidden"
    );

    sound(
        40,
        0.8,
        0.07,
        "sawtooth"
    );
}

/* =========================================================
   VICTORY
========================================================= */

function victory() {

    if (
        state.gameOver
    ) {
        return;
    }

    state.gameOver =
        true;

    state.victory =
        true;

    document.exitPointerLock?.();

    overTitle.textContent =
        "YOU ESCAPED";

    overHeading.textContent =
        "THE LAST ROOM";

    overText.textContent =
        "You made it out... but something followed you.";

    againButton.textContent =
        "PLAY AGAIN";

    gameOverOverlay.classList.remove(
        "hidden"
    );

    sound(
        520,
        0.4,
        0.05,
        "sine"
    );
}

/* =========================================================
   PAUSE
========================================================= */

function pauseGame() {

    if (
        !state.started ||
        state.gameOver
    ) {
        return;
    }

    state.paused =
        true;

    pauseMenu.classList.remove(
        "hidden"
    );

    document.exitPointerLock?.();
}

function resumeGame() {

    if (
        !state.started ||
        state.gameOver
    ) {
        return;
    }

    state.paused =
        false;

    pauseMenu.classList.add(
        "hidden"
    );

    if (
        !isMobile()
    ) {

        renderer.domElement.requestPointerLock?.();
    }
}

/* =========================================================
   RESET GAME
========================================================= */

function resetGame() {

    state.started =
        false;

    state.paused =
        false;

    state.gameOver =
        false;

    state.victory =
        false;

    state.elapsed =
        0;

    state.objective =
        "Find a way out.";

    state.doorUnlocked =
        false;

    state.doorOpen =
        false;

    state.keyFound =
        false;

    state.generatorActivated =
        false;

    state.horrorTriggered =
        false;

    state.finalTriggered =
        false;

    state.flashlightOn =
        true;

    state.battery =
        100;

    health.current =
        100;

    health.damageCooldown =
        0;

    player.position.set(
        0,
        player.standingHeight,
        8
    );

    player.velocity.set(
        0,
        0,
        0
    );

    player.yaw =
        Math.PI;

    player.pitch =
        0;

    player.crouching =
        false;

    player.sprinting =
        false;

    /* weapons */

    weapons.pistol.magazine =
        12;

    weapons.pistol.reserve =
        48;

    weapons.shotgun.magazine =
        5;

    weapons.shotgun.reserve =
        25;

    weapons.revolver.magazine =
        6;

    weapons.revolver.reserve =
        30;

    currentWeaponIndex =
        0;

    reloading =
        false;

    /* key */

    if (keyObject) {

        keyObject.visible =
            true;
    }

    /* door */

    if (doorObject) {

        doorObject.rotation.y =
            0;
    }

    /* zombies */

    const positions = [

        [-8, -8],
        [7, -8],
        [8, 7],
        [-7, 6],
        [4, 7]

    ];

    zombies.forEach(
        (zombie, index) => {

            zombie.health =
                ZOMBIE_CONFIG.health;

            zombie.dead =
                false;

            zombie.active =
                false;

            zombie.attackTimer =
                0;

            zombie.speed =
                ZOMBIE_CONFIG.speed;

            zombie.object.visible =
                true;

            if (
                positions[index]
            ) {

                zombie.object.position.set(
                    positions[index][0],
                    0,
                    positions[index][1]
                );
            }

            zombie.object.rotation.set(
                0,
                0,
                0
            );

        }
    );

    /* apparition */

    if (apparition) {

        apparition.visible =
            false;
    }

    flashlight.intensity =
        3.2;

    ambientLight.intensity =
        0.18;

    setObjective(
        "Find a way out."
    );

    updateHealthHUD();

    updateAmmoHUD();

    batteryFill.style.width =
        "100%";

    batteryText.textContent =
        "100%";

    hideMessage();

    interactionEl.classList.remove(
        "visible"
    );
}

/* =========================================================
   START GAME
========================================================= */

function startGame() {

    initAudio();

    if (
        audioContext &&
        audioContext.state === "suspended"
    ) {

        audioContext.resume();
    }

    resetGame();

    state.started =
        true;

    mainMenu.classList.add(
        "hidden"
    );

    pauseMenu.classList.add(
        "hidden"
    );

    controlsPanel.classList.add(
        "hidden"
    );

    gameOverOverlay.classList.add(
        "hidden"
    );

    crosshair.style.display =
        "block";

    updateMobileVisibility();

    showMessage(
        "THE LAST ROOM",
        "Find a way out.",
        3000
    );

    if (
        !isMobile()
    ) {

        renderer.domElement.requestPointerLock?.();
    }
}

/* =========================================================
   MENU CONTROLS
========================================================= */

startButton.addEventListener(
    "click",
    startGame
);

againButton.addEventListener(
    "click",
    startGame
);

resumeButton.addEventListener(
    "click",
    resumeGame
);

restartButton.addEventListener(
    "click",
    () => {

        resetGame();

        state.started =
            true;

        pauseMenu.classList.add(
            "hidden"
        );

        if (
            !isMobile()
        ) {

            renderer.domElement.requestPointerLock?.();
        }

        showMessage(
            "RESTARTED",
            "Find a way out.",
            1800
        );
    }
);

/* =========================================================
   CONTROLS MENU
========================================================= */

function showControls() {

    controlsPanel.classList.remove(
        "hidden"
    );

    mainMenu.classList.add(
        "hidden"
    );

    pauseMenu.classList.add(
        "hidden"
    );
}

function closeControlsPanel() {

    controlsPanel.classList.add(
        "hidden"
    );

    if (
        state.started &&
        !state.gameOver
    ) {

        pauseMenu.classList.remove(
            "hidden"
        );

    } else {

        mainMenu.classList.remove(
            "hidden"
        );
    }
}

controlsButton.addEventListener(
    "click",
    showControls
);

pauseControlsButton.addEventListener(
    "click",
    showControls
);

closeControls.addEventListener(
    "click",
    closeControlsPanel
);

/* =========================================================
   KEYBOARD
========================================================= */

window.addEventListener(
    "keydown",
    event => {

        keys[event.code] =
            true;

        if (
            event.code === "Space"
        ) {

            event.preventDefault();

            jump();
        }

        if (
            event.code === "KeyE"
        ) {

            interact();
        }

        if (
            event.code === "KeyF"
        ) {

            toggleFlashlight();
        }

        if (
            event.code === "KeyR"
        ) {

            reload();
        }

        if (
            event.code === "KeyQ"
        ) {

            switchWeapon();
        }

        if (
            event.code === "Digit1"
        ) {

            currentWeaponIndex =
                0;

            updateAmmoHUD();
        }

        if (
            event.code === "Digit2"
        ) {

            currentWeaponIndex =
                1;

            updateAmmoHUD();
        }

        if (
            event.code === "Digit3"
        ) {

            currentWeaponIndex =
                2;

            updateAmmoHUD();
        }

        if (
            event.code === "Escape"
        ) {

            if (
                controlsPanel.classList.contains(
                    "hidden"
                )
            ) {

                if (
                    state.paused
                ) {

                    resumeGame();

                } else {

                    pauseGame();
                }
            }
        }
    }
);

window.addEventListener(
    "keyup",
    event => {

        keys[event.code] =
            false;
    }
);

/* =========================================================
   MOUSE LOOK
========================================================= */

document.addEventListener(
    "mousemove",
    event => {

        if (
            !state.started ||
            state.paused ||
            state.gameOver
        ) {
            return;
        }

        if (
            isMobile()
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

        player.yaw -=
            event.movementX *
            sensitivity;

        player.pitch -=
            event.movementY *
            sensitivity;

        player.pitch =
            clamp(
                player.pitch,
                -Math.PI / 2 + 0.05,
                Math.PI / 2 - 0.05
            );
    }
);

/* =========================================================
   MOUSE SHOOT
========================================================= */

rendererReadyClick();

function rendererReadyClick() {

    document.addEventListener(
        "mousedown",
        event => {

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

            if (
                isMobile()
            ) {
                return;
            }

            shoot();
        }
    );
}

/* =========================================================
   POINTER LOCK
========================================================= */

document.addEventListener(
    "pointerlockchange",
    () => {

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
                !isMobile() &&
                !state.paused
            ) {

                pauseGame();
            }
        }
    }
);

/* =========================================================
   MOBILE JOYSTICK
========================================================= */

let joystickRect = null;

function updateJoystick(
    clientX,
    clientY
) {

    if (!joystickRect) {

        joystickRect =
            joystickBase.getBoundingClientRect();
    }

    const centerX =
        joystickRect.left +
        joystickRect.width / 2;

    const centerY =
        joystickRect.top +
        joystickRect.height / 2;

    let dx =
        clientX -
        centerX;

    let dy =
        clientY -
        centerY;

    const maxDistance =
        joystickRect.width * 0.35;

    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );

    if (
        distance >
        maxDistance
    ) {

        dx =
            dx /
            distance *
            maxDistance;

        dy =
            dy /
            distance *
            maxDistance;
    }

    joystick.x =
        dx /
        maxDistance;

    joystick.y =
        dy /
        maxDistance;

    joystickKnob.style.transform =
        `translate(
            calc(-50% + ${dx}px),
            calc(-50% + ${dy}px)
        )`;
}

function resetJoystick() {

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
    "pointerdown",
    event => {

        if (!isMobile()) {
            return;
        }

        joystick.active =
            true;

        joystick.pointerId =
            event.pointerId;

        joystickRect =
            joystickBase.getBoundingClientRect();

        joystickBase.setPointerCapture?.(
            event.pointerId
        );

        updateJoystick(
            event.clientX,
            event.clientY
        );
    }
);

joystickBase.addEventListener(
    "pointermove",
    event => {

        if (
            joystick.active &&
            event.pointerId ===
            joystick.pointerId
        ) {

            updateJoystick(
                event.clientX,
                event.clientY
            );
        }
    }
);

joystickBase.addEventListener(
    "pointerup",
    resetJoystick
);

joystickBase.addEventListener(
    "pointercancel",
    resetJoystick
);

/* =========================================================
   MOBILE LOOK
========================================================= */

lookArea.addEventListener(
    "pointerdown",
    event => {

        if (!isMobile()) {
            return;
        }

        if (
            !state.started ||
            state.paused ||
            state.gameOver
        ) {
            return;
        }

        look.active =
            true;

        look.pointerId =
            event.pointerId;

        look.lastX =
            event.clientX;

        look.lastY =
            event.clientY;

        lookArea.setPointerCapture?.(
            event.pointerId
        );
    }
);

lookArea.addEventListener(
    "pointermove",
    event => {

        if (
            !look.active ||
            event.pointerId !==
            look.pointerId
        ) {
            return;
        }

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

        player.pitch =
            clamp(
                player.pitch,
                -Math.PI / 2 + 0.05,
                Math.PI / 2 - 0.05
            );
    }
);

function resetLook() {

    look.active =
        false;

    look.pointerId =
        null;
}

lookArea.addEventListener(
    "pointerup",
    resetLook
);

lookArea.addEventListener(
    "pointercancel",
    resetLook
);

/* =========================================================
   MOBILE BUTTONS
========================================================= */

mobileShoot.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();

        shoot();
    }
);

mobileReload.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();

        reload();
    }
);

mobileJump.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();

        jump();
    }
);

mobileCrouch.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();

        keys.KeyC =
            true;
    }
);

mobileCrouch.addEventListener(
    "pointerup",
    () => {

        keys.KeyC =
            false;
    }
);

mobileCrouch.addEventListener(
    "pointercancel",
    () => {

        keys.KeyC =
            false;
    }
);

mobileFlashlight.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();

        toggleFlashlight();
    }
);

mobileInteract.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();

        interact();
    }
);

mobileWeapons.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();

        switchWeapon();
    }
);

/* =========================================================
   RESIZE
========================================================= */

function resize() {

    if (
        !camera ||
        !renderer
    ) {
        return;
    }

    const width =
        Math.max(
            window.innerWidth,
            1
        );

    const height =
        Math.max(
            window.innerHeight,
            1
        );

    camera.aspect =
        width /
        height;

    camera.updateProjectionMatrix();

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            2
        )
    );

    renderer.setSize(
        width,
        height
    );

    joystickRect =
        null;

    updateMobileVisibility();

    crosshair.style.display =
        "block";
}

window.addEventListener(
    "resize",
    resize
);

window.addEventListener(
    "orientationchange",
    () => {

        setTimeout(
            resize,
            150
        );
    }
);

/* =========================================================
   FOOTSTEPS
========================================================= */

function updateFootsteps(
    delta
) {

    const input =
        getMovementInput();

    const moving =
        Math.abs(input.forward) >
            0.1 ||
        Math.abs(input.right) >
            0.1;

    if (
        !moving ||
        !state.started ||
        state.paused ||
        !player.grounded
    ) {
        return;
    }

    const interval =
        player.sprinting
            ? 0.32
            : 0.48;

    if (
        performance.now() -
        lastFootstep >
        interval * 1000
    ) {

        lastFootstep =
            performance.now();

        sound(
            random(55, 75),
            0.035,
            0.012,
            "triangle"
        );
    }
}

/* =========================================================
   GAME LOOP
========================================================= */

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
        state.started &&
        !state.paused &&
        !state.gameOver
    ) {

        state.elapsed +=
            delta;

        if (
            health.damageCooldown >
            0
        ) {

            health.damageCooldown -=
                delta * 1000;
        }

        if (
            state.messageTimer >
            0
        ) {

            state.messageTimer -=
                delta * 1000;

            if (
                state.messageTimer <= 0
            ) {

                hideMessage();
            }
        }

        updatePlayer(
            delta
        );

        updateFlashlight(
            delta
        );

        updateFlashlightAim();

        updateGun(
            delta
        );

        updateZombies(
            delta
        );

        updateFlicker(
            delta
        );

        updateInteraction();

        updateFootsteps(
            delta
        );

        checkVictory();
    }

    renderer.render(
        scene,
        camera
    );
}

/* =========================================================
   START
========================================================= */

function boot() {

    loadingProgress.style.width =
        "15%";

    loadingText.textContent =
        "Creating environment...";

    initThree();

    loadingProgress.style.width =
        "65%";

    loadingText.textContent =
        "Loading entities...";

    updateHealthHUD();

    updateAmmoHUD();

    updateMobileVisibility();

    loadingProgress.style.width =
        "85%";

    loadingText.textContent =
        "Preparing controls...";

    animate();
}

boot();

/* =========================================================
   END
========================================================= */
