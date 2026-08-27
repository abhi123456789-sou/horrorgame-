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
 
    if (!gameRoot) { 
        throw new Error( 
            "Game root element not found." 
        ); 
    } 
 
    scene = 
        new THREE.Scene(); 
 
    scene.background = 
        new THREE.Color( 
            0x050505 
        ); 
 
    scene.fog = 
        new THREE.Fog( 
            0x050505, 
            8, 
            35 
        ); 
 
    camera = 
        new THREE.PerspectiveCamera( 
            75, 
            window.innerWidth / 
                window.innerHeight, 
            0.1, 
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
 
    renderer.shadowMap.enabled = 
        true; 
 
    renderer.shadowMap.type = 
        THREE.PCFSoftShadowMap; 
 
    renderer.outputColorSpace = 
        THREE.SRGBColorSpace; 
 
    renderer.toneMapping = 
        THREE.ACESFilmicToneMapping; 
 
    renderer.toneMappingExposure = 
        1.0; 
 
    gameRoot.appendChild( 
        renderer.domElement 
    ); 
 
    renderer.domElement.id = 
        "gameCanvas"; 
 
    renderer.domElement.style.touchAction = 
        "none"; 
 
    initLighting(); 
 
    initWorld(); 
 
    initPlayerCamera(); 
 
    initGun(); 
 
    initFlashlight(); 
 
    initInteractables(); 
 
    initHorror(); 
 
    updateMobileVisibility(); 
} 
 
/* ========================================================= 
   LIGHTING 
========================================================= */ 
 
function initLighting() { 
 
    ambientLight = 
        new THREE.AmbientLight( 
            0x303030, 
            0.7 
        ); 
 
    scene.add( 
        ambientLight 
    ); 
 
    const hemi = 
        new THREE.HemisphereLight( 
            0x505050, 
            0x101010, 
            0.45 
        ); 
 
    scene.add( 
        hemi 
    ); 
} 
 
/* ========================================================= 
   MATERIALS 
========================================================= */ 
 
function wallMaterial() { 
 
    return new THREE.MeshStandardMaterial({ 
        color: 0x252525, 
        roughness: 0.88, 
        metalness: 0.05 
    }); 
} 
 
function floorMaterial() { 
 
    return new THREE.MeshStandardMaterial({ 
        color: 0x181818, 
        roughness: 0.95, 
        metalness: 0.02 
    }); 
} 
 
function ceilingMaterial() { 
 
    return new THREE.MeshStandardMaterial({ 
        color: 0x303030, 
        roughness: 0.9, 
        metalness: 0 
    }); 
} 
 
function metalMaterial() { 
 
    return new THREE.MeshStandardMaterial({ 
        color: 0x3b3b3b, 
        roughness: 0.6, 
        metalness: 0.75 
    }); 
} 
 
function woodMaterial() { 
 
    return new THREE.MeshStandardMaterial({ 
        color: 0x4a3020, 
        roughness: 0.85, 
        metalness: 0.05 
    }); 
} 
 
function emissiveMaterial( 
    color, 
    intensity = 1 
) { 
 
    return new THREE.MeshStandardMaterial({ 
        color: color, 
        emissive: color, 
        emissiveIntensity: intensity, 
        roughness: 0.4 
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
    */ 
 
    createBox( 
        ROOM.width, 
        ROOM.wallHeight, 
        0.5, 
        wallMat, 
        0, 
        ROOM.wallHeight / 2, 
        ROOM.depth / 2 
    ); 
} 
 
/* ========================================================= 
   WORLD INITIALIZATION 
========================================================= */ 
 
function initWorld() { 
 
    createFloor(); 
 
    createCeiling(); 
 
    createWalls(); 
 
    createRoomProps(); 
 
    createCeilingLights(); 
 
    createExitArea(); 
} 
 
/* ========================================================= 
   ROOM PROPS 
========================================================= */ 
 
function createRoomProps() { 
 
    const crateMaterial = 
        woodMaterial(); 
 
    const metal = 
        metalMaterial(); 
 
    /* 
       LEFT CRATES 
    */ 
 
    for ( 
        let i = 0; 
        i < 5; 
        i++ 
    ) { 
 
        createBox( 
            1.3, 
            1.2, 
            1.3, 
            crateMaterial, 
            -8 + (i % 2) * 1.5, 
            0.6 + Math.floor(i / 2) * 1.2, 
            -5 + (i % 3) * 1.5 
        ); 
    } 
 
    /* 
       RIGHT METAL CABINET 
    */ 
 
    createBox( 
        2.2, 
        3.0, 
        1.0, 
        metal, 
        8, 
        1.5, 
        -4 
    ); 
 
    /* 
       TABLE 
    */ 
 
    createBox( 
        4.0, 
        0.35, 
        1.8, 
        woodMaterial(), 
        3, 
        1.35, 
        4 
    ); 
 
    /* 
       TABLE LEGS 
    */ 
 
    const legPositions = [ 
        [-1.6, 0.65, -0.6], 
        [1.6, 0.65, -0.6], 
        [-1.6, 0.65, 0.6], 
        [1.6, 0.65, 0.6] 
    ]; 
 
    legPositions.forEach( 
        p => { 
 
            createBox( 
                0.25, 
                1.3, 
                0.25, 
                metal, 
                3 + p[0], 
                p[1], 
                4 + p[2] 
            ); 
        } 
    ); 
 
    /* 
       SMALL SHELVES 
    */ 
 
    for ( 
        let y = 1; 
        y <= 3; 
        y += 1 
    ) { 
 
        createBox( 
            5, 
            0.18, 
            0.8, 
            metal, 
            -2, 
            y, 
            -9 
        ); 
    } 
} 

/* =========================================================
   END OF PART 1
========================================================= */


/* =========================================================
   CEILING LIGHT FIXTURE
========================================================= */

function createCeilingLight(
    x,
    z,
    intensity = 2.2,
    color = 0xfff3dc
) {

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


    /* =====================================================
       BARREL
    ===================================================== */

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


    /* =====================================================
       GRIP
    ===================================================== */

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


    /* =====================================================
       FRONT SIGHT
    ===================================================== */

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


    /* =====================================================
       MUZZLE FLASH
    ===================================================== */

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

    if (
        !state.started ||
        state.paused ||
        state.gameOver
    ) {
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


    batteryFill.style.width =
        `${state.battery}%`;

    batteryText.textContent =
        `${Math.ceil(state.battery)}%`;


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

    flashlight.target.position.set(
        0,
        0,
        -12
    );

    flashlight.target.updateMatrixWorld();
}


/* =========================================================
   END PART 2
========================================================= */

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

    object.name =
        name;

    object.userData.interactable =
        true;

    return object;
}


/* =========================================================
   DOOR
========================================================= */

function createDoor() {

    const doorGroup =
        new THREE.Group();

    doorGroup.name =
        "EXIT_DOOR";

    const frameMaterial =
        metalMaterial();

    const doorMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x211b18,

            roughness: 0.82,

            metalness: 0.25
        });


    const leftFrame =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.3,
                4,
                0.4
            ),
            frameMaterial
        );

    leftFrame.position.set(
        -1.7,
        2,
        0
    );

    doorGroup.add(
        leftFrame
    );


    const rightFrame =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.3,
                4,
                0.4
            ),
            frameMaterial
        );

    rightFrame.position.set(
        1.7,
        2,
        0
    );

    doorGroup.add(
        rightFrame
    );


    const topFrame =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                3.7,
                0.3,
                0.4
            ),
            frameMaterial
        );

    topFrame.position.set(
        0,
        3.85,
        0
    );

    doorGroup.add(
        topFrame
    );


    const door =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                3.2,
                3.5,
                0.25
            ),
            doorMaterial
        );

    door.position.set(
        0,
        1.75,
        0
    );

    door.castShadow =
        true;

    door.receiveShadow =
        true;

    doorGroup.add(
        door
    );


    doorGroup.position.set(
        0,
        0,
        -11.7
    );

    scene.add(
        doorGroup
    );

    doorObject =
        doorGroup;
}


/* =========================================================
   KEY
========================================================= */

function createKey() {

    const keyGroup =
        new THREE.Group();

    keyGroup.name =
        "KEY_OBJECT";

    const goldMaterial =
        new THREE.MeshStandardMaterial({

            color: 0xd8a72e,

            emissive: 0x5a3a05,

            emissiveIntensity: 0.55,

            metalness: 0.85,

            roughness: 0.28
        });


    const shaft =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.08,
                0.08,
                0.65
            ),
            goldMaterial
        );

    shaft.rotation.z =
        Math.PI / 2;

    keyGroup.add(
        shaft
    );


    const ring =
        new THREE.Mesh(
            new THREE.TorusGeometry(
                0.16,
                0.045,
                10,
                20
            ),
            goldMaterial
        );

    ring.rotation.y =
        Math.PI / 2;

    ring.position.x =
        -0.36;

    keyGroup.add(
        ring
    );


    keyGroup.position.set(
        -5.5,
        1.25,
        -5.2
    );

    keyGroup.userData.interactable =
        true;

    keyGroup.userData.type =
        "key";

    scene.add(
        keyGroup
    );

    keyObject =
        keyGroup;
}


/* =========================================================
   GENERATOR
========================================================= */

function createGenerator() {

    const generatorGroup =
        new THREE.Group();

    generatorGroup.name =
        "GENERATOR";

    const bodyMaterial =
        metalMaterial();

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.2,
                1.6,
                1.2
            ),
            bodyMaterial
        );

    body.position.y =
        0.8;

    body.castShadow =
        true;

    body.receiveShadow =
        true;

    generatorGroup.add(
        body
    );


    const redMaterial =
        emissiveMaterial(
            0xff1b1b,
            2
        );

    const indicator =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.18,
                0.18,
                0.08
            ),
            redMaterial
        );

    indicator.position.set(
        0.65,
        1.1,
        -0.65
    );

    generatorGroup.add(
        indicator
    );


    const handle =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.12,
                0.7,
                0.12
            ),
            bodyMaterial
        );

    handle.rotation.z =
        -0.35;

    handle.position.set(
        -0.65,
        1.35,
        -0.65
    );

    generatorGroup.add(
        handle
    );


    generatorGroup.position.set(
        7,
        0,
        5
    );

    generatorGroup.userData.interactable =
        true;

    generatorGroup.userData.type =
        "generator";

    scene.add(
        generatorGroup
    );

    generatorObject =
        generatorGroup;
}


/* =========================================================
   EXIT AREA
========================================================= */

function createExitArea() {

    const exitMaterial =
        emissiveMaterial(
            0x126b3f,
            1.8
        );

    exitObject =
        createInteractableBox(
            2.5,
            2.8,
            0.2,
            exitMaterial,
            0,
            1.4,
            -11.45,
            "EXIT"
        );

    exitObject.userData.type =
        "exit";

    exitObject.visible =
        false;
}


/* =========================================================
   INTERACTABLE INITIALIZATION
========================================================= */

function initInteractables() {

    createDoor();

    createKey();

    createGenerator();
}


/* =========================================================
   HORROR APPARITION
========================================================= */

function createApparition() {

    apparition =
        new THREE.Group();

    apparition.visible =
        false;

    apparition.name =
        "HORROR_APPARITION";


    const bodyMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x080808,

            transparent: true,

            opacity: 0.78,

            roughness: 1,

            metalness: 0
        });


    const body =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.42,
                0.72,
                2.2,
                16
            ),
            bodyMaterial
        );

    body.position.y =
        1.1;

    apparition.add(
        body
    );


    const headMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x161616,

            roughness: 0.9,

            metalness: 0
        });


    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.4,
                20,
                20
            ),
            headMaterial
        );

    head.position.y =
        2.55;

    apparition.add(
        head
    );


    const eyeMaterial =
        emissiveMaterial(
            0xff0000,
            5
        );


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
        -0.14,
        2.6,
        -0.36
    );

    apparition.add(
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
        0.14,
        2.6,
        -0.36
    );

    apparition.add(
        rightEye
    );


    scene.add(
        apparition
    );
}


/* =========================================================
   HORROR INITIALIZATION
========================================================= */

function initHorror() {

    createApparition();
}


/* =========================================================
   SHOW APPARITION
========================================================= */

function showApparition() {

    if (
        !apparition ||
        state.horrorTriggered
    ) {
        return;
    }


    state.horrorTriggered =
        true;

    apparition.position.set(
        player.position.x +
            Math.sin(player.yaw) * 5,
        0,
        player.position.z +
            Math.cos(player.yaw) * 5
    );

    apparition.lookAt(
        player.position.x,
        1.5,
        player.position.z
    );

    apparition.visible =
        true;

    flickerTimer =
        3.5;

    showMessage(
        "DON'T LOOK AWAY",
        "Something is watching you.",
        1800
    );

    sound(
        48,
        0.9,
        0.055,
        "sawtooth"
    );
}


/* =========================================================
   UPDATE APPARITION
========================================================= */

function updateApparition(delta) {

    if (
        !apparition
    ) {
        return;
    }


    if (
        apparition.visible
    ) {

        apparition.lookAt(
            camera.position.x,
            1.4,
            camera.position.z
        );


        apparition.position.y =
            Math.sin(
                state.elapsed * 2.2
            ) * 0.04;


        if (
            flickerTimer > 0
        ) {

            flickerTimer -=
                delta;


            if (
                flickerTimer <= 0
            ) {

                apparition.visible =
                    false;
            }
        }
    }
}


/* =========================================================
   LIGHT FLICKER
========================================================= */

function updateLightFlicker(delta) {

    if (
        flickerTimer <= 0
    ) {
        return;
    }


    for (
        let i = 0;
        i < ceilingLights.length;
        i++
    ) {

        const item =
            ceilingLights[i];


        if (
            Math.random() < 0.22
        ) {

            item.light.intensity =
                Math.random() *
                item.baseIntensity *
                0.45;

        } else {

            item.light.intensity =
                item.baseIntensity;
        }
    }


    if (
        flashlight &&
        state.flashlightOn
    ) {

        if (
            Math.random() < 0.08
        ) {

            flashlight.intensity =
                Math.random() *
                2.5;

        } else {

            flashlight.intensity =
                6.0;
        }
    }
}


/* =========================================================
   PLAYER CAMERA
========================================================= */

function initPlayerCamera() {

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
   CAMERA UPDATE
========================================================= */

function updateCamera() {

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
   PLAYER MOVEMENT
========================================================= */

function updatePlayer(
    delta
) {

    if (
        !state.started ||
        state.paused ||
        state.gameOver
    ) {
        return;
    }


    let moveX = 0;
    let moveZ = 0;


    if (
        keys.KeyW ||
        keys.ArrowUp
    ) {

        moveZ -= 1;
    }


    if (
        keys.KeyS ||
        keys.ArrowDown
    ) {

        moveZ += 1;
    }


    if (
        keys.KeyA ||
        keys.ArrowLeft
    ) {

        moveX -= 1;
    }


    if (
        keys.KeyD ||
        keys.ArrowRight
    ) {

        moveX += 1;
    }


    moveX +=
        joystick.x;

    moveZ +=
        joystick.y;


    const length =
        Math.sqrt(
            moveX * moveX +
            moveZ * moveZ
        );


    if (
        length > 1
    ) {

        moveX /=
            length;

        moveZ /=
            length;
    }


    let speed =
        player.moveSpeed;


    if (
        player.crouching
    ) {

        speed =
            player.crouchSpeed;

    } else if (
        player.sprinting
    ) {

        speed =
            player.sprintSpeed;
    }


    const sinYaw =
        Math.sin(
            player.yaw
        );

    const cosYaw =
        Math.cos(
            player.yaw
        );


    const worldX =
        moveX * cosYaw -
        moveZ * sinYaw;

    const worldZ =
        moveX * sinYaw +
        moveZ * cosYaw;


    player.velocity.x =
        worldX * speed;

    player.velocity.z =
        worldZ * speed;


    player.position.x +=
        player.velocity.x *
        delta;

    player.position.z +=
        player.velocity.z *
        delta;


    const halfWidth =
        ROOM.width / 2 -
        player.radius;

    const halfDepth =
        ROOM.depth / 2 -
        player.radius;


    player.position.x =
        clamp(
            player.position.x,
            -halfWidth,
            halfWidth
        );

    player.position.z =
        clamp(
            player.position.z,
            -halfDepth,
            halfDepth
        );


    if (
        !player.grounded
    ) {

        player.velocity.y -=
            player.gravity *
            delta;

        player.position.y +=
            player.velocity.y *
            delta;


        if (
            player.position.y <=
            (
                player.crouching
                    ? player.crouchHeight
                    : player.standingHeight
            )
        ) {

            player.position.y =
                player.crouching
                    ? player.crouchHeight
                    : player.standingHeight;

            player.velocity.y =
                0;

            player.grounded =
                true;
        }
    }


    updateCamera();
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
        !player.grounded
    ) {
        return;
    }


    player.velocity.y =
        player.jumpForce;

    player.grounded =
        false;

    sound(
        130,
        0.06,
        0.015,
        "triangle"
    );
}


/* =========================================================
   CROUCH
========================================================= */

function setCrouch(
    value
) {

    player.crouching =
        !!value;


    const targetHeight =
        player.crouching
            ? player.crouchHeight
            : player.standingHeight;


    player.position.y =
        targetHeight;

    updateCamera();
}


/* =========================================================
   SPRINT
========================================================= */

function updateSprint() {

    player.sprinting =
        !!(
            keys.ShiftLeft ||
            keys.ShiftRight
        );


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
   ZOMBIE CREATION
========================================================= */

function createZombie(
    x,
    z
) {

    const zombie =
        new THREE.Group();

    zombie.name =
        "ZOMBIE";


    /* =====================================================
       BODY
    ===================================================== */

    const bodyMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x3b2929,

            roughness: 0.92,

            metalness: 0.02
        });


    const body =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                0.38,
                0.85,
                6,
                10
            ),
            bodyMaterial
        );

    body.position.y =
        0.95;

    body.castShadow =
        true;

    body.receiveShadow =
        true;

    zombie.add(
        body
    );


    /* =====================================================
       HEAD
    ===================================================== */

    const headMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x554040,

            roughness: 0.9,

            metalness: 0
        });


    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.32,
                16,
                16
            ),
            headMaterial
        );

    head.position.y =
        1.85;

    head.castShadow =
        true;

    zombie.add(
        head
    );


    /* =====================================================
       EYES
    ===================================================== */

    const eyeMaterial =
        emissiveMaterial(
            0xff1111,
            4
        );


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
        -0.285
    );

    zombie.add(
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
        -0.285
    );

    zombie.add(
        rightEye
    );


    /* =====================================================
       ARMS
    ===================================================== */

    const armGeometry =
        new THREE.CylinderGeometry(
            0.11,
            0.13,
            1.0,
            10
        );


    const leftArm =
        new THREE.Mesh(
            armGeometry,
            bodyMaterial
        );

    leftArm.position.set(
        -0.48,
        0.95,
        0
    );

    leftArm.rotation.z =
        -0.35;

    leftArm.castShadow =
        true;

    zombie.add(
        leftArm
    );


    const rightArm =
        new THREE.Mesh(
            armGeometry,
            bodyMaterial
        );

    rightArm.position.set(
        0.48,
        0.95,
        0
    );

    rightArm.rotation.z =
        0.35;

    rightArm.castShadow =
        true;

    zombie.add(
        rightArm
    );


    /* =====================================================
       ZOMBIE DATA
    ===================================================== */

    zombie.userData.health =
        ZOMBIE_CONFIG.health;

    zombie.userData.maxHealth =
        ZOMBIE_CONFIG.health;

    zombie.userData.active =
        true;

    zombie.userData.attackTimer =
        0;

    zombie.userData.speed =
        ZOMBIE_CONFIG.speed;

    zombie.userData.chasing =
        false;


    zombie.position.set(
        x,
        0,
        z
    );


    scene.add(
        zombie
    );

    zombies.push(
        zombie
    );


    return zombie;
}


/* =========================================================
   ZOMBIE INITIALIZATION
========================================================= */

function initZombies() {

    const spawnPoints = [

        [-8, -2],

        [8, -2],

        [-7, 7],

        [7, 7],

        [0, -7]

    ];


    for (
        let i = 0;
        i < ZOMBIE_CONFIG.count;
        i++
    ) {

        const point =
            spawnPoints[i];

        createZombie(
            point[0],
            point[1]
        );
    }
}


/* =========================================================
   ZOMBIE DAMAGE
========================================================= */

function damageZombie(
    zombie,
    damage
) {

    if (
        !zombie ||
        !zombie.userData.active
    ) {
        return;
    }


    zombie.userData.health -=
        damage;


    /* Small hit reaction */

    zombie.scale.set(
        1.08,
        0.94,
        1.08
    );


    setTimeout(
        function() {

            if (
                zombie &&
                zombie.parent
            ) {

                zombie.scale.set(
                    1,
                    1,
                    1
                );
            }

        },
        90
    );


    sound(
        95,
        0.07,
        0.02,
        "square"
    );


    if (
        zombie.userData.health <=
        0
    ) {

        zombie.userData.health =
            0;

        zombie.userData.active =
            false;

        zombie.visible =
            false;

        sound(
            55,
            0.22,
            0.035,
            "sawtooth"
        );
    }
}


/* =========================================================
   ZOMBIE ATTACK
========================================================= */

function zombieAttack(
    zombie
) {

    if (
        health.damageCooldown > 0
    ) {
        return;
    }


    health.current =
        clamp(
            health.current -
            ZOMBIE_CONFIG.attackDamage,
            0,
            health.maximum
        );


    health.damageCooldown =
        ZOMBIE_CONFIG.damageCooldown ||
        ZOMBIE_CONFIG.attackCooldown;


    sound(
        65,
        0.18,
        0.04,
        "sawtooth"
    );


    updateHealthUI();


    if (
        health.current <= 0
    ) {

        triggerGameOver(
            "YOU DIED",
            "The room has claimed another victim."
        );
    }
}


/* =========================================================
   ZOMBIE MOVEMENT
========================================================= */

function updateZombies(
    delta
) {

    if (
        !state.started ||
        state.paused ||
        state.gameOver
    ) {
        return;
    }


    if (
        health.damageCooldown > 0
    ) {

        health.damageCooldown -=
            delta * 1000;
    }


    for (
        let i = 0;
        i < zombies.length;
        i++
    ) {

        const zombie =
            zombies[i];


        if (
            !zombie ||
            !zombie.userData.active
        ) {
            continue;
        }


        const distance =
            distance2D(
                zombie.position,
                player.position
            );


        /* =================================================
           DETECTION
        ================================================= */

        if (
            distance <=
            ZOMBIE_CONFIG.detectionDistance
        ) {

            zombie.userData.chasing =
                true;
        }


        if (
            !zombie.userData.chasing
        ) {

            zombie.rotation.y +=
                Math.sin(
                    state.elapsed +
                    i
                ) *
                delta *
                0.15;

            continue;
        }


        /* =================================================
           ATTACK
        ================================================= */

        if (
            distance <=
            ZOMBIE_CONFIG.attackDistance
        ) {

            zombie.userData.attackTimer -=
                delta * 1000;


            if (
                zombie.userData.attackTimer <=
                0
            ) {

                zombie.userData.attackTimer =
                    ZOMBIE_CONFIG.attackCooldown;

                zombieAttack(
                    zombie
                );
            }

            continue;
        }


        /* =================================================
           CHASE
        ================================================= */

        const dx =
            player.position.x -
            zombie.position.x;

        const dz =
            player.position.z -
            zombie.position.z;


        const length =
            Math.sqrt(
                dx * dx +
                dz * dz
            );


        if (
            length > 0.001
        ) {

            const speed =
                ZOMBIE_CONFIG.chaseSpeed;


            zombie.position.x +=
                (dx / length) *
                speed *
                delta;


            zombie.position.z +=
                (dz / length) *
                speed *
                delta;


            zombie.rotation.y =
                Math.atan2(
                    dx,
                    dz
                );
        }
    }
}


/* =========================================================
   HEALTH UI
========================================================= */

function updateHealthUI() {

    if (
        !healthFill ||
        !healthText
    ) {
        return;
    }


    const percent =
        (
            health.current /
            health.maximum
        ) *
        100;


    healthFill.style.width =
        `${percent}%`;


    healthText.textContent =
        `${Math.ceil(
            health.current
        )}%`;
}


/* =========================================================
   WEAPON UI
========================================================= */

function updateWeaponUI() {

    const weapon =
        weapons[
            weaponOrder[
                currentWeaponIndex
            ]
        ];


    if (
        !weapon
    ) {
        return;
    }


    weaponName.textContent =
        weapon.name;


    ammoText.textContent =
        `${weapon.magazine} / ${weapon.reserve}`;
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


    if (
        !weapon
    ) {
        return;
    }


    const now =
        performance.now();


    if (
        now -
        lastShotTime <
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
            0.025,
            "square"
        );

        return;
    }


    lastShotTime =
        now;


    weapon.magazine--;


    updateWeaponUI();


    if (
        muzzleFlash
    ) {

        muzzleFlash.intensity =
            3.5;
    }


    sound(
        weapon.name === "SHOTGUN"
            ? 75
            : 130,
        weapon.name === "SHOTGUN"
            ? 0.22
            : 0.1,
        0.055,
        "square"
    );


    /* =====================================================
       RAYCAST
    ===================================================== */

    const raycaster =
        new THREE.Raycaster();


    raycaster.setFromCamera(
        new THREE.Vector2(
            0,
            0
        ),
        camera
    );


    const targets = [];


    for (
        let i = 0;
        i < zombies.length;
        i++
    ) {

        if (
            zombies[i] &&
            zombies[i].userData.active
        ) {

            targets.push(
                zombies[i]
            );
        }
    }


    const intersections =
        raycaster.intersectObjects(
            targets,
            true
        );


    if (
        intersections.length > 0
    ) {

        let hit =
            intersections[0].object;


        while (
            hit &&
            hit.parent &&
            !hit.userData.health
        ) {

            hit =
                hit.parent;
        }


        if (
            hit &&
            hit.userData &&
            typeof hit.userData.health ===
                "number"
        ) {

            damageZombie(
                hit,
                weapon.damage
            );
        }
    }
}


/* =========================================================
   RELOAD
========================================================= */

function reload() {

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


    if (
        !weapon
    ) {
        return;
    }


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


    reloading =
        true;


    showMessage(
        "RELOADING",
        weapon.name,
        weapon.reloadTime
    );


    sound(
        160,
        0.08,
        0.025,
        "triangle"
    );


    setTimeout(
        function() {

            if (
                !weapon
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


            updateWeaponUI();

        },
        weapon.reloadTime
    );
}


/* =========================================================
   SWITCH WEAPON
========================================================= */

function switchWeapon(
    direction = 1
) {

    if (
        !state.started ||
        state.paused ||
        state.gameOver ||
        reloading
    ) {
        return;
    }


    currentWeaponIndex +=
        direction;


    if (
        currentWeaponIndex >=
        weaponOrder.length
    ) {

        currentWeaponIndex =
            0;
    }


    if (
        currentWeaponIndex < 0
    ) {

        currentWeaponIndex =
            weaponOrder.length - 1;
    }


    updateWeaponUI();


    sound(
        240,
        0.07,
        0.02,
        "triangle"
    );
}


/* =========================================================
   END OF PART 4/6
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
   UPDATE INTERACTION PROMPT
========================================================= */

function updateInteraction() {

    if (
        !interactionEl ||
        !interactionMain ||
        !interactionSub
    ) {
        return;
    }

    const object =
        getInteractable();

    state.interactionObject =
        object;


    if (!object) {

        interactionEl.classList.remove(
            "visible"
        );

        return;
    }


    const type =
        object.userData.type ||
        object.name;


    if (
        type === "key" ||
        object === keyObject
    ) {

        interactionMain.textContent =
            "PICK UP KEY";

        interactionSub.textContent =
            "Press E";

    } else if (
        type === "generator" ||
        object === generatorObject
    ) {

        interactionMain.textContent =
            state.generatorActivated
                ? "GENERATOR ACTIVE"
                : "ACTIVATE GENERATOR";

        interactionSub.textContent =
            state.generatorActivated
                ? ""
                : "Press E";

    } else if (
        type === "exit" ||
        object === exitObject
    ) {

        interactionMain.textContent =
            "ESCAPE";

        interactionSub.textContent =
            "Press E";

    } else if (
        object === doorObject
    ) {

        interactionMain.textContent =
            state.doorUnlocked
                ? "OPEN DOOR"
                : "DOOR LOCKED";

        interactionSub.textContent =
            state.doorUnlocked
                ? "Press E"
                : "Find the key";

    } else {

        interactionEl.classList.remove(
            "visible"
        );

        return;
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


    const object =
        state.interactionObject ||
        getInteractable();


    if (!object) {
        return;
    }


    const type =
        object.userData.type ||
        object.name;


    /* =====================================================
       KEY
    ===================================================== */

    if (
        type === "key" ||
        object === keyObject
    ) {

        if (
            !state.keyFound
        ) {

            state.keyFound =
                true;

            keyObject.visible =
                false;

            setObjective(
                "Activate the generator."
            );

            showMessage(
                "KEY FOUND",
                "A cold metal key. Maybe it opens the exit.",
                2200
            );

            sound(
                520,
                0.14,
                0.03,
                "triangle"
            );
        }

        return;
    }


    /* =====================================================
       GENERATOR
    ===================================================== */

    if (
        type === "generator" ||
        object === generatorObject
    ) {

        if (
            !state.generatorActivated
        ) {

            state.generatorActivated =
                true;

            setObjective(
                "The exit door is unlocked."
            );

            showMessage(
                "POWER RESTORED",
                "You hear a heavy lock release somewhere nearby.",
                2600
            );

            sound(
                70,
                0.35,
                0.04,
                "sawtooth"
            );


            if (
                exitObject
            ) {

                exitObject.visible =
                    true;
            }

        }

        return;
    }


    /* =====================================================
       DOOR
    ===================================================== */

    if (
        object === doorObject ||
        type === "EXIT_DOOR"
    ) {

        if (
            !state.keyFound
        ) {

            showMessage(
                "LOCKED",
                "You need a key.",
                1400
            );

            sound(
                90,
                0.1,
                0.025,
                "square"
            );

            return;
        }


        if (
            !state.generatorActivated
        ) {

            showMessage(
                "NO POWER",
                "The door mechanism has no power.",
                1600
            );

            return;
        }


        if (
            !state.doorOpen
        ) {

            state.doorOpen =
                true;

            doorObject.rotation.y =
                -Math.PI / 2;

            setObjective(
                "Reach the exit."
            );

            showMessage(
                "DOOR OPEN",
                "Run. Don't look back.",
                1800
            );

            sound(
                58,
                0.55,
                0.045,
                "sawtooth"
            );
        }

        return;
    }


    /* =====================================================
       EXIT
    ===================================================== */

    if (
        type === "exit" ||
        object === exitObject
    ) {

        if (
            state.doorOpen
        ) {

            triggerVictory();

        } else {

            showMessage(
                "EXIT CLOSED",
                "The exit is still locked.",
                1500
            );
        }

        return;
    }
}


/* =========================================================
   VICTORY
========================================================= */

function triggerVictory() {

    if (
        state.gameOver
    ) {
        return;
    }


    state.gameOver =
        true;

    state.victory =
        true;

    state.paused =
        false;


    releasePointerLock();


    if (
        overTitle
    ) {

        overTitle.textContent =
            "ESCAPED";
    }


    if (
        overHeading
    ) {

        overHeading.textContent =
            "YOU SURVIVED";
    }


    if (
        overText
    ) {

        overText.textContent =
            "You made it out of the room.";
    }


    gameOverOverlay.classList.add(
        "visible"
    );


    sound(
        520,
        0.35,
        0.04,
        "triangle"
    );
}


/* =========================================================
   GAME OVER
========================================================= */

function triggerGameOver(
    title = "YOU DIED",
    text = "You didn't make it out."
) {

    if (
        state.gameOver
    ) {
        return;
    }


    state.gameOver =
        true;

    state.victory =
        false;

    state.paused =
        false;


    releasePointerLock();


    if (
        overTitle
    ) {

        overTitle.textContent =
            title;
    }


    if (
        overHeading
    ) {

        overHeading.textContent =
            "GAME OVER";
    }


    if (
        overText
    ) {

        overText.textContent =
            text;
    }


    gameOverOverlay.classList.add(
        "visible"
    );


    sound(
        45,
        0.6,
        0.05,
        "sawtooth"
    );
}


/* =========================================================
   POINTER LOCK
========================================================= */

function requestPointerLock() {

    if (
        isMobile()
    ) {
        return;
    }


    if (
        !renderer ||
        !renderer.domElement
    ) {
        return;
    }


    try {

        renderer.domElement.requestPointerLock();

    } catch (error) {}
}


function releasePointerLock() {

    try {

        if (
            document.pointerLockElement
        ) {

            document.exitPointerLock();
        }

    } catch (error) {}
}


/* =========================================================
   MOUSE LOOK
========================================================= */

function handleMouseMove(
    event
) {

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


    player.yaw -=
        event.movementX *
        sensitivity;


    player.pitch -=
        event.movementY *
        sensitivity;


    const limit =
        Math.PI / 2 - 0.05;


    player.pitch =
        clamp(
            player.pitch,
            -limit,
            limit
        );


    updateCamera();
}


/* =========================================================
   MOUSE DOWN
========================================================= */

function handleMouseDown(
    event
) {

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


/* =========================================================
   MOUSE UP
========================================================= */

function handleMouseUp(
    event
) {

    if (
        event.button === 0
    ) {

        mouseDown =
            false;
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


    pauseMenu.classList.add(
        "visible"
    );


    releasePointerLock();
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


    pauseMenu.classList.remove(
        "visible"
    );


    requestPointerLock();
}


/* =========================================================
   START GAME
========================================================= */

function startGame() {

    if (
        state.started
    ) {
        return;
    }


    state.started =
        true;

    state.paused =
        false;

    state.gameOver =
        false;

    state.victory =
        false;


    mainMenu.classList.remove(
        "visible"
    );


    pauseMenu.classList.remove(
        "visible"
    );


    gameOverOverlay.classList.remove(
        "visible"
    );


    initAudio();


    if (
        audioContext &&
        audioContext.state ===
            "suspended"
    ) {

        audioContext.resume()
            .catch(
                function() {}
            );
    }


    setObjective(
        "Find a way out."
    );


    showMessage(
        "THE LAST ROOM",
        "Find a way out.",
        2200
    );


    requestPointerLock();
}


/* =========================================================
   RESTART GAME
========================================================= */

function restartGame() {

    window.location.reload();
}


/* =========================================================
   RESET KEYBOARD STATE
========================================================= */

function resetKeyboardState() {

    for (
        const key in keys
    ) {

        if (
            Object.prototype.hasOwnProperty
                .call(keys, key)
        ) {

            delete keys[key];
        }
    }


    player.sprinting =
        false;

    player.crouching =
        false;
}


/* =========================================================
   END OF PART 5/6
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


        /* =================================================
           ENTER
           SINGLE CLEAN HANDLER
        ================================================= */

        if (
            code === "Enter"
        ) {

            /*
               Ignore auto-repeat when Enter
               is held down.
            */

            if (
                event.repeat
            ) {
                return;
            }


            event.preventDefault();


            /*
               START
            */

            if (
                !state.started &&
                !state.gameOver
            ) {

                startGame();

                return;
            }


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
