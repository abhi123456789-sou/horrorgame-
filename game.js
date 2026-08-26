"use strict";

/* =========================================================
   THE LAST ROOM
   PART 3 - COMPLETE GAME.JS

   PC:
   WASD       Move
   Mouse      Look
   Left Click Shoot
   Right Click Interact
   E          Interact
   ENTER      Interact
   SPACE      Jump
   C          Crouch
   F          Flashlight
   R          Reload
   1/2/3      Weapons
   ESC        Pause

   MOBILE:
   Left joystick       Move
   Right screen        Look
   FIRE                Shoot
   R                   Reload
   JUMP                Jump
   CROUCH              Crouch
   LIGHT               Flashlight
   E                   Interact
   GUN                 Change weapon
========================================================= */


/* =========================================================
   DOM
========================================================= */

const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas
        ? canvas.getContext("2d")
        : null;

const game =
    document.getElementById("game");

const menu =
    document.getElementById("menu");

const pause =
    document.getElementById("pause");

const help =
    document.getElementById("help");

const over =
    document.getElementById("over");

const overTitle =
    document.getElementById("overTitle");

const overText =
    document.getElementById("overText");

const startButton =
    document.getElementById("start");

const controlsButton =
    document.getElementById("controls");

const resumeButton =
    document.getElementById("resume");

const restartButton =
    document.getElementById("restart");

const pauseControlsButton =
    document.getElementById("pcontrols");

const closeControls =
    document.getElementById("close");

const againButton =
    document.getElementById("again");


/* HUD */

const healthFill =
    document.getElementById("healthFill");

const healthText =
    document.getElementById("healthText");

const batteryFill =
    document.getElementById("batteryFill");

const batteryText =
    document.getElementById("batteryText");

const objective =
    document.getElementById("objective");

const weaponName =
    document.getElementById("weaponName");

const ammo =
    document.getElementById("ammo");

const message =
    document.getElementById("message");

const interaction =
    document.getElementById("interaction");

const interactionMain =
    document.getElementById("interactionMain");

const interactionSub =
    document.getElementById("interactionSub");


/* MOBILE */

const mobile =
    document.getElementById("mobile");

const joy =
    document.getElementById("joy");

const knob =
    document.getElementById("knob");

const lookArea =
    document.getElementById("look");

const fireButton =
    document.getElementById("fire");

const reloadButton =
    document.getElementById("reload");

const jumpButton =
    document.getElementById("jump");

const crouchButton =
    document.getElementById("crouch");

const lightButton =
    document.getElementById("light");

const interactButton =
    document.getElementById("interact");

const gunButton =
    document.getElementById("gun");


/* =========================================================
   CANVAS
========================================================= */

let viewWidth = 0;
let viewHeight = 0;
let dpr = 1;

function resizeCanvas() {

    if (!canvas || !ctx) {
        return;
    }

    dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );

    viewWidth =
        window.innerWidth;

    viewHeight =
        window.innerHeight;

    canvas.width =
        Math.floor(
            viewWidth * dpr
        );

    canvas.height =
        Math.floor(
            viewHeight * dpr
        );

    canvas.style.width =
        viewWidth + "px";

    canvas.style.height =
        viewHeight + "px";

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );
}

window.addEventListener(
    "resize",
    resizeCanvas
);

resizeCanvas();


/* =========================================================
   MAP
========================================================= */

const MAP = [

    "####################",

    "#..................#",

    "#..................#",

    "#....####..........#",

    "#....#.............#",

    "#....#.............#",

    "#....#....#####....#",

    "#.........#...#....#",

    "#.........#...#....#",

    "#.........#........#",

    "#..............D...#",

    "#..................#",

    "#..................#",

    "#..................#",

    "####################"

];

const MAP_WIDTH =
    MAP[0].length;

const MAP_HEIGHT =
    MAP.length;


/* =========================================================
   CONSTANTS
========================================================= */

const FOV =
    Math.PI / 3;

const MAX_RAY_DISTANCE =
    30;

const PLAYER_RADIUS =
    0.20;

const WALK_SPEED =
    2.7;

const CROUCH_SPEED =
    1.45;

const RUN_SPEED =
    3.5;

const GRAVITY =
    8.5;

const JUMP_POWER =
    3.25;


/* =========================================================
   PLAYER
========================================================= */

const player = {

    x: 2.5,

    y: 2.5,

    angle: 0,

    radius: PLAYER_RADIUS,

    health: 100,

    maxHealth: 100,

    battery: 100,

    flashlight: true,

    crouching: false,

    z: 0,

    verticalVelocity: 0,

    onGround: true,

    recoil: 0,

    damageFlash: 0,

    bob: 0,

    moving: false

};


/* =========================================================
   GAME STATE
========================================================= */

let gameStarted = false;

let paused = false;

let gameOver = false;

let victory = false;

let elapsed = 0;

let doorOpen = false;

let doorProgress = 0;

let interactionTarget = null;

let messageTimer = null;

let apparitionTimer = 0;

let apparitionActive = false;

let apparitionTimeout = null;

let footstepTimer = 0;

let muzzleFlashTimer = 0;

let reloadTimer = 0;

let shootingCooldown = 0;

let pointerLockPending = false;


/* =========================================================
   INPUT
========================================================= */

const keys = {

    w: false,

    a: false,

    s: false,

    d: false,

    shift: false,

    c: false

};


/* =========================================================
   MOBILE INPUT
========================================================= */

const mobileInput = {

    x: 0,

    y: 0,

    lookX: 0,

    lookY: 0,

    joystickActive: false,

    joystickPointer: null,

    lookPointer: null,

    fire: false

};


/* =========================================================
   WEAPONS
========================================================= */

const WEAPONS = {

    pistol: {

        id: "pistol",

        name: "PISTOL",

        damage: 34,

        fireRate: 3.2,

        magazine: 12,

        ammo: 12,

        reserve: 48,

        reload: 1.15,

        spread: 0.018,

        pellets: 1,

        range: 25,

        recoil: 0.025

    },

    shotgun: {

        id: "shotgun",

        name: "SHOTGUN",

        damage: 20,

        fireRate: 0.85,

        magazine: 6,

        ammo: 6,

        reserve: 30,

        reload: 1.65,

        spread: 0.09,

        pellets: 7,

        range: 16,

        recoil: 0.09

    },

    rifle: {

        id: "rifle",

        name: "RIFLE",

        damage: 24,

        fireRate: 8,

        magazine: 30,

        ammo: 30,

        reserve: 120,

        reload: 1.8,

        spread: 0.012,

        pellets: 1,

        range: 30,

        recoil: 0.018

    }

};


const weaponOrder = [

    "pistol",

    "shotgun",

    "rifle"

];

let currentWeapon =
    "pistol";


function getWeapon() {

    return WEAPONS[currentWeapon];

}


/* =========================================================
   ZOMBIES
========================================================= */

let zombies = [];


function createZombie(
    x,
    y,
    type = "walker"
) {

    const zombie = {

        id:
            Math.random()
                .toString(36)
                .slice(2),

        x,

        y,

        type,

        health:
            type === "brute"
                ? 180
                : 100,

        maxHealth:
            type === "brute"
                ? 180
                : 100,

        speed:
            type === "brute"
                ? 0.72
                : 1.0 +
                  Math.random() * 0.35,

        radius:
            type === "brute"
                ? 0.34
                : 0.27,

        attackCooldown:
            0.4 +
            Math.random(),

        attackRange:
            type === "brute"
                ? 0.95
                : 0.78,

        damage:
            type === "brute"
                ? 16
                : 9,

        hitFlash: 0,

        angle: 0,

        dead: false,

        deathTimer: 0,

        stagger: 0

    };

    zombies.push(zombie);

}


/* =========================================================
   ZOMBIE SPAWN
========================================================= */

function spawnZombies() {

    zombies = [];

    createZombie(
        11.5,
        2.5
    );

    createZombie(
        15.5,
        4.5
    );

    createZombie(
        17.5,
        8.5
    );

    createZombie(
        8.5,
        11.5
    );

    createZombie(
        13.5,
        12.5
    );

    createZombie(
        4.5,
        12.5
    );

    createZombie(
        16.5,
        2.5,
        "brute"
    );

}


/* =========================================================
   RESET GAME
========================================================= */

function resetGame() {

    player.x = 2.5;

    player.y = 2.5;

    player.angle = 0;

    player.health = 100;

    player.battery = 100;

    player.flashlight = true;

    player.crouching = false;

    player.z = 0;

    player.verticalVelocity = 0;

    player.onGround = true;

    player.recoil = 0;

    player.damageFlash = 0;

    player.bob = 0;

    player.moving = false;


    doorOpen = false;

    doorProgress = 0;

    elapsed = 0;

    apparitionTimer = 0;

    apparitionActive = false;

    interactionTarget = null;

    muzzleFlashTimer = 0;

    reloadTimer = 0;

    shootingCooldown = 0;

    footstepTimer = 0;


    currentWeapon =
        "pistol";


    WEAPONS.pistol.ammo = 12;

    WEAPONS.pistol.reserve = 48;

    WEAPONS.shotgun.ammo = 6;

    WEAPONS.shotgun.reserve = 30;

    WEAPONS.rifle.ammo = 30;

    WEAPONS.rifle.reserve = 120;


    for (
        const key in keys
    ) {

        keys[key] = false;

    }


    mobileInput.x = 0;

    mobileInput.y = 0;

    mobileInput.lookX = 0;

    mobileInput.lookY = 0;

    mobileInput.fire = false;


    if (
        apparitionTimeout
    ) {

        clearTimeout(
            apparitionTimeout
        );

        apparitionTimeout = null;

    }


    spawnZombies();

    updateHUD();

    updateWeaponHUD();

    hideInteraction();

}


/* =========================================================
   START
========================================================= */

function startGame() {

    if (gameStarted) {

        return;

    }

    gameStarted = true;

    paused = false;

    gameOver = false;

    victory = false;


    resetGame();


    if (menu) {

        menu.classList.add(
            "hidden"
        );

    }


    if (pause) {

        pause.classList.add(
            "hidden"
        );

    }


    if (over) {

        over.classList.add(
            "hidden"
        );

    }


    if (objective) {

        objective.textContent =
            "Find a way out.";

    }


    showMessage(
        "THE ROOM IS QUIET.",
        "Find a way out."
    );


    startAudio();

    requestPointerLock();

}


/* =========================================================
   POINTER LOCK
========================================================= */

function requestPointerLock() {

    if (
        !gameStarted ||
        paused ||
        isMobile()
    ) {

        return;

    }

    if (
        !canvas ||
        !canvas.requestPointerLock
    ) {

        return;

    }

    if (
        document.pointerLockElement ===
        canvas
    ) {

        return;

    }

    if (pointerLockPending) {

        return;

    }

    pointerLockPending = true;


    try {

        const result =
            canvas.requestPointerLock();

        if (
            result &&
            result.catch
        ) {

            result.catch(
                () => {}
            );

        }

    } catch (
        error
    ) {

        console.warn(
            "Pointer lock unavailable."
        );

    }


    setTimeout(
        () => {

            pointerLockPending =
                false;

        },
        600
    );

}


/* =========================================================
   MOUSE LOOK
========================================================= */

document.addEventListener(
    "mousemove",
    event => {

        if (
            !gameStarted ||
            paused ||
            gameOver ||
            victory
        ) {

            return;

        }

        if (
            document.pointerLockElement !==
            canvas
        ) {

            return;

        }

        player.angle +=
            event.movementX *
            0.0027;

    }
);


/* =========================================================
   CANVAS CLICK
========================================================= */

if (canvas) {

    canvas.addEventListener(
        "click",
        () => {

            if (
                !gameStarted ||
                paused ||
                gameOver ||
                victory
            ) {

                return;

            }

            if (
                document.pointerLockElement !==
                canvas
            ) {

                requestPointerLock();

                return;

            }

            shoot();

        }
    );


    canvas.addEventListener(
        "contextmenu",
        event => {

            event.preventDefault();

            if (
                gameStarted &&
                !paused
            ) {

                interact();

            }

        }
    );

}


/* =========================================================
   POINTER LOCK CHANGE
========================================================= */

document.addEventListener(
    "pointerlockchange",
    () => {

        pointerLockPending = false;

    }
);


/* =========================================================
   KEY DOWN
========================================================= */

window.addEventListener(
    "keydown",
    event => {

        const key =
            event.key.toLowerCase();


        if (key === "w") {

            keys.w = true;

        }

        if (key === "a") {

            keys.a = true;

        }

        if (key === "s") {

            keys.s = true;

        }

        if (key === "d") {

            keys.d = true;

        }

        if (
            key === "shift"
        ) {

            keys.shift = true;

        }

        if (
            key === "c"
        ) {

            keys.c = true;

            if (
                gameStarted &&
                !paused
            ) {

                player.crouching = true;

            }

        }


        if (
            key === " "
        ) {

            event.preventDefault();

            jump();

        }


        if (
            key === "f"
        ) {

            if (
                gameStarted &&
                !paused
            ) {

                toggleFlashlight();

            }

        }


        if (
            key === "r"
        ) {

            if (
                gameStarted &&
                !paused
            ) {

                reload();

            }

        }


        if (
            key === "e" ||
            key === "enter"
        ) {

            if (
                gameStarted &&
                !paused
            ) {

                interact();

            }

        }


        if (
            key === "1"
        ) {

            switchWeapon(
                "pistol"
            );

        }


        if (
            key === "2"
        ) {

            switchWeapon(
                "shotgun"
            );

        }


        if (
            key === "3"
        ) {

            switchWeapon(
                "rifle"
            );

        }


        if (
            key === "escape"
        ) {

            if (
                gameStarted
            ) {

                togglePause();

            }

        }

    }
);


/* =========================================================
   KEY UP
========================================================= */

window.addEventListener(
    "keyup",
    event => {

        const key =
            event.key.toLowerCase();


        if (key === "w") {

            keys.w = false;

        }

        if (key === "a") {

            keys.a = false;

        }

        if (key === "s") {

            keys.s = false;

        }

        if (key === "d") {

            keys.d = false;

        }

        if (
            key === "shift"
        ) {

            keys.shift = false;

        }

        if (
            key === "c"
        ) {

            keys.c = false;

            player.crouching =
                false;

        }

    }
);


/* =========================================================
   BLUR
========================================================= */

window.addEventListener(
    "blur",
    () => {

        keys.w = false;

        keys.a = false;

        keys.s = false;

        keys.d = false;

        keys.shift = false;

        keys.c = false;

        mobileInput.x = 0;

        mobileInput.y = 0;

        mobileInput.fire = false;

        resetJoystick();

    }
);


/* =========================================================
   MOBILE DETECTION
========================================================= */

function isMobile() {

    return (
        window.matchMedia(
            "(pointer: coarse)"
        ).matches ||
        "ontouchstart" in window
    );

}


/* =========================================================
   MOBILE JOYSTICK
========================================================= */

if (joy) {

    joy.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();

            mobileInput.joystickActive =
                true;

            mobileInput.joystickPointer =
                event.pointerId;

            joy.setPointerCapture(
                event.pointerId
            );

            updateJoystick(
                event
            );

        }
    );


    joy.addEventListener(
        "pointermove",
        event => {

            if (
                !mobileInput.joystickActive ||
                event.pointerId !==
                mobileInput.joystickPointer
            ) {

                return;

            }

            updateJoystick(
                event
            );

        }
    );


    joy.addEventListener(
        "pointerup",
        resetJoystick
    );


    joy.addEventListener(
        "pointercancel",
        resetJoystick
    );

}


function updateJoystick(event) {

    if (!joy) {
        return;
    }

    const rect =
        joy.getBoundingClientRect();

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

    const max =
        rect.width *
        0.34;

    const distance =
        Math.hypot(
            dx,
            dy
        );

    if (
        distance > max
    ) {

        dx =
            dx /
            distance *
            max;

        dy =
            dy /
            distance *
            max;

    }

    mobileInput.x =
        dx / max;

    mobileInput.y =
        dy / max;


    if (knob) {

        knob.style.transform =
            `translate(${dx}px, ${dy}px)`;

    }

}


function resetJoystick() {

    mobileInput.x = 0;

    mobileInput.y = 0;

    mobileInput.joystickActive =
        false;

    mobileInput.joystickPointer =
        null;

    if (knob) {

        knob.style.transform =
            "translate(0px, 0px)";

    }

}


/* =========================================================
   MOBILE LOOK
========================================================= */

if (lookArea) {

    lookArea.addEventListener(
        "pointerdown",
        event => {

            if (
                !gameStarted ||
                paused
            ) {

                return;

            }

            mobileInput.lookPointer =
                event.pointerId;

            mobileInput.lookX =
                event.clientX;

            mobileInput.lookY =
                event.clientY;

            lookArea.setPointerCapture(
                event.pointerId
            );

        }
    );


    lookArea.addEventListener(
        "pointermove",
        event => {

            if (
                mobileInput.lookPointer !==
                event.pointerId
            ) {

                return;

            }

            const dx =
                event.clientX -
                mobileInput.lookX;

            player.angle +=
                dx *
                0.008;

            mobileInput.lookX =
                event.clientX;

            mobileInput.lookY =
                event.clientY;

        }
    );


    lookArea.addEventListener(
        "pointerup",
        () => {

            mobileInput.lookPointer =
                null;

        }
    );


    lookArea.addEventListener(
        "pointercancel",
        () => {

            mobileInput.lookPointer =
                null;

        }
    );

}


/* =========================================================
   MOBILE BUTTON HELPER
========================================================= */

function mobileButton(
    element,
    callback
) {

    if (!element) {
        return;
    }

    element.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();

            callback();

        }
    );

}


/* =========================================================
   MOBILE ACTIONS
========================================================= */

mobileButton(
    fireButton,
    () => {

        mobileInput.fire = true;

        shoot();

    }
);


if (fireButton) {

    fireButton.addEventListener(
        "pointerup",
        () => {

            mobileInput.fire = false;

        }
    );

    fireButton.addEventListener(
        "pointercancel",
        () => {

            mobileInput.fire = false;

        }
    );

}


mobileButton(
    reloadButton,
    reload
);


mobileButton(
    jumpButton,
    jump
);


mobileButton(
    crouchButton,
    () => {

        player.crouching =
            !player.crouching;

    }
);


mobileButton(
    lightButton,
    toggleFlashlight
);


mobileButton(
    interactButton,
    interact
);


mobileButton(
    gunButton,
    cycleWeapon
);


/* =========================================================
   MOVEMENT
========================================================= */

function updateMovement(dt) {

    if (
        !gameStarted ||
        paused ||
        gameOver ||
        victory
    ) {

        return;

    }


    let forward = 0;

    let strafe = 0;


    if (keys.w) {

        forward += 1;

    }

    if (keys.s) {

        forward -= 1;

    }

    if (keys.d) {

        strafe += 1;

    }

    if (keys.a) {

        strafe -= 1;

    }


    /* MOBILE */

    if (
        Math.abs(
            mobileInput.y
        ) > 0.05
    ) {

        forward +=
            -mobileInput.y;

    }


    if (
        Math.abs(
            mobileInput.x
        ) > 0.05
    ) {

        strafe +=
            mobileInput.x;

    }


    if (
        forward === 0 &&
        strafe === 0
    ) {

        player.moving =
            false;

        return;

    }


    const length =
        Math.hypot(
            forward,
            strafe
        );


    forward /=
        length;

    strafe /=
        length;


    let speed =
        WALK_SPEED;


    if (
        keys.shift &&
        !player.crouching
    ) {

        speed =
            RUN_SPEED;

    }


    if (
        player.crouching
    ) {

        speed =
            CROUCH_SPEED;

    }


    const cos =
        Math.cos(
            player.angle
        );

    const sin =
        Math.sin(
            player.angle
        );


    const moveX =
        (
            cos * forward -
            sin * strafe
        ) *
        speed *
        dt;


    const moveY =
        (
            sin * forward +
            cos * strafe
        ) *
        speed *
        dt;


    const nextX =
        player.x +
        moveX;


    const nextY =
        player.y +
        moveY;


    let moved =
        false;


    if (
        canMoveTo(
            nextX,
            player.y
        )
    ) {

        player.x =
            nextX;

        moved = true;

    }


    if (
        canMoveTo(
            player.x,
            nextY
        )
    ) {

        player.y =
            nextY;

        moved = true;

    }


    player.moving =
        moved;


    if (moved) {

        player.bob +=
            dt *
            (
                player.crouching
                    ? 6
                    : 9
            );


        footstepTimer -=
            dt;


        if (
            footstepTimer <= 0
        ) {

            playFootstep();

            footstepTimer =
                player.crouching
                    ? 0.62
                    : keys.shift
                        ? 0.28
                        : 0.42;

        }

    }

}


/* =========================================================
   COLLISION
========================================================= */

function isWall(
    x,
    y
) {

    const mx =
        Math.floor(x);

    const my =
        Math.floor(y);


    if (
        mx < 0 ||
        mx >= MAP_WIDTH ||
        my < 0 ||
        my >= MAP_HEIGHT
    ) {

        return true;

    }


    const tile =
        MAP[my][mx];


    if (
        tile === "#"
    ) {

        return true;

    }


    if (
        tile === "D" &&
        !doorOpen
    ) {

        return true;

    }


    return false;

}


function canMoveTo(
    x,
    y
) {

    const r =
        player.radius;


    return (
        !isWall(
            x - r,
            y - r
        ) &&
        !isWall(
            x + r,
            y - r
        ) &&
        !isWall(
            x - r,
            y + r
        ) &&
        !isWall(
            x + r,
            y + r
        )
    );

}


/* =========================================================
   JUMP
========================================================= */

function jump() {

    if (
        !gameStarted ||
        paused ||
        gameOver ||
        victory
    ) {

        return;

    }


    if (
        player.onGround
    ) {

        player.verticalVelocity =
            JUMP_POWER;

        player.onGround =
            false;

        playJumpSound();

    }

}


/* =========================================================
   VERTICAL MOVEMENT
========================================================= */

function updateVertical(
    dt
) {

    if (
        player.onGround
    ) {

        return;

    }


    player.verticalVelocity -=
        GRAVITY *
        dt;


    player.z +=
        player.verticalVelocity *
        dt;


    if (
        player.z <= 0
    ) {

        player.z = 0;

        player.verticalVelocity =
            0;

        player.onGround =
            true;

    }

}


/* =========================================================
   WEAPON SWITCH
========================================================= */

function switchWeapon(
    id
) {

    if (
        !WEAPONS[id] ||
        currentWeapon === id
    ) {

        return;

    }


    if (
        reloadTimer > 0
    ) {

        return;

    }


    currentWeapon =
        id;


    updateWeaponHUD();

    playWeaponSwitch();

}


function cycleWeapon() {

    const index =
        weaponOrder.indexOf(
            currentWeapon
        );

    const next =
        weaponOrder[
            (
                index + 1
            ) %
            weaponOrder.length
        ];


    switchWeapon(
        next
    );

}


/* =========================================================
   WEAPON HUD
========================================================= */

function updateWeaponHUD() {

    const weapon =
        getWeapon();


    if (weaponName) {

        weaponName.textContent =
            weapon.name;

    }


    if (ammo) {

        if (
            reloadTimer > 0
        ) {

            ammo.textContent =
                "RELOADING...";

        } else {

            ammo.textContent =
                weapon.ammo +
                " / " +
                weapon.reserve;

        }

    }

}


/* =========================================================
   SHOOT
========================================================= */

function shoot() {

    if (
        !gameStarted ||
        paused ||
        gameOver ||
        victory
    ) {

        return;

    }


    if (
        reloadTimer > 0
    ) {

        return;

    }


    const weapon =
        getWeapon();


    if (
        shootingCooldown > 0
    ) {

        return;

    }


    if (
        weapon.ammo <= 0
    ) {

        playEmptySound();

        showMessage(
            "NO AMMO",
            "Press R to reload."
        );

        shootingCooldown =
            0.2;

        return;

    }


    weapon.ammo--;


    shootingCooldown =
        1 /
        weapon.fireRate;


    muzzleFlashTimer =
        0.08;


    player.recoil =
        weapon.recoil;


    playGunshot(
        currentWeapon
    );


    for (
        let i = 0;
        i < weapon.pellets;
        i++
    ) {

        const spread =
            (
                Math.random() -
                0.5
            ) *
            weapon.spread;


        const angle =
            player.angle +
            spread;


        performShotRay(
            angle,
            weapon
        );

    }


    updateWeaponHUD();

}


/* =========================================================
   SHOT RAY
========================================================= */

function performShotRay(
    angle,
    weapon
) {

    const ray =
        castRay(
            angle
        );


    let closestZombie =
        null;

    let closestDistance =
        weapon.range;


    for (
        const zombie of zombies
    ) {

        if (
            zombie.dead
        ) {

            continue;

        }


        const dx =
            zombie.x -
            player.x;

        const dy =
            zombie.y -
            player.y;


        const distance =
            Math.hypot(
                dx,
                dy
            );


        if (
            distance >
            weapon.range
        ) {

            continue;

        }


        const zombieAngle =
            Math.atan2(
                dy,
                dx
            );


        const difference =
            Math.abs(
                normalizeAngle(
                    zombieAngle -
                    angle
                )
            );


        const hitWidth =
            Math.atan(
                zombie.radius /
                Math.max(
                    distance,
                    0.1
                )
            );


        if (
            difference <=
            hitWidth
        ) {

            if (
                distance <
                closestDistance
            ) {

                if (
                    distance <
                    ray.distance
                ) {

                    closestZombie =
                        zombie;

                    closestDistance =
                        distance;

                }

            }

        }

    }


    if (
        closestZombie
    ) {

        damageZombie(
            closestZombie,
            weapon.damage
        );

    }

}


/* =========================================================
   CAST RAY
========================================================= */

function castRay(
    angle
) {

    const sin =
        Math.sin(angle);

    const cos =
        Math.cos(angle);


    let distance = 0;

    const step =
        0.025;


    while (
        distance <
        MAX_RAY_DISTANCE
    ) {

        distance +=
            step;


        const x =
            player.x +
            cos *
            distance;


        const y =
            player.y +
            sin *
            distance;


        const mx =
            Math.floor(x);

        const my =
            Math.floor(y);


        if (
            mx < 0 ||
            mx >= MAP_WIDTH ||
            my < 0 ||
            my >= MAP_HEIGHT
        ) {

            return {

                distance,

                type: "wall",

                mapX: mx,

                mapY: my

            };

        }


        const tile =
            MAP[my][mx];


        if (
            tile === "#"
        ) {

            return {

                distance,

                type: "wall",

                mapX: mx,

                mapY: my

            };

        }


        if (
            tile === "D" &&
            !doorOpen
        ) {

            return {

                distance,

                type: "door",

                mapX: mx,

                mapY: my

            };

        }

    }


    return {

        distance:
            MAX_RAY_DISTANCE,

        type:
            "none"

    };

}


/* =========================================================
   RELOAD
========================================================= */

function reload() {

    if (
        !gameStarted ||
        paused
    ) {

        return;

    }


    const weapon =
        getWeapon();


    if (
        reloadTimer > 0
    ) {

        return;

    }


    if (
        weapon.ammo >=
        weapon.magazine
    ) {

        return;

    }


    if (
        weapon.reserve <= 0
    ) {

        return;

    }


    reloadTimer =
        weapon.reload;


    playReloadSound();

    updateWeaponHUD();

}


/* =========================================================
   UPDATE RELOAD
========================================================= */

function updateReload(
    dt
) {

    if (
        reloadTimer <= 0
    ) {

        return;

    }


    reloadTimer -=
        dt;


    if (
        reloadTimer <= 0
    ) {

        const weapon =
            getWeapon();


        const needed =
            weapon.magazine -
            weapon.ammo;


        const amount =
            Math.min(
                needed,
                weapon.reserve
            );


        weapon.ammo +=
            amount;


        weapon.reserve -=
            amount;


        reloadTimer = 0;


        updateWeaponHUD();

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
        zombie.dead
    ) {

        return;

    }


    zombie.health -=
        damage;


    zombie.hitFlash =
        0.12;


    zombie.stagger =
        0.08;


    playZombieHit();


    if (
        zombie.health <= 0
    ) {

        zombie.health = 0;

        zombie.dead = true;

        zombie.deathTimer =
            1.2;


        playZombieDeath();

        checkVictory();

    }

}


/* =========================================================
   ZOMBIE AI
========================================================= */

function updateZombies(
    dt
) {

    if (
        !gameStarted ||
        paused ||
        gameOver ||
        victory
    ) {

        return;

    }


    for (
        const zombie of zombies
    ) {

        if (
            zombie.dead
        ) {

            zombie.deathTimer -=
                dt;

            continue;

        }


        zombie.hitFlash =
            Math.max(
                0,
                zombie.hitFlash -
                dt
            );


        zombie.attackCooldown -=
            dt;


        zombie.stagger =
            Math.max(
                0,
                zombie.stagger -
                dt
            );


        const dx =
            player.x -
            zombie.x;


        const dy =
            player.y -
            zombie.y;


        const distance =
            Math.hypot(
                dx,
                dy
            );


        zombie.angle =
            Math.atan2(
                dy,
                dx
            );


        if (
            distance >
            zombie.attackRange
        ) {

            if (
                zombie.stagger <= 0
            ) {

                const speed =
                    zombie.speed;


                const vx =
                    (
                        dx /
                        Math.max(
                            distance,
                            0.001
                        )
                    ) *
                    speed *
                    dt;


                const vy =
                    (
                        dy /
                        Math.max(
                            distance,
                            0.001
                        )
                    ) *
                    speed *
                    dt;


                const nx =
                    zombie.x +
                    vx;


                const ny =
                    zombie.y +
                    vy;


                if (
                    !isWall(
                        nx,
                        zombie.y
                    )
                ) {

                    zombie.x =
                        nx;

                }


                if (
                    !isWall(
                        zombie.x,
                        ny
                    )
                ) {

                    zombie.y =
                        ny;

                }

            }

        } else {

            if (
                zombie.attackCooldown <= 0
            ) {

                zombieAttack(
                    zombie
                );

                zombie.attackCooldown =
                    zombie.type === "brute"
                        ? 1.25
                        : 0.85;

            }

        }

    }

}


/* =========================================================
   ZOMBIE ATTACK
========================================================= */

function zombieAttack(
    zombie
) {

    if (
        player.crouching
    ) {

        /* Crouching slightly reduces
           zombie hit chance */

        if (
            Math.random() <
            0.35
        ) {

            showMessage(
                "THE ZOMBIE MISSED.",
                ""
            );

            return;

        }

    }


    damagePlayer(
        zombie.damage
    );


    playZombieAttack();

}


/* =========================================================
   PLAYER DAMAGE
========================================================= */

function damagePlayer(
    damage
) {

    if (
        gameOver ||
        victory
    ) {

        return;

    }


    player.health -=
        damage;


    player.health =
        Math.max(
            0,
            player.health
        );


    player.damageFlash =
        0.25;


    if (game) {

        game.classList.add(
            "damage"
        );


        setTimeout(
            () => {

                game.classList.remove(
                    "damage"
                );

            },
            120
        );

    }


    updateHUD();


    if (
        player.health <= 0
    ) {

        die();

    }

}


/* =========================================================
   VICTORY
========================================================= */

function checkVictory() {

    const alive =
        zombies.some(
            zombie =>
                !zombie.dead
        );


    if (
        !alive &&
        doorOpen
    ) {

        setTimeout(
            winGame,
            700
        );

    }

}


/* =========================================================
   WIN
========================================================= */

function winGame() {

    if (
        gameOver ||
        victory
    ) {

        return;

    }


    victory = true;


    if (
        overTitle
    ) {

        overTitle.textContent =
            "YOU ESCAPED";

    }


    if (
        overText
    ) {

        overText.textContent =
            "The room finally lets you leave.";

    }


    if (over) {

        over.classList.remove(
            "hidden"
        );

    }


    releasePointerLock();

}


/* =========================================================
   DEATH
========================================================= */

function die() {

    if (
        gameOver
    ) {

        return;

    }


    gameOver = true;


    if (
        overTitle
    ) {

        overTitle.textContent =
            "YOU DIED";

    }


    if (
        overText
    ) {

        overText.textContent =
            "The infected found you.";

    }


    if (over) {

        over.classList.remove(
            "hidden"
        );

    }


    releasePointerLock();

    playDeathSound();

}


/* =========================================================
   DOOR FINDER
========================================================= */

function findDoor() {

    let closest = null;

    let closestDistance =
        Infinity;


    for (
        let y = 0;
        y < MAP_HEIGHT;
        y++
    ) {

        for (
            let x = 0;
            x < MAP_WIDTH;
            x++
        ) {

            if (
                MAP[y][x] !== "D"
            ) {

                continue;

            }


            const dx =
                x + 0.5 -
                player.x;


            const dy =
                y + 0.5 -
                player.y;


            const distance =
                Math.hypot(
                    dx,
                    dy
                );


            if (
                distance <
                closestDistance
            ) {

                closestDistance =
                    distance;


                closest = {

                    x:
                        x + 0.5,

                    y:
                        y + 0.5,

                    distance

                };

            }

        }

    }


    return closest;

}


/* =========================================================
   INTERACTION
========================================================= */

function updateInteraction() {

    if (
        !gameStarted ||
        paused ||
        gameOver ||
        victory
    ) {

        hideInteraction();

        interactionTarget = null;

        return;

    }


    const door =
        findDoor();


    if (
        door &&
        door.distance <
        1.65
    ) {

        const angle =
            Math.atan2(
                door.y -
                player.y,

                door.x -
                player.x
            );


        const difference =
            Math.abs(
                normalizeAngle(
                    angle -
                    player.angle
                )
            );


        if (
            difference <
            0.8
        ) {

            interactionTarget =
                "door";


            if (doorOpen) {

                interactionMain.textContent =
                    "EXIT";

                interactionSub.textContent =
                    "The way is open";


            } else {

                interactionMain.textContent =
                    "OPEN DOOR";

                interactionSub.textContent =
                    isMobile()
                        ? "Press E"
                        : "Press E or ENTER";

            }


            interaction.classList.add(
                "on"
            );


            return;

        }

    }


    interactionTarget =
        null;


    hideInteraction();

}


/* =========================================================
   INTERACT
========================================================= */

function interact() {

    if (
        interactionTarget !==
        "door"
    ) {

        return;

    }


    if (
        !doorOpen
    ) {

        doorOpen = true;

        doorProgress = 1;


        if (objective) {

            objective.textContent =
                "Kill the infected.";

        }


        showMessage(
            "THE DOOR OPENS.",
            "Something is waiting beyond."
        );


        playDoorSound();


        if (game) {

            game.classList.add(
                "shake"
            );


            setTimeout(
                () => {

                    game.classList.remove(
                        "shake"
                    );

                },
                500
            );

        }


        updateInteraction();


        return;

    }


    const alive =
        zombies.some(
            zombie =>
                !zombie.dead
        );


    if (alive) {

        showMessage(
            "YOU CANNOT LEAVE.",
            "Kill everything inside."
        );

        return;

    }


    winGame();

}


/* =========================================================
   FLASHLIGHT
========================================================= */

function toggleFlashlight() {

    if (
        player.battery <= 0
    ) {

        player.flashlight =
            false;


        showMessage(
            "FLASHLIGHT DEAD.",
            "You are not alone."
        );


        return;

    }


    player.flashlight =
        !player.flashlight;


    playFlashlightClick();

}


/* =========================================================
   BATTERY
========================================================= */

function updateBattery(
    dt
) {

    if (
        !player.flashlight
    ) {

        return;

    }


    player.battery -=
        dt *
        0.09;


    player.battery =
        Math.max(
            0,
            player.battery
        );


    if (
        player.battery <= 0
    ) {

        player.flashlight =
            false;


        showMessage(
            "THE FLASHLIGHT DIES.",
            "You are not alone."
        );

    }

}


/* =========================================================
   HUD
========================================================= */

function updateHUD() {

    if (healthFill) {

        healthFill.style.width =
            player.health +
            "%";

    }


    if (healthText) {

        healthText.textContent =
            Math.ceil(
                player.health
            ) +
            " / 100";

    }


    if (batteryFill) {

        batteryFill.style.width =
            player.battery +
            "%";

    }


    if (batteryText) {

        batteryText.textContent =
            Math.ceil(
                player.battery
            ) +
            "%";

    }


    if (
        player.battery <
        20
    ) {

        document.body.classList.add(
            "lowBattery"
        );

    } else {

        document.body.classList.remove(
            "lowBattery"
        );

    }

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    mainText,
    subText
) {

    if (!message) {

        return;

    }


    clearTimeout(
        messageTimer
    );


    message.innerHTML =
        mainText +
        (
            subText
                ? "<small>" +
                  subText +
                  "</small>"
                : ""
        );


    message.classList.add(
        "on"
    );


    messageTimer =
        setTimeout(
            () => {

                message.classList.remove(
                    "on"
                );

            },
            3000
        );

}


function hideInteraction() {

    if (interaction) {

        interaction.classList.remove(
            "on"
        );

    }

}


/* =========================================================
   ANGLE
========================================================= */

function normalizeAngle(
    angle
) {

    while (
        angle >
        Math.PI
    ) {

        angle -=
            Math.PI * 2;

    }


    while (
        angle <
        -Math.PI
    ) {

        angle +=
            Math.PI * 2;

    }


    return angle;

}


/* =========================================================
   HORROR SYSTEM
========================================================= */

function updateHorror(
    dt
) {

    apparitionTimer +=
        dt;


    if (
        !apparitionActive &&
        apparitionTimer >
        15
    ) {

        apparitionTimer =
            0;


        if (
            Math.random() <
            0.5
        ) {

            apparitionActive =
                true;


            playWhisper();


            apparitionTimeout =
                setTimeout(
                    () => {

                        apparitionActive =
                            false;

                        apparitionTimeout =
                            null;

                    },
                    1200
                );

        }

    }

}


/* =========================================================
   RENDER
========================================================= */

function render() {

    if (
        !ctx
    ) {

        return;

    }


    ctx.clearRect(
        0,
        0,
        viewWidth,
        viewHeight
    );


    drawBackground();

    drawWorld();

    drawZombies();

    drawWeapon();

    drawFlashlightEffect();

    drawApparition();

    drawDamageEffect();

}


/* =========================================================
   BACKGROUND
========================================================= */

function drawBackground() {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            viewHeight
        );


    if (
        player.flashlight
    ) {

        gradient.addColorStop(
            0,
            "#080808"
        );

        gradient.addColorStop(
            0.5,
            "#161616"
        );

        gradient.addColorStop(
            1,
            "#020202"
        );

    } else {

        gradient.addColorStop(
            0,
            "#010101"
        );

        gradient.addColorStop(
            1,
            "#000000"
        );

    }


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        viewWidth,
        viewHeight
    );

}


/* =========================================================
   WORLD
========================================================= */

function drawWorld() {

    const columns =
        Math.min(
            900,
            Math.max(
                320,
                Math.floor(
                    viewWidth /
                    1.5
                )
            )
        );


    const columnWidth =
        viewWidth /
        columns;


    for (
        let column = 0;
        column < columns;
        column++
    ) {

        const percent =
            column /
            columns;


        const rayAngle =
            player.angle -
            FOV / 2 +
            percent *
            FOV;


        const ray =
            castRay(
                rayAngle
            );


        const corrected =
            ray.distance *
            Math.cos(
                rayAngle -
                player.angle
            );


        const safe =
            Math.max(
                0.05,
                corrected
            );


        let wallHeight =
            viewHeight /
            safe;


        if (
            wallHeight >
            viewHeight *
            2.4
        ) {

            wallHeight =
                viewHeight *
                2.4;

        }


        const crouchOffset =
            player.crouching
                ? viewHeight *
                  0.07
                : 0;


        const jumpOffset =
            player.z *
            viewHeight *
            0.14;


        const top =
            viewHeight / 2 -
            wallHeight / 2 +
            crouchOffset +
            jumpOffset;


        ctx.fillStyle =
            wallShade(
                safe,
                ray.type
            );


        ctx.fillRect(
            column *
                columnWidth,

            top,

            columnWidth + 1,

            wallHeight
        );

    }

}


/* =========================================================
   WALL SHADE
========================================================= */

function wallShade(
    distance,
    type
) {

    let light =
        150 /
        Math.max(
            1,
            distance *
            distance
        );


    if (
        player.flashlight
    ) {

        light *= 4.2;

    } else {

        light *= 0.22;

    }


    light =
        Math.max(
            4,
            Math.min(
                125,
                light
            )
        );


    if (
        type === "door"
    ) {

        light *=
            0.55;

    }


    const value =
        Math.floor(
            light
        );


    if (
        type === "door"
    ) {

        return (
            "rgb(" +
            value +
            "," +
            Math.floor(
                value * 0.72
            ) +
            "," +
            Math.floor(
                value * 0.62
            ) +
            ")"
        );

    }


    return (
        "rgb(" +
        value +
        "," +
        value +
        "," +
        value +
        ")"
    );

}


/* =========================================================
   PROJECT WORLD POSITION TO SCREEN
========================================================= */

function projectWorld(
    x,
    y,
    height = 0
) {

    const dx =
        x -
        player.x;

    const dy =
        y -
        player.y;


    const distance =
        Math.hypot(
            dx,
            dy
        );


    const angle =
        Math.atan2(
            dy,
            dx
        );


    const relative =
        normalizeAngle(
            angle -
            player.angle
        );


    if (
        Math.abs(relative) >
        FOV * 0.72
    ) {

        return null;

    }


    const corrected =
        distance *
        Math.cos(
            relative
        );


    if (
        corrected <=
        0.1
    ) {

        return null;

    }


    const screenX =
        viewWidth / 2 +
        (
            relative /
            (FOV / 2)
        ) *
        (
            viewWidth / 2
        );


    const scale =
        viewHeight /
        corrected;


    const screenY =
        viewHeight / 2 -
        height *
        scale;


    return {

        x:
            screenX,

        y:
            screenY,

        distance:

            distance,

        corrected:

            corrected,

        scale:

            scale

    };

}


/* =========================================================
   ZOMBIE RENDER
========================================================= */

function drawZombies() {

    const visible =
        [];


    for (
        const zombie of zombies
    ) {

        if (
            zombie.dead &&
            zombie.deathTimer <= 0
        ) {

            continue;

        }


        const projection =
            projectWorld(
                zombie.x,
                zombie.y,
                0
            );


        if (!projection) {

            continue;

        }


        visible.push({

            zombie,

            projection

        });

    }


    visible.sort(
        (
            a,
            b
        ) =>
            b.projection.distance -
            a.projection.distance
    );


    for (
        const item of visible
    ) {

        drawZombie(
            item.zombie,
            item.projection
        );

    }

}


/* =========================================================
   DRAW SINGLE ZOMBIE
========================================================= */

function drawZombie(
    zombie,
    p
) {

    const distance =
        p.corrected;


    const size =
        Math.min(
            viewHeight *
            0.9,

            viewHeight /
            Math.max(
                0.3,
                distance
            )
        );


    const centerX =
        p.x;


    const baseY =
        viewHeight / 2 +
        size *
        0.45;


    const bodyHeight =
        size *
        0.55;


    const bodyWidth =
        size *
        0.28;


    const headSize =
        size *
        0.18;


    let alpha =
        1;


    if (
        zombie.dead
    ) {

        alpha =
            Math.max(
                0,
                zombie.deathTimer
            );

    }


    ctx.save();

    ctx.globalAlpha =
        alpha;


    if (
        zombie.hitFlash >
        0
    ) {

        ctx.fillStyle =
            "#ffffff";

    } else if (
        zombie.type ===
        "brute"
    ) {

        ctx.fillStyle =
            "#401515";

    } else {

        ctx.fillStyle =
            "#222";

    }


    /* BODY */

    ctx.fillRect(
        centerX -
        bodyWidth / 2,

        baseY -
        bodyHeight,

        bodyWidth,

        bodyHeight
    );


    /* SHOULDERS */

    ctx.fillRect(
        centerX -
        bodyWidth * 0.72,

        baseY -
        bodyHeight * 0.82,

        bodyWidth * 1.44,

        bodyHeight * 0.13
    );


    /* HEAD */

    ctx.beginPath();

    ctx.arc(
        centerX,

        baseY -
        bodyHeight -
        headSize * 0.55,

        headSize,

        0,
        Math.PI * 2
    );

    ctx.fill();


    /* EYES */

    const eyeY =
        baseY -
        bodyHeight -
        headSize *
        0.55;


    ctx.fillStyle =
        "#d60000";


    ctx.beginPath();

    ctx.arc(
        centerX -
        headSize *
        0.35,

        eyeY,

        Math.max(
            1,
            headSize *
            0.13
        ),

        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        centerX +
        headSize *
        0.35,

        eyeY,

        Math.max(
            1,
            headSize *
            0.13
        ),

        0,
        Math.PI * 2
    );

    ctx.fill();


    /* ARMS */

    ctx.strokeStyle =
        zombie.type ===
        "brute"
            ? "#351010"
            : "#151515";

    ctx.lineWidth =
        Math.max(
            2,
            size *
            0.06
        );


    ctx.beginPath();

    ctx.moveTo(
        centerX -
        bodyWidth / 2,

        baseY -
        bodyHeight *
        0.75
    );

    ctx.lineTo(
        centerX -
        bodyWidth,

        baseY -
        bodyHeight *
        0.35
    );

    ctx.stroke();


    ctx.beginPath();

    ctx.moveTo(
        centerX +
        bodyWidth / 2,

        baseY -
        bodyHeight *
        0.75
    );

    ctx.lineTo(
        centerX +
        bodyWidth,

        baseY -
        bodyHeight *
        0.35
    );

    ctx.stroke();


    /* HEALTH BAR */

    const barWidth =
        Math.max(
            30,
            size *
            0.48
        );


    const barHeight =
        Math.max(
            4,
            size *
            0.035
        );


    const barX =
        centerX -
        barWidth / 2;


    const barY =
        baseY -
        bodyHeight -
        headSize *
        2.1;


    ctx.fillStyle =
        "rgba(0,0,0,0.75)";


    ctx.fillRect(
        barX,
        barY,
        barWidth,
        barHeight
    );


    ctx.fillStyle =
        zombie.type ===
        "brute"
            ? "#b00000"
            : "#e00000";


    ctx.fillRect(
        barX,
        barY,
        barWidth *
        (
            zombie.health /
            zombie.maxHealth
        ),
        barHeight
    );


    ctx.restore();

}


/* =========================================================
   WEAPON RENDER
========================================================= */

function drawWeapon() {

    if (
        !gameStarted ||
        gameOver ||
        victory
    ) {

        return;

    }


    const weapon =
        getWeapon();


    const bob =
        player.moving
            ? Math.sin(
                player.bob
              ) *
              5
            : 0;


    const recoil =
        player.recoil *
        200;


    const baseX =
        viewWidth *
        0.72;


    const baseY =
        viewHeight *
        0.98 +
        bob +
        recoil;


    ctx.save();


    ctx.translate(
        baseX,
        baseY
    );


    if (
        currentWeapon ===
        "pistol"
    ) {

        drawPistol();

    }


    if (
        currentWeapon ===
        "shotgun"
    ) {

        drawShotgun();

    }


    if (
        currentWeapon ===
        "rifle"
    ) {

        drawRifle();

    }


    /* MUZZLE FLASH */

    if (
        muzzleFlashTimer >
        0
    ) {

        drawMuzzleFlash();

    }


    ctx.restore();

}


/* =========================================================
   PISTOL
========================================================= */

function drawPistol() {

    ctx.fillStyle =
        "#151515";


    ctx.fillRect(
        -45,
        -105,
        90,
        38
    );


    ctx.fillStyle =
        "#292929";


    ctx.fillRect(
        -20,
        -67,
        40,
        75
    );


    ctx.fillStyle =
        "#070707";


    ctx.fillRect(
        -25,
        -100,
        50,
        10
    );


    ctx.fillStyle =
        "#111";


    ctx.fillRect(
        -17,
        5,
        34,
        70
    );

}


/* =========================================================
   SHOTGUN
========================================================= */

function drawShotgun() {

    ctx.fillStyle =
        "#181818";


    ctx.fillRect(
        -150,
        -100,
        260,
        32
    );


    ctx.fillStyle =
        "#303030";


    ctx.fillRect(
        -80,
        -68,
        90,
        20
    );


    ctx.fillStyle =
        "#0c0c0c";


    ctx.fillRect(
        -10,
        -52,
        48,
        100
    );


    ctx.fillStyle =
        "#090909";


    ctx.fillRect(
        105,
        -95,
        55,
        22
    );

}


/* =========================================================
   RIFLE
========================================================= */

function drawRifle() {

    ctx.fillStyle =
        "#101010";


    ctx.fillRect(
        -220,
        -95,
        370,
        28
    );


    ctx.fillStyle =
        "#292929";


    ctx.fillRect(
        -100,
        -67,
        145,
        18
    );


    ctx.fillStyle =
        "#080808";


    ctx.fillRect(
        -35,
        -49,
        42,
        110
    );


    ctx.fillStyle =
        "#191919";


    ctx.fillRect(
        125,
        -87,
        65,
        14
    );

}


/* =========================================================
   MUZZLE FLASH
========================================================= */

function drawMuzzleFlash() {

    const gradient =
        ctx.createRadialGradient(
            105,
            -95,
            3,
            105,
            -95,
            65
        );


    gradient.addColorStop(
        0,
        "rgba(255,255,210,0.95)"
    );


    gradient.addColorStop(
        0.3,
        "rgba(255,170,50,0.7)"
    );


    gradient.addColorStop(
        1,
        "rgba(255,80,0,0)"
    );


    ctx.fillStyle =
        gradient;


    ctx.beginPath();

    ctx.arc(
        105,
        -95,
        65,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


/* =========================================================
   FLASHLIGHT EFFECT
========================================================= */

function drawFlashlightEffect() {

    if (
        !player.flashlight
    ) {

        return;

    }


    const centerX =
        viewWidth / 2;

    const centerY =
        viewHeight / 2;


    const radius =
        Math.min(
            viewWidth,
            viewHeight
        ) *
        0.48;


    const gradient =
        ctx.createRadialGradient(
            centerX,
            centerY,
            radius *
            0.05,

            centerX,
            centerY,
            radius
        );


    gradient.addColorStop(
        0,
        "rgba(255,255,255,0.04)"
    );


    gradient.addColorStop(
        0.35,
        "rgba(255,255,255,0.015)"
    );


    gradient.addColorStop(
        0.75,
        "rgba(0,0,0,0.20)"
    );


    gradient.addColorStop(
        1,
        "rgba(0,0,0,0.78)"
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        viewWidth,
        viewHeight
    );

}


/* =========================================================
   APPARITION
========================================================= */

function drawApparition() {

    if (
        !apparitionActive
    ) {

        return;

    }


    const alpha =
        0.10 +
        Math.sin(
            elapsed * 13
        ) *
        0.025;


    const x =
        viewWidth / 2;


    const y =
        viewHeight / 2;


    const gradient =
        ctx.createRadialGradient(
            x,
            y,
            10,
            x,
            y,
            250
        );


    gradient.addColorStop(
        0,
        `rgba(220,220,220,${alpha})`
    );


    gradient.addColorStop(
        0.3,
        `rgba(130,130,130,${alpha * 0.5})`
    );


    gradient.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );


    ctx.fillStyle =
        gradient;


    ctx.beginPath();


    ctx.ellipse(
        x,
        y - 20,
        80,
        150,
        0,
        0,
        Math.PI * 2
    );


    ctx.fill();

}


/* =========================================================
   DAMAGE EFFECT
========================================================= */

function drawDamageEffect() {

    if (
        player.damageFlash <= 0
    ) {

        return;

    }


    const alpha =
        Math.min(
            0.5,
            player.damageFlash *
            2
        );


    const gradient =
        ctx.createRadialGradient(
            viewWidth / 2,
            viewHeight / 2,
            20,
            viewWidth / 2,
            viewHeight / 2,
            Math.max(
                viewWidth,
                viewHeight
            )
        );


    gradient.addColorStop(
        0,
        "rgba(150,0,0,0)"
    );


    gradient.addColorStop(
        1,
        `rgba(150,0,0,${alpha})`
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        viewWidth,
        viewHeight
    );

}


/* =========================================================
   UPDATE PLAYER FX
========================================================= */

function updateEffects(
    dt
) {

    player.recoil =
        Math.max(
            0,
            player.recoil -
            dt *
            0.35
        );


    player.damageFlash =
        Math.max(
            0,
            player.damageFlash -
            dt
        );


    muzzleFlashTimer =
        Math.max(
            0,
            muzzleFlashTimer -
            dt
        );


    shootingCooldown =
        Math.max(
            0,
            shootingCooldown -
            dt
        );

}


/* =========================================================
   PAUSE
========================================================= */

function togglePause() {

    if (
        !gameStarted ||
        gameOver ||
        victory
    ) {

        return;

    }


    paused =
        !paused;


    if (
        paused
    ) {

        if (pause) {

            pause.classList.remove(
                "hidden"
            );

        }


        releasePointerLock();

        hideInteraction();

    } else {

        if (pause) {

            pause.classList.add(
                "hidden"
            );

        }


        requestPointerLock();

    }

}


/* =========================================================
   RELEASE POINTER LOCK
========================================================= */

function releasePointerLock() {

    try {

        if (
            document.pointerLockElement
        ) {

            document.exitPointerLock();

        }

    } catch (
        error
    ) {

        /* Ignore */

    }

}


/* =========================================================
   BUTTON EVENTS
========================================================= */

if (startButton) {

    startButton.addEventListener(
        "click",
        startGame
    );

}


if (resumeButton) {

    resumeButton.addEventListener(
        "click",
        () => {

            paused = false;

            if (pause) {

                pause.classList.add(
                    "hidden"
                );

            }

            requestPointerLock();

        }
    );

}


if (restartButton) {

    restartButton.addEventListener(
        "click",
        () => {

            resetGame();

            paused = false;

            gameOver = false;

            victory = false;


            if (pause) {

                pause.classList.add(
                    "hidden"
                );

            }


            showMessage(
                "THE ROOM IS QUIET.",
                "But something feels different."
            );


            requestPointerLock();

        }
    );

}


if (againButton) {

    againButton.addEventListener(
        "click",
        () => {

            if (over) {

                over.classList.add(
                    "hidden"
                );

            }


            resetGame();

            gameStarted = true;

            gameOver = false;

            victory = false;

            paused = false;


            if (menu) {

                menu.classList.add(
                    "hidden"
                );

            }


            requestPointerLock();

        }
    );

}


/* =========================================================
   CONTROLS
========================================================= */

if (controlsButton) {

    controlsButton.addEventListener(
        "click",
        () => {

            if (help) {

                help.classList.remove(
                    "hidden"
                );

            }

        }
    );

}


if (pauseControlsButton) {

    pauseControlsButton.addEventListener(
        "click",
        () => {

            if (help) {

                help.classList.remove(
                    "hidden"
                );

            }

        }
    );

}


if (closeControls) {

    closeControls.addEventListener(
        "click",
        () => {

            if (help) {

                help.classList.add(
                    "hidden"
                );

            }

        }
    );

}


/* =========================================================
   AUDIO
========================================================= */

let audioContext =
    null;

let masterGain =
    null;

let ambientGain =
    null;


/* =========================================================
   START AUDIO
========================================================= */

function startAudio() {

    if (
        audioContext
    ) {

        if (
            audioContext.state ===
            "suspended"
        ) {

            audioContext.resume()
                .catch(
                    () => {}
                );

        }

        return;

    }


    try {

        const Audio =
            window.AudioContext ||
            window.webkitAudioContext;


        if (!Audio) {

            return;

        }


        audioContext =
            new Audio();


        masterGain =
            audioContext.createGain();


        masterGain.gain.value =
            0.45;


        masterGain.connect(
            audioContext.destination
        );


        ambientGain =
            audioContext.createGain();


        ambientGain.gain.value =
            0.035;


        ambientGain.connect(
            masterGain
        );


        startAmbient();

    } catch (
        error
    ) {

        console.warn(
            "Audio unavailable."
        );

    }

}


/* =========================================================
   AMBIENT
========================================================= */

function startAmbient() {

    if (
        !audioContext ||
        !ambientGain
    ) {

        return;

    }


    const oscillator =
        audioContext.createOscillator();


    const gain =
        audioContext.createGain();


    oscillator.type =
        "sine";


    oscillator.frequency.value =
        42;


    gain.gain.value =
        0.16;


    oscillator.connect(
        gain
    );


    gain.connect(
        ambientGain
    );


    oscillator.start();


    const oscillator2 =
        audioContext.createOscillator();


    const gain2 =
        audioContext.createGain();


    oscillator2.type =
        "triangle";


    oscillator2.frequency.value =
        68;


    gain2.gain.value =
        0.035;


    oscillator2.connect(
        gain2
    );


    gain2.connect(
        ambientGain
    );


    oscillator2.start();

}


/* =========================================================
   SIMPLE TONE
========================================================= */

function tone(
    frequency,
    duration,
    volume,
    type = "sine"
) {

    if (
        !audioContext ||
        !masterGain
    ) {

        return;

    }


    const now =
        audioContext.currentTime;


    const oscillator =
        audioContext.createOscillator();


    const gain =
        audioContext.createGain();


    oscillator.type =
        type;


    oscillator.frequency.setValueAtTime(
        frequency,
        now
    );


    gain.gain.setValueAtTime(
        0.0001,
        now
    );


    gain.gain.exponentialRampToValueAtTime(
        volume,
        now + 0.01
    );


    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + duration
    );


    oscillator.connect(
        gain
    );


    gain.connect(
        masterGain
    );


    oscillator.start(now);


    oscillator.stop(
        now +
        duration +
        0.03
    );

}


/* =========================================================
   GUNSHOT
========================================================= */

function playGunshot(
    weapon
) {

    if (!audioContext) {
        return;
    }


    if (
        weapon ===
        "shotgun"
    ) {

        tone(
            65,
            0.25,
            0.30,
            "sawtooth"
        );


        tone(
            180,
            0.08,
            0.18,
            "square"
        );


        return;

    }


    if (
        weapon ===
        "rifle"
    ) {

        tone(
            100,
            0.10,
            0.18,
            "square"
        );


        return;

    }


    tone(
        130,
        0.09,
        0.15,
        "square"
    );

}


/* =========================================================
   FOOTSTEP
========================================================= */

function playFootstep() {

    if (!audioContext) {
        return;
    }


    tone(
        75 +
        Math.random() *
        20,
        0.08,
        0.045,
        "triangle"
    );

}


/* =========================================================
   JUMP SOUND
========================================================= */

function playJumpSound() {

    if (!audioContext) {
        return;
    }


    tone(
        260,
        0.10,
        0.04,
        "sine"
    );

}


/* =========================================================
   DOOR
========================================================= */

function playDoorSound() {

    if (!audioContext) {
        return;
    }


    tone(
        48,
        1.1,
        0.20,
        "sawtooth"
    );


    tone(
        92,
        0.4,
        0.06,
        "triangle"
    );

}


/* =========================================================
   FLASHLIGHT
========================================================= */

function playFlashlightClick() {

    if (!audioContext) {
        return;
    }


    tone(
        150,
        0.05,
        0.05,
        "square"
    );

}


/* =========================================================
   RELOAD
========================================================= */

function playReloadSound() {

    if (!audioContext) {
        return;
    }


    tone(
        500,
        0.05,
        0.04,
        "square"
    );


    setTimeout(
        () => {

            tone(
                280,
                0.07,
                0.04,
                "square"
            );

        },
        150
    );

}


/* =========================================================
   EMPTY
========================================================= */

function playEmptySound() {

    tone(
        180,
        0.04,
        0.045,
        "square"
    );

}


/* =========================================================
   WEAPON SWITCH
========================================================= */

function playWeaponSwitch() {

    tone(
        300,
        0.06,
        0.035,
        "triangle"
    );

}


/* =========================================================
   ZOMBIE HIT
========================================================= */

function playZombieHit() {

    tone(
        90,
        0.08,
        0.06,
        "sawtooth"
    );

}


/* =========================================================
   ZOMBIE ATTACK
========================================================= */

function playZombieAttack() {

    tone(
        55,
        0.20,
        0.08,
        "sawtooth"
    );

}


/* =========================================================
   ZOMBIE DEATH
========================================================= */

function playZombieDeath() {

    tone(
        45,
        0.5,
        0.12,
        "sawtooth"
    );

}


/* =========================================================
   DEATH SOUND
========================================================= */

function playDeathSound() {

    tone(
        35,
        1.0,
        0.20,
        "sawtooth"
    );

}


/* =========================================================
   WHISPER
========================================================= */

function playWhisper() {

    if (!audioContext) {
        return;
    }


    const length =
        Math.floor(
            audioContext.sampleRate *
            1.1
        );


    const buffer =
        audioContext.createBuffer(
            1,
            length,
            audioContext.sampleRate
        );


    const data =
        buffer.getChannelData(0);


    for (
        let i = 0;
        i < length;
        i++
    ) {

        const envelope =
            Math.sin(
                Math.PI *
                i /
                length
            );


        data[i] =
            (
                Math.random() *
                2 -
                1
            ) *
            envelope;

    }


    const source =
        audioContext.createBufferSource();


    source.buffer =
        buffer;


    const filter =
        audioContext.createBiquadFilter();


    filter.type =
        "bandpass";


    filter.frequency.value =
        1100;


    filter.Q.value =
        4;


    const gain =
        audioContext.createGain();


    gain.gain.value =
        0.055;


    source.connect(
        filter
    );


    filter.connect(
        gain
    );


    gain.connect(
        masterGain
    );


    source.start();

}


/* =========================================================
   GAME LOOP
========================================================= */

let lastTime =
    performance.now();


function gameLoop(
    now
) {

    const dt =
        Math.min(
            (
                now -
                lastTime
            ) /
            1000,

            0.05
        );


    lastTime =
        now;


    if (
        gameStarted &&
        !paused &&
        !gameOver &&
        !victory
    ) {

        elapsed +=
            dt;


        updateMovement(
            dt
        );


        updateVertical(
            dt
        );


        updateBattery(
            dt
        );


        updateReload(
            dt
        );


        updateEffects(
            dt
        );


        updateInteraction();


        updateZombies(
            dt
        );


        updateHorror(
            dt
        );


        updateHUD();


        updateWeaponHUD();


        /* MOBILE AUTO FIRE */

        if (
            mobileInput.fire
        ) {

            shoot();

        }

    }


    render();


    requestAnimationFrame(
        gameLoop
    );

}


/* =========================================================
   INITIAL STATE
========================================================= */

resetGame();


if (objective) {

    objective.textContent =
        "Find a way out.";

}


if (menu) {

    menu.classList.remove(
        "hidden"
    );

}


if (pause) {

    pause.classList.add(
        "hidden"
    );

}


if (help) {

    help.classList.add(
        "hidden"
    );

}


if (over) {

    over.classList.add(
        "hidden"
    );

}


/* =========================================================
   START LOOP
========================================================= */

requestAnimationFrame(
    gameLoop
);
