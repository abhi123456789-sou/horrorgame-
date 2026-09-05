// ============================================================
// GUN GAME
// COMPLETE PLAYABLE VERSION
// Three.js
// Desktop + Mobile Landscape
// ============================================================

import * as THREE from
    "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";


// ============================================================
// CORE
// ============================================================

let scene;
let camera;
let renderer;
let clock;

let gameStarted = false;
let paused = false;
let gameOver = false;


// ============================================================
// PLAYER
// ============================================================

const player = {

    height: 1.7,

    position:
        new THREE.Vector3(
            0,
            1.7,
            8
        ),

    speed: 5,

    sprintSpeed: 8,

    health: 100,

    maxHealth: 100

};


// ============================================================
// CAMERA
// ============================================================

let yaw = 0;
let pitch = 0;


// ============================================================
// INPUT
// ============================================================

const keys = {};

const mobileInput = {

    moveX: 0,

    moveY: 0,

    sprint: false

};


let joystickTouchId = null;

let lookTouchId = null;

let lastLookX = 0;

let lastLookY = 0;


// ============================================================
// WEAPON
// ============================================================

const weapon = {

    name: "PISTOL",

    magazineSize: 12,

    ammo: 12,

    reserveAmmo: 120,

    damage: 34,

    fireRate: 180,

    lastShot: 0,

    reloadTime: 1100,

    reloading: false,

    reloadStarted: 0

};


let gun;

let gunSlide;

let muzzleFlash;

let gunRecoil = 0;

let gunBobTime = 0;


// ============================================================
// GAME STATS
// ============================================================

let score = 0;

let kills = 0;

let wave = 1;

let enemiesRemaining = 0;

let waveTransition = false;

let waveTimer = 0;


// ============================================================
// ENEMIES
// ============================================================

const enemies = [];

const enemyGroup = new THREE.Group();


// ============================================================
// WORLD OBJECTS
// ============================================================

const worldObjects = [];


// ============================================================
// RAYCASTER
// ============================================================

const raycaster =
    new THREE.Raycaster();


// ============================================================
// UI
// ============================================================

let messageTimer = null;

let damageTimer = null;


// ============================================================
// INITIALIZE
// ============================================================

function init() {

    // --------------------------------------------------------
    // SCENE
    // --------------------------------------------------------

    scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(
            0x080b10
        );

    scene.fog =
        new THREE.Fog(
            0x080b10,
            18,
            75
        );


    // --------------------------------------------------------
    // CAMERA
    // --------------------------------------------------------

    camera =
        new THREE.PerspectiveCamera(

            75,

            window.innerWidth /
            window.innerHeight,

            0.1,

            1000

        );

    camera.rotation.order =
        "YXZ";

    camera.position.copy(
        player.position
    );


    // --------------------------------------------------------
    // RENDERER
    // --------------------------------------------------------

    renderer =
        new THREE.WebGLRenderer({

            antialias: true,

            powerPreference: "high-performance"

        });


    renderer.setSize(

        window.innerWidth,

        window.innerHeight

    );


    renderer.setPixelRatio(

        Math.min(

            window.devicePixelRatio,

            2

        )

    );


    renderer.shadowMap.enabled =
        true;


    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;


    renderer.outputColorSpace =
        THREE.SRGBColorSpace;


    document.body.appendChild(
        renderer.domElement
    );


    // --------------------------------------------------------
    // CLOCK
    // --------------------------------------------------------

    clock =
        new THREE.Clock();


    // --------------------------------------------------------
    // WORLD
    // --------------------------------------------------------

    createLighting();

    createWorld();


    // --------------------------------------------------------
    // ENEMIES
    // --------------------------------------------------------

    scene.add(
        enemyGroup
    );


    // --------------------------------------------------------
    // PLAYER GUN
    // --------------------------------------------------------

    createGun();


    // --------------------------------------------------------
    // INPUT
    // --------------------------------------------------------

    setupKeyboard();

    setupMouse();

    setupMobile();

    setupButtons();


    // --------------------------------------------------------
    // RESIZE
    // --------------------------------------------------------

    window.addEventListener(

        "resize",

        handleResize

    );


    // --------------------------------------------------------
    // START LOOP
    // --------------------------------------------------------

    animate();

}


// ============================================================
// LIGHTING
// ============================================================

function createLighting() {

    const hemisphere =
        new THREE.HemisphereLight(

            0x9baabb,

            0x101216,

            1.8

        );


    scene.add(
        hemisphere
    );


    const sun =
        new THREE.DirectionalLight(

            0xffffff,

            2.2

        );


    sun.position.set(

        10,

        20,

        10

    );


    sun.castShadow =
        true;


    sun.shadow.mapSize.width =
        1024;


    sun.shadow.mapSize.height =
        1024;


    sun.shadow.camera.left =
        -35;


    sun.shadow.camera.right =
        35;


    sun.shadow.camera.top =
        35;


    sun.shadow.camera.bottom =
        -35;


    scene.add(
        sun
    );


    const fill =
        new THREE.PointLight(

            0x6688aa,

            3,

            50

        );


    fill.position.set(

        0,

        8,

        0

    );


    scene.add(
        fill
    );

}


// ============================================================
// WORLD
// ============================================================

function createWorld() {

    // --------------------------------------------------------
    // FLOOR
    // --------------------------------------------------------

    const floorGeometry =
        new THREE.PlaneGeometry(

            100,

            100

        );


    const floorMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x30343a,

            roughness: 0.9,

            metalness: 0.05

        });


    const floor =
        new THREE.Mesh(

            floorGeometry,

            floorMaterial

        );


    floor.rotation.x =
        -Math.PI / 2;


    floor.receiveShadow =
        true;


    scene.add(
        floor
    );


    // --------------------------------------------------------
    // GRID
    // --------------------------------------------------------

    const grid =
        new THREE.GridHelper(

            100,

            100,

            0x555555,

            0x292d32

        );


    grid.position.y =
        0.01;


    scene.add(
        grid
    );


    // --------------------------------------------------------
    // WALL MATERIAL
    // --------------------------------------------------------

    const wallMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x4b5058,

            roughness: 0.8

        });


    // --------------------------------------------------------
    // OUTER WALLS
    // --------------------------------------------------------

    addWall(

        0,
        2,
        -25,
        50,
        4,
        1,
        wallMaterial

    );


    addWall(

        0,
        2,
        25,
        50,
        4,
        1,
        wallMaterial

    );


    addWall(

        -25,
        2,
        0,
        1,
        4,
        50,
        wallMaterial

    );


    addWall(

        25,
        2,
        0,
        1,
        4,
        50,
        wallMaterial

    );


    // --------------------------------------------------------
    // COVER
    // --------------------------------------------------------

    addWall(

        -8,
        1,
        -5,
        3,
        2,
        3,
        wallMaterial

    );


    addWall(

        8,
        1,
        -8,
        3,
        2,
        3,
        wallMaterial

    );


    addWall(

        -10,
        1,
        8,
        4,
        2,
        2,
        wallMaterial

    );


    addWall(

        10,
        1,
        7,
        4,
        2,
        2,
        wallMaterial

    );


    addWall(

        0,
        1,
        -5,
        5,
        2,
        2,
        wallMaterial

    );


    addWall(

        0,
        1,
        12,
        5,
        2,
        2,
        wallMaterial

    );


    addWall(

        -15,
        1,
        -14,
        3,
        2,
        4,
        wallMaterial

    );


    addWall(

        15,
        1,
        -14,
        3,
        2,
        4,
        wallMaterial

    );

}


// ============================================================
// ADD WALL
// ============================================================

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


    wall.castShadow =
        true;


    wall.receiveShadow =
        true;


    scene.add(
        wall
    );


    worldObjects.push(
        wall
    );

}


// ============================================================
// CREATE GUN
// ============================================================

function createGun() {

    gun =
        new THREE.Group();


    // --------------------------------------------------------
    // BODY
    // --------------------------------------------------------

    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(

                0.24,

                0.18,

                0.60

            ),

            new THREE.MeshStandardMaterial({

                color: 0x17191c,

                metalness: 0.8,

                roughness: 0.25

            })

        );


    gun.add(
        body
    );


    // --------------------------------------------------------
    // SLIDE
    // --------------------------------------------------------

    gunSlide =
        new THREE.Mesh(

            new THREE.BoxGeometry(

                0.20,

                0.12,

                0.47

            ),

            new THREE.MeshStandardMaterial({

                color: 0x292d32,

                metalness: 0.95,

                roughness: 0.2

            })

        );


    gunSlide.position.set(

        0,

        0.11,

        -0.05

    );


    gun.add(
        gunSlide
    );


    // --------------------------------------------------------
    // BARREL
    // --------------------------------------------------------

    const barrel =
        new THREE.Mesh(

            new THREE.CylinderGeometry(

                0.045,

                0.045,

                0.22,

                16

            ),

            new THREE.MeshStandardMaterial({

                color: 0x090a0b,

                metalness: 1,

                roughness: 0.1

            })

        );


    barrel.rotation.x =
        Math.PI / 2;


    barrel.position.set(

        0,

        0.11,

        -0.39

    );


    gun.add(
        barrel
    );


    // --------------------------------------------------------
    // GRIP
    // --------------------------------------------------------

    const grip =
        new THREE.Mesh(

            new THREE.BoxGeometry(

                0.18,

                0.40,

                0.18

            ),

            new THREE.MeshStandardMaterial({

                color: 0x0e1012,

                roughness: 0.9

            })

        );


    grip.position.set(

        0,

        -0.22,

        0.10

    );


    grip.rotation.x =
        -0.18;


    gun.add(
        grip
    );


    // --------------------------------------------------------
    // TRIGGER
    // --------------------------------------------------------

    const trigger =
        new THREE.Mesh(

            new THREE.BoxGeometry(

                0.035,

                0.09,

                0.035

            ),

            new THREE.MeshStandardMaterial({

                color: 0x050505

            })

        );


    trigger.position.set(

        0,

        -0.04,

        -0.08

    );


    gun.add(
        trigger
    );


    // --------------------------------------------------------
    // MUZZLE FLASH
    // --------------------------------------------------------

    muzzleFlash =
        new THREE.Mesh(

            new THREE.SphereGeometry(

                0.09,

                8,

                8

            ),

            new THREE.MeshBasicMaterial({

                color: 0xffcc55,

                transparent: true,

                opacity: 0

            })

        );


    muzzleFlash.position.set(

        0,

        0.11,

        -0.53

    );


    gun.add(
        muzzleFlash
    );


    // --------------------------------------------------------
    // GUN POSITION
    // --------------------------------------------------------

    gun.position.set(

        0.32,

        -0.28,

        -0.62

    );


    camera.add(
        gun
    );


    scene.add(
        camera
    );

}


// ============================================================
// KEYBOARD
// ============================================================

function setupKeyboard() {

    document.addEventListener(

        "keydown",

        event => {

            keys[event.code] =
                true;


            if (
                event.code === "KeyR"
            ) {

                reload();

            }


            if (
                event.code === "Escape"
            ) {

                togglePause();

            }

        }

    );


    document.addEventListener(

        "keyup",

        event => {

            keys[event.code] =
                false;

        }

    );

}


// ============================================================
// MOUSE
// ============================================================

function setupMouse() {

    document.addEventListener(

        "mousemove",

        event => {

            if (
                !gameStarted ||
                paused ||
                gameOver
            ) {

                return;

            }


            if (
                document.pointerLockElement
                !== renderer.domElement
            ) {

                return;

            }


            yaw -=
                event.movementX *
                0.0022;


            pitch -=
                event.movementY *
                0.0022;


            pitch =
                THREE.MathUtils.clamp(

                    pitch,

                    -1.45,

                    1.45

                );


            updateCamera();

        }

    );


    renderer.domElement.addEventListener(

        "mousedown",

        event => {

            if (
                event.button !== 0
            ) {

                return;

            }


            if (
                !gameStarted ||
                paused ||
                gameOver
            ) {

                return;

            }


            if (
                document.pointerLockElement
                === renderer.domElement
            ) {

                shoot();

            }

        }

    );

}


// ============================================================
// MOBILE
// ============================================================

function setupMobile() {

    const joystick =
        document.getElementById(
            "joystick"
        );


    // --------------------------------------------------------
    // JOYSTICK START
    // --------------------------------------------------------

    joystick.addEventListener(

        "touchstart",

        event => {

            event.preventDefault();


            if (
                !gameStarted ||
                paused ||
                gameOver
            ) {

                return;

            }


            if (
                joystickTouchId !== null
            ) {

                return;

            }


            const touch =
                event.changedTouches[0];


            joystickTouchId =
                touch.identifier;


            updateJoystick(
                touch
            );

        },

        {
            passive: false
        }

    );


    // --------------------------------------------------------
    // JOYSTICK MOVE
    // --------------------------------------------------------

    joystick.addEventListener(

        "touchmove",

        event => {

            event.preventDefault();


            for (
                const touch
                of event.changedTouches
            ) {

                if (
                    touch.identifier
                    === joystickTouchId
                ) {

                    updateJoystick(
                        touch
                    );

                }

            }

        },

        {
            passive: false
        }

    );


    // --------------------------------------------------------
    // JOYSTICK END
    // --------------------------------------------------------

    joystick.addEventListener(

        "touchend",

        event => {

            for (
                const touch
                of event.changedTouches
            ) {

                if (
                    touch.identifier
                    === joystickTouchId
                ) {

                    joystickTouchId =
                        null;


                    mobileInput.moveX =
                        0;


                    mobileInput.moveY =
                        0;


                    resetJoystick();

                }

            }

        }

    );


    // --------------------------------------------------------
    // TOUCH LOOK
    // --------------------------------------------------------

    renderer.domElement.addEventListener(

        "touchstart",

        event => {

            if (
                !gameStarted ||
                paused ||
                gameOver
            ) {

                return;

            }


            for (
                const touch
                of event.changedTouches
            ) {

                if (
                    touch.clientX
                    >
                    window.innerWidth * 0.42
                ) {

                    if (
                        lookTouchId === null
                    ) {

                        lookTouchId =
                            touch.identifier;


                        lastLookX =
                            touch.clientX;


                        lastLookY =
                            touch.clientY;

                    }

                }

            }

        },

        {
            passive: false
        }

    );


    // --------------------------------------------------------
    // TOUCH LOOK MOVE
    // --------------------------------------------------------

    renderer.domElement.addEventListener(

        "touchmove",

        event => {

            if (
                !gameStarted ||
                paused ||
                gameOver
            ) {

                return;

            }


            for (
                const touch
                of event.changedTouches
            ) {

                if (
                    touch.identifier
                    === lookTouchId
                ) {

                    const dx =
                        touch.clientX -
                        lastLookX;


                    const dy =
                        touch.clientY -
                        lastLookY;


                    yaw -=
                        dx *
                        0.004;


                    pitch -=
                        dy *
                        0.004;


                    pitch =
                        THREE.MathUtils.clamp(

                            pitch,

                            -1.45,

                            1.45

                        );


                    updateCamera();


                    lastLookX =
                        touch.clientX;


                    lastLookY =
                        touch.clientY;

                }

            }

        },

        {
            passive: false
        }

    );


    // --------------------------------------------------------
    // TOUCH LOOK END
    // --------------------------------------------------------

    renderer.domElement.addEventListener(

        "touchend",

        event => {

            for (
                const touch
                of event.changedTouches
            ) {

                if (
                    touch.identifier
                    === lookTouchId
                ) {

                    lookTouchId =
                        null;

                }

            }

        }

    );


    // --------------------------------------------------------
    // FIRE
    // --------------------------------------------------------

    const fireButton =
        document.getElementById(
            "fireButton"
        );


    fireButton.addEventListener(

        "touchstart",

        event => {

            event.preventDefault();

            shoot();

        },

        {
            passive: false
        }

    );


    // --------------------------------------------------------
    // RELOAD
    // --------------------------------------------------------

    const reloadButton =
        document.getElementById(
            "reloadButton"
        );


    reloadButton.addEventListener(

        "touchstart",

        event => {

            event.preventDefault();

            reload();

        },

        {
            passive: false
        }

    );


    // --------------------------------------------------------
    // SPRINT
    // --------------------------------------------------------

    const sprintButton =
        document.getElementById(
            "sprintButton"
        );


    sprintButton.addEventListener(

        "touchstart",

        event => {

            event.preventDefault();

            mobileInput.sprint =
                true;

        },

        {
            passive: false
        }

    );


    sprintButton.addEventListener(

        "touchend",

        event => {

            event.preventDefault();

            mobileInput.sprint =
                false;

        },

        {
            passive: false
        }

    );


    sprintButton.addEventListener(

        "touchcancel",

        () => {

            mobileInput.sprint =
                false;

        }

    );

}


// ============================================================
// JOYSTICK UPDATE
// ============================================================

function updateJoystick(
    touch
) {

    const base =
        document.getElementById(
            "joystickBase"
        );


    const knob =
        document.getElementById(
            "joystickKnob"
        );


    const rect =
        base.getBoundingClientRect();


    const centerX =
        rect.left +
        rect.width / 2;


    const centerY =
        rect.top +
        rect.height / 2;


    let dx =
        touch.clientX -
        centerX;


    let dy =
        touch.clientY -
        centerY;


    const maxDistance =
        40;


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


    mobileInput.moveX =
        dx /
        maxDistance;


    mobileInput.moveY =
        dy /
        maxDistance;


    knob.style.transform =
        `translate(
            calc(-50% + ${dx}px),
            calc(-50% + ${dy}px)
        )`;

}


// ============================================================
// RESET JOYSTICK
// ============================================================

function resetJoystick() {

    const knob =
        document.getElementById(
            "joystickKnob"
        );


    knob.style.transform =
        "translate(-50%, -50%)";

}


// ============================================================
// BUTTONS
// ============================================================

function setupButtons() {

    document
        .getElementById(
            "startButton"
        )
        .addEventListener(

            "click",

            startGame

        );


    document
        .getElementById(
            "restartButton"
        )
        .addEventListener(

            "click",

            () => {

                window.location.reload();

            }

        );


    document
        .getElementById(
            "resumeButton"
        )
        .addEventListener(

            "click",

            resumeGame

        );

}


// ============================================================
// START GAME
// ============================================================

function startGame() {

    gameStarted =
        true;

    paused =
        false;

    gameOver =
        false;


    player.health =
        player.maxHealth;


    player.position.set(

        0,

        player.height,

        8

    );


    camera.position.copy(
        player.position
    );


    yaw = 0;

    pitch = 0;


    updateCamera();


    score = 0;

    kills = 0;

    wave = 1;


    weapon.ammo =
        weapon.magazineSize;


    weapon.reserveAmmo =
        120;


    weapon.reloading =
        false;


    clearEnemies();


    document
        .getElementById(
            "startMenu"
        )
        .classList
        .add("hidden");


    document
        .getElementById(
            "gameOver"
        )
        .classList
        .add("hidden");


    document
        .getElementById(
            "pauseMenu"
        )
        .classList
        .add("hidden");


    updateHUD();


    spawnWave();


    showMessage(
        "WAVE 1"
    );


    if (
        window.matchMedia(
            "(pointer:fine)"
        ).matches
    ) {

        renderer.domElement
            .requestPointerLock();

    }

}


// ============================================================
// CAMERA
// ============================================================

function updateCamera() {

    camera.rotation.order =
        "YXZ";


    camera.rotation.y =
        yaw;


    camera.rotation.x =
        pitch;

}


// ============================================================
// PLAYER MOVEMENT
// ============================================================

function updatePlayer(
    delta
) {

    const direction =
        new THREE.Vector3();


    // --------------------------------------------------------
    // KEYBOARD
    // --------------------------------------------------------

    if (
        keys["KeyW"]
    ) {

        direction.z -= 1;

    }


    if (
        keys["KeyS"]
    ) {

        direction.z += 1;

    }


    if (
        keys["KeyA"]
    ) {

        direction.x -= 1;

    }


    if (
        keys["KeyD"]
    ) {

        direction.x += 1;

    }


    // --------------------------------------------------------
    // MOBILE
    // --------------------------------------------------------

    direction.x +=
        mobileInput.moveX;


    direction.z +=
        mobileInput.moveY;


    if (
        direction.lengthSq()
        === 0
    ) {

        return;

    }


    direction.normalize();


    direction.applyAxisAngle(

        new THREE.Vector3(
            0,
            1,
            0
        ),

        yaw

    );


    let speed =
        player.speed;


    if (
        keys["ShiftLeft"] ||
        keys["ShiftRight"] ||
        mobileInput.sprint
    ) {

        speed =
            player.sprintSpeed;

    }


    player.position.addScaledVector(

        direction,

        speed * delta

    );


    // --------------------------------------------------------
    // BOUNDARIES
    // --------------------------------------------------------

    player.position.x =
        THREE.MathUtils.clamp(

            player.position.x,

            -23,

            23

        );


    player.position.z =
        THREE.MathUtils.clamp(

            player.position.z,

            -23,

            23

        );


    camera.position.copy(
        player.position
    );

}


// ============================================================
// SHOOT
// ============================================================

function shoot() {

    if (
        !gameStarted ||
        paused ||
        gameOver
    ) {

        return;

    }


    if (
        weapon.reloading
    ) {

        return;

    }


    // --------------------------------------------------------
    // EMPTY
    // --------------------------------------------------------

    if (
        weapon.ammo <= 0
    ) {

        showMessage(
            "RELOAD"
        );

        return;

    }


    // --------------------------------------------------------
    // FIRE RATE
    // --------------------------------------------------------

    const now =
        performance.now();


    if (
        now -
        weapon.lastShot
        <
        weapon.fireRate
    ) {

        return;

    }


    weapon.lastShot =
        now;


    weapon.ammo--;


    // --------------------------------------------------------
    // RECOIL
    // --------------------------------------------------------

    gunRecoil =
        0.08;


    pitch +=
        0.025;


    pitch =
        THREE.MathUtils.clamp(

            pitch,

            -1.45,

            1.45

        );


    updateCamera();


    // --------------------------------------------------------
    // FLASH
    // --------------------------------------------------------

    muzzleFlash.material.opacity =
        1;


    muzzleFlash.scale.set(
        1.5,
        1.5,
        1.5
    );


    // --------------------------------------------------------
    // SLIDE
    // --------------------------------------------------------

    gunSlide.position.z =
        0.01;


    // --------------------------------------------------------
    // HIT
    // --------------------------------------------------------

    performHitDetection();


    updateHUD();


}


// ============================================================
// HIT DETECTION
// ============================================================

function performHitDetection() {

    raycaster.setFromCamera(

        new THREE.Vector2(
            0,
            0
        ),

        camera

    );


    const targetMeshes = [];


    for (
        const enemy
        of enemies
    ) {

        if (
            enemy.dead
        ) {

            continue;

        }


        enemy.group.traverse(

            child => {

                if (
                    child.isMesh
                ) {

                    targetMeshes.push(
                        child
                    );

                }

            }

        );

    }


    const hits =
        raycaster.intersectObjects(

            targetMeshes,

            false

        );


    if (
        hits.length === 0
    ) {

        return;

    }


    const hit =
        hits[0];


    let enemy =
        hit.object.userData.enemy;


    if (
        !enemy
    ) {

        let parent =
            hit.object.parent;


        while (
            parent &&
            !enemy
        ) {

            if (
                parent.userData &&
                parent.userData.enemy
            ) {

                enemy =
                    parent.userData.enemy;

            }


            parent =
                parent.parent;

        }

    }


    if (
        !enemy ||
        enemy.dead
    ) {

        return;

    }


    enemy.health -=
        weapon.damage;


    enemy.hitFlash =
        0.08;


    if (
        enemy.health <= 0
    ) {

        killEnemy(
            enemy
        );

    }

}


// ============================================================
// RELOAD
// ============================================================

function reload() {

    if (
        !gameStarted ||
        paused ||
        gameOver
    ) {

        return;

    }


    if (
        weapon.reloading
    ) {

        return;

    }


    if (
        weapon.ammo >=
        weapon.magazineSize
    ) {

        return;

    }


    if (
        weapon.reserveAmmo <= 0
    ) {

        showMessage(
            "NO AMMO"
        );

        return;

    }


    weapon.reloading =
        true;


    weapon.reloadStarted =
        performance.now();


    document
        .getElementById(
            "reloadIndicator"
        )
        .classList
        .add("show");

}


// ============================================================
// UPDATE RELOAD
// ============================================================

function updateReload() {

    if (
        !weapon.reloading
    ) {

        return;

    }


    const elapsed =
        performance.now() -
        weapon.reloadStarted;


    if (
        elapsed <
        weapon.reloadTime
    ) {

        return;

    }


    const needed =
        weapon.magazineSize -
        weapon.ammo;


    const amount =
        Math.min(

            needed,

            weapon.reserveAmmo

        );


    weapon.ammo +=
        amount;


    weapon.reserveAmmo -=
        amount;


    weapon.reloading =
        false;


    document
        .getElementById(
            "reloadIndicator"
        )
        .classList
        .remove("show");


    updateHUD();


    showMessage(
        "RELOADED"
    );

}


// ============================================================
// SPAWN WAVE
// ============================================================

function spawnWave() {

    clearEnemies();


    const count =
        Math.min(

            3 + wave * 2,

            20

        );


    enemiesRemaining =
        count;


    for (
        let i = 0;

        i < count;

        i++
    ) {

        spawnEnemy();

    }


    updateHUD();

}


// ============================================================
// SPAWN ENEMY
// ============================================================

function spawnEnemy() {

    const group =
        new THREE.Group();


    // --------------------------------------------------------
    // BODY
    // --------------------------------------------------------

    const bodyMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x5c2020,

            roughness: 0.8

        });


    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(

                0.8,

                1.2,

                0.5

            ),

            bodyMaterial

        );


    body.position.y =
        1.0;


    body.castShadow =
        true;


    group.add(
        body
    );


    // --------------------------------------------------------
    // HEAD
    // --------------------------------------------------------

    const headMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x873333,

            roughness: 0.7

        });


    const head =
        new THREE.Mesh(

            new THREE.SphereGeometry(

                0.38,

                16,

                16

            ),

            headMaterial

        );


    head.position.y =
        1.85;


    head.castShadow =
        true;


    group.add(
        head
    );


    // --------------------------------------------------------
    // EYES
    // --------------------------------------------------------

    const eyeMaterial =
        new THREE.MeshBasicMaterial({

            color: 0xffffff

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

        -0.13,

        1.9,

        -0.32

    );


    group.add(
        leftEye
    );


    const rightEye =
        leftEye.clone();


    rightEye.position.x =
        0.13;


    group.add(
        rightEye
    );


    // --------------------------------------------------------
    // POSITION
    // --------------------------------------------------------

    const position =
        getSpawnPosition();


    group.position.copy(
        position
    );


    group.userData.enemy =
        null;


    const enemy = {

        group: group,

        health:
            100 +
            wave * 15,

        maxHealth:
            100 +
            wave * 15,

        speed:
            1.1 +
            wave * 0.08,

        attackDistance:
            1.6,

        attackCooldown:
            0,

        hitFlash:
            0,

        dead:
            false

    };


    group.userData.enemy =
        enemy;


    group.traverse(

        child => {

            if (
                child.isMesh
            ) {

                child.userData.enemy =
                    enemy;

            }

        }

    );


    enemyGroup.add(
        group
    );


    enemies.push(
        enemy
    );

}


// ============================================================
// SPAWN POSITION
// ============================================================

function getSpawnPosition() {

    let x;

    let z;


    for (
        let attempt = 0;

        attempt < 30;

        attempt++
    ) {

        const side =
            Math.floor(
                Math.random() * 4
            );


        if (
            side === 0
        ) {

            x =
                -20 +
                Math.random() * 40;

            z =
                -20;

        }
        else if (
            side === 1
        ) {

            x =
                -20 +
                Math.random() * 40;

            z =
                20;

        }
        else if (
            side === 2
        ) {

            x =
                -20;

            z =
                -20 +
                Math.random() * 40;

        }
        else {

            x =
                20;

            z =
                -20 +
                Math.random() * 40;

        }


        const dx =
            x -
            player.position.x;


        const dz =
            z -
            player.position.z;


        if (
            Math.sqrt(
                dx * dx +
                dz * dz
            )
            > 12
        ) {

            return new THREE.Vector3(

                x,

                0,

                z

            );

        }

    }


    return new THREE.Vector3(

        18,

        0,

        18

    );

}


// ============================================================
// UPDATE ENEMIES
// ============================================================

function updateEnemies(
    delta
) {

    for (
        const enemy
        of enemies
    ) {

        if (
            enemy.dead
        ) {

            continue;

        }


        const position =
            enemy.group.position;


        const dx =
            player.position.x -
            position.x;


        const dz =
            player.position.z -
            position.z;


        const distance =
            Math.sqrt(

                dx * dx +
                dz * dz

            );


        // ----------------------------------------------------
        // FACE PLAYER
        // ----------------------------------------------------

        enemy.group.rotation.y =
            Math.atan2(

                dx,

                dz

            );


        // ----------------------------------------------------
        // MOVE
        // ----------------------------------------------------

        if (
            distance >
            enemy.attackDistance
        ) {

            const length =
                Math.max(
                    distance,
                    0.001
                );


            position.x +=
                dx /
                length *
                enemy.speed *
                delta;


            position.z +=
                dz /
                length *
                enemy.speed *
                delta;

        }
        else {

            // ------------------------------------------------
            // ATTACK
            // ------------------------------------------------

            enemy.attackCooldown -=
                delta;


            if (
                enemy.attackCooldown
                <= 0
            ) {

                damagePlayer(
                    8 +
                    wave * 0.5
                );


                enemy.attackCooldown =
                    1.0;

            }

        }


        // ----------------------------------------------------
        // HIT FLASH
        // ----------------------------------------------------

        if (
            enemy.hitFlash > 0
        ) {

            enemy.hitFlash -=
                delta;

        }


        // ----------------------------------------------------
        // KEEP INSIDE MAP
        // ----------------------------------------------------

        position.x =
            THREE.MathUtils.clamp(

                position.x,

                -23,

                23

            );


        position.z =
            THREE.MathUtils.clamp(

                position.z,

                -23,

                23

            );

    }


    // --------------------------------------------------------
    // REMOVE DEAD
    // --------------------------------------------------------

    for (
        let i =
        enemies.length - 1;

        i >= 0;

        i--
    ) {

        if (
            enemies[i].dead
        ) {

            enemies.splice(
                i,
                1
            );

        }

    }


    enemiesRemaining =
        enemies.filter(

            enemy =>
                !enemy.dead

        ).length;


    if (
        enemiesRemaining === 0 &&
        !waveTransition
    ) {

        startNextWave();

    }

}


// ============================================================
// KILL ENEMY
// ============================================================

function killEnemy(
    enemy
) {

    if (
        enemy.dead
    ) {

        return;

    }


    enemy.dead =
        true;


    kills++;

    score +=
        100 +
        wave * 25;


    enemiesRemaining--;


    // --------------------------------------------------------
    // DEATH ANIMATION
    // --------------------------------------------------------

    enemy.group.rotation.x =
        -Math.PI / 2;


    enemy.group.position.y =
        0.3;


    setTimeout(

        () => {

            if (
                enemy.group.parent
            ) {

                enemy.group.parent
                    .remove(
                        enemy.group
                    );

            }

        },

        250

    );


    updateHUD();


    showMessage(
        "+ KILL"
    );


    if (
        enemiesRemaining <= 0 &&
        !waveTransition
    ) {

        startNextWave();

    }

}


// ============================================================
// NEXT WAVE
// ============================================================

function startNextWave() {

    if (
        waveTransition
    ) {

        return;

    }


    waveTransition =
        true;


    waveTimer =
        2.0;


    showMessage(
        "WAVE CLEARED"
    );

}


// ============================================================
// UPDATE WAVE
// ============================================================

function updateWave(
    delta
) {

    if (
        !waveTransition
    ) {

        return;

    }


    waveTimer -=
        delta;


    if (
        waveTimer <= 0
    ) {

        wave++;

        waveTransition =
            false;


        spawnWave();


        showMessage(
            "WAVE " +
            wave
        );

    }

}


// ============================================================
// PLAYER DAMAGE
// ============================================================

function damagePlayer(
    amount
) {

    if (
        gameOver
    ) {

        return;

    }


    player.health -=
        amount;


    player.health =
        Math.max(

            0,

            player.health

        );


    // --------------------------------------------------------
    // DAMAGE EFFECT
    // --------------------------------------------------------

    const flash =
        document.getElementById(
            "damageFlash"
        );


    flash.classList.add(
        "hit"
    );


    clearTimeout(
        damageTimer
    );


    damageTimer =
        setTimeout(

            () => {

                flash.classList.remove(
                    "hit"
                );

            },

            100

        );


    updateHUD();


    if (
        player.health <= 0
    ) {

        endGame();

    }

}


// ============================================================
// GAME OVER
// ============================================================

function endGame() {

    gameOver =
        true;


    gameStarted =
        false;


    if (
        document.pointerLockElement
        === renderer.domElement
    ) {

        document.exitPointerLock();

    }


    document
        .getElementById(
            "finalScore"
        )
        .textContent =
        score;


    document
        .getElementById(
            "finalKills"
        )
        .textContent =
        kills;


    document
        .getElementById(
            "finalWave"
        )
        .textContent =
        wave;


    document
        .getElementById(
            "gameOver"
        )
        .classList
        .remove("hidden");

}


// ============================================================
// PAUSE
// ============================================================

function togglePause() {

    if (
        !gameStarted ||
        gameOver
    ) {

        return;

    }


    if (
        paused
    ) {

        resumeGame();

    }
    else {

        pauseGame();

    }

}


// ============================================================
// PAUSE
// ============================================================

function pauseGame() {

    paused =
        true;


    mobileInput.sprint =
        false;


    document
        .getElementById(
            "pauseMenu"
        )
        .classList
        .remove("hidden");


    if (
        document.pointerLockElement
        === renderer.domElement
    ) {

        document.exitPointerLock();

    }

}


// ============================================================
// RESUME
// ============================================================

function resumeGame() {

    if (
        gameOver
    ) {

        return;

    }


    paused =
        false;


    document
        .getElementById(
            "pauseMenu"
        )
        .classList
        .add("hidden");


    if (
        window.matchMedia(
            "(pointer:fine)"
        ).matches
    ) {

        renderer.domElement
            .requestPointerLock();

    }

}


// ============================================================
// CLEAR ENEMIES
// ============================================================

function clearEnemies() {

    while (
        enemyGroup.children.length
        > 0
    ) {

        enemyGroup.remove(
            enemyGroup.children[0]
        );

    }


    enemies.length =
        0;

}


// ============================================================
// GUN ANIMATION
// ============================================================

function updateGun(
    delta
) {

    // --------------------------------------------------------
    // RECOIL
    // --------------------------------------------------------

    gunRecoil =
        THREE.MathUtils.lerp(

            gunRecoil,

            0,

            12 * delta

        );


    gun.position.z =
        -0.62 +
        gunRecoil;


    gun.rotation.x =
        -0.02 +
        gunRecoil * 0.4;


    // --------------------------------------------------------
    // FLASH
    // --------------------------------------------------------

    if (
        muzzleFlash.material.opacity
        > 0
    ) {

        muzzleFlash.material.opacity -=
            delta * 14;


        muzzleFlash.scale.multiplyScalar(
            0.82
        );

    }


    // --------------------------------------------------------
    // SLIDE
    // --------------------------------------------------------

    gunSlide.position.z =
        THREE.MathUtils.lerp(

            gunSlide.position.z,

            -0.05,

            delta * 15

        );


    // --------------------------------------------------------
    // WALK BOB
    // --------------------------------------------------------

    const moving =
        keys["KeyW"] ||
        keys["KeyS"] ||
        keys["KeyA"] ||
        keys["KeyD"] ||
        Math.abs(
            mobileInput.moveX
        ) > 0.1 ||
        Math.abs(
            mobileInput.moveY
        ) > 0.1;


    if (
        moving &&
        gameStarted &&
        !paused
    ) {

        gunBobTime +=
            delta * 10;


        gun.position.y =
            -0.28 +
            Math.sin(
                gunBobTime
            ) * 0.008;


        gun.position.x =
            0.32 +
            Math.cos(
                gunBobTime * 0.5
            ) * 0.008;

    }
    else {

        gun.position.y =
            THREE.MathUtils.lerp(

                gun.position.y,

                -0.28,

                delta * 8

            );


        gun.position.x =
            THREE.MathUtils.lerp(

                gun.position.x,

                0.32,

                delta * 8

            );

    }

}


// ============================================================
// HUD
// ============================================================

function updateHUD() {

    document
        .getElementById(
            "health"
        )
        .textContent =
        Math.ceil(
            player.health
        );


    document
        .getElementById(
            "healthFill"
        )
        .style.width =
        player.health +
        "%";


    document
        .getElementById(
            "ammo"
        )
        .textContent =
        weapon.ammo;


    document
        .getElementById(
            "reserve"
        )
        .textContent =
        weapon.reserveAmmo;


    document
        .getElementById(
            "kills"
        )
        .textContent =
        kills;


    document
        .getElementById(
            "score"
        )
        .textContent =
        score;


    document
        .getElementById(
            "wave"
        )
        .textContent =
        wave;

}


// ============================================================
// MESSAGE
// ============================================================

function showMessage(
    text
) {

    const element =
        document.getElementById(
            "message"
        );


    element.textContent =
        text;


    element.classList.add(
        "show"
    );


    clearTimeout(
        messageTimer
    );


    messageTimer =
        setTimeout(

            () => {

                element.classList.remove(
                    "show"
                );

            },

            900

        );

}


// ============================================================
// RESIZE
// ============================================================

function handleResize() {

    camera.aspect =
        window.innerWidth /
        window.innerHeight;


    camera.updateProjectionMatrix();


    renderer.setSize(

        window.innerWidth,

        window.innerHeight

    );

}


// ============================================================
// GAME LOOP
// ============================================================

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
        gameStarted &&
        !paused &&
        !gameOver
    ) {

        updatePlayer(
            delta
        );


        updateReload();


        updateEnemies(
            delta
        );


        updateWave(
            delta
        );


        updateGun(
            delta
        );

    }


    renderer.render(
        scene,
        camera
    );

}


// ============================================================
// START ENGINE
// ============================================================

init();
