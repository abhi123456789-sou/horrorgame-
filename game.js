"use strict";

/*
===========================================================
 THE LAST ROOM
 COMPLETE HORROR FPS - GAME.JS

 CONTROLS
 ----------------------------------------------------------
 W A S D       Move
 SHIFT         Sprint
 SPACE         Jump
 CTRL          Crouch
 C             Crawl
 MOUSE         Look
 LEFT CLICK    Shoot
 R             Reload
 1             Pistol
 2             Shotgun
 F             Flashlight
 E / ENTER     Interact
 ESC           Pause
===========================================================
*/


/* =========================================================
   DOM
========================================================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;

const game = document.getElementById("game");

const mainMenu = document.getElementById("mainMenu");
const pauseMenu = document.getElementById("pauseMenu");
const controlsPanel = document.getElementById("controlsPanel");

const startButton = document.getElementById("startButton");
const controlsButton = document.getElementById("controlsButton");
const pauseControlsButton =
    document.getElementById("pauseControlsButton");

const closeControls =
    document.getElementById("closeControls");

const resumeButton =
    document.getElementById("resumeButton");

const restartButton =
    document.getElementById("restartButton");

const message =
    document.getElementById("message");

const objective =
    document.getElementById("objective");

const interaction =
    document.getElementById("interaction");

const interactionMain =
    document.getElementById("interactionMain");

const interactionSub =
    document.getElementById("interactionSub");

const batteryFill =
    document.getElementById("batteryFill");


/* =========================================================
   CANVAS
========================================================= */

function resizeCanvas() {

    if (!canvas || !ctx) return;

    const dpr = Math.min(
        window.devicePixelRatio || 1,
        2
    );

    canvas.width =
        Math.floor(window.innerWidth * dpr);

    canvas.height =
        Math.floor(window.innerHeight * dpr);

    canvas.style.width =
        window.innerWidth + "px";

    canvas.style.height =
        window.innerHeight + "px";

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

    "###################",
    "#.................#",
    "#.................#",
    "#...#####D#####...#",
    "#.................#",
    "#.................#",
    "#.....###.........#",
    "#.....#...........#",
    "#.....#...........#",
    "#.................#",
    "#.........#####...#",
    "#.................#",
    "#...####..........#",
    "#.................#",
    "#.................#",
    "###################"

];

const MAP_WIDTH =
    MAP[0].length;

const MAP_HEIGHT =
    MAP.length;

const FOV =
    Math.PI / 3;


/* =========================================================
   PLAYER
========================================================= */

const player = {

    x: 2.5,
    y: 2.5,

    angle: 0,

    radius: 0.20,

    health: 100,
    maxHealth: 100,

    velocityZ: 0,
    z: 0,

    onGround: true,

    crouching: false,
    crawling: false,

    recoil: 0,

    damageFlash: 0

};


/* =========================================================
   GAME STATE
========================================================= */

let gameStarted = false;
let paused = false;

let doorOpen = false;

let flashlightOn = true;
let battery = 100;

let elapsed = 0;

let interactionTarget = null;

let footstepTimer = 0;

let messageTimer = null;

let pointerLockPending = false;

let kills = 0;

let gameOver = false;

let victory = false;


/* =========================================================
   INPUT
========================================================= */

const keys = {

    w: false,
    a: false,
    s: false,
    d: false,

    shift: false,
    space: false,

    ctrl: false,
    c: false

};

let mouseDown = false;


/* =========================================================
   WEAPONS
========================================================= */

const weapons = {

    pistol: {

        name: "9MM PISTOL",

        damage: 34,

        fireRate: 3.2,

        magazineSize: 12,

        ammo: 12,

        reserve: 60,

        reloadTime: 1.2,

        spread: 0.018,

        range: 18,

        pellets: 1,

        color: "#777"

    },

    shotgun: {

        name: "PUMP SHOTGUN",

        damage: 18,

        fireRate: 0.85,

        magazineSize: 6,

        ammo: 6,

        reserve: 30,

        reloadTime: 1.7,

        spread: 0.11,

        range: 14,

        pellets: 7,

        color: "#533b2d"

    }

};

let currentWeapon =
    "pistol";

let fireCooldown = 0;

let reloadTimer = 0;

let isReloading = false;

let muzzleFlash = 0;

let shellParticles = [];

let bulletImpacts = [];


/* =========================================================
   ZOMBIES
========================================================= */

let zombies = [];

let zombieSpawnTimer = 0;

let zombieId = 0;


/* =========================================================
   ZOMBIE DATA
========================================================= */

function createZombie(
    x,
    y,
    type = "normal"
) {

    let hp = 100;
    let speed = 0.65;
    let damage = 8;
    let radius = 0.25;

    if (type === "fast") {

        hp = 70;
        speed = 1.05;
        damage = 6;

    }

    if (type === "brute") {

        hp = 220;
        speed = 0.42;
        damage = 15;
        radius = 0.35;

    }

    return {

        id: zombieId++,

        x,
        y,

        health: hp,
        maxHealth: hp,

        speed,

        damage,

        radius,

        type,

        attackCooldown: 0,

        hitFlash: 0,

        deathTimer: 0,

        dead: false,

        phase: Math.random() * Math.PI * 2,

        walkCycle: Math.random() * 10

    };

}


/* =========================================================
   INITIAL ZOMBIES
========================================================= */

function spawnInitialZombies() {

    zombies = [];

    zombies.push(
        createZombie(
            12.5,
            4.5,
            "normal"
        )
    );

    zombies.push(
        createZombie(
            15.5,
            8.5,
            "normal"
        )
    );

    zombies.push(
        createZombie(
            11.5,
            11.5,
            "fast"
        )
    );

    zombies.push(
        createZombie(
            5.5,
            13.5,
            "brute"
        )
    );

}


/* =========================================================
   RESET
========================================================= */

function resetGame() {

    player.x = 2.5;
    player.y = 2.5;

    player.angle = 0;

    player.health = 100;

    player.velocityZ = 0;
    player.z = 0;

    player.onGround = true;

    player.crouching = false;
    player.crawling = false;

    player.recoil = 0;
    player.damageFlash = 0;

    doorOpen = false;

    flashlightOn = true;
    battery = 100;

    elapsed = 0;

    kills = 0;

    fireCooldown = 0;

    reloadTimer = 0;

    isReloading = false;

    muzzleFlash = 0;

    shellParticles = [];
    bulletImpacts = [];

    currentWeapon = "pistol";

    weapons.pistol.ammo = 12;
    weapons.pistol.reserve = 60;

    weapons.shotgun.ammo = 6;
    weapons.shotgun.reserve = 30;

    interactionTarget = null;

    footstepTimer = 0;

    gameOver = false;
    victory = false;

    zombieSpawnTimer = 0;

    keys.w = false;
    keys.a = false;
    keys.s = false;
    keys.d = false;

    keys.shift = false;
    keys.space = false;

    keys.ctrl = false;
    keys.c = false;

    mouseDown = false;

    spawnInitialZombies();

    updateBatteryUI();
    updateHUD();

    hideInteraction();

    hideMessage();

    if (objective) {

        objective.textContent =
            "Find a way out.";

    }

}


/* =========================================================
   KEYBOARD DOWN
========================================================= */

window.addEventListener(
    "keydown",
    function(event) {

        const key =
            event.key.toLowerCase();


        if (key === "w")
            keys.w = true;

        if (key === "a")
            keys.a = true;

        if (key === "s")
            keys.s = true;

        if (key === "d")
            keys.d = true;


        if (
            key === "shift"
        ) {

            keys.shift = true;

        }


        if (
            key === "control"
        ) {

            keys.ctrl = true;

        }


        if (
            key === "c"
        ) {

            keys.c = true;

        }


        /* =================================================
           JUMP
        ================================================= */

        if (
            key === " " &&
            gameStarted &&
            !paused
        ) {

            event.preventDefault();

            if (
                player.onGround &&
                !player.crawling
            ) {

                player.velocityZ =
                    4.6;

                player.onGround =
                    false;

            }

        }


        /* =================================================
           FLASHLIGHT
        ================================================= */

        if (
            key === "f" &&
            gameStarted &&
            !paused
        ) {

            event.preventDefault();

            toggleFlashlight();

        }


        /* =================================================
           RELOAD
        ================================================= */

        if (
            key === "r" &&
            gameStarted &&
            !paused
        ) {

            event.preventDefault();

            reloadWeapon();

        }


        /* =================================================
           WEAPON 1
        ================================================= */

        if (
            key === "1" &&
            gameStarted &&
            !paused
        ) {

            switchWeapon("pistol");

        }


        /* =================================================
           WEAPON 2
        ================================================= */

        if (
            key === "2" &&
            gameStarted &&
            !paused
        ) {

            switchWeapon("shotgun");

        }


        /* =================================================
           INTERACT
        ================================================= */

        if (
            (key === "e" ||
             key === "enter") &&
            gameStarted &&
            !paused
        ) {

            event.preventDefault();

            updateInteraction();

            interact();

        }


        /* =================================================
           ESC
        ================================================= */

        if (
            key === "escape" &&
            gameStarted
        ) {

            event.preventDefault();

            togglePause();

        }

    }
);


/* =========================================================
   KEYBOARD UP
========================================================= */

window.addEventListener(
    "keyup",
    function(event) {

        const key =
            event.key.toLowerCase();

        if (key === "w")
            keys.w = false;

        if (key === "a")
            keys.a = false;

        if (key === "s")
            keys.s = false;

        if (key === "d")
            keys.d = false;

        if (key === "shift")
            keys.shift = false;

        if (key === "control")
            keys.ctrl = false;

        if (key === "c")
            keys.c = false;

    }
);


/* =========================================================
   BLUR
========================================================= */

window.addEventListener(
    "blur",
    function() {

        Object.keys(keys)
            .forEach(
                key => keys[key] = false
            );

        mouseDown = false;

    }
);


/* =========================================================
   MOUSE LOOK
========================================================= */

document.addEventListener(
    "mousemove",
    function(event) {

        if (
            !gameStarted ||
            paused ||
            gameOver
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
            0.0028;

    }
);


/* =========================================================
   POINTER LOCK
========================================================= */

function requestGamePointerLock() {

    if (
        !gameStarted ||
        paused ||
        gameOver
    ) {

        return;

    }

    if (!canvas) return;

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

        const promise =
            canvas.requestPointerLock();

        if (
            promise &&
            typeof promise.catch ===
            "function"
        ) {

            promise.catch(
                () => {}
            );

        }

    } catch (error) {

        console.warn(
            "Pointer lock failed."
        );

    }

    setTimeout(
        function() {

            pointerLockPending =
                false;

        },
        500
    );

}


/* =========================================================
   MOUSE CLICK FIX
========================================================= */

if (canvas) {

    canvas.addEventListener(
        "mousedown",
        function(event) {

            if (
                !gameStarted ||
                paused ||
                gameOver
            ) {

                return;

            }

            if (
                event.button === 0
            ) {

                mouseDown = true;

                /*
                First click locks mouse.
                */

                if (
                    document.pointerLockElement !==
                    canvas
                ) {

                    requestGamePointerLock();

                    return;

                }

                shoot();

            }

        }
    );


    canvas.addEventListener(
        "mouseup",
        function(event) {

            if (
                event.button === 0
            ) {

                mouseDown = false;

            }

        }
    );


    canvas.addEventListener(
        "click",
        function() {

            if (
                gameStarted &&
                !paused &&
                !gameOver
            ) {

                requestGamePointerLock();

            }

        }
    );

}


/* =========================================================
   POINTER LOCK CHANGE
========================================================= */

document.addEventListener(
    "pointerlockchange",
    function() {

        pointerLockPending =
            false;

        if (!gameStarted)
            return;

        if (
            document.pointerLockElement !==
            canvas
        ) {

            if (!paused && !gameOver) {

                showMessage(
                    "MOUSE UNLOCKED",
                    "Click inside the game to look around."
                );

            }

        } else {

            hideMessage();

        }

    }
);


/* =========================================================
   START BUTTON
========================================================= */

if (startButton) {

    startButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            startGame();

        }
    );

}


/* =========================================================
   START
========================================================= */

function startGame() {

    gameStarted = true;

    paused = false;

    resetGame();

    if (mainMenu) {

        mainMenu.style.transition =
            "opacity 0.6s ease";

        mainMenu.style.opacity =
            "0";

        setTimeout(
            function() {

                mainMenu.classList.add(
                    "hidden"
                );

                mainMenu.style.opacity =
                    "";

            },
            650
        );

    }

    if (objective) {

        objective.textContent =
            "Find a way out.";

    }

    showMessage(
        "THE ROOM IS QUIET",
        "Something is moving in the darkness."
    );

    startAudio();

    requestGamePointerLock();

}


/* =========================================================
   PAUSE
========================================================= */

function togglePause() {

    if (
        !gameStarted ||
        gameOver
    ) {

        return;

    }

    paused =
        !paused;

    if (paused) {

        if (pauseMenu) {

            pauseMenu.classList.remove(
                "hidden"
            );

        }

        if (
            document.pointerLockElement ===
            canvas
        ) {

            try {

                document.exitPointerLock();

            } catch (e) {}

        }

        mouseDown = false;

        hideInteraction();

    } else {

        if (pauseMenu) {

            pauseMenu.classList.add(
                "hidden"
            );

        }

        requestGamePointerLock();

    }

}


/* =========================================================
   RESUME
========================================================= */

if (resumeButton) {

    resumeButton.addEventListener(
        "click",
        function() {

            paused = false;

            if (pauseMenu) {

                pauseMenu.classList.add(
                    "hidden"
                );

            }

            requestGamePointerLock();

        }
    );

}


/* =========================================================
   RESTART
========================================================= */

if (restartButton) {

    restartButton.addEventListener(
        "click",
        function() {

            resetGame();

            paused = false;

            gameStarted = true;

            if (pauseMenu) {

                pauseMenu.classList.add(
                    "hidden"
                );

            }

            showMessage(
                "THE ROOM RESET",
                "They are still here."
            );

            requestGamePointerLock();

        }
    );

}


/* =========================================================
   CONTROLS
========================================================= */

if (controlsButton) {

    controlsButton.addEventListener(
        "click",
        function() {

            if (controlsPanel) {

                controlsPanel.classList.remove(
                    "hidden"
                );

            }

        }
    );

}


if (pauseControlsButton) {

    pauseControlsButton.addEventListener(
        "click",
        function() {

            if (controlsPanel) {

                controlsPanel.classList.remove(
                    "hidden"
                );

            }

        }
    );

}


if (closeControls) {

    closeControls.addEventListener(
        "click",
        function() {

            if (controlsPanel) {

                controlsPanel.classList.add(
                    "hidden"
                );

            }

        }
    );

}


/* =========================================================
   MAP COLLISION
========================================================= */

function isWall(x, y) {

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

    if (tile === "#")
        return true;

    if (
        tile === "D" &&
        !doorOpen
    ) {

        return true;

    }

    return false;

}


function canMoveTo(x, y) {

    const r =
        player.radius;

    return (
        !isWall(x - r, y - r) &&
        !isWall(x + r, y - r) &&
        !isWall(x - r, y + r) &&
        !isWall(x + r, y + r)
    );

}


function canZombieMove(
    zombie,
    x,
    y
) {

    const r =
        zombie.radius;

    return (
        !isWall(x - r, y - r) &&
        !isWall(x + r, y - r) &&
        !isWall(x - r, y + r) &&
        !isWall(x + r, y + r)
    );

}


/* =========================================================
   MOVEMENT
========================================================= */

function updateMovement(dt) {

    let forward = 0;
    let strafe = 0;

    if (keys.w)
        forward += 1;

    if (keys.s)
        forward -= 1;

    if (keys.d)
        strafe += 1;

    if (keys.a)
        strafe -= 1;


    const moving =
        forward !== 0 ||
        strafe !== 0;


    /* =====================================================
       CROUCH / CRAWL
    ===================================================== */

    player.crawling =
        keys.c;

    player.crouching =
        keys.ctrl &&
        !player.crawling;


    if (
        forward === 0 &&
        strafe === 0
    ) {

        applyJumpPhysics(dt);

        return;

    }


    const length =
        Math.hypot(
            forward,
            strafe
        );

    forward /= length;
    strafe /= length;


    let speed =
        2.2;


    if (keys.shift)
        speed = 3.5;


    if (player.crouching)
        speed *= 0.55;


    if (player.crawling)
        speed *= 0.32;


    const cos =
        Math.cos(player.angle);

    const sin =
        Math.sin(player.angle);


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


    let moved = false;


    if (
        canMoveTo(
            player.x + moveX,
            player.y
        )
    ) {

        player.x +=
            moveX;

        moved = true;

    }


    if (
        canMoveTo(
            player.x,
            player.y + moveY
        )
    ) {

        player.y +=
            moveY;

        moved = true;

    }


    if (moved) {

        footstepTimer -=
            dt;

        if (
            footstepTimer <= 0
        ) {

            playFootstep();

            footstepTimer =
                player.crawling
                    ? 0.65
                    : 0.38;

        }

    }


    applyJumpPhysics(dt);

}


function applyJumpPhysics(dt) {

    if (!player.onGround) {

        player.velocityZ -=
            11 * dt;

        player.z +=
            player.velocityZ *
            dt;

        if (
            player.z <= 0
        ) {

            player.z = 0;

            player.velocityZ =
                0;

            player.onGround =
                true;

        }

    }

}


/* =========================================================
   DOOR
========================================================= */

function findDoor() {

    let best = null;

    let bestDistance =
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
                bestDistance
            ) {

                bestDistance =
                    distance;

                best = {

                    x: x + 0.5,
                    y: y + 0.5,
                    distance

                };

            }

        }

    }

    return best;

}


/* =========================================================
   INTERACTION
========================================================= */

function updateInteraction() {

    if (
        !gameStarted ||
        paused ||
        gameOver
    ) {

        hideInteraction();

        return;

    }


    const door =
        findDoor();


    if (
        door &&
        door.distance < 1.6
    ) {

        const angle =
            Math.atan2(
                door.y - player.y,
                door.x - player.x
            );

        const diff =
            Math.abs(
                normalizeAngle(
                    angle -
                    player.angle
                )
            );


        if (diff < 0.8) {

            interactionTarget =
                "door";


            if (doorOpen) {

                interactionMain.textContent =
                    "DOOR";

                interactionSub.textContent =
                    "The darkness continues.";

            } else {

                interactionMain.textContent =
                    "OPEN DOOR";

                interactionSub.textContent =
                    "PRESS E / ENTER";

            }


            interaction.classList.add(
                "visible"
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


    if (!doorOpen) {

        doorOpen = true;

        if (objective) {

            objective.textContent =
                "Survive the room.";

        }

        showMessage(
            "THE DOOR OPENS",
            "Something heard it."
        );

        playDoorSound();

        if (game) {

            game.classList.add(
                "shake"
            );

            setTimeout(
                function() {

                    game.classList.remove(
                        "shake"
                    );

                },
                500
            );

        }


        /* Spawn extra zombies */

        zombies.push(
            createZombie(
                16.5,
                13.5,
                "normal"
            )
        );

        zombies.push(
            createZombie(
                12.5,
                13.5,
                "fast"
            )
        );

        return;

    }


    if (
        doorOpen &&
        door &&
        false
    ) {

        /* Reserved for future ending */

    }

}


/* =========================================================
   FLASHLIGHT
========================================================= */

function toggleFlashlight() {

    if (
        battery <= 0
    ) {

        flashlightOn =
            false;

        showMessage(
            "FLASHLIGHT DEAD",
            "You are not alone."
        );

        return;

    }


    flashlightOn =
        !flashlightOn;

    playFlashlightClick();

}


/* =========================================================
   BATTERY
========================================================= */

function updateBattery(dt) {

    if (!flashlightOn)
        return;

    battery -=
        dt * 0.11;

    battery =
        Math.max(
            0,
            battery
        );

    if (
        battery <= 0
    ) {

        flashlightOn =
            false;

        showMessage(
            "FLASHLIGHT DIED",
            "Darkness is closing in."
        );

    }

    updateBatteryUI();

}


function updateBatteryUI() {

    if (!batteryFill)
        return;

    batteryFill.style.width =
        Math.max(
            0,
            Math.min(
                100,
                battery
            )
        ) + "%";

}


/* =========================================================
   WEAPON SWITCH
========================================================= */

function switchWeapon(
    weapon
) {

    if (
        !weapons[weapon]
    ) {

        return;

    }

    if (
        currentWeapon ===
        weapon
    ) {

        return;

    }

    if (isReloading)
        return;

    currentWeapon =
        weapon;

    fireCooldown =
        0;

    showMessage(
        weapons[weapon].name,
        "Weapon equipped."
    );

    playWeaponSwitch();

}


/* =========================================================
   RELOAD
========================================================= */

function reloadWeapon() {

    if (
        isReloading ||
        !gameStarted ||
        paused
    ) {

        return;

    }


    const weapon =
        weapons[currentWeapon];


    if (
        weapon.ammo >=
        weapon.magazineSize
    ) {

        return;

    }


    if (
        weapon.reserve <= 0
    ) {

        showMessage(
            "NO AMMUNITION",
            "Find more ammo."
        );

        return;

    }


    isReloading =
        true;

    reloadTimer =
        weapon.reloadTime;

    playReloadSound();

}


/* =========================================================
   FINISH RELOAD
========================================================= */

function finishReload() {

    const weapon =
        weapons[currentWeapon];

    const needed =
        weapon.magazineSize -
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

    isReloading =
        false;

}


/* =========================================================
   SHOOT
========================================================= */

function shoot() {

    if (
        !gameStarted ||
        paused ||
        gameOver
    ) {

        return;

    }


    if (
        isReloading
    ) {

        return;

    }


    if (
        fireCooldown > 0
    ) {

        return;

    }


    const weapon =
        weapons[currentWeapon];


    if (
        weapon.ammo <= 0
    ) {

        playEmptyWeapon();

        reloadWeapon();

        return;

    }


    weapon.ammo--;

    fireCooldown =
        1 /
        weapon.fireRate;


    muzzleFlash =
        0.09;


    player.recoil =
        currentWeapon ===
        "shotgun"
            ? 0.12
            : 0.045;


    playWeaponShot();


    for (
        let pellet = 0;
        pellet < weapon.pellets;
        pellet++
    ) {

        const spread =
            (
                Math.random() -
                0.5
            ) *
            weapon.spread;


        const rayAngle =
            player.angle +
            spread;


        performShotRay(
            rayAngle,
            weapon
        );

    }


    if (
        weapon.ammo === 0
    ) {

        setTimeout(
            function() {

                if (
                    gameStarted &&
                    !paused
                ) {

                    reloadWeapon();

                }

            },
            120
        );

    }

}


/* =========================================================
   SHOOT RAY
========================================================= */

function performShotRay(
    angle,
    weapon
) {

    const step =
        0.035;

    for (
        let distance = 0.2;
        distance < weapon.range;
        distance += step
    ) {

        const x =
            player.x +
            Math.cos(angle) *
            distance;

        const y =
            player.y +
            Math.sin(angle) *
            distance;


        if (
            isWall(x, y)
        ) {

            bulletImpacts.push({

                x,
                y,

                life: 0.4

            });

            return;

        }


        for (
            const zombie of zombies
        ) {

            if (
                zombie.dead
            ) {

                continue;

            }


            const dx =
                zombie.x - x;

            const dy =
                zombie.y - y;


            if (
                Math.hypot(
                    dx,
                    dy
                ) <
                zombie.radius
            ) {

                damageZombie(
                    zombie,
                    weapon.damage
                );

                bulletImpacts.push({

                    x,
                    y,

                    life: 0.35,

                    blood: true

                });

                return;

            }

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

    zombie.health -=
        damage;

    zombie.hitFlash =
        0.12;


    if (
        zombie.health <= 0
    ) {

        zombie.health = 0;

        zombie.dead =
            true;

        zombie.deathTimer =
            1.0;

        kills++;

        showMessage(
            "ZOMBIE DOWN",
            "Kills: " + kills
        );

        playZombieDeath();

    } else {

        playZombieHit();

    }

    updateHUD();

}


/* =========================================================
   ZOMBIE AI
========================================================= */

function updateZombies(dt) {

    for (
        const zombie of zombies
    ) {

        zombie.hitFlash =
            Math.max(
                0,
                zombie.hitFlash -
                dt
            );


        if (
            zombie.dead
        ) {

            zombie.deathTimer -=
                dt;

            continue;

        }


        zombie.attackCooldown -=
            dt;

        zombie.walkCycle +=
            dt * 8;


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


        /* =================================================
           ATTACK
        ================================================= */

        if (
            distance <
            0.85
        ) {

            if (
                zombie.attackCooldown <=
                0
            ) {

                damagePlayer(
                    zombie.damage
                );

                zombie.attackCooldown =
                    1.0;

            }

            continue;

        }


        /* =================================================
           MOVE
        ================================================= */

        const dirX =
            dx /
            Math.max(
                distance,
                0.001
            );

        const dirY =
            dy /
            Math.max(
                distance,
                0.001
            );


        const speed =
            zombie.speed *
            dt;


        const nextX =
            zombie.x +
            dirX *
            speed;


        const nextY =
            zombie.y +
            dirY *
            speed;


        if (
            canZombieMove(
                zombie,
                nextX,
                zombie.y
            )
        ) {

            zombie.x =
                nextX;

        }


        if (
            canZombieMove(
                zombie,
                zombie.x,
                nextY
            )
        ) {

            zombie.y =
                nextY;

        }

    }


    /* Remove old dead zombies */

    zombies =
        zombies.filter(
            zombie =>
                !zombie.dead ||
                zombie.deathTimer > 0
        );

}


/* =========================================================
   PLAYER DAMAGE
========================================================= */

function damagePlayer(
    amount
) {

    if (gameOver)
        return;


    player.health -=
        amount;

    player.health =
        Math.max(
            0,
            player.health
        );


    player.damageFlash =
        0.25;


    playPlayerDamage();


    if (
        player.health <= 0
    ) {

        triggerGameOver();

    }


    updateHUD();

}


/* =========================================================
   GAME OVER
========================================================= */

function triggerGameOver() {

    gameOver = true;

    mouseDown = false;

    if (
        document.pointerLockElement ===
        canvas
    ) {

        try {

            document.exitPointerLock();

        } catch (e) {}

    }


    showMessage(
        "YOU DIED",
        "The room has claimed you."
    );


    if (objective) {

        objective.textContent =
            "YOU DIED — PRESS RESTART";

    }

}


/* =========================================================
   HUD
========================================================= */

let hudCreated =
    false;


function createHUD() {

    if (hudCreated)
        return;

    hudCreated = true;


    const hud =
        document.createElement(
            "div"
        );

    hud.id =
        "fpsHUD";


    hud.innerHTML = `

        <div id="healthHUD">

            <div class="hudTitle">
                HEALTH
            </div>

            <div class="healthBar">
                <div
                    id="healthFill"
                    class="healthFill">
                </div>
            </div>

            <div
                id="healthText"
                class="hudValue">
                100 / 100
            </div>

        </div>


        <div id="weaponHUD">

            <div
                id="weaponName">
                9MM PISTOL
            </div>

            <div
                id="ammoText">
                12 / 60
            </div>

        </div>


        <div id="killHUD">

            KILLS:
            <span id="killText">
                0
            </span>

        </div>


        <div id="crosshair">

            <span class="ch ch1"></span>
            <span class="ch ch2"></span>
            <span class="ch ch3"></span>
            <span class="ch ch4"></span>

        </div>


        <div
            id="damageOverlay">
        </div>

    `;


    document.body.appendChild(
        hud
    );


    const style =
        document.createElement(
            "style"
        );


    style.textContent = `

        #fpsHUD {
            position: fixed;
            inset: 0;
            z-index: 1000;
            pointer-events: none;
            font-family: Arial, sans-serif;
        }

        #healthHUD {
            position: absolute;
            left: 28px;
            bottom: 28px;
            width: 220px;
            color: #eee;
            text-shadow: 0 2px 4px #000;
        }

        .hudTitle {
            font-size: 11px;
            letter-spacing: 4px;
            margin-bottom: 6px;
            opacity: .75;
        }

        .healthBar {
            width: 100%;
            height: 12px;
            border: 1px solid rgba(255,255,255,.35);
            background: rgba(0,0,0,.65);
        }

        .healthFill {
            width: 100%;
            height: 100%;
            background: #b01818;
            transition: width .15s;
        }

        .hudValue {
            font-size: 12px;
            margin-top: 5px;
            letter-spacing: 2px;
        }

        #weaponHUD {
            position: absolute;
            right: 35px;
            bottom: 28px;
            text-align: right;
            color: #eee;
            text-shadow: 0 2px 4px #000;
        }

        #weaponName {
            font-size: 13px;
            letter-spacing: 3px;
            margin-bottom: 5px;
        }

        #ammoText {
            font-size: 28px;
            font-weight: bold;
        }

        #killHUD {
            position: absolute;
            right: 35px;
            top: 30px;
            color: #eee;
            font-size: 13px;
            letter-spacing: 3px;
        }

        #killText {
            font-weight: bold;
            font-size: 18px;
        }

        #crosshair {
            position: absolute;
            left: 50%;
            top: 50%;
            width: 30px;
            height: 30px;
            transform: translate(-50%, -50%);
        }

        .ch {
            position: absolute;
            background: rgba(255,255,255,.85);
        }

        .ch1 {
            width: 2px;
            height: 8px;
            left: 14px;
            top: 1px;
        }

        .ch2 {
            width: 2px;
            height: 8px;
            left: 14px;
            bottom: 1px;
        }

        .ch3 {
            width: 8px;
            height: 2px;
            left: 1px;
            top: 14px;
        }

        .ch4 {
            width: 8px;
            height: 2px;
            right: 1px;
            top: 14px;
        }

        #damageOverlay {
            position: absolute;
            inset: 0;
            background: radial-gradient(
                ellipse at center,
                transparent 35%,
                rgba(120,0,0,.75)
            );
            opacity: 0;
            transition: opacity .08s;
        }

        #zombieLayer {
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 900;
        }

        .zombieBar {
            position: absolute;
            height: 5px;
            background: rgba(0,0,0,.8);
            border: 1px solid rgba(255,255,255,.35);
        }

        .zombieBarFill {
            height: 100%;
            background: #c22;
        }

    `;


    document.head.appendChild(
        style
    );


    const zombieLayer =
        document.createElement(
            "div"
        );

    zombieLayer.id =
        "zombieLayer";

    document.body.appendChild(
        zombieLayer
    );

}


function updateHUD() {

    createHUD();


    const healthFill =
        document.getElementById(
            "healthFill"
        );

    const healthText =
        document.getElementById(
            "healthText"
        );

    const weaponName =
        document.getElementById(
            "weaponName"
        );

    const ammoText =
        document.getElementById(
            "ammoText"
        );

    const killText =
        document.getElementById(
            "killText"
        );

    const damageOverlay =
        document.getElementById(
            "damageOverlay"
        );


    if (healthFill) {

        healthFill.style.width =
            (
                player.health /
                player.maxHealth *
                100
            ) + "%";

    }


    if (healthText) {

        healthText.textContent =
            Math.ceil(
                player.health
            ) +
            " / " +
            player.maxHealth;

    }


    const weapon =
        weapons[currentWeapon];


    if (weaponName) {

        weaponName.textContent =
            weapon.name;

    }


    if (ammoText) {

        ammoText.textContent =
            weapon.ammo +
            " / " +
            weapon.reserve;

    }


    if (killText) {

        killText.textContent =
            kills;

    }


    if (damageOverlay) {

        damageOverlay.style.opacity =
            player.damageFlash >
            0
                ? "1"
                : "0";

    }

}


/* =========================================================
   ZOMBIE RENDER LAYER
========================================================= */

function renderZombies2D() {

    const layer =
        document.getElementById(
            "zombieLayer"
        );

    if (!layer)
        return;


    layer.innerHTML =
        "";


    const width =
        window.innerWidth;

    const height =
        window.innerHeight;


    const visible =
        zombies
            .map(
                zombie => {

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

                    const angle =
                        normalizeAngle(
                            Math.atan2(
                                dy,
                                dx
                            ) -
                            player.angle
                        );

                    return {

                        zombie,
                        distance,
                        angle

                    };

                }
            )
            .filter(
                item =>
                    Math.abs(
                        item.angle
                    ) <
                    FOV * 0.72
            )
            .sort(
                (a,b) =>
                    b.distance -
                    a.distance
            );


    for (
        const item of visible
    ) {

        const zombie =
            item.zombie;

        const distance =
            Math.max(
                0.4,
                item.distance
            );


        const screenX =
            width / 2 +
            (
                item.angle /
                (FOV / 2)
            ) *
            (
                width / 2
            );


        const size =
            Math.min(
                520,
                height /
                distance *
                0.95
            );


        const bottom =
            height / 2 +
            size * 0.38 -
            player.z * 110;


        drawZombieSprite(
            layer,
            zombie,
            screenX,
            bottom,
            size
        );

    }

}


/* =========================================================
   ZOMBIE SPRITE
========================================================= */

function drawZombieSprite(
    layer,
    zombie,
    x,
    bottom,
    size
) {

    const div =
        document.createElement(
            "div"
        );


    div.style.position =
        "absolute";

    div.style.left =
        (
            x -
            size * 0.25
        ) + "px";

    div.style.top =
        (
            bottom -
            size
        ) + "px";

    div.style.width =
        (
            size * 0.5
        ) + "px";

    div.style.height =
        size + "px";


    const hpPercent =
        zombie.health /
        zombie.maxHealth;


    const dead =
        zombie.dead;


    div.innerHTML = `

        <div style="
            position:absolute;
            left:20%;
            top:0;
            width:60%;
            height:18%;
            border-radius:50%;
            background:
                radial-gradient(
                    circle at 35% 35%,
                    #aaa 0%,
                    #555 30%,
                    #181818 72%
                );
            box-shadow:
                0 0 20px rgba(120,0,0,.35);
        ">

            <div style="
                position:absolute;
                left:24%;
                top:44%;
                width:10%;
                height:8%;
                background:#e22;
                box-shadow:
                    55% 0 0 #e22;
            "></div>

        </div>


        <div style="
            position:absolute;
            left:24%;
            top:16%;
            width:52%;
            height:48%;
            background:
                linear-gradient(
                    90deg,
                    #151515,
                    #3b3b3b,
                    #111
                );
            border-radius:
                18px 18px 8px 8px;
            transform:
                rotate(${Math.sin(
                    zombie.walkCycle
                ) * 3}deg);
        "></div>


        <div style="
            position:absolute;
            left:10%;
            top:22%;
            width:25%;
            height:48%;
            background:#292929;
            border-radius:50%;
            transform:
                rotate(${15 +
                Math.sin(
                    zombie.walkCycle
                ) * 12}deg);
        "></div>


        <div style="
            position:absolute;
            right:10%;
            top:22%;
            width:25%;
            height:48%;
            background:#292929;
            border-radius:50%;
            transform:
                rotate(${-15 -
                Math.sin(
                    zombie.walkCycle
                ) * 12}deg);
        "></div>


        <div style="
            position:absolute;
            left:27%;
            bottom:0;
            width:20%;
            height:40%;
            background:#202020;
            transform:
                rotate(${-
                4 -
                Math.sin(
                    zombie.walkCycle
                ) * 5}deg);
        "></div>


        <div style="
            position:absolute;
            right:27%;
            bottom:0;
            width:20%;
            height:40%;
            background:#202020;
            transform:
                rotate(${
                4 +
                Math.sin(
                    zombie.walkCycle
                ) * 5}deg);
        "></div>


        <div class="zombieBar"
             style="
                position:absolute;
                left:5%;
                top:-12px;
                width:90%;
             ">

            <div
                class="zombieBarFill"
                style="
                    width:${hpPercent * 100}%;
                ">
            </div>

        </div>

    `;


    if (zombie.hitFlash > 0) {

        div.style.filter =
            "brightness(2.5) saturate(2)";

    }


    if (dead) {

        div.style.transform =
            "rotate(90deg)";

        div.style.opacity =
            String(
                Math.max(
                    0,
                    zombie.deathTimer
                )
            );

    }


    layer.appendChild(
        div
    );

}


/* =========================================================
   RAYCAST
========================================================= */

function castRay(angle) {

    const sin =
        Math.sin(angle);

    const cos =
        Math.cos(angle);

    let distance = 0;

    const maxDistance = 30;

    const step = 0.025;


    while (
        distance <
        maxDistance
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
                type: "wall"

            };

        }


        const tile =
            MAP[my][mx];


        if (
            tile === "#"
        ) {

            return {

                distance,
                type: "wall"

            };

        }


        if (
            tile === "D" &&
            !doorOpen
        ) {

            return {

                distance,
                type: "door"

            };

        }

    }


    return {

        distance: maxDistance,
        type: "none"

    };

}


/* =========================================================
   RENDER
========================================================= */

function render() {

    if (!canvas || !ctx)
        return;


    const width =
        window.innerWidth;

    const height =
        window.innerHeight;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    drawEnvironment(
        width,
        height
    );


    renderZombies2D();


    drawWeapon(
        width,
        height
    );


    drawMuzzleFlash(
        width,
        height
    );


    drawImpacts();


    drawVignette(
        width,
        height
    );

}


/* =========================================================
   ENVIRONMENT
========================================================= */

function drawEnvironment(
    width,
    height
) {

    const horizon =
        height / 2 -
        player.z * 100;


    /* =====================================================
       CEILING
    ===================================================== */

    const ceiling =
        ctx.createLinearGradient(
            0,
            0,
            0,
            horizon
        );

    ceiling.addColorStop(
        0,
        "#020202"
    );

    ceiling.addColorStop(
        1,
        "#111"
    );


    ctx.fillStyle =
        ceiling;

    ctx.fillRect(
        0,
        0,
        width,
        horizon
    );


    /* =====================================================
       FLOOR
    ===================================================== */

    const floor =
        ctx.createLinearGradient(
            0,
            horizon,
            0,
            height
        );

    floor.addColorStop(
        0,
        "#101010"
    );

    floor.addColorStop(
        1,
        "#020202"
    );


    ctx.fillStyle =
        floor;

    ctx.fillRect(
        0,
        horizon,
        width,
        height
    );


    /* =====================================================
       FLOOR GRID / DEPTH
    ===================================================== */

    drawFloorGrid(
        width,
        height,
        horizon
    );


    /* =====================================================
       WALLS
    ===================================================== */

    const columns =
        Math.min(
            1000,
            Math.max(
                400,
                Math.floor(
                    width /
                    1.5
                )
            )
        );


    const columnWidth =
        width /
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


        const correctedDistance =
            ray.distance *
            Math.cos(
                rayAngle -
                player.angle
            );


        const safeDistance =
            Math.max(
                0.05,
                correctedDistance
            );


        const wallHeight =
            Math.min(
                height * 2,
                height /
                safeDistance
            );


        const top =
            horizon -
            wallHeight / 2;


        const shade =
            getWallShade(
                safeDistance,
                ray.type
            );


        ctx.fillStyle =
            shade;


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
   FLOOR GRID
========================================================= */

function drawFloorGrid(
    width,
    height,
    horizon
) {

    ctx.save();

    ctx.globalAlpha =
        flashlightOn
            ? 0.10
            : 0.035;


    for (
        let i = 1;
        i < 18;
        i++
    ) {

        const t =
            i / 18;


        const y =
            horizon +
            Math.pow(
                t,
                2
            ) *
            (
                height -
                horizon
            );


        ctx.strokeStyle =
            "#888";


        ctx.lineWidth =
            1;


        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            width,
            y
        );

        ctx.stroke();

    }


    for (
        let i = -12;
        i <= 12;
        i++
    ) {

        ctx.beginPath();

        ctx.moveTo(
            width / 2,
            horizon
        );

        ctx.lineTo(
            width / 2 +
            i * width / 5,
            height
        );

        ctx.stroke();

    }


    ctx.restore();

}


/* =========================================================
   WALL SHADE
========================================================= */

function getWallShade(
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


    if (flashlightOn) {

        light *= 3.5;

    } else {

        light *= 0.22;

    }


    light =
        Math.max(
            4,
            Math.min(
                135,
                light
            )
        );


    if (
        type === "door"
    ) {

        return (
            "rgb(" +
            Math.floor(
                light *
                0.65
            ) +
            "," +
            Math.floor(
                light *
                0.35
            ) +
            "," +
            Math.floor(
                light *
                0.35
            ) +
            ")"
        );

    }


    const l =
        Math.floor(
            light
        );


    return (
        "rgb(" +
        l +
        "," +
        l +
        "," +
        l +
        ")"
    );

}


/* =========================================================
   WEAPON DRAW
========================================================= */

function drawWeapon(
    width,
    height
) {

    const weapon =
        currentWeapon;


    const recoil =
        player.recoil;


    ctx.save();


    const center =
        width / 2;


    const bottom =
        height +
        recoil * 400;


    if (
        weapon ===
        "pistol"
    ) {

        /* Pistol slide */

        ctx.fillStyle =
            "#191919";

        ctx.beginPath();

        ctx.roundRect(
            center - 105,
            bottom - 245,
            210,
            95,
            12
        );

        ctx.fill();


        /* Slide highlight */

        ctx.fillStyle =
            "#444";

        ctx.fillRect(
            center - 75,
            bottom - 225,
            150,
            14
        );


        /* Grip */

        ctx.fillStyle =
            "#111";

        ctx.beginPath();

        ctx.moveTo(
            center - 52,
            bottom - 160
        );

        ctx.lineTo(
            center + 52,
            bottom - 160
        );

        ctx.lineTo(
            center + 35,
            bottom
        );

        ctx.lineTo(
            center - 35,
            bottom
        );

        ctx.closePath();

        ctx.fill();


        /* Barrel */

        ctx.fillStyle =
            "#333";

        ctx.fillRect(
            center - 24,
            bottom - 265,
            48,
            35
        );

    }


    if (
        weapon ===
        "shotgun"
    ) {

        /* Main receiver */

        ctx.fillStyle =
            "#171717";

        ctx.beginPath();

        ctx.roundRect(
            center - 130,
            bottom - 220,
            260,
            105,
            12
        );

        ctx.fill();


        /* Wooden pump */

        ctx.fillStyle =
            "#543725";

        ctx.fillRect(
            center - 150,
            bottom - 180,
            300,
            40
        );


        /* Barrel */

        ctx.fillStyle =
            "#303030";

        ctx.fillRect(
            center - 18,
            bottom - 290,
            36,
            125
        );


        /* Front */

        ctx.fillStyle =
            "#090909";

        ctx.beginPath();

        ctx.arc(
            center,
            bottom - 290,
            20,
            0,
            Math.PI * 2
        );

        ctx.fill();


        /* Grip */

        ctx.fillStyle =
            "#25170f";

        ctx.beginPath();

        ctx.moveTo(
            center - 45,
            bottom - 120
        );

        ctx.lineTo(
            center + 45,
            bottom - 120
        );

        ctx.lineTo(
            center + 30,
            bottom
        );

        ctx.lineTo(
            center - 30,
            bottom
        );

        ctx.closePath();

        ctx.fill();

    }


    ctx.restore();


    /* =====================================================
       RECOIL DECAY
    ===================================================== */

    player.recoil *=
        0.82;

}


/* =========================================================
   MUZZLE FLASH
========================================================= */

function drawMuzzleFlash(
    width,
    height
) {

    if (
        muzzleFlash <= 0
    ) {

        return;

    }


    ctx.save();


    const cx =
        width / 2;

    const cy =
        height -
        230;


    const gradient =
        ctx.createRadialGradient(
            cx,
            cy,
            5,
            cx,
            cy,
            100
        );


    gradient.addColorStop(
        0,
        "rgba(255,255,220,.9)"
    );

    gradient.addColorStop(
        0.25,
        "rgba(255,180,60,.7)"
    );

    gradient.addColorStop(
        1,
        "rgba(255,70,0,0)"
    );


    ctx.fillStyle =
        gradient;


    ctx.beginPath();

    ctx.arc(
        cx,
        cy,
        100,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();

}


/* =========================================================
   BULLET IMPACTS
========================================================= */

function drawImpacts() {

    for (
        const impact of bulletImpacts
    ) {

        const dx =
            impact.x -
            player.x;

        const dy =
            impact.y -
            player.y;


        const distance =
            Math.hypot(
                dx,
                dy
            );


        const angle =
            normalizeAngle(
                Math.atan2(
                    dy,
                    dx
                ) -
                player.angle
            );


        if (
            Math.abs(angle) >
            FOV / 2
        ) {

            continue;

        }


        const x =
            window.innerWidth / 2 +
            angle /
            (FOV / 2) *
            window.innerWidth /
            2;


        const size =
            Math.max(
                2,
                35 /
                distance
            );


        ctx.fillStyle =
            impact.blood
                ? "#8d1111"
                : "#777";


        ctx.beginPath();

        ctx.arc(
            x,
            window.innerHeight / 2,
            size,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }

}


/* =========================================================
   VIGNETTE
========================================================= */

function drawVignette(
    width,
    height
) {

    const gradient =
        ctx.createRadialGradient(
            width / 2,
            height / 2,
            Math.min(
                width,
                height
            ) * 0.18,
            width / 2,
            height / 2,
            Math.max(
                width,
                height
            ) * 0.7
        );


    gradient.addColorStop(
        0,
        "rgba(0,0,0,0)"
    );

    gradient.addColorStop(
        1,
        flashlightOn
            ? "rgba(0,0,0,.72)"
            : "rgba(0,0,0,.96)"
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        width,
        height
    );

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    mainText,
    subText
) {

    if (!message)
        return;


    clearTimeout(
        messageTimer
    );


    message.innerHTML =
        mainText +
        (
            subText
                ? "<span>" +
                  subText +
                  "</span>"
                : ""
        );


    message.classList.add(
        "visible"
    );


    messageTimer =
        setTimeout(
            function() {

                message.classList.remove(
                    "visible"
                );

            },
            3000
        );

}


function hideMessage() {

    if (!message)
        return;


    clearTimeout(
        messageTimer
    );

    message.classList.remove(
        "visible"
    );

}


function hideInteraction() {

    if (!interaction)
        return;

    interaction.classList.remove(
        "visible"
    );

}


/* =========================================================
   HORROR
========================================================= */

let apparitionTimer = 0;
let apparitionActive = false;


function updateHorror(dt) {

    apparitionTimer +=
        dt;


    if (
        !apparitionActive &&
        apparitionTimer > 20
    ) {

        apparitionTimer = 0;


        if (
            Math.random() <
            0.55
        ) {

            apparitionActive =
                true;


            setTimeout(
                function() {

                    apparitionActive =
                        false;

                },
                1400
            );


            playWhisper();

        }

    }


    if (
        apparitionActive
    ) {

        drawApparition();

    }

}


function drawApparition() {

    const width =
        window.innerWidth;

    const height =
        window.innerHeight;


    const alpha =
        0.08 +
        Math.sin(
            elapsed * 8
        ) *
        0.025;


    const gradient =
        ctx.createRadialGradient(
            width / 2,
            height / 2,
            5,
            width / 2,
            height / 2,
            260
        );


    gradient.addColorStop(
        0,
        "rgba(220,220,220," +
        alpha +
        ")"
    );


    gradient.addColorStop(
        0.4,
        "rgba(100,100,100," +
        alpha *
        0.5 +
        ")"
    );


    gradient.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );


    ctx.fillStyle =
        gradient;


    ctx.beginPath();

    ctx.ellipse(
        width / 2,
        height / 2,
        70,
        160,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

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
   AUDIO
========================================================= */

let audioContext = null;
let masterGain = null;
let ambientGain = null;


/* =========================================================
   START AUDIO
========================================================= */

function startAudio() {

    if (audioContext) {

        if (
            audioContext.state ===
            "suspended"
        ) {

            audioContext
                .resume()
                .catch(
                    () => {}
                );

        }

        return;

    }


    try {

        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();


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
            0.04;


        ambientGain.connect(
            masterGain
        );


        startAmbient();

    } catch (error) {

        console.warn(
            "Audio unavailable."
        );

    }

}


/* =========================================================
   AMBIENT
========================================================= */

function startAmbient() {

    if (!audioContext)
        return;


    const osc =
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


    osc.type =
        "sine";


    osc.frequency.value =
        42;


    gain.gain.value =
        0.15;


    osc.connect(
        gain
    );


    gain.connect(
        ambientGain
    );


    osc.start();


    const osc2 =
        audioContext
            .createOscillator();


    const gain2 =
        audioContext
            .createGain();


    osc2.type =
        "triangle";


    osc2.frequency.value =
        63;


    gain2.gain.value =
        0.035;


    osc2.connect(
        gain2
    );


    gain2.connect(
        ambientGain
    );


    osc2.start();

}


/* =========================================================
   FOOTSTEP
========================================================= */

function playFootstep() {

    if (!audioContext)
        return;


    const now =
        audioContext.currentTime;


    const osc =
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


    osc.type =
        "triangle";


    osc.frequency.value =
        75;


    gain.gain.setValueAtTime(
        0.0001,
        now
    );


    gain.gain.exponentialRampToValueAtTime(
        0.08,
        now + 0.01
    );


    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.09
    );


    osc.connect(
        gain
    );


    gain.connect(
        masterGain
    );


    osc.start(now);

    osc.stop(
        now + 0.1
    );

}


/* =========================================================
   WEAPON SHOT SOUND
========================================================= */

function playWeaponShot() {

    if (!audioContext)
        return;


    const now =
        audioContext.currentTime;


    const duration =
        currentWeapon ===
        "shotgun"
            ? 0.22
            : 0.12;


    const buffer =
        audioContext.createBuffer(
            1,
            Math.floor(
                audioContext.sampleRate *
                duration
            ),
            audioContext.sampleRate
        );


    const data =
        buffer.getChannelData(
            0
        );


    for (
        let i = 0;
        i < data.length;
        i++
    ) {

        const fade =
            1 -
            i /
            data.length;


        data[i] =
            (
                Math.random() *
                2 -
                1
            ) *
            fade *
            fade;

    }


    const source =
        audioContext
            .createBufferSource();


    source.buffer =
        buffer;


    const filter =
        audioContext
            .createBiquadFilter();


    filter.type =
        "lowpass";


    filter.frequency.value =
        currentWeapon ===
        "shotgun"
            ? 1200
            : 2200;


    const gain =
        audioContext
            .createGain();


    gain.gain.value =
        currentWeapon ===
        "shotgun"
            ? 0.55
            : 0.35;


    source.connect(
        filter
    );


    filter.connect(
        gain
    );


    gain.connect(
        masterGain
    );


    source.start(now);

}


/* =========================================================
   RELOAD SOUND
========================================================= */

function playReloadSound() {

    if (!audioContext)
        return;


    const now =
        audioContext.currentTime;


    const osc =
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


    osc.type =
        "square";


    osc.frequency.value =
        180;


    gain.gain.setValueAtTime(
        0.06,
        now
    );


    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.12
    );


    osc.connect(
        gain
    );


    gain.connect(
        masterGain
    );


    osc.start(now);

    osc.stop(
        now + 0.13
    );

}


/* =========================================================
   EMPTY WEAPON
========================================================= */

function playEmptyWeapon() {

    if (!audioContext)
        return;


    const now =
        audioContext.currentTime;


    const osc =
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


    osc.frequency.value =
        100;


    gain.gain.setValueAtTime(
        0.06,
        now
    );


    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.06
    );


    osc.connect(
        gain
    );


    gain.connect(
        masterGain
    );


    osc.start(now);

    osc.stop(
        now + 0.07
    );

}


/* =========================================================
   SWITCH SOUND
========================================================= */

function playWeaponSwitch() {

    if (!audioContext)
        return;


    const now =
        audioContext.currentTime;


    const osc =
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


    osc.type =
        "square";


    osc.frequency.value =
        250;


    gain.gain.setValueAtTime(
        0.04,
        now
    );


    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.08
    );


    osc.connect(
        gain
    );


    gain.connect(
        masterGain
    );


    osc.start(now);

    osc.stop(
        now + 0.09
    );

}


/* =========================================================
   DOOR SOUND
========================================================= */

function playDoorSound() {

    if (!audioContext)
        return;


    const now =
        audioContext.currentTime;


    const osc =
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


    osc.type =
        "sawtooth";


    osc.frequency.setValueAtTime(
        80,
        now
    );


    osc.frequency.exponentialRampToValueAtTime(
        30,
        now + 1
    );


    gain.gain.setValueAtTime(
        0.0001,
        now
    );


    gain.gain.exponentialRampToValueAtTime(
        0.12,
        now + 0.04
    );


    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 1.1
    );


    osc.connect(
        gain
    );


    gain.connect(
        masterGain
    );


    osc.start(now);

    osc.stop(
        now + 1.2
    );

}


/* =========================================================
   FLASHLIGHT SOUND
========================================================= */

function playFlashlightClick() {

    if (!audioContext)
        return;


    const now =
        audioContext.currentTime;


    const osc =
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


    osc.type =
        "square";


    osc.frequency.value =
        140;


    gain.gain.setValueAtTime(
        0.06,
        now
    );


    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.05
    );


    osc.connect(
        gain
    );


    gain.connect(
        masterGain
    );


    osc.start(now);

    osc.stop(
        now + 0.06
    );

}


/* =========================================================
   ZOMBIE HIT
========================================================= */

function playZombieHit() {

    if (!audioContext)
        return;


    const now =
        audioContext.currentTime;


    const osc =
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


    osc.type =
        "sawtooth";


    osc.frequency.value =
        90;


    gain.gain.setValueAtTime(
        0.05,
        now
    );


    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.12
    );


    osc.connect(
        gain
    );


    gain.connect(
        masterGain
    );


    osc.start(now);

    osc.stop(
        now + 0.13
    );

}


/* =========================================================
   ZOMBIE DEATH
========================================================= */

function playZombieDeath() {

    if (!audioContext)
        return;


    const now =
        audioContext.currentTime;


    const osc =
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


    osc.type =
        "sawtooth";


    osc.frequency.setValueAtTime(
        180,
        now
    );


    osc.frequency.exponentialRampToValueAtTime(
        40,
        now + 0.4
    );


    gain.gain.setValueAtTime(
        0.12,
        now
    );


    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.45
    );


    osc.connect(
        gain
    );


    gain.connect(
        masterGain
    );


    osc.start(now);

    osc.stop(
        now + 0.5
    );

}


/* =========================================================
   PLAYER DAMAGE SOUND
========================================================= */

function playPlayerDamage() {

    if (!audioContext)
        return;


    const now =
        audioContext.currentTime;


    const osc =
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


    osc.type =
        "square";


    osc.frequency.value =
        55;


    gain.gain.setValueAtTime(
        0.15,
        now
    );


    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.2
    );


    osc.connect(
        gain
    );


    gain.connect(
        masterGain
    );


    osc.start(now);

    osc.stop(
        now + 0.22
    );

}


/* =========================================================
   WHISPER
========================================================= */

function playWhisper() {

    if (!audioContext)
        return;


    const now =
        audioContext.currentTime;


    const buffer =
        audioContext.createBuffer(
            1,
            Math.floor(
                audioContext.sampleRate *
                1.2
            ),
            audioContext.sampleRate
        );


    const data =
        buffer.getChannelData(
            0
        );


    for (
        let i = 0;
        i < data.length;
        i++
    ) {

        const envelope =
            Math.sin(
                Math.PI *
                i /
                data.length
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
        audioContext
            .createBufferSource();


    source.buffer =
        buffer;


    const filter =
        audioContext
            .createBiquadFilter();


    filter.type =
        "bandpass";


    filter.frequency.value =
        1200;


    filter.Q.value =
        4;


    const gain =
        audioContext
            .createGain();


    gain.gain.value =
        0.08;


    source.connect(
        filter
    );


    filter.connect(
        gain
    );


    gain.connect(
        masterGain
    );


    source.start(now);

}


/* =========================================================
   GAME LOOP
========================================================= */

let lastTime =
    performance.now();


function loop(now) {

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
        !gameOver
    ) {

        elapsed +=
            dt;


        fireCooldown =
            Math.max(
                0,
                fireCooldown -
                dt
            );


        muzzleFlash =
            Math.max(
                0,
                muzzleFlash -
                dt
            );


        player.damageFlash =
            Math.max(
                0,
                player.damageFlash -
                dt
            );


        if (
            isReloading
        ) {

            reloadTimer -=
                dt;


            if (
                reloadTimer <=
                0
            ) {

                finishReload();

            }

        }


        updateMovement(
            dt
        );


        updateBattery(
            dt
        );


        updateInteraction();


        updateZombies(
            dt
        );


        updateHorror(
            dt
        );


        /* Automatic shooting while mouse held */

        if (
            mouseDown &&
            document.pointerLockElement ===
            canvas
        ) {

            shoot();

        }


        /* Bullet impacts */

        bulletImpacts =
            bulletImpacts.filter(
                impact => {

                    impact.life -=
                        dt;

                    return (
                        impact.life >
                        0
                    );

                }
            );


        updateHUD();

    }


    render();


    requestAnimationFrame(
        loop
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

createHUD();

resetGame();

if (objective) {

    objective.textContent =
        "Find a way out.";

}


requestAnimationFrame(
    loop
);
