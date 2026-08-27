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

/* =========================================================
   SHOOT
========================================================= */

function shoot() {

    if (
        !state.started ||
        state.paused ||
        state.gameOver ||
        reloading
    ) {
        return;
    }

    const weapon =
        getCurrentWeapon();

    if (
        weapon.magazine <= 0
    ) {
        showMessage(
            "EMPTY",
            "Press R to reload.",
            700
        );

        sound(
            90,
            0.08,
            0.02,
            "square"
        );

        return;
    }

    weapon.magazine--;

    updateAmmoHUD();

    /*
       Weapon firing sound
    */

    if (
        weapon === weapons.shotgun
    ) {
        sound(
            75,
            0.18,
            0.045,
            "sawtooth"
        );
    }
    else {
        sound(
            170,
            0.08,
            0.03,
            "square"
        );
    }

    /*
       Muzzle flash
    */

    createMuzzleFlash();

    /*
       Raycast from camera center.
    */

    if (!camera) {
        return;
    }

    raycaster.setFromCamera(
        new THREE.Vector2(0, 0),
        camera
    );

    const hits =
        raycaster.intersectObjects(
            zombieMeshes,
            true
        );

    if (
        hits.length === 0
    ) {
        return;
    }

    let hitObject =
        hits[0].object;

    let zombie = null;

    /*
       Walk up the object hierarchy
       until the zombie reference
       is found.
    */

    while (
        hitObject
    ) {

        if (
            hitObject.userData &&
            hitObject.userData.zombie
        ) {
            zombie =
                hitObject.userData.zombie;

            break;
        }

        hitObject =
            hitObject.parent;
    }

    if (!zombie) {
        return;
    }

    if (!zombie.alive) {
        return;
    }

    let damage =
        weapon.damage;

    /*
       Shotgun gets additional
       close-range damage.
    */

    if (
        weapon === weapons.shotgun
    ) {

        const hitDistance =
            hits[0].distance;

        if (
            hitDistance < 8
        ) {
            damage *= 1.15;
        }
    }

    zombie.health -= damage;

    zombie.hitFlash = 0.12;

    sound(
        220,
        0.06,
        0.025,
        "square"
    );

    if (
        zombie.health <= 0
    ) {
        killZombie(zombie);
    }
}


/* =========================================================
   MUZZLE FLASH
========================================================= */

function createMuzzleFlash() {

    if (!camera) {
        return;
    }

    /*
       Small temporary light in front
       of the camera.
    */

    const flash =
        new THREE.PointLight(
            0xffddaa,
            4,
            5,
            2
        );

    flash.position.set(
        0,
        -0.15,
        -0.8
    );

    camera.add(flash);

    setTimeout(
        () => {

            if (
                camera &&
                flash
            ) {
                camera.remove(
                    flash
                );
            }

        },
        55
    );
}


/* =========================================================
   RELOAD
========================================================= */

function reload() {

    if (
        !state.started ||
        state.paused ||
        state.gameOver
    ) {
        return;
    }

    if (
        reloading
    ) {
        return;
    }

    const weapon =
        getCurrentWeapon();

    if (
        weapon.magazine >=
        weapon.magazineSize
    ) {
        return;
    }

    if (
        weapon.reserve <= 0
    ) {

        showMessage(
            "NO AMMO",
            "You have no reserve ammunition.",
            1000
        );

        return;
    }

    reloading = true;

    showMessage(
        "RELOADING",
        weapon.name,
        weapon.reloadTime
    );

    sound(
        180,
        0.12,
        0.025,
        "triangle"
    );

    setTimeout(
        () => {

            /*
               Game may have been restarted
               while reload timer was running.
            */

            if (
                !state.started ||
                state.gameOver
            ) {

                reloading = false;

                return;
            }

            const needed =
                weapon.magazineSize -
                weapon.magazine;

            const amount =
                Math.min(
                    needed,
                    weapon.reserve
                );

            weapon.magazine +=
                amount;

            weapon.reserve -=
                amount;

            reloading = false;

            updateAmmoHUD();

            sound(
                320,
                0.09,
                0.025,
                "triangle"
            );

        },
        weapon.reloadTime
    );
}


/* =========================================================
   SWITCH WEAPON
========================================================= */

function switchWeapon() {

    if (
        !state.started ||
        state.paused ||
        state.gameOver ||
        reloading
    ) {
        return;
    }

    currentWeaponIndex++;

    if (
        currentWeaponIndex >=
        weaponOrder.length
    ) {
        currentWeaponIndex = 0;
    }

    updateAmmoHUD();

    showMessage(
        "WEAPON",
        getCurrentWeapon().name,
        700
    );

    sound(
        260,
        0.08,
        0.018,
        "triangle"
    );
}


/* =========================================================
   ZOMBIE CREATION
========================================================= */

function createZombie(
    x,
    z
) {

    const zombieGroup =
        new THREE.Group();

    /*
       Body
    */

    const bodyMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x3d4039,
            roughness: 0.95,
            metalness: 0
        });

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.75,
                1.25,
                0.48
            ),
            bodyMaterial
        );

    body.position.y =
        1.0;

    body.castShadow =
        true;

    body.receiveShadow =
        true;

    zombieGroup.add(
        body
    );


    /*
       Head
    */

    const headMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x686052,
            roughness: 0.9,
            metalness: 0
        });

    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.31,
                18,
                14
            ),
            headMaterial
        );

    head.position.y =
        1.85;

    head.castShadow =
        true;

    head.receiveShadow =
        true;

    zombieGroup.add(
        head
    );


    /*
       Eyes
    */

    const eyeMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x330000,
            emissive: 0x550000,
            emissiveIntensity: 2
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
        -0.11,
        1.88,
        -0.275
    );

    zombieGroup.add(
        leftEye
    );

    const rightEye =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.045,
                8,
                8
            ),
            eyeMaterial
        );

    rightEye.position.set(
        0.11,
        1.88,
        -0.275
    );

    zombieGroup.add(
        rightEye
    );


    /*
       Arms
    */

    const armGeometry =
        new THREE.BoxGeometry(
            0.20,
            1.05,
            0.20
        );

    const leftArm =
        new THREE.Mesh(
            armGeometry,
            bodyMaterial
        );

    leftArm.position.set(
        -0.53,
        1.0,
        0
    );

    leftArm.rotation.z =
        -0.12;

    leftArm.castShadow =
        true;

    zombieGroup.add(
        leftArm
    );

    const rightArm =
        new THREE.Mesh(
            armGeometry,
            bodyMaterial
        );

    rightArm.position.set(
        0.53,
        1.0,
        0
    );

    rightArm.rotation.z =
        0.12;

    rightArm.castShadow =
        true;

    zombieGroup.add(
        rightArm
    );


    /*
       Legs
    */

    const legGeometry =
        new THREE.BoxGeometry(
            0.22,
            0.9,
            0.24
        );

    const leftLeg =
        new THREE.Mesh(
            legGeometry,
            bodyMaterial
        );

    leftLeg.position.set(
        -0.20,
        0.28,
        0
    );

    leftLeg.castShadow =
        true;

    zombieGroup.add(
        leftLeg
    );

    const rightLeg =
        new THREE.Mesh(
            legGeometry,
            bodyMaterial
        );

    rightLeg.position.set(
        0.20,
        0.28,
        0
    );

    rightLeg.castShadow =
        true;

    zombieGroup.add(
        rightLeg
    );


    /*
       Zombie data
    */

    const zombie = {

        mesh:
            zombieGroup,

        health:
            ZOMBIE_CONFIG.health,

        speed:
            ZOMBIE_CONFIG.speed,

        chaseSpeed:
            ZOMBIE_CONFIG.chaseSpeed,

        attackTimer:
            0,

        hitFlash:
            0,

        alive:
            true,

        baseX:
            x,

        baseZ:
            z
    };

    zombieGroup.userData.zombie =
        zombie;

    zombieGroup.traverse(
        child => {

            if (
                child.isMesh
            ) {

                child.userData.zombie =
                    zombie;

                /*
                   Keep every zombie mesh
                   available to raycaster.
                */

                if (
                    !zombieMeshes.includes(
                        child
                    )
                ) {
                    zombieMeshes.push(
                        child
                    );
                }
            }
        }
    );

    zombieGroup.position.set(
        x,
        0,
        z
    );

    scene.add(
        zombieGroup
    );

    zombies.push(
        zombie
    );

    return zombie;
}


/* =========================================================
   CREATE ZOMBIES
========================================================= */

function createZombies() {

    createZombie(
        -8,
        -8
    );

    createZombie(
        8,
        -8
    );

    createZombie(
        -9,
        4
    );

    createZombie(
        8,
        6
    );

    createZombie(
        0,
        -9
    );
}


/* =========================================================
   CLEAR ZOMBIES
========================================================= */

function clearZombies() {

    if (!scene) {
        return;
    }

    for (
        let i = zombies.length - 1;
        i >= 0;
        i--
    ) {

        const zombie =
            zombies[i];

        if (
            zombie &&
            zombie.mesh
        ) {

            scene.remove(
                zombie.mesh
            );

            zombie.mesh.traverse(
                child => {

                    if (
                        child.geometry
                    ) {
                        child.geometry.dispose();
                    }

                    if (
                        child.material
                    ) {

                        if (
                            Array.isArray(
                                child.material
                            )
                        ) {

                            child.material.forEach(
                                material => {
                                    material.dispose();
                                }
                            );

                        }
                        else {
                            child.material.dispose();
                        }
                    }
                }
            );
        }
    }

    zombies.length = 0;

    zombieMeshes.length = 0;
}


/* =========================================================
   ZOMBIE UPDATE
========================================================= */

function updateZombies(delta) {

    zombies.forEach(
        zombie => {

            if (
                !zombie ||
                !zombie.alive
            ) {
                return;
            }

            if (
                zombie.hitFlash > 0
            ) {

                zombie.hitFlash -=
                    delta;

                zombie.mesh.traverse(
                    child => {

                        if (
                            child.isMesh &&
                            child.material &&
                            child.material.emissive
                        ) {

                            child.material.emissiveIntensity =
                                zombie.hitFlash > 0
                                    ? 1.8
                                    : 0;
                        }
                    }
                );
            }

            if (
                zombie.attackTimer > 0
            ) {

                zombie.attackTimer -=
                    delta * 1000;
            }

            const distance =
                distance2D(
                    zombie.mesh.position,
                    player.position
                );

            /*
               Zombie AI
            */

            if (
                distance <=
                ZOMBIE_CONFIG.detectionDistance
            ) {

                const dx =
                    player.position.x -
                    zombie.mesh.position.x;

                const dz =
                    player.position.z -
                    zombie.mesh.position.z;

                const length =
                    Math.sqrt(
                        dx * dx +
                        dz * dz
                    );

                if (
                    length > 0.001
                ) {

                    const dirX =
                        dx / length;

                    const dirZ =
                        dz / length;

                    if (
                        distance >
                        ZOMBIE_CONFIG.attackDistance
                    ) {

                        const speed =
                            distance < 10
                                ? zombie.chaseSpeed
                                : zombie.speed;

                        zombie.mesh.position.x +=
                            dirX *
                            speed *
                            delta;

                        zombie.mesh.position.z +=
                            dirZ *
                            speed *
                            delta;
                    }
                    else {

                        /*
                           Attack
                        */

                        if (
                            zombie.attackTimer <= 0
                        ) {

                            damagePlayer(
                                ZOMBIE_CONFIG.attackDamage
                            );

                            zombie.attackTimer =
                                ZOMBIE_CONFIG.attackCooldown;
                        }
                    }

                    /*
                       Face player
                    */

                    zombie.mesh.rotation.y =
                        Math.atan2(
                            dirX,
                            dirZ
                        );
                }
            }

            /*
               Keep zombies inside room.
            */

            zombie.mesh.position.x =
                clamp(
                    zombie.mesh.position.x,
                    -ROOM.width / 2 + 0.7,
                    ROOM.width / 2 - 0.7
                );

            zombie.mesh.position.z =
                clamp(
                    zombie.mesh.position.z,
                    -ROOM.depth / 2 + 0.7,
                    ROOM.depth / 2 - 0.7
                );
        }
    );
}

/* =========================================================
   PLAYER DAMAGE
========================================================= */

function damagePlayer(amount) {

    if (
        !state.started ||
        state.paused ||
        state.gameOver
    ) {
        return;
    }

    const now =
        performance.now();

    /*
       Prevent several zombies from dealing
       damage every single frame.
    */

    if (
        now -
        health.damageCooldown <
        health.damageCooldownTime
    ) {
        return;
    }

    health.damageCooldown =
        now;

    health.current -=
        amount;

    health.current =
        clamp(
            health.current,
            0,
            health.maximum
        );

    updateHealthHUD();

    /*
       Damage sound
    */

    sound(
        70,
        0.16,
        0.035,
        "sawtooth"
    );

    /*
       Small camera shake
    */

    if (camera) {

        const originalX =
            camera.rotation.x;

        const originalY =
            camera.rotation.y;

        camera.rotation.x +=
            (Math.random() - 0.5) *
            0.045;

        camera.rotation.y +=
            (Math.random() - 0.5) *
            0.045;

        setTimeout(
            () => {

                if (
                    camera
                ) {

                    camera.rotation.x =
                        originalX;

                    camera.rotation.y =
                        originalY;
                }

            },
            70
        );
    }

    /*
       Low-health warning
    */

    if (
        health.current <= 25 &&
        health.current > 0
    ) {

        showMessage(
            "WARNING",
            "HEALTH CRITICAL",
            700
        );
    }

    /*
       Player death
    */

    if (
        health.current <= 0
    ) {

        health.current = 0;

        updateHealthHUD();

        endGame(false);
    }
}


/* =========================================================
   KILL ZOMBIE
========================================================= */

function killZombie(zombie) {

    if (
        !zombie ||
        !zombie.alive
    ) {
        return;
    }

    zombie.alive =
        false;

    zombie.health =
        0;

    /*
       Remove zombie from active
       raycast list.
    */

    zombie.mesh.traverse(
        child => {

            const index =
                zombieMeshes.indexOf(
                    child
                );

            if (
                index !== -1
            ) {

                zombieMeshes.splice(
                    index,
                    1
                );
            }
        }
    );

    /*
       Death animation / fade
    */

    let elapsed = 0;

    const duration = 0.45;

    function deathAnimation() {

        elapsed +=
            0.016;

        if (
            !zombie.mesh
        ) {
            return;
        }

        zombie.mesh.rotation.x =
            Math.min(
                elapsed * 2.2,
                1.45
            );

        zombie.mesh.position.y =
            Math.max(
                0,
                0.15 -
                elapsed * 0.12
            );

        zombie.mesh.traverse(
            child => {

                if (
                    !child.isMesh ||
                    !child.material
                ) {
                    return;
                }

                const materials =
                    Array.isArray(
                        child.material
                    )
                        ? child.material
                        : [
                            child.material
                        ];

                materials.forEach(
                    material => {

                        if (
                            "opacity" in
                            material
                        ) {

                            material.transparent =
                                true;

                            material.opacity =
                                Math.max(
                                    0,
                                    1 -
                                    elapsed /
                                    duration
                                );
                        }
                    }
                );
            }
        );

        if (
            elapsed < duration
        ) {

            requestAnimationFrame(
                deathAnimation
            );

        }
        else {

            if (
                scene &&
                zombie.mesh
            ) {

                scene.remove(
                    zombie.mesh
                );
            }
        }
    }

    deathAnimation();

    /*
       Death sound
    */

    sound(
        50,
        0.28,
        0.035,
        "sawtooth"
    );

    /*
       Check if all zombies are dead.
    */

    setTimeout(
        () => {

            const remaining =
                zombies.some(
                    item =>
                        item &&
                        item.alive
                );

            if (
                !remaining &&
                state.started &&
                !state.gameOver
            ) {

                endGame(true);
            }

        },
        500
    );
}


/* =========================================================
   APPARITION / HORROR ENTITY
========================================================= */

function createApparition() {

    if (
        !scene
    ) {
        return;
    }

    const group =
        new THREE.Group();

    /*
       Ghost body
    */

    const bodyMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xaaa8a0,
            transparent: true,
            opacity: 0.72,
            roughness: 0.9,
            metalness: 0
        });

    const body =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                0.48,
                1.5,
                8,
                16
            ),
            bodyMaterial
        );

    body.position.y =
        1.2;

    group.add(
        body
    );

    /*
       Head
    */

    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.35,
                18,
                14
            ),
            bodyMaterial
        );

    head.position.y =
        2.35;

    group.add(
        head
    );

    /*
       Eyes
    */

    const eyeMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x110000,
            emissive: 0xff0000,
            emissiveIntensity: 2.5
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
        -0.12,
        2.38,
        -0.32
    );

    group.add(
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
        0.12,
        2.38,
        -0.32
    );

    group.add(
        rightEye
    );

    group.visible =
        false;

    scene.add(
        group
    );

    apparition =
        group;
}


/* =========================================================
   HORROR EVENT
========================================================= */

function triggerHorror() {

    if (
        state.horrorTriggered
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

    state.horrorTriggered =
        true;

    /*
       Show apparition in front
       of the player.
    */

    if (
        apparition
    ) {

        apparition.visible =
            true;

        apparition.position.set(
            player.position.x,
            0,
            player.position.z - 7
        );

        apparition.lookAt(
            player.position.x,
            1.4,
            player.position.z
        );

        apparition.traverse(
            child => {

                if (
                    child.material &&
                    child.material.opacity !==
                    undefined
                ) {

                    child.material.opacity =
                        0.85;
                }
            }
        );

        setTimeout(
            () => {

                if (
                    apparition
                ) {

                    apparition.visible =
                        false;
                }

            },
            1800
        );
    }

    /*
       Lights react to horror event.
    */

    ceilingLights.forEach(
        lightData => {

            if (
                !lightData
            ) {
                return;
            }

            lightData.flicker =
                true;
        }
    );

    sound(
        35,
        1.1,
        0.055,
        "sawtooth"
    );

    /*
       Stop flickering after event.
    */

    setTimeout(
        () => {

            ceilingLights.forEach(
                lightData => {

                    if (
                        !lightData
                    ) {
                        return;
                    }

                    lightData.flicker =
                        false;

                    if (
                        lightData.light
                    ) {

                        lightData.light.intensity =
                            lightData.baseIntensity;
                    }
                }
            );

        },
        2500
    );
}


/* =========================================================
   LIGHT FLICKER
========================================================= */

function updateLightFlicker() {

    ceilingLights.forEach(
        lightData => {

            if (
                !lightData ||
                !lightData.light
            ) {
                return;
            }

            if (
                lightData.flicker
            ) {

                /*
                   Random but controlled flicker.
                */

                const random =
                    Math.random();

                if (
                    random < 0.25
                ) {

                    lightData.light.intensity =
                        0.05;

                }
                else if (
                    random < 0.50
                ) {

                    lightData.light.intensity =
                        lightData.baseIntensity *
                        0.25;

                }
                else {

                    lightData.light.intensity =
                        lightData.baseIntensity;
                }
            }
            else {

                lightData.light.intensity =
                    lightData.baseIntensity;
            }
        }
    );
}


/* =========================================================
   CREATE CEILING LIGHT
========================================================= */

function createCeilingLight(
    x,
    z
) {

    if (
        !scene
    ) {
        return;
    }

    const fixtureMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xd7d7d0,
            emissive: 0x666660,
            emissiveIntensity: 0.45
        });

    const fixture =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.2,
                0.08,
                0.7
            ),
            fixtureMaterial
        );

    fixture.position.set(
        x,
        ROOM.height - 0.15,
        z
    );

    fixture.castShadow =
        false;

    fixture.receiveShadow =
        false;

    scene.add(
        fixture
    );

    /*
       Main room light
    */

    const light =
        new THREE.PointLight(
            0xfff5dc,
            2.0,
            9,
            2
        );

    light.position.set(
        x,
        ROOM.height - 0.35,
        z
    );

    light.castShadow =
        true;

    light.shadow.mapSize.width =
        512;

    light.shadow.mapSize.height =
        512;

    scene.add(
        light
    );

    /*
       Ambient/emissive visual glow
    */

    const glowMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xfff2cc,
            transparent: true,
            opacity: 0.72
        });

    const glow =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                1.75,
                0.45
            ),
            glowMaterial
        );

    glow.rotation.x =
        Math.PI / 2;

    glow.position.set(
        x,
        ROOM.height - 0.08,
        z
    );

    scene.add(
        glow
    );

    ceilingLights.push({

        light:
            light,

        fixture:
            fixture,

        glow:
            glow,

        baseIntensity:
            2.0,

        flicker:
            false
    });
}


/* =========================================================
   CREATE ALL ROOM LIGHTS
========================================================= */

function createRoomLights() {

    /*
       Clear old light data first.
    */

    ceilingLights.length = 0;

    createCeilingLight(
        -6,
        -5
    );

    createCeilingLight(
        0,
        -5
    );

    createCeilingLight(
        6,
        -5
    );

    createCeilingLight(
        -6,
        3
    );

    createCeilingLight(
        0,
        3
    );

    createCeilingLight(
        6,
        3
    );
}


/* =========================================================
   ROOM FLOOR
========================================================= */

function createFloor() {

    const floorMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x272727,
            roughness: 0.94,
            metalness: 0.05
        });

    const floor =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                ROOM.width,
                ROOM.depth
            ),
            floorMaterial
        );

    floor.rotation.x =
        -Math.PI / 2;

    floor.position.y =
        0;

    floor.receiveShadow =
        true;

    scene.add(
        floor
    );
}


/* =========================================================
   ROOM WALL
========================================================= */

function createWall(
    width,
    height,
    depth,
    x,
    y,
    z
) {

    const wallMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x343434,
            roughness: 0.92,
            metalness: 0.02
        });

    const wall =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width,
                height,
                depth
            ),
            wallMaterial
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

    return wall;
}


/* =========================================================
   ROOM WALLS
========================================================= */

function createWalls() {

    const wallThickness =
        0.35;

    const wallHeight =
        ROOM.height;

    /*
       Back wall
    */

    createWall(
        ROOM.width,
        wallHeight,
        wallThickness,
        0,
        wallHeight / 2,
        -ROOM.depth / 2
    );

    /*
       Front wall
    */

    createWall(
        ROOM.width,
        wallHeight,
        wallThickness,
        0,
        wallHeight / 2,
        ROOM.depth / 2
    );

    /*
       Left wall
    */

    createWall(
        wallThickness,
        wallHeight,
        ROOM.depth,
        -ROOM.width / 2,
        wallHeight / 2,
        0
    );

    /*
       Right wall
    */

    createWall(
        wallThickness,
        wallHeight,
        ROOM.depth,
        ROOM.width / 2,
        wallHeight / 2,
        0
    );
}


/* =========================================================
   CEILING
========================================================= */

function createCeiling() {

    const ceilingMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x202020,
            roughness: 1,
            metalness: 0
        });

    const ceiling =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                ROOM.width,
                ROOM.depth
            ),
            ceilingMaterial
        );

    ceiling.rotation.x =
        Math.PI / 2;

    ceiling.position.y =
        ROOM.height;

    ceiling.receiveShadow =
        true;

    scene.add(
        ceiling
    );
}


/* =========================================================
   ROOM DECORATION
========================================================= */

function createRoomDecoration() {

    /*
       Simple crates
    */

    const crateMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x4a3525,
            roughness: 0.95
        });

    const cratePositions = [
        [-8, -4, 1.2],
        [8, -2, 1.0],
        [-7, 6, 0.9],
        [7, 6, 1.1]
    ];

    cratePositions.forEach(
        position => {

            const size =
                position[2];

            const crate =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        size,
                        size,
                        size
                    ),
                    crateMaterial
                );

            crate.position.set(
                position[0],
                size / 2,
                position[1]
            );

            crate.castShadow =
                true;

            crate.receiveShadow =
                true;

            scene.add(
                crate
            );
        }
    );
}


/* =========================================================
   PLAYER OBJECT
========================================================= */

function createPlayer() {

    player =
        new THREE.Object3D();

    player.position.set(
        0,
        1.7,
        5
    );

    scene.add(
        player
    );

    /*
       Camera is attached to player.
    */

    camera =
        new THREE.PerspectiveCamera(
            75,
            window.innerWidth /
            window.innerHeight,
            0.05,
            100
        );

    camera.position.set(
        0,
        0,
        0
    );

    player.add(
        camera
    );

    /*
       Raycaster used for shooting.
    */

    raycaster =
        new THREE.Raycaster();
}


/* =========================================================
   PLAYER MOVEMENT
========================================================= */

function updatePlayer(
    delta
) {

    if (
        !player ||
        !state.started ||
        state.paused ||
        state.gameOver
    ) {
        return;
    }

    const speed =
        keys.sprint
            ? 5.2
            : 3.2;

    let moveX = 0;
    let moveZ = 0;

    if (
        keys.forward
    ) {
        moveZ -= 1;
    }

    if (
        keys.backward
    ) {
        moveZ += 1;
    }

    if (
        keys.left
    ) {
        moveX -= 1;
    }

    if (
        keys.right
    ) {
        moveX += 1;
    }

    /*
       Normalize diagonal movement.
    */

    const length =
        Math.sqrt(
            moveX * moveX +
            moveZ * moveZ
        );

    if (
        length > 0
    ) {

        moveX /=
            length;

        moveZ /=
            length;
    }

    /*
       Move relative to player rotation.
    */

    const direction =
        new THREE.Vector3(
            moveX,
            0,
            moveZ
        );

    direction.applyEuler(
        new THREE.Euler(
            0,
            player.rotation.y,
            0
        )
    );

    player.position.x +=
        direction.x *
        speed *
        delta;

    player.position.z +=
        direction.z *
        speed *
        delta;

    /*
       Keep player inside room.
    */

    player.position.x =
        clamp(
            player.position.x,
            -ROOM.width / 2 + 0.65,
            ROOM.width / 2 - 0.65
        );

    player.position.z =
        clamp(
            player.position.z,
            -ROOM.depth / 2 + 0.65,
            ROOM.depth / 2 - 0.65
        );
}

/* =========================================================
   MOUSE LOOK
========================================================= */

let mouseLookEnabled = false;

let yaw = 0;
let pitch = 0;

const mouseSensitivity = 0.0022;

function enableMouseLook() {

    if (
        !canvas
    ) {
        return;
    }

    mouseLookEnabled = true;

    try {

        if (
            document.pointerLockElement !== canvas
        ) {
            canvas.requestPointerLock();
        }

    }
    catch (error) {
        console.warn(
            "Pointer lock unavailable:",
            error
        );
    }
}


/* =========================================================
   DISABLE MOUSE LOOK
========================================================= */

function disableMouseLook() {

    mouseLookEnabled = false;

    try {

        if (
            document.pointerLockElement
        ) {
            document.exitPointerLock();
        }

    }
    catch (error) {}
}


/* =========================================================
   MOUSE MOVE
========================================================= */

document.addEventListener(
    "mousemove",
    function(event) {

        if (
            !mouseLookEnabled ||
            !state.started ||
            state.paused ||
            state.gameOver
        ) {
            return;
        }

        /*
           Only use movement when pointer is locked.
        */

        if (
            document.pointerLockElement !==
            canvas
        ) {
            return;
        }

        yaw -=
            event.movementX *
            mouseSensitivity;

        pitch -=
            event.movementY *
            mouseSensitivity;

        /*
           Prevent looking too far up/down.
        */

        const maxPitch =
            Math.PI / 2 - 0.08;

        pitch =
            clamp(
                pitch,
                -maxPitch,
                maxPitch
            );

        if (
            player
        ) {

            player.rotation.y =
                yaw;
        }

        if (
            camera
        ) {

            camera.rotation.x =
                pitch;

            camera.rotation.y =
                0;

            camera.rotation.z =
                0;
        }
    }
);


/* =========================================================
   CANVAS CLICK
========================================================= */

if (
    canvas
) {

    canvas.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            if (
                !state.started
            ) {
                startGame();
                return;
            }

            if (
                state.paused
            ) {
                resumeGame();
                return;
            }

            if (
                state.gameOver
            ) {
                restartGame();
                return;
            }

            enableMouseLook();
        }
    );
}


/* =========================================================
   ESC / POINTER LOCK
========================================================= */

document.addEventListener(
    "pointerlockchange",
    function() {

        if (
            document.pointerLockElement ===
            canvas
        ) {

            mouseLookEnabled =
                true;

            return;
        }

        mouseLookEnabled =
            false;

        /*
           Do not automatically pause on
           pointer-lock loss if game has not
           started or has already ended.
        */

        if (
            state.started &&
            !state.gameOver &&
            !state.paused
        ) {

            /*
               Losing pointer lock normally means
               the user pressed ESC.

               Pause the game so zombies do not
               continue attacking while the player
               cannot control the camera.
            */

            pauseGame();
        }
    }
);


/* =========================================================
   GAME INITIALIZATION
========================================================= */

function initGame() {

    /*
       Prevent duplicate initialization.
    */

    if (
        renderer &&
        scene &&
        camera
    ) {
        return;
    }

    /*
       Scene
    */

    scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(
            0x080808
        );

    /*
       Fog
    */

    scene.fog =
        new THREE.Fog(
            0x080808,
            10,
            38
        );


    /*
       Camera / player
    */

    createPlayer();


    /*
       Renderer
    */

    renderer =
        new THREE.WebGLRenderer({
            canvas:
                canvas,

            antialias:
                true,

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

    /*
       Shadows
    */

    renderer.shadowMap.enabled =
        true;

    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;


    /*
       Tone mapping
    */

    renderer.toneMapping =
        THREE.ACESFilmicToneMapping;

    renderer.toneMappingExposure =
        0.9;


    /*
       Main ambient light
    */

    const ambient =
        new THREE.HemisphereLight(
            0x555555,
            0x080808,
            0.32
        );

    scene.add(
        ambient
    );


    /*
       Main directional light
       kept very weak because the room
       should primarily be illuminated
       by ceiling lights.
    */

    const directional =
        new THREE.DirectionalLight(
            0xaaaaaa,
            0.18
        );

    directional.position.set(
        0,
        ROOM.height,
        0
    );

    directional.castShadow =
        false;

    scene.add(
        directional
    );


    /*
       Room
    */

    createFloor();

    createWalls();

    createCeiling();

    createRoomDecoration();

    createRoomLights();


    /*
       Horror apparition
    */

    createApparition();


    /*
       Clock
    */

    clock =
        new THREE.Clock();


    /*
       Initial HUD
    */

    updateHealthHUD();

    updateAmmoHUD();


    /*
       Initial player state
    */

    if (
        player
    ) {

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
       Initial camera state
    */

    yaw = 0;
    pitch = 0;

    if (
        camera
    ) {

        camera.rotation.set(
            0,
            0,
            0
        );
    }


    /*
       Handle resizing
    */

    window.addEventListener(
        "resize",
        handleResize
    );


    /*
       Start ONE animation loop.
       
       IMPORTANT:
       startGame() does NOT call animate().
       This avoids duplicate animation loops,
       which was one of the possible causes of
       freezing after repeated input.
    */

    requestAnimationFrame(
        animate
    );
}


/* =========================================================
   RESIZE
========================================================= */

function handleResize() {

    if (
        !camera ||
        !renderer
    ) {
        return;
    }

    const width =
        window.innerWidth;

    const height =
        window.innerHeight;

    camera.aspect =
        width / height;

    camera.updateProjectionMatrix();

    renderer.setSize(
        width,
        height
    );

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            2
        )
    );
}


/* =========================================================
   ANIMATION LOOP
========================================================= */

function animate() {

    /*
       NEVER call animate() from Enter,
       startGame(), pauseGame(), etc.

       There must be exactly ONE loop.
    */

    requestAnimationFrame(
        animate
    );

    if (
        !renderer ||
        !scene ||
        !camera
    ) {
        return;
    }

    let delta =
        clock
            ? clock.getDelta()
            : 0.016;

    /*
       Prevent giant delta values after
       tab switching / browser lag.
    */

    delta =
        Math.min(
            delta,
            0.05
        );


    /*
       Update only while active.
    */

    if (
        state.started &&
        !state.paused &&
        !state.gameOver
    ) {

        updatePlayer(
            delta
        );

        updateZombies(
            delta
        );

        updateLightFlicker();

        updateHorrorEvent(
            delta
        );
    }


    /*
       Render regardless of game state
       so pause screen still shows the scene.
    */

    renderer.render(
        scene,
        camera
    );
}


/* =========================================================
   HORROR EVENT TIMER
========================================================= */

let horrorTimer = 0;

function updateHorrorEvent(
    delta
) {

    if (
        !state.started ||
        state.paused ||
        state.gameOver
    ) {
        return;
    }

    if (
        state.horrorTriggered
    ) {
        return;
    }

    horrorTimer +=
        delta;

    /*
       Trigger after approximately
       25 seconds of gameplay.
    */

    if (
        horrorTimer >= 25
    ) {

        triggerHorror();
    }
}


/* =========================================================
   RESET HORROR TIMER
========================================================= */

function resetHorrorTimer() {

    horrorTimer = 0;

    state.horrorTriggered =
        false;

    if (
        apparition
    ) {
        apparition.visible =
            false;
    }

    ceilingLights.forEach(
        lightData => {

            if (
                !lightData
            ) {
                return;
            }

            lightData.flicker =
                false;

            if (
                lightData.light
            ) {

                lightData.light.intensity =
                    lightData.baseIntensity;
            }
        }
    );
}


/* =========================================================
   OVERRIDE START RESET
========================================================= */

const originalStartGame =
    startGame;


/*
   NOTE:
   This wrapper only resets the horror timer.
   It does NOT create another animation loop.
*/

function startGameWithReset() {

    resetHorrorTimer();

    originalStartGame();
}


/*
   Replace button calls safely.
*/

if (
    startButton
) {

    startButton.onclick =
        function(event) {

            event.preventDefault();

            startGameWithReset();
        };
}


/* =========================================================
   MOBILE / TOUCH CONTROLS
========================================================= */

let touchStartX = 0;
let touchStartY = 0;

let touchActive = false;


/*
   Touch movement uses a simple
   virtual directional interpretation.
*/

if (
    canvas
) {

    canvas.addEventListener(
        "touchstart",
        function(event) {

            if (
                !state.started ||
                state.paused ||
                state.gameOver
            ) {
                return;
            }

            const touch =
                event.touches[0];

            if (
                !touch
            ) {
                return;
            }

            touchStartX =
                touch.clientX;

            touchStartY =
                touch.clientY;

            touchActive =
                true;

        },
        {
            passive: true
        }
    );


    canvas.addEventListener(
        "touchmove",
        function(event) {

            if (
                !touchActive ||
                !state.started ||
                state.paused ||
                state.gameOver
            ) {
                return;
            }

            const touch =
                event.touches[0];

            if (
                !touch
            ) {
                return;
            }

            const dx =
                touch.clientX -
                touchStartX;

            const dy =
                touch.clientY -
                touchStartY;

            /*
               Reset movement flags.
            */

            keys.forward =
                false;

            keys.backward =
                false;

            keys.left =
                false;

            keys.right =
                false;

            const threshold =
                20;

            if (
                Math.abs(dx) >
                threshold
            ) {

                if (
                    dx > 0
                ) {
                    keys.right =
                        true;
                }
                else {
                    keys.left =
                        true;
                }
            }

            if (
                Math.abs(dy) >
                threshold
            ) {

                if (
                    dy > 0
                ) {
                    keys.backward =
                        true;
                }
                else {
                    keys.forward =
                        true;
                }
            }

        },
        {
            passive: true
        }
    );


    canvas.addEventListener(
        "touchend",
        function() {

            touchActive =
                false;

            keys.forward =
                false;

            keys.backward =
                false;

            keys.left =
                false;

            keys.right =
                false;
        },
        {
            passive: true
        }
    );
}


/* =========================================================
   VISIBILITY CHANGE
========================================================= */

document.addEventListener(
    "visibilitychange",
    function() {

        if (
            document.hidden &&
            state.started &&
            !state.paused &&
            !state.gameOver
        ) {

            pauseGame();
        }
    }
);


/* =========================================================
   INITIALIZE
========================================================= */

try {

    initGame();

}
catch (error) {

    console.error(
        "Game initialization failed:",
        error
    );

    showMessage(
        "ERROR",
        "Game failed to initialize. Check console.",
        5000
    );
}

/* =========================================================
   FINAL GAME CONTROL SAFETY
========================================================= */

/*
   These functions make sure that the game cannot
   accidentally create duplicate timers, duplicate
   animation loops, or repeated input actions.
*/

let gameInitialized = false;
let animationRunning = false;


/* =========================================================
   SAFE GAME START
========================================================= */

function safeStartGame() {

    if (
        state.started &&
        !state.gameOver
    ) {
        return;
    }

    /*
       Reset all movement keys.
    */

    keys.forward = false;
    keys.backward = false;
    keys.left = false;
    keys.right = false;
    keys.sprint = false;

    /*
       Reset Enter state.
    */

    enterPressed = false;

    /*
       Reset player.
    */

    if (
        player
    ) {

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

    yaw = 0;
    pitch = 0;

    /*
       Reset horror event.
    */

    resetHorrorTimer();

    /*
       Start normal game state.
    */

    originalStartGame();

    /*
       Update HUD.
    */

    updateHealthHUD();
    updateAmmoHUD();
}


/* =========================================================
   SAFE PAUSE
========================================================= */

function safePauseGame() {

    if (
        !state.started ||
        state.gameOver
    ) {
        return;
    }

    if (
        state.paused
    ) {
        return;
    }

    /*
       Stop movement immediately.
    */

    keys.forward = false;
    keys.backward = false;
    keys.left = false;
    keys.right = false;
    keys.sprint = false;

    pauseGame();
}


/* =========================================================
   SAFE RESUME
========================================================= */

function safeResumeGame() {

    if (
        !state.started ||
        state.gameOver
    ) {
        return;
    }

    if (
        !state.paused
    ) {
        return;
    }

    resumeGame();
}


/* =========================================================
   SAFE RESTART
========================================================= */

function safeRestartGame() {

    /*
       Reset input first.
    */

    keys.forward = false;
    keys.backward = false;
    keys.left = false;
    keys.right = false;
    keys.sprint = false;

    enterPressed = false;

    reloading = false;

    /*
       Reset horror.
    */

    resetHorrorTimer();

    /*
       Restart.
    */

    restartGame();

    /*
       Reset camera.
    */

    yaw = 0;
    pitch = 0;

    if (
        player
    ) {

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

    if (
        camera
    ) {

        camera.rotation.set(
            0,
            0,
            0
        );
    }

    updateHealthHUD();
    updateAmmoHUD();
}


/* =========================================================
   KEYBOARD STATE CLEANUP
========================================================= */

window.addEventListener(
    "blur",
    function() {

        /*
           When browser loses focus,
           release all keys.
        */

        keys.forward = false;
        keys.backward = false;
        keys.left = false;
        keys.right = false;
        keys.sprint = false;

        /*
           IMPORTANT:
           Do not leave Enter stuck.
        */

        enterPressed = false;
    }
);


/* =========================================================
   DOCUMENT VISIBILITY SAFETY
========================================================= */

document.addEventListener(
    "visibilitychange",
    function() {

        if (
            document.hidden
        ) {

            keys.forward = false;
            keys.backward = false;
            keys.left = false;
            keys.right = false;
            keys.sprint = false;

            enterPressed = false;

            if (
                state.started &&
                !state.paused &&
                !state.gameOver
            ) {

                safePauseGame();
            }
        }
    }
);


/* =========================================================
   ESCAPE KEY
========================================================= */

window.addEventListener(
    "keydown",
    function(event) {

        if (
            event.code !== "Escape"
        ) {
            return;
        }

        /*
           Never allow Escape to cause
           multiple pause calls.
        */

        event.preventDefault();

        if (
            !state.started ||
            state.gameOver
        ) {
            return;
        }

        if (
            state.paused
        ) {

            safeResumeGame();

        }
        else {

            safePauseGame();
        }
    },
    {
        passive: false
    }
);


/* =========================================================
   P KEY PAUSE
========================================================= */

window.addEventListener(
    "keydown",
    function(event) {

        if (
            event.code !== "KeyP"
        ) {
            return;
        }

        if (
            event.repeat
        ) {
            return;
        }

        event.preventDefault();

        if (
            !state.started ||
            state.gameOver
        ) {
            return;
        }

        if (
            state.paused
        ) {

            safeResumeGame();

        }
        else {

            safePauseGame();
        }
    },
    {
        passive: false
    }
);


/* =========================================================
   F KEY - FLASHLIGHT
========================================================= */

let flashlight = null;
let flashlightEnabled = true;


/* =========================================================
   CREATE FLASHLIGHT
========================================================= */

function createFlashlight() {

    if (
        !camera ||
        flashlight
    ) {
        return;
    }

    flashlight =
        new THREE.SpotLight(
            0xffffff,
            3.5,
            18,
            Math.PI / 7,
            0.45,
            1.2
        );

    flashlight.position.set(
        0,
        -0.05,
        -0.25
    );

    flashlight.target.position.set(
        0,
        0,
        -8
    );

    camera.add(
        flashlight
    );

    camera.add(
        flashlight.target
    );

    flashlight.castShadow =
        true;

    flashlight.shadow.mapSize.width =
        512;

    flashlight.shadow.mapSize.height =
        512;
}


/* =========================================================
   FLASHLIGHT TOGGLE
========================================================= */

function toggleFlashlight() {

    if (
        !state.started ||
        state.paused ||
        state.gameOver
    ) {
        return;
    }

    if (
        !flashlight
    ) {
        createFlashlight();
    }

    flashlightEnabled =
        !flashlightEnabled;

    if (
        flashlight
    ) {

        flashlight.visible =
            flashlightEnabled;
    }

    sound(
        flashlightEnabled
            ? 500
            : 220,
        0.06,
        0.015,
        "triangle"
    );

    showMessage(
        "FLASHLIGHT",
        flashlightEnabled
            ? "ON"
            : "OFF",
        600
    );
}


/* =========================================================
   F KEY INPUT
========================================================= */

window.addEventListener(
    "keydown",
    function(event) {

        if (
            event.code !== "KeyF"
        ) {
            return;
        }

        if (
            event.repeat
        ) {
            return;
        }

        event.preventDefault();

        toggleFlashlight();
    },
    {
        passive: false
    }
);


/* =========================================================
   CREATE FLASHLIGHT AFTER PLAYER
========================================================= */

function setupPlayerEquipment() {

    if (
        !camera
    ) {
        return;
    }

    createFlashlight();

    if (
        flashlight
    ) {

        flashlight.visible =
            flashlightEnabled;
    }
}


/* =========================================================
   SAFE PLAYER COLLISION
========================================================= */

function preventPlayerInsideZombies() {

    if (
        !player ||
        !state.started ||
        state.paused ||
        state.gameOver
    ) {
        return;
    }

    zombies.forEach(
        zombie => {

            if (
                !zombie ||
                !zombie.alive ||
                !zombie.mesh
            ) {
                return;
            }

            const dx =
                player.position.x -
                zombie.mesh.position.x;

            const dz =
                player.position.z -
                zombie.mesh.position.z;

            const distance =
                Math.sqrt(
                    dx * dx +
                    dz * dz
                );

            const minimumDistance =
                0.85;

            if (
                distance > 0 &&
                distance < minimumDistance
            ) {

                const push =
                    minimumDistance -
                    distance;

                player.position.x +=
                    (dx / distance) *
                    push;

                player.position.z +=
                    (dz / distance) *
                    push;
            }
        }
    );

    /*
       Keep player inside room after
       collision correction.
    */

    player.position.x =
        clamp(
            player.position.x,
            -ROOM.width / 2 + 0.65,
            ROOM.width / 2 - 0.65
        );

    player.position.z =
        clamp(
            player.position.z,
            -ROOM.depth / 2 + 0.65,
            ROOM.depth / 2 - 0.65
        );
}


/* =========================================================
   ORIGINAL UPDATE WRAPPER
========================================================= */

const originalUpdatePlayer =
    updatePlayer;


/*
   Replace updatePlayer with a safe wrapper.
*/

updatePlayer =
    function(delta) {

        originalUpdatePlayer(
            delta
        );

        preventPlayerInsideZombies();
    };


/* =========================================================
   WEAPON HUD SAFETY
========================================================= */

function refreshWeaponHUD() {

    const weapon =
        getCurrentWeapon();

    if (
        !weapon
    ) {
        return;
    }

    if (
        weaponText
    ) {

        weaponText.textContent =
            weapon.name;
    }

    if (
        ammoText
    ) {

        ammoText.textContent =
            `${weapon.magazine} / ${weapon.reserve}`;
    }
}


/* =========================================================
   NUMBER KEY WEAPON SWITCHING
========================================================= */

window.addEventListener(
    "keydown",
    function(event) {

        if (
            event.repeat
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

        if (
            event.code === "Digit1"
        ) {

            currentWeaponIndex =
                0;

            refreshWeaponHUD();

            showMessage(
                "WEAPON",
                getCurrentWeapon().name,
                600
            );
        }

        if (
            event.code === "Digit2"
        ) {

            if (
                weaponOrder.length > 1
            ) {

                currentWeaponIndex =
                    1;

                refreshWeaponHUD();

                showMessage(
                    "WEAPON",
                    getCurrentWeapon().name,
                    600
                );
            }
        }
    }
);


/* =========================================================
   AUTO RELOAD
========================================================= */

function autoReloadIfNeeded() {

    if (
        !state.started ||
        state.paused ||
        state.gameOver ||
        reloading
    ) {
        return;
    }

    const weapon =
        getCurrentWeapon();

    if (
        !weapon
    ) {
        return;
    }

    /*
       Only auto-reload when magazine is
       completely empty.
    */

    if (
        weapon.magazine === 0 &&
        weapon.reserve > 0
    ) {

        reload();
    }
}


/* =========================================================
   SAFE SHOOT WRAPPER
========================================================= */

const originalShoot =
    shoot;

shoot =
    function() {

        if (
            !state.started ||
            state.paused ||
            state.gameOver
        ) {
            return;
        }

        if (
            reloading
        ) {
            return;
        }

        originalShoot();

        autoReloadIfNeeded();
    };


/* =========================================================
   SHOOTING TOUCH SUPPORT
========================================================= */

let touchShootTimer = null;

function touchShoot() {

    if (
        !state.started ||
        state.paused ||
        state.gameOver
    ) {
        return;
    }

    shoot();
}


/* =========================================================
   PREVENT CONTEXT MENU
========================================================= */

if (
    canvas
) {

    canvas.addEventListener(
        "contextmenu",
        function(event) {

            event.preventDefault();
        }
    );
}


/* =========================================================
   RIGHT MOUSE BUTTON
========================================================= */

window.addEventListener(
    "mousedown",
    function(event) {

        if (
            event.button !== 2
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

        /*
           Right click can toggle flashlight.
        */

        toggleFlashlight();
    }
);


/* =========================================================
   GAME LOOP SAFETY MONITOR
========================================================= */

let lastFrameTime =
    performance.now();

function frameSafetyCheck() {

    const now =
        performance.now();

    const frameDelta =
        now -
        lastFrameTime;

    lastFrameTime =
        now;

    /*
       If browser stalls for a very long time,
       don't allow the next update to explode
       with a huge delta.
    */

    if (
        frameDelta > 1000
    ) {

        if (
            clock
        ) {

            clock.getDelta();
        }
    }
}


/* =========================================================
   ORIGINAL ANIMATION LOOP WRAPPER
========================================================= */

const originalAnimate =
    animate;


/*
   Do not replace requestAnimationFrame
   behavior here.

   This wrapper only performs safety checks.
*/

function safeAnimate() {

    frameSafetyCheck();

    originalAnimate();
}


/* =========================================================
   EQUIPMENT INITIALIZATION
========================================================= */

setTimeout(
    function() {

        if (
            camera
        ) {

            setupPlayerEquipment();
        }

    },
    100
);


/* =========================================================
   INITIAL UI RESET
========================================================= */

function resetUI() {

    if (
        startScreen
    ) {

        startScreen.classList.remove(
            "hidden"
        );
    }

    if (
        pauseScreen
    ) {

        pauseScreen.classList.add(
            "hidden"
        );
    }

    if (
        gameOverScreen
    ) {

        gameOverScreen.classList.add(
            "hidden"
        );
    }

    if (
        messageBox
    ) {

        messageBox.classList.remove(
            "show"
        );
    }

    updateHealthHUD();

    updateAmmoHUD();
}


/* =========================================================
   INITIAL UI
========================================================= */

resetUI();


/* =========================================================
   FINAL ENTER KEY GUARD
========================================================= */

/*
   IMPORTANT FINAL FIX

   Enter must NEVER:
   - submit a form
   - click a hidden button
   - repeatedly start the game
   - repeatedly pause the game
   - create another animation loop
   - reload the page
*/

window.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key !== "Enter" &&
            event.code !== "Enter"
        ) {
            return;
        }

        event.preventDefault();

        /*
           Stop browser default behavior.
        */

        if (
            event.stopImmediatePropagation
        ) {
            /*
               Do NOT use stopImmediatePropagation
               here because other game handlers
               may need the Enter event.
            */
        }

        /*
           Browser key-repeat protection.
        */

        if (
            event.repeat
        ) {
            return;
        }
    },
    {
        passive: false,
        capture: true
    }
);


/* =========================================================
   FINAL GAME READY MESSAGE
========================================================= */

console.log(
    "%cGAME READY",
    "font-weight:bold;font-size:18px;"
);

console.log(
    "ENTER = Start / Resume / Interact"
);

console.log(
    "WASD / Arrow Keys = Move"
);

console.log(
    "Mouse = Look"
);

console.log(
    "Left Click / SPACE = Shoot"
);

console.log(
    "R = Reload"
);

console.log(
    "Q / 1 / 2 = Weapon"
);

console.log(
    "F / Right Click = Flashlight"
);

console.log(
    "P / ESC = Pause"
);


/* =========================================================
   ERROR HANDLER
========================================================= */

window.addEventListener(
    "error",
    function(event) {

        console.error(
            "GAME ERROR:",
            event.error ||
            event.message
        );

        /*
           Never allow an unexpected JavaScript
           error to permanently lock the UI.
        */

        enterPressed = false;

        keys.forward = false;
        keys.backward = false;
        keys.left = false;
        keys.right = false;
        keys.sprint = false;
    }
);


/* =========================================================
   UNHANDLED PROMISE ERROR
========================================================= */

window.addEventListener(
    "unhandledrejection",
    function(event) {

        console.error(
            "GAME PROMISE ERROR:",
            event.reason
        );

        /*
           Keep input responsive.
        */

        enterPressed = false;
    }
);


/* =========================================================
   FINAL STATE CHECK
========================================================= */

setInterval(
    function() {

        /*
           Never let invalid health values
           break the HUD.
        */

        if (
            !Number.isFinite(
                health.current
            )
        ) {

            health.current =
                health.maximum;
        }

        health.current =
            clamp(
                health.current,
                0,
                health.maximum
            );

        /*
           Never allow invalid weapon index.
        */

        if (
            currentWeaponIndex < 0 ||
            currentWeaponIndex >=
            weaponOrder.length
        ) {

            currentWeaponIndex =
                0;
        }

        /*
           If game is not running,
           make sure movement isn't stuck.
        */

        if (
            !state.started ||
            state.paused ||
            state.gameOver
        ) {

            keys.forward = false;
            keys.backward = false;
            keys.left = false;
            keys.right = false;
            keys.sprint = false;
        }

    },
    500
);

/* =========================================================
   PART 6/6 — FINAL INPUT + ENTER FREEZE FIX
========================================================= */

/*
   IMPORTANT:
   This section is intentionally kept at the end
   of the file.

   It handles keyboard input in one controlled place
   and prevents ENTER from repeatedly starting,
   pausing, or freezing the game.
*/


/* =========================================================
   INPUT INITIALIZATION
========================================================= */

function resetKeyboardState() {

    keys.forward = false;
    keys.backward = false;
    keys.left = false;
    keys.right = false;
    keys.sprint = false;

    enterPressed = false;
}


/* =========================================================
   KEY DOWN
========================================================= */

window.addEventListener(
    "keydown",
    function(event) {

        /*
           Prevent browser shortcuts/default
           behaviour for game keys.
        */

        const code =
            event.code;

        /*
           ENTER
           ---------------------------------------------
           This is the important freeze fix.
        */

        if (
            code === "Enter"
        ) {

            /*
               Ignore key-repeat.
               Holding Enter must NOT repeatedly
               execute game functions.
            */

            if (
                event.repeat ||
                enterPressed
            ) {

                event.preventDefault();

                return;
            }

            event.preventDefault();

            enterPressed =
                true;

            /*
               Game not started
               -> start once
            */

            if (
                !state.started &&
                !state.gameOver
            ) {

                safeStartGame();

                return;
            }

            /*
               Game paused
               -> resume once
            */

            if (
                state.paused &&
                !state.gameOver
            ) {

                safeResumeGame();

                return;
            }

            /*
               Game over
               -> restart once
            */

            if (
                state.gameOver
            ) {

                safeRestartGame();

                return;
            }

            /*
               If game is already running,
               ENTER does nothing.

               This is deliberate.
               It prevents ENTER from accidentally
               starting another loop.
            */

            return;
        }


        /* =================================================
           MOVEMENT
        ================================================= */

        if (
            code === "KeyW" ||
            code === "ArrowUp"
        ) {

            event.preventDefault();

            keys.forward =
                true;

            return;
        }


        if (
            code === "KeyS" ||
            code === "ArrowDown"
        ) {

            event.preventDefault();

            keys.backward =
                true;

            return;
        }


        if (
            code === "KeyA" ||
            code === "ArrowLeft"
        ) {

            event.preventDefault();

            keys.left =
                true;

            return;
        }


        if (
            code === "KeyD" ||
            code === "ArrowRight"
        ) {

            event.preventDefault();

            keys.right =
                true;

            return;
        }


        /* =================================================
           SPRINT
        ================================================= */

        if (
            code === "ShiftLeft" ||
            code === "ShiftRight"
        ) {

            event.preventDefault();

            keys.sprint =
                true;

            return;
        }


        /* =================================================
           SHOOT
        ================================================= */

        if (
            code === "Space"
        ) {

            event.preventDefault();

            if (
                !event.repeat
            ) {

                shoot();
            }

            return;
        }


        /* =================================================
           RELOAD
        ================================================= */

        if (
            code === "KeyR"
        ) {

            event.preventDefault();

            if (
                !event.repeat
            ) {

                reload();
            }

            return;
        }


        /* =================================================
           WEAPON SWITCH
        ================================================= */

        if (
            code === "KeyQ"
        ) {

            event.preventDefault();

            if (
                !event.repeat
            ) {

                switchWeapon();
            }

            return;
        }

    },
    {
        passive: false
    }
);


/* =========================================================
   KEY UP
========================================================= */

window.addEventListener(
    "keyup",
    function(event) {

        const code =
            event.code;


        /* =================================================
           ENTER RELEASE
        ================================================= */

        if (
            code === "Enter"
        ) {

            /*
               Only release the guard here.

               IMPORTANT:
               Do not start/resume/restart the game
               from keyup.
            */

            enterPressed =
                false;

            event.preventDefault();

            return;
        }


        /* =================================================
           MOVEMENT RELEASE
        ================================================= */

        if (
            code === "KeyW" ||
            code === "ArrowUp"
        ) {

            keys.forward =
                false;

            return;
        }


        if (
            code === "KeyS" ||
            code === "ArrowDown"
        ) {

            keys.backward =
                false;

            return;
        }


        if (
            code === "KeyA" ||
            code === "ArrowLeft"
        ) {

            keys.left =
                false;

            return;
        }


        if (
            code === "KeyD" ||
            code === "ArrowRight"
        ) {

            keys.right =
                false;

            return;
        }


        /* =================================================
           SPRINT RELEASE
        ================================================= */

        if (
            code === "ShiftLeft" ||
            code === "ShiftRight"
        ) {

            keys.sprint =
                false;

            return;
        }
    }
);


/* =========================================================
   MOUSE SHOOT
========================================================= */

window.addEventListener(
    "mousedown",
    function(event) {

        /*
           Left mouse button
        */

        if (
            event.button !== 0
        ) {
            return;
        }

        /*
           Ignore clicks on UI buttons.
        */

        if (
            event.target &&
            event.target.closest &&
            event.target.closest(
                "button,input,select,textarea,a"
            )
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
   POINTER LOCK START
========================================================= */

function requestGamePointerLock() {

    if (
        !canvas
    ) {
        return;
    }

    try {

        if (
            document.pointerLockElement !==
            canvas
        ) {

            canvas.requestPointerLock();
        }

    }
    catch (error) {

        console.warn(
            "Pointer lock request failed:",
            error
        );
    }
}


/* =========================================================
   START SCREEN CLICK
========================================================= */

if (
    startButton
) {

    startButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            event.stopPropagation();

            /*
               Prevent multiple rapid clicks.
            */

            if (
                startButton.disabled
            ) {
                return;
            }

            startButton.disabled =
                true;

            safeStartGame();

            /*
               Pointer lock is requested after
               user interaction.
            */

            setTimeout(
                function() {

                    requestGamePointerLock();

                },
                50
            );

            /*
               Re-enable only after a short delay.
            */

            setTimeout(
                function() {

                    if (
                        startButton
                    ) {

                        startButton.disabled =
                            false;
                    }

                },
                400
            );

        },
        {
            passive: false
        }
    );
}


/* =========================================================
   RESTART BUTTON
========================================================= */

if (
    restartButton
) {

    restartButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            event.stopPropagation();

            if (
                restartButton.disabled
            ) {
                return;
            }

            restartButton.disabled =
                true;

            safeRestartGame();

            setTimeout(
                function() {

                    requestGamePointerLock();

                },
                50
            );

            setTimeout(
                function() {

                    if (
                        restartButton
                    ) {

                        restartButton.disabled =
                            false;
                    }

                },
                400
            );

        },
        {
            passive: false
        }
    );
}


/* =========================================================
   RESUME BUTTON
========================================================= */

if (
    resumeButton
) {

    resumeButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            event.stopPropagation();

            safeResumeGame();

            setTimeout(
                function() {

                    requestGamePointerLock();

                },
                50
            );

        },
        {
            passive: false
        }
    );
}


/* =========================================================
   PAUSE BUTTON
========================================================= */

if (
    pauseButton
) {

    pauseButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            event.stopPropagation();

            safePauseGame();

        },
        {
            passive: false
        }
    );
}


/* =========================================================
   GLOBAL BUTTON SAFETY
========================================================= */

document.addEventListener(
    "click",
    function(event) {

        const target =
            event.target;

        if (
            !target
        ) {
            return;
        }

        /*
           Prevent accidental form submission.
        */

        if (
            target.tagName ===
            "BUTTON"
        ) {

            /*
               Do not allow disabled buttons
               to trigger anything.
            */

            if (
                target.disabled
            ) {

                event.preventDefault();

                return;
            }
        }

    },
    {
        passive: false
    }
);


/* =========================================================
   PREVENT ENTER FROM SUBMITTING FORMS
========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.code !== "Enter"
        ) {
            return;
        }

        /*
           If focus is inside an input,
           do not allow browser form submission
           to interfere with the game.
        */

        const active =
            document.activeElement;

        if (
            active &&
            (
                active.tagName === "INPUT" ||
                active.tagName === "SELECT" ||
                active.tagName === "TEXTAREA"
            )
        ) {

            event.preventDefault();

            return;
        }

    },
    {
        capture: true,
        passive: false
    }
);


/* =========================================================
   RESET INPUT WHEN WINDOW LOSES FOCUS
========================================================= */

window.addEventListener(
    "blur",
    function() {

        resetKeyboardState();

    }
);


/* =========================================================
   RESET INPUT WHEN TAB BECOMES HIDDEN
========================================================= */

document.addEventListener(
    "visibilitychange",
    function() {

        if (
            document.hidden
        ) {

            resetKeyboardState();

        }

    }
);


/* =========================================================
   GAME LOOP INTEGRITY
========================================================= */

/*
   This check is informational only.

   DO NOT start another requestAnimationFrame
   loop here.
*/

let lastGameLoopCheck =
    performance.now();

setInterval(
    function() {

        const now =
            performance.now();

        const elapsed =
            now -
            lastGameLoopCheck;

        lastGameLoopCheck =
            now;

        /*
           If the browser was suspended,
           reset input instead of attempting
           to catch up with thousands of frames.
        */

        if (
            elapsed > 2000
        ) {

            resetKeyboardState();

        }

    },
    1000
);


/* =========================================================
   FINAL HUD REFRESH
========================================================= */

function refreshAllHUD() {

    try {

        updateHealthHUD();

    }
    catch (error) {

        console.warn(
            "Health HUD update failed:",
            error
        );
    }

    try {

        updateAmmoHUD();

    }
    catch (error) {

        console.warn(
            "Ammo HUD update failed:",
            error
        );
    }

    try {

        refreshWeaponHUD();

    }
    catch (error) {

        console.warn(
            "Weapon HUD update failed:",
            error
        );
    }
}


/* =========================================================
   INITIAL HUD
========================================================= */

setTimeout(
    function() {

        refreshAllHUD();

    },
    100
);


/* =========================================================
   FINAL GAME STATE NORMALIZATION
========================================================= */

setInterval(
    function() {

        /*
           Keep health valid.
        */

        if (
            !Number.isFinite(
                health.current
            )
        ) {

            health.current =
                health.maximum;
        }

        health.current =
            clamp(
                health.current,
                0,
                health.maximum
            );


        /*
           Keep weapon index valid.
        */

        if (
            !Number.isFinite(
                currentWeaponIndex
            )
        ) {

            currentWeaponIndex =
                0;
        }

        if (
            currentWeaponIndex < 0
        ) {

            currentWeaponIndex =
                0;
        }

        if (
            currentWeaponIndex >=
            weaponOrder.length
        ) {

            currentWeaponIndex =
                0;
        }


        /*
           If game is inactive, absolutely
           no movement key should remain stuck.
        */

        if (
            !state.started ||
            state.paused ||
            state.gameOver
        ) {

            keys.forward =
                false;

            keys.backward =
                false;

            keys.left =
                false;

            keys.right =
                false;

            keys.sprint =
                false;
        }

    },
    250
);


/* =========================================================
   FINAL READY MESSAGE
========================================================= */

console.log(
    "===================================="
);

console.log(
    "GAME INITIALIZED"
);

console.log(
    "ENTER = START / RESUME / RESTART"
);

console.log(
    "WASD / ARROWS = MOVE"
);

console.log(
    "MOUSE = LOOK"
);

console.log(
    "LEFT CLICK / SPACE = SHOOT"
);

console.log(
    "R = RELOAD"
);

console.log(
    "Q = SWITCH WEAPON"
);

console.log(
    "F = FLASHLIGHT"
);

console.log(
    "P / ESC = PAUSE"
);

console.log(
    "===================================="
);


/* =========================================================
   FINAL ERROR RECOVERY
========================================================= */

window.addEventListener(
    "error",
    function(event) {

        console.error(
            "Game error:",
            event.error ||
            event.message
        );

        /*
           Critical:
           An error must never leave Enter or
           movement keys permanently locked.
        */

        resetKeyboardState();

    }
);


/* =========================================================
   FINAL PROMISE ERROR RECOVERY
========================================================= */

window.addEventListener(
    "unhandledrejection",
    function(event) {

        console.error(
            "Unhandled game error:",
            event.reason
        );

        resetKeyboardState();

    }
);


/* =========================================================
   FINAL CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    function() {

        /*
           Stop input.
        */

        resetKeyboardState();

        /*
           Release pointer lock.
        */

        try {

            if (
                document.pointerLockElement
            ) {

                document.exitPointerLock();
            }

        }
        catch (error) {}

    }
);


/* =========================================================
   END OF GAME.JS
========================================================= */
