/* =========================================================
   THE LAST ROOM
   FINAL GAME.JS
   PART 1 / 3
   PC + MOBILE STABLE VERSION
   ========================================================= */

"use strict";

/* =========================================================
   THREE.JS CHECK
========================================================= */

if (typeof THREE === "undefined") {

    document.body.innerHTML = `
        <div style="
            position:fixed;
            inset:0;
            background:#000;
            color:#fff;
            display:flex;
            align-items:center;
            justify-content:center;
            text-align:center;
            font-family:Arial,sans-serif;
            padding:30px;
            z-index:999999;
        ">
            <div>
                <h2>Three.js could not load</h2>
                <p>Please check your internet connection or Three.js file.</p>
            </div>
        </div>
    `;

    throw new Error("THREE.js is not loaded.");
}


/* =========================================================
   DOM REFERENCES
========================================================= */

const gameContainer =
    document.getElementById("gameContainer");

const crosshair =
    document.getElementById("crosshair");

const loadingScreen =
    document.getElementById("loadingScreen");

const startButton =
    document.getElementById("startButton");

const interactionText =
    document.getElementById("interactionText");

const messageBox =
    document.getElementById("messageBox");

const batteryContainer =
    document.getElementById("batteryContainer");

const batteryInner =
    document.getElementById("batteryInner");

const batteryPercent =
    document.getElementById("batteryPercent");

const mobileControls =
    document.getElementById("mobileControls");

const joystick =
    document.getElementById("joystick");

const joystickKnob =
    document.getElementById("joystickKnob");

const flashlightButton =
    document.getElementById("flashlightButton");

const interactButton =
    document.getElementById("interactButton");

const sprintButton =
    document.getElementById("sprintButton");

const winScreen =
    document.getElementById("winScreen");

const restartButton =
    document.getElementById("restartButton");


/* =========================================================
   GAME STATE
========================================================= */

const game = {

    started: false,

    paused: false,

    finished: false,

    doorOpening: false,

    keys: Object.create(null),

    player: {

        position:
            new THREE.Vector3(
                0,
                1.7,
                7
            ),

        yaw: Math.PI,

        pitch: 0,

        walkSpeed: 3.6,

        runSpeed: 6.0,

        radius: 0.35

    },

    flashlight: {

        enabled: true,

        battery: 100,

        drainRate: 0.45

    },

    joystick: {

        active: false,

        identifier: null,

        x: 0,

        y: 0,

        centerX: 0,

        centerY: 0,

        maxDistance: 48

    },

    look: {

        active: false,

        identifier: null,

        lastX: 0,

        lastY: 0,

        sensitivity: 0.0055

    },

    interaction: {

        current: null,

        distance: 3.2

    },

    clock: {

        last: performance.now()

    }

};


/* =========================================================
   THREE OBJECTS
========================================================= */

let scene = null;

let camera = null;

let renderer = null;

let flashlight = null;

let flashlightTarget = null;

let ambientLight = null;

let raycaster = null;

let clock = null;


/* =========================================================
   WORLD ARRAYS
========================================================= */

const walls = [];

const collisionBoxes = [];

const interactables = [];


/* =========================================================
   GAME OBJECTS
========================================================= */

let keyObject = null;

let doorObject = null;

let noteObject = null;

let doorCollisionBox = null;


/* =========================================================
   INITIALIZE
========================================================= */

function init() {

    if (!gameContainer) {

        console.error(
            "gameContainer not found in index.html"
        );

        return;
    }


    createScene();

    createCamera();

    createRenderer();

    createLights();

    createWorld();

    createFlashlight();

    createRaycaster();

    setupPCControls();

    setupMobileControls();

    setupButtons();

    setupResize();

    setupRestart();

    updateMobileVisibility();

    updateBatteryUI();

    forceCrosshairVisible();

    camera.position.copy(
        game.player.position
    );

    updateCameraRotation();

    game.clock.last =
        performance.now();

    requestAnimationFrame(
        gameLoop
    );
}


/* =========================================================
   SCENE
========================================================= */

function createScene() {

    scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(
            0x020304
        );

    scene.fog =
        new THREE.FogExp2(
            0x020304,
            0.035
        );
}


/* =========================================================
   CAMERA
========================================================= */

function createCamera() {

    camera =
        new THREE.PerspectiveCamera(
            75,

            window.innerWidth /
            Math.max(
                window.innerHeight,
                1
            ),

            0.05,

            100
        );

    camera.rotation.order =
        "YXZ";

    scene.add(
        camera
    );
}


/* =========================================================
   RENDERER
========================================================= */

function createRenderer() {

    renderer =
        new THREE.WebGLRenderer({

            antialias: true,

            powerPreference:
                "high-performance",

            alpha: false

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


    if (
        "outputColorSpace" in renderer
    ) {

        renderer.outputColorSpace =
            THREE.SRGBColorSpace;

    } else if (
        "outputEncoding" in renderer
    ) {

        renderer.outputEncoding =
            THREE.sRGBEncoding;
    }


    renderer.domElement.id =
        "gameCanvas";


    renderer.domElement.style.position =
        "absolute";

    renderer.domElement.style.left =
        "0";

    renderer.domElement.style.top =
        "0";

    renderer.domElement.style.width =
        "100%";

    renderer.domElement.style.height =
        "100%";

    renderer.domElement.style.display =
        "block";

    renderer.domElement.style.touchAction =
        "none";

    renderer.domElement.style.userSelect =
        "none";


    gameContainer.appendChild(
        renderer.domElement
    );
}


/* =========================================================
   LIGHTING
========================================================= */

function createLights() {

    ambientLight =
        new THREE.HemisphereLight(
            0x8895a8,
            0x050506,
            0.18
        );

    scene.add(
        ambientLight
    );


    const ceilingLight =
        new THREE.PointLight(
            0xb8c4d4,
            0.35,
            14
        );

    ceilingLight.position.set(
        0,
        7.5,
        0
    );

    scene.add(
        ceilingLight
    );
}


/* =========================================================
   FLASHLIGHT
========================================================= */

function createFlashlight() {

    flashlight =
        new THREE.SpotLight(

            0xffffff,

            5.5,

            28,

            Math.PI / 7,

            0.5,

            1.2

        );


    flashlight.position.set(
        0,
        -0.05,
        0
    );


    flashlight.castShadow =
        true;


    flashlight.shadow.mapSize.width =
        1024;

    flashlight.shadow.mapSize.height =
        1024;


    flashlight.shadow.camera.near =
        0.1;

    flashlight.shadow.camera.far =
        30;


    flashlightTarget =
        new THREE.Object3D();


    flashlightTarget.position.set(
        0,
        0,
        -10
    );


    camera.add(
        flashlightTarget
    );


    flashlight.target =
        flashlightTarget;


    camera.add(
        flashlight
    );


    flashlight.visible =
        true;
}


/* =========================================================
   RAYCASTER
========================================================= */

function createRaycaster() {

    raycaster =
        new THREE.Raycaster();

    raycaster.far =
        game.interaction.distance;
}


/* =========================================================
   WORLD
========================================================= */

function createWorld() {

    createFloor();

    createCeiling();

    createWalls();

    createFurniture();

    createKey();

    createDoor();

    createNote();
}


/* =========================================================
   MATERIAL
========================================================= */

function material(
    color,
    roughness = 0.9
) {

    return new THREE.MeshStandardMaterial({

        color: color,

        roughness: roughness,

        metalness: 0

    });
}


/* =========================================================
   FLOOR
========================================================= */

function createFloor() {

    const floor =
        new THREE.Mesh(

            new THREE.PlaneGeometry(
                60,
                60
            ),

            material(
                0x161719
            )

        );


    floor.rotation.x =
        -Math.PI / 2;


    floor.receiveShadow =
        true;


    scene.add(
        floor
    );
}


/* =========================================================
   CEILING
========================================================= */

function createCeiling() {

    const ceiling =
        new THREE.Mesh(

            new THREE.PlaneGeometry(
                20,
                20
            ),

            material(
                0x111214
            )

        );


    ceiling.rotation.x =
        Math.PI / 2;


    ceiling.position.y =
        9;


    scene.add(
        ceiling
    );
}


/* =========================================================
   WALL CREATOR
========================================================= */

function createWall(
    x,
    y,
    z,
    width,
    height,
    depth
) {

    const wall =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                width,
                height,
                depth
            ),

            material(
                0x292a2d
            )

        );


    wall.position.set(
        x,
        y,
        z
    );


    wall.castShadow =
        true;


    wall.receiveShadow =
        true;


    scene.add(
        wall
    );


    walls.push(
        wall
    );


    return wall;
}


/* =========================================================
   COLLISION BOX
========================================================= */

function addCollisionBox(
    minX,
    maxX,
    minZ,
    maxZ,
    type = "static"
) {

    const box = {

        minX: minX,

        maxX: maxX,

        minZ: minZ,

        maxZ: maxZ,

        type: type,

        active: true

    };


    collisionBoxes.push(
        box
    );


    return box;
}


/* =========================================================
   ROOM WALLS
========================================================= */

function createWalls() {

    /* =========================
       BACK WALL
    ========================= */

    createWall(
        0,
        4.5,
        -10,
        20,
        9,
        0.4
    );


    addCollisionBox(
        -10,
        10,
        -10.3,
        -9.7,
        "wall"
    );


    /* =========================
       FRONT WALL
    ========================= */

    createWall(
        0,
        4.5,
        10,
        20,
        9,
        0.4
    );


    addCollisionBox(
        -10,
        10,
        9.7,
        10.3,
        "wall"
    );


    /* =========================
       LEFT WALL
    ========================= */

    createWall(
        -10,
        4.5,
        0,
        0.4,
        9,
        20
    );


    addCollisionBox(
        -10.3,
        -9.7,
        -10,
        10,
        "wall"
    );


    /* =========================
       RIGHT WALL
    ========================= */

    createWall(
        10,
        4.5,
        0,
        0.4,
        9,
        20
    );


    addCollisionBox(
        9.7,
        10.3,
        -10,
        10,
        "wall"
    );
}


/* =========================================================
   BOX OBJECT
========================================================= */

function createBox(
    x,
    y,
    z,
    sx,
    sy,
    sz,
    color,
    collision = true
) {

    const object =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                sx,
                sy,
                sz
            ),

            material(
                color
            )

        );


    object.position.set(
        x,
        y,
        z
    );


    object.castShadow =
        true;


    object.receiveShadow =
        true;


    scene.add(
        object
    );


    if (collision) {

        addCollisionBox(

            x - sx / 2,

            x + sx / 2,

            z - sz / 2,

            z + sz / 2,

            "furniture"

        );
    }


    return object;
}


/* =========================================================
   FURNITURE
========================================================= */

function createFurniture() {

    /* TABLE */

    createBox(
        -3.5,
        1.15,
        -2.5,
        3,
        0.25,
        1.4,
        0x382a20
    );


    createBox(
        -4.7,
        0.55,
        -2.95,
        0.18,
        1.1,
        0.18,
        0x382a20
    );


    createBox(
        -2.3,
        0.55,
        -2.95,
        0.18,
        1.1,
        0.18,
        0x382a20
    );


    createBox(
        -4.7,
        0.55,
        -2.05,
        0.18,
        1.1,
        0.18,
        0x382a20
    );


    createBox(
        -2.3,
        0.55,
        -2.05,
        0.18,
        1.1,
        0.18,
        0x382a20
    );


    /* BED */

    createBox(
        4,
        0.4,
        -3,
        4,
        0.8,
        2.4,
        0x252629
    );


    createBox(
        4,
        0.85,
        -3,
        3.8,
        0.35,
        2.15,
        0x686764
    );


    /* CABINET */

    createBox(
        6,
        1.7,
        3.5,
        1.7,
        3.4,
        1,
        0x25262a
    );


    /* DESK */

    createBox(
        -5,
        0.7,
        4.5,
        3,
        1.4,
        1.2,
        0x30251e
    );
}


/* =========================================================
   KEY
========================================================= */

function createKey() {

    const group =
        new THREE.Group();


    const goldMaterial =
        new THREE.MeshStandardMaterial({

            color: 0xffc400,

            metalness: 0.8,

            roughness: 0.25

        });


    const ring =
        new THREE.Mesh(

            new THREE.TorusGeometry(
                0.17,
                0.045,
                10,
                24
            ),

            goldMaterial
        );


    ring.rotation.x =
        Math.PI / 2;


    const shaft =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.35,
                0.06,
                0.06
            ),

            goldMaterial
        );


    shaft.position.x =
        0.25;


    group.add(
        ring
    );


    group.add(
        shaft
    );


    group.position.set(
        -3.5,
        1.48,
        -2.5
    );


    group.userData.type =
        "key";


    group.userData.collected =
        false;


    scene.add(
        group
    );


    keyObject =
        group;


    interactables.push(
        group
    );
}


/* =========================================================
   DOOR
========================================================= */

function createDoor() {

    doorObject =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                2.8,
                5.5,
                0.3
            ),

            material(
                0x36373a
            )

        );


    doorObject.position.set(
        0,
        2.75,
        -9.55
    );


    doorObject.castShadow =
        true;


    doorObject.receiveShadow =
        true;


    doorObject.userData.type =
        "door";


    doorObject.userData.opened =
        false;


    scene.add(
        doorObject
    );


    interactables.push(
        doorObject
    );


    /*
       IMPORTANT:
       Save exact door collision object.
       Do NOT search collision array later.
    */

    doorCollisionBox =
        addCollisionBox(

            -1.4,

            1.4,

            -10,

            -9.3,

            "door"

        );
}


/* =========================================================
   NOTE
========================================================= */

function createNote() {

    noteObject =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.7,
                0.03,
                0.5
            ),

            new THREE.MeshStandardMaterial({

                color: 0xd9d2b5,

                roughness: 1

            })

        );


    noteObject.position.set(
        -5,
        1.45,
        4.5
    );


    noteObject.rotation.x =
        -0.05;


    noteObject.userData.type =
        "note";


    scene.add(
        noteObject
    );


    interactables.push(
        noteObject
    );
}


/* =========================================================
   COLLISION CHECK
========================================================= */

function isColliding(
    x,
    z
) {

    const r =
        game.player.radius;


    for (
        const box of collisionBoxes
    ) {

        if (
            !box.active
        ) {

            continue;
        }


        if (

            x + r > box.minX &&

            x - r < box.maxX &&

            z + r > box.minZ &&

            z - r < box.maxZ

        ) {

            return true;
        }
    }


    return false;
}


/* =========================================================
   CAMERA ROTATION
========================================================= */

function updateCameraRotation() {

    if (!camera) {
        return;
    }


    clampCamera();


    camera.rotation.y =
        game.player.yaw;


    camera.rotation.x =
        game.player.pitch;
}


/* =========================================================
   CAMERA CLAMP
========================================================= */

function clampCamera() {

    const limit =
        Math.PI / 2 - 0.05;


    game.player.pitch =
        Math.max(

            -limit,

            Math.min(
                limit,
                game.player.pitch
            )

        );
}


/* =========================================================
   CROSSHAIR
========================================================= */

function forceCrosshairVisible() {

    if (!crosshair) {
        return;
    }


    crosshair.style.display =
        "block";


    crosshair.style.visibility =
        "visible";


    crosshair.style.opacity =
        "1";


    crosshair.style.zIndex =
        "999999";


    crosshair.style.pointerEvents =
        "none";


    crosshair.style.position =
        "fixed";


    crosshair.style.left =
        "50%";


    crosshair.style.top =
        "50%";


    crosshair.style.transform =
        "translate(-50%, -50%)";
}


/* =========================================================
   BATTERY UI
========================================================= */

function updateBatteryUI() {

    const value =
        Math.max(
            0,
            Math.min(
                100,
                game.flashlight.battery
            )
        );


    if (batteryInner) {

        batteryInner.style.width =
            `${value}%`;
    }


    if (batteryPercent) {

        batteryPercent.textContent =
            `${Math.ceil(value)}%`;
    }


    if (batteryContainer) {

        batteryContainer.style.display =
            "block";
    }
}


/* =========================================================
   MOBILE DETECTION
========================================================= */

function isMobile() {

    return (

        /Android|iPhone|iPad|iPod/i.test(
            navigator.userAgent
        )

        ||

        window.innerWidth <= 900

        ||

        navigator.maxTouchPoints > 0

    );
}


/* =========================================================
   MOBILE UI
========================================================= */

function updateMobileVisibility() {

    if (!mobileControls) {
        return;
    }


    if (isMobile()) {

        mobileControls.style.display =
            "block";

    } else {

        mobileControls.style.display =
            "none";
    }
}


/* =========================================================
   RESIZE
========================================================= */

function setupResize() {

    window.addEventListener(
        "resize",
        resize
    );


    window.addEventListener(
        "orientationchange",
        () => {

            setTimeout(
                resize,
                100
            );

        }
    );
}


function resize() {

    if (!camera || !renderer) {
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
        width / height;


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


    updateMobileVisibility();

    forceCrosshairVisible();
}


/* =========================================================
   INITIAL START
========================================================= */

init();
