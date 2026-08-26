/* =========================================================
   THE LAST ROOM
   COMPLETE GAME.JS
   PC + MOBILE UNIFIED VERSION
========================================================= */

"use strict";

/* =========================================================
   GLOBAL GAME STATE
========================================================= */

const Game = {
    started: false,
    paused: false,
    gameOver: false,

    keys: {},

    player: {
        x: 0,
        y: 1.7,
        z: 8,

        speed: 4.0,
        sprintSpeed: 6.0,

        yaw: 0,
        pitch: 0,

        radius: 0.35
    },

    mouse: {
        sensitivity: 0.0022,
        locked: false
    },

    touch: {
        active: false,
        lastX: 0,
        lastY: 0,
        lookId: null
    },

    flashlight: {
        enabled: true,
        battery: 100
    },

    interaction: {
        distance: 3.0,
        current: null
    },

    time: {
        last: performance.now(),
        delta: 0
    }
};


/* =========================================================
   THREE.JS VARIABLES
========================================================= */

let scene;
let camera;
let renderer;

let clock;

let flashlight;
let ambientLight;

let raycaster;
let interactionRaycaster;

let interactables = [];

let animationFrame;


/* =========================================================
   DOM ELEMENTS
========================================================= */

let crosshair;
let interactionText;
let messageBox;
let mobileControls;
let joystick;
let joystickKnob;
let flashlightButton;
let interactButton;
let sprintButton;

let loadingScreen;
let startButton;


/* =========================================================
   MOBILE MOVEMENT
========================================================= */

const mobileMove = {
    x: 0,
    y: 0,
    active: false,
    identifier: null,

    startX: 0,
    startY: 0,

    maxDistance: 55
};


/* =========================================================
   INITIALIZE DOM
========================================================= */

function getDOMElements() {

    crosshair = document.getElementById("crosshair");

    interactionText =
        document.getElementById("interactionText") ||
        document.getElementById("interaction");

    messageBox =
        document.getElementById("messageBox") ||
        document.getElementById("message");

    mobileControls =
        document.getElementById("mobileControls");

    joystick =
        document.getElementById("joystick");

    joystickKnob =
        document.getElementById("joystickKnob");

    flashlightButton =
        document.getElementById("flashlightButton");

    interactButton =
        document.getElementById("interactButton");

    sprintButton =
        document.getElementById("sprintButton");

    loadingScreen =
        document.getElementById("loadingScreen");

    startButton =
        document.getElementById("startButton");
}


/* =========================================================
   START GAME
========================================================= */

function initGame() {

    getDOMElements();

    createScene();
    createCamera();
    createRenderer();

    createLights();
    createFlashlight();

    createWorld();

    createRaycasters();

    setupPCControls();
    setupMobileControls();

    setupStartButton();

    showCrosshair();

    resizeGame();

    window.addEventListener("resize", resizeGame);

    Game.time.last = performance.now();

    animationFrame = requestAnimationFrame(gameLoop);
}


/* =========================================================
   CREATE SCENE
========================================================= */

function createScene() {

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x020305);

    scene.fog = new THREE.FogExp2(
        0x020305,
        0.035
    );
}


/* =========================================================
   CAMERA
========================================================= */

function createCamera() {

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.05,
        1000
    );

    camera.position.set(
        Game.player.x,
        Game.player.y,
        Game.player.z
    );

    camera.rotation.order = "YXZ";

    updateCameraRotation();
}


/* =========================================================
   RENDERER
========================================================= */

function createRenderer() {

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 2)
    );

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.shadowMap.enabled = true;

    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;

    document.body.appendChild(renderer.domElement);
}


/* =========================================================
   LIGHTS
========================================================= */

function createLights() {

    ambientLight = new THREE.HemisphereLight(
        0x667080,
        0x08090c,
        0.16
    );

    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(
        0x7f8fa8,
        0.12
    );

    moonLight.position.set(
        5,
        10,
        5
    );

    moonLight.castShadow = true;

    scene.add(moonLight);
}


/* =========================================================
   FLASHLIGHT
========================================================= */

function createFlashlight() {

    flashlight = new THREE.SpotLight(
        0xffffff,
        5.0,
        28,
        Math.PI / 7,
        0.55,
        1.2
    );

    flashlight.position.set(
        0,
        0,
        0
    );

    flashlight.castShadow = true;

    flashlight.shadow.mapSize.width = 1024;
    flashlight.shadow.mapSize.height = 1024;

    flashlight.shadow.camera.near = 0.1;
    flashlight.shadow.camera.far = 30;

    camera.add(flashlight);

    scene.add(camera);
}


/* =========================================================
   WORLD
========================================================= */

function createWorld() {

    createFloor();

    createRoom(
        0,
        0,
        0,
        20,
        10,
        20
    );

    createFurniture();

    createInteractables();
}


/* =========================================================
   FLOOR
========================================================= */

function createFloor() {

    const geometry =
        new THREE.PlaneGeometry(
            60,
            60
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x18191c,
            roughness: 0.95,
            metalness: 0
        });

    const floor =
        new THREE.Mesh(
            geometry,
            material
        );

    floor.rotation.x =
        -Math.PI / 2;

    floor.receiveShadow = true;

    scene.add(floor);
}


/* =========================================================
   ROOM
========================================================= */

function createRoom(
    x,
    y,
    z,
    width,
    height,
    depth
) {

    const wallMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x25272b,
            roughness: 0.9
        });

    const thickness = 0.4;

    // Back wall
    addWall(
        x,
        height / 2,
        z - depth / 2,
        width,
        height,
        thickness,
        wallMaterial
    );

    // Front wall
    addWall(
        x,
        height / 2,
        z + depth / 2,
        width,
        height,
        thickness,
        wallMaterial
    );

    // Left wall
    addWall(
        x - width / 2,
        height / 2,
        z,
        thickness,
        height,
        depth,
        wallMaterial
    );

    // Right wall
    addWall(
        x + width / 2,
        height / 2,
        z,
        thickness,
        height,
        depth,
        wallMaterial
    );

    // Ceiling
    const ceilingGeometry =
        new THREE.BoxGeometry(
            width,
            thickness,
            depth
        );

    const ceiling =
        new THREE.Mesh(
            ceilingGeometry,
            wallMaterial
        );

    ceiling.position.set(
        x,
        height,
        z
    );

    ceiling.receiveShadow = true;

    scene.add(ceiling);
}


/* =========================================================
   ADD WALL
========================================================= */

function addWall(
    x,
    y,
    z,
    width,
    height,
    depth,
    material
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
            material
        );

    wall.position.set(
        x,
        y,
        z
    );

    wall.castShadow = true;
    wall.receiveShadow = true;

    scene.add(wall);
}


/* =========================================================
   FURNITURE
========================================================= */

function createFurniture() {

    createTable(
        -3,
        0,
        -2
    );

    createChair(
        -3,
        0,
        0
    );

    createBed(
        4,
        0,
        -3
    );

    createCabinet(
        5,
        0,
        3
    );

    createDesk(
        -4,
        0,
        4
    );
}


/* =========================================================
   TABLE
========================================================= */

function createTable(x, y, z) {

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x33271e,
            roughness: 0.8
        });

    const top =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.8,
                0.2,
                1.3
            ),
            material
        );

    top.position.set(
        x,
        1.25,
        z
    );

    top.castShadow = true;
    top.receiveShadow = true;

    scene.add(top);

    const legGeometry =
        new THREE.BoxGeometry(
            0.15,
            1.25,
            0.15
        );

    const positions = [
        [-1.2, -0.5],
        [1.2, -0.5],
        [-1.2, 0.5],
        [1.2, 0.5]
    ];

    positions.forEach(p => {

        const leg =
            new THREE.Mesh(
                legGeometry,
                material
            );

        leg.position.set(
            x + p[0],
            0.62,
            z + p[1]
        );

        leg.castShadow = true;

        scene.add(leg);
    });
}


/* =========================================================
   CHAIR
========================================================= */

function createChair(x, y, z) {

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x292525,
            roughness: 0.9
        });

    const seat =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.2,
                0.15,
                1.2
            ),
            material
        );

    seat.position.set(
        x,
        0.9,
        z
    );

    scene.add(seat);

    const back =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.2,
                1.5,
                0.15
            ),
            material
        );

    back.position.set(
        x,
        1.55,
        z + 0.53
    );

    scene.add(back);
}


/* =========================================================
   BED
========================================================= */

function createBed(x, y, z) {

    const frameMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x24262a,
            roughness: 0.95
        });

    const mattressMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x6c6c67,
            roughness: 1
        });

    const frame =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                4,
                0.6,
                2.2
            ),
            frameMaterial
        );

    frame.position.set(
        x,
        0.35,
        z
    );

    frame.castShadow = true;

    scene.add(frame);

    const mattress =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                3.8,
                0.35,
                2
            ),
            mattressMaterial
        );

    mattress.position.set(
        x,
        0.82,
        z
    );

    mattress.castShadow = true;

    scene.add(mattress);
}


/* =========================================================
   CABINET
========================================================= */

function createCabinet(x, y, z) {

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x27282b,
            roughness: 0.9
        });

    const cabinet =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.5,
                3,
                0.8
            ),
            material
        );

    cabinet.position.set(
        x,
        1.5,
        z
    );

    cabinet.castShadow = true;

    scene.add(cabinet);
}


/* =========================================================
   DESK
========================================================= */

function createDesk(x, y, z) {

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x30261f,
            roughness: 0.85
        });

    const desk =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.5,
                1.1,
                1
            ),
            material
        );

    desk.position.set(
        x,
        0.55,
        z
    );

    desk.castShadow = true;

    scene.add(desk);
}


/* =========================================================
   INTERACTABLES
========================================================= */

function createInteractables() {

    addInteractable(
        createObject(
            0xffaa22,
            0.25
        ),
        "KEY",
        "You found a strange key."
    );

    const key =
        interactables[interactables.length - 1];

    key.mesh.position.set(
        -3,
        1.48,
        -2
    );


    addInteractable(
        createObject(
            0x777777,
            0.3
        ),
        "DOOR",
        "The door is locked."
    );

    const door =
        interactables[interactables.length - 1];

    door.mesh.position.set(
        0,
        1.5,
        -9.7
    );


    addInteractable(
        createObject(
            0x444444,
            0.35
        ),
        "NOTE",
        "The note says: FIND THE KEY."
    );

    const note =
        interactables[interactables.length - 1];

    note.mesh.position.set(
        -4,
        1.4,
        4
    );
}


/* =========================================================
   CREATE INTERACTABLE OBJECT
========================================================= */

function createObject(
    color,
    size
) {

    const geometry =
        new THREE.BoxGeometry(
            size,
            size,
            size
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.6
        });

    const mesh =
        new THREE.Mesh(
            geometry,
            material
        );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);

    return mesh;
}


/* =========================================================
   REGISTER INTERACTABLE
========================================================= */

function addInteractable(
    mesh,
    type,
    message
) {

    interactables.push({
        mesh: mesh,
        type: type,
        message: message,
        used: false
    });
}


/* =========================================================
   RAYCASTERS
========================================================= */

function createRaycasters() {

    raycaster =
        new THREE.Raycaster();

    interactionRaycaster =
        new THREE.Raycaster();
}


/* =========================================================
   PC CONTROLS
========================================================= */

function setupPCControls() {

    document.addEventListener(
        "keydown",
        handleKeyDown
    );

    document.addEventListener(
        "keyup",
        handleKeyUp
    );

    document.addEventListener(
        "mousemove",
        handleMouseMove
    );

    document.addEventListener(
        "mousedown",
        handleMouseDown
    );

    document.addEventListener(
        "pointerlockchange",
        handlePointerLock
    );

    document.addEventListener(
        "contextmenu",
        e => e.preventDefault()
    );
}


/* =========================================================
   KEY DOWN
========================================================= */

function handleKeyDown(e) {

    Game.keys[e.code] = true;

    if (
        e.code === "KeyF"
    ) {

        toggleFlashlight();
    }

    if (
        e.code === "KeyE"
    ) {

        interact();
    }

    if (
        e.code === "Escape"
    ) {

        Game.paused =
            document.pointerLockElement !== renderer.domElement;
    }
}


/* =========================================================
   KEY UP
========================================================= */

function handleKeyUp(e) {

    Game.keys[e.code] = false;
}


/* =========================================================
   MOUSE DOWN
========================================================= */

function handleMouseDown(e) {

    if (!Game.started) {
        return;
    }

    if (
        e.button === 0 &&
        document.pointerLockElement !== renderer.domElement
    ) {

        renderer.domElement.requestPointerLock();
    }
}


/* =========================================================
   MOUSE MOVE
========================================================= */

function handleMouseMove(e) {

    if (
        document.pointerLockElement !==
        renderer.domElement
    ) {
        return;
    }

    if (!Game.started) {
        return;
    }

    Game.player.yaw -=
        e.movementX *
        Game.mouse.sensitivity;

    Game.player.pitch -=
        e.movementY *
        Game.mouse.sensitivity;

    clampPitch();

    updateCameraRotation();
}


/* =========================================================
   POINTER LOCK
========================================================= */

function handlePointerLock() {

    Game.mouse.locked =
        document.pointerLockElement ===
        renderer.domElement;

    if (
        Game.mouse.locked
    ) {

        Game.paused = false;

        showCrosshair();

    } else {

        Game.paused = true;

        showCrosshair();
    }
}


/* =========================================================
   CAMERA ROTATION
========================================================= */

function updateCameraRotation() {

    camera.rotation.y =
        Game.player.yaw;

    camera.rotation.x =
        Game.player.pitch;
}


/* =========================================================
   CLAMP PITCH
========================================================= */

function clampPitch() {

    const maxPitch =
        Math.PI / 2 - 0.05;

    Game.player.pitch =
        Math.max(
            -maxPitch,
            Math.min(
                maxPitch,
                Game.player.pitch
            )
        );
}


/* =========================================================
   MOBILE CONTROLS
========================================================= */

function setupMobileControls() {

    if (!mobileControls) {
        createMobileControls();
    }

    detectMobileDevice();

    setupJoystick();

    setupMobileLook();

    setupMobileButtons();
}


/* =========================================================
   CREATE MOBILE CONTROLS
========================================================= */

function createMobileControls() {

    mobileControls =
        document.createElement("div");

    mobileControls.id =
        "mobileControls";

    mobileControls.innerHTML = `

        <div id="joystick">
            <div id="joystickKnob"></div>
        </div>

        <div id="mobileButtons">

            <button id="flashlightButton">
                🔦
            </button>

            <button id="interactButton">
                E
            </button>

            <button id="sprintButton">
                RUN
            </button>

        </div>
    `;

    document.body.appendChild(
        mobileControls
    );

    joystick =
        document.getElementById(
            "joystick"
        );

    joystickKnob =
        document.getElementById(
            "joystickKnob"
        );

    flashlightButton =
        document.getElementById(
            "flashlightButton"
        );

    interactButton =
        document.getElementById(
            "interactButton"
        );

    sprintButton =
        document.getElementById(
            "sprintButton"
        );
}


/* =========================================================
   DETECT MOBILE
========================================================= */

function detectMobileDevice() {

    const mobile =
        /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i
        .test(
            navigator.userAgent
        );

    if (
        mobile ||
        window.innerWidth < 900
    ) {

        if (mobileControls) {

            mobileControls.style.display =
                "block";
        }

    } else {

        if (mobileControls) {

            mobileControls.style.display =
                "none";
        }
    }
}


/* =========================================================
   JOYSTICK
========================================================= */

function setupJoystick() {

    if (!joystick) {
        return;
    }

    joystick.addEventListener(
        "touchstart",
        joystickStart,
        { passive: false }
    );

    joystick.addEventListener(
        "touchmove",
        joystickMove,
        { passive: false }
    );

    joystick.addEventListener(
        "touchend",
        joystickEnd,
        { passive: false }
    );

    joystick.addEventListener(
        "touchcancel",
        joystickEnd,
        { passive: false }
    );
}


/* =========================================================
   JOYSTICK START
========================================================= */

function joystickStart(e) {

    e.preventDefault();

    if (!e.changedTouches.length) {
        return;
    }

    const touch =
        e.changedTouches[0];

    mobileMove.active = true;

    mobileMove.identifier =
        touch.identifier;

    const rect =
        joystick.getBoundingClientRect();

    mobileMove.startX =
        rect.left +
        rect.width / 2;

    mobileMove.startY =
        rect.top +
        rect.height / 2;

    updateJoystick(
        touch.clientX,
        touch.clientY
    );
}


/* =========================================================
   JOYSTICK MOVE
========================================================= */

function joystickMove(e) {

    e.preventDefault();

    if (!mobileMove.active) {
        return;
    }

    let touch = null;

    for (
        const t of e.changedTouches
    ) {

        if (
            t.identifier ===
            mobileMove.identifier
        ) {

            touch = t;
            break;
        }
    }

    if (!touch) {
        return;
    }

    updateJoystick(
        touch.clientX,
        touch.clientY
    );
}


/* =========================================================
   UPDATE JOYSTICK
========================================================= */

function updateJoystick(
    clientX,
    clientY
) {

    let dx =
        clientX -
        mobileMove.startX;

    let dy =
        clientY -
        mobileMove.startY;

    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );

    if (
        distance >
        mobileMove.maxDistance
    ) {

        dx =
            dx / distance *
            mobileMove.maxDistance;

        dy =
            dy / distance *
            mobileMove.maxDistance;
    }

    mobileMove.x =
        dx /
        mobileMove.maxDistance;

    mobileMove.y =
        dy /
        mobileMove.maxDistance;

    if (joystickKnob) {

        joystickKnob.style.transform =
            `translate(${dx}px, ${dy}px)`;
    }
}


/* =========================================================
   JOYSTICK END
========================================================= */

function joystickEnd(e) {

    e.preventDefault();

    mobileMove.active = false;

    mobileMove.identifier = null;

    mobileMove.x = 0;
    mobileMove.y = 0;

    if (joystickKnob) {

        joystickKnob.style.transform =
            "translate(0px, 0px)";
    }
}


/* =========================================================
   MOBILE LOOK
========================================================= */

function setupMobileLook() {

    renderer.domElement.addEventListener(
        "touchstart",
        mobileLookStart,
        { passive: false }
    );

    renderer.domElement.addEventListener(
        "touchmove",
        mobileLookMove,
        { passive: false }
    );

    renderer.domElement.addEventListener(
        "touchend",
        mobileLookEnd,
        { passive: false }
    );

    renderer.domElement.addEventListener(
        "touchcancel",
        mobileLookEnd,
        { passive: false }
    );
}


/* =========================================================
   MOBILE LOOK START
========================================================= */

function mobileLookStart(e) {

    if (!Game.started) {
        return;
    }

    for (
        const touch of e.changedTouches
    ) {

        if (
            touch.clientX >
            window.innerWidth * 0.35
        ) {

            Game.touch.lookId =
                touch.identifier;

            Game.touch.lastX =
                touch.clientX;

            Game.touch.lastY =
                touch.clientY;

            Game.touch.active = true;

            break;
        }
    }
}


/* =========================================================
   MOBILE LOOK MOVE
========================================================= */

function mobileLookMove(e) {

    if (
        !Game.touch.active
    ) {
        return;
    }

    let touch = null;

    for (
        const t of e.changedTouches
    ) {

        if (
            t.identifier ===
            Game.touch.lookId
        ) {

            touch = t;
            break;
        }
    }

    if (!touch) {
        return;
    }

    e.preventDefault();

    const dx =
        touch.clientX -
        Game.touch.lastX;

    const dy =
        touch.clientY -
        Game.touch.lastY;

    Game.player.yaw -=
        dx * 0.006;

    Game.player.pitch -=
        dy * 0.006;

    clampPitch();

    updateCameraRotation();

    Game.touch.lastX =
        touch.clientX;

    Game.touch.lastY =
        touch.clientY;
}


/* =========================================================
   MOBILE LOOK END
========================================================= */

function mobileLookEnd(e) {

    for (
        const touch of e.changedTouches
    ) {

        if (
            touch.identifier ===
            Game.touch.lookId
        ) {

            Game.touch.active = false;

            Game.touch.lookId = null;

            break;
        }
    }
}


/* =========================================================
   MOBILE BUTTONS
========================================================= */

function setupMobileButtons() {

    if (flashlightButton) {

        flashlightButton.addEventListener(
            "touchstart",
            e => {

                e.preventDefault();

                toggleFlashlight();

            },
            { passive: false }
        );

        flashlightButton.addEventListener(
            "click",
            e => {

                e.preventDefault();

                toggleFlashlight();

            }
        );
    }


    if (interactButton) {

        interactButton.addEventListener(
            "touchstart",
            e => {

                e.preventDefault();

                interact();

            },
            { passive: false }
        );

        interactButton.addEventListener(
            "click",
            e => {

                e.preventDefault();

                interact();

            }
        );
    }


    if (sprintButton) {

        sprintButton.addEventListener(
            "touchstart",
            e => {

                e.preventDefault();

                Game.keys["ShiftLeft"] =
                    true;

            },
            { passive: false }
        );

        sprintButton.addEventListener(
            "touchend",
            e => {

                e.preventDefault();

                Game.keys["ShiftLeft"] =
                    false;

            },
            { passive: false }
        );
    }
}


/* =========================================================
   START BUTTON
========================================================= */

function setupStartButton() {

    if (!startButton) {
        return;
    }

    startButton.addEventListener(
        "click",
        startGame
    );

    startButton.addEventListener(
        "touchstart",
        e => {

            e.preventDefault();

            startGame();

        },
        { passive: false }
    );
}


/* =========================================================
   START GAME
========================================================= */

function startGame() {

    Game.started = true;

    Game.paused = false;

    if (loadingScreen) {

        loadingScreen.style.display =
            "none";
    }

    if (
        renderer &&
        !isMobile()
    ) {

        renderer.domElement
            .requestPointerLock()
            .catch(() => {});
    }

    showMessage(
        "Find a way out..."
    );

    setTimeout(() => {

        hideMessage();

    }, 3000);
}


/* =========================================================
   MOBILE CHECK
========================================================= */

function isMobile() {

    return (
        /Android|iPhone|iPad|iPod/i
            .test(
                navigator.userAgent
            ) ||
        window.innerWidth < 900
    );
}


/* =========================================================
   MOVEMENT
========================================================= */

function updateMovement(delta) {

    if (
        !Game.started ||
        Game.paused ||
        Game.gameOver
    ) {
        return;
    }

    let forward = 0;
    let right = 0;

    if (
        Game.keys["KeyW"] ||
        Game.keys["ArrowUp"]
    ) {

        forward += 1;
    }

    if (
        Game.keys["KeyS"] ||
        Game.keys["ArrowDown"]
    ) {

        forward -= 1;
    }

    if (
        Game.keys["KeyD"] ||
        Game.keys["ArrowRight"]
    ) {

        right += 1;
    }

    if (
        Game.keys["KeyA"] ||
        Game.keys["ArrowLeft"]
    ) {

        right -= 1;
    }


    // Mobile joystick
    if (
        mobileMove.active
    ) {

        right += mobileMove.x;

        forward -= mobileMove.y;
    }


    const length =
        Math.sqrt(
            forward * forward +
            right * right
        );

    if (
        length > 1
    ) {

        forward /= length;
        right /= length;
    }


    let speed =
        Game.player.speed;

    if (
        Game.keys["ShiftLeft"] ||
        Game.keys["ShiftRight"]
    ) {

        speed =
            Game.player.sprintSpeed;
    }


    const movement =
        speed * delta;


    const sinYaw =
        Math.sin(
            Game.player.yaw
        );

    const cosYaw =
        Math.cos(
            Game.player.yaw
        );


    const moveX =
        (
            right * cosYaw -
            forward * sinYaw
        ) *
        movement;


    const moveZ =
        (
            right * sinYaw +
            forward * cosYaw
        ) *
        movement;


    const nextX =
        Game.player.x +
        moveX;

    const nextZ =
        Game.player.z +
        moveZ;


    if (
        !checkCollision(
            nextX,
            Game.player.z
        )
    ) {

        Game.player.x =
            nextX;
    }


    if (
        !checkCollision(
            Game.player.x,
            nextZ
        )
    ) {

        Game.player.z =
            nextZ;
    }


    camera.position.set(
        Game.player.x,
        Game.player.y,
        Game.player.z
    );
}


/* =========================================================
   COLLISION
========================================================= */

function checkCollision(
    x,
    z
) {

    const limit = 9.2;

    if (
        x < -limit ||
        x > limit ||
        z < -limit ||
        z > limit
    ) {

        return true;
    }


    // Furniture collision boxes

    const obstacles = [

        {
            minX: -4.5,
            maxX: -1.5,
            minZ: -2.8,
            maxZ: -1.2
        },

        {
            minX: 2,
            maxX: 6,
            minZ: -4.2,
            maxZ: -1
        },

        {
            minX: 4.2,
            maxX: 5.8,
            minZ: 2.5,
            maxZ: 3.5
        },

        {
            minX: -5.5,
            maxX: -2.5,
            minZ: 3.3,
            maxZ: 4.8
        }

    ];


    for (
        const obstacle of obstacles
    ) {

        if (
            x >
                obstacle.minX -
                Game.player.radius &&

            x <
                obstacle.maxX +
                Game.player.radius &&

            z >
                obstacle.minZ -
                Game.player.radius &&

            z <
                obstacle.maxZ +
                Game.player.radius
        ) {

            return true;
        }
    }


    return false;
}


/* =========================================================
   INTERACTION CHECK
========================================================= */

function updateInteraction() {

    if (
        !Game.started ||
        Game.paused
    ) {
        hideInteractionText();
        return;
    }


    const direction =
        new THREE.Vector3();

    camera.getWorldDirection(
        direction
    );


    interactionRaycaster.set(
        camera.position,
        direction
    );


    const objects =
        interactables.map(
            item => item.mesh
        );


    const hits =
        interactionRaycaster.intersectObjects(
            objects,
            false
        );


    Game.interaction.current =
        null;


    if (
        hits.length > 0
    ) {

        const hit =
            hits[0];


        const distance =
            hit.distance;


        if (
            distance <=
            Game.interaction.distance
        ) {

            const item =
                interactables.find(
                    i =>
                        i.mesh ===
                        hit.object
                );


            if (item) {

                Game.interaction.current =
                    item;

                showInteractionText(
                    getInteractionPrompt(
                        item
                    )
                );

                return;
            }
        }
    }


    hideInteractionText();
}


/* =========================================================
   INTERACTION PROMPT
========================================================= */

function getInteractionPrompt(item) {

    if (
        isMobile()
    ) {

        return (
            "TAP E — " +
            item.type
        );
    }


    return (
        "[E] " +
        item.type
    );
}


/* =========================================================
   INTERACT
========================================================= */

function interact() {

    if (
        !Game.started ||
        Game.paused
    ) {
        return;
    }


    const item =
        Game.interaction.current;


    if (!item) {

        // Force interaction raycast
        updateInteraction();

        if (
            !Game.interaction.current
        ) {

            return;
        }
    }


    const target =
        Game.interaction.current;


    if (
        target.type ===
        "KEY"
    ) {

        target.used = true;

        target.mesh.visible =
            false;

        showMessage(
            "You picked up the key."
        );

        setTimeout(() => {

            hideMessage();

        }, 2500);

        return;
    }


    if (
        target.type ===
        "NOTE"
    ) {

        showMessage(
            target.message
        );

        setTimeout(() => {

            hideMessage();

        }, 3500);

        return;
    }


    if (
        target.type ===
        "DOOR"
    ) {

        const key =
            interactables.find(
                item =>
                    item.type ===
                    "KEY"
            );


        if (
            key &&
            key.used
        ) {

            showMessage(
                "The key turns... THE DOOR OPENS!"
            );

            setTimeout(
                winGame,
                1500
            );

        } else {

            showMessage(
                "It's locked. I need a key."
            );

            setTimeout(() => {

                hideMessage();

            }, 2500);
        }
    }
}


/* =========================================================
   FLASHLIGHT
========================================================= */

function toggleFlashlight() {

    if (!flashlight) {
        return;
    }

    Game.flashlight.enabled =
        !Game.flashlight.enabled;

    flashlight.visible =
        Game.flashlight.enabled;


    if (
        Game.flashlight.enabled
    ) {

        showMessage(
            "Flashlight ON"
        );

    } else {

        showMessage(
            "Flashlight OFF"
        );
    }


    setTimeout(() => {

        hideMessage();

    }, 1000);
}


/* =========================================================
   FLASHLIGHT BATTERY
========================================================= */

function updateFlashlight(delta) {

    if (
        !Game.started ||
        !Game.flashlight.enabled
    ) {
        return;
    }


    Game.flashlight.battery -=
        delta * 0.5;


    if (
        Game.flashlight.battery <=
        0
    ) {

        Game.flashlight.battery =
            0;

        Game.flashlight.enabled =
            false;

        flashlight.visible =
            false;

        showMessage(
            "The flashlight battery is dead."
        );
    }


    const power =
        Game.flashlight.battery /
        100;


    flashlight.intensity =
        5 *
        power;
}


/* =========================================================
   CROSSHAIR
========================================================= */

function showCrosshair() {

    if (!crosshair) {
        return;
    }

    crosshair.style.display =
        "block";

    crosshair.style.position =
        "fixed";

    crosshair.style.left =
        "50%";

    crosshair.style.top =
        "50%";

    crosshair.style.transform =
        "translate(-50%, -50%)";

    crosshair.style.width =
        "12px";

    crosshair.style.height =
        "12px";

    crosshair.style.zIndex =
        "99999";

    crosshair.style.pointerEvents =
        "none";

    crosshair.style.visibility =
        "visible";

    crosshair.style.opacity =
        "1";
}


/* =========================================================
   INTERACTION TEXT
========================================================= */

function showInteractionText(text) {

    if (!interactionText) {
        return;
    }

    interactionText.textContent =
        text;

    interactionText.style.display =
        "block";

    interactionText.style.visibility =
        "visible";
}


function hideInteractionText() {

    if (!interactionText) {
        return;
    }

    interactionText.style.display =
        "none";
}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(text) {

    if (!messageBox) {
        return;
    }

    messageBox.textContent =
        text;

    messageBox.style.display =
        "block";

    messageBox.style.visibility =
        "visible";
}


function hideMessage() {

    if (!messageBox) {
        return;
    }

    messageBox.style.display =
        "none";
}


/* =========================================================
   WIN GAME
========================================================= */

function winGame() {

    Game.gameOver = true;

    Game.paused = true;

    showMessage(
        "YOU ESCAPED."
    );

    if (
        document.pointerLockElement
    ) {

        document.exitPointerLock();
    }
}


/* =========================================================
   RESIZE
========================================================= */

function resizeGame() {

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

    detectMobileDevice();

    showCrosshair();
}


/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop(now) {

    animationFrame =
        requestAnimationFrame(
            gameLoop
        );


    let delta =
        (now -
            Game.time.last) /
        1000;


    Game.time.last =
        now;


    // Prevent huge delta after tab switch
    delta =
        Math.min(
            delta,
            0.05
        );


    Game.time.delta =
        delta;


    updateMovement(delta);

    updateInteraction();

    updateFlashlight(delta);

    updateAnimations(
        now,
        delta
    );


    renderer.render(
        scene,
        camera
    );
}


/* =========================================================
   ANIMATIONS
========================================================= */

function updateAnimations(
    now,
    delta
) {

    // Small atmospheric movement

    for (
        const item of interactables
    ) {

        if (
            item.type ===
            "KEY" &&
            !item.used &&
            item.mesh.visible
        ) {

            item.mesh.rotation.y +=
                delta * 1.5;

            item.mesh.position.y =
                1.48 +
                Math.sin(
                    now * 0.003
                ) *
                0.04;
        }
    }
}


/* =========================================================
   PREVENT MOBILE PAGE SCROLL
========================================================= */

document.addEventListener(
    "touchmove",
    e => {

        if (
            Game.started
        ) {

            e.preventDefault();
        }

    },
    {
        passive: false
    }
);


/* =========================================================
   INITIALIZE
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initGame
    );

} else {

    initGame();
}
