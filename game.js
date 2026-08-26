"use strict";

/* =========================================================
   THE LAST ROOM
   COMPLETE / CORRECTED GAME.JS

   Controls:
   W A S D = Move
   Mouse   = Look
   E       = Interact
   ENTER   = Interact
   F       = Flashlight
   ESC     = Pause
========================================================= */


/* =========================================================
   DOM ELEMENTS
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
   BASIC SAFETY
========================================================= */

if (!canvas || !ctx) {
    console.error(
        "THE LAST ROOM: gameCanvas was not found."
    );
}

if (!game) {
    console.warn(
        "THE LAST ROOM: #game element was not found."
    );
}


/* =========================================================
   CANVAS
========================================================= */

function resizeCanvas() {

    if (!canvas || !ctx) {
        return;
    }

    const dpr = Math.min(
        window.devicePixelRatio || 1,
        2
    );

    const width =
        Math.max(1, window.innerWidth);

    const height =
        Math.max(1, window.innerHeight);

    canvas.width =
        Math.floor(width * dpr);

    canvas.height =
        Math.floor(height * dpr);

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

let apparitionTimeout = null;

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
   AUDIO STATE
========================================================= */

let audioContext = null;

let masterGain = null;

let ambientGain = null;


/* =========================================================
   RESET KEYS
========================================================= */

function resetKeys() {

    keys.w = false;
    keys.a = false;
    keys.s = false;
    keys.d = false;

}


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

    resetKeys();

    if (apparitionTimeout !== null) {

        clearTimeout(
            apparitionTimeout
        );

        apparitionTimeout = null;

    }

    updateBatteryUI();

    hideInteraction();

    hideMessage();

    if (objective) {

        objective.textContent =
            "Find a way out.";

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


        /* -----------------------------------------
           MOVEMENT
        ----------------------------------------- */

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

            return;

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

            return;

        }


        /* -----------------------------------------
           ESCAPE / PAUSE
        ----------------------------------------- */

        if (
            key === "escape" &&
            gameStarted
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

                return;

            }

            togglePause();

        }

    }
);


/* =========================================================
   KEYBOARD RELEASE
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
   MOUSE LOOK
========================================================= */

document.addEventListener(
    "mousemove",
    function(event) {

        if (
            !gameStarted ||
            paused
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
            event.movementX * 0.0024;

        if (
            player.angle >
            Math.PI * 2
        ) {

            player.angle -=
                Math.PI * 2;

        }

        if (
            player.angle <
            -Math.PI * 2
        ) {

            player.angle +=
                Math.PI * 2;

        }

    }
);


/* =========================================================
   POINTER LOCK
========================================================= */

function requestGamePointerLock() {

    if (
        !gameStarted ||
        paused ||
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

                    pointerLockPending = false;

                }
            );

        }

    } catch (error) {

        pointerLockPending = false;

        console.warn(
            "Pointer lock unavailable.",
            error
        );

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

if (canvas) {

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

}


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

if (startButton) {

    startButton.addEventListener(
        "click",
        function() {

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

    resetGame();

    if (mainMenu) {

        mainMenu.style.transition =
            "opacity 0.7s ease";

        mainMenu.style.opacity =
            "0";

        setTimeout(
            function() {

                if (mainMenu) {

                    mainMenu.classList.add(
                        "hidden"
                    );

                    mainMenu.style.opacity =
                        "";

                }

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

    paused =
        !paused;

    if (paused) {

        resetKeys();

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

            } catch (error) {

                console.warn(
                    "Could not exit pointer lock."
                );

            }

        }

        hideInteraction();

    } else {

        if (pauseMenu) {

            pauseMenu.classList.add(
                "hidden"
            );

        }

        showMessage(
            "You are still here.",
            "Find a way out."
        );

        requestGamePointerLock();

    }

}


/* =========================================================
   RESUME BUTTON
========================================================= */

if (resumeButton) {

    resumeButton.addEventListener(
        "click",
        function() {

            if (!gameStarted) {

                return;

            }

            paused = false;

            resetKeys();

            if (pauseMenu) {

                pauseMenu.classList.add(
                    "hidden"
                );

            }

            requestGamePointerLock();

            showMessage(
                "You are still here.",
                "Find a way out."
            );

        }
    );

}


/* =========================================================
   RESTART BUTTON
========================================================= */

if (restartButton) {

    restartButton.addEventListener(
        "click",
        function() {

            if (!gameStarted) {

                return;

            }

            resetGame();

            paused = false;

            if (pauseMenu) {

                pauseMenu.classList.add(
                    "hidden"
                );

            }

            showMessage(
                "The room is quiet.",
                "But something feels different."
            );

            startAudio();

            requestGamePointerLock();

        }
    );

}


/* =========================================================
   CONTROLS BUTTON
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


/* =========================================================
   PAUSE CONTROLS BUTTON
========================================================= */

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


/* =========================================================
   CLOSE CONTROLS
========================================================= */

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


/* =========================================================
   PLAYER COLLISION
========================================================= */

function canMoveTo(x, y) {

    const r =
        player.radius;

    const points = [

        [x - r, y - r],

        [x + r, y - r],

        [x - r, y + r],

        [x + r, y + r],

        [x, y - r],

        [x, y + r],

        [x - r, y],

        [x + r, y]

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

        footstepTimer = 0;

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

    const speed =
        2.25;

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
        player.x + moveX;

    const nextY =
        player.y + moveY;

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

        moved =
            true;

    }

    if (
        canMoveTo(
            player.x,
            nextY
        )
    ) {

        player.y =
            nextY;

        moved =
            true;

    }

    if (moved) {

        footstepTimer -=
            dt;

        if (
            footstepTimer <= 0
        ) {

            playFootstep();

            footstepTimer =
                0.42;

        }

    }

}


/* =========================================================
   FIND DOOR
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
   UPDATE INTERACTION
========================================================= */

function updateInteraction() {

    if (
        !gameStarted ||
        paused
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
        door.distance >= 1.65
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
        difference >= 0.85
    ) {

        interactionTarget =
            null;

        hideInteraction();

        return;

    }

    interactionTarget =
        "door";

    if (!interactionMain || !interactionSub) {

        return;

    }

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

    if (!door) {

        return;

    }

    if (
        door.distance >
        1.8
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

        if (game) {

            game.classList.add(
                "shake"
            );

            setTimeout(
                function() {

                    if (game) {

                        game.classList.remove(
                            "shake"
                        );

                    }

                },
                550
            );

        }

        updateInteraction();

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

    if (
        battery <= 0
    ) {

        flashlightOn =
            false;

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

    if (flashlightOn) {

        showMessage(
            "Flashlight on.",
            "The darkness retreats."
        );

    } else {

        showMessage(
            "Flashlight off.",
            "The darkness returns."
        );

    }

}


/* =========================================================
   BATTERY
========================================================= */

function updateBattery(dt) {

    if (!flashlightOn) {

        return;

    }

    battery -=
        dt * 0.1111;

    battery =
        Math.max(
            0,
            battery
        );

    if (
        battery <= 0 &&
        flashlightOn
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
   NORMALIZE ANGLE
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
   SHOW MESSAGE
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

    message.textContent =
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

    if (subText) {

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

                if (message) {

                    message.classList.remove(
                        "visible"
                    );

                }

            },
            3500
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
   HIDE INTERACTION
========================================================= */

function hideInteraction() {

    if (!interaction) {

        return;

    }

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

    let distance =
        0;

    const maxDistance =
        30;

    const step =
        0.025;

    while (
        distance <
        maxDistance
    ) {

        distance +=
            step;

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

        distance: maxDistance,

        type: "none"

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

    if (!ctx) {

        return;

    }

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

    if (!ctx) {

        return;

    }

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
            distance *
            distance
        );

    if (flashlightOn) {

        light *=
            3.2;

    } else {

        light *=
            0.32;

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

        const doorLight =
            Math.floor(
                light * 0.55
            );

        return (
            "rgb(" +
            doorLight +
            "," +
            doorLight +
            "," +
            doorLight +
            ")"
        );

    }

    const wallLight =
        Math.floor(
            light
        );

    return (
        "rgb(" +
        wallLight +
        "," +
        wallLight +
        "," +
        wallLight +
        ")"
    );

}


/* =========================================================
   HORROR SYSTEM
========================================================= */

function updateHorror(dt) {

    if (
        !gameStarted ||
        paused
    ) {

        return;

    }

    apparitionTimer +=
        dt;

    if (
        !apparitionActive &&
        apparitionTimer > 18
    ) {

        apparitionTimer =
            0;

        if (
            Math.random() <
            0.55
        ) {

            apparitionActive =
                true;

            if (
                apparitionTimeout !== null
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
   APPARITION
========================================================= */

function drawApparition(
    width,
    height
) {

    if (
        !ctx ||
        !apparitionActive
    ) {

        return;

    }

    const alpha =
        0.12 +
        Math.sin(
            elapsed * 9
        ) *
        0.025;

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

        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContextClass) {

            console.warn(
                "Web Audio API is not supported."
            );

            return;

        }

        audioContext =
            new AudioContextClass();

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
            "Audio is unavailable.",
            error
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

    const duration =
        0.10;

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
        0.0001,
        now
    );

    gain.gain.exponentialRampToValueAtTime(
        0.11,
        now + 0.012
    );

    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + duration
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

    source.start(
        now
    );

    source.stop(
        now + 0.11
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

    oscillator.start(
        now
    );

    oscillator.stop(
        now + 1.3
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

    const now =
        audioContext.currentTime;

    const duration =
        1.5;

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

    source.start(
        now
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

    oscillator.start(
        now
    );

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
            Math.max(
                0,
                (
                    now -
                    lastTime
                ) / 1000
            ),
            0.05
        );

    lastTime =
        now;

    if (
        gameStarted &&
        !paused
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

    }

    render();

    requestAnimationFrame(
        loop
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

requestAnimationFrame(
    loop
);
