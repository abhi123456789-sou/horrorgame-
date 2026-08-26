/* =========================================================
   THE LAST ROOM
   CORRECTED COMPLETE GAME.JS

   Compatible with:
   - index.html supplied by user
   - style.css supplied by user

   Controls:
   W A S D  = Move
   Mouse    = Look
   E        = Interact
   F        = Flashlight
   ESC      = Pause
========================================================= */


/* =========================================================
   DOM ELEMENTS
========================================================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

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
   SAFETY CHECK
========================================================= */

const requiredElements = [
    canvas,
    game,
    mainMenu,
    pauseMenu,
    controlsPanel,
    startButton,
    controlsButton,
    pauseControlsButton,
    closeControls,
    resumeButton,
    restartButton,
    message,
    objective,
    interaction,
    interactionMain,
    interactionSub,
    batteryFill
];

if (requiredElements.some(element => !element)) {

    console.error(
        "THE LAST ROOM: One or more required HTML elements are missing."
    );

}


/* =========================================================
   CANVAS
========================================================= */

function resizeCanvas() {

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

    "###############",

    "#.............#",

    "#.............#",

    "#...####D###..#",

    "#.............#",

    "#.............#",

    "#.....###.....#",

    "#.....#.......#",

    "#.....#.......#",

    "#.............#",

    "#.............#",

    "###############"

];

const MAP_WIDTH = MAP[0].length;
const MAP_HEIGHT = MAP.length;

const FOV = Math.PI / 3;


/* =========================================================
   PLAYER
========================================================= */

const player = {

    x: 2.5,

    y: 2.5,

    angle: Math.PI / 2,

    radius: 0.20

};


/* =========================================================
   GAME STATE
========================================================= */

let gameStarted = false;
let paused = false;

let doorOpen = false;
let doorProgress = 0;

let flashlightOn = true;
let battery = 100;

let elapsed = 0;

let apparitionActive = false;
let apparitionTimer = 0;

let interactionTarget = null;

let footstepTimer = 0;

let messageTimer = null;

let pointerLockPending = false;


/* =========================================================
   KEY STATE
========================================================= */

const keys = {

    w: false,
    a: false,
    s: false,
    d: false

};


/* =========================================================
   RESET GAME
========================================================= */

function resetGame() {

    player.x = 2.5;
    player.y = 2.5;

    player.angle = Math.PI / 2;

    doorOpen = false;
    doorProgress = 0;

    flashlightOn = true;
    battery = 100;

    elapsed = 0;

    apparitionActive = false;
    apparitionTimer = 0;

    interactionTarget = null;

    footstepTimer = 0;

    updateBatteryUI();

    objective.textContent =
        "Find a way out.";

    interaction.classList.remove(
        "visible"
    );

}


/* =========================================================
   KEYBOARD
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

        if (
            key === "f" &&
            gameStarted &&
            !paused
        ) {

            toggleFlashlight();

        }

        if (
            key === "e" &&
            gameStarted &&
            !paused
        ) {

            interact();

        }

        if (
            key === "escape" &&
            gameStarted
        ) {

            if (
                controlsPanel.classList
                    .contains("hidden")
            ) {

                togglePause();

            }

        }

    }
);


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

    }
);


/* =========================================================
   MOUSE LOOK
========================================================= */

document.addEventListener(
    "mousemove",
    function(event) {

        if (!gameStarted || paused) {
            return;
        }

        if (
            document.pointerLockElement !==
            canvas
        ) {
            return;
        }

        player.angle +=
            event.movementX * 0.0024;

    }
);


/* =========================================================
   SAFE POINTER LOCK
========================================================= */

function requestGamePointerLock() {

    if (!gameStarted || paused) {
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
                function() {
                    // Pointer lock is optional.
                    // Never break the game.
                }
            );

        }

    } catch (error) {

        // Ignore browser pointer-lock errors.

    }

    setTimeout(
        function() {

            pointerLockPending = false;

        },
        500
    );

}


/* =========================================================
   CANVAS CLICK
========================================================= */

canvas.addEventListener(
    "click",
    function() {

        if (
            gameStarted &&
            !paused
        ) {

            requestGamePointerLock();

        }

    }
);


/* =========================================================
   POINTER LOCK CHANGE
========================================================= */

document.addEventListener(
    "pointerlockchange",
    function() {

        pointerLockPending = false;

        if (!gameStarted) {
            return;
        }

        if (
            document.pointerLockElement !==
            canvas
        ) {

            if (!paused) {

                showMessage(
                    "The room waits.",
                    "Click to look around again."
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

startButton.addEventListener(
    "click",
    function() {

        startGame();

    }
);


/* =========================================================
   START GAME
========================================================= */

function startGame() {

    if (gameStarted) {
        return;
    }

    gameStarted = true;
    paused = false;

    resetGame();

    mainMenu.style.transition =
        "opacity 0.7s ease";

    mainMenu.style.opacity = "0";

    setTimeout(
        function() {

            mainMenu.classList.add(
                "hidden"
            );

            mainMenu.style.opacity = "";

        },
        750
    );

    objective.textContent =
        "Find a way out.";

    showMessage(
        "The room is quiet.",
        "Find a way out."
    );

    startAudio();

    requestGamePointerLock();

}


/* =========================================================
   PAUSE
========================================================= */

function togglePause() {

    if (!gameStarted) {
        return;
    }

    paused = !paused;

    if (paused) {

        pauseMenu.classList.remove(
            "hidden"
        );

        if (
            document.pointerLockElement ===
            canvas
        ) {

            try {
                document.exitPointerLock();
            } catch (error) {
                // Ignore.
            }

        }

        hideInteraction();

    } else {

        pauseMenu.classList.add(
            "hidden"
        );

        requestGamePointerLock();

        showMessage(
            "You are still here.",
            "Find a way out."
        );

    }

}


/* =========================================================
   RESUME
========================================================= */

resumeButton.addEventListener(
    "click",
    function() {

        paused = false;

        pauseMenu.classList.add(
            "hidden"
        );

        requestGamePointerLock();

    }
);


/* =========================================================
   RESTART
========================================================= */

restartButton.addEventListener(
    "click",
    function() {

        resetGame();

        paused = false;

        pauseMenu.classList.add(
            "hidden"
        );

        showMessage(
            "The room is quiet.",
            "But something feels different."
        );

        requestGamePointerLock();

    }
);


/* =========================================================
   CONTROLS
========================================================= */

controlsButton.addEventListener(
    "click",
    function() {

        controlsPanel.classList.remove(
            "hidden"
        );

    }
);


pauseControlsButton.addEventListener(
    "click",
    function() {

        controlsPanel.classList.remove(
            "hidden"
        );

    }
);


closeControls.addEventListener(
    "click",
    function() {

        controlsPanel.classList.add(
            "hidden"
        );

    }
);


/* =========================================================
   COLLISION
========================================================= */

function isWall(x, y) {

    const mapX = Math.floor(x);
    const mapY = Math.floor(y);

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
   MOVEMENT
========================================================= */

function updateMovement(dt) {

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

    const speed = 2.25;

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

    const nextX =
        player.x + moveX;

    const nextY =
        player.y + moveY;

    let moved = false;

    if (canMoveTo(nextX, player.y)) {

        player.x = nextX;

        moved = true;

    }

    if (canMoveTo(player.x, nextY)) {

        player.y = nextY;

        moved = true;

    }

    if (moved) {

        footstepTimer -= dt;

        if (footstepTimer <= 0) {

            playFootstep();

            footstepTimer =
                0.42;

        }

    }

}


/* =========================================================
   DOOR FINDER
========================================================= */

function findDoor() {

    let best = null;

    let bestDistance = Infinity;

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
                    distance: distance
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
        paused
    ) {

        hideInteraction();

        return;

    }

    const door =
        findDoor();

    if (
        door &&
        door.distance < 1.55
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

        if (difference < 0.65) {

            interactionTarget =
                "door";

            interactionMain.textContent =
                doorOpen
                    ? "DOOR"
                    : "OPEN DOOR";

            interactionSub.textContent =
                doorOpen
                    ? "The way is open"
                    : "Press E to interact";

            interaction.classList.add(
                "visible"
            );

            return;

        }

    }

    interactionTarget = null;

    hideInteraction();

}


function interact() {

    if (
        interactionTarget !==
        "door"
    ) {

        return;

    }

    if (!doorOpen) {

        doorOpen = true;

        objective.textContent =
            "Something is waiting beyond.";

        showMessage(
            "The door opens.",
            "You should not have done that."
        );

        playDoorSound();

        game.classList.add(
            "shake"
        );

        setTimeout(
            function() {

                game.classList.remove(
                    "shake"
                );

            },
            550
        );

        return;

    }

    showMessage(
        "The darkness continues.",
        "Keep moving."
    );

}


/* =========================================================
   FLASHLIGHT
========================================================= */

function toggleFlashlight() {

    if (battery <= 0) {

        flashlightOn = false;

        showMessage(
            "The flashlight is dead.",
            "Find another way."
        );

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

function updateBattery(dt) {

    if (!flashlightOn) {
        return;
    }

    battery -= dt * 0.1111;

    battery = Math.max(0, battery);

    if (battery <= 0) {

        flashlightOn = false;

        showMessage(
            "The flashlight dies.",
            "You are not alone."
        );
    }

    updateBatteryUI();
}


    if (battery <= 0) {

        flashlightOn = false;

        showMessage(
            "The flashlight dies.",
            "You are not alone."
        );

    }

    updateBatteryUI();

}


function updateBatteryUI() {

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

    if (value < 20) {

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

function normalizeAngle(angle) {

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
            3500
        );

}


function hideMessage() {

    clearTimeout(
        messageTimer
    );

    message.classList.remove(
        "visible"
    );

}


function hideInteraction() {

    interaction.classList.remove(
        "visible"
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

        distance += step;

        const x =
            player.x +
            cos * distance;

        const y =
            player.y +
            sin * distance;

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

        if (tile === "#") {

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
        distance: maxDistance,
        type: "none"
    };

}


/* =========================================================
   RENDER
========================================================= */

function render() {

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

    drawApparition(
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

    if (flashlightOn) {

        gradient.addColorStop(
            0,
            "#070707"
        );

        gradient.addColorStop(
            0.45,
            "#101010"
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
   WORLD RENDER
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
                Math.floor(width / 1.5)
            )
        );

    const columnWidth =
        width / columns;

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
            percent * FOV;

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
   WALL SHADING
========================================================= */

function getWallShade(
    distance,
    type
) {

    let light =
        105 /
        Math.max(
            1,
            distance * distance
        );

    if (flashlightOn) {

        light *= 3.2;

    } else {

        light *= 0.32;

    }

    light =
        Math.max(
            3,
            Math.min(
                125,
                light
            )
        );

    if (type === "door") {

        return (
            "rgb(" +
            Math.floor(
                light * 0.55
            ) +
            "," +
            Math.floor(
                light * 0.55
            ) +
            "," +
            Math.floor(
                light * 0.55
            ) +
            ")"
        );

    }

    return (
        "rgb(" +
        Math.floor(light) +
        "," +
        Math.floor(light) +
        "," +
        Math.floor(light) +
        ")"
    );

}


/* =========================================================
   APPARITION SYSTEM
========================================================= */

function updateHorror(dt) {

    if (!gameStarted || paused) {
        return;
    }

    apparitionTimer += dt;

    if (
        !apparitionActive &&
        apparitionTimer > 18
    ) {

        apparitionTimer = 0;

        if (Math.random() < 0.55) {

            apparitionActive = true;

            setTimeout(
                function() {

                    apparitionActive =
                        false;

                },
                1800
            );

            playWhisper();

        }

    }

}


function drawApparition(
    width,
    height
) {

    if (!apparitionActive) {
        return;
    }

    const alpha =
        0.12 +
        Math.sin(
            elapsed * 9
        ) * 0.025;

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
            220
        );

    gradient.addColorStop(
        0,
        "rgba(220,220,220," +
        alpha +
        ")"
    );

    gradient.addColorStop(
        0.35,
        "rgba(120,120,120," +
        alpha * 0.45 +
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
        centerY - 30,
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

    } catch (error) {

        console.warn(
            "Audio is unavailable in this browser."
        );

    }

}


/* =========================================================
   AMBIENT SOUND
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
        0.18;

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
        0.045;

    oscillator2.connect(
        gain2
    );

    gain2.connect(
        ambientGain
    );

    oscillator2.start();

}


/* =========================================================
   FOOTSTEP SOUND
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
                0.10
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
            i / data.length;

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
        0.0001,
        now
    );

    gain.gain.exponentialRampToValueAtTime(
        0.11,
        now + 0.012
    );

    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.10
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
        now + 0.11
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
        0.0001,
        now
    );

    gain.gain.exponentialRampToValueAtTime(
        0.12,
        now + 0.04
    );

    gain.gain.exponentialRampToValueAtTime(
        0.0001,
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
        0.07;

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
   FLASHLIGHT SOUND
========================================================= */

function playFlashlightClick() {

    if (!audioContext) {
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
        0.06,
        now
    );

    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.045
    );

    oscillator.connect(
        gain
    );

    gain.connect(
        masterGain
    );

    oscillator.start(now);

    oscillator.stop(
        now + 0.05
    );

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
            0.05
        );

    lastTime =
        now;

    if (
        gameStarted &&
        !paused
    ) {

        elapsed += dt;

        updateMovement(dt);

        updateBattery(dt);

        updateInteraction();

        updateHorror(dt);

    }

    render();

    requestAnimationFrame(
        loop
    );

}


requestAnimationFrame(
    loop
);


/* =========================================================
   INITIAL STATE
========================================================= */

resetGame();

objective.textContent =
    "Find a way out.";
