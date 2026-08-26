"use strict";

/* =========================================================
   THE LAST ROOM
   COMPLETE HORROR FPS GAME

   CONTROLS
   ---------------------------------------------------------
   W A S D       = Move
   SHIFT         = Sprint
   MOUSE         = Look
   LEFT CLICK    = Shoot
   RIGHT CLICK   = Aim
   R             = Reload
   1             = Pistol
   2             = Shotgun
   3             = Rifle
   E / ENTER     = Interact
   F             = Flashlight
   ESC           = Pause
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

const mainMenu =
    document.getElementById("mainMenu");

const pauseMenu =
    document.getElementById("pauseMenu");

const controlsPanel =
    document.getElementById("controlsPanel");

const startButton =
    document.getElementById("startButton");

const controlsButton =
    document.getElementById("controlsButton");

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
   CANVAS SAFETY
========================================================= */

if (!canvas || !ctx) {

    console.error(
        "THE LAST ROOM: gameCanvas not found."
    );

}


/* =========================================================
   MENU CLICK FIX
========================================================= */

function setupUI() {

    if (canvas) {

        canvas.style.position = "fixed";
        canvas.style.inset = "0";
        canvas.style.zIndex = "1";
        canvas.style.pointerEvents = "none";

    }

    if (mainMenu) {

        mainMenu.style.position = "fixed";
        mainMenu.style.inset = "0";
        mainMenu.style.zIndex = "1000";
        mainMenu.style.pointerEvents = "auto";

    }

    if (pauseMenu) {

        pauseMenu.style.position = "fixed";
        pauseMenu.style.zIndex = "900";

    }

    if (controlsPanel) {

        controlsPanel.style.zIndex = "1100";

    }

}

setupUI();


/* =========================================================
   CANVAS RESIZE
========================================================= */

function resizeCanvas() {

    if (!canvas || !ctx) {
        return;
    }

    const dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );

    const width =
        Math.max(
            1,
            window.innerWidth
        );

    const height =
        Math.max(
            1,
            window.innerHeight
        );

    canvas.width =
        Math.floor(
            width * dpr
        );

    canvas.height =
        Math.floor(
            height * dpr
        );

    canvas.style.width =
        width + "px";

    canvas.style.height =
        height + "px";

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

    "#################",

    "#...............#",

    "#...............#",

    "#...####D####...#",

    "#...............#",

    "#...............#",

    "#.....###.......#",

    "#.....#.........#",

    "#.....#.........#",

    "#...............#",

    "#...............#",

    "#...............#",

    "#...............#",

    "#################"

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

    stamina: 100,

    maxStamina: 100,

    sprinting: false,

    damageFlash: 0

};


/* =========================================================
   GAME STATE
========================================================= */

let gameStarted =
    false;

let paused =
    false;

let gameOver =
    false;

let victory =
    false;

let elapsed =
    0;


/* =========================================================
   DOOR
========================================================= */

let doorOpen =
    false;

let doorProgress =
    0;


/* =========================================================
   FLASHLIGHT
========================================================= */

let flashlightOn =
    true;

let battery =
    100;


/* =========================================================
   INTERACTION
========================================================= */

let interactionTarget =
    null;


/* =========================================================
   HORROR
========================================================= */

let apparitionActive =
    false;

let apparitionTimer =
    0;

let apparitionTimeout =
    null;


/* =========================================================
   MESSAGE
========================================================= */

let messageTimer =
    null;


/* =========================================================
   POINTER
========================================================= */

let pointerLockPending =
    false;

let mouseDown =
    false;

let aiming =
    false;


/* =========================================================
   MOVEMENT KEYS
========================================================= */

const keys = {

    w: false,

    a: false,

    s: false,

    d: false,

    shift: false

};


/* =========================================================
   WEAPONS
========================================================= */

const weapons = {

    pistol: {

        id: "pistol",

        name: "9MM PISTOL",

        damage: 34,

        fireRate: 3.5,

        magazineSize: 12,

        ammo: 12,

        reserve: 72,

        reloadTime: 1.1,

        spread: 0.035,

        pellets: 1,

        range: 20,

        recoil: 0.035,

        automatic: false,

        color: "#bdbdbd"

    },

    shotgun: {

        id: "shotgun",

        name: "PUMP SHOTGUN",

        damage: 22,

        fireRate: 0.85,

        magazineSize: 6,

        ammo: 6,

        reserve: 30,

        reloadTime: 1.8,

        spread: 0.18,

        pellets: 8,

        range: 12,

        recoil: 0.10,

        automatic: false,

        color: "#8f8f8f"

    },

    rifle: {

        id: "rifle",

        name: "ASSAULT RIFLE",

        damage: 18,

        fireRate: 9,

        magazineSize: 30,

        ammo: 30,

        reserve: 150,

        reloadTime: 1.7,

        spread: 0.028,

        pellets: 1,

        range: 25,

        recoil: 0.022,

        automatic: true,

        color: "#777"

    }

};

const weaponOrder = [

    "pistol",

    "shotgun",

    "rifle"

];

let currentWeaponIndex =
    0;

let currentWeapon =
    weapons.pistol;

let weaponCooldown =
    0;

let reloadTimer =
    0;

let isReloading =
    false;

let weaponRecoil =
    0;

let muzzleFlashTimer =
    0;

let shellTimer =
    0;


/* =========================================================
   ZOMBIES
========================================================= */

const zombies = [];

let zombieIdCounter =
    0;

let zombiesKilled =
    0;

let totalZombiesSpawned =
    0;

const MAX_ZOMBIES =
    12;


/* =========================================================
   ZOMBIE TYPES
========================================================= */

const ZOMBIE_TYPES = {

    normal: {

        health: 100,

        speed: 0.72,

        damage: 9,

        attackRange: 0.75,

        attackCooldown: 1.15,

        radius: 0.28,

        scale: 1

    },

    fast: {

        health: 70,

        speed: 1.15,

        damage: 7,

        attackRange: 0.72,

        attackCooldown: 0.85,

        radius: 0.24,

        scale: 0.92

    },

    brute: {

        health: 220,

        speed: 0.45,

        damage: 18,

        attackRange: 0.85,

        attackCooldown: 1.5,

        radius: 0.34,

        scale: 1.25

    }

};


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
   DYNAMIC HUD
========================================================= */

let hud = null;

let healthBar = null;

let staminaBar = null;

let ammoText = null;

let weaponText = null;

let killText = null;

let zombieCountText = null;

let reloadText = null;

let sprintText = null;

let crosshair = null;

let hitMarker = null;

let gameOverPanel = null;

let victoryPanel = null;


/* =========================================================
   CREATE HUD
========================================================= */

function createHUD() {

    if (
        document.getElementById(
            "fpsHUD"
        )
    ) {

        hud =
            document.getElementById(
                "fpsHUD"
            );

        return;

    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "fpsHUDStyle";

    style.textContent = `

        #fpsHUD {
            position:fixed;
            inset:0;
            z-index:500;
            pointer-events:none;
            font-family:Arial, sans-serif;
            color:#eee;
        }

        #playerPanel {
            position:absolute;
            left:28px;
            bottom:28px;
            width:280px;
            text-shadow:0 2px 5px #000;
        }

        .hudLabel {
            font-size:11px;
            letter-spacing:3px;
            margin-bottom:5px;
            opacity:.8;
        }

        .hudBar {
            height:10px;
            background:rgba(0,0,0,.65);
            border:1px solid rgba(255,255,255,.35);
            margin-bottom:12px;
            overflow:hidden;
        }

        .hudFill {
            height:100%;
            width:100%;
            transition:width .15s ease;
        }

        #healthFill {
            background:#cfcfcf;
        }

        #staminaFill {
            background:#888;
        }

        #weaponPanel {
            position:absolute;
            right:35px;
            bottom:30px;
            text-align:right;
            text-shadow:0 2px 6px #000;
        }

        #weaponName {
            font-size:14px;
            letter-spacing:4px;
            margin-bottom:5px;
        }

        #ammoText {
            font-size:31px;
            font-weight:bold;
            letter-spacing:2px;
        }

        #killPanel {
            position:absolute;
            right:35px;
            top:30px;
            text-align:right;
            font-size:12px;
            letter-spacing:3px;
            line-height:1.8;
            text-shadow:0 2px 5px #000;
        }

        #crosshair {
            position:absolute;
            left:50%;
            top:50%;
            width:18px;
            height:18px;
            transform:translate(-50%,-50%);
        }

        #crosshair:before,
        #crosshair:after {
            content:"";
            position:absolute;
            background:rgba(255,255,255,.8);
        }

        #crosshair:before {
            width:2px;
            height:18px;
            left:8px;
            top:0;
        }

        #crosshair:after {
            width:18px;
            height:2px;
            left:0;
            top:8px;
        }

        #hitMarker {
            position:absolute;
            left:50%;
            top:50%;
            width:26px;
            height:26px;
            transform:translate(-50%,-50%);
            opacity:0;
        }

        #hitMarker:before,
        #hitMarker:after {
            content:"";
            position:absolute;
            inset:0;
            border:2px solid transparent;
            border-top-color:white;
            border-bottom-color:white;
            transform:rotate(45deg);
        }

        #reloadText {
            position:absolute;
            left:50%;
            bottom:120px;
            transform:translateX(-50%);
            font-size:12px;
            letter-spacing:5px;
            opacity:0;
            text-shadow:0 2px 5px black;
        }

        #sprintText {
            position:absolute;
            left:28px;
            bottom:5px;
            font-size:9px;
            letter-spacing:2px;
            opacity:.5;
        }

        .zombieHealth {
            position:absolute;
            height:5px;
            background:rgba(0,0,0,.75);
            border:1px solid rgba(255,255,255,.25);
            overflow:hidden;
        }

        .zombieHealthFill {
            height:100%;
            width:100%;
            background:#ddd;
        }

        .damageScreen {
            position:absolute;
            inset:0;
            background:rgba(255,0,0,.22);
            opacity:0;
            transition:opacity .08s;
        }

        .weaponFlash {
            position:absolute;
            left:50%;
            bottom:15%;
            width:220px;
            height:180px;
            transform:translateX(-50%);
            opacity:0;
            pointer-events:none;
        }

        .weaponFlash:before {
            content:"";
            position:absolute;
            left:50%;
            top:0;
            width:80px;
            height:120px;
            transform:translateX(-50%);
            background:radial-gradient(
                ellipse,
                rgba(255,255,255,.95),
                rgba(180,180,180,.35),
                transparent 70%
            );
        }

        #gameOverPanel,
        #victoryPanel {
            position:fixed;
            inset:0;
            z-index:2000;
            display:none;
            align-items:center;
            justify-content:center;
            background:rgba(0,0,0,.88);
            color:#eee;
            text-align:center;
            font-family:Arial,sans-serif;
        }

        .endBox {
            width:min(500px,85vw);
            border:1px solid rgba(255,255,255,.3);
            padding:50px;
            background:rgba(10,10,10,.9);
        }

        .endTitle {
            font-size:42px;
            letter-spacing:8px;
            margin-bottom:20px;
        }

        .endSub {
            font-size:13px;
            letter-spacing:3px;
            line-height:2;
            opacity:.75;
        }

    `;

    document.head.appendChild(
        style
    );


    hud =
        document.createElement(
            "div"
        );

    hud.id =
        "fpsHUD";

    hud.innerHTML = `

        <div id="playerPanel">

            <div class="hudLabel">
                VITALITY
            </div>

            <div class="hudBar">
                <div
                    id="healthFill"
                    class="hudFill">
                </div>
            </div>

            <div class="hudLabel">
                STAMINA
            </div>

            <div class="hudBar">
                <div
                    id="staminaFill"
                    class="hudFill">
                </div>
            </div>

        </div>


        <div id="weaponPanel">

            <div id="weaponName">
                9MM PISTOL
            </div>

            <div id="ammoText">
                12 / 72
            </div>

        </div>


        <div id="killPanel">

            KILLS:
            <span id="killText">
                0
            </span>

            <br>

            HOSTILES:
            <span id="zombieCount">
                0
            </span>

        </div>


        <div id="crosshair"></div>

        <div id="hitMarker"></div>

        <div id="reloadText">
            RELOADING
        </div>

        <div id="sprintText">
            SHIFT — SPRINT
        </div>

        <div
            id="weaponFlash"
            class="weaponFlash">
        </div>

        <div
            id="damageScreen"
            class="damageScreen">
        </div>

    `;

    document.body.appendChild(
        hud
    );


    healthBar =
        document.getElementById(
            "healthFill"
        );

    staminaBar =
        document.getElementById(
            "staminaFill"
        );

    ammoText =
        document.getElementById(
            "ammoText"
        );

    weaponText =
        document.getElementById(
            "weaponName"
        );

    killText =
        document.getElementById(
            "killText"
        );

    zombieCountText =
        document.getElementById(
            "zombieCount"
        );

    reloadText =
        document.getElementById(
            "reloadText"
        );

    sprintText =
        document.getElementById(
            "sprintText"
        );

    crosshair =
        document.getElementById(
            "crosshair"
        );

    hitMarker =
        document.getElementById(
            "hitMarker"
        );

}

createHUD();


/* =========================================================
   END GAME UI
========================================================= */

function createEndPanels() {

    if (
        document.getElementById(
            "gameOverPanel"
        )
    ) {

        gameOverPanel =
            document.getElementById(
                "gameOverPanel"
            );

        victoryPanel =
            document.getElementById(
                "victoryPanel"
            );

        return;

    }

    gameOverPanel =
        document.createElement(
            "div"
        );

    gameOverPanel.id =
        "gameOverPanel";

    gameOverPanel.innerHTML = `

        <div class="endBox">

            <div class="endTitle">
                YOU DIED
            </div>

            <div class="endSub">
                THE ROOM HAS CLAIMED YOU.
                <br><br>
                KILLS:
                <span id="deathKills">
                    0
                </span>
                <br><br>
                CLICK TO RESTART
            </div>

        </div>

    `;

    victoryPanel =
        document.createElement(
            "div"
        );

    victoryPanel.id =
        "victoryPanel";

    victoryPanel.innerHTML = `

        <div class="endBox">

            <div class="endTitle">
                YOU SURVIVED
            </div>

            <div class="endSub">
                THE DOOR IS OPEN.
                <br><br>
                THE DARKNESS IS STILL BEHIND YOU.
                <br><br>
                KILLS:
                <span id="victoryKills">
                    0
                </span>
                <br><br>
                CLICK TO RESTART
            </div>

        </div>

    `;

    document.body.appendChild(
        gameOverPanel
    );

    document.body.appendChild(
        victoryPanel
    );


    gameOverPanel.addEventListener(
        "click",
        restartEntireGame
    );

    victoryPanel.addEventListener(
        "click",
        restartEntireGame
    );

}

createEndPanels();


/* =========================================================
   UI UPDATE
========================================================= */

function updateHUD() {

    if (healthBar) {

        healthBar.style.width =
            (
                player.health /
                player.maxHealth *
                100
            ) + "%";

    }

    if (staminaBar) {

        staminaBar.style.width =
            (
                player.stamina /
                player.maxStamina *
                100
            ) + "%";

    }

    if (weaponText) {

        weaponText.textContent =
            currentWeapon.name;

    }

    if (ammoText) {

        ammoText.textContent =
            currentWeapon.ammo +
            " / " +
            currentWeapon.reserve;

    }

    if (killText) {

        killText.textContent =
            zombiesKilled;

    }

    if (zombieCountText) {

        zombieCountText.textContent =
            zombies.filter(
                zombie =>
                    !zombie.dead
            ).length;

    }

    if (reloadText) {

        reloadText.style.opacity =
            isReloading
                ? "1"
                : "0";

    }

    if (sprintText) {

        sprintText.style.opacity =
            player.sprinting
                ? "1"
                : ".5";

    }

}


/* =========================================================
   RESET GAME
========================================================= */

function resetGame() {

    player.x =
        2.5;

    player.y =
        2.5;

    player.angle =
        Math.PI / 2;

    player.health =
        100;

    player.stamina =
        100;

    player.sprinting =
        false;

    player.damageFlash =
        0;


    doorOpen =
        false;

    doorProgress =
        0;


    flashlightOn =
        true;

    battery =
        100;


    interactionTarget =
        null;


    apparitionActive =
        false;

    apparitionTimer =
        0;


    weaponCooldown =
        0;

    reloadTimer =
        0;

    isReloading =
        false;

    weaponRecoil =
        0;

    muzzleFlashTimer =
        0;

    shellTimer =
        0;


    currentWeaponIndex =
        0;

    currentWeapon =
        weapons.pistol;


    currentWeapon.ammo =
        currentWeapon.magazineSize;


    weapons.pistol.ammo =
        12;

    weapons.pistol.reserve =
        72;

    weapons.shotgun.ammo =
        6;

    weapons.shotgun.reserve =
        30;

    weapons.rifle.ammo =
        30;

    weapons.rifle.reserve =
        150;


    zombies.length =
        0;

    zombiesKilled =
        0;

    zombieIdCounter =
        0;

    totalZombiesSpawned =
        0;


    elapsed =
        0;


    resetKeys();


    if (
        apparitionTimeout !== null
    ) {

        clearTimeout(
            apparitionTimeout
        );

        apparitionTimeout =
            null;

    }


    if (
        gameOverPanel
    ) {

        gameOverPanel.style.display =
            "none";

    }

    if (
        victoryPanel
    ) {

        victoryPanel.style.display =
            "none";

    }


    if (objective) {

        objective.textContent =
            "Find a way out.";

    }


    updateBatteryUI();

    updateHUD();

    hideInteraction();

    hideMessage();

}


/* =========================================================
   RESET KEYS
========================================================= */

function resetKeys() {

    keys.w =
        false;

    keys.a =
        false;

    keys.s =
        false;

    keys.d =
        false;

    keys.shift =
        false;

    mouseDown =
        false;

    aiming =
        false;

}


/* =========================================================
   KEYDOWN
========================================================= */

window.addEventListener(
    "keydown",
    function(event) {

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

        if (key === "shift") {
            keys.shift = true;
        }


        /* -----------------------------------------
           RELOAD
        ----------------------------------------- */

        if (
            key === "r" &&
            gameStarted &&
            !paused &&
            !gameOver &&
            !victory
        ) {

            event.preventDefault();

            reloadWeapon();

        }


        /* -----------------------------------------
           WEAPON SWITCH
        ----------------------------------------- */

        if (
            (
                key === "1" ||
                key === "2" ||
                key === "3"
            ) &&
            gameStarted &&
            !paused
        ) {

            const index =
                Number(key) - 1;

            switchWeapon(
                index
            );

        }


        /* -----------------------------------------
           FLASHLIGHT
        ----------------------------------------- */

        if (
            key === "f" &&
            gameStarted &&
            !paused &&
            !event.repeat
        ) {

            event.preventDefault();

            toggleFlashlight();

        }


        /* -----------------------------------------
           INTERACTION
        ----------------------------------------- */

        if (
            (
                key === "e" ||
                key === "enter"
            ) &&
            gameStarted &&
            !paused &&
            !event.repeat
        ) {

            event.preventDefault();

            updateInteraction();

            interact();

        }


        /* -----------------------------------------
           ESC
        ----------------------------------------- */

        if (
            key === "escape" &&
            gameStarted &&
            !gameOver &&
            !victory
        ) {

            event.preventDefault();

            if (
                controlsPanel &&
                !controlsPanel.classList.contains(
                    "hidden"
                )
            ) {

                controlsPanel.classList.add(
                    "hidden"
                );

            } else {

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

        if (key === "shift") {
            keys.shift = false;
        }

    }
);


/* =========================================================
   BLUR
========================================================= */

window.addEventListener(
    "blur",
    function() {

        resetKeys();

    }
);


/* =========================================================
   POINTER LOCK
========================================================= */

function requestGamePointerLock() {

    if (
        !gameStarted ||
        paused ||
        gameOver ||
        victory ||
        !canvas
    ) {

        return;

    }

    if (
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

    pointerLockPending =
        true;

    try {

        const promise =
            canvas.requestPointerLock();

        if (
            promise &&
            typeof promise.catch ===
            "function"
        ) {

            promise.catch(
                function() {

                    pointerLockPending =
                        false;

                }
            );

        }

    } catch (error) {

        pointerLockPending =
            false;

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
   MOUSE LOOK
========================================================= */

document.addEventListener(
    "mousemove",
    function(event) {

        if (
            !gameStarted ||
            paused ||
            gameOver ||
            victory
        ) {

            return;

        }

        if (
            document.pointerLockElement ===
            canvas
        ) {

            let sensitivity =
                aiming
                    ? 0.0014
                    : 0.0026;

            player.angle +=
                event.movementX *
                sensitivity;

            player.angle =
                normalizeAngle(
                    player.angle
                );

            return;

        }

    }
);


/* =========================================================
   CANVAS MOUSE DOWN
========================================================= */

if (canvas) {

    canvas.addEventListener(
        "mousedown",
        function(event) {

            if (
                !gameStarted ||
                paused ||
                gameOver ||
                victory
            ) {

                return;

            }

            event.preventDefault();

            if (
                document.pointerLockElement !==
                canvas
            ) {

                requestGamePointerLock();

            }

            if (
                event.button === 0
            ) {

                mouseDown =
                    true;

                shoot();

            }

            if (
                event.button === 2
            ) {

                aiming =
                    true;

            }

        }
    );


    canvas.addEventListener(
        "mouseup",
        function(event) {

            if (
                event.button === 0
            ) {

                mouseDown =
                    false;

            }

            if (
                event.button === 2
            ) {

                aiming =
                    false;

            }

        }
    );


    canvas.addEventListener(
        "contextmenu",
        function(event) {

            event.preventDefault();

        }
    );


    canvas.addEventListener(
        "click",
        function(event) {

            if (
                !gameStarted ||
                paused ||
                gameOver ||
                victory
            ) {

                return;

            }

            requestGamePointerLock();

        }
    );

}


/* =========================================================
   START BUTTON
========================================================= */

if (startButton) {

    startButton.style.pointerEvents =
        "auto";

    startButton.style.position =
        "relative";

    startButton.style.zIndex =
        "1200";

    startButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            event.stopPropagation();

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

    gameStarted =
        true;

    paused =
        false;

    gameOver =
        false;

    victory =
        false;


    resetGame();


    /* -----------------------------------------
       CANVAS NOW ACCEPTS MOUSE
    ----------------------------------------- */

    if (canvas) {

        canvas.style.pointerEvents =
            "auto";

        canvas.style.zIndex =
            "1";

    }


    if (mainMenu) {

        mainMenu.style.transition =
            "opacity .7s ease";

        mainMenu.style.opacity =
            "0";

        mainMenu.style.pointerEvents =
            "none";

        setTimeout(
            function() {

                if (mainMenu) {

                    mainMenu.classList.add(
                        "hidden"
                    );

                }

            },
            750
        );

    }


    showMessage(
        "The room is quiet.",
        "Find a way out."
    );


    startAudio();

    spawnInitialZombies();


    /* Browser allows pointer lock
       because this function came
       directly from ENTER click. */

    requestGamePointerLock();

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

    if (paused) {

        resetKeys();

        if (pauseMenu) {

            pauseMenu.classList.remove(
                "hidden"
            );

            pauseMenu.style.zIndex =
                "900";

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

    }

}


/* =========================================================
   RESUME
========================================================= */

if (resumeButton) {

    resumeButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            paused =
                false;

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
        function(event) {

            event.preventDefault();

            restartEntireGame();

        }
    );

}


function restartEntireGame() {

    gameStarted =
        true;

    paused =
        false;

    gameOver =
        false;

    victory =
        false;


    if (pauseMenu) {

        pauseMenu.classList.add(
            "hidden"
        );

    }

    if (mainMenu) {

        mainMenu.classList.add(
            "hidden"
        );

        mainMenu.style.opacity =
            "0";

        mainMenu.style.pointerEvents =
            "none";

    }


    resetGame();

    startAudio();

    spawnInitialZombies();

    requestGamePointerLock();

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

function isWall(
    x,
    y
) {

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


/* =========================================================
   MOVE COLLISION
========================================================= */

function canMoveTo(
    x,
    y,
    radius = player.radius
) {

    const points = [

        [x - radius, y - radius],

        [x + radius, y - radius],

        [x - radius, y + radius],

        [x + radius, y + radius],

        [x, y - radius],

        [x, y + radius],

        [x - radius, y],

        [x + radius, y]

    ];

    for (
        const point of points
    ) {

        if (
            isWall(
                point[0],
                point[1]
            )
        ) {

            return false;

        }

    }

    return true;

}


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

    let forward =
        0;

    let strafe =
        0;

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


    const moving =
        forward !== 0 ||
        strafe !== 0;


    const wantsSprint =
        keys.shift &&
        moving &&
        player.stamina > 0;


    player.sprinting =
        wantsSprint;


    let speed =
        2.25;


    if (wantsSprint) {

        speed =
            3.65;

        player.stamina -=
            28 * dt;

    } else {

        player.stamina +=
            18 * dt;

    }


    player.stamina =
        Math.max(
            0,
            Math.min(
                player.maxStamina,
                player.stamina
            )
        );


    if (!moving) {

        player.sprinting =
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


    if (
        canMoveTo(
            nextX,
            player.y
        )
    ) {

        player.x =
            nextX;

    }


    if (
        canMoveTo(
            player.x,
            nextY
        )
    ) {

        player.y =
            nextY;

    }

}


/* =========================================================
   DOOR FINDER
========================================================= */

function findDoor() {

    let best =
        null;

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

                    x:
                        x + .5,

                    y:
                        y + .5,

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
        gameOver ||
        victory
    ) {

        interactionTarget =
            null;

        hideInteraction();

        return;

    }


    const door =
        findDoor();


    if (
        !door ||
        door.distance > 1.65
    ) {

        interactionTarget =
            null;

        hideInteraction();

        return;

    }


    const dx =
        door.x -
        player.x;

    const dy =
        door.y -
        player.y;


    const targetAngle =
        Math.atan2(
            dy,
            dx
        );


    const difference =
        Math.abs(
            normalizeAngle(
                targetAngle -
                player.angle
            )
        );


    if (
        difference > .85
    ) {

        interactionTarget =
            null;

        hideInteraction();

        return;

    }


    interactionTarget =
        "door";


    if (interactionMain) {

        interactionMain.textContent =
            doorOpen
                ? "EXIT"
                : "OPEN DOOR";

    }


    if (interactionSub) {

        interactionSub.textContent =
            doorOpen
                ? "Press E to escape"
                : "Press E or ENTER";

    }


    if (interaction) {

        interaction.classList.add(
            "visible"
        );

    }

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


    const door =
        findDoor();


    if (
        !door ||
        door.distance > 1.8
    ) {

        return;

    }


    if (!doorOpen) {

        doorOpen =
            true;

        doorProgress =
            1;


        if (objective) {

            objective.textContent =
                "Something is waiting beyond.";

        }


        showMessage(
            "The door opens.",
            "You should not have done that."
        );


        playDoorSound();


        spawnWave(
            2
        );


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


        updateInteraction();

        return;

    }


    if (
        zombies.filter(
            zombie =>
                !zombie.dead
        ).length === 0
    ) {

        winGame();

    } else {

        showMessage(
            "Something is blocking the exit.",
            "Kill the remaining hostiles."
        );

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
            "The flashlight is dead.",
            "You are not alone."
        );

        return;

    }


    flashlightOn =
        !flashlightOn;


    playFlashlightClick();


    showMessage(
        flashlightOn
            ? "Flashlight ON"
            : "Flashlight OFF",
        flashlightOn
            ? "The darkness retreats."
            : "The darkness returns."
    );

}


/* =========================================================
   BATTERY
========================================================= */

function updateBattery(
    dt
) {

    if (!flashlightOn) {

        return;

    }


    battery -=
        dt * .09;


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
   WEAPON SWITCH
========================================================= */

function switchWeapon(
    index
) {

    if (
        index < 0 ||
        index >= weaponOrder.length
    ) {

        return;

    }


    if (
        isReloading
    ) {

        return;

    }


    currentWeaponIndex =
        index;

    currentWeapon =
        weapons[
            weaponOrder[index]
        ];


    weaponCooldown =
        0;


    updateHUD();


    showMessage(
        currentWeapon.name,
        currentWeapon.ammo +
        " rounds ready."
    );

}


/* =========================================================
   RELOAD
========================================================= */

function reloadWeapon() {

    if (
        isReloading ||
        currentWeapon.ammo >=
        currentWeapon.magazineSize ||
        currentWeapon.reserve <= 0
    ) {

        return;

    }


    isReloading =
        true;

    reloadTimer =
        currentWeapon.reloadTime;


    playReloadSound();


    updateHUD();

}


/* =========================================================
   UPDATE RELOAD
========================================================= */

function updateReload(
    dt
) {

    if (!isReloading) {

        return;

    }


    reloadTimer -=
        dt;


    if (
        reloadTimer <= 0
    ) {

        const needed =
            currentWeapon.magazineSize -
            currentWeapon.ammo;


        const available =
            Math.min(
                needed,
                currentWeapon.reserve
            );


        currentWeapon.ammo +=
            available;

        currentWeapon.reserve -=
            available;


        isReloading =
            false;

        reloadTimer =
            0;


        playReloadCompleteSound();

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
        gameOver ||
        victory
    ) {

        return;

    }


    if (
        isReloading
    ) {

        return;

    }


    if (
        weaponCooldown > 0
    ) {

        return;

    }


    if (
        currentWeapon.ammo <= 0
    ) {

        playEmptyGunSound();

        reloadWeapon();

        return;

    }


    currentWeapon.ammo--;

    weaponCooldown =
        1 /
        currentWeapon.fireRate;


    weaponRecoil =
        currentWeapon.recoil;


    muzzleFlashTimer =
        .07;


    playGunSound(
        currentWeapon.id
    );


    for (
        let i = 0;
        i < currentWeapon.pellets;
        i++
    ) {

        const spread =
            (
                Math.random() -
                .5
            ) *
            currentWeapon.spread;

        const angle =
            player.angle +
            spread;

        shootRay(
            angle,
            currentWeapon.damage,
            currentWeapon.range
        );

    }


    updateHUD();

}


/* =========================================================
   AUTOMATIC FIRE
========================================================= */

function updateShooting(
    dt
) {

    if (
        !mouseDown ||
        !currentWeapon.automatic
    ) {

        return;

    }


    shoot();

}


/* =========================================================
   SHOOT RAY
========================================================= */

function shootRay(
    angle,
    damage,
    range
) {

    let closest =
        null;

    let closestDistance =
        Infinity;


    for (
        const zombie of zombies
    ) {

        if (zombie.dead) {

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
            range
        ) {

            continue;

        }


        const targetAngle =
            Math.atan2(
                dy,
                dx
            );


        const angleDifference =
            Math.abs(
                normalizeAngle(
                    targetAngle -
                    angle
                )
            );


        const hitWidth =
            Math.atan2(
                zombie.radius * 1.5,
                distance
            );


        if (
            angleDifference <
            hitWidth
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
                    closestDistance
                ) {

                    closest =
                        zombie;

                    closestDistance =
                        distance;

                }

            }

        }

    }


    if (closest) {

        damageZombie(
            closest,
            damage
        );

        showHitMarker();

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
            distance * 25
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
   DAMAGE ZOMBIE
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
        .12;


    zombie.alert =
        true;


    playZombieHitSound();


    if (
        zombie.health <= 0
    ) {

        killZombie(
            zombie
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
        zombie.dead
    ) {

        return;

    }


    zombie.dead =
        true;

    zombie.deathTimer =
        .8;


    zombiesKilled++;


    playZombieDeathSound();


    if (objective) {

        const remaining =
            zombies.filter(
                z =>
                    !z.dead
            ).length;


        if (
            remaining === 0 &&
            doorOpen
        ) {

            objective.textContent =
                "Reach the exit.";

        }

    }


    updateHUD();

}


/* =========================================================
   SPAWN INITIAL ZOMBIES
========================================================= */

function spawnInitialZombies() {

    spawnZombie(
        10.5,
        2.5,
        "normal"
    );

    spawnZombie(
        12.5,
        5.5,
        "normal"
    );

    spawnZombie(
        8.5,
        9.5,
        "fast"
    );

}


/* =========================================================
   SPAWN WAVE
========================================================= */

function spawnWave(
    amount
) {

    for (
        let i = 0;
        i < amount;
        i++
    ) {

        if (
            zombies.filter(
                z =>
                    !z.dead
            ).length >=
            MAX_ZOMBIES
        ) {

            break;

        }


        const position =
            findSpawnPosition();


        spawnZombie(
            position.x,
            position.y,
            randomZombieType()
        );

    }


    updateHUD();

}


/* =========================================================
   RANDOM ZOMBIE TYPE
========================================================= */

function randomZombieType() {

    const roll =
        Math.random();


    if (
        roll < .65
    ) {

        return "normal";

    }


    if (
        roll < .88
    ) {

        return "fast";

    }


    return "brute";

}


/* =========================================================
   SPAWN POSITION
========================================================= */

function findSpawnPosition() {

    for (
        let attempt = 0;
        attempt < 100;
        attempt++
    ) {

        const x =
            1.5 +
            Math.random() *
            (
                MAP_WIDTH -
                3
            );

        const y =
            1.5 +
            Math.random() *
            (
                MAP_HEIGHT -
                3
            );


        if (
            !canMoveTo(
                x,
                y,
                .3
            )
        ) {

            continue;

        }


        const distance =
            Math.hypot(
                x -
                player.x,
                y -
                player.y
            );


        if (
            distance <
            5
        ) {

            continue;

        }


        return {
            x,
            y
        };

    }


    return {
        x: 11.5,
        y: 10.5
    };

}


/* =========================================================
   SPAWN ZOMBIE
========================================================= */

function spawnZombie(
    x,
    y,
    typeName = "normal"
) {

    if (
        zombies.filter(
            z =>
                !z.dead
        ).length >=
        MAX_ZOMBIES
    ) {

        return;

    }


    const type =
        ZOMBIE_TYPES[typeName] ||
        ZOMBIE_TYPES.normal;


    const zombie = {

        id:
            ++zombieIdCounter,

        type:
            typeName,

        x,

        y,

        radius:
            type.radius,

        health:
            type.health,

        maxHealth:
            type.health,

        speed:
            type.speed,

        damage:
            type.damage,

        attackRange:
            type.attackRange,

        attackCooldown:
            type.attackCooldown,

        attackTimer:
            Math.random(),

        scale:
            type.scale,

        dead:
            false,

        deathTimer:
            0,

        hitFlash:
            0,

        alert:
            false,

        wanderAngle:
            Math.random() *
            Math.PI * 2,

        wanderTimer:
            1 +

            Math.random() * 3,

        attackAnimation:
            0

    };


    zombies.push(
        zombie
    );


    totalZombiesSpawned++;

}


/* =========================================================
   UPDATE ZOMBIES
========================================================= */

function updateZombies(
    dt
) {

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


        zombie.attackTimer -=
            dt;


        zombie.attackAnimation =
            Math.max(
                0,
                zombie.attackAnimation -
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


        const canSeePlayer =
            distance < 9 &&
            hasLineOfSight(
                zombie.x,
                zombie.y,
                player.x,
                player.y
            );


        if (
            canSeePlayer
        ) {

            zombie.alert =
                true;

        }


        if (
            zombie.alert
        ) {

            updateZombieChase(
                zombie,
                dt,
                dx,
                dy,
                distance
            );

        } else {

            updateZombieWander(
                zombie,
                dt
            );

        }


        if (
            distance <=
            zombie.attackRange
        ) {

            if (
                zombie.attackTimer <=
                0
            ) {

                zombieAttack(
                    zombie
                );

                zombie.attackTimer =
                    zombie.attackCooldown;

            }

        }

    }


    cleanupDeadZombies();

}


/* =========================================================
   ZOMBIE CHASE
========================================================= */

function updateZombieChase(
    zombie,
    dt,
    dx,
    dy,
    distance
) {

    if (
        distance <=
        zombie.attackRange
    ) {

        return;

    }


    if (
        distance <=
        0.001
    ) {

        return;

    }


    const nx =
        dx /
        distance;

    const ny =
        dy /
        distance;


    const speed =
        zombie.speed *
        dt;


    const nextX =
        zombie.x +
        nx *
        speed;

    const nextY =
        zombie.y +
        ny *
        speed;


    if (
        canMoveTo(
            nextX,
            zombie.y,
            zombie.radius
        )
    ) {

        zombie.x =
            nextX;

    } else {

        const sideX =
            -ny;

        if (
            canMoveTo(
                zombie.x +
                sideX *
                speed,
                zombie.y,
                zombie.radius
            )
        ) {

            zombie.x +=
                sideX *
                speed;

        }

    }


    if (
        canMoveTo(
            zombie.x,
            nextY,
            zombie.radius
        )
    ) {

        zombie.y =
            nextY;

    } else {

        const sideY =
            nx;

        if (
            canMoveTo(
                zombie.x,
                zombie.y +
                sideY *
                speed,
                zombie.radius
            )
        ) {

            zombie.y +=
                sideY *
                speed;

        }

    }

}


/* =========================================================
   ZOMBIE WANDER
========================================================= */

function updateZombieWander(
    zombie,
    dt
) {

    zombie.wanderTimer -=
        dt;


    if (
        zombie.wanderTimer <=
        0
    ) {

        zombie.wanderTimer =
            1 +
            Math.random() * 3;

        zombie.wanderAngle =
            Math.random() *
            Math.PI * 2;

    }


    const speed =
        zombie.speed *
        .28 *
        dt;


    const dx =
        Math.cos(
            zombie.wanderAngle
        ) *
        speed;


    const dy =
        Math.sin(
            zombie.wanderAngle
        ) *
        speed;


    if (
        canMoveTo(
            zombie.x + dx,
            zombie.y,
            zombie.radius
        )
    ) {

        zombie.x +=
            dx;

    }


    if (
        canMoveTo(
            zombie.x,
            zombie.y + dy,
            zombie.radius
        )
    ) {

        zombie.y +=
            dy;

    }


    const distance =
        Math.hypot(
            zombie.x -
            player.x,
            zombie.y -
            player.y
        );


    if (
        distance <
        4
    ) {

        zombie.alert =
            true;

    }

}


/* =========================================================
   ZOMBIE ATTACK
========================================================= */

function zombieAttack(
    zombie
) {

    zombie.attackAnimation =
        .35;


    player.health -=
        zombie.damage;


    player.health =
        Math.max(
            0,
            player.health
        );


    player.damageFlash =
        .25;


    playZombieAttackSound();


    showMessage(
        "YOU ARE HURT",
        "-" +
        zombie.damage +
        " HEALTH"
    );


    updateHUD();


    if (
        player.health <=
        0
    ) {

        loseGame();

    }

}


/* =========================================================
   CLEANUP ZOMBIES
========================================================= */

function cleanupDeadZombies() {

    for (
        let i =
            zombies.length - 1;
        i >= 0;
        i--
    ) {

        const zombie =
            zombies[i];


        if (
            zombie.dead &&
            zombie.deathTimer <=
            0
        ) {

            zombies.splice(
                i,
                1
            );

        }

    }

}


/* =========================================================
   SPAWN SYSTEM
========================================================= */

function updateZombieSpawning(
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


    if (
        elapsed > 20 &&
        elapsed < 21
    ) {

        spawnWave(
            2
        );

    }


    if (
        elapsed > 40 &&
        elapsed < 41
    ) {

        spawnWave(
            3
        );

    }


    if (
        elapsed > 65 &&
        elapsed < 66
    ) {

        spawnWave(
            3
        );

    }

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


    let distance =
        0;


    const maxDistance =
        30;

    const step =
        .025;


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

                type:
                    "wall"

            };

        }


        const tile =
            MAP[mapY][mapX];


        if (
            tile === "#"
        ) {

            return {

                distance,

                type:
                    "wall"

            };

        }


        if (
            tile === "D" &&
            !doorOpen
        ) {

            return {

                distance,

                type:
                    "door"

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


    drawDamageEffect(
        width,
        height
    );

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


    if (
        flashlightOn
    ) {

        gradient.addColorStop(
            0,
            "#060606"
        );

        gradient.addColorStop(
            .5,
            "#111111"
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
        width,
        height
    );

}


/* =========================================================
   WORLD
========================================================= */

function drawWorld(
    width,
    height
) {

    const columns =
        Math.min(
            900,
            Math.max(
                320,
                Math.floor(
                    width / 1.5
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


        ctx.fillStyle =
            getWallShade(
                safeDistance,
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

function getWallShade(
    distance,
    type
) {

    let light =
        105 /
        Math.max(
            1,
            distance *
            distance
        );


    if (
        flashlightOn
    ) {

        light *=
            3.2;

    } else {

        light *=
            .25;

    }


    light =
        Math.max(
            3,
            Math.min(
                125,
                light
            )
        );


    if (
        type === "door"
    ) {

        light *=
            .55;

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
   ZOMBIE RENDER
========================================================= */

function drawZombies(
    width,
    height
) {

    const visible =
        [];


    for (
        const zombie of zombies
    ) {

        if (
            zombie.dead &&
            zombie.deathTimer <=
            0
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


        let angle =
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
            !hasLineOfSight(
                player.x,
                player.y,
                zombie.x,
                zombie.y
            )
        ) {

            continue;

        }


        const corrected =
            distance *
            Math.cos(angle);


        if (
            corrected <=
            .05
        ) {

            continue;

        }


        const screenX =
            width / 2 +
            (
                angle /
                (FOV / 2)
            ) *
            (
                width / 2
            );


        const size =
            Math.min(
                height * .9,
                (
                    height /
                    corrected
                ) *
                .72 *
                zombie.scale
            );


        visible.push({

            zombie,

            distance,

            screenX,

            size

        });

    }


    visible.sort(
        (
            a,
            b
        ) =>
            b.distance -
            a.distance
    );


    for (
        const item of visible
    ) {

        drawZombieSprite(
            item.zombie,
            item.screenX,
            height / 2,
            item.size
        );

    }

}


/* =========================================================
   ZOMBIE SPRITE
========================================================= */

function drawZombieSprite(
    zombie,
    x,
    centerY,
    size
) {

    const bodyHeight =
        size;

    const bodyWidth =
        size *
        .38;


    const top =
        centerY -
        bodyHeight *
        .48;


    const healthPercent =
        Math.max(
            0,
            zombie.health /
            zombie.maxHealth
        );


    /* -----------------------------------------
       HEALTH BAR
    ----------------------------------------- */

    const barWidth =
        Math.max(
            30,
            bodyWidth
        );


    ctx.fillStyle =
        "rgba(0,0,0,.8)";


    ctx.fillRect(
        x -
        barWidth / 2,
        top -
        14,
        barWidth,
        6
    );


    ctx.fillStyle =
        "#ddd";


    ctx.fillRect(
        x -
        barWidth / 2,
        top -
        14,
        barWidth *
        healthPercent,
        6
    );


    /* -----------------------------------------
       DEATH
    ----------------------------------------- */

    let deathScale =
        1;


    if (
        zombie.dead
    ) {

        deathScale =
            Math.max(
                0,
                zombie.deathTimer /
                .8
            );

    }


    const bodyTop =
        top +
        bodyHeight *
        .2;


    /* -----------------------------------------
       HEAD
    ----------------------------------------- */

    const headRadius =
        size *
        .13;


    ctx.fillStyle =
        zombie.hitFlash > 0
            ? "#ffffff"
            : "#9a9a9a";


    ctx.beginPath();

    ctx.arc(
        x,
        bodyTop +
        headRadius,
        headRadius,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* -----------------------------------------
       BODY
    ----------------------------------------- */

    ctx.fillStyle =
        zombie.type === "brute"
            ? "#666"
            : "#777";


    ctx.fillRect(
        x -
        bodyWidth / 2,
        bodyTop +
        headRadius * 1.6,
        bodyWidth,
        bodyHeight *
        .48 *
        deathScale
    );


    /* -----------------------------------------
       ARMS
    ----------------------------------------- */

    const armY =
        bodyTop +
        bodyHeight *
        .42;


    ctx.strokeStyle =
        "#777";


    ctx.lineWidth =
        Math.max(
            2,
            size * .035
        );


    ctx.beginPath();


    ctx.moveTo(
        x -
        bodyWidth / 2,
        armY
    );


    ctx.lineTo(
        x -
        bodyWidth *
        .9,
        armY +
        bodyHeight *
        .13
    );


    ctx.moveTo(
        x +
        bodyWidth / 2,
        armY
    );


    ctx.lineTo(
        x +
        bodyWidth *
        .9,
        armY +
        bodyHeight *
        .13
    );


    ctx.stroke();


    /* -----------------------------------------
       EYES
    ----------------------------------------- */

    ctx.fillStyle =
        "#eee";


    const eyeSize =
        Math.max(
            1.5,
            size * .025
        );


    ctx.fillRect(
        x -
        headRadius *
        .45,
        bodyTop +
        headRadius *
        .8,
        eyeSize,
        eyeSize
    );


    ctx.fillRect(
        x +
        headRadius *
        .25,
        bodyTop +
        headRadius *
        .8,
        eyeSize,
        eyeSize
    );


    /* -----------------------------------------
       DEATH DARKENING
    ----------------------------------------- */

    if (
        zombie.dead
    ) {

        ctx.fillStyle =
            "rgba(0,0,0,.45)";

        ctx.fillRect(
            x -
            bodyWidth,
            top,
            bodyWidth * 2,
            bodyHeight
        );

    }

}


/* =========================================================
   WEAPON RENDER
========================================================= */

function drawWeapon(
    width,
    height
) {

    if (
        !gameStarted ||
        gameOver ||
        victory
    ) {

        return;

    }


    weaponRecoil *=
        .88;


    const recoil =
        weaponRecoil;


    const baseY =
        height *
        .91 +
        recoil *
        height;


    const centerX =
        width / 2;


    ctx.save();


    ctx.translate(
        centerX,
        baseY
    );


    if (
        aiming
    ) {

        ctx.scale(
            .72,
            .72
        );

    }


    if (
        currentWeapon.id ===
        "pistol"
    ) {

        drawPistol();

    }


    if (
        currentWeapon.id ===
        "shotgun"
    ) {

        drawShotgun();

    }


    if (
        currentWeapon.id ===
        "rifle"
    ) {

        drawRifle();

    }


    ctx.restore();


    if (
        muzzleFlashTimer >
        0
    ) {

        drawMuzzleFlash(
            width,
            height
        );

    }

}


/* =========================================================
   PISTOL
========================================================= */

function drawPistol() {

    ctx.fillStyle =
        "#171717";


    ctx.fillRect(
        -34,
        -95,
        68,
        105
    );


    ctx.fillStyle =
        "#343434";


    ctx.fillRect(
        -43,
        -110,
        86,
        25
    );


    ctx.fillStyle =
        "#111";


    ctx.fillRect(
        -25,
        -85,
        50,
        16
    );


    ctx.fillRect(
        -22,
        0,
        44,
        75
    );


    ctx.fillStyle =
        "#555";


    ctx.fillRect(
        -19,
        15,
        38,
        52
    );

}


/* =========================================================
   SHOTGUN
========================================================= */

function drawShotgun() {

    ctx.fillStyle =
        "#222";


    ctx.fillRect(
        -24,
        -150,
        48,
        160
    );


    ctx.fillStyle =
        "#555";


    ctx.fillRect(
        -30,
        -165,
        60,
        25
    );


    ctx.fillStyle =
        "#111";


    ctx.fillRect(
        -18,
        0,
        36,
        95
    );


    ctx.fillStyle =
        "#777";


    ctx.fillRect(
        -55,
        -45,
        110,
        15
    );

}


/* =========================================================
   RIFLE
========================================================= */

function drawRifle() {

    ctx.fillStyle =
        "#191919";


    ctx.fillRect(
        -28,
        -165,
        56,
        170
    );


    ctx.fillStyle =
        "#555";


    ctx.fillRect(
        -80,
        -130,
        160,
        22
    );


    ctx.fillStyle =
        "#111";


    ctx.fillRect(
        -20,
        0,
        40,
        95
    );


    ctx.fillStyle =
        "#666";


    ctx.fillRect(
        -62,
        -108,
        124,
        12
    );


    ctx.fillRect(
        -20,
        -55,
        40,
        55
    );

}


/* =========================================================
   MUZZLE FLASH
========================================================= */

function drawMuzzleFlash(
    width,
    height
) {

    const alpha =
        Math.min(
            1,
            muzzleFlashTimer *
            18
        );


    const gradient =
        ctx.createRadialGradient(
            width / 2,
            height * .72,
            5,
            width / 2,
            height * .72,
            130
        );


    gradient.addColorStop(
        0,
        "rgba(255,255,255," +
        alpha +
        ")"
    );


    gradient.addColorStop(
        .25,
        "rgba(200,200,200," +
        alpha * .6 +
        ")"
    );


    gradient.addColorStop(
        1,
        "rgba(0,0,0,0)"
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
   APPARITION
========================================================= */

function updateHorror(
    dt
) {

    apparitionTimer +=
        dt;


    if (
        !apparitionActive &&
        apparitionTimer >
        18
    ) {

        apparitionTimer =
            0;


        if (
            Math.random() <
            .5
        ) {

            apparitionActive =
                true;


            if (
                apparitionTimeout !==
                null
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

                    },
                    1500
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

    if (
        !apparitionActive
    ) {

        return;

    }


    const alpha =
        .10 +
        Math.sin(
            elapsed * 10
        ) *
        .025;


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
            250
        );


    gradient.addColorStop(
        0,
        "rgba(220,220,220," +
        alpha +
        ")"
    );


    gradient.addColorStop(
        .4,
        "rgba(130,130,130," +
        alpha *
        .4 +
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
        centerY - 40,
        75,
        145,
        0,
        0,
        Math.PI * 2
    );


    ctx.fill();

}


/* =========================================================
   DAMAGE EFFECT
========================================================= */

function drawDamageEffect(
    width,
    height
) {

    if (
        player.damageFlash <=
        0
    ) {

        return;

    }


    ctx.fillStyle =
        "rgba(180,0,0," +
        Math.min(
            .4,
            player.damageFlash
        ) +
        ")";


    ctx.fillRect(
        0,
        0,
        width,
        height
    );

}


/* =========================================================
   HIT MARKER
========================================================= */

function showHitMarker() {

    if (!hitMarker) {

        return;

    }


    hitMarker.style.opacity =
        "1";


    clearTimeout(
        showHitMarker.timer
    );


    showHitMarker.timer =
        setTimeout(
            function() {

                if (hitMarker) {

                    hitMarker.style.opacity =
                        "0";

                }

            },
            90
        );

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
        "";


    const main =
        document.createElement(
            "div"
        );


    main.textContent =
        mainText || "";


    message.appendChild(
        main
    );


    if (
        subText
    ) {

        const span =
            document.createElement(
                "span"
            );


        span.textContent =
            subText;


        message.appendChild(
            span
        );

    }


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


/* =========================================================
   HIDE MESSAGE
========================================================= */

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


/* =========================================================
   INTERACTION HIDE
========================================================= */

function hideInteraction() {

    if (
        interaction
    ) {

        interaction.classList.remove(
            "visible"
        );

    }

}


/* =========================================================
   PLAYER DAMAGE EFFECT UPDATE
========================================================= */

function updatePlayerEffects(
    dt
) {

    player.damageFlash =
        Math.max(
            0,
            player.damageFlash -
            dt
        );

}


/* =========================================================
   WEAPON TIMER UPDATE
========================================================= */

function updateWeapon(
    dt
) {

    weaponCooldown =
        Math.max(
            0,
            weaponCooldown -
            dt
        );


    muzzleFlashTimer =
        Math.max(
            0,
            muzzleFlashTimer -
            dt
        );


    updateReload(
        dt
    );


    updateShooting(
        dt
    );

}


/* =========================================================
   GAME OVER
========================================================= */

function loseGame() {

    if (
        gameOver ||
        victory
    ) {

        return;

    }


    gameOver =
        true;

    paused =
        false;

    resetKeys();


    if (
        document.pointerLockElement ===
        canvas
    ) {

        try {

            document.exitPointerLock();

        } catch (error) {}

    }


    const deathKills =
        document.getElementById(
            "deathKills"
        );


    if (deathKills) {

        deathKills.textContent =
            zombiesKilled;

    }


    if (gameOverPanel) {

        gameOverPanel.style.display =
            "flex";

    }

}


/* =========================================================
   VICTORY
========================================================= */

function winGame() {

    if (
        gameOver ||
        victory
    ) {

        return;

    }


    victory =
        true;


    resetKeys();


    if (
        document.pointerLockElement ===
        canvas
    ) {

        try {

            document.exitPointerLock();

        } catch (error) {}

    }


    const victoryKills =
        document.getElementById(
            "victoryKills"
        );


    if (victoryKills) {

        victoryKills.textContent =
            zombiesKilled;

    }


    if (victoryPanel) {

        victoryPanel.style.display =
            "flex";

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
   AUDIO START
========================================================= */

function startAudio() {

    if (
        audioContext
    ) {

        if (
            audioContext.state ===
            "suspended"
        ) {

            audioContext
                .resume()
                .catch(
                    function() {}
                );

        }

        return;

    }


    try {

        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;


        if (!AudioContextClass) {

            return;

        }


        audioContext =
            new AudioContextClass();


        masterGain =
            audioContext.createGain();


        masterGain.gain.value =
            .45;


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

    if (
        !audioContext ||
        !ambientGain
    ) {

        return;

    }


    const oscillator =
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


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
        audioContext
            .createOscillator();


    const gain2 =
        audioContext
            .createGain();


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
   GUN SOUND
========================================================= */

function playGunSound(
    weaponType
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
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


    oscillator.type =
        weaponType ===
        "shotgun"
            ? "sawtooth"
            : "square";


    oscillator.frequency.setValueAtTime(
        weaponType ===
        "shotgun"
            ? 80
            : 150,
        now
    );


    oscillator.frequency.exponentialRampToValueAtTime(
        35,
        now + .12
    );


    gain.gain.setValueAtTime(
        .18,
        now
    );


    gain.gain.exponentialRampToValueAtTime(
        .0001,
        now + .14
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
        now + .15
    );

}


/* =========================================================
   EMPTY GUN
========================================================= */

function playEmptyGunSound() {

    if (
        !audioContext ||
        !masterGain
    ) {

        return;

    }


    const now =
        audioContext.currentTime;


    const oscillator =
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


    oscillator.type =
        "square";


    oscillator.frequency.value =
        90;


    gain.gain.setValueAtTime(
        .06,
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


    oscillator.start(
        now
    );


    oscillator.stop(
        now + .07
    );

}


/* =========================================================
   RELOAD SOUND
========================================================= */

function playReloadSound() {

    if (
        !audioContext ||
        !masterGain
    ) {

        return;

    }


    const now =
        audioContext.currentTime;


    const oscillator =
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


    oscillator.type =
        "triangle";


    oscillator.frequency.value =
        180;


    gain.gain.setValueAtTime(
        .05,
        now
    );


    gain.gain.exponentialRampToValueAtTime(
        .0001,
        now + .25
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
        now + .26
    );

}


/* =========================================================
   RELOAD COMPLETE
========================================================= */

function playReloadCompleteSound() {

    if (
        !audioContext ||
        !masterGain
    ) {

        return;

    }


    const now =
        audioContext.currentTime;


    const oscillator =
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


    oscillator.type =
        "square";


    oscillator.frequency.value =
        280;


    gain.gain.setValueAtTime(
        .04,
        now
    );


    gain.gain.exponentialRampToValueAtTime(
        .0001,
        now + .07
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
        now + .08
    );

}


/* =========================================================
   FLASHLIGHT SOUND
========================================================= */

function playFlashlightClick() {

    if (
        !audioContext ||
        !masterGain
    ) {

        return;

    }


    const now =
        audioContext.currentTime;


    const oscillator =
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


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
        now + .05
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
        now + .06
    );

}


/* =========================================================
   DOOR SOUND
========================================================= */

function playDoorSound() {

    if (
        !audioContext ||
        !masterGain
    ) {

        return;

    }


    const now =
        audioContext.currentTime;


    const oscillator =
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


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
        .12,
        now
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


    oscillator.start(
        now
    );


    oscillator.stop(
        now + 1.3
    );

}


/* =========================================================
   ZOMBIE HIT SOUND
========================================================= */

function playZombieHitSound() {

    if (
        !audioContext ||
        !masterGain
    ) {

        return;

    }


    const now =
        audioContext.currentTime;


    const oscillator =
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


    oscillator.type =
        "sawtooth";


    oscillator.frequency.value =
        90;


    gain.gain.setValueAtTime(
        .06,
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


    oscillator.start(
        now
    );


    oscillator.stop(
        now + .13
    );

}


/* =========================================================
   ZOMBIE DEATH SOUND
========================================================= */

function playZombieDeathSound() {

    if (
        !audioContext ||
        !masterGain
    ) {

        return;

    }


    const now =
        audioContext.currentTime;


    const oscillator =
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


    oscillator.type =
        "sawtooth";


    oscillator.frequency.setValueAtTime(
        180,
        now
    );


    oscillator.frequency.exponentialRampToValueAtTime(
        40,
        now + .45
    );


    gain.gain.setValueAtTime(
        .09,
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


    oscillator.start(
        now
    );


    oscillator.stop(
        now + .5
    );

}


/* =========================================================
   ZOMBIE ATTACK SOUND
========================================================= */

function playZombieAttackSound() {

    if (
        !audioContext ||
        !masterGain
    ) {

        return;

    }


    const now =
        audioContext.currentTime;


    const oscillator =
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


    oscillator.type =
        "sawtooth";


    oscillator.frequency.setValueAtTime(
        120,
        now
    );


    oscillator.frequency.exponentialRampToValueAtTime(
        45,
        now + .3
    );


    gain.gain.setValueAtTime(
        .11,
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


    oscillator.start(
        now
    );


    oscillator.stop(
        now + .35
    );

}


/* =========================================================
   WHISPER
========================================================= */

function playWhisper() {

    if (
        !audioContext ||
        !masterGain
    ) {

        return;

    }


    const buffer =
        audioContext.createBuffer(
            1,
            Math.floor(
                audioContext.sampleRate *
                1.3
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
        1100;


    filter.Q.value =
        3;


    const gain =
        audioContext
            .createGain();


    gain.gain.value =
        .06;


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
   FOOTSTEP
========================================================= */

function playFootstep() {

    if (
        !audioContext ||
        !masterGain
    ) {

        return;

    }


    const now =
        audioContext.currentTime;


    const oscillator =
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


    oscillator.type =
        "triangle";


    oscillator.frequency.value =
        65;


    gain.gain.setValueAtTime(
        .06,
        now
    );


    gain.gain.exponentialRampToValueAtTime(
        .0001,
        now + .09
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
        now + .1
    );

}


/* =========================================================
   GAME LOOP
========================================================= */

let lastTime =
    performance.now();


function loop(
    now
) {

    const dt =
        Math.min(
            .05,
            Math.max(
                0,
                (
                    now -
                    lastTime
                ) / 1000
            )
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


        updateBattery(
            dt
        );


        updateInteraction();


        updateHorror(
            dt
        );


        updateWeapon(
            dt
        );


        updateZombies(
            dt
        );


        updateZombieSpawning(
            dt
        );


        updatePlayerEffects(
            dt
        );


        updateHUD();


        /* -----------------------------------------
           PLAYER FOOTSTEP
        ----------------------------------------- */

        if (
            player.sprinting &&
            (
                keys.w ||
                keys.a ||
                keys.s ||
                keys.d
            )
        ) {

            shellTimer -=
                dt;


            if (
                shellTimer <=
                0
            ) {

                playFootstep();

                shellTimer =
                    .27;

            }

        } else {

            shellTimer =
                0;

        }

    }


    render();


    requestAnimationFrame(
        loop
    );

}


/* =========================================================
   INITIALIZATION
========================================================= */

resetGame();

updateHUD();

requestAnimationFrame(
    loop
);
