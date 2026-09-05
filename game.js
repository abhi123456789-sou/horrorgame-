// ============================================================
// GUN GAME
// PART 4 — GUN SYSTEM
// Desktop + Mobile
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

    sprintSpeed: 8

};


// ============================================================
// CAMERA
// ============================================================

let yaw = 0;
let pitch = 0;


// ============================================================
// KEYBOARD
// ============================================================

const keys = {};


// ============================================================
// MOBILE INPUT
// ============================================================

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
// GUN
// ============================================================

let gun;

let gunBody;
let gunSlide;
let gunBarrel;

let muzzleFlash;

let gunRecoil = 0;

let gunBobTime = 0;


// ============================================================
// GUN SETTINGS
// ============================================================

const weapon = {

    magazineSize: 12,

    ammo: 12,

    reserveAmmo: 120,

    damage: 25,

    fireRate: 180,

    lastShotTime: 0,

    reloading: false,

    reloadDuration: 1200,

    reloadStartTime: 0

};


// ============================================================
// EFFECTS
// ============================================================

const shellCasingGeometry =
    new THREE.BoxGeometry(
        0.025,
        0.08,
        0.025
    );

const shellCasingMaterial =
    new THREE.MeshStandardMaterial({

        color: 0xc79b35

    });


const shellCasings = [];


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
            15,
            70
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

    camera.position.copy(
        player.position
    );

    camera.rotation.order =
        "YXZ";


    // --------------------------------------------------------
    // RENDERER
    // --------------------------------------------------------

    renderer =
        new THREE.WebGLRenderer({

            antialias: true

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
    // GUN
    // --------------------------------------------------------

    createGun();


    // --------------------------------------------------------
    // INPUT
    // --------------------------------------------------------

    setupKeyboard();

    setupDesktopMouse();

    setupMobileControls();

    setupButtons();


    // --------------------------------------------------------
    // RESIZE
    // --------------------------------------------------------

    window.addEventListener(
        "resize",
        handleResize
    );


    // --------------------------------------------------------
    // LOOP
    // --------------------------------------------------------

    animate();

}


// ============================================================
// LIGHTING
// ============================================================

function createLighting() {

    const hemisphere =
        new THREE.HemisphereLight(

            0x8899aa,

            0x111111,

            1.5

        );

    scene.add(
        hemisphere
    );


    const directional =
        new THREE.DirectionalLight(

            0xffffff,

            2

        );

    directional.position.set(
        10,
        15,
        10
    );

    directional.castShadow =
        true;

    scene.add(
        directional
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

            color: 0x30343a

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
            0x333333

        );

    grid.position.y =
        0.01;

    scene.add(
        grid
    );


    // --------------------------------------------------------
    // MATERIAL
    // --------------------------------------------------------

    const wallMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x4b5058

        });


    // --------------------------------------------------------
    // OUTER WALLS
    // --------------------------------------------------------

    createBox(
        0,
        2,
        -25,
        50,
        4,
        1,
        wallMaterial
    );

    createBox(
        0,
        2,
        25,
        50,
        4,
        1,
        wallMaterial
    );

    createBox(
        -25,
        2,
        0,
        1,
        4,
        50,
        wallMaterial
    );

    createBox(
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

    createBox(
        -8,
        1,
        -5,
        3,
        2,
        3,
        wallMaterial
    );

    createBox(
        8,
        1,
        -8,
        3,
        2,
        3,
        wallMaterial
    );

    createBox(
        -10,
        1,
        8,
        4,
        2,
        2,
        wallMaterial
    );

    createBox(
        10,
        1,
        7,
        4,
        2,
        2,
        wallMaterial
    );


    // --------------------------------------------------------
    // CENTER COVER
    // --------------------------------------------------------

    createBox(
        0,
        1,
        -5,
        5,
        2,
        2,
        wallMaterial
    );

}


// ============================================================
// CREATE BOX
// ============================================================

function createBox(
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

    const box =
        new THREE.Mesh(

            geometry,

            material

        );

    box.position.set(
        x,
        y,
        z
    );

    box.castShadow =
        true;

    box.receiveShadow =
        true;

    scene.add(
        box
    );

}


// ============================================================
// CREATE GUN
// ============================================================

function createGun() {

    gun =
        new THREE.Group();


    // --------------------------------------------------------
    // GUN BODY
    // --------------------------------------------------------

    const bodyGeometry =
        new THREE.BoxGeometry(
            0.22,
            0.18,
            0.65
        );


    const bodyMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x16181b,

            metalness: 0.8,

            roughness: 0.25

        });


    gunBody =
        new THREE.Mesh(

            bodyGeometry,

            bodyMaterial

        );


    gun.add(
        gunBody
    );


    // --------------------------------------------------------
    // SLIDE
    // --------------------------------------------------------

    const slideGeometry =
        new THREE.BoxGeometry(
            0.19,
            0.12,
            0.48
        );


    const slideMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x292d32,

            metalness: 0.9,

            roughness: 0.2

        });


    gunSlide =
        new THREE.Mesh(

            slideGeometry,

            slideMaterial

        );


    gunSlide.position.y =
        0.11;

    gunSlide.position.z =
        -0.06;


    gun.add(
        gunSlide
    );


    // --------------------------------------------------------
    // BARREL
    // --------------------------------------------------------

    const barrelGeometry =
        new THREE.CylinderGeometry(

            0.045,
            0.045,
            0.25,

            16

        );


    const barrelMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x111111,

            metalness: 1,

            roughness: 0.15

        });


    gunBarrel =
        new THREE.Mesh(

            barrelGeometry,

            barrelMaterial

        );


    gunBarrel.rotation.x =
        Math.PI / 2;


    gunBarrel.position.set(

        0,

        0.11,

        -0.40

    );


    gun.add(
        gunBarrel
    );


    // --------------------------------------------------------
    // GRIP
    // --------------------------------------------------------

    const gripGeometry =
        new THREE.BoxGeometry(

            0.17,
            0.40,
            0.18

        );


    const gripMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x101214,

            roughness: 0.8

        });


    const grip =
        new THREE.Mesh(

            gripGeometry,

            gripMaterial

        );


    grip.position.set(

        0,

        -0.22,

        0.12

    );


    grip.rotation.x =
        -0.18;


    gun.add(
        grip
    );


    // --------------------------------------------------------
    // TRIGGER
    // --------------------------------------------------------

    const triggerGeometry =
        new THREE.BoxGeometry(

            0.035,
            0.10,
            0.035

        );


    const triggerMaterial =
        new THREE.MeshStandardMaterial({

            color: 0x080808

        });


    const trigger =
        new THREE.Mesh(

            triggerGeometry,

            triggerMaterial

        );


    trigger.position.set(

        0,

        -0.05,

        -0.08

    );


    gun.add(
        trigger
    );


    // --------------------------------------------------------
    // GUN POSITION
    // --------------------------------------------------------

    gun.position.set(

        0.32,

        -0.28,

        -0.62

    );


    gun.rotation.set(

        -0.02,

        -0.02,

        0

    );


    camera.add(
        gun
    );


    scene.add(
        camera
    );


    // --------------------------------------------------------
    // MUZZLE FLASH
    // --------------------------------------------------------

    createMuzzleFlash();

}


// ============================================================
// MUZZLE FLASH
// ============================================================

function createMuzzleFlash() {

    const geometry =
        new THREE.SphereGeometry(

            0.09,

            8,
            8

        );


    const material =
        new THREE.MeshBasicMaterial({

            color: 0xffcc55,

            transparent: true,

            opacity: 0

        });


    muzzleFlash =
        new THREE.Mesh(

            geometry,

            material

        );


    muzzleFlash.position.set(

        0,

        0.11,

        -0.55

    );


    gun.add(
        muzzleFlash
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


            // Reload

            if (
                event.code === "KeyR"
            ) {

                reload();

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
// DESKTOP MOUSE
// ============================================================

function setupDesktopMouse() {

    document.addEventListener(
        "mousemove",
        event => {

            if (!gameStarted) {
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
                0.002;


            pitch -=
                event.movementY *
                0.002;


            pitch =
                THREE.MathUtils.clamp(

                    pitch,

                    -1.45,

                    1.45

                );


            updateCameraRotation();

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


            if (!gameStarted) {
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
// MOBILE CONTROLS
// ============================================================

function setupMobileControls() {

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
    // MOBILE LOOK
    // --------------------------------------------------------

    renderer.domElement.addEventListener(
        "touchstart",
        event => {

            if (!gameStarted) {
                return;
            }


            for (
                const touch
                of event.changedTouches
            ) {

                if (
                    touch.clientX
                    >
                    window.innerWidth * 0.45
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


    renderer.domElement.addEventListener(
        "touchmove",
        event => {

            if (!gameStarted) {
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
                        dx * 0.004;


                    pitch -=
                        dy * 0.004;


                    pitch =
                        THREE.MathUtils.clamp(

                            pitch,

                            -1.45,

                            1.45

                        );


                    updateCameraRotation();


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
    // FIRE BUTTON
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
    // RELOAD BUTTON
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
    // SPRINT BUTTON
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

}


// ============================================================
// JOYSTICK
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
        dx / maxDistance;


    mobileInput.moveY =
        dy / maxDistance;


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
// CAMERA ROTATION
// ============================================================

function updateCameraRotation() {

    camera.rotation.order =
        "YXZ";


    camera.rotation.y =
        yaw;


    camera.rotation.x =
        pitch;

}


// ============================================================
// BUTTONS
// ============================================================

function setupButtons() {

    const startButton =
        document.getElementById(
            "startButton"
        );


    const restartButton =
        document.getElementById(
            "restartButton"
        );


    startButton.addEventListener(
        "click",
        startGame
    );


    restartButton.addEventListener(
        "click",
        () => {

            window.location.reload();

        }
    );

}


// ============================================================
// START GAME
// ============================================================

function startGame() {

    gameStarted =
        true;


    document
        .getElementById(
            "startMenu"
        )
        .classList
        .add("hidden");


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


    updateCameraRotation();


    // Desktop pointer lock

    if (
        window.matchMedia(
            "(pointer:fine)"
        ).matches
    ) {

        renderer.domElement
            .requestPointerLock();

    }


    updateHUD();

}


// ============================================================
// SHOOT
// ============================================================

function shoot() {

    if (!gameStarted) {
        return;
    }


    if (
        weapon.reloading
    ) {

        return;

    }


    // --------------------------------------------------------
    // EMPTY MAGAZINE
    // --------------------------------------------------------

    if (
        weapon.ammo <= 0
    ) {

        showMessage(
            "OUT OF AMMO"
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
        weapon.lastShotTime
        <
        weapon.fireRate
    ) {

        return;

    }


    weapon.lastShotTime =
        now;


    // --------------------------------------------------------
    // REMOVE AMMO
    // --------------------------------------------------------

    weapon.ammo--;


    // --------------------------------------------------------
    // RECOIL
    // --------------------------------------------------------

    gunRecoil =
        0.08;


    pitch +=
        0.025;


    updateCameraRotation();


    // --------------------------------------------------------
    // MUZZLE FLASH
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
        -0.01;


    // --------------------------------------------------------
    // SHELL
    // --------------------------------------------------------

    ejectShell();


    // --------------------------------------------------------
    // HUD
    // --------------------------------------------------------

    updateHUD();


    // --------------------------------------------------------
    // MESSAGE
    // --------------------------------------------------------

    showMessage(
        "FIRE"
    );

}


// ============================================================
// RELOAD
// ============================================================

function reload() {

    if (!gameStarted) {
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
            "NO RESERVE AMMO"
        );

        return;

    }


    weapon.reloading =
        true;


    weapon.reloadStartTime =
        performance.now();


    showMessage(
        "RELOADING..."
    );

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
        weapon.reloadStartTime;


    if (
        elapsed <
        weapon.reloadDuration
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


    updateHUD();


    showMessage(
        "RELOADED"
    );

}


// ============================================================
// EJECT SHELL
// ============================================================

function ejectShell() {

    const shell =
        new THREE.Mesh(

            shellCasingGeometry,

            shellCasingMaterial

        );


    const worldPosition =
        new THREE.Vector3();


    gun.getWorldPosition(
        worldPosition
    );


    shell.position.copy(
        worldPosition
    );


    shell.position.x +=
        0.15;


    shell.position.y +=
        0.05;


    shell.position.z +=
        0.05;


    shell.userData.velocity =
        new THREE.Vector3(

            1.5,

            1.8,

            0.5

        );


    shell.userData.life =
        2;


    scene.add(
        shell
    );


    shellCasings.push(
        shell
    );

}


// ============================================================
// UPDATE SHELLS
// ============================================================

function updateShells(
    delta
) {

    for (
        let i =
        shellCasings.length - 1;

        i >= 0;

        i--
    ) {

        const shell =
            shellCasings[i];


        shell.userData.life -=
            delta;


        shell.userData.velocity.y -=
            8 * delta;


        shell.position.addScaledVector(

            shell.userData.velocity,

            delta

        );


        shell.rotation.x +=
            delta * 8;


        shell.rotation.z +=
            delta * 5;


        if (
            shell.position.y <
            0.05
        ) {

            shell.position.y =
                0.05;

            shell.userData.velocity.y =
                0;

        }


        if (
            shell.userData.life <=
            0
        ) {

            scene.remove(
                shell
            );


            shellCasings.splice(
                i,
                1
            );

        }

    }

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

    if (
        gunRecoil > 0
    ) {

        gunRecoil =
            THREE.MathUtils.lerp(

                gunRecoil,

                0,

                12 * delta

            );

    }


    gun.position.z =
        -0.62 +
        gunRecoil;


    gun.rotation.x =
        -0.02 +
        gunRecoil * 0.4;


    // --------------------------------------------------------
    // MUZZLE FLASH
    // --------------------------------------------------------

    if (
        muzzleFlash.material.opacity
        > 0
    ) {

        muzzleFlash.material.opacity -=
            delta * 12;

        muzzleFlash.scale.multiplyScalar(
            0.85
        );

    }


    // --------------------------------------------------------
    // SLIDE
    // --------------------------------------------------------

    gunSlide.position.z =
        THREE.MathUtils.lerp(

            gunSlide.position.z,

            -0.06,

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
        gameStarted
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

    const ammo =
        document.getElementById(
            "ammo"
        );


    const reserve =
        document.getElementById(
            "reserve"
        );


    if (ammo) {

        ammo.textContent =
            weapon.ammo;

    }


    if (reserve) {

        reserve.textContent =
            weapon.reserveAmmo;

    }

}


// ============================================================
// MESSAGE
// ============================================================

let messageTimer = null;


function showMessage(
    text
) {

    const message =
        document.getElementById(
            "message"
        );


    if (!message) {
        return;
    }


    message.textContent =
        text;


    clearTimeout(
        messageTimer
    );


    messageTimer =
        setTimeout(
            () => {

                message.textContent =
                    "";

            },
            700
        );

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
    // DESKTOP
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


    // --------------------------------------------------------
    // NOTHING
    // --------------------------------------------------------

    if (
        direction.lengthSq()
        === 0
    ) {

        return;

    }


    direction.normalize();


    // --------------------------------------------------------
    // ROTATE WITH CAMERA
    // --------------------------------------------------------

    direction.applyAxisAngle(

        new THREE.Vector3(
            0,
            1,
            0
        ),

        yaw

    );


    // --------------------------------------------------------
    // SPEED
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // MOVE
    // --------------------------------------------------------

    player.position.addScaledVector(

        direction,

        speed * delta

    );


    // --------------------------------------------------------
    // MAP LIMIT
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
        gameStarted
    ) {

        updatePlayer(
            delta
        );

        updateReload();

        updateGun(
            delta
        );

        updateShells(
            delta
        );

    }


    renderer.render(
        scene,
        camera
    );

}


// ============================================================
// START
// ============================================================

init();
