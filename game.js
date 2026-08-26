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

    /* Treat wide touch-enabled laptops/desktops as PC.
       Only use touch controls on genuinely small/coarse screens. */

    const coarse =
        window.matchMedia &&
        window.matchMedia("(pointer: coarse)").matches;

    return (
        window.innerWidth <= 900 ||
        (coarse && window.innerWidth <= 1100)
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

    if (
        "outputColorSpace" in renderer &&
        THREE.SRGBColorSpace
    ) {

        renderer.outputColorSpace =
            THREE.SRGBColorSpace;

    } else if (
        "outputEncoding" in renderer &&
        THREE.sRGBEncoding
    ) {

        renderer.outputEncoding =
            THREE.sRGBEncoding;
    }

    if (
        THREE.ACESFilmicToneMapping !==
        undefined
    ) {

        renderer.toneMapping =
            THREE.ACESFilmicToneMapping;

        renderer.toneMappingExposure =
            1.15;
    }

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
            0x6f6f6f,
            0x101010,
            0.30
        );

    scene.add(
        ambientLight
    );

    /*
       MAIN FIRST-PERSON FLASHLIGHT

       This is attached directly to the camera,
       therefore it always points where the player looks.
    */

    flashlight =
        new THREE.SpotLight(
            0xffffff,
            6.0,
            28,
            Math.PI / 8,
            0.62,
            1.15
        );

    flashlight.position.set(
        0,
        0,
        0
    );

    flashlight.target.position.set(
        0,
        0,
        -12
    );

    flashlight.castShadow =
        true;

    flashlight.shadow.mapSize.width =
        1536;

    flashlight.shadow.mapSize.height =
        1536;

    flashlight.shadow.camera.near =
        0.1;

    flashlight.shadow.camera.far =
        30;

    flashlight.shadow.bias =
        -0.0005;

    flashlight.shadow.normalBias =
        0.02;

    camera.add(
        flashlight
    );

    camera.add(
        flashlight.target
    );

    /*
       CLOSE RANGE FILL LIGHT

       Prevents gun/player hands and nearby objects
       from becoming completely black.
    */

    flashlightFill =
        new THREE.PointLight(
            0xeaf3ff,
            0.45,
            5,
            1.5
        );

    flashlightFill.position.set(
        0,
        0,
        -0.15
    );

    camera.add(
        flashlightFill
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

        roughness: 0.92,

        metalness: 0.02
    });
}

function floorMaterial() {

    return new THREE.MeshStandardMaterial({

        color: 0x181818,

        roughness: 0.96,

        metalness: 0.01
    });
}

function ceilingMaterial() {

    return new THREE.MeshStandardMaterial({

        color: 0x111111,

        roughness: 0.98,

        metalness: 0
    });
}

function woodMaterial() {

    return new THREE.MeshStandardMaterial({

        color: 0x3a2419,

        roughness: 0.85,

        metalness: 0
    });
}

function metalMaterial() {

    return new THREE.MeshStandardMaterial({

        color: 0x383b3d,

        roughness: 0.55,

        metalness: 0.75
    });
}

/* =========================================================
   BOX HELPER
========================================================= */

function createBox(
    width,
    height,
    depth,
    material,
    x,
    y,
    z,
    castShadow = true,
    receiveShadow = true
) {

    const geometry =
        new THREE.BoxGeometry(
            width,
            height,
            depth
        );

    const mesh =
        new THREE.Mesh(
            geometry,
            material
        );

    mesh.position.set(
        x,
        y,
        z
    );

    mesh.castShadow =
        castShadow;

    mesh.receiveShadow =
        receiveShadow;

    scene.add(
        mesh
    );

    return mesh;
}

/* =========================================================
   FLOOR
========================================================= */

function createFloor() {

    const floor =
        createBox(
            ROOM.width,
            0.25,
            ROOM.depth,
            floorMaterial(),
            0,
            -0.125,
            0,
            false,
            true
        );

    floor.name =
        "ROOM_FLOOR";

    return floor;
}

/* =========================================================
   CEILING
========================================================= */

function createCeiling() {

    const ceiling =
        createBox(
            ROOM.width,
            0.25,
            ROOM.depth,
            ceilingMaterial(),
            0,
            ROOM.wallHeight,
            0,
            false,
            true
        );

    ceiling.name =
        "ROOM_CEILING";

    return ceiling;
}

/* =========================================================
   WALLS
========================================================= */

function createWalls() {

    const wallMat =
        wallMaterial();

    /*
       BACK WALL
    */

    createBox(
        ROOM.width,
        ROOM.wallHeight,
        0.5,
        wallMat,
        0,
        ROOM.wallHeight / 2,
        -ROOM.depth / 2
    );

    /*
       LEFT WALL
    */

    createBox(
        0.5,
        ROOM.wallHeight,
        ROOM.depth,
        wallMat,
        -ROOM.width / 2,
        ROOM.wallHeight / 2,
        0
    );

    /*
       RIGHT WALL
    */

    createBox(
        0.5,
        ROOM.wallHeight,
        ROOM.depth,
        wallMat,
        ROOM.width / 2,
        ROOM.wallHeight / 2,
        0
    );

    /*
       FRONT WALL

       Leave central opening for exit door.
    */

    const frontWidth =
        ROOM.width;

    const doorWidth =
        3.2;

    const sideWidth =
        (frontWidth - doorWidth) / 2;

    createBox(
        sideWidth,
        ROOM.wallHeight,
        0.5,
        wallMat,
        -(doorWidth / 2 + sideWidth / 2),
        ROOM.wallHeight / 2,
        ROOM.depth / 2,
        true,
        true
    );

    createBox(
        sideWidth,
        ROOM.wallHeight,
        0.5,
        wallMat,
        doorWidth / 2 + sideWidth / 2,
        ROOM.wallHeight / 2,
        ROOM.depth / 2,
        true,
        true
    );

    /*
       TOP SECTION ABOVE DOOR
    */

    createBox(
        doorWidth,
        1.25,
        0.5,
        wallMat,
        0,
        ROOM.wallHeight - 0.625,
        ROOM.depth / 2
    );
}

/* =========================================================
   CEILING LIGHT FIXTURE
========================================================= */

function createCeilingLight(
    x,
    z,
    intensity = 2.2,
    color = 0xfff3dc
) {

    /*
       Visible lamp housing
    */

    const housingMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x202020,

            roughness: 0.65,

            metalness: 0.35
        });

    const housing =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.8,
                0.12,
                0.65
            ),
            housingMaterial
        );

    housing.position.set(
        x,
        ROOM.wallHeight - 0.12,
        z
    );

    housing.castShadow =
        false;

    housing.receiveShadow =
        true;

    scene.add(
        housing
    );

    /*
       Emissive lamp panel
    */

    const lampMaterial =
        new THREE.MeshStandardMaterial({

            color: color,

            emissive: color,

            emissiveIntensity: 3.0,

            roughness: 0.35
        });

    const lamp =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.35,
                0.05,
                0.38
            ),
            lampMaterial
        );

    lamp.position.set(
        x,
        ROOM.wallHeight - 0.19,
        z
    );

    scene.add(
        lamp
    );

    /*
       Actual point light
    */

    const light =
        new THREE.PointLight(
            color,
            intensity,
            12,
            1.7
        );

    light.position.set(
        x,
        ROOM.wallHeight - 0.28,
        z
    );

    light.castShadow =
        true;

    light.shadow.mapSize.width =
        768;

    light.shadow.mapSize.height =
        768;

    light.shadow.camera.near =
        0.1;

    light.shadow.camera.far =
        14;

    light.shadow.bias =
        -0.0004;

    light.shadow.normalBias =
        0.02;

    scene.add(
        light
    );

    ceilingLights.push({
        light,
        lamp,
        baseIntensity: intensity,
        flicker: false
    });

    return light;
}

/* =========================================================
   ROOM LIGHTING
========================================================= */

function createRoomLighting() {

    /*
       Multiple lights instead of one weak light.
       This gives actual illumination across the room.
    */

    createCeilingLight(
        -7,
        -6,
        2.0
    );

    createCeilingLight(
        7,
        -6,
        2.0
    );

    createCeilingLight(
        -7,
        4,
        2.15
    );

    createCeilingLight(
        7,
        4,
        2.15
    );

    createCeilingLight(
        0,
        -1,
        2.35
    );

    /*
       Soft central fill light.
    */

    const roomFill =
        new THREE.PointLight(
            0x6e7b8f,
            0.32,
            20,
            2
        );

    roomFill.position.set(
        0,
        2.5,
        0
    );

    roomFill.castShadow =
        false;

    scene.add(
        roomFill
    );
}

/* =========================================================
   WORLD CREATION
========================================================= */

function createWorld() {

    createFloor();

    createCeiling();

    createWalls();

    createRoomLighting();

    /*
       Simple room props
    */

    createBox(
        3.5,
        0.9,
        1.4,
        woodMaterial(),
        -6,
        0.45,
        -4
    );

    createBox(
        2.2,
        1.2,
        1.2,
        woodMaterial(),
        5,
        0.6,
        -7
    );

    createBox(
        1.8,
        1.8,
        1.8,
        metalMaterial(),
        -8,
        0.9,
        6
    );
}

/* =========================================================
   END PART 1
========================================================= */

/* =========================================================
   GUN CREATION
========================================================= */

function createGun() {

    gunGroup =
        new THREE.Group();

    /*
       Gun body
    */

    const gunBodyMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x171717,

            roughness: 0.38,

            metalness: 0.72
        });

    const gunBody =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.22,
                0.24,
                0.85
            ),
            gunBodyMaterial
        );

    gunBody.position.set(
        0.34,
        -0.28,
        -0.68
    );

    gunGroup.add(
        gunBody
    );

    /*
       Barrel
    */

    const barrel =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.055,
                0.055,
                0.55,
                16
            ),
            gunBodyMaterial
        );

    barrel.rotation.x =
        Math.PI / 2;

    barrel.position.set(
        0.34,
        -0.24,
        -1.12
    );

    gunGroup.add(
        barrel
    );

    /*
       Grip
    */

    const grip =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.16,
                0.42,
                0.18
            ),
            gunBodyMaterial
        );

    grip.rotation.x =
        -0.22;

    grip.position.set(
        0.34,
        -0.54,
        -0.52
    );

    gunGroup.add(
        grip
    );

    /*
       Front sight
    */

    const sight =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.035,
                0.08,
                0.07
            ),
            gunBodyMaterial
        );

    sight.position.set(
        0.34,
        -0.12,
        -1.35
    );

    gunGroup.add(
        sight
    );

    /*
       Muzzle flash
    */

    muzzleFlash =
        new THREE.PointLight(
            0xffd28a,
            0,
            4,
            2
        );

    muzzleFlash.position.set(
        0.34,
        -0.22,
        -1.4
    );

    gunGroup.add(
        muzzleFlash
    );

    /*
       Gun is attached to camera,
       so it follows player view.
    */

    camera.add(
        gunGroup
    );

    gunGroup.position.set(
        0,
        0,
        0
    );

    gunGroup.rotation.set(
        0,
        0,
        0
    );
}

/* =========================================================
   GUN UPDATE
========================================================= */

function updateGun(delta) {

    if (!gunGroup) {
        return;
    }

    /*
       Small idle movement
    */

    const moving =
        Math.abs(
            player.velocity.x
        ) > 0.1 ||
        Math.abs(
            player.velocity.z
        ) > 0.1;

    if (moving) {

        const bob =
            Math.sin(
                state.elapsed * 8
            ) * 0.008;

        gunGroup.position.y =
            bob;

        gunGroup.rotation.z =
            Math.sin(
                state.elapsed * 8
            ) * 0.008;

    } else {

        gunGroup.position.y =
            Math.sin(
                state.elapsed * 2
            ) * 0.003;

        gunGroup.rotation.z =
            0;
    }

    /*
       Muzzle flash fades automatically.
    */

    if (
        muzzleFlash &&
        muzzleFlash.intensity > 0
    ) {

        muzzleFlash.intensity =
            Math.max(
                0,
                muzzleFlash.intensity -
                delta * 35
            );
    }
}

/* =========================================================
   FLASHLIGHT
========================================================= */

function toggleFlashlight() {

    if (!state.started ||
        state.paused ||
        state.gameOver) {

        return;
    }

    if (
        state.flashlightOn
    ) {

        state.flashlightOn =
            false;

        flashlight.intensity =
            0;

        flashlightFill.intensity =
            0;

        showMessage(
            "FLASHLIGHT",
            "OFF",
            800
        );

    } else {

        if (
            state.battery <= 0
        ) {

            showMessage(
                "BATTERY EMPTY",
                "The flashlight cannot be turned on.",
                1500
            );

            return;
        }

        state.flashlightOn =
            true;

        flashlight.intensity =
            6.0;

        flashlightFill.intensity =
            0.45;

        showMessage(
            "FLASHLIGHT",
            "ON",
            800
        );
    }
}

/* =========================================================
   FLASHLIGHT UPDATE
========================================================= */

function updateFlashlight(delta) {

    if (!flashlight) {
        return;
    }

    /*
       Battery drains only when flashlight is on.
    */

    if (
        state.started &&
        !state.paused &&
        !state.gameOver &&
        state.flashlightOn
    ) {

        state.battery -=
            delta * 0.75;

        state.battery =
            clamp(
                state.battery,
                0,
                100
            );

        if (
            state.battery <= 0
        ) {

            state.battery =
                0;

            state.flashlightOn =
                false;

            flashlight.intensity =
                0;

            flashlightFill.intensity =
                0;

            showMessage(
                "BATTERY EMPTY",
                "The flashlight has died.",
                1800
            );
        }
    }

    /*
       Update HUD
    */

    batteryFill.style.width =
        `${state.battery}%`;

    batteryText.textContent =
        `${Math.ceil(state.battery)}%`;

    /*
       Keep correct flashlight intensity.
    */

    if (
        state.flashlightOn
    ) {

        flashlight.intensity =
            6.0;

        flashlightFill.intensity =
            0.45;

    } else {

        flashlight.intensity =
            0;

        flashlightFill.intensity =
            0;
    }
}

/* =========================================================
   FLASHLIGHT AIM
========================================================= */

function updateFlashlightAim() {

    if (
        !flashlight ||
        !camera
    ) {
        return;
    }

    /*
       Because flashlight is attached to camera,
       target is expressed in camera-local coordinates.

       This fixes the common problem where the beam
       remains pointed in one direction while looking around.
    */

    flashlight.target.position.set(
        0,
        0,
        -12
    );

    flashlight.target.updateMatrixWorld();
}

/* =========================================================
   INTERACTABLES
========================================================= */

function createInteractables() {

    /*
       EXIT DOOR
    */

    const doorMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x24160f,

            roughness: 0.82,

            metalness: 0.12
        });

    doorObject =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                3.0,
                3.0,
                0.25
            ),
            doorMaterial
        );

    doorObject.position.set(
        0,
        1.5,
        ROOM.depth / 2 - 0.12
    );

    doorObject.castShadow =
        true;

    doorObject.receiveShadow =
        true;

    doorObject.userData.interactable =
        true;

    doorObject.userData.type =
        "door";

    scene.add(
        doorObject
    );

    /*
       DOOR HANDLE
    */

    const handle =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.10,
                16,
                16
            ),
            metalMaterial()
        );

    handle.position.set(
        0.85,
        1.45,
        ROOM.depth / 2 - 0.35
    );

    scene.add(
        handle
    );

    /*
       KEY
    */

    const keyGroup =
        new THREE.Group();

    const keyMaterial =
        new THREE.MeshStandardMaterial({

            color: 0xd6b45c,

            emissive: 0x392900,

            emissiveIntensity: 0.4,

            metalness: 0.85,

            roughness: 0.25
        });

    const keyRing =
        new THREE.Mesh(
            new THREE.TorusGeometry(
                0.16,
                0.035,
                10,
                24
            ),
            keyMaterial
        );

    keyRing.rotation.x =
        Math.PI / 2;

    keyGroup.add(
        keyRing
    );

    const keyStem =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.05,
                0.05,
                0.42
            ),
            keyMaterial
        );

    keyStem.position.z =
        -0.22;

    keyGroup.add(
        keyStem
    );

    keyGroup.position.set(
        -5.7,
        1.05,
        -3.8
    );

    keyGroup.userData.interactable =
        true;

    keyGroup.userData.type =
        "key";

    keyObject =
        keyGroup;

    scene.add(
        keyGroup
    );

    /*
       KEY LIGHT
    */

    const keyLight =
        new THREE.PointLight(
            0xffcc55,
            0.55,
            3,
            2
        );

    keyLight.position.set(
        -5.7,
        1.3,
        -3.8
    );

    scene.add(
        keyLight
    );

    /*
       GENERATOR
    */

    generatorObject =
        new THREE.Group();

    const generatorBody =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.6,
                1.4,
                1.0
            ),
            metalMaterial()
        );

    generatorBody.position.y =
        0.7;

    generatorObject.add(
        generatorBody
    );

    const generatorTop =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.25,
                0.18,
                0.8
            ),
            new THREE.MeshStandardMaterial({

                color: 0x222222,

                roughness: 0.5,

                metalness: 0.75
            })
        );

    generatorTop.position.y =
        1.45;

    generatorObject.add(
        generatorTop
    );

    const generatorButton =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.11,
                16,
                16
            ),
            new THREE.MeshStandardMaterial({

                color: 0x8a1818,

                emissive: 0x260000,

                emissiveIntensity: 0.8
            })
        );

    generatorButton.position.set(
        0,
        1.6,
        -0.35
    );

    generatorObject.add(
        generatorButton
    );

    generatorObject.position.set(
        6.5,
        0,
        -3.8
    );

    generatorObject.userData.interactable =
        true;

    generatorObject.userData.type =
        "generator";

    scene.add(
        generatorObject
    );

    /*
       EXIT TRIGGER
    */

    exitObject =
        new THREE.Object3D();

    exitObject.position.set(
        0,
        1,
        ROOM.depth / 2 + 1
    );

    exitObject.userData.interactable =
        true;

    exitObject.userData.type =
        "exit";

    scene.add(
        exitObject
    );
}

/* =========================================================
   INTERACTION DETECTION
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

        state.interactionObject =
            null;

        return;
    }

    const origin =
        camera.getWorldPosition(
            new THREE.Vector3()
        );

    const direction =
        new THREE.Vector3();

    camera.getWorldDirection(
        direction
    );

    const raycaster =
        new THREE.Raycaster(
            origin,
            direction,
            0,
            3.2
        );

    const candidates = [];

    if (
        doorObject &&
        doorObject.visible
    ) {
        candidates.push(
            doorObject
        );
    }

    if (
        keyObject &&
        keyObject.visible
    ) {
        candidates.push(
            keyObject
        );
    }

    if (
        generatorObject &&
        generatorObject.visible
    ) {
        candidates.push(
            generatorObject
        );
    }

    const hits =
        raycaster.intersectObjects(
            candidates,
            true
        );

    if (
        hits.length === 0
    ) {

        interactionEl.classList.remove(
            "visible"
        );

        state.interactionObject =
            null;

        return;
    }

    let object =
        hits[0].object;

    while (
        object &&
        !object.userData.interactable &&
        object.parent
    ) {

        object =
            object.parent;
    }

    if (
        !object ||
        !object.userData.interactable
    ) {

        interactionEl.classList.remove(
            "visible"
        );

        state.interactionObject =
            null;

        return;
    }

    state.interactionObject =
        object;

    interactionEl.classList.add(
        "visible"
    );

    const type =
        object.userData.type;

    if (
        type === "door"
    ) {

        if (
            state.doorUnlocked
        ) {

            interactionMain.textContent =
                "E  OPEN / CLOSE";

            interactionSub.textContent =
                "Exit door";

        } else {

            interactionMain.textContent =
                "E  INTERACT";

            interactionSub.textContent =
                "The door is locked";
        }

    } else if (
        type === "key"
    ) {

        interactionMain.textContent =
            "E  PICK UP";

        interactionSub.textContent =
            "Old brass key";

    } else if (
        type === "generator"
    ) {

        interactionMain.textContent =
            "E  ACTIVATE";

        interactionSub.textContent =
            state.generatorActivated
                ? "Generator running"
                : "Power generator";
    }
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

    const object =
        state.interactionObject;

    if (!object) {
        return;
    }

    const type =
        object.userData.type;

    /*
       KEY
    */

    if (
        type === "key"
    ) {

        state.keyFound =
            true;

        state.doorUnlocked =
            true;

        object.visible =
            false;

        setObjective(
            "The door is unlocked. Find a way out."
        );

        showMessage(
            "KEY FOUND",
            "You found the old brass key.",
            1800
        );

        sound(
            620,
            0.12,
            0.035,
            "sine"
        );

        interactionEl.classList.remove(
            "visible"
        );

        state.interactionObject =
            null;

        return;
    }

    /*
       GENERATOR
    */

    if (
        type === "generator"
    ) {

        if (
            !state.generatorActivated
        ) {

            state.generatorActivated =
                true;

            setObjective(
                "Power restored. Now reach the exit."
            );

            showMessage(
                "POWER RESTORED",
                "Something moved in the darkness...",
                2200
            );

            sound(
                70,
                0.55,
                0.045,
                "sawtooth"
            );

            triggerHorror();

        } else {

            showMessage(
                "GENERATOR",
                "The generator is already running.",
                1000
            );
        }

        return;
    }

    /*
       DOOR
    */

    if (
        type === "door"
    ) {

        if (
            !state.doorUnlocked
        ) {

            showMessage(
                "LOCKED",
                "I need a key.",
                1200
            );

            sound(
                90,
                0.12,
                0.035,
                "square"
            );

            return;
        }

        if (
            !state.doorOpen
        ) {

            state.doorOpen =
                true;

            doorObject.position.y =
                3.9;

            showMessage(
                "DOOR OPEN",
                "Get out of the room.",
                1500
            );

            setObjective(
                "Escape through the open door."
            );

            sound(
                90,
                0.7,
                0.05,
                "sawtooth"
            );

        } else {

            state.doorOpen =
                false;

            doorObject.position.y =
                1.5;
        }

        return;
    }
}

/* =========================================================
   VICTORY CHECK
========================================================= */

function checkVictory() {

    if (
        state.gameOver ||
        !state.started
    ) {
        return;
    }

    if (
        !state.doorOpen
    ) {
        return;
    }

    const distance =
        distance2D(
            player.position,
            exitObject.position
        );

    if (
        distance < 2.0
    ) {

        state.victory =
            true;

        state.gameOver =
            true;

        overTitle.textContent =
            "ESCAPED";

        overHeading.textContent =
            "YOU FOUND A WAY OUT";

        overText.textContent =
            "The room is behind you... but the darkness followed.";

        gameOverOverlay.classList.remove(
            "hidden"
        );

        if (
            document.pointerLockElement
        ) {

            document.exitPointerLock();
        }

        sound(
            520,
            0.5,
            0.04,
            "triangle"
        );
    }
}

/* =========================================================
   END PART 2
========================================================= */

/* =========================================================
   PLAYER MOVEMENT INPUT
========================================================= */

function getMovementInput() {

    let forward = 0;
    let right = 0;

    /*
       PC KEYBOARD
    */

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

    /*
       MOBILE JOYSTICK

       Joystick Y is inverted:
       pushing upward gives negative screen Y,
       therefore convert it to forward positive.
    */

    if (isMobile()) {

        if (
            Math.abs(joystick.y) > 0.05 ||
            Math.abs(joystick.x) > 0.05
        ) {

            forward += -joystick.y;
            right += joystick.x;
        }
    }

    /*
       Normalize diagonal movement.
    */

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
   PLAYER COLLISION
========================================================= */

function resolveWorldCollision() {

    const halfWidth =
        ROOM.width / 2 -
        player.radius;

    const halfDepth =
        ROOM.depth / 2 -
        player.radius;

    /*
       X boundaries
    */

    player.position.x =
        clamp(
            player.position.x,
            -halfWidth,
            halfWidth
        );

    /*
       Back wall
    */

    player.position.z =
        Math.max(
            player.position.z,
            -halfDepth
        );

    /*
       Front wall

       Allow movement through the doorway
       only when the door is open.
    */

    const frontLimit =
        halfDepth;

    const doorwayHalfWidth =
        1.55;

    if (
        !state.doorOpen ||
        Math.abs(player.position.x) >
            doorwayHalfWidth
    ) {

        player.position.z =
            Math.min(
                player.position.z,
                frontLimit
            );
    }
}

/* =========================================================
   PLAYER HEIGHT
========================================================= */

function updatePlayerHeight(delta) {

    const crouchPressed =
        !!keys.KeyC;

    player.crouching =
        crouchPressed;

    const targetHeight =
        player.crouching
            ? player.crouchHeight
            : player.standingHeight;

    const currentHeight =
        camera.position.y;

    camera.position.y =
        THREE.MathUtils.lerp(
            currentHeight,
            targetHeight,
            Math.min(
                1,
                delta * 12
            )
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

    /*
       Do not jump while crouching.
    */

    if (
        player.crouching
    ) {
        return;
    }

    if (
        player.grounded
    ) {

        player.velocity.y =
            player.jumpForce;

        player.grounded =
            false;

        sound(
            150,
            0.06,
            0.018,
            "triangle"
        );
    }
}

/* =========================================================
   PLAYER UPDATE
========================================================= */

function updatePlayer(delta) {

    const input =
        getMovementInput();

    /*
       Sprint
    */

    player.sprinting =
        !!keys.ShiftLeft ||
        !!keys.ShiftRight;

    /*
       Sprint disabled while crouching.
    */

    if (
        player.crouching
    ) {

        player.sprinting =
            false;
    }

    let speed =
        player.crouching
            ? player.crouchSpeed
            : player.moveSpeed;

    if (
        player.sprinting
    ) {

        speed =
            player.sprintSpeed;
    }

    /*
       Camera-relative movement.

       Forward vector based on player's yaw.
    */

    const forwardVector =
        new THREE.Vector3(
            -Math.sin(player.yaw),
            0,
            -Math.cos(player.yaw)
        );

    const rightVector =
        new THREE.Vector3(
            Math.cos(player.yaw),
            0,
            -Math.sin(player.yaw)
        );

    const movement =
        new THREE.Vector3();

    movement.addScaledVector(
        forwardVector,
        input.forward
    );

    movement.addScaledVector(
        rightVector,
        input.right
    );

    if (
        movement.lengthSq() > 0
    ) {

        movement.normalize();

        movement.multiplyScalar(
            speed
        );
    }

    /*
       Smooth horizontal movement.
    */

    const acceleration =
        player.grounded
            ? 14
            : 7;

    player.velocity.x =
        THREE.MathUtils.lerp(
            player.velocity.x,
            movement.x,
            Math.min(
                1,
                delta * acceleration
            )
        );

    player.velocity.z =
        THREE.MathUtils.lerp(
            player.velocity.z,
            movement.z,
            Math.min(
                1,
                delta * acceleration
            )
        );

    /*
       Gravity
    */

    if (
        !player.grounded
    ) {

        player.velocity.y -=
            player.gravity *
            delta;
    }

    /*
       Move player
    */

    player.position.x +=
        player.velocity.x *
        delta;

    player.position.y +=
        player.velocity.y *
        delta;

    player.position.z +=
        player.velocity.z *
        delta;

    /*
       Ground collision
    */

    if (
        player.position.y <= 1.7
    ) {

        player.position.y =
            1.7;

        player.velocity.y =
            0;

        player.grounded =
            true;

    } else {

        player.grounded =
            false;
    }

    resolveWorldCollision();

    /*
       Camera position follows player.
    */

    camera.position.x =
        player.position.x;

    camera.position.y =
        player.position.y;

    camera.position.z =
        player.position.z;

    /*
       Look direction.
    */

    camera.rotation.order =
        "YXZ";

    camera.rotation.y =
        player.yaw;

    camera.rotation.x =
        player.pitch;

    updatePlayerHeight(delta);
}

/* =========================================================
   WEAPON HELPERS
========================================================= */

function getCurrentWeapon() {

    return weapons[
        weaponOrder[
            currentWeaponIndex
        ]
    ];
}

function updateAmmoHUD() {

    const weapon =
        getCurrentWeapon();

    if (!weapon) {
        return;
    }

    weaponName.textContent =
        weapon.name;

    ammoText.textContent =
        `${weapon.magazine} / ${weapon.reserve}`;
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
        reloading
    ) {
        return;
    }

    const weapon =
        getCurrentWeapon();

    const now =
        performance.now();

    if (
        now - lastShotTime <
        weapon.fireRate
    ) {
        return;
    }

    /*
       Empty magazine
    */

    if (
        weapon.magazine <= 0
    ) {

        sound(
            80,
            0.08,
            0.03,
            "square"
        );

        showMessage(
            "EMPTY",
            "Press R to reload.",
            700
        );

        return;
    }

    lastShotTime =
        now;

    weapon.magazine--;

    updateAmmoHUD();

    /*
       Recoil
    */

    player.pitch =
        clamp(
            player.pitch -
                (weapon === weapons.shotgun
                    ? 0.055
                    : 0.025),
            -Math.PI / 2 + 0.05,
            Math.PI / 2 - 0.05
        );

    /*
       Muzzle flash
    */

    if (
        muzzleFlash
    ) {

        muzzleFlash.intensity =
            weapon === weapons.shotgun
                ? 8
                : 5;
    }

    /*
       Sound
    */

    sound(
        weapon === weapons.shotgun
            ? 70
            : 115,
        weapon === weapons.shotgun
            ? 0.28
            : 0.12,
        weapon === weapons.shotgun
            ? 0.08
            : 0.055,
        "sawtooth"
    );

    /*
       Raycast from center of screen.
    */

    const origin =
        camera.getWorldPosition(
            new THREE.Vector3()
        );

    const direction =
        new THREE.Vector3();

    camera.getWorldDirection(
        direction
    );

    const raycaster =
        new THREE.Raycaster(
            origin,
            direction,
            0,
            45
        );

    const zombieMeshes = [];

    zombies.forEach(
        zombie => {

            if (
                zombie &&
                zombie.mesh &&
                zombie.health > 0
            ) {

                zombie.mesh.traverse(
                    child => {

                        if (
                            child.isMesh
                        ) {

                            zombieMeshes.push(
                                child
                            );
                        }
                    }
                );
            }
        }
    );

    const hits =
        raycaster.intersectObjects(
            zombieMeshes,
            true
        );

    if (
        hits.length === 0
    ) {
        return;
    }

    let hitObject =
        hits[0].object;

    let zombie = null;

    while (
        hitObject
    ) {

        if (
            hitObject.userData &&
            hitObject.userData.zombie
        ) {

            zombie =
                hitObject.userData.zombie;

            break;
        }

        hitObject =
            hitObject.parent;
    }

    if (!zombie) {
        return;
    }

    let damage =
        weapon.damage;

    /*
       Shotgun has higher close-range damage.
    */

    if (
        weapon === weapons.shotgun
    ) {

        const hitDistance =
            hits[0].distance;

        if (
            hitDistance < 8
        ) {

            damage *=
                1.15;
        }
    }

    zombie.health -=
        damage;

    zombie.hitFlash =
        0.12;

    sound(
        220,
        0.06,
        0.025,
        "square"
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
   RELOAD
========================================================= */

function reload() {

    if (
        !state.started ||
        state.paused ||
        state.gameOver
    ) {
        return;
    }

    if (
        reloading
    ) {
        return;
    }

    const weapon =
        getCurrentWeapon();

    if (
        weapon.magazine >=
        weapon.magazineSize
    ) {

        return;
    }

    if (
        weapon.reserve <= 0
    ) {

        showMessage(
            "NO AMMO",
            "You have no reserve ammunition.",
            1000
        );

        return;
    }

    reloading =
        true;

    showMessage(
        "RELOADING",
        weapon.name,
        weapon.reloadTime
    );

    sound(
        180,
        0.12,
        0.025,
        "triangle"
    );

    setTimeout(
        () => {

            /*
               Game may have been restarted while
               reload timer was running.
            */

            if (
                !state.started ||
                state.gameOver
            ) {

                reloading =
                    false;

                return;
            }

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

            reloading =
                false;

            updateAmmoHUD();

            sound(
                320,
                0.09,
                0.025,
                "triangle"
            );

        },
        weapon.reloadTime
    );
}

/* =========================================================
   SWITCH WEAPON
========================================================= */

function switchWeapon() {

    if (
        !state.started ||
        state.paused ||
        state.gameOver ||
        reloading
    ) {
        return;
    }

    currentWeaponIndex++;

    if (
        currentWeaponIndex >=
        weaponOrder.length
    ) {

        currentWeaponIndex =
            0;
    }

    updateAmmoHUD();

    showMessage(
        "WEAPON",
        getCurrentWeapon().name,
        700
    );

    sound(
        260,
        0.08,
        0.018,
        "triangle"
    );
}

/* =========================================================
   ZOMBIE CREATION
========================================================= */

function createZombie(
    x,
    z
) {

    const zombieGroup =
        new THREE.Group();

    /*
       Body
    */

    const bodyMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x3d4039,

            roughness: 0.95,

            metalness: 0
        });

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.75,
                1.25,
                0.48
            ),
            bodyMaterial
        );

    body.position.y =
        1.0;

    body.castShadow =
        true;

    body.receiveShadow =
        true;

    zombieGroup.add(
        body
    );

    /*
       Head
    */

    const headMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x686052,

            roughness: 0.9,

            metalness: 0
        });

    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.31,
                18,
                14
            ),
            headMaterial
        );

    head.position.y =
        1.85;

    head.castShadow =
        true;

    head.receiveShadow =
        true;

    zombieGroup.add(
        head
    );

    /*
       Eyes
    */

    const eyeMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x330000,

            emissive: 0x550000,

            emissiveIntensity: 2
        });

    const leftEye =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.045,
                8,
                8
            ),
            eyeMaterial
        );

    leftEye.position.set(
        -0.11,
        1.88,
        -0.275
    );

    zombieGroup.add(
        leftEye
    );

    const rightEye =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.045,
                8,
                8
            ),
            eyeMaterial
        );

    rightEye.position.set(
        0.11,
        1.88,
        -0.275
    );

    zombieGroup.add(
        rightEye
    );

    /*
       Arms
    */

    const armGeometry =
        new THREE.BoxGeometry(
            0.20,
            1.05,
            0.20
        );

    const leftArm =
        new THREE.Mesh(
            armGeometry,
            bodyMaterial
        );

    leftArm.position.set(
        -0.53,
        1.0,
        0
    );

    leftArm.rotation.z =
        -0.12;

    leftArm.castShadow =
        true;

    zombieGroup.add(
        leftArm
    );

    const rightArm =
        new THREE.Mesh(
            armGeometry,
            bodyMaterial
        );

    rightArm.position.set(
        0.53,
        1.0,
        0
    );

    rightArm.rotation.z =
        0.12;

    rightArm.castShadow =
        true;

    zombieGroup.add(
        rightArm
    );

    /*
       Legs
    */

    const legGeometry =
        new THREE.BoxGeometry(
            0.22,
            0.9,
            0.24
        );

    const leftLeg =
        new THREE.Mesh(
            legGeometry,
            bodyMaterial
        );

    leftLeg.position.set(
        -0.20,
        0.28,
        0
    );

    leftLeg.castShadow =
        true;

    zombieGroup.add(
        leftLeg
    );

    const rightLeg =
        new THREE.Mesh(
            legGeometry,
            bodyMaterial
        );

    rightLeg.position.set(
        0.20,
        0.28,
        0
    );

    rightLeg.castShadow =
        true;

    zombieGroup.add(
        rightLeg
    );

    /*
       Zombie data
    */

    const zombie = {

        mesh: zombieGroup,

        health:
            ZOMBIE_CONFIG.health,

        speed:
            ZOMBIE_CONFIG.speed,

        chaseSpeed:
            ZOMBIE_CONFIG.chaseSpeed,

        attackTimer: 0,

        hitFlash: 0,

        alive: true,

        baseX: x,

        baseZ: z
    };

    zombieGroup.userData.zombie =
        zombie;

    zombieGroup.traverse(
        child => {

            if (
                child.isMesh
            ) {

                child.userData.zombie =
                    zombie;
            }
        }
    );

    zombieGroup.position.set(
        x,
        0,
        z
    );

    scene.add(
        zombieGroup
    );

    zombies.push(
        zombie
    );

    return zombie;
}

/* =========================================================
   CREATE ZOMBIES
========================================================= */

function createZombies() {

    createZombie(
        -8,
        -8
    );

    createZombie(
        8,
        -8
    );

    createZombie(
        -9,
        4
    );

    createZombie(
        8,
        6
    );

    createZombie(
        0,
        -9
    );
}

/* =========================================================
   ZOMBIE UPDATE
========================================================= */

function updateZombies(delta) {

    zombies.forEach(
        zombie => {

            if (
                !zombie ||
                !zombie.alive
            ) {
                return;
            }

            if (
                zombie.hitFlash > 0
            ) {

                zombie.hitFlash -=
                    delta;

                zombie.mesh.traverse(
                    child => {

                        if (
                            child.isMesh &&
                            child.material &&
                            child.material.emissive
                        ) {

                            child.material.emissiveIntensity =
                                zombie.hitFlash >
                                0
                                    ? 1.8
                                    : 0;
                        }
                    }
                );
            }

            if (
                zombie.attackTimer > 0
            ) {

                zombie.attackTimer -=
                    delta * 1000;
            }

            const distance =
                distance2D(
                    zombie.mesh.position,
                    player.position
                );

            /*
               Zombie AI
            */

            if (
                distance <=
                ZOMBIE_CONFIG.detectionDistance
            ) {

                const dx =
                    player.position.x -
                    zombie.mesh.position.x;

                const dz =
                    player.position.z -
                    zombie.mesh.position.z;

                const length =
                    Math.sqrt(
                        dx * dx +
                        dz * dz
                    );

                if (
                    length > 0.001
                ) {

                    const dirX =
                        dx / length;

                    const dirZ =
                        dz / length;

                    if (
                        distance >
                        ZOMBIE_CONFIG.attackDistance
                    ) {

                        const speed =
                            distance < 10
                                ? zombie.chaseSpeed
                                : zombie.speed;

                        zombie.mesh.position.x +=
                            dirX *
                            speed *
                            delta;

                        zombie.mesh.position.z +=
                            dirZ *
                            speed *
                            delta;

                    } else {

                        /*
                           Attack
                        */

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

                    /*
                       Face player
                    */

                    zombie.mesh.rotation.y =
                        Math.atan2(
                            dirX,
                            dirZ
                        );
                }
            }

            /*
               Keep zombies inside room.
            */

            zombie.mesh.position.x =
                clamp(
                    zombie.mesh.position.x,
                    -ROOM.width / 2 + 0.7,
                    ROOM.width / 2 - 0.7
                );

            zombie.mesh.position.z =
                clamp(
                    zombie.mesh.position.z,
                    -ROOM.depth / 2 + 0.7,
                    ROOM.depth / 2 - 0.7
                );
        }
    );
}

/* =========================================================
   DAMAGE PLAYER
========================================================= */

function damagePlayer(
    amount
) {

    if (
        health.damageCooldown > 0
    ) {
        return;
    }

    health.damageCooldown =
        health.damageCooldownTime;

    health.current -=
        amount;

    health.current =
        clamp(
            health.current,
            0,
            health.maximum
        );

    updateHealthHUD();

    sound(
        55,
        0.18,
        0.045,
        "sawtooth"
    );

    if (
        health.current <= 0
    ) {

        endGame(
            false
        );
    }
}

/* =========================================================
   KILL ZOMBIE
========================================================= */

function killZombie(
    zombie
) {

    if (
        !zombie ||
        !zombie.alive
    ) {
        return;
    }

    zombie.alive =
        false;

    zombie.health =
        0;

    /*
       Death animation
    */

    const startY =
        zombie.mesh.rotation.z;

    const deathDuration =
        500;

    const startTime =
        performance.now();

    function deathAnimation() {

        const elapsed =
            performance.now() -
            startTime;

        const progress =
            clamp(
                elapsed /
                deathDuration,
                0,
                1
            );

        zombie.mesh.rotation.z =
            startY +
            progress *
            (Math.PI / 2);

        zombie.mesh.position.y =
            progress * -0.2;

        if (
            progress < 1
        ) {

            requestAnimationFrame(
                deathAnimation
            );

        } else {

            zombie.mesh.visible =
                false;
        }
    }

    deathAnimation();

    sound(
        65,
        0.22,
        0.035,
        "sawtooth"
    );
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
        `${Math.ceil(
            health.current
        )}`;
}

/* =========================================================
   HORROR APPARITION
========================================================= */

function createApparition() {

    apparition =
        new THREE.Group();

    const material =
        new THREE.MeshStandardMaterial({

            color: 0x111111,

            transparent: true,

            opacity: 0,

            roughness: 1,

            emissive: 0x050505
        });

    const body =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                0.42,
                1.5,
                6,
                12
            ),
            material
        );

    body.position.y =
        1.4;

    apparition.add(
        body
    );

    const eyeMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xaa0000
        });

    const eye1 =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.04,
                8,
                8
            ),
            eyeMaterial
        );

    eye1.position.set(
        -0.13,
        1.72,
        -0.37
    );

    apparition.add(
        eye1
    );

    const eye2 =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.04,
                8,
                8
            ),
            eyeMaterial
        );

    eye2.position.set(
        0.13,
        1.72,
        -0.37
    );

    apparition.add(
        eye2
    );

    apparition.position.set(
        0,
        0,
        -8
    );

    apparition.visible =
        false;

    scene.add(
        apparition
    );
}

/* =========================================================
   HORROR TRIGGER
========================================================= */

function triggerHorror() {

    if (
        state.horrorTriggered
    ) {
        return;
    }

    state.horrorTriggered =
        true;

    if (
        apparition
    ) {

        apparition.visible =
            true;

        apparition.position.set(
            player.position.x,
            0,
            player.position.z - 7
        );

        apparition.lookAt(
            player.position.x,
            1.4,
            player.position.z
        );

        apparition.traverse(
            child => {

                if (
                    child.material &&
                    child.material.opacity !==
                        undefined
                ) {

                    child.material.opacity =
                        0.85;
                }
            }
        );

        setTimeout(
            () => {

                if (
                    apparition
                ) {

                    apparition.visible =
                        false;
                }

            },
            1800
        );
    }

    /*
       Lights react to horror event.
    */

    ceilingLights.forEach(
        lightData => {

            lightData.flicker =
                true;
        }
    );

    setTimeout(
        () => {

            ceilingLights.forEach(
                lightData => {

                    lightData.flicker =
                        false;

                    lightData.light.intensity =
                        lightData.baseIntensity;
                }
            );

        },
        2500
    );

    sound(
        35,
        1.1,
        0.055,
        "sawtooth"
    );
}

/* =========================================================
   LIGHT FLICKER
========================================================= */

function updateFlicker(delta) {

    flickerTimer -=
        delta;

    if (
        flickerTimer > 0
    ) {
        return;
    }

    flickerTimer =
        random(
            0.025,
            0.12
        );

    ceilingLights.forEach(
        lightData => {

            if (
                !lightData.flicker
            ) {

                return;
            }

            const randomFactor =
                Math.random();

            if (
                randomFactor < 0.30
            ) {

                lightData.light.intensity =
                    lightData.baseIntensity *
                    random(
                        0.05,
                        0.30
                    );

            } else {

                lightData.light.intensity =
                    lightData.baseIntensity *
                    random(
                        0.75,
                        1.05
                    );
            }
        }
    );
}

/* =========================================================
   END GAME
========================================================= */

function endGame(
    victory
) {

    if (
        state.gameOver
    ) {
        return;
    }

    state.gameOver =
        true;

    state.victory =
        !!victory;

    if (
        document.pointerLockElement
    ) {

        document.exitPointerLock();
    }

    if (
        state.victory
    ) {

        overTitle.textContent =
            "ESCAPED";

        overHeading.textContent =
            "YOU FOUND A WAY OUT";

        overText.textContent =
            "You survived the last room.";

    } else {

        overTitle.textContent =
            "GAME OVER";

        overHeading.textContent =
            "YOU DID NOT ESCAPE";

        overText.textContent =
            "The room claimed another victim.";
    }

    gameOverOverlay.classList.remove(
        "hidden"
    );
}

/* =========================================================
   END PART 3
========================================================= */

/* =========================================================
   RESET GAME
========================================================= */

function resetGame() {

    /*
       GAME STATE
    */

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

    state.messageTimer =
        0;

    state.interactionObject =
        null;

    /*
       PLAYER
    */

    player.position.set(
        0,
        1.7,
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

    player.grounded =
        true;

    player.crouching =
        false;

    player.sprinting =
        false;

    /*
       HEALTH
    */

    health.current =
        health.maximum;

    health.damageCooldown =
        0;

    /*
       WEAPON
    */

    currentWeaponIndex =
        0;

    reloading =
        false;

    lastShotTime =
        0;

    weapons.pistol.magazine =
        weapons.pistol.magazineSize;

    weapons.pistol.reserve =
        48;

    weapons.shotgun.magazine =
        weapons.shotgun.magazineSize;

    weapons.shotgun.reserve =
        25;

    weapons.revolver.magazine =
        weapons.revolver.magazineSize;

    weapons.revolver.reserve =
        30;

    /*
       DOOR
    */

    if (
        doorObject
    ) {

        doorObject.visible =
            true;

        doorObject.position.set(
            0,
            1.5,
            ROOM.depth / 2 - 0.12
        );
    }

    /*
       KEY
    */

    if (
        keyObject
    ) {

        keyObject.visible =
            true;
    }

    /*
       GENERATOR
    */

    if (
        generatorObject
    ) {

        generatorObject.visible =
            true;
    }

    /*
       ZOMBIES
    */

    zombies.forEach(
        zombie => {

            if (!zombie) {
                return;
            }

            zombie.health =
                ZOMBIE_CONFIG.health;

            zombie.alive =
                true;

            zombie.attackTimer =
                0;

            zombie.hitFlash =
                0;

            zombie.mesh.visible =
                true;

            zombie.mesh.position.set(
                zombie.baseX,
                0,
                zombie.baseZ
            );

            zombie.mesh.rotation.set(
                0,
                0,
                0
            );
        }
    );

    /*
       APPARITION
    */

    if (
        apparition
    ) {

        apparition.visible =
            false;

        apparition.position.set(
            0,
            0,
            -8
        );

        apparition.rotation.set(
            0,
            0,
            0
        );

        apparition.traverse(
            child => {

                if (
                    child.material &&
                    child.material.opacity !==
                        undefined
                ) {

                    child.material.opacity =
                        0;
                }
            }
        );
    }

    /*
       LIGHTING
    */

    ceilingLights.forEach(
        lightData => {

            lightData.flicker =
                false;

            lightData.light.intensity =
                lightData.baseIntensity;
        }
    );

    if (
        flashlight
    ) {

        flashlight.intensity =
            6.0;
    }

    if (
        flashlightFill
    ) {

        flashlightFill.intensity =
            0.45;
    }

    /*
       HUD
    */

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

    crosshair.style.display =
        "block";

    /*
       RESET INPUTS

       Important fix:
       prevents W/A/S/D or Shift from getting
       stuck after restarting/losing focus.
    */

    Object.keys(keys).forEach(
        key => {

            keys[key] =
                false;
        }
    );

    mouseDown =
        false;

    resetJoystick();

    resetLook();
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

    /*
       PC pointer lock.

       On touch/mobile we do not request pointer lock.
    */

    if (
        !isMobile()
    ) {

        renderer.domElement.focus();

        renderer.domElement.requestPointerLock?.();
    }
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

    if (
        document.pointerLockElement
    ) {

        document.exitPointerLock();
    }

    Object.keys(keys).forEach(
        key => {

            keys[key] =
                false;
        }
    );

    resetJoystick();

    resetLook();
}

/* =========================================================
   RESUME
========================================================= */

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

    /*
       Only PC needs pointer lock.
    */

    if (
        !isMobile()
    ) {

        renderer.domElement.focus();

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

        gameOverOverlay.classList.add(
            "hidden"
        );

        if (
            !isMobile()
        ) {

            renderer.domElement.focus();

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
   KEYBOARD INPUT
========================================================= */

window.addEventListener(
    "keydown",
    event => {

        /*
           Prevent browser scrolling for game keys.
        */

        const gameKeys = [
            "KeyW",
            "KeyA",
            "KeyS",
            "KeyD",
            "KeyE",
            "KeyF",
            "KeyR",
            "KeyQ",
            "KeyC",
            "ShiftLeft",
            "ShiftRight",
            "Space",
            "Digit1",
            "Digit2",
            "Digit3",
            "Enter",
            "Escape"
        ];

        if (
            gameKeys.includes(
                event.code
            )
        ) {

            event.preventDefault();
        }

        /*
           ENTER FIX

           Allows Enter to work on menu buttons
           even when pointer lock is not active.
        */

        if (
            event.code === "Enter"
        ) {

            if (
                !state.started
            ) {

                startGame();

                return;
            }

            if (
                state.gameOver
            ) {

                startGame();

                return;
            }

            if (
                state.paused &&
                controlsPanel.classList.contains(
                    "hidden"
                )
            ) {

                resumeGame();

                return;
            }
        }

        /*
           ESC
        */

        if (
            event.code === "Escape"
        ) {

            if (
                !controlsPanel.classList.contains(
                    "hidden"
                )
            ) {

                return;
            }

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

                return;
            }
        }

        /*
           Ignore gameplay input while menu is open.
        */

        if (
            !state.started ||
            state.paused ||
            state.gameOver
        ) {

            return;
        }

        keys[event.code] =
            true;

        /*
           JUMP
        */

        if (
            event.code === "Space" &&
            !event.repeat
        ) {

            jump();
        }

        /*
           INTERACT
        */

        if (
            event.code === "KeyE" &&
            !event.repeat
        ) {

            interact();
        }

        /*
           FLASHLIGHT
        */

        if (
            event.code === "KeyF" &&
            !event.repeat
        ) {

            toggleFlashlight();
        }

        /*
           RELOAD
        */

        if (
            event.code === "KeyR" &&
            !event.repeat
        ) {

            reload();
        }

        /*
           WEAPON SWITCH
        */

        if (
            event.code === "KeyQ" &&
            !event.repeat
        ) {

            switchWeapon();
        }

        /*
           DIRECT WEAPON SELECTION
        */

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
    }
);

/* =========================================================
   KEYBOARD RELEASE
========================================================= */

window.addEventListener(
    "keyup",
    event => {

        keys[event.code] =
            false;
    }
);

/* =========================================================
   WINDOW BLUR FIX
========================================================= */

window.addEventListener(
    "blur",
    () => {

        Object.keys(keys).forEach(
            key => {

                keys[key] =
                    false;
            }
        );

        mouseDown =
            false;

        resetJoystick();

        resetLook();
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

        /*
           FIX:

           If pointer lock is active, use movementX/Y.
           This gives proper FPS camera movement.
        */

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

renderer.domElement.addEventListener(
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

        /*
           If pointer lock was lost,
           clicking the game area restores it.
        */

        if (
            document.pointerLockElement !==
            renderer.domElement
        ) {

            renderer.domElement.requestPointerLock?.();

            return;
        }

        mouseDown =
            true;

        shoot();
    }
);

window.addEventListener(
    "mouseup",
    event => {

        if (
            event.button === 0
        ) {

            mouseDown =
                false;
        }
    }
);

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

        /*
           PC only.

           Losing pointer lock while playing
           pauses the game so mouse control does
           not silently stop.
        */

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

    if (
        !joystickRect
    ) {

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
        joystickRect.width *
        0.35;

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

    if (
        joystickKnob
    ) {

        joystickKnob.style.transform =
            "translate(-50%, -50%)";
    }
}

joystickBase.addEventListener(
    "pointerdown",
    event => {

        if (
            !isMobile()
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

        event.preventDefault();

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

            event.preventDefault();

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

joystickBase.addEventListener(
    "lostpointercapture",
    resetJoystick
);

/* =========================================================
   MOBILE LOOK
========================================================= */

lookArea.addEventListener(
    "pointerdown",
    event => {

        if (
            !isMobile()
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

        event.preventDefault();

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

        /*
           Mobile camera sensitivity.
        */

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

lookArea.addEventListener(
    "lostpointercapture",
    resetLook
);

/* =========================================================
   MOBILE BUTTONS
========================================================= */

mobileShoot.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();

        if (
            !state.started ||
            state.paused ||
            state.gameOver
        ) {
            return;
        }

        shoot();
    }
);

mobileReload.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();

        if (
            !state.started ||
            state.paused ||
            state.gameOver
        ) {
            return;
        }

        reload();
    }
);

mobileJump.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();

        if (
            !state.started ||
            state.paused ||
            state.gameOver
        ) {
            return;
        }

        jump();
    }
);

mobileCrouch.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();

        if (
            !state.started ||
            state.paused ||
            state.gameOver
        ) {
            return;
        }

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

mobileCrouch.addEventListener(
    "lostpointercapture",
    () => {

        keys.KeyC =
            false;
    }
);

mobileFlashlight.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();

        if (
            !state.started ||
            state.paused ||
            state.gameOver
        ) {
            return;
        }

        toggleFlashlight();
    }
);

mobileInteract.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();

        if (
            !state.started ||
            state.paused ||
            state.gameOver
        ) {
            return;
        }

        interact();
    }
);

mobileWeapons.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();

        if (
            !state.started ||
            state.paused ||
            state.gameOver
        ) {
            return;
        }

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
        Math.abs(
            input.forward
        ) > 0.1 ||
        Math.abs(
            input.right
        ) > 0.1;

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
                state.messageTimer <=
                0
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

    /*
       Always render even while paused/menu
       so the background remains visible.
    */

    renderer.render(
        scene,
        camera
    );
}

/* =========================================================
   START / BOOT
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

    /*
       Give renderer keyboard focus.
    */

    renderer.domElement.tabIndex =
        0;

    renderer.domElement.style.outline =
        "none";

    animate();
}

boot();

/* =========================================================
   END
========================================================= */
