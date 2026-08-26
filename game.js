"use strict";

/* =========================================================
   THE LAST ROOM
   FULL FPS HORROR VERSION
   ---------------------------------------------------------
   CONTROLS

   W A S D       = Move
   MOUSE         = Look
   LEFT CLICK    = Shoot
   E / ENTER     = Interact
   F             = Flashlight
   R             = Reload
   1             = Pistol
   2             = Shotgun
   ESC           = Pause

   FEATURES
   ---------------------------------------------------------
   - Raycast pseudo 3D
   - First person weapons
   - Pistol
   - Shotgun
   - Shooting / recoil
   - Ammo / reload
   - Zombies
   - Zombie AI
   - Zombie health
   - Player health
   - Zombie damage
   - Zombie death
   - Zombie respawn
   - Hit marker
   - Muzzle flash
   - Damage vignette
   - Crosshair
   - Flashlight
   - Door
   - Horror apparition
   - Ambient audio
========================================================= */


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

    const dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );

    canvas.width =
        Math.floor(
            window.innerWidth * dpr
        );

    canvas.height =
        Math.floor(
            window.innerHeight * dpr
        );

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
    "#...####D####.....#",
    "#.................#",
    "#.................#",
    "#.....###.........#",
    "#.....#...........#",
    "#.....#...........#",
    "#.................#",
    "#.................#",
    "#.........####....#",
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

    angle: Math.PI / 2,

    radius: 0.20,

    health: 100,
    maxHealth: 100,

    kills: 0,

    speed: 2.5

};


/* =========================================================
   GAME STATE
========================================================= */

let gameStarted = false;
let paused = false;
let gameOver = false;

let doorOpen = false;
let doorProgress = 0;

let flashlightOn = true;
let battery = 100;

let elapsed = 0;

let apparitionActive = false;
let apparitionTimer = 0;
let apparitionTimeout = null;

let interactionTarget = null;

let footstepTimer = 0;

let messageTimer = null;

let pointerLockPending = false;

let damageFlash = 0;

let hitMarkerTimer = 0;

let muzzleFlashTimer = 0;

let recoil = 0;

let shakeAmount = 0;

let wave = 1;

let zombiesKilledThisWave = 0;


/* =========================================================
   KEYS
========================================================= */

const keys = {

    w: false,
    a: false,
    s: false,
    d: false

};


/* =========================================================
   WEAPONS
========================================================= */

const weapons = {

    pistol: {

        name: "PISTOL",

        damage: 34,

        fireRate: 0.32,

        magazineSize: 12,

        ammo: 12,

        reserve: 72,

        reloadTime: 1.15,

        spread: 0.025,

        pellets: 1,

        recoil: 5,

        soundFrequency: 145

    },

    shotgun: {

        name: "SHOTGUN",

        damage: 20,

        fireRate: 0.85,

        magazineSize: 6,

        ammo: 6,

        reserve: 36,

        reloadTime: 1.65,

        spread: 0.12,

        pellets: 7,

        recoil: 13,

        soundFrequency: 75

    }

};

let currentWeapon =
    "pistol";

let shooting = false;

let fireCooldown = 0;

let reloadTimer = 0;

let isReloading = false;


/* =========================================================
   ZOMBIES
========================================================= */

const zombies = [];

const zombieSpawnPoints = [

    { x: 15.5, y: 2.5 },
    { x: 16.2, y: 5.5 },
    { x: 13.5, y: 8.5 },
    { x: 15.5, y: 11.5 },
    { x: 11.5, y: 12.5 },
    { x: 8.5, y: 12.5 },
    { x: 3.5, y: 11.5 },
    { x: 10.5, y: 5.5 }

];


/* =========================================================
   CREATE HUD
========================================================= */

function createHUD() {

    if (document.getElementById("fpsHUD")) {
        return;
    }

    const hud =
        document.createElement("div");

    hud.id = "fpsHUD";

    hud.innerHTML = `

        <div id="healthHUD">

            <div class="hudLabel">
                HEALTH
            </div>

            <div class="healthBar">
                <div id="healthFill"></div>
            </div>

            <div id="healthText">
                100 / 100
            </div>

        </div>


        <div id="weaponHUD">

            <div id="weaponName">
                PISTOL
            </div>

            <div id="ammoText">
                12 / 72
            </div>

            <div id="reloadText">
                READY
            </div>

        </div>


        <div id="killHUD">
            ZOMBIES: 0
        </div>


        <div id="waveHUD">
            WAVE 1
        </div>


        <div id="hitMarker">
            ×
        </div>


        <div id="crosshair">

            <span class="chTop"></span>
            <span class="chBottom"></span>
            <span class="chLeft"></span>
            <span class="chRight"></span>

        </div>


        <div id="damageOverlay"></div>


        <div id="weaponHint">
            [1] PISTOL &nbsp;&nbsp; [2] SHOTGUN
            <br>
            [R] RELOAD
        </div>

    `;

    document.body.appendChild(hud);


    const style =
        document.createElement("style");

    style.id = "fpsHUDStyle";

    style.textContent = `

        #fpsHUD {

            position: fixed;
            inset: 0;

            pointer-events: none;

            z-index: 1000;

            font-family:
                Arial,
                Helvetica,
                sans-serif;

            color: #fff;

        }


        #healthHUD {

            position: absolute;

            left: 30px;
            bottom: 30px;

            width: 260px;

            text-shadow:
                0 2px 5px #000;

        }


        .hudLabel {

            font-size: 11px;

            letter-spacing: 4px;

            margin-bottom: 7px;

            opacity: .75;

        }


        .healthBar {

            width: 260px;
            height: 13px;

            border:
                1px solid
                rgba(255,255,255,.5);

            background:
                rgba(0,0,0,.65);

        }


        #healthFill {

            width: 100%;
            height: 100%;

            background:
                linear-gradient(
                    90deg,
                    #8d0000,
                    #e10000
                );

            transition:
                width .15s ease;

        }


        #healthText {

            margin-top: 6px;

            font-size: 12px;

            letter-spacing: 2px;

        }


        #weaponHUD {

            position: absolute;

            right: 35px;
            bottom: 32px;

            text-align: right;

            text-shadow:
                0 2px 6px #000;

        }


        #weaponName {

            font-size: 16px;

            letter-spacing: 5px;

        }


        #ammoText {

            font-size: 32px;

            font-weight: bold;

            margin-top: 4px;

        }


        #reloadText {

            font-size: 10px;

            letter-spacing: 3px;

            opacity: .7;

        }


        #killHUD {

            position: absolute;

            right: 35px;
            top: 30px;

            font-size: 12px;

            letter-spacing: 3px;

            text-shadow:
                0 2px 6px #000;

        }


        #waveHUD {

            position: absolute;

            left: 35px;
            top: 30px;

            font-size: 12px;

            letter-spacing: 3px;

            text-shadow:
                0 2px 6px #000;

        }


        #crosshair {

            position: absolute;

            left: 50%;
            top: 50%;

            width: 24px;
            height: 24px;

            transform:
                translate(-50%,-50%);

        }


        #crosshair span {

            position: absolute;

            background:
                rgba(255,255,255,.8);

            box-shadow:
                0 0 3px #000;

        }


        .chTop {

            width: 2px;
            height: 7px;

            left: 11px;
            top: 0;

        }


        .chBottom {

            width: 2px;
            height: 7px;

            left: 11px;
            bottom: 0;

        }


        .chLeft {

            width: 7px;
            height: 2px;

            left: 0;
            top: 11px;

        }


        .chRight {

            width: 7px;
            height: 2px;

            right: 0;
            top: 11px;

        }


        #hitMarker {

            position: absolute;

            left: 50%;
            top: 50%;

            transform:
                translate(-50%,-50%);

            font-size: 34px;

            color: #fff;

            opacity: 0;

            text-shadow:
                0 0 8px #fff;

            transition:
                opacity .08s;

        }


        #hitMarker.active {

            opacity: 1;

        }


        #damageOverlay {

            position: absolute;

            inset: 0;

            background:
                radial-gradient(
                    ellipse,
                    transparent 45%,
                    rgba(180,0,0,.75)
                );

            opacity: 0;

            transition:
                opacity .08s;

        }


        #weaponHint {

            position: absolute;

            left: 50%;

            bottom: 25px;

            transform:
                translateX(-50%);

            text-align: center;

            font-size: 9px;

            letter-spacing: 2px;

            opacity: .42;

            text-shadow:
                0 2px 5px #000;

        }

    `;

    document.head.appendChild(style);

}


/* =========================================================
   UPDATE HUD
========================================================= */

function updateHUD() {

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

    const reloadText =
        document.getElementById(
            "reloadText"
        );

    const killHUD =
        document.getElementById(
            "killHUD"
        );

    const waveHUD =
        document.getElementById(
            "waveHUD"
        );

    if (healthFill) {

        healthFill.style.width =
            Math.max(
                0,
                player.health
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

    if (reloadText) {

        reloadText.textContent =
            isReloading
                ? "RELOADING..."
                : weapon.ammo === 0
                    ? "PRESS R"
                    : "READY";

    }

    if (killHUD) {

        killHUD.textContent =
            "ZOMBIES: " +
            player.kills;

    }

    if (waveHUD) {

        waveHUD.textContent =
            "WAVE " +
            wave;

    }

}


/* =========================================================
   RESET GAME
========================================================= */

function resetGame() {

    player.x = 2.5;
    player.y = 2.5;

    player.angle =
        Math.PI / 2;

    player.health =
        player.maxHealth;

    player.kills = 0;

    doorOpen = false;

    doorProgress = 0;

    flashlightOn = true;

    battery = 100;

    elapsed = 0;

    apparitionActive = false;

    apparitionTimer = 0;

    interactionTarget = null;

    footstepTimer = 0;

    damageFlash = 0;

    hitMarkerTimer = 0;

    muzzleFlashTimer = 0;

    recoil = 0;

    shakeAmount = 0;

    wave = 1;

    zombiesKilledThisWave = 0;

    currentWeapon =
        "pistol";

    weapons.pistol.ammo = 12;
    weapons.pistol.reserve = 72;

    weapons.shotgun.ammo = 6;
    weapons.shotgun.reserve = 36;

    fireCooldown = 0;

    reloadTimer = 0;

    isReloading = false;

    shooting = false;

    keys.w = false;
    keys.a = false;
    keys.s = false;
    keys.d = false;

    zombies.length = 0;

    spawnWave(1);

    if (apparitionTimeout) {

        clearTimeout(
            apparitionTimeout
        );

        apparitionTimeout = null;

    }

    updateBatteryUI();

    updateHUD();

    if (objective) {

        objective.textContent =
            "Find a way out.";

    }

    hideInteraction();

    createHUD();

    updateHUD();

}


/* =========================================================
   SPAWN WAVE
========================================================= */

function spawnWave(
    waveNumber
) {

    const count =
        Math.min(
            3 + waveNumber * 2,
            12
        );

    zombies.length = 0;

    for (
        let i = 0;
        i < count;
        i++
    ) {

        const point =
            zombieSpawnPoints[
                i %
                zombieSpawnPoints.length
            ];

        zombies.push({

            x:
                point.x +
                (Math.random() - .5) *
                .4,

            y:
                point.y +
                (Math.random() - .5) *
                .4,

            radius: .25,

            health:
                100 +
                (waveNumber - 1) *
                20,

            maxHealth:
                100 +
                (waveNumber - 1) *
                20,

            speed:
                .55 +
                Math.min(
                    .25,
                    waveNumber * .025
                ),

            attackCooldown:
                Math.random() * .5,

            attackRange:
                .85,

            damage:
                8 +
                waveNumber * 1.5,

            alive: true,

            hitFlash: 0,

            animation:
                Math.random() *
                Math.PI * 2,

            id:
                Math.random()

        });

    }

}


/* =========================================================
   KEYBOARD
========================================================= */

window.addEventListener(
    "keydown",
    function(event) {

        const key =
            event.key.toLowerCase();


        /* MOVEMENT */

        if (key === "w")
            keys.w = true;

        if (key === "a")
            keys.a = true;

        if (key === "s")
            keys.s = true;

        if (key === "d")
            keys.d = true;


        /* FLASHLIGHT */

        if (
            key === "f" &&
            gameStarted &&
            !paused &&
            !gameOver
        ) {

            event.preventDefault();

            toggleFlashlight();

        }


        /* INTERACT */

        if (
            (key === "e" ||
             key === "enter") &&
            gameStarted &&
            !paused &&
            !gameOver
        ) {

            event.preventDefault();

            updateInteraction();

            interact();

        }


        /* RELOAD */

        if (
            key === "r" &&
            gameStarted &&
            !paused &&
            !gameOver
        ) {

            event.preventDefault();

            reloadWeapon();

        }


        /* WEAPON 1 */

        if (
            key === "1" &&
            gameStarted &&
            !paused &&
            !gameOver
        ) {

            switchWeapon(
                "pistol"
            );

        }


        /* WEAPON 2 */

        if (
            key === "2" &&
            gameStarted &&
            !paused &&
            !gameOver
        ) {

            switchWeapon(
                "shotgun"
            );

        }


        /* ESC */

        if (
            key === "escape" &&
            gameStarted &&
            !gameOver
        ) {

            event.preventDefault();

            if (
                controlsPanel &&
                controlsPanel.classList.contains(
                    "hidden"
                )
            ) {

                togglePause();

            }

        }

    }
);


/* =========================================================
   KEYUP
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

    }
);


/* =========================================================
   BLUR
========================================================= */

window.addEventListener(
    "blur",
    function() {

        keys.w = false;
        keys.a = false;
        keys.s = false;
        keys.d = false;

        shooting = false;

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

    if (
        !canvas ||
        typeof canvas.requestPointerLock !==
        "function"
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
            typeof result.catch ===
            "function"
        ) {

            result.catch(
                function() {}
            );

        }

    } catch (error) {

        console.warn(
            "Pointer lock unavailable."
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
   MOUSE DOWN
   IMPORTANT FIX
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

            /*
             * First click locks mouse.
             */

            if (
                document.pointerLockElement !==
                canvas
            ) {

                requestGamePointerLock();

                return;

            }


            /*
             * LEFT CLICK = SHOOT
             */

            if (
                event.button === 0
            ) {

                shooting = true;

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

                shooting = false;

            }

        }
    );


    canvas.addEventListener(
        "mouseleave",
        function() {

            shooting = false;

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

        if (!gameStarted) {
            return;
        }

        if (
            document.pointerLockElement !==
            canvas
        ) {

            shooting = false;

            if (!paused && !gameOver) {

                showMessage(
                    "Mouse released.",
                    "Click the game screen to look around."
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
   START GAME
========================================================= */

function startGame() {

    if (gameStarted) {

        return;

    }

    gameStarted = true;

    paused = false;

    gameOver = false;

    resetGame();

    if (mainMenu) {

        mainMenu.style.transition =
            "opacity .7s ease";

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
            750
        );

    }

    if (objective) {

        objective.textContent =
            "Find a way out.";

    }

    showMessage(
        "The room is quiet.",
        "Something is moving in the darkness."
    );

    startAudio();

    /*
     * Pointer lock happens after
     * user button click.
     */

    setTimeout(
        requestGamePointerLock,
        50
    );

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

        shooting = false;

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

            } catch (error) {}

        }

        hideInteraction();

    } else {

        if (pauseMenu) {

            pauseMenu.classList.add(
                "hidden"
            );

        }

        requestGamePointerLock();

        showMessage(
            "You are still here.",
            "The dead are waiting."
        );

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

            gameOver = false;

            gameStarted = true;

            paused = false;

            if (pauseMenu) {

                pauseMenu.classList.add(
                    "hidden"
                );

            }

            showMessage(
                "You survived.",
                "But the room has changed."
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
   COLLISION
========================================================= */

function isWall(x, y) {

    const mapX =
        Math.floor(x);

    const mapY =
        Math.floor(y);

    if (
        mapX < 0 ||
        mapX >= MAP_WIDTH ||
        mapY < 0 ||
        mapY >= MAP_HEIGHT
    ) {

        return true;

    }

    const tile =
        MAP[mapY][mapX];

    if (tile === "#") {

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


/* =========================================================
   ZOMBIE COLLISION
========================================================= */

function zombieCanMoveTo(
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
   PLAYER MOVEMENT
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

    if (
        forward === 0 &&
        strafe === 0
    ) {

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
        player.speed;

    if (keys.s) {

        speed *= .9;

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

    let moved = false;

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

    if (moved) {

        footstepTimer -= dt;

        if (
            footstepTimer <= 0
        ) {

            playFootstep();

            footstepTimer =
                .42;

        }

    }

}


/* =========================================================
   DOOR FINDER
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
                x + .5 -
                player.x;

            const dy =
                y + .5 -
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

                    x: x + .5,
                    y: y + .5,
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

        interactionTarget =
            null;

        return;

    }

    const door =
        findDoor();

    if (
        door &&
        door.distance < 1.65
    ) {

        const dx =
            door.x -
            player.x;

        const dy =
            door.y -
            player.y;

        const angle =
            Math.atan2(
                dy,
                dx
            );

        const difference =
            Math.abs(
                normalizeAngle(
                    angle -
                    player.angle
                )
            );

        if (
            difference < .75
        ) {

            interactionTarget =
                "door";

            if (doorOpen) {

                interactionMain.textContent =
                    "DOOR";

                interactionSub.textContent =
                    "The way is open";

            } else {

                interactionMain.textContent =
                    "OPEN DOOR";

                interactionSub.textContent =
                    "Press E or ENTER";

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

        doorProgress = 1;

        if (objective) {

            objective.textContent =
                "Something is waiting beyond.";

        }

        showMessage(
            "The door opens.",
            "You should not have done that."
        );

        playDoorSound();

        shakeAmount = 8;

        setTimeout(
            function() {

                shakeAmount = 0;

            },
            450
        );

        updateInteraction();

        return;

    }

    showMessage(
        "The darkness continues.",
        "Keep moving."
    );

}


/* =========================================================
   SWITCH WEAPON
========================================================= */

function switchWeapon(
    weaponName
) {

    if (
        !weapons[weaponName]
    ) {

        return;

    }

    if (
        currentWeapon ===
        weaponName
    ) {

        return;

    }

    if (isReloading) {

        return;

    }

    currentWeapon =
        weaponName;

    recoil = 0;

    playWeaponSwitch();

    showMessage(
        weapons[
            weaponName
        ].name,
        weaponName === "pistol"
            ? "Fast and accurate."
            : "Heavy damage. Wide spread."
    );

    updateHUD();

}


/* =========================================================
   RELOAD
========================================================= */

function reloadWeapon() {

    const weapon =
        weapons[currentWeapon];

    if (isReloading) {

        return;

    }

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
            "No ammunition.",
            "Find another weapon."
        );

        return;

    }

    isReloading = true;

    reloadTimer =
        weapon.reloadTime;

    shooting = false;

    playReloadSound();

    updateHUD();

}


/* =========================================================
   UPDATE RELOAD
========================================================= */

function updateReload(dt) {

    if (!isReloading) {

        return;

    }

    reloadTimer -= dt;

    if (
        reloadTimer <= 0
    ) {

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

        isReloading = false;

        showMessage(
            "Reloaded.",
            weapon.name
        );

        updateHUD();

    }

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
        document.pointerLockElement !==
        canvas
    ) {

        requestGamePointerLock();

        return;

    }

    if (isReloading) {

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

        playEmptyGun();

        showMessage(
            "CLICK.",
            "Out of ammunition. Press R."
        );

        fireCooldown =
            .18;

        return;

    }

    weapon.ammo--;

    fireCooldown =
        weapon.fireRate;

    muzzleFlashTimer =
        .075;

    recoil =
        weapon.recoil;

    shakeAmount =
        Math.max(
            shakeAmount,
            weapon.recoil * .35
        );

    playGunshot(
        weapon
    );

    /*
     * Multiple pellets for shotgun.
     */

    for (
        let pellet = 0;
        pellet < weapon.pellets;
        pellet++
    ) {

        const shotAngle =
            player.angle +
            (
                Math.random() * 2 -
                1
            ) *
            weapon.spread;

        processBullet(
            shotAngle,
            weapon.damage
        );

    }

    updateHUD();

}


/* =========================================================
   BULLET
========================================================= */

function processBullet(
    angle,
    damage
) {

    let bestZombie = null;

    let bestDistance =
        Infinity;

    for (
        const zombie of zombies
    ) {

        if (!zombie.alive) {
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
            25
        ) {

            continue;

        }

        const targetAngle =
            Math.atan2(
                dy,
                dx
            );

        const difference =
            Math.abs(
                normalizeAngle(
                    targetAngle -
                    angle
                )
            );

        const hitWidth =
            Math.atan2(
                zombie.radius * 1.3,
                distance
            );

        if (
            difference <
            Math.max(
                hitWidth,
                .018
            )
        ) {

            if (
                hasLineOfSight(
                    player.x,
                    player.y,
                    zombie.x,
                    zombie.y
                )
            ) {

                if (
                    distance <
                    bestDistance
                ) {

                    bestDistance =
                        distance;

                    bestZombie =
                        zombie;

                }

            }

        }

    }

    if (bestZombie) {

        bestZombie.health -=
            damage;

        bestZombie.hitFlash =
            .12;

        hitMarkerTimer =
            .12;

        showHitMarker();

        playZombieHit();

        if (
            bestZombie.health <= 0
        ) {

            killZombie(
                bestZombie
            );

        }

    }

}


/* =========================================================
   LINE OF SIGHT
========================================================= */

function hasLineOfSight(
    x1,
    y1,
    x2,
    y2
) {

    const dx =
        x2 - x1;

    const dy =
        y2 - y1;

    const distance =
        Math.hypot(
            dx,
            dy
        );

    const steps =
        Math.ceil(
            distance * 30
        );

    for (
        let i = 1;
        i < steps;
        i++
    ) {

        const t =
            i / steps;

        const x =
            x1 +
            dx * t;

        const y =
            y1 +
            dy * t;

        if (
            isWall(
                x,
                y
            )
        ) {

            return false;

        }

    }

    return true;

}


/* =========================================================
   KILL ZOMBIE
========================================================= */

function killZombie(
    zombie
) {

    if (!zombie.alive) {

        return;

    }

    zombie.alive = false;

    player.kills++;

    zombiesKilledThisWave++;

    showMessage(
        "ZOMBIE DOWN",
        player.kills +
        " killed"
    );

    playZombieDeath();

    updateHUD();

    /*
     * Wave complete
     */

    const alive =
        zombies.filter(
            z => z.alive
        ).length;

    if (
        alive === 0
    ) {

        wave++;

        zombiesKilledThisWave =
            0;

        setTimeout(
            function() {

                if (
                    gameStarted &&
                    !gameOver
                ) {

                    spawnWave(
                        wave
                    );

                    showMessage(
                        "WAVE " +
                        wave,
                        "They are coming."
                    );

                    updateHUD();

                }

            },
            1600
        );

    }

}


/* =========================================================
   ZOMBIE UPDATE
========================================================= */

function updateZombies(dt) {

    if (
        !gameStarted ||
        paused ||
        gameOver
    ) {

        return;

    }

    for (
        const zombie of zombies
    ) {

        if (!zombie.alive) {

            continue;

        }

        zombie.animation +=
            dt * 5;

        zombie.hitFlash =
            Math.max(
                0,
                zombie.hitFlash -
                dt
            );

        zombie.attackCooldown =
            Math.max(
                0,
                zombie.attackCooldown -
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

        /*
         * Attack
         */

        if (
            distance <=
            zombie.attackRange
        ) {

            if (
                zombie.attackCooldown <=
                0
            ) {

                damagePlayer(
                    zombie.damage
                );

                zombie.attackCooldown =
                    .85;

            }

            continue;

        }

        /*
         * Chase
         */

        if (
            distance < 16
        ) {

            const dirX =
                dx /
                Math.max(
                    distance,
                    .001
                );

            const dirY =
                dy /
                Math.max(
                    distance,
                    .001
                );

            const speed =
                zombie.speed *
                dt;

            const nextX =
                zombie.x +
                dirX * speed;

            const nextY =
                zombie.y +
                dirY * speed;

            if (
                zombieCanMoveTo(
                    zombie,
                    nextX,
                    zombie.y
                )
            ) {

                zombie.x =
                    nextX;

            }

            if (
                zombieCanMoveTo(
                    zombie,
                    zombie.x,
                    nextY
                )
            ) {

                zombie.y =
                    nextY;

            }

        }

    }

}


/* =========================================================
   DAMAGE PLAYER
========================================================= */

function damagePlayer(
    damage
) {

    if (gameOver) {
        return;
    }

    player.health -=
        damage;

    player.health =
        Math.max(
            0,
            player.health
        );

    damageFlash =
        .75;

    shakeAmount =
        10;

    playPlayerDamage();

    showMessage(
        "YOU ARE HURT",
        "-" +
        Math.ceil(
            damage
        ) +
        " HEALTH"
    );

    updateHUD();

    if (
        player.health <= 0
    ) {

        playerDeath();

    }

}


/* =========================================================
   PLAYER DEATH
========================================================= */

function playerDeath() {

    gameOver = true;

    paused = false;

    shooting = false;

    if (
        document.pointerLockElement ===
        canvas
    ) {

        try {

            document.exitPointerLock();

        } catch (error) {}

    }

    showMessage(
        "YOU DIED",
        "The room kept you."
    );

    if (objective) {

        objective.textContent =
            "You did not escape.";

    }

}


/* =========================================================
   FLASHLIGHT
========================================================= */

function toggleFlashlight() {

    if (
        battery <= 0
    ) {

        flashlightOn = false;

        showMessage(
            "The flashlight is dead.",
            "Find another way."
        );

        updateBatteryUI();

        return;

    }

    flashlightOn =
        !flashlightOn;

    playFlashlightClick();

    showMessage(
        flashlightOn
            ? "Flashlight on."
            : "Flashlight off.",
        flashlightOn
            ? "The darkness retreats."
            : "The darkness returns."
    );

}


/* =========================================================
   BATTERY
========================================================= */

function updateBattery(dt) {

    if (!flashlightOn) {

        return;

    }

    battery -=
        dt *
        .1111;

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
            "The flashlight dies.",
            "You are not alone."
        );

    }

    updateBatteryUI();

}


/* =========================================================
   BATTERY UI
========================================================= */

function updateBatteryUI() {

    if (!batteryFill) {

        return;

    }

    const value =
        Math.max(
            0,
            Math.min(
                100,
                battery
            )
        );

    batteryFill.style.width =
        value + "%";

    if (
        value < 20
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
   ANGLE
========================================================= */

function normalizeAngle(
    angle
) {

    while (
        angle > Math.PI
    ) {

        angle -=
            Math.PI * 2;

    }

    while (
        angle < -Math.PI
    ) {

        angle +=
            Math.PI * 2;

    }

    return angle;

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
            2800
        );

}


function hideMessage() {

    if (!message) {

        return;

    }

    clearTimeout(
        messageTimer
    );

    message.classList.remove(
        "visible"
    );

}


function hideInteraction() {

    if (!interaction) {

        return;

    }

    interaction.classList.remove(
        "visible"
    );

}


/* =========================================================
   HIT MARKER
========================================================= */

function showHitMarker() {

    const marker =
        document.getElementById(
            "hitMarker"
        );

    if (!marker) {
        return;
    }

    marker.classList.add(
        "active"
    );

    setTimeout(
        function() {

            marker.classList.remove(
                "active"
            );

        },
        100
    );

}


/* =========================================================
   RAYCAST
========================================================= */

function castRay(
    angle
) {

    const sin =
        Math.sin(angle);

    const cos =
        Math.cos(angle);

    let distance = 0;

    const maxDistance =
        30;

    const step =
        .018;

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

        const mapX =
            Math.floor(x);

        const mapY =
            Math.floor(y);

        if (
            mapX < 0 ||
            mapX >= MAP_WIDTH ||
            mapY < 0 ||
            mapY >= MAP_HEIGHT
        ) {

            return {

                distance,
                type: "wall",
                mapX,
                mapY

            };

        }

        const tile =
            MAP[mapY][mapX];

        if (
            tile === "#"
        ) {

            return {

                distance,
                type: "wall",
                mapX,
                mapY

            };

        }

        if (
            tile === "D" &&
            !doorOpen
        ) {

            return {

                distance,
                type: "door",
                mapX,
                mapY

            };

        }

    }

    return {

        distance:
            maxDistance,

        type:
            "none"

    };

}


/* =========================================================
   RENDER
========================================================= */

function render() {

    if (!canvas || !ctx) {

        return;

    }

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

    ctx.save();

    if (
        shakeAmount > 0
    ) {

        ctx.translate(
            (
                Math.random() *
                2 -
                1
            ) *
            shakeAmount,

            (
                Math.random() *
                2 -
                1
            ) *
            shakeAmount
        );

    }

    drawBackground(
        width,
        height
    );

    drawWorld(
        width,
        height
    );

    drawZombies(
        width,
        height
    );

    drawWeapon(
        width,
        height
    );

    drawApparition(
        width,
        height
    );

    ctx.restore();

}


/* =========================================================
   BACKGROUND
========================================================= */

function drawBackground(
    width,
    height
) {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            height
        );

    gradient.addColorStop(
        0,
        flashlightOn
            ? "#08090b"
            : "#010101"
    );

    gradient.addColorStop(
        .45,
        flashlightOn
            ? "#151619"
            : "#030303"
    );

    gradient.addColorStop(
        1,
        "#020202"
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
   WORLD RENDER
========================================================= */

function drawWorld(
    width,
    height
) {

    const columns =
        Math.min(
            1000,
            Math.max(
                400,
                Math.floor(
                    width / 1.35
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
                .05,
                correctedDistance
            );

        const wallHeight =
            Math.min(
                height * 2,
                height /
                safeDistance
            );

        const top =
            height / 2 -
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
   WALL SHADE
========================================================= */

function getWallShade(
    distance,
    type
) {

    let light =
        115 /
        Math.max(
            1,
            distance *
            distance
        );

    if (flashlightOn) {

        light *= 4;

    } else {

        light *= .28;

    }

    light =
        Math.max(
            3,
            Math.min(
                140,
                light
            )
        );

    if (
        type === "door"
    ) {

        light *= .55;

    }

    const value =
        Math.floor(
            light
        );

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
   ZOMBIE SPRITES
========================================================= */

function drawZombies(
    width,
    height
) {

    const visible = [];

    for (
        const zombie of zombies
    ) {

        if (!zombie.alive) {

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
            FOV / 2 +
            .3
        ) {

            continue;

        }

        if (
            distance >
            25
        ) {

            continue;

        }

        visible.push({

            zombie,
            distance,
            angle

        });

    }

    visible.sort(
        function(a, b) {

            return (
                b.distance -
                a.distance
            );

        }
    );

    for (
        const item of visible
    ) {

        drawZombieSprite(
            item.zombie,
            item.distance,
            item.angle,
            width,
            height
        );

    }

}


/* =========================================================
   ZOMBIE SPRITE
========================================================= */

function drawZombieSprite(
    zombie,
    distance,
    relativeAngle,
    width,
    height
) {

    const corrected =
        distance *
        Math.cos(
            relativeAngle
        );

    if (
        corrected <= .1
    ) {

        return;

    }

    const screenX =
        width / 2 +
        (
            relativeAngle /
            (FOV / 2)
        ) *
        (
            width / 2
        );

    const spriteHeight =
        Math.min(
            height * 1.5,
            height /
            corrected *
            .9
        );

    const spriteWidth =
        spriteHeight *
        .42;

    const bottom =
        height / 2 +
        spriteHeight / 2;

    const left =
        screenX -
        spriteWidth / 2;

    /*
     * Simple depth check.
     */

    const centerRay =
        castRay(
            player.angle +
            relativeAngle
        );

    if (
        centerRay.distance <
        distance -
        .15
    ) {

        return;

    }

    ctx.save();

    const flash =
        zombie.hitFlash >
        0;

    /*
     * Shadow
     */

    ctx.fillStyle =
        "rgba(0,0,0,.5)";

    ctx.beginPath();

    ctx.ellipse(
        screenX,
        bottom,
        spriteWidth * .55,
        spriteHeight * .08,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
     * Legs
     */

    const walk =
        Math.sin(
            zombie.animation
        ) *
        spriteWidth *
        .12;

    ctx.strokeStyle =
        flash
            ? "#ffffff"
            : "#111";

    ctx.lineWidth =
        spriteWidth *
        .14;

    ctx.lineCap =
        "round";

    ctx.beginPath();

    ctx.moveTo(
        screenX -
        spriteWidth * .12,
        bottom -
        spriteHeight * .28
    );

    ctx.lineTo(
        screenX -
        spriteWidth * .18 -
        walk,
        bottom
    );

    ctx.moveTo(
        screenX +
        spriteWidth * .12,
        bottom -
        spriteHeight * .28
    );

    ctx.lineTo(
        screenX +
        spriteWidth * .18 +
        walk,
        bottom
    );

    ctx.stroke();


    /*
     * Body
     */

    const bodyGradient =
        ctx.createLinearGradient(
            left,
            bottom -
            spriteHeight * .75,
            left +
            spriteWidth,
            bottom
        );

    bodyGradient.addColorStop(
        0,
        flash
            ? "#ffffff"
            : "#3d3d3d"
    );

    bodyGradient.addColorStop(
        .55,
        flash
            ? "#bbbbbb"
            : "#171717"
    );

    bodyGradient.addColorStop(
        1,
        "#050505"
    );

    ctx.fillStyle =
        bodyGradient;

    ctx.beginPath();

    ctx.roundRect(
        left +
        spriteWidth * .17,

        bottom -
        spriteHeight * .63,

        spriteWidth *
        .66,

        spriteHeight *
        .48,

        spriteWidth *
        .1
    );

    ctx.fill();


    /*
     * Head
     */

    const headX =
        screenX;

    const headY =
        bottom -
        spriteHeight *
        .78;

    const headRadius =
        spriteWidth *
        .25;

    const headGradient =
        ctx.createRadialGradient(
            headX -
            headRadius * .3,
            headY -
            headRadius * .3,
            1,
            headX,
            headY,
            headRadius
        );

    headGradient.addColorStop(
        0,
        flash
            ? "#ffffff"
            : "#777"
    );

    headGradient.addColorStop(
        .65,
        flash
            ? "#aaa"
            : "#292929"
    );

    headGradient.addColorStop(
        1,
        "#050505"
    );

    ctx.fillStyle =
        headGradient;

    ctx.beginPath();

    ctx.arc(
        headX,
        headY,
        headRadius,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
     * Eyes
     */

    const eyeY =
        headY -
        headRadius *
        .05;

    ctx.fillStyle =
        flash
            ? "#ffffff"
            : "#a90000";

    ctx.beginPath();

    ctx.arc(
        headX -
        headRadius *
        .35,
        eyeY,
        headRadius *
        .10,
        0,
        Math.PI * 2
    );

    ctx.arc(
        headX +
        headRadius *
        .35,
        eyeY,
        headRadius *
        .10,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
     * Arms
     */

    ctx.strokeStyle =
        flash
            ? "#eee"
            : "#181818";

    ctx.lineWidth =
        spriteWidth *
        .12;

    ctx.beginPath();

    ctx.moveTo(
        screenX -
        spriteWidth * .27,
        bottom -
        spriteHeight * .52
    );

    ctx.lineTo(
        screenX -
        spriteWidth * .48,
        bottom -
        spriteHeight * .25
    );

    ctx.moveTo(
        screenX +
        spriteWidth * .27,
        bottom -
        spriteHeight * .52
    );

    ctx.lineTo(
        screenX +
        spriteWidth * .48,
        bottom -
        spriteHeight * .25
    );

    ctx.stroke();


    /*
     * HEALTH BAR
     */

    const barWidth =
        spriteWidth *
        1.25;

    const barHeight =
        Math.max(
            4,
            spriteHeight *
            .035
        );

    const barX =
        screenX -
        barWidth / 2;

    const barY =
        headY -
        headRadius *
        1.8;

    ctx.fillStyle =
        "rgba(0,0,0,.75)";

    ctx.fillRect(
        barX,
        barY,
        barWidth,
        barHeight
    );

    ctx.fillStyle =
        "#b00000";

    ctx.fillRect(
        barX,
        barY,
        barWidth *
        Math.max(
            0,
            zombie.health /
            zombie.maxHealth
        ),
        barHeight
    );

    ctx.strokeStyle =
        "rgba(255,255,255,.35)";

    ctx.lineWidth = 1;

    ctx.strokeRect(
        barX,
        barY,
        barWidth,
        barHeight
    );

    ctx.restore();

}


/* =========================================================
   WEAPON
========================================================= */

function drawWeapon(
    width,
    height
) {

    if (
        !gameStarted ||
        gameOver
    ) {

        return;

    }

    const weapon =
        currentWeapon;

    const centerX =
        width / 2;

    const baseY =
        height;

    const recoilOffset =
        recoil * 3;

    ctx.save();

    ctx.translate(
        0,
        recoilOffset
    );

    if (
        weapon === "pistol"
    ) {

        drawPistol(
            centerX,
            baseY,
            width,
            height
        );

    } else {

        drawShotgun(
            centerX,
            baseY,
            width,
            height
        );

    }

    /*
     * Muzzle flash
     */

    if (
        muzzleFlashTimer > 0
    ) {

        drawMuzzleFlash(
            centerX,
            baseY,
            width,
            height
        );

    }

    ctx.restore();

}


/* =========================================================
   PISTOL
========================================================= */

function drawPistol(
    cx,
    baseY,
    width,
    height
) {

    const scale =
        Math.min(
            1.2,
            width / 1300
        );

    const gunW =
        180 * scale;

    const gunH =
        230 * scale;

    const x =
        cx -
        gunW / 2;

    const y =
        baseY -
        gunH *
        .65;

    /*
     * Hand
     */

    ctx.fillStyle =
        "#7a4e3d";

    ctx.beginPath();

    ctx.ellipse(
        x +
        gunW * .25,
        y +
        gunH * .72,
        gunW * .17,
        gunH * .17,
        -.2,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
     * Grip
     */

    const gripGradient =
        ctx.createLinearGradient(
            x,
            y,
            x + gunW,
            y
        );

    gripGradient.addColorStop(
        0,
        "#070707"
    );

    gripGradient.addColorStop(
        .5,
        "#282828"
    );

    gripGradient.addColorStop(
        1,
        "#050505"
    );

    ctx.fillStyle =
        gripGradient;

    ctx.beginPath();

    ctx.roundRect(
        x +
        gunW * .36,
        y +
        gunH * .42,
        gunW * .25,
        gunH * .52,
        8
    );

    ctx.fill();


    /*
     * Main body
     */

    ctx.fillStyle =
        "#292929";

    ctx.beginPath();

    ctx.roundRect(
        x +
        gunW * .2,
        y +
        gunH * .22,
        gunW * .6,
        gunH * .28,
        8
    );

    ctx.fill();


    /*
     * Barrel
     */

    ctx.fillStyle =
        "#111";

    ctx.fillRect(
        x +
        gunW * .43,
        y,
        gunW * .18,
        gunH * .27
    );


    /*
     * Front sight
     */

    ctx.fillStyle =
        "#aaa";

    ctx.fillRect(
        x +
        gunW * .48,
        y -
        gunH * .025,
        gunW * .05,
        gunH * .05
    );


    /*
     * Slide
     */

    ctx.strokeStyle =
        "#666";

    ctx.lineWidth =
        2;

    ctx.strokeRect(
        x +
        gunW * .25,
        y +
        gunH * .24,
        gunW * .5,
        gunH * .12
    );


    /*
     * Trigger
     */

    ctx.strokeStyle =
        "#888";

    ctx.lineWidth =
        3;

    ctx.beginPath();

    ctx.arc(
        x +
        gunW * .49,
        y +
        gunH * .48,
        gunW * .06,
        0,
        Math.PI
    );

    ctx.stroke();

}


/* =========================================================
   SHOTGUN
========================================================= */

function drawShotgun(
    cx,
    baseY,
    width,
    height
) {

    const scale =
        Math.min(
            1.2,
            width / 1300
        );

    const gunW =
        340 * scale;

    const gunH =
        180 * scale;

    const x =
        cx -
        gunW / 2;

    const y =
        baseY -
        gunH *
        .55;

    /*
     * Hands
     */

    ctx.fillStyle =
        "#79503f";

    ctx.beginPath();

    ctx.ellipse(
        x +
        gunW * .25,
        y +
        gunH * .68,
        gunW * .14,
        gunH * .14,
        -.2,
        0,
        Math.PI * 2
    );

    ctx.ellipse(
        x +
        gunW * .72,
        y +
        gunH * .58,
        gunW * .14,
        gunH * .14,
        .2,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
     * Stock
     */

    ctx.fillStyle =
        "#2b1b12";

    ctx.beginPath();

    ctx.moveTo(
        x,
        y +
        gunH * .36
    );

    ctx.lineTo(
        x +
        gunW * .3,
        y +
        gunH * .28
    );

    ctx.lineTo(
        x +
        gunW * .36,
        y +
        gunH * .55
    );

    ctx.lineTo(
        x +
        gunW * .04,
        y +
        gunH * .66
    );

    ctx.closePath();

    ctx.fill();


    /*
     * Receiver
     */

    ctx.fillStyle =
        "#242424";

    ctx.fillRect(
        x +
        gunW * .28,
        y +
        gunH * .28,
        gunW * .34,
        gunH * .25
    );


    /*
     * Barrel
     */

    const barrelGradient =
        ctx.createLinearGradient(
            x,
            y,
            x,
            y +
            gunH
        );

    barrelGradient.addColorStop(
        0,
        "#444"
    );

    barrelGradient.addColorStop(
        .5,
        "#111"
    );

    barrelGradient.addColorStop(
        1,
        "#030303"
    );

    ctx.fillStyle =
        barrelGradient;

    ctx.fillRect(
        x +
        gunW * .58,
        y +
        gunH * .32,
        gunW * .40,
        gunH * .11
    );


    /*
     * Second barrel
     */

    ctx.fillRect(
        x +
        gunW * .58,
        y +
        gunH * .45,
        gunW * .40,
        gunH * .09
    );


    /*
     * Front
     */

    ctx.fillStyle =
        "#050505";

    ctx.fillRect(
        x +
        gunW * .94,
        y +
        gunH * .29,
        gunW * .05,
        gunH * .28
    );

}


/* =========================================================
   MUZZLE FLASH
========================================================= */

function drawMuzzleFlash(
    cx,
    baseY,
    width,
    height
) {

    const size =
        currentWeapon ===
        "shotgun"
            ? 95
            : 55;

    const x =
        cx;

    const y =
        baseY -
        height *
        .52 +
        recoil *
        2;

    const gradient =
        ctx.createRadialGradient(
            x,
            y,
            2,
            x,
            y,
            size
        );

    gradient.addColorStop(
        0,
        "rgba(255,255,230,.95)"
    );

    gradient.addColorStop(
        .2,
        "rgba(255,210,100,.8)"
    );

    gradient.addColorStop(
        .55,
        "rgba(255,100,20,.25)"
    );

    gradient.addColorStop(
        1,
        "rgba(255,0,0,0)"
    );

    ctx.fillStyle =
        gradient;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        size,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


/* =========================================================
   APPARITION
========================================================= */

function updateHorror(dt) {

    if (
        !gameStarted ||
        paused ||
        gameOver
    ) {

        return;

    }

    apparitionTimer +=
        dt;

    if (
        !apparitionActive &&
        apparitionTimer > 18
    ) {

        apparitionTimer = 0;

        if (
            Math.random() < .55
        ) {

            apparitionActive =
                true;

            if (
                apparitionTimeout
            ) {

                clearTimeout(
                    apparitionTimeout
                );

            }

            apparitionTimeout =
                setTimeout(
                    function() {

                        apparitionActive =
                            false;

                        apparitionTimeout =
                            null;

                    },
                    1800
                );

            playWhisper();

        }

    }

}


/* =========================================================
   APPARITION DRAW
========================================================= */

function drawApparition(
    width,
    height
) {

    if (!apparitionActive) {

        return;

    }

    const alpha =
        .10 +
        Math.sin(
            elapsed * 9
        ) *
        .03;

    const centerX =
        width / 2;

    const centerY =
        height / 2;

    const gradient =
        ctx.createRadialGradient(
            centerX,
            centerY,
            10,
            centerX,
            centerY,
            230
        );

    gradient.addColorStop(
        0,
        "rgba(220,220,220," +
        alpha +
        ")"
    );

    gradient.addColorStop(
        .35,
        "rgba(100,100,100," +
        alpha * .5 +
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
        centerX,
        centerY -
        30,
        70,
        130,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

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

            audioContext.resume()
                .catch(
                    function() {}
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
            .48;

        masterGain.connect(
            audioContext.destination
        );

        ambientGain =
            audioContext.createGain();

        ambientGain.gain.value =
            .035;

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

    if (!audioContext) {
        return;
    }

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type =
        "sine";

    oscillator.frequency.value =
        43;

    gain.gain.value =
        .18;

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
        67;

    gain2.gain.value =
        .045;

    oscillator2.connect(
        gain2
    );

    gain2.connect(
        ambientGain
    );

    oscillator2.start();

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

    const now =
        audioContext.currentTime;

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type =
        "sawtooth";

    oscillator.frequency.setValueAtTime(
        weapon.soundFrequency,
        now
    );

    oscillator.frequency.exponentialRampToValueAtTime(
        35,
        now + .18
    );

    gain.gain.setValueAtTime(
        .22,
        now
    );

    gain.gain.exponentialRampToValueAtTime(
        .0001,
        now + .18
    );

    oscillator.connect(
        gain
    );

    gain.connect(
        masterGain
    );

    oscillator.start(
        now
    );

    oscillator.stop(
        now + .2
    );

    /*
     * Noise layer
     */

    const buffer =
        audioContext.createBuffer(
            1,
            Math.floor(
                audioContext.sampleRate *
                .12
            ),
            audioContext.sampleRate
        );

    const data =
        buffer.getChannelData(0);

    for (
        let i = 0;
        i < data.length;
        i++
    ) {

        data[i] =
            (
                Math.random() *
                2 -
                1
            ) *
            (
                1 -
                i /
                data.length
            );

    }

    const source =
        audioContext
            .createBufferSource();

    source.buffer =
        buffer;

    const noiseGain =
        audioContext
            .createGain();

    noiseGain.gain.value =
        .18;

    source.connect(
        noiseGain
    );

    noiseGain.connect(
        masterGain
    );

    source.start(
        now
    );

}


/* =========================================================
   EMPTY GUN
========================================================= */

function playEmptyGun() {

    if (!audioContext) {
        return;
    }

    const now =
        audioContext.currentTime;

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type =
        "square";

    oscillator.frequency.value =
        180;

    gain.gain.setValueAtTime(
        .05,
        now
    );

    gain.gain.exponentialRampToValueAtTime(
        .0001,
        now + .06
    );

    oscillator.connect(
        gain
    );

    gain.connect(
        masterGain
    );

    oscillator.start(now);

    oscillator.stop(
        now + .07
    );

}


/* =========================================================
   RELOAD SOUND
========================================================= */

function playReloadSound() {

    if (!audioContext) {
        return;
    }

    const now =
        audioContext.currentTime;

    for (
        let i = 0;
        i < 3;
        i++
    ) {

        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();

        oscillator.type =
            "square";

        oscillator.frequency.value =
            i === 1
                ? 120
                : 75;

        gain.gain.setValueAtTime(
            .0001,
            now +
            i * .22
        );

        gain.gain.exponentialRampToValueAtTime(
            .07,
            now +
            i * .22 +
            .01
        );

        gain.gain.exponentialRampToValueAtTime(
            .0001,
            now +
            i * .22 +
            .08
        );

        oscillator.connect(
            gain
        );

        gain.connect(
            masterGain
        );

        oscillator.start(
            now +
            i * .22
        );

        oscillator.stop(
            now +
            i * .22 +
            .1
        );

    }

}


/* =========================================================
   WEAPON SWITCH
========================================================= */

function playWeaponSwitch() {

    if (!audioContext) {
        return;
    }

    const now =
        audioContext.currentTime;

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type =
        "triangle";

    oscillator.frequency.value =
        220;

    gain.gain.setValueAtTime(
        .05,
        now
    );

    gain.gain.exponentialRampToValueAtTime(
        .0001,
        now + .1
    );

    oscillator.connect(
        gain
    );

    gain.connect(
        masterGain
    );

    oscillator.start(now);

    oscillator.stop(
        now + .11
    );

}


/* =========================================================
   FOOTSTEP
========================================================= */

function playFootstep() {

    if (!audioContext) {
        return;
    }

    const now =
        audioContext.currentTime;

    const buffer =
        audioContext.createBuffer(
            1,
            Math.floor(
                audioContext.sampleRate *
                .10
            ),
            audioContext.sampleRate
        );

    const data =
        buffer.getChannelData(0);

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
        900;

    const gain =
        audioContext
            .createGain();

    gain.gain.setValueAtTime(
        .0001,
        now
    );

    gain.gain.exponentialRampToValueAtTime(
        .11,
        now + .012
    );

    gain.gain.exponentialRampToValueAtTime(
        .0001,
        now + .10
    );

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

    source.stop(
        now + .11
    );

}


/* =========================================================
   DOOR SOUND
========================================================= */

function playDoorSound() {

    if (!audioContext) {
        return;
    }

    const now =
        audioContext.currentTime;

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type =
        "sawtooth";

    oscillator.frequency.setValueAtTime(
        70,
        now
    );

    oscillator.frequency.exponentialRampToValueAtTime(
        32,
        now + 1.2
    );

    gain.gain.setValueAtTime(
        .0001,
        now
    );

    gain.gain.exponentialRampToValueAtTime(
        .12,
        now + .04
    );

    gain.gain.exponentialRampToValueAtTime(
        .0001,
        now + 1.2
    );

    oscillator.connect(
        gain
    );

    gain.connect(
        masterGain
    );

    oscillator.start(now);

    oscillator.stop(
        now + 1.3
    );

}


/* =========================================================
   ZOMBIE HIT
========================================================= */

function playZombieHit() {

    if (!audioContext) {
        return;
    }

    const now =
        audioContext.currentTime;

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type =
        "triangle";

    oscillator.frequency.setValueAtTime(
        130,
        now
    );

    oscillator.frequency.exponentialRampToValueAtTime(
        55,
        now + .12
    );

    gain.gain.setValueAtTime(
        .08,
        now
    );

    gain.gain.exponentialRampToValueAtTime(
        .0001,
        now + .12
    );

    oscillator.connect(
        gain
    );

    gain.connect(
        masterGain
    );

    oscillator.start(now);

    oscillator.stop(
        now + .13
    );

}


/* =========================================================
   ZOMBIE DEATH
========================================================= */

function playZombieDeath() {

    if (!audioContext) {
        return;
    }

    const now =
        audioContext.currentTime;

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type =
        "sawtooth";

    oscillator.frequency.setValueAtTime(
        100,
        now
    );

    oscillator.frequency.exponentialRampToValueAtTime(
        25,
        now + .45
    );

    gain.gain.setValueAtTime(
        .12,
        now
    );

    gain.gain.exponentialRampToValueAtTime(
        .0001,
        now + .45
    );

    oscillator.connect(
        gain
    );

    gain.connect(
        masterGain
    );

    oscillator.start(now);

    oscillator.stop(
        now + .5
    );

}


/* =========================================================
   PLAYER DAMAGE SOUND
========================================================= */

function playPlayerDamage() {

    if (!audioContext) {
        return;
    }

    const now =
        audioContext.currentTime;

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type =
        "sawtooth";

    oscillator.frequency.value =
        55;

    gain.gain.setValueAtTime(
        .13,
        now
    );

    gain.gain.exponentialRampToValueAtTime(
        .0001,
        now + .3
    );

    oscillator.connect(
        gain
    );

    gain.connect(
        masterGain
    );

    oscillator.start(now);

    oscillator.stop(
        now + .32
    );

}


/* =========================================================
   FLASHLIGHT CLICK
========================================================= */

function playFlashlightClick() {

    if (!audioContext) {
        return;
    }

    const now =
        audioContext.currentTime;

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type =
        "square";

    oscillator.frequency.value =
        140;

    gain.gain.setValueAtTime(
        .06,
        now
    );

    gain.gain.exponentialRampToValueAtTime(
        .0001,
        now + .045
    );

    oscillator.connect(
        gain
    );

    gain.connect(
        masterGain
    );

    oscillator.start(now);

    oscillator.stop(
        now + .05
    );

}


/* =========================================================
   WHISPER
========================================================= */

function playWhisper() {

    if (!audioContext) {
        return;
    }

    const now =
        audioContext.currentTime;

    const buffer =
        audioContext.createBuffer(
            1,
            Math.floor(
                audioContext.sampleRate *
                1.5
            ),
            audioContext.sampleRate
        );

    const data =
        buffer.getChannelData(0);

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
        1100;

    filter.Q.value =
        3;

    const gain =
        audioContext
            .createGain();

    gain.gain.value =
        .07;

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
   UPDATE COMBAT
========================================================= */

function updateCombat(dt) {

    fireCooldown =
        Math.max(
            0,
            fireCooldown -
            dt
        );

    muzzleFlashTimer =
        Math.max(
            0,
            muzzleFlashTimer -
            dt
        );

    recoil =
        Math.max(
            0,
            recoil -
            dt *
            30
        );

    shakeAmount =
        Math.max(
            0,
            shakeAmount -
            dt *
            20
        );

    damageFlash =
        Math.max(
            0,
            damageFlash -
            dt *
            2.5
        );

    /*
     * Hold left mouse to fire.
     */

    if (
        shooting &&
        document.pointerLockElement ===
        canvas
    ) {

        shoot();

    }

}


/* =========================================================
   DAMAGE EFFECT
========================================================= */

function updateDamageEffect() {

    const overlay =
        document.getElementById(
            "damageOverlay"
        );

    if (!overlay) {
        return;
    }

    overlay.style.opacity =
        damageFlash;

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
            ) / 1000,
            .05
        );

    lastTime =
        now;

    if (
        gameStarted &&
        !paused &&
        !gameOver
    ) {

        elapsed += dt;

        updateMovement(dt);

        updateBattery(dt);

        updateInteraction();

        updateHorror(dt);

        updateReload(dt);

        updateCombat(dt);

        updateZombies(dt);

        updateDamageEffect();

        updateHUD();

    }

    render();

    requestAnimationFrame(
        loop
    );

}


/* =========================================================
   INITIALIZATION
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
