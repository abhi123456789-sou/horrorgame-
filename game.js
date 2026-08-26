/* =========================================================
   THE LAST ROOM
   FINAL GAME.JS
   PC + MOBILE
   ========================================================= */

"use strict";


/* =========================================================
   BASIC CHECK
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
            font-family:Arial;
            padding:30px;
        ">
            <div>
                <h2>Three.js could not load</h2>
                <p>
                    Internet/CDN connection is unavailable.
                    Please make sure Three.js is loaded.
                </p>
            </div>
        </div>
    `;

    throw new Error("THREE.js is not loaded.");
}


/* =========================================================
   DOM
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
   GAME
========================================================= */

const game = {

    started: false,

    paused: false,

    finished: false,

    keys: {},

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

        x: 0,

        y: 0,

        identifier: null,

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
   THREE VARIABLES
========================================================= */

let scene;

let camera;

let renderer;

let flashlight;

let ambientLight;

let raycaster;

let clock;


/* =========================================================
   OBJECTS
========================================================= */

const walls = [];

const collisionBoxes = [];

const interactables = [];


/* =========================================================
   GAME OBJECT REFERENCES
========================================================= */

let keyObject = null;

let doorObject = null;

let noteObject = null;


/* =========================================================
   INITIALIZE
========================================================= */

function init() {

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

    showCrosshair();

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
                window.innerHeight,
            0.05,
            100
        );

    camera.position.copy(
        game.player.position
    );

    camera.rotation.order =
        "YXZ";

    updateCameraRotation();

    scene.add(camera);
}


/* =========================================================
   RENDERER
========================================================= */

function createRenderer() {

    renderer =
        new THREE.WebGLRenderer({
            antialias: true,
            powerPreference:
                "high-performance"
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

    renderer.domElement.id =
        "gameCanvas";

    renderer.domElement.style.width =
        "100%";

    renderer.domElement.style.height =
        "100%";

    renderer.domElement.style.display =
        "block";

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

    camera.add(
        flashlight
    );


    const target =
        new THREE.Object3D();

    target.position.set(
        0,
        0,
        -10
    );

    camera.add(
        target
    );

    flashlight.target =
        target;
}


/* =========================================================
   RAYCASTER
========================================================= */

function createRaycaster() {

    raycaster =
        new THREE.Raycaster();
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
   MATERIAL HELPERS
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
   WALL
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
}


/* =========================================================
   COLLISION BOX
========================================================= */

function addCollisionBox(
    minX,
    maxX,
    minZ,
    maxZ
) {

    collisionBoxes.push({

        minX,
        maxX,
        minZ,
        maxZ

    });
}


/* =========================================================
   ROOM WALLS
========================================================= */

function createWalls() {

    const h = 9;

    /*
       Room:
       X = -10 to +10
       Z = -10 to +10
    */

    // Back wall
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
        -9.7
    );


    // Front wall
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
        10.3
    );


    // Left
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
        10
    );


    // Right
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
        10
    );
}


/* =========================================================
   BOX FURNITURE
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
            z + sz / 2

        );
    }


    return object;
}


/* =========================================================
   FURNITURE
========================================================= */

function createFurniture() {

    /*
       TABLE
    */

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


    /*
       BED
    */

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


    /*
       CABINET
    */

    createBox(
        6,
        1.7,
        3.5,
        1.7,
        3.4,
        1,
        0x25262a
    );


    /*
       DESK
    */

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


    const ring =
        new THREE.Mesh(

            new THREE.TorusGeometry(
                0.17,
                0.045,
                10,
                24
            ),

            new THREE.MeshStandardMaterial({
                color: 0xffc400,
                metalness: 0.8,
                roughness: 0.25
            })

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

            new THREE.MeshStandardMaterial({
                color: 0xffc400,
                metalness: 0.8,
                roughness: 0.25
            })

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


    scene.add(
        doorObject
    );


    interactables.push(
        doorObject
    );


    /*
       Door collision
    */

    addCollisionBox(
        -1.4,
        1.4,
        -10,
        -9.3
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
   COLLISION
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
   MOVEMENT
========================================================= */

function updateMovement(
    delta
) {

    if (
        !game.started ||
        game.paused ||
        game.finished
    ) {
        return;
    }


    let forward = 0;

    let strafe = 0;


    /*
       Keyboard
    */

    if (
        game.keys["KeyW"] ||
        game.keys["ArrowUp"]
    ) {

        forward += 1;
    }


    if (
        game.keys["KeyS"] ||
        game.keys["ArrowDown"]
    ) {

        forward -= 1;
    }


    if (
        game.keys["KeyD"] ||
        game.keys["ArrowRight"]
    ) {

        strafe += 1;
    }


    if (
        game.keys["KeyA"] ||
        game.keys["ArrowLeft"]
    ) {

        strafe -= 1;
    }


    /*
       Mobile
    */

    strafe +=
        game.joystick.x;

    forward +=
        -game.joystick.y;


    /*
       Normalize
    */

    const length =
        Math.sqrt(
            forward * forward +
            strafe * strafe
        );


    if (
        length > 1
    ) {

        forward /=
            length;

        strafe /=
            length;
    }


    if (
        length < 0.01
    ) {

        return;
    }


    /*
       Speed
    */

    const running =
        game.keys["ShiftLeft"] ||
        game.keys["ShiftRight"];


    const speed =
        running
            ? game.player.runSpeed
            : game.player.walkSpeed;


    const distance =
        speed *
        delta;


    /*
       Camera direction
    */

    const sin =
        Math.sin(
            game.player.yaw
        );

    const cos =
        Math.cos(
            game.player.yaw
        );


    /*
       IMPORTANT:

       W moves forward in
       camera direction.
    */

    const moveX =
        (
            -sin * forward +
            cos * strafe
        ) *
        distance;


    const moveZ =
        (
            -cos * forward -
            sin * strafe
        ) *
        distance;


    const newX =
        game.player.position.x +
        moveX;


    const newZ =
        game.player.position.z +
        moveZ;


    /*
       X collision
    */

    if (
        !isColliding(
            newX,
            game.player.position.z
        )
    ) {

        game.player.position.x =
            newX;
    }


    /*
       Z collision
    */

    if (
        !isColliding(
            game.player.position.x,
            newZ
        )
    ) {

        game.player.position.z =
            newZ;
    }


    camera.position.copy(
        game.player.position
    );
}


/* =========================================================
   CAMERA ROTATION
========================================================= */

function updateCameraRotation() {

    if (!camera) {
        return;
    }


    camera.rotation.y =
        game.player.yaw;


    camera.rotation.x =
        game.player.pitch;
}


/* =========================================================
   CLAMP CAMERA
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
   PC CONTROLS
========================================================= */

function setupPCControls() {

    document.addEventListener(
        "keydown",
        e => {

            game.keys[e.code] =
                true;


            /*
               F = flashlight
            */

            if (
                e.code === "KeyF" &&
                !e.repeat
            ) {

                toggleFlashlight();
            }


            /*
               E = interact
            */

            if (
                e.code === "KeyE" &&
                !e.repeat
            ) {

                interact();
            }


            /*
               ESC
            */

            if (
                e.code === "Escape"
            ) {

                if (
                    document.pointerLockElement
                ) {

                    document.exitPointerLock();

                } else {

                    if (
                        game.started &&
                        !game.finished
                    ) {

                        game.paused =
                            !game.paused;

                    }
                }
            }

        }
    );


    document.addEventListener(
        "keyup",
        e => {

            game.keys[e.code] =
                false;
        }
    );


    /*
       Mouse
    */

    document.addEventListener(
        "mousemove",
        e => {

            if (
                !game.started ||
                game.paused ||
                game.finished
            ) {

                return;
            }


            if (
                document.pointerLockElement !==
                renderer.domElement
            ) {

                return;
            }


            game.player.yaw -=
                e.movementX *
                0.0022;


            game.player.pitch -=
                e.movementY *
                0.0022;


            clampCamera();

            updateCameraRotation();
        }
    );


    /*
       Click canvas
       -> pointer lock
    */

    renderer.domElement.addEventListener(
        "click",
        () => {

            if (
                !game.started ||
                game.finished
            ) {

                return;
            }


            if (
                document.pointerLockElement !==
                renderer.domElement
            ) {

                renderer.domElement
                    .requestPointerLock()
                    .catch(
                        () => {}
                    );
            }
        }
    );


    /*
       Pointer lock
    */

    document.addEventListener(
        "pointerlockchange",
        () => {

            if (
                document.pointerLockElement ===
                renderer.domElement
            ) {

                game.paused =
                    false;

            } else {

                if (
                    game.started &&
                    !game.finished &&
                    !isMobile()
                ) {

                    game.paused =
                        true;
                }
            }
        }
    );
}


/* =========================================================
   MOBILE SETUP
========================================================= */

function setupMobileControls() {

    if (!joystick) {
        return;
    }


    /*
       JOYSTICK START
    */

    joystick.addEventListener(
        "touchstart",
        e => {

            e.preventDefault();


            if (!e.changedTouches.length) {
                return;
            }


            const touch =
                e.changedTouches[0];


            game.joystick.active =
                true;


            game.joystick.identifier =
                touch.identifier;


            const rect =
                joystick.getBoundingClientRect();


            game.joystick.centerX =
                rect.left +
                rect.width / 2;


            game.joystick.centerY =
                rect.top +
                rect.height / 2;


            updateJoystick(
                touch.clientX,
                touch.clientY
            );
        },
        {
            passive: false
        }
    );


    /*
       JOYSTICK MOVE
    */

    joystick.addEventListener(
        "touchmove",
        e => {

            e.preventDefault();


            if (
                !game.joystick.active
            ) {

                return;
            }


            let touch = null;


            for (
                const t of e.changedTouches
            ) {

                if (
                    t.identifier ===
                    game.joystick.identifier
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
        },
        {
            passive: false
        }
    );


    /*
       JOYSTICK END
    */

    joystick.addEventListener(
        "touchend",
        resetJoystick,
        {
            passive: false
        }
    );


    joystick.addEventListener(
        "touchcancel",
        resetJoystick,
        {
            passive: false
        }
    );


    /*
       MOBILE LOOK
    */

    renderer.domElement.addEventListener(
        "touchstart",
        e => {

            if (
                !game.started ||
                game.finished
            ) {

                return;
            }


            for (
                const touch of
                e.changedTouches
            ) {

                /*
                   Right side = camera look
                */

                if (
                    touch.clientX >
                    window.innerWidth *
                    0.38
                ) {

                    game.look.active =
                        true;

                    game.look.identifier =
                        touch.identifier;

                    game.look.lastX =
                        touch.clientX;

                    game.look.lastY =
                        touch.clientY;

                    break;
                }
            }
        },
        {
            passive: true
        }
    );


    renderer.domElement.addEventListener(
        "touchmove",
        e => {

            if (
                !game.look.active
            ) {

                return;
            }


            let touch = null;


            for (
                const t of e.changedTouches
            ) {

                if (
                    t.identifier ===
                    game.look.identifier
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
                game.look.lastX;


            const dy =
                touch.clientY -
                game.look.lastY;


            game.player.yaw -=
                dx *
                game.look.sensitivity;


            game.player.pitch -=
                dy *
                game.look.sensitivity;


            clampCamera();

            updateCameraRotation();


            game.look.lastX =
                touch.clientX;


            game.look.lastY =
                touch.clientY;
        },
        {
            passive: false
        }
    );


    renderer.domElement.addEventListener(
        "touchend",
        e => {

            for (
                const touch of
                e.changedTouches
            ) {

                if (
                    touch.identifier ===
                    game.look.identifier
                ) {

                    game.look.active =
                        false;

                    game.look.identifier =
                        null;

                    break;
                }
            }
        },
        {
            passive: true
        }
    );
}


/* =========================================================
   JOYSTICK UPDATE
========================================================= */

function updateJoystick(
    x,
    y
) {

    let dx =
        x -
        game.joystick.centerX;


    let dy =
        y -
        game.joystick.centerY;


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    const max =
        game.joystick.maxDistance;


    if (
        distance > max
    ) {

        dx =
            dx / distance *
            max;

        dy =
            dy / distance *
            max;
    }


    game.joystick.x =
        dx / max;


    game.joystick.y =
        dy / max;


    if (joystickKnob) {

        joystickKnob.style.transform =
            `translate(
                calc(-50% + ${dx}px),
                calc(-50% + ${dy}px)
            )`;
    }
}


/* =========================================================
   RESET JOYSTICK
========================================================= */

function resetJoystick(e) {

    if (
        e &&
        e.preventDefault
    ) {

        e.preventDefault();
    }


    game.joystick.active =
        false;


    game.joystick.identifier =
        null;


    game.joystick.x =
        0;

    game.joystick.y =
        0;


    if (joystickKnob) {

        joystickKnob.style.transform =
            "translate(-50%, -50%)";
    }
}


/* =========================================================
   BUTTONS
========================================================= */

function setupButtons() {

    /*
       START
    */

    if (startButton) {

        startButton.addEventListener(
            "click",
            startGame
        );
    }


    /*
       Flashlight
    */

    if (flashlightButton) {

        flashlightButton.addEventListener(
            "touchstart",
            e => {

                e.preventDefault();

                toggleFlashlight();

            },
            {
                passive: false
            }
        );


        flashlightButton.addEventListener(
            "click",
            e => {

                e.preventDefault();

                toggleFlashlight();
            }
        );
    }


    /*
       Interact
    */

    if (interactButton) {

        interactButton.addEventListener(
            "touchstart",
            e => {

                e.preventDefault();

                interact();

            },
            {
                passive: false
            }
        );


        interactButton.addEventListener(
            "click",
            e => {

                e.preventDefault();

                interact();
            }
        );
    }


    /*
       Sprint
    */

    if (sprintButton) {

        sprintButton.addEventListener(
            "touchstart",
            e => {

                e.preventDefault();

                game.keys["ShiftLeft"] =
                    true;

            },
            {
                passive: false
            }
        );


        sprintButton.addEventListener(
            "touchend",
            e => {

                e.preventDefault();

                game.keys["ShiftLeft"] =
                    false;

            },
            {
                passive: false
            }
        );


        sprintButton.addEventListener(
            "touchcancel",
            e => {

                game.keys["ShiftLeft"] =
                    false;

            }
        );
    }
}


/* =========================================================
   START GAME
========================================================= */

function startGame() {

    if (game.started) {
        return;
    }


    game.started =
        true;

    game.paused =
        false;

    game.finished =
        false;


    if (loadingScreen) {

        loadingScreen.style.display =
            "none";
    }


    showMessage(
        "Find the key and escape..."
    );


    setTimeout(
        hideMessage,
        2500
    );


    /*
       Desktop pointer lock
    */

    if (
        !isMobile() &&
        renderer &&
        renderer.domElement
    ) {

        renderer.domElement
            .requestPointerLock()
            .catch(
                () => {}
            );
    }
}


/* =========================================================
   INTERACTION
========================================================= */

function updateInteraction() {

    if (
        !game.started ||
        game.paused ||
        game.finished
    ) {

        hideInteraction();

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


    const visibleObjects =
        interactables.filter(
            object =>
                object.visible
        );


    const hits =
        raycaster.intersectObjects(
            visibleObjects,
            true
        );


    game.interaction.current =
        null;


    if (
        hits.length === 0
    ) {

        hideInteraction();

        return;
    }


    const hit =
        hits[0];


    if (
        hit.distance >
        game.interaction.distance
    ) {

        hideInteraction();

        return;
    }


    let object =
        hit.object;


    /*
       Find parent interactable
    */

    while (
        object &&
        !interactables.includes(object)
    ) {

        object =
            object.parent;
    }


    if (
        !object
    ) {

        hideInteraction();

        return;
    }


    game.interaction.current =
        object;


    const type =
        object.userData.type;


    if (
        type === "key"
    ) {

        showInteraction(
            "E — PICK UP KEY"
        );
    }


    else if (
        type === "door"
    ) {

        showInteraction(
            "E — OPEN DOOR"
        );
    }


    else if (
        type === "note"
    ) {

        showInteraction(
            "E — READ NOTE"
        );
    }
}


/* =========================================================
   INTERACT
========================================================= */

function interact() {

    if (
        !game.started ||
        game.paused ||
        game.finished
    ) {

        return;
    }


    /*
       Refresh target
    */

    updateInteraction();


    const target =
        game.interaction.current;


    if (!target) {

        return;
    }


    const type =
        target.userData.type;


    /*
       KEY
    */

    if (
        type === "key"
    ) {

        keyObject.visible =
            false;

        keyObject.userData.collected =
            true;


        showMessage(
            "You found the key."
        );


        hideInteraction();


        setTimeout(
            hideMessage,
            2200
        );


        return;
    }


    /*
       NOTE
    */

    if (
        type === "note"
    ) {

        showMessage(
            "THE NOTE: FIND THE KEY. THEN OPEN THE DOOR."
        );


        setTimeout(
            hideMessage,
            3500
        );


        return;
    }


    /*
       DOOR
    */

    if (
        type === "door"
    ) {

        if (
            keyObject.userData.collected
        ) {

            showMessage(
                "The key fits... The door is opening."
            );


            hideInteraction();


            setTimeout(
                openDoor,
                1000
            );

        } else {

            showMessage(
                "The door is locked. I need a key."
            );


            setTimeout(
                hideMessage,
                2200
            );
        }
    }
}


/* =========================================================
   OPEN DOOR
========================================================= */

function openDoor() {

    if (
        !doorObject
    ) {

        return;
    }


    /*
       Remove door collision
    */

    collisionBoxes.forEach(
        box => {

            if (
                box.minZ < -9 &&
                box.maxZ < -9
            ) {

                box.minX =
                    1000;

                box.maxX =
                    1001;
            }
        }
    );


    /*
       Animate door upward
    */

    const startY =
        doorObject.position.y;


    const targetY =
        startY + 5;


    const duration =
        1800;


    const startTime =
        performance.now();


    function animateDoor(
        now
    ) {

        const progress =
            Math.min(
                (now - startTime) /
                duration,
                1
            );


        doorObject.position.y =
            THREE.MathUtils.lerp(
                startY,
                targetY,
                progress
            );


        if (
            progress < 1
        ) {

            requestAnimationFrame(
                animateDoor
            );

        } else {

            winGame();
        }
    }


    requestAnimationFrame(
        animateDoor
    );
}


/* =========================================================
   WIN
========================================================= */

function winGame() {

    if (
        game.finished
    ) {

        return;
    }


    game.finished =
        true;

    game.paused =
        true;


    hideInteraction();

    hideMessage();


    if (
        document.pointerLockElement
    ) {

        document.exitPointerLock();
    }


    if (winScreen) {

        winScreen.style.display =
            "flex";
    }
}


/* =========================================================
   RESTART
========================================================= */

function setupRestart() {

    if (!restartButton) {
        return;
    }


    restartButton.addEventListener(
        "click",
        () => {

            window.location.reload();

        }
    );
}


/* =========================================================
   FLASHLIGHT
========================================================= */

function toggleFlashlight() {

    if (
        game.flashlight.battery <= 0
    ) {

        return;
    }


    game.flashlight.enabled =
        !game.flashlight.enabled;


    flashlight.visible =
        game.flashlight.enabled;


    if (
        game.flashlight.enabled
    ) {

        showMessage(
            "Flashlight ON"
        );

    } else {

        showMessage(
            "Flashlight OFF"
        );
    }


    setTimeout(
        hideMessage,
        900
    );
}


/* =========================================================
   FLASHLIGHT UPDATE
========================================================= */

function updateFlashlight(
    delta
) {

    if (
        !game.flashlight.enabled
    ) {

        return;
    }


    game.flashlight.battery -=
        game.flashlight.drainRate *
        delta;


    if (
        game.flashlight.battery <= 0
    ) {

        game.flashlight.battery =
            0;

        game.flashlight.enabled =
            false;

        flashlight.visible =
            false;

        showMessage(
            "The flashlight battery is dead."
        );
    }


    const power =
        game.flashlight.battery /
        100;


    flashlight.intensity =
        5.5 *
        Math.max(
            power,
            0
        );


    updateBatteryUI();
}


/* =========================================================
   BATTERY UI
========================================================= */

function updateBatteryUI() {

    if (
        batteryInner
    ) {

        batteryInner.style.width =
            `${game.flashlight.battery}%`;
    }


    if (
        batteryPercent
    ) {

        batteryPercent.textContent =
            `${Math.ceil(
                game.flashlight.battery
            )}%`;
    }
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

    crosshair.style.visibility =
        "visible";

    crosshair.style.opacity =
        "1";

    crosshair.style.zIndex =
        "99999";

    crosshair.style.pointerEvents =
        "none";
}


/* =========================================================
   INTERACTION UI
========================================================= */

function showInteraction(
    text
) {

    if (!interactionText) {
        return;
    }


    interactionText.textContent =
        isMobile()
            ? text.replace(
                "E — ",
                "TAP E — "
            )
            : text;


    interactionText.style.display =
        "block";
}


function hideInteraction() {

    if (!interactionText) {
        return;
    }


    interactionText.style.display =
        "none";
}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    text
) {

    if (!messageBox) {
        return;
    }


    messageBox.textContent =
        text;


    messageBox.style.display =
        "block";
}


function hideMessage() {

    if (!messageBox) {
        return;
    }


    messageBox.style.display =
        "none";
}


/* =========================================================
   MOBILE DETECTION
========================================================= */

function isMobile() {

    return (

        /Android|iPhone|iPad|iPod/i
            .test(
                navigator.userAgent
            )

        ||

        window.innerWidth <= 900

    );
}


/* =========================================================
   MOBILE VISIBILITY
========================================================= */

function updateMobileVisibility() {

    if (!mobileControls) {
        return;
    }


    if (
        isMobile()
    ) {

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
}


function resize() {

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

    showCrosshair();
}


/* =========================================================
   ANIMATION
========================================================= */

function updateAnimations(
    time
) {

    /*
       Floating key
    */

    if (
        keyObject &&
        keyObject.visible
    ) {

        keyObject.rotation.y +=
            0.015;


        keyObject.position.y =
            1.48 +
            Math.sin(
                time * 0.003
            ) *
            0.06;
    }
}


/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop(
    now
) {

    requestAnimationFrame(
        gameLoop
    );


    let delta =
        (
            now -
            game.clock.last
        ) / 1000;


    game.clock.last =
        now;


    /*
       Prevent huge movement
       when browser tab changes.
    */

    delta =
        Math.min(
            delta,
            0.05
        );


    updateMovement(
        delta
    );


    updateInteraction();


    updateFlashlight(
        delta
    );


    updateAnimations(
        now
    );


    renderer.render(
        scene,
        camera
    );
}


/* =========================================================
   GLOBAL TOUCH PREVENTION
========================================================= */

document.addEventListener(
    "touchmove",
    e => {

        if (
            game.started
        ) {

            e.preventDefault();
        }

    },
    {
        passive: false
    }
);


/* =========================================================
   DISABLE CONTEXT MENU
========================================================= */

document.addEventListener(
    "contextmenu",
    e => {

        e.preventDefault();
    }
);


/* =========================================================
   START
========================================================= */

init();
