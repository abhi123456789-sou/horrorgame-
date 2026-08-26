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

/* =========================================================
   THE LAST ROOM
   PART 2 / 3
   GUN SYSTEM
   ========================================================= */


/* =========================================================
   GUN STATE
========================================================= */

game.gun = {

    name: "Pistol",

    ammo: 12,

    magazineSize: 12,

    reserveAmmo: 48,

    damage: 35,

    fireRate: 280,

    lastShot: 0,

    reloading: false,

    reloadTime: 1100,

    recoil: 0.018,

    muzzleFlashTime: 0

};


/* =========================================================
   GUN OBJECTS
========================================================= */

let gunGroup = null;

let gunBody = null;

let gunBarrel = null;

let muzzleFlash = null;


/* =========================================================
   GUN INITIALIZATION
========================================================= */

function createGun() {

    gunGroup =
        new THREE.Group();


    /*
       Main pistol body
    */

    gunBody =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.22,
                0.16,
                0.65
            ),

            new THREE.MeshStandardMaterial({

                color: 0x171717,

                roughness: 0.35,

                metalness: 0.7

            })

        );


    /*
       Gun position
    */

    gunBody.position.set(
        0.32,
        -0.28,
        -0.55
    );


    gunGroup.add(
        gunBody
    );


    /*
       Barrel
    */

    gunBarrel =
        new THREE.Mesh(

            new THREE.CylinderGeometry(
                0.045,
                0.045,
                0.35,
                12
            ),

            new THREE.MeshStandardMaterial({

                color: 0x111111,

                metalness: 0.8,

                roughness: 0.25

            })

        );


    gunBarrel.rotation.x =
        Math.PI / 2;


    gunBarrel.position.set(
        0.32,
        -0.25,
        -0.92
    );


    gunGroup.add(
        gunBarrel
    );


    /*
       Grip
    */

    const grip =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.15,
                0.42,
                0.18
            ),

            new THREE.MeshStandardMaterial({

                color: 0x202020,

                roughness: 0.8

            })

        );


    grip.rotation.x =
        -0.25;


    grip.position.set(
        0.32,
        -0.48,
        -0.42
    );


    gunGroup.add(
        grip
    );


    /*
       Muzzle flash
    */

    muzzleFlash =
        new THREE.PointLight(
            0xffcc66,
            0,
            3
        );


    muzzleFlash.position.set(
        0.32,
        -0.25,
        -1.1
    );


    gunGroup.add(
        muzzleFlash
    );


    camera.add(
        gunGroup
    );


    gunGroup.visible =
        true;
}


/* =========================================================
   AMMO HUD
========================================================= */

function createAmmoHUD() {

    let ammoHUD =
        document.getElementById(
            "ammoHUD"
        );


    if (ammoHUD) {
        return;
    }


    ammoHUD =
        document.createElement(
            "div"
        );


    ammoHUD.id =
        "ammoHUD";


    ammoHUD.innerHTML = `
        <div id="weaponName">
            PISTOL
        </div>

        <div id="ammoCount">
            12 / 48
        </div>
    `;


    ammoHUD.style.position =
        "fixed";


    ammoHUD.style.right =
        "25px";


    ammoHUD.style.bottom =
        "25px";


    ammoHUD.style.zIndex =
        "99999";


    ammoHUD.style.color =
        "#ffffff";


    ammoHUD.style.fontFamily =
        "Arial, sans-serif";


    ammoHUD.style.textAlign =
        "right";


    ammoHUD.style.pointerEvents =
        "none";


    ammoHUD.style.textShadow =
        "0 2px 5px #000";


    const weaponName =
        ammoHUD.querySelector(
            "#weaponName"
        );


    weaponName.style.fontSize =
        "13px";


    weaponName.style.opacity =
        "0.7";


    const ammoCount =
        ammoHUD.querySelector(
            "#ammoCount"
        );


    ammoCount.style.fontSize =
        "25px";


    ammoCount.style.fontWeight =
        "bold";


    document.body.appendChild(
        ammoHUD
    );


    updateAmmoHUD();
}


/* =========================================================
   UPDATE AMMO HUD
========================================================= */

function updateAmmoHUD() {

    const ammoCount =
        document.getElementById(
            "ammoCount"
        );


    if (!ammoCount) {
        return;
    }


    ammoCount.textContent =
        `${game.gun.ammo} / ${game.gun.reserveAmmo}`;


    if (
        game.gun.ammo <= 3
    ) {

        ammoCount.style.opacity =
            "0.7";

    } else {

        ammoCount.style.opacity =
            "1";
    }
}


/* =========================================================
   SHOOT
========================================================= */

function shoot() {

    if (
        !game.started ||
        game.paused ||
        game.finished
    ) {

        return;
    }


    if (
        game.gun.reloading
    ) {

        return;
    }


    const now =
        performance.now();


    if (
        now -
        game.gun.lastShot <
        game.gun.fireRate
    ) {

        return;
    }


    /*
       Empty magazine
    */

    if (
        game.gun.ammo <= 0
    ) {

        showMessage(
            "OUT OF AMMO — PRESS R TO RELOAD"
        );


        setTimeout(
            hideMessage,
            900
        );


        return;
    }


    game.gun.lastShot =
        now;


    game.gun.ammo--;


    updateAmmoHUD();


    /*
       Muzzle flash
    */

    game.gun.muzzleFlashTime =
        70;


    if (muzzleFlash) {

        muzzleFlash.intensity =
            5;
    }


    /*
       Recoil
    */

    game.player.pitch -=
        game.gun.recoil;


    clampCamera();

    updateCameraRotation();


    /*
       Raycast from screen center
    */

    performGunRaycast();
}


/* =========================================================
   GUN RAYCAST
========================================================= */

function performGunRaycast() {

    if (!raycaster) {
        return;
    }


    const direction =
        new THREE.Vector3();


    camera.getWorldDirection(
        direction
    );


    raycaster.set(
        camera.position,
        direction
    );


    raycaster.far =
        60;


    /*
       Shoot against every
       visible scene object.

       Zombie system in Part 3
       will use userData.type
       === "zombie".
    */

    const hits =
        raycaster.intersectObjects(
            scene.children,
            true
        );


    if (
        hits.length === 0
    ) {

        return;
    }


    for (
        const hit of hits
    ) {

        let object =
            hit.object;


        /*
           Ignore player camera/gun
        */

        if (
            object === gunBody ||
            object === gunBarrel ||
            object === gunGroup
        ) {

            continue;
        }


        /*
           Find parent with
           special type
        */

        let target =
            object;


        while (
            target &&
            !target.userData.type &&
            target.parent
        ) {

            target =
                target.parent;
        }


        /*
           Zombie hit
        */

        if (
            target &&
            target.userData &&
            target.userData.type ===
                "zombie"
        ) {

            if (
                typeof damageZombie ===
                "function"
            ) {

                damageZombie(
                    target,
                    game.gun.damage
                );
            }


            createHitEffect(
                hit.point
            );


            return;
        }


        /*
           Stop at normal world object
        */

        if (
            walls.includes(
                object
            )
        ) {

            createHitEffect(
                hit.point
            );

            return;
        }


        /*
           Furniture / door etc.
        */

        if (
            object !== floorObjectSafe()
        ) {

            createHitEffect(
                hit.point
            );

            return;
        }
    }
}


/* =========================================================
   SAFE FLOOR REFERENCE
========================================================= */

function floorObjectSafe() {

    return null;
}


/* =========================================================
   HIT EFFECT
========================================================= */

function createHitEffect(
    position
) {

    const geometry =
        new THREE.SphereGeometry(
            0.045,
            8,
            8
        );


    const materialHit =
        new THREE.MeshBasicMaterial({

            color: 0xffd36a

        });


    const particle =
        new THREE.Mesh(
            geometry,
            materialHit
        );


    particle.position.copy(
        position
    );


    scene.add(
        particle
    );


    setTimeout(
        () => {

            if (
                particle.parent
            ) {

                particle.parent.remove(
                    particle
                );
            }


            geometry.dispose();

            materialHit.dispose();

        },
        180
    );
}


/* =========================================================
   RELOAD
========================================================= */

function reloadGun() {

    if (
        !game.started ||
        game.paused ||
        game.finished
    ) {

        return;
    }


    if (
        game.gun.reloading
    ) {

        return;
    }


    if (
        game.gun.ammo >=
        game.gun.magazineSize
    ) {

        return;
    }


    if (
        game.gun.reserveAmmo <= 0
    ) {

        showMessage(
            "NO RESERVE AMMUNITION"
        );


        setTimeout(
            hideMessage,
            900
        );


        return;
    }


    game.gun.reloading =
        true;


    showMessage(
        "RELOADING..."
    );


    setTimeout(
        () => {

            if (
                game.finished
            ) {

                game.gun.reloading =
                    false;

                return;
            }


            const needed =
                game.gun.magazineSize -
                game.gun.ammo;


            const amount =
                Math.min(
                    needed,
                    game.gun.reserveAmmo
                );


            game.gun.ammo +=
                amount;


            game.gun.reserveAmmo -=
                amount;


            game.gun.reloading =
                false;


            updateAmmoHUD();

            hideMessage();

        },

        game.gun.reloadTime
    );
}


/* =========================================================
   MOBILE FIRE BUTTON
========================================================= */

let mobileFireButton = null;


function createMobileGunButton() {

    if (
        mobileFireButton
    ) {

        return;
    }


    mobileFireButton =
        document.createElement(
            "button"
        );


    mobileFireButton.id =
        "mobileFireButton";


    mobileFireButton.textContent =
        "🔫";


    mobileFireButton.style.position =
        "fixed";


    mobileFireButton.style.right =
        "28px";


    mobileFireButton.style.bottom =
        "105px";


    mobileFireButton.style.width =
        "68px";


    mobileFireButton.style.height =
        "68px";


    mobileFireButton.style.borderRadius =
        "50%";


    mobileFireButton.style.border =
        "2px solid rgba(255,255,255,.5)";


    mobileFireButton.style.background =
        "rgba(30,30,30,.75)";


    mobileFireButton.style.color =
        "#fff";


    mobileFireButton.style.fontSize =
        "30px";


    mobileFireButton.style.zIndex =
        "99999";


    mobileFireButton.style.touchAction =
        "none";


    mobileFireButton.style.userSelect =
        "none";


    mobileFireButton.style.display =
        "none";


    document.body.appendChild(
        mobileFireButton
    );


    mobileFireButton.addEventListener(
        "touchstart",
        e => {

            e.preventDefault();

            shoot();

        },
        {
            passive: false
        }
    );


    mobileFireButton.addEventListener(
        "click",
        e => {

            e.preventDefault();

            shoot();

        }
    );
}


/* =========================================================
   MOBILE RELOAD BUTTON
========================================================= */

let mobileReloadButton = null;


function createMobileReloadButton() {

    if (
        mobileReloadButton
    ) {

        return;
    }


    mobileReloadButton =
        document.createElement(
            "button"
        );


    mobileReloadButton.id =
        "mobileReloadButton";


    mobileReloadButton.textContent =
        "R";


    mobileReloadButton.style.position =
        "fixed";


    mobileReloadButton.style.right =
        "30px";


    mobileReloadButton.style.bottom =
        "25px";


    mobileReloadButton.style.width =
        "50px";


    mobileReloadButton.style.height =
        "50px";


    mobileReloadButton.style.borderRadius =
        "50%";


    mobileReloadButton.style.border =
        "2px solid rgba(255,255,255,.4)";


    mobileReloadButton.style.background =
        "rgba(20,20,20,.75)";


    mobileReloadButton.style.color =
        "#fff";


    mobileReloadButton.style.fontWeight =
        "bold";


    mobileReloadButton.style.zIndex =
        "99999";


    mobileReloadButton.style.touchAction =
        "none";


    mobileReloadButton.style.display =
        "none";


    document.body.appendChild(
        mobileReloadButton
    );


    mobileReloadButton.addEventListener(
        "touchstart",
        e => {

            e.preventDefault();

            reloadGun();

        },
        {
            passive: false
        }
    );


    mobileReloadButton.addEventListener(
        "click",
        e => {

            e.preventDefault();

            reloadGun();

        }
    );
}


/* =========================================================
   GUN INPUT
========================================================= */

function setupGunControls() {

    /*
       PC shooting
    */

    renderer.domElement.addEventListener(
        "mousedown",
        e => {

            if (
                e.button !== 0
            ) {

                return;
            }


            if (
                !game.started ||
                game.paused ||
                game.finished
            ) {

                return;
            }


            /*
               If pointer lock is not active,
               first click locks mouse.
            */

            if (
                document.pointerLockElement !==
                renderer.domElement
            ) {

                renderer.domElement
                    .requestPointerLock()
                    .catch(
                        () => {}
                    );

                return;
            }


            shoot();

        }
    );


    /*
       Keyboard reload
    */

    document.addEventListener(
        "keydown",
        e => {

            if (
                e.code === "KeyR" &&
                !e.repeat
            ) {

                reloadGun();
            }

        }
    );
}


/* =========================================================
   GUN ANIMATION
========================================================= */

function updateGun(
    delta
) {

    if (
        !gunGroup
    ) {

        return;
    }


    /*
       Muzzle flash fade
    */

    if (
        game.gun.muzzleFlashTime > 0
    ) {

        game.gun.muzzleFlashTime -=
            delta * 1000;


        if (
            muzzleFlash
        ) {

            muzzleFlash.intensity =
                Math.max(
                    0,
                    game.gun.muzzleFlashTime /
                    70 *
                    5
                );
        }

    } else {

        if (
            muzzleFlash
        ) {

            muzzleFlash.intensity =
                0;
        }
    }


    /*
       Small idle weapon movement
    */

    const moving =

        game.keys["KeyW"] ||
        game.keys["KeyA"] ||
        game.keys["KeyS"] ||
        game.keys["KeyD"] ||
        game.joystick.x !== 0 ||
        game.joystick.y !== 0;


    const time =
        performance.now();


    if (moving) {

        gunGroup.position.y =
            Math.sin(
                time * 0.012
            ) *
            0.008;

    } else {

        gunGroup.position.y =
            0;
    }
}


/* =========================================================
   MOBILE GUN VISIBILITY
========================================================= */

function updateMobileGunVisibility() {

    if (
        !mobileFireButton ||
        !mobileReloadButton
    ) {

        return;
    }


    if (
        isMobile()
    ) {

        mobileFireButton.style.display =
            "block";


        mobileReloadButton.style.display =
            "block";

    } else {

        mobileFireButton.style.display =
            "none";


        mobileReloadButton.style.display =
            "none";
    }
}


/* =========================================================
   ADD GUN SYSTEM TO INIT
========================================================= */

function initializeGunSystem() {

    createGun();

    createAmmoHUD();

    createMobileGunButton();

    createMobileReloadButton();

    setupGunControls();

    updateMobileGunVisibility();
}


/* =========================================================
   EXTEND RESIZE
========================================================= */

const originalResize =
    resize;


resize =
    function () {

        originalResize();

        updateMobileGunVisibility();
    };


/* =========================================================
   EXTEND ANIMATION
========================================================= */

const originalUpdateAnimations =
    updateAnimations;


updateAnimations =
    function (time) {

        originalUpdateAnimations(time);

        updateGun(
            Math.min(
                (
                    performance.now() -
                    game.clock.last
                ) / 1000,
                0.05
            )
        );
    };


/* =========================================================
   INITIALIZE GUN
========================================================= */

initializeGunSystem();


/* =========================================================
   END PART 2
   ========================================================= */


/* =========================================================
   THE LAST ROOM
   PART 3 / 3
   ZOMBIE + AI + HEALTH + DEATH
   ========================================================= */


/* =========================================================
   PLAYER HEALTH
========================================================= */

game.health = {

    current: 100,

    maximum: 100,

    damageCooldown: 0,

    damageCooldownTime: 700,

    dead: false

};


/* =========================================================
   ZOMBIE SYSTEM
========================================================= */

const zombies = [];

let zombieSpawned = false;


/* =========================================================
   ZOMBIE SETTINGS
========================================================= */

const ZOMBIE_CONFIG = {

    count: 5,

    speed: 1.25,

    chaseSpeed: 1.85,

    attackDistance: 1.35,

    detectionDistance: 18,

    attackDamage: 12,

    attackCooldown: 1100,

    health: 100

};


/* =========================================================
   HEALTH UI
========================================================= */

let healthContainer = null;

let healthBar = null;

let healthText = null;


/* =========================================================
   CREATE HEALTH UI
========================================================= */

function createHealthUI() {

    if (
        document.getElementById(
            "playerHealthUI"
        )
    ) {

        return;
    }


    healthContainer =
        document.createElement(
            "div"
        );


    healthContainer.id =
        "playerHealthUI";


    healthContainer.style.position =
        "fixed";


    healthContainer.style.left =
        "25px";


    healthContainer.style.bottom =
        "25px";


    healthContainer.style.width =
        "220px";


    healthContainer.style.height =
        "28px";


    healthContainer.style.background =
        "rgba(0,0,0,.65)";


    healthContainer.style.border =
        "2px solid rgba(255,255,255,.35)";


    healthContainer.style.borderRadius =
        "5px";


    healthContainer.style.overflow =
        "hidden";


    healthContainer.style.zIndex =
        "99999";


    healthContainer.style.pointerEvents =
        "none";


    /*
       Health bar
    */

    healthBar =
        document.createElement(
            "div"
        );


    healthBar.style.position =
        "absolute";


    healthBar.style.left =
        "0";


    healthBar.style.top =
        "0";


    healthBar.style.bottom =
        "0";


    healthBar.style.width =
        "100%";


    healthBar.style.background =
        "#b40000";


    healthBar.style.transition =
        "width .15s linear";


    healthContainer.appendChild(
        healthBar
    );


    /*
       Text
    */

    healthText =
        document.createElement(
            "div"
        );


    healthText.style.position =
        "absolute";


    healthText.style.inset =
        "0";


    healthText.style.display =
        "flex";


    healthText.style.alignItems =
        "center";


    healthText.style.justifyContent =
        "center";


    healthText.style.color =
        "#ffffff";


    healthText.style.fontFamily =
        "Arial";


    healthText.style.fontWeight =
        "bold";


    healthText.style.fontSize =
        "14px";


    healthText.style.textShadow =
        "0 2px 4px #000";


    healthContainer.appendChild(
        healthText
    );


    document.body.appendChild(
        healthContainer
    );


    updateHealthUI();
}


/* =========================================================
   UPDATE HEALTH UI
========================================================= */

function updateHealthUI() {

    if (
        !healthBar ||
        !healthText
    ) {

        return;
    }


    const percent =
        Math.max(
            0,
            Math.min(
                100,
                game.health.current
            )
        );


    healthBar.style.width =
        percent + "%";


    healthText.textContent =
        `HEALTH ${Math.ceil(percent)}`;
}


/* =========================================================
   CREATE ZOMBIE
========================================================= */

function createZombie(
    x,
    z
) {

    const zombie =
        new THREE.Group();


    zombie.userData.type =
        "zombie";


    zombie.userData.health =
        ZOMBIE_CONFIG.health;


    zombie.userData.maxHealth =
        ZOMBIE_CONFIG.health;


    zombie.userData.dead =
        false;


    zombie.userData.attackTimer =
        0;


    zombie.userData.speed =
        ZOMBIE_CONFIG.speed +
        Math.random() * 0.35;


    zombie.userData.chaseSpeed =
        ZOMBIE_CONFIG.chaseSpeed +
        Math.random() * 0.35;


    zombie.userData.wanderAngle =
        Math.random() *
        Math.PI *
        2;


    zombie.userData.wanderTimer =
        0;


    /*
       BODY
    */

    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.75,
                1.35,
                0.45
            ),

            new THREE.MeshStandardMaterial({

                color: 0x394238,

                roughness: 1

            })

        );


    body.position.y =
        1.25;


    body.castShadow =
        true;


    body.receiveShadow =
        true;


    body.userData.zombiePart =
        true;


    zombie.add(
        body
    );


    /*
       HEAD
    */

    const head =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.38,
                16,
                12
            ),

            new THREE.MeshStandardMaterial({

                color: 0x566052,

                roughness: 1

            })

        );


    head.position.y =
        2.18;


    head.castShadow =
        true;


    head.userData.zombiePart =
        true;


    zombie.add(
        head
    );


    /*
       LEFT ARM
    */

    const leftArm =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.22,
                1.25,
                0.22
            ),

            new THREE.MeshStandardMaterial({

                color: 0x4b5549,

                roughness: 1

            })

        );


    leftArm.position.set(
        -0.58,
        1.28,
        0
    );


    leftArm.rotation.z =
        -0.18;


    leftArm.castShadow =
        true;


    leftArm.userData.zombiePart =
        true;


    zombie.add(
        leftArm
    );


    /*
       RIGHT ARM
    */

    const rightArm =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.22,
                1.25,
                0.22
            ),

            new THREE.MeshStandardMaterial({

                color: 0x4b5549,

                roughness: 1

            })

        );


    rightArm.position.set(
        0.58,
        1.28,
        0
    );


    rightArm.rotation.z =
        0.18;


    rightArm.castShadow =
        true;


    rightArm.userData.zombiePart =
        true;


    zombie.add(
        rightArm
    );


    /*
       LEGS
    */

    const leftLeg =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.25,
                1.25,
                0.28
            ),

            new THREE.MeshStandardMaterial({

                color: 0x202522,

                roughness: 1

            })

        );


    leftLeg.position.set(
        -0.22,
        0.25,
        0
    );


    leftLeg.castShadow =
        true;


    leftLeg.userData.zombiePart =
        true;


    zombie.add(
        leftLeg
    );


    const rightLeg =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.25,
                1.25,
                0.28
            ),

            new THREE.MeshStandardMaterial({

                color: 0x202522,

                roughness: 1

            })

        );


    rightLeg.position.set(
        0.22,
        0.25,
        0
    );


    rightLeg.castShadow =
        true;


    rightLeg.userData.zombiePart =
        true;


    zombie.add(
        rightLeg
    );


    /*
       EYES
    */

    const eyeMaterial =
        new THREE.MeshBasicMaterial({

            color: 0xff2200

        });


    const leftEye =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.055,
                8,
                8
            ),

            eyeMaterial
        );


    leftEye.position.set(
        -0.14,
        2.25,
        -0.34
    );


    zombie.add(
        leftEye
    );


    const rightEye =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.055,
                8,
                8
            ),

            eyeMaterial
        );


    rightEye.position.set(
        0.14,
        2.25,
        -0.34
    );


    zombie.add(
        rightEye
    );


    /*
       ZOMBIE LIGHT
    */

    const eyeLight =
        new THREE.PointLight(
            0xff0000,
            0.4,
            2.5
        );


    eyeLight.position.set(
        0,
        2.2,
        -0.3
    );


    zombie.add(
        eyeLight
    );


    /*
       POSITION
    */

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
   SPAWN ZOMBIES
========================================================= */

function spawnZombies() {

    if (
        zombieSpawned
    ) {

        return;
    }


    zombieSpawned =
        true;


    /*
       Spawn positions
       away from player
    */

    const positions = [

        [-7, -6],

        [7, -6],

        [7, 6],

        [-7, 6],

        [0, -4]

    ];


    for (
        let i = 0;

        i < ZOMBIE_CONFIG.count;

        i++
    ) {

        const pos =
            positions[i];


        createZombie(
            pos[0],
            pos[1]
        );
    }
}


/* =========================================================
   ZOMBIE DISTANCE
========================================================= */

function zombieDistance(
    zombie
) {

    const dx =
        game.player.position.x -
        zombie.position.x;


    const dz =
        game.player.position.z -
        zombie.position.z;


    return Math.sqrt(
        dx * dx +
        dz * dz
    );
}


/* =========================================================
   ZOMBIE MOVEMENT
========================================================= */

function updateZombie(
    zombie,
    delta
) {

    if (
        !zombie ||
        zombie.userData.dead
    ) {

        return;
    }


    const distance =
        zombieDistance(
            zombie
        );


    /*
       Attack timer
    */

    zombie.userData.attackTimer -=
        delta * 1000;


    /*
       Chase player
    */

    if (
        distance <=
        ZOMBIE_CONFIG.detectionDistance
    ) {

        /*
           Direction
        */

        const dx =
            game.player.position.x -
            zombie.position.x;


        const dz =
            game.player.position.z -
            zombie.position.z;


        const length =
            Math.sqrt(
                dx * dx +
                dz * dz
            );


        if (
            length > 0.001
        ) {

            const nx =
                dx / length;


            const nz =
                dz / length;


            /*
               Face player
            */

            zombie.rotation.y =
                Math.atan2(
                    nx,
                    nz
                );


            /*
               Move toward player
            */

            if (
                distance >
                ZOMBIE_CONFIG.attackDistance
            ) {

                const speed =
                    zombie.userData.chaseSpeed;


                const move =
                    speed *
                    delta;


                const newX =
                    zombie.position.x +
                    nx * move;


                const newZ =
                    zombie.position.z +
                    nz * move;


                /*
                   Keep zombie
                   inside room
                */

                if (
                    !isColliding(
                        newX,
                        zombie.position.z
                    )
                ) {

                    zombie.position.x =
                        newX;
                }


                if (
                    !isColliding(
                        zombie.position.x,
                        newZ
                    )
                ) {

                    zombie.position.z =
                        newZ;
                }
            }


            /*
               Attack
            */

            if (
                distance <=
                ZOMBIE_CONFIG.attackDistance
            ) {

                zombieAttack(
                    zombie
                );
            }
        }

    } else {

        /*
           Wander
        */

        updateZombieWander(
            zombie,
            delta
        );
    }


    /*
       Simple walking animation
    */

    animateZombie(
        zombie
    );
}


/* =========================================================
   ZOMBIE WANDER
========================================================= */

function updateZombieWander(
    zombie,
    delta
) {

    zombie.userData.wanderTimer -=
        delta;


    if (
        zombie.userData.wanderTimer <=
        0
    ) {

        zombie.userData.wanderTimer =
            2 +
            Math.random() * 3;


        zombie.userData.wanderAngle =
            Math.random() *
            Math.PI *
            2;
    }


    const angle =
        zombie.userData.wanderAngle;


    const dx =
        Math.sin(angle);


    const dz =
        Math.cos(angle);


    const move =
        zombie.userData.speed *
        delta;


    const newX =
        zombie.position.x +
        dx * move;


    const newZ =
        zombie.position.z +
        dz * move;


    zombie.rotation.y =
        angle;


    if (
        !isColliding(
            newX,
            zombie.position.z
        )
    ) {

        zombie.position.x =
            newX;
    }


    if (
        !isColliding(
            zombie.position.x,
            newZ
        )
    ) {

        zombie.position.z =
            newZ;
    }
}


/* =========================================================
   ZOMBIE ANIMATION
========================================================= */

function animateZombie(
    zombie
) {

    const time =
        performance.now();


    const moving =
        zombie.userData.dead ===
        false;


    if (!moving) {
        return;
    }


    const swing =
        Math.sin(
            time * 0.008 +
            zombie.id
        ) *
        0.12;


    /*
       Arms
    */

    if (
        zombie.children[2]
    ) {

        zombie.children[2]
            .rotation.z =
            -0.18 +
            swing;
    }


    if (
        zombie.children[3]
    ) {

        zombie.children[3]
            .rotation.z =
            0.18 -
            swing;
    }


    /*
       Slight body movement
    */

    zombie.position.y =
        Math.abs(
            Math.sin(
                time * 0.008 +
                zombie.id
            )
        ) *
        0.025;
}


/* =========================================================
   ZOMBIE ATTACK
========================================================= */

function zombieAttack(
    zombie
) {

    if (
        zombie.userData.dead
    ) {

        return;
    }


    if (
        zombie.userData.attackTimer >
        0
    ) {

        return;
    }


    zombie.userData.attackTimer =
        ZOMBIE_CONFIG.attackCooldown;


    damagePlayer(
        ZOMBIE_CONFIG.attackDamage
    );


    /*
       Attack animation
    */

    const original =
        zombie.scale.z;


    zombie.scale.z =
        0.85;


    setTimeout(
        () => {

            if (
                zombie &&
                !zombie.userData.dead
            ) {

                zombie.scale.z =
                    original;
            }

        },
        120
    );
}


/* =========================================================
   DAMAGE PLAYER
========================================================= */

function damagePlayer(
    amount
) {

    if (
        game.health.dead ||
        game.finished
    ) {

        return;
    }


    if (
        game.health.damageCooldown >
        0
    ) {

        return;
    }


    game.health.damageCooldown =
        game.health.damageCooldownTime;


    game.health.current -=
        amount;


    if (
        game.health.current < 0
    ) {

        game.health.current =
            0;
    }


    updateHealthUI();


    createDamageOverlay();


    if (
        game.health.current <= 0
    ) {

        playerDeath();

    } else {

        showMessage(
            `YOU WERE ATTACKED! HEALTH: ${Math.ceil(game.health.current)}`
        );


        setTimeout(
            hideMessage,
            700
        );
    }
}


/* =========================================================
   DAMAGE TIMER
========================================================= */

function updateHealthTimers(
    delta
) {

    if (
        game.health.damageCooldown >
        0
    ) {

        game.health.damageCooldown -=
            delta * 1000;


        if (
            game.health.damageCooldown <
            0
        ) {

            game.health.damageCooldown =
                0;
        }
    }
}


/* =========================================================
   DAMAGE SCREEN
========================================================= */

let damageOverlay = null;


function createDamageOverlay() {

    if (
        !damageOverlay
    ) {

        damageOverlay =
            document.createElement(
                "div"
            );


        damageOverlay.id =
            "damageOverlay";


        damageOverlay.style.position =
            "fixed";


        damageOverlay.style.inset =
            "0";


        damageOverlay.style.background =
            "rgba(180,0,0,.35)";


        damageOverlay.style.pointerEvents =
            "none";


        damageOverlay.style.zIndex =
            "99998";


        damageOverlay.style.opacity =
            "0";


        damageOverlay.style.transition =
            "opacity .08s";


        document.body.appendChild(
            damageOverlay
        );
    }


    damageOverlay.style.opacity =
        "1";


    setTimeout(
        () => {

            if (
                damageOverlay
            ) {

                damageOverlay.style.opacity =
                    "0";
            }

        },
        120
    );
}


/* =========================================================
   ZOMBIE DAMAGE
========================================================= */

function damageZombie(
    zombie,
    amount
) {

    if (
        !zombie ||
        zombie.userData.dead
    ) {

        return;
    }


    zombie.userData.health -=
        amount;


    /*
       Hit reaction
    */

    zombie.scale.x =
        0.9;


    setTimeout(
        () => {

            if (
                zombie &&
                !zombie.userData.dead
            ) {

                zombie.scale.x =
                    1;
            }

        },
        80
    );


    /*
       Blood effect
    */

    createZombieHitEffect(
        zombie.position
    );


    /*
       Dead
    */

    if (
        zombie.userData.health <=
        0
    ) {

        killZombie(
            zombie
        );
    }
}


/* =========================================================
   ZOMBIE HIT EFFECT
========================================================= */

function createZombieHitEffect(
    position
) {

    for (
        let i = 0;

        i < 5;

        i++
    ) {

        const particle =
            new THREE.Mesh(

                new THREE.SphereGeometry(
                    0.025,
                    6,
                    6
                ),

                new THREE.MeshBasicMaterial({

                    color: 0x990000

                })

            );


        particle.position.copy(
            position
        );


        particle.position.y +=
            1.2;


        particle.userData.life =
            300;


        particle.userData.vx =
            (Math.random() - 0.5) *
            2;


        particle.userData.vy =
            Math.random() *
            2;


        particle.userData.vz =
            (Math.random() - 0.5) *
            2;


        scene.add(
            particle
        );


        animateBloodParticle(
            particle
        );
    }
}


/* =========================================================
   BLOOD PARTICLE
========================================================= */

function animateBloodParticle(
    particle
) {

    const start =
        performance.now();


    function animate(
        now
    ) {

        const elapsed =
            now -
            start;


        if (
            elapsed >
            350
        ) {

            if (
                particle.parent
            ) {

                particle.parent.remove(
                    particle
                );
            }


            if (
                particle.geometry
            ) {

                particle.geometry.dispose();
            }


            if (
                particle.material
            ) {

                particle.material.dispose();
            }


            return;
        }


        particle.position.x +=
            particle.userData.vx *
            0.016;


        particle.position.y +=
            particle.userData.vy *
            0.016;


        particle.position.z +=
            particle.userData.vz *
            0.016;


        particle.userData.vy -=
            0.06;


        requestAnimationFrame(
            animate
        );
    }


    requestAnimationFrame(
        animate
    );
}


/* =========================================================
   KILL ZOMBIE
========================================================= */

function killZombie(
    zombie
) {

    if (
        !zombie ||
        zombie.userData.dead
    ) {

        return;
    }


    zombie.userData.dead =
        true;


    zombie.userData.health =
        0;


    /*
       Death animation
    */

    const startRotation =
        zombie.rotation.z;


    const startTime =
        performance.now();


    const duration =
        700;


    function deathAnimation(
        now
    ) {

        const progress =
            Math.min(
                1,
                (
                    now -
                    startTime
                ) /
                duration
            );


        zombie.rotation.z =
            THREE.MathUtils.lerp(
                startRotation,
                -Math.PI / 2,
                progress
            );


        zombie.position.y =
            -progress *
            0.15;


        if (
            progress < 1
        ) {

            requestAnimationFrame(
                deathAnimation
            );

        } else {

            setTimeout(
                () => {

                    removeZombie(
                        zombie
                    );

                },
                1200
            );
        }
    }


    requestAnimationFrame(
        deathAnimation
    );


    showMessage(
        "ZOMBIE DOWN"
    );


    setTimeout(
        hideMessage,
        700
    );
}


/* =========================================================
   REMOVE ZOMBIE
========================================================= */

function removeZombie(
    zombie
) {

    const index =
        zombies.indexOf(
            zombie
        );


    if (
        index !== -1
    ) {

        zombies.splice(
            index,
            1
        );
    }


    if (
        zombie.parent
    ) {

        zombie.parent.remove(
            zombie
        );
    }


    zombie.traverse(
        object => {

            if (
                object.geometry
            ) {

                object.geometry.dispose();
            }


            if (
                object.material
            ) {

                if (
                    Array.isArray(
                        object.material
                    )
                ) {

                    object.material.forEach(
                        m => m.dispose()
                    );

                } else {

                    object.material.dispose();
                }
            }
        }
    );
}


/* =========================================================
   PLAYER DEATH
========================================================= */

function playerDeath() {

    if (
        game.health.dead
    ) {

        return;
    }


    game.health.dead =
        true;


    game.finished =
        true;


    game.paused =
        true;


    hideInteraction();

    hideMessage();


    /*
       Release mouse
    */

    if (
        document.pointerLockElement
    ) {

        document.exitPointerLock();
    }


    /*
       Death screen
    */

    createDeathScreen();
}


/* =========================================================
   DEATH SCREEN
========================================================= */

function createDeathScreen() {

    let deathScreen =
        document.getElementById(
            "deathScreen"
        );


    if (!deathScreen) {

        deathScreen =
            document.createElement(
                "div"
            );


        deathScreen.id =
            "deathScreen";


        deathScreen.style.position =
            "fixed";


        deathScreen.style.inset =
            "0";


        deathScreen.style.background =
            "rgba(0,0,0,.88)";


        deathScreen.style.display =
            "flex";


        deathScreen.style.flexDirection =
            "column";


        deathScreen.style.alignItems =
            "center";


        deathScreen.style.justifyContent =
            "center";


        deathScreen.style.zIndex =
            "100000";


        deathScreen.style.color =
            "#fff";


        deathScreen.style.fontFamily =
            "Arial, sans-serif";


        deathScreen.innerHTML = `

            <div style="
                font-size:54px;
                font-weight:bold;
                letter-spacing:5px;
                margin-bottom:15px;
            ">
                YOU DIED
            </div>

            <div style="
                font-size:17px;
                opacity:.7;
                margin-bottom:30px;
            ">
                The room wasn't empty...
            </div>

            <button id="deathRestartButton"
                style="
                    padding:14px 30px;
                    border:1px solid #777;
                    background:#151515;
                    color:#fff;
                    font-size:16px;
                    cursor:pointer;
                    border-radius:5px;
                ">
                RESTART
            </button>
        `;


        document.body.appendChild(
            deathScreen
        );


        document
            .getElementById(
                "deathRestartButton"
            )
            .addEventListener(
                "click",
                () => {

                    window.location.reload();

                }
            );
    }


    deathScreen.style.display =
        "flex";
}


/* =========================================================
   ZOMBIE SYSTEM UPDATE
========================================================= */

function updateZombieSystem(
    delta
) {

    if (
        !game.started ||
        game.paused ||
        game.finished
    ) {

        return;
    }


    updateHealthTimers(
        delta
    );


    if (
        !zombieSpawned
    ) {

        spawnZombies();
    }


    for (
        const zombie of
        zombies
    ) {

        updateZombie(
            zombie,
            delta
        );
    }
}


/* =========================================================
   START ZOMBIES AFTER GAME START
========================================================= */

const originalStartGame =
    startGame;


startGame =
    function () {

        originalStartGame();


        setTimeout(
            () => {

                if (
                    !game.finished
                ) {

                    spawnZombies();

                }

            },
            800
        );
    };


/* =========================================================
   EXTEND GAME LOOP
========================================================= */

const originalGameLoop =
    gameLoop;


/*
   We cannot safely replace the
   existing requestAnimationFrame
   loop with another loop.

   Therefore zombie updates are
   attached through a separate
   lightweight RAF.
*/

let zombieLoopRunning =
    true;


function zombieGameLoop(
    now
) {

    if (
        !zombieLoopRunning
    ) {

        return;
    }


    requestAnimationFrame(
        zombieGameLoop
    );


    if (
        !game.clock
    ) {

        return;
    }


    const delta =
        Math.min(
            0.05,
            (
                now -
                game.clock.last
            ) / 1000
        );


    updateZombieSystem(
        delta
    );
}


requestAnimationFrame(
    zombieGameLoop
);


/* =========================================================
   CREATE HEALTH UI
========================================================= */

createHealthUI();


/* =========================================================
   INITIAL ZOMBIE SETUP
========================================================= */

setTimeout(
    () => {

        if (
            game.started &&
            !game.finished
        ) {

            spawnZombies();

        }

    },
    1200
);


/* =========================================================
   END PART 3
========================================================= */

/* =========================================================
   PART 4 - ZOMBIE SYSTEM
   ADD-ON
========================================================= */

const zombies = [];

const zombieSystem = {

    maxZombies: 5,

    spawnDistance: 7,

    detectionDistance: 14,

    attackDistance: 1.35,

    attackCooldown: 1200,

    damage: 10,

    zombieSpeed: 1.15,

    health: 100,

    spawnTimer: 0,

    initialized: false

};


/* =========================================================
   ZOMBIE MATERIALS
========================================================= */

const zombieBodyMaterial =
    new THREE.MeshStandardMaterial({

        color: 0x39443d,

        roughness: 1,

        metalness: 0

    });


const zombieHeadMaterial =
    new THREE.MeshStandardMaterial({

        color: 0x59645a,

        roughness: 1,

        metalness: 0

    });


const zombieEyeMaterial =
    new THREE.MeshBasicMaterial({

        color: 0xff2222

    });


/* =========================================================
   CREATE ZOMBIE
========================================================= */

function createZombie(x, z) {

    const zombie =
        new THREE.Group();


    zombie.userData.isZombie =
        true;

    zombie.userData.health =
        zombieSystem.health;

    zombie.userData.dead =
        false;

    zombie.userData.lastAttack =
        0;

    zombie.userData.speed =
        zombieSystem.zombieSpeed +
        Math.random() * 0.35;


    /*
       BODY
    */

    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.75,
                1.35,
                0.45
            ),

            zombieBodyMaterial

        );


    body.position.y =
        1.25;

    body.castShadow =
        true;

    body.receiveShadow =
        true;


    zombie.add(body);


    /*
       HEAD
    */

    const head =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.38,
                16,
                16
            ),

            zombieHeadMaterial

        );


    head.position.y =
        2.15;

    head.castShadow =
        true;


    zombie.add(head);


    /*
       EYES
    */

    const eyeLeft =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.045,
                8,
                8
            ),

            zombieEyeMaterial

        );


    eyeLeft.position.set(
        -0.13,
        2.18,
        -0.34
    );


    zombie.add(
        eyeLeft
    );


    const eyeRight =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.045,
                8,
                8
            ),

            zombieEyeMaterial

        );


    eyeRight.position.set(
        0.13,
        2.18,
        -0.34
    );


    zombie.add(
        eyeRight
    );


    /*
       ARMS
    */

    const armLeft =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.18,
                1.25,
                0.18
            ),

            zombieBodyMaterial

        );


    armLeft.position.set(
        -0.53,
        1.3,
        0
    );

    armLeft.rotation.z =
        -0.15;

    armLeft.castShadow =
        true;


    zombie.add(
        armLeft
    );


    const armRight =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.18,
                1.25,
                0.18
            ),

            zombieBodyMaterial

        );


    armRight.position.set(
        0.53,
        1.3,
        0
    );

    armRight.rotation.z =
        0.15;

    armRight.castShadow =
        true;


    zombie.add(
        armRight
    );


    /*
       LEGS
    */

    const legLeft =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.22,
                1.1,
                0.25
            ),

            zombieBodyMaterial

        );


    legLeft.position.set(
        -0.2,
        0.55,
        0
    );

    legLeft.castShadow =
        true;


    zombie.add(
        legLeft
    );


    const legRight =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.22,
                1.1,
                0.25
            ),

            zombieBodyMaterial

        );


    legRight.position.set(
        0.2,
        0.55,
        0
    );

    legRight.castShadow =
        true;


    zombie.add(
        legRight
    );


    /*
       POSITION
    */

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
   ZOMBIE SPAWN
========================================================= */

function spawnZombieAtSafeLocation() {

    if (
        zombies.length >=
        zombieSystem.maxZombies
    ) {

        return null;
    }


    const possiblePositions = [

        { x: -7, z: -7 },

        { x: 7, z: -7 },

        { x: 7, z: 7 },

        { x: -7, z: 7 },

        { x: 0, z: -7 },

        { x: 6, z: 0 },

        { x: -6, z: 0 },

        { x: 0, z: 6 }

    ];


    /*
       Shuffle locations
    */

    const shuffled =
        possiblePositions
            .sort(
                () =>
                    Math.random() - 0.5
            );


    for (
        const pos of shuffled
    ) {

        const dx =
            pos.x -
            game.player.position.x;


        const dz =
            pos.z -
            game.player.position.z;


        const distance =
            Math.sqrt(
                dx * dx +
                dz * dz
            );


        /*
           Don't spawn
           directly beside player
        */

        if (
            distance <
            zombieSystem.spawnDistance
        ) {

            continue;
        }


        if (
            isColliding(
                pos.x,
                pos.z
            )
        ) {

            continue;
        }


        return createZombie(
            pos.x,
            pos.z
        );
    }


    return null;
}


/* =========================================================
   INITIAL ZOMBIES
========================================================= */

function initializeZombieSystem() {

    if (
        zombieSystem.initialized
    ) {

        return;
    }


    zombieSystem.initialized =
        true;


    /*
       Spawn first zombie
    */

    spawnZombieAtSafeLocation();


    /*
       Spawn second zombie
    */

    setTimeout(
        () => {

            if (
                game.started &&
                !game.finished
            ) {

                spawnZombieAtSafeLocation();

            }

        },
        5000
    );
}


/* =========================================================
   ZOMBIE DISTANCE
========================================================= */

function getZombieDistance(
    zombie
) {

    const dx =
        game.player.position.x -
        zombie.position.x;


    const dz =
        game.player.position.z -
        zombie.position.z;


    return Math.sqrt(
        dx * dx +
        dz * dz
    );
}


/* =========================================================
   ZOMBIE MOVEMENT
========================================================= */

function updateZombie(
    zombie,
    delta,
    time
) {

    if (
        !zombie ||
        zombie.userData.dead
    ) {

        return;
    }


    const distance =
        getZombieDistance(
            zombie
        );


    /*
       Zombie only reacts
       when player is close.
    */

    if (
        distance >
        zombieSystem.detectionDistance
    ) {

        /*
           Small idle movement
        */

        zombie.rotation.y +=
            Math.sin(
                time * 0.001
            ) *
            0.0005;

        return;
    }


    /*
       Direction to player
    */

    const dx =
        game.player.position.x -
        zombie.position.x;


    const dz =
        game.player.position.z -
        zombie.position.z;


    const angle =
        Math.atan2(
            dx,
            dz
        );


    /*
       Face player
    */

    zombie.rotation.y =
        angle;


    /*
       Chase
    */

    if (
        distance >
        zombieSystem.attackDistance
    ) {

        const speed =
            zombie.userData.speed;


        const move =
            speed *
            delta;


        const newX =
            zombie.position.x +
            Math.sin(angle) *
            move;


        const newZ =
            zombie.position.z +
            Math.cos(angle) *
            move;


        /*
           Collision
        */

        if (
            !isColliding(
                newX,
                zombie.position.z
            )
        ) {

            zombie.position.x =
                newX;
        }


        if (
            !isColliding(
                zombie.position.x,
                newZ
            )
        ) {

            zombie.position.z =
                newZ;
        }


        /*
           Walking animation
        */

        const walk =
            Math.sin(
                time * 0.01
            ) *
            0.18;


        zombie.children.forEach(
            child => {

                if (
                    child.geometry &&
                    child.geometry.type ===
                    "BoxGeometry"
                ) {

                    child.rotation.x =
                        walk;
                }

            }
        );

    } else {

        zombieAttack(
            zombie,
            time
        );
    }
}


/* =========================================================
   ZOMBIE ATTACK
========================================================= */

function zombieAttack(
    zombie,
    time
) {

    const lastAttack =
        zombie.userData.lastAttack ||
        0;


    if (
        time -
        lastAttack <
        zombieSystem.attackCooldown
    ) {

        return;
    }


    zombie.userData.lastAttack =
        time;


    /*
       Damage player
    */

    if (
        typeof damagePlayer ===
        "function"
    ) {

        damagePlayer(
            zombieSystem.damage
        );

    } else {

        /*
           Temporary fallback
           until health system
           is added.
        */

        showMessage(
            "THE ZOMBIE ATTACKED YOU!"
        );


        setTimeout(
            hideMessage,
            800
        );
    }
}


/* =========================================================
   ZOMBIE UPDATE
========================================================= */

function updateZombies(
    delta,
    time
) {

    if (
        !game.started ||
        game.paused ||
        game.finished
    ) {

        return;
    }


    initializeZombieSystem();


    for (
        const zombie of zombies
    ) {

        updateZombie(
            zombie,
            delta,
            time
        );
    }
}


/* =========================================================
   DAMAGE ZOMBIE
========================================================= */

function damageZombie(
    zombie,
    damage
) {

    if (
        !zombie ||
        zombie.userData.dead
    ) {

        return;
    }


    zombie.userData.health -=
        damage;


    /*
       Hit feedback
    */

    zombie.scale.set(
        1.08,
        0.92,
        1.08
    );


    setTimeout(
        () => {

            if (
                zombie &&
                !zombie.userData.dead
            ) {

                zombie.scale.set(
                    1,
                    1,
                    1
                );

            }

        },
        100
    );


    /*
       Death
    */

    if (
        zombie.userData.health <= 0
    ) {

        killZombie(
            zombie
        );

    } else {

        showMessage(
            `Zombie HP: ${Math.max(
                0,
                Math.ceil(
                    zombie.userData.health
                )
            )}`
        );


        setTimeout(
            hideMessage,
            500
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
        zombie.userData.dead
    ) {

        return;
    }


    zombie.userData.dead =
        true;


    zombie.userData.health =
        0;


    /*
       Death animation
    */

    const startRotation =
        zombie.rotation.z;


    const startY =
        zombie.position.y;


    const startTime =
        performance.now();


    const duration =
        600;


    function deathAnimation(
        now
    ) {

        const progress =
            Math.min(
                (
                    now -
                    startTime
                ) /
                duration,
                1
            );


        zombie.rotation.z =
            THREE.MathUtils.lerp(
                startRotation,
                -Math.PI / 2,
                progress
            );


        zombie.position.y =
            THREE.MathUtils.lerp(
                startY,
                0.15,
                progress
            );


        if (
            progress < 1
        ) {

            requestAnimationFrame(
                deathAnimation
            );

        } else {

            scene.remove(
                zombie
            );


            const index =
                zombies.indexOf(
                    zombie
                );


            if (
                index !== -1
            ) {

                zombies.splice(
                    index,
                    1
                );

            }

        }
    }


    requestAnimationFrame(
        deathAnimation
    );


    showMessage(
        "ZOMBIE DOWN!"
    );


    setTimeout(
        hideMessage,
        1000
    );
}


/* =========================================================
   ADD ZOMBIES TO GAME LOOP
========================================================= */

const originalGameLoop =
    gameLoop;


gameLoop = function(
    now
) {

    /*
       Existing game loop
       will still execute
       through the original
       function.
    */

    originalGameLoop(
        now
    );


    const delta =
        Math.min(
            (
                now -
                game.clock.last
            ) /
            1000,
            0.05
        );


    /*
       Zombie update
    */

    updateZombies(
        delta,
        now
    );
};


/* =========================================================
   PART 4 READY
========================================================= */

console.log(
    "PART 4 - Zombie System Loaded"
);
