/*
=========================================================
 ZOMBIE ROOM GAME
 Corrected Version
 ENTER KEY FREEZE FIX
=========================================================
*/

"use strict";

/* =========================================================
   THREE.JS CHECK
========================================================= */

if (typeof THREE === "undefined") {
    console.error("THREE.js is not loaded.");
    throw new Error("THREE.js is required.");
}

/* =========================================================
   DOM ELEMENTS
========================================================= */

const canvas = document.getElementById("gameCanvas");

if (!canvas) {
    throw new Error("gameCanvas element was not found.");
}

const startScreen = document.getElementById("startScreen");
const pauseScreen = document.getElementById("pauseScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const startButton = document.getElementById("startButton");
const resumeButton = document.getElementById("resumeButton");
const restartButton = document.getElementById("restartButton");

const healthFill = document.getElementById("healthFill");
const healthText = document.getElementById("healthText");

const ammoText = document.getElementById("ammoText");
const weaponText = document.getElementById("weaponText");

const messageBox = document.getElementById("messageBox");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");

const crosshair = document.getElementById("crosshair");

/* =========================================================
   GAME STATE
========================================================= */

const state = {
    started: false,
    paused: false,
    gameOver: false,
    horrorTriggered: false
};

/*
   IMPORTANT:
   Prevent Enter key auto-repeat from repeatedly
   triggering start / pause / interaction.
*/
const keyState = Object.create(null);

let enterPressed = false;

/* =========================================================
   ROOM CONFIGURATION
========================================================= */

const ROOM = {
    width: 24,
    depth: 18,
    height: 7
};

/* =========================================================
   ZOMBIE CONFIGURATION
========================================================= */

const ZOMBIE_CONFIG = {
    health: 100,
    speed: 0.65,
    chaseSpeed: 1.25,
    detectionDistance: 30,
    attackDistance: 1.45,
    attackDamage: 8,
    attackCooldown: 1000
};

/* =========================================================
   PLAYER HEALTH
========================================================= */

const health = {
    maximum: 100,
    current: 100,
    damageCooldown: 0,
    damageCooldownTime: 700
};

/* =========================================================
   THREE.JS VARIABLES
========================================================= */

let scene;
let camera;
let renderer;

let player;

let clock;

let raycaster;

let apparition = null;

const zombies = [];

const zombieMeshes = [];

const ceilingLights = [];

/* =========================================================
   INPUT
========================================================= */

const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false
};

/* =========================================================
   WEAPON DATA
========================================================= */

const weapons = {
    pistol: {
        name: "PISTOL",
        damage: 34,
        magazine: 12,
        magazineSize: 12,
        reserve: 72,
        reloadTime: 900
    },

    shotgun: {
        name: "SHOTGUN",
        damage: 75,
        magazine: 6,
        magazineSize: 6,
        reserve: 36,
        reloadTime: 1300
    }
};

const weaponOrder = [
    "pistol",
    "shotgun"
];

let currentWeaponIndex = 0;

let reloading = false;

/* =========================================================
   UTILITY FUNCTIONS
========================================================= */

function clamp(value, minimum, maximum) {
    return Math.max(
        minimum,
        Math.min(
            maximum,
            value
        )
    );
}

function distance2D(a, b) {
    const dx = a.x - b.x;
    const dz = a.z - b.z;

    return Math.sqrt(
        dx * dx +
        dz * dz
    );
}

function getCurrentWeapon() {
    return weapons[
        weaponOrder[currentWeaponIndex]
    ];
}

/* =========================================================
   AUDIO
========================================================= */

let audioContext = null;

function getAudioContext() {
    if (!audioContext) {
        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

        if (AudioContextClass) {
            audioContext =
                new AudioContextClass();
        }
    }

    return audioContext;
}

function sound(
    frequency,
    duration,
    volume,
    type
) {
    try {
        const ctx = getAudioContext();

        if (!ctx) {
            return;
        }

        if (ctx.state === "suspended") {
            ctx.resume().catch(() => {});
        }

        const oscillator =
            ctx.createOscillator();

        const gain =
            ctx.createGain();

        oscillator.type =
            type || "sine";

        oscillator.frequency.value =
            frequency;

        gain.gain.value =
            volume;

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        gain.gain.setValueAtTime(
            volume,
            now
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            now + duration
        );

        oscillator.start(now);

        oscillator.stop(
            now + duration
        );
    }
    catch (error) {
        console.warn(
            "Audio error:",
            error
        );
    }
}

/* =========================================================
   MESSAGE SYSTEM
========================================================= */

let messageTimer = null;

function showMessage(
    title,
    text,
    duration = 1000
) {
    if (!messageBox) {
        return;
    }

    if (messageTitle) {
        messageTitle.textContent =
            title || "";
    }

    if (messageText) {
        messageText.textContent =
            text || "";
    }

    messageBox.classList.add(
        "show"
    );

    if (messageTimer) {
        clearTimeout(
            messageTimer
        );
    }

    messageTimer =
        setTimeout(
            () => {
                messageBox.classList.remove(
                    "show"
                );
            },
            duration
        );
}

/* =========================================================
   HEALTH HUD
========================================================= */

function updateHealthHUD() {
    if (!healthFill ||
        !healthText) {
        return;
    }

    const percentage =
        (
            health.current /
            health.maximum
        ) * 100;

    healthFill.style.width =
        `${clamp(
            percentage,
            0,
            100
        )}%`;

    healthText.textContent =
        `${Math.ceil(
            health.current
        )}`;
}

/* =========================================================
   AMMO HUD
========================================================= */

function updateAmmoHUD() {
    const weapon =
        getCurrentWeapon();

    if (ammoText) {
        ammoText.textContent =
            `${weapon.magazine} / ${weapon.reserve}`;
    }

    if (weaponText) {
        weaponText.textContent =
            weapon.name;
    }
}

/* =========================================================
   KEYBOARD INPUT
========================================================= */

window.addEventListener(
    "keydown",
    function(event) {

        /*
         ====================================================
         ENTER FIX
         ====================================================

         Browser can fire keydown repeatedly while Enter
         is held down.

         We ONLY process Enter when it changes from
         not-pressed -> pressed.

         This prevents:
         - multiple startGame() calls
         - multiple pauseGame() calls
         - multiple interaction calls
         - recursive state changes
         - apparent game freeze
        */

        if (
            event.code === "Enter" ||
            event.key === "Enter"
        ) {

            event.preventDefault();
            event.stopPropagation();

            if (
                event.repeat ||
                enterPressed
            ) {
                return;
            }

            enterPressed = true;

            handleEnter();

            return;
        }

        /*
         ----------------------------------------------------
         Normal movement keys
         ----------------------------------------------------
        */

        const code =
            event.code;

        if (code === "KeyW" ||
            code === "ArrowUp") {
            keys.forward = true;
        }

        if (code === "KeyS" ||
            code === "ArrowDown") {
            keys.backward = true;
        }

        if (code === "KeyA" ||
            code === "ArrowLeft") {
            keys.left = true;
        }

        if (code === "KeyD" ||
            code === "ArrowRight") {
            keys.right = true;
        }

        if (
            code === "ShiftLeft" ||
            code === "ShiftRight"
        ) {
            keys.sprint = true;
        }

        /*
         ----------------------------------------------------
         Reload
         ----------------------------------------------------
        */

        if (code === "KeyR") {
            reload();
        }

        /*
         ----------------------------------------------------
         Weapon switch
         ----------------------------------------------------
        */

        if (code === "KeyQ") {
            switchWeapon();
        }

        /*
         ----------------------------------------------------
         Fire
         ----------------------------------------------------
        */

        if (
            code === "Space" ||
            event.key === " "
        ) {
            event.preventDefault();

            shoot();
        }
    },
    {
        passive: false
    }
);

/* =========================================================
   KEYUP
========================================================= */

window.addEventListener(
    "keyup",
    function(event) {

        if (
            event.code === "Enter" ||
            event.key === "Enter"
        ) {
            event.preventDefault();

            enterPressed = false;

            return;
        }

        const code =
            event.code;

        if (code === "KeyW" ||
            code === "ArrowUp") {
            keys.forward = false;
        }

        if (code === "KeyS" ||
            code === "ArrowDown") {
            keys.backward = false;
        }

        if (code === "KeyA" ||
            code === "ArrowLeft") {
            keys.left = false;
        }

        if (code === "KeyD" ||
            code === "ArrowRight") {
            keys.right = false;
        }

        if (
            code === "ShiftLeft" ||
            code === "ShiftRight"
        ) {
            keys.sprint = false;
        }
    },
    {
        passive: false
    }
);

/* =========================================================
   ENTER HANDLER
========================================================= */

function handleEnter() {

    /*
     IMPORTANT:
     Never call requestAnimationFrame,
     startGame or pauseGame recursively here.
    */

    if (!state.started) {
        startGame();
        return;
    }

    if (state.gameOver) {
        restartGame();
        return;
    }

    if (state.paused) {
        resumeGame();
        return;
    }

    /*
     During active gameplay Enter can be used
     for interaction.
    */

    interact();
}

/* =========================================================
   INTERACTION
========================================================= */

function interact() {

    if (!state.started ||
        state.paused ||
        state.gameOver) {
        return;
    }

    /*
     Keep interaction lightweight.
     Do NOT start another game loop here.
    */

    showMessage(
        "INTERACT",
        "Nothing to interact with here.",
        700
    );
}

/* =========================================================
   START GAME
========================================================= */

function startGame() {

    if (state.started &&
        !state.gameOver) {
        return;
    }

    state.started = true;
    state.paused = false;
    state.gameOver = false;
    state.horrorTriggered = false;

    health.current =
        health.maximum;

    health.damageCooldown = 0;

    reloading = false;

    currentWeaponIndex = 0;

    /*
     Reset weapons.
    */

    weapons.pistol.magazine = 12;
    weapons.pistol.reserve = 72;

    weapons.shotgun.magazine = 6;
    weapons.shotgun.reserve = 36;

    /*
     Remove old zombies.
    */

    clearZombies();

    /*
     Reset player.
    */

    if (player) {
        player.position.set(
            0,
            1.7,
            5
        );

        player.rotation.set(
            0,
            0,
            0
        );
    }

    /*
     Hide menus.
    */

    if (startScreen) {
        startScreen.classList.add(
            "hidden"
        );
    }

    if (pauseScreen) {
        pauseScreen.classList.add(
            "hidden"
        );
    }

    if (gameOverScreen) {
        gameOverScreen.classList.add(
            "hidden"
        );
    }

    updateHealthHUD();
    updateAmmoHUD();

    createZombies();

    if (!apparition) {
        createApparition();
    }

    showMessage(
        "START",
        "Survive the room.",
        1200
    );

    /*
     Audio must be resumed from user interaction.
    */

    try {
        const ctx =
            getAudioContext();

        if (ctx &&
            ctx.state === "suspended") {
            ctx.resume().catch(() => {});
        }
    }
    catch (error) {}

    /*
     IMPORTANT:
     Do NOT call animate() here if the animation loop
     has already been started by init().
    */
}

/* =========================================================
   PAUSE GAME
========================================================= */

function pauseGame() {

    if (!state.started ||
        state.gameOver) {
        return;
    }

    if (state.paused) {
        return;
    }

    state.paused = true;

    if (pauseScreen) {
        pauseScreen.classList.remove(
            "hidden"
        );
    }

    showMessage(
        "PAUSED",
        "Press ENTER to resume.",
        1200
    );
}

/* =========================================================
   RESUME GAME
========================================================= */

function resumeGame() {

    if (!state.started ||
        state.gameOver) {
        return;
    }

    if (!state.paused) {
        return;
    }

    state.paused = false;

    if (pauseScreen) {
        pauseScreen.classList.add(
            "hidden"
        );
    }

    showMessage(
        "RESUMED",
        "Stay alert.",
        800
    );
}

/* =========================================================
   RESTART GAME
========================================================= */

function restartGame() {

    state.started = false;
    state.paused = false;
    state.gameOver = false;
    state.horrorTriggered = false;

    clearZombies();

    if (apparition) {
        apparition.visible = false;
    }

    if (gameOverScreen) {
        gameOverScreen.classList.add(
            "hidden"
        );
    }

    if (pauseScreen) {
        pauseScreen.classList.add(
            "hidden"
        );
    }

    if (startScreen) {
        startScreen.classList.remove(
            "hidden"
        );
    }

    health.current =
        health.maximum;

    health.damageCooldown = 0;

    reloading = false;

    updateHealthHUD();
    updateAmmoHUD();

    if (player) {
        player.position.set(
            0,
            1.7,
            5
        );
    }
}

/* =========================================================
   END GAME
========================================================= */

function endGame(won) {

    if (state.gameOver) {
        return;
    }

    state.gameOver = true;
    state.paused = false;

    reloading = false;

    if (gameOverScreen) {
        gameOverScreen.classList.remove(
            "hidden"
        );
    }

    showMessage(
        won ? "YOU WIN" : "GAME OVER",
        won
            ? "You survived."
            : "You were killed.",
        1800
    );

    sound(
        won ? 440 : 55,
        0.5,
        0.035,
        won ? "triangle" : "sawtooth"
    );
}

/* =========================================================
   START / PAUSE BUTTONS
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

if (resumeButton) {
    resumeButton.addEventListener(
        "click",
        function(event) {
            event.preventDefault();

            resumeGame();
        }
    );
}

if (restartButton) {
    restartButton.addEventListener(
        "click",
        function(event) {
            event.preventDefault();

            restartGame();

            /*
             Allow a fresh ENTER press after restart.
            */
            enterPressed = false;
        }
    );
}

/* =========================================================
   POINTER LOCK
========================================================= */

document.addEventListener(
    "pointerlockchange",
    function() {

        /*
         Pointer lock handling is intentionally
         separated from Enter handling.
        */

        if (!state.started ||
            state.paused ||
            state.gameOver) {
            return;
        }
    }
);

/* =========================================================
   MOUSE INPUT
========================================================= */

window.addEventListener(
    "mousedown",
    function(event) {

        if (
            event.button !== 0
        ) {
            return;
        }

        if (
            !state.started ||
            state.paused ||
            state.gameOver
        ) {
            return;
        }

        shoot();
    }
);

/* =========================================================
   PREVENT SPACE SCROLL
========================================================= */

window.addEventListener(
    "keydown",
    function(event) {

        if (
            event.code === "Space"
        ) {
            event.preventDefault();
        }
    },
    {
        passive: false
    }
);

/* =========================================================
   INITIAL STATE
========================================================= */

updateHealthHUD();
updateAmmoHUD();
