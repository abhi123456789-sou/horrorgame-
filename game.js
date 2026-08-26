/* =========================================================
   THE LAST ROOM
   First Person Horror Game
========================================================= */


/* =========================================================
   DOM
========================================================= */

const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas.getContext("2d");

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
   CANVAS
========================================================= */

function resizeCanvas() {

    const dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );

    canvas.width =
        window.innerWidth * dpr;

    canvas.height =
        window.innerHeight * dpr;

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


let gameStarted = false;

let paused = false;

let doorOpen = false;

let doorProgress = 0;

let flashlightOn = true;

let battery = 100;

let apparitionActive = false;

let apparitionSeen = false;

let elapsed = 0;


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

    }
);


/* =========================================================
   POINTER LOCK
========================================================= */

canvas.addEventListener(
    "click",
    function() {

        if (
            gameStarted &&
            !paused
        ) {

            canvas.requestPointerLock();

        }

    }
);


document.addEventListener(
    "pointerlockchange",
    function() {

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
   MENU
========================================================= */

startButton.addEventListener(
    "click",
    startGame
);


resumeButton.addEventListener(
    "click",
    function() {

        paused = false;

        pauseMenu.classList
            .add("hidden");

        canvas.requestPointerLock();

        showMessage(
            "You are still here.",
            "Find a way out."
        );

    }
);


restartButton.addEventListener(
    "click",
    function() {

        resetGame();

        pauseMenu.classList
            .add("hidden");

        canvas.requestPointerLock();

        showMessage(
            "The room is quiet.",
            "But something is different."
        );

    }
);


controlsButton.addEventListener(
    "click",
    function() {

        controlsPanel.classList
            .remove("hidden");

    }
);


pauseControlsButton.addEventListener(
    "click",
    function() {

        controlsPanel.classList
            .remove("hidden");

    }
);


closeControls.addEventListener(
    "click",
    function() {

        controlsPanel.classList
            .add("hidden");

    }
);


/* =========================================================
   START
========================================================= */

function startGame() {

    gameStarted = true;

    paused = false;

    mainMenu.style.opacity = "0";

    setTimeout(
        function() {

            mainMenu.classList
                .add("hidden");

        },
        700
    );

    startAudio();

    resetGame();

    showMessage(
        "The room is quiet.",
        "Find a way out."
    );

    canvas.requestPointerLock();

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

        pauseMenu.classList
            .remove("hidden");

        if (
            document.pointerLockElement ===
            canvas
        ) {

            document.exitPointerLock();

        }

    } else {

        pauseMenu.classList
            .add("hidden");

        canvas.requestPointerLock();

    }

}


/* =========================================================
   RESET
========================================================= */

function resetGame() {

    player.x = 2.5;

    player.y = 2.5;

    player.angle =
        Math.PI / 2;

    doorOpen = false;

    doorProgress = 0;

    flashlightOn = true;

    battery = 100;

    apparitionActive = false;

    apparitionSeen = false;

    elapsed = 0;

    objective.textContent =
        "Find a way out.";

    document.body.classList
        .remove("lowBattery");

}


/* =========================================================
   MAP
========================================================= */

function getCell(x, y) {

    const mx =
        Math.floor(x);

    const my =
        Math.floor(y);

    if (
        mx < 0 ||
        my < 0 ||
        mx >= MAP_WIDTH ||
        my >= MAP_HEIGHT
    ) {

        return "#";

    }

    return MAP[my][mx];

}


function isWall(x, y) {

    const cell =
        getCell(x, y);

    if (cell === "#") {
        return true;
    }

    if (
        cell === "D" &&
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

let stepTimer = 0;

let leftFoot = false;


function updateMovement(dt) {

    if (
        !gameStarted ||
        paused
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


    const moving =
        forward !== 0 ||
        strafe !== 0;


    if (!moving) {

        stepTimer = 0;

        return;

    }


    const length =
        Math.sqrt(
            forward * forward +
            strafe * strafe
        );


    forward /= length;

    strafe /= length;


    const speed =
        2.35;


    const dx =

        (

            Math.cos(player.angle) *
            forward

            -

            Math.sin(player.angle) *
            strafe

        )

        *

        speed *
        dt;


    const dy =

        (

            Math.sin(player.angle) *
            forward

            +

            Math.cos(player.angle) *
            strafe

        )

        *

        speed *
        dt;


    if (
        canMoveTo(
            player.x + dx,
            player.y
        )
    ) {

        player.x += dx;

    }


    if (
        canMoveTo(
            player.x,
            player.y + dy
        )
    ) {

        player.y += dy;

    }


    /* FOOTSTEPS */

    stepTimer -= dt;


    if (stepTimer <= 0) {

        playFootstep(
            leftFoot
        );

        leftFoot =
            !leftFoot;


        stepTimer =
            keys.w || keys.s
                ? 0.40
                : 0.48;


        checkHorrorEvents();

    }

}


/* =========================================================
   DOOR
========================================================= */

function getDoorDistance() {

    const doorX = 8.5;

    const doorY = 3.5;

    return Math.hypot(

        player.x - doorX,

        player.y - doorY

    );

}


function isFacingDoor() {

    const doorX = 8.5;

    const doorY = 3.5;


    const dx =
        doorX - player.x;

    const dy =
        doorY - player.y;


    const distance =
        Math.hypot(dx, dy);


    if (distance > 2.2) {
        return false;
    }


    const targetAngle =
        Math.atan2(dy, dx);


    const difference =
        normalizeAngle(
            targetAngle -
            player.angle
        );


    return (
        Math.abs(difference) <
        0.45
    );

}


function interact() {

    if (
        isFacingDoor() &&
        !doorOpen
    ) {

        openDoor();

        return;

    }


    if (
        doorOpen &&
        player.y > 3.7 &&
        player.y < 5.2
    ) {

        showMessage(
            "The doorway is open.",
            "You don't remember this room."
        );

        return;

    }


    showMessage(
        "Nothing.",
        "There is nothing here."
    );

}


function openDoor() {

    doorOpen = true;

    objective.textContent =
        "Enter the room beyond the door.";

    playDoorSound();

    showMessage(
        "The door slowly opens.",
        "You hear breathing on the other side."
    );

    game.classList.add("shake");

    setTimeout(
        function() {

            game.classList
                .remove("shake");

        },
        600
    );

}


/* =========================================================
   HORROR EVENTS
========================================================= */

function checkHorrorEvents() {

    if (
        doorOpen &&
        !apparitionSeen &&
        player.y > 7
    ) {

        apparitionSeen = true;

        apparitionActive = true;

        objective.textContent =
            "Something is watching you.";

        showMessage(
            "You are not alone.",
            "Don't look behind you."
        );

        playWhisper();


        setTimeout(
            function() {

                apparitionActive =
                    false;

            },
            2600
        );

    }


    if (
        doorOpen &&
        player.y > 8.5 &&
        player.x > 8
    ) {

        objective.textContent =
            "Keep going.";


        if (
            Math.random() < 0.004
        ) {

            playKnock();

        }

    }

}


/* =========================================================
   FLASHLIGHT
========================================================= */

function toggleFlashlight() {

    if (battery <= 0) {

        flashlightOn = false;

        showMessage(
            "The flashlight is dead.",
            "There is almost no light left."
        );

        return;

    }


    flashlightOn =
        !flashlightOn;


    if (flashlightOn) {

        showMessage(
            "The flashlight flickers on.",
            "Something moved."
        );

    } else {

        showMessage(
            "You turned the flashlight off.",
            "You can still hear something."
        );

    }


    playFlashlightClick();

}


function updateBattery(dt) {

    if (
        !gameStarted ||
        paused
    ) {
        return;
    }


    if (flashlightOn) {

        battery -=
            dt * 1.35;


        if (battery <= 0) {

            battery = 0;

            flashlightOn = false;

            playFlashlightClick();

            showMessage(
                "The flashlight dies.",
                "You can still hear something."
            );

        }

    }


    batteryFill.style.width =
        `${battery}%`;


    if (battery < 25) {

        document.body.classList
            .add("lowBattery");

    } else {

        document.body.classList
            .remove("lowBattery");

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
   RAYCASTING
========================================================= */

function castRay(angle) {

    const rayDirX =
        Math.cos(angle);

    const rayDirY =
        Math.sin(angle);


    let mapX =
        Math.floor(player.x);

    let mapY =
        Math.floor(player.y);


    const deltaDistX =
        Math.abs(
            1 /
            (rayDirX || 0.00001)
        );


    const deltaDistY =
        Math.abs(
            1 /
            (rayDirY || 0.00001)
        );


    let stepX;

    let stepY;

    let sideDistX;

    let sideDistY;


    if (rayDirX < 0) {

        stepX = -1;

        sideDistX =
            (
                player.x -
                mapX
            ) *
            deltaDistX;

    } else {

        stepX = 1;

        sideDistX =
            (
                mapX + 1 -
                player.x
            ) *
            deltaDistX;

    }


    if (rayDirY < 0) {

        stepY = -1;

        sideDistY =
            (
                player.y -
                mapY
            ) *
            deltaDistY;

    } else {

        stepY = 1;

        sideDistY =
            (
                mapY + 1 -
                player.y
            ) *
            deltaDistY;

    }


    let hit = false;

    let side = 0;

    let cell = "#";


    let distance = 0;


    for (
        let i = 0;
        i < 80;
        i++
    ) {

        if (
            sideDistX <
            sideDistY
        ) {

            sideDistX +=
                deltaDistX;

            mapX += stepX;

            side = 0;

        } else {

            sideDistY +=
                deltaDistY;

            mapY += stepY;

            side = 1;

        }


        cell =

            (
                mapX >= 0 &&
                mapY >= 0 &&
                mapX < MAP_WIDTH &&
                mapY < MAP_HEIGHT
            )

            ?

            MAP[mapY][mapX]

            :

            "#";


        if (
            cell === "#" ||
            (
                cell === "D" &&
                !doorOpen
            )
        ) {

            hit = true;

            break;

        }

    }


    if (!hit) {

        distance = 20;

    } else {

        if (side === 0) {

            distance =

                (

                    mapX -
                    player.x +
                    (1 - stepX) / 2

                )

                /

                rayDirX;

        } else {

            distance =

                (

                    mapY -
                    player.y +
                    (1 - stepY) / 2

                )

                /

                rayDirY;

        }

    }


    return {

        distance:
            Math.max(
                distance,
                0.01
            ),

        side,

        cell

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


    /* CEILING */

    const ceiling =
        ctx.createLinearGradient(
            0,
            0,
            0,
            height * 0.52
        );


    ceiling.addColorStop(
        0,
        "#020202"
    );


    ceiling.addColorStop(
        1,
        "#101010"
    );


    ctx.fillStyle =
        ceiling;


    ctx.fillRect(
        0,
        0,
        width,
        height * 0.52
    );


    /* FLOOR */

    const floor =
        ctx.createLinearGradient(
            0,
            height * 0.48,
            0,
            height
        );


    floor.addColorStop(
        0,
        "#151515"
    );


    floor.addColorStop(
        1,
        "#030303"
    );


    ctx.fillStyle =
        floor;


    ctx.fillRect(
        0,
        height * 0.48,
        width,
        height * 0.52
    );


    /* FLOOR LINES */

    ctx.strokeStyle =
        "rgba(120,120,120,0.045)";

    ctx.lineWidth = 1;


    for (
        let i = 1;
        i < 18;
        i++
    ) {

        const y =

            height * 0.48 +

            Math.pow(
                i / 18,
                2
            ) *

            height *
            0.52;


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


    /* WALL RAYS */

    const rayCount =
        Math.min(
            Math.floor(width / 2),
            900
        );


    const stripWidth =
        width /
        rayCount;


    for (
        let i = 0;
        i < rayCount;
        i++
    ) {

        const cameraX =
            (
                i /
                rayCount
            ) *
            2 -
            1;


        const rayAngle =

            player.angle +

            Math.atan(

                cameraX *

                Math.tan(
                    FOV / 2
                )

            );


        const ray =
            castRay(rayAngle);


        let distance =

            ray.distance *

            Math.cos(

                normalizeAngle(

                    rayAngle -
                    player.angle

                )

            );


        distance =
            Math.max(
                distance,
                0.05
            );


        const wallHeight =

            Math.min(
                height * 1.8,
                height / distance
            );


        const top =

            height / 2 -
            wallHeight / 2;


        /* LIGHT */

        const angleDifference =

            Math.abs(

                normalizeAngle(

                    rayAngle -
                    player.angle

                )

            );


        let light = 0.05;


        if (flashlightOn) {

            const cone =

                Math.max(

                    0,

                    1 -

                    angleDifference /
                    (FOV * 0.65)

                );


            const range =

                Math.max(

                    0,

                    1 -
                    distance / 8

                );


            light =

                0.06 +

                cone *
                range *
                0.95;

        } else {

            light = 0.025;

        }


        light +=

            Math.max(
                0,
                0.13 -
                distance * 0.008
            );


        if (
            ray.side === 1
        ) {

            light *= 0.72;

        }


        if (
            flashlightOn &&
            battery < 25 &&
            Math.random() < 0.015
        ) {

            light *= 0.25;

        }


        light =
            Math.max(
                0.015,
                Math.min(
                    1,
                    light
                )
            );


        let base;


        if (
            ray.cell === "D"
        ) {

            base =
                [62,62,62];

        } else {

            base =
                [74,72,70];

        }


        const r =
            Math.floor(
                base[0] *
                light
            );


        const g =
            Math.floor(
                base[1] *
                light
            );


        const b =
            Math.floor(
                base[2] *
                light
            );


        ctx.fillStyle =
            `rgb(${r},${g},${b})`;


        ctx.fillRect(

            i * stripWidth,

            top,

            stripWidth + 1,

            wallHeight

        );

    }


    /* APPARITION */

    if (
        apparitionActive
    ) {

        drawApparition();

    }


    /* FLASHLIGHT DARKNESS */

    if (flashlightOn) {

        const gradient =

            ctx.createRadialGradient(

                width / 2,
                height / 2,
                80,

                width / 2,
                height / 2,

                Math.min(
                    width,
                    height
                ) * 0.7

            );


        gradient.addColorStop(
            0,
            "rgba(0,0,0,0)"
        );


        gradient.addColorStop(
            0.55,
            "rgba(0,0,0,0.12)"
        );


        gradient.addColorStop(
            1,
            "rgba(0,0,0,0.72)"
        );


        ctx.fillStyle =
            gradient;


        ctx.fillRect(
            0,
            0,
            width,
            height
        );

    } else {

        ctx.fillStyle =
            "rgba(0,0,0,0.78)";


        ctx.fillRect(
            0,
            0,
            width,
            height
        );

    }

}


/* =========================================================
   APPARITION
========================================================= */

function drawApparition() {

    const width =
        window.innerWidth;

    const height =
        window.innerHeight;


    const targetX = 9.5;

    const targetY = 8.2;


    const dx =
        targetX -
        player.x;

    const dy =
        targetY -
        player.y;


    const distance =
        Math.hypot(
            dx,
            dy
        );


    const angleTo =
        Math.atan2(
            dy,
            dx
        );


    const difference =
        normalizeAngle(
            angleTo -
            player.angle
        );


    if (
        Math.abs(difference) >
        FOV * 0.7
    ) {

        return;

    }


    const screenX =

        width / 2 +

        (
            difference /
            FOV
        ) *
        width;


    const size =

        Math.min(

            height * 0.5,

            height /
            distance

        );


    const bottom =

        height / 2 +
        size * 0.5;


    const top =
        bottom - size;


    ctx.save();


    ctx.globalAlpha =

        Math.min(
            0.85,
            1 /
            Math.max(
                distance * 0.25,
                1
            )
        );


    /* HEAD */

    ctx.fillStyle =
        "#020202";


    ctx.beginPath();


    ctx.ellipse(

        screenX,

        top +
        size * 0.16,

        size *
        0.11,

        size *
        0.12,

        0,

        0,

        Math.PI * 2

    );


    ctx.fill();


    /* BODY */

    ctx.fillRect(

        screenX -
        size * 0.10,

        top +
        size * 0.27,

        size *
        0.20,

        size *
        0.52

    );


    /* LEGS */

    ctx.fillRect(

        screenX -
        size * 0.09,

        top +
        size * 0.72,

        size *
        0.07,

        size *
        0.27

    );


    ctx.fillRect(

        screenX +
        size * 0.02,

        top +
        size * 0.72,

        size *
        0.07,

        size *
        0.27

    );


    /* EYES */

    ctx.fillStyle =
        "rgba(190,190,190,0.55)";


    ctx.fillRect(

        screenX -
        size * 0.055,

        top +
        size * 0.145,

        size *
        0.025,

        size *
        0.012

    );


    ctx.fillRect(

        screenX +
        size * 0.03,

        top +
        size * 0.145,

        size *
        0.025,

        size *
        0.012

    );


    ctx.restore();

}


/* =========================================================
   MESSAGE
========================================================= */

let messageTimer = null;


function showMessage(
    main,
    sub
) {

    message.innerHTML =

        `${main}<span>${sub}</span>`;


    message.classList
        .add("visible");


    clearTimeout(
        messageTimer
    );


    messageTimer =

        setTimeout(
            hideMessage,
            4500
        );

}


function hideMessage() {

    message.classList
        .remove("visible");

}


/* =========================================================
   INTERACTION HUD
========================================================= */

function updateInteraction() {

    if (
        !gameStarted ||
        paused
    ) {

        interaction.classList
            .remove("visible");

        return;

    }


    if (
        isFacingDoor() &&
        !doorOpen
    ) {

        interactionMain.textContent =
            "[ E ] OPEN DOOR";

        interactionSub.textContent =
            "The handle is cold.";

        interaction.classList
            .add("visible");

        return;

    }


    interaction.classList
        .remove("visible");

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

            audioContext.resume();

        }

        return;

    }


    audioContext =

        new (
            window.AudioContext ||
            window.webkitAudioContext
        )();


    masterGain =
        audioContext.createGain();


    masterGain.gain.value =
        0.48;


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

}


/* =========================================================
   AMBIENT
========================================================= */

function startAmbient() {

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();


    oscillator.type =
        "sine";


    oscillator.frequency.value =
        43;


    gain.gain.value =
        0.20;


    oscillator.connect(
        gain
    );


    gain.connect(
        ambientGain
    );


    oscillator.start();


    /* SECOND LOW TONE */

    const oscillator2 =
        audioContext.createOscillator();

    const gain2 =
        audioContext.createGain();


    oscillator2.type =
        "triangle";


    oscillator2.frequency.value =
        67;


    gain2.gain.value =
        0.06;


    oscillator2.connect(
        gain2
    );


    gain2.connect(
        ambientGain
    );


    oscillator2.start();

}


/* =========================================================
   FOOTSTEPS
========================================================= */

function playFootstep(left) {

    if (!audioContext) {
        return;
    }


    const now =
        audioContext.currentTime;


    /* NOISE */

    const buffer =

        audioContext.createBuffer(

            1,

            audioContext.sampleRate *
            0.12,

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
            )

            *

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
        left
            ? 900
            : 1100;


    const gain =
        audioContext
            .createGain();


    gain.gain.setValueAtTime(
        0.0001,
        now
    );


    gain.gain.exponentialRampToValueAtTime(
        0.14,
        now + 0.012
    );


    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.12
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
        now + 0.13
    );


    /* LOW IMPACT */

    const osc =
        audioContext
            .createOscillator();


    const oscGain =
        audioContext
            .createGain();


    osc.type =
        "sine";


    osc.frequency.setValueAtTime(
        left ? 75 : 68,
        now
    );


    osc.frequency.exponentialRampToValueAtTime(
        45,
        now + 0.08
    );


    oscGain.gain.setValueAtTime(
        0.0001,
        now
    );


    oscGain.gain.exponentialRampToValueAtTime(
        0.09,
        now + 0.008
    );


    oscGain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.1
    );


    osc.connect(
        oscGain
    );


    oscGain.connect(
        masterGain
    );


    osc.start(now);

    osc.stop(
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


    const osc =
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


    osc.type =
        "sawtooth";


    osc.frequency.setValueAtTime(
        65,
        now
    );


    osc.frequency.exponentialRampToValueAtTime(
        32,
        now + 1.3
    );


    gain.gain.setValueAtTime(
        0.0001,
        now
    );


    gain.gain.exponentialRampToValueAtTime(
        0.14,
        now + 0.05
    );


    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 1.3
    );


    osc.connect(
        gain
    );


    gain.connect(
        masterGain
    );


    osc.start(now);

    osc.stop(
        now + 1.4
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

            audioContext.sampleRate *
            1.8,

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
            )

            *

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
        "bandpass";


    filter.frequency.value =
        1200;


    filter.Q.value =
        3;


    const gain =
        audioContext
            .createGain();


    gain.gain.value =
        0.09;


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
   KNOCKS
========================================================= */

function playKnock() {

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

        const osc =
            audioContext
                .createOscillator();


        const gain =
            audioContext
                .createGain();


        osc.type =
            "triangle";


        osc.frequency.value =
            95;


        gain.gain.setValueAtTime(

            0.0001,

            now +
            i *
            0.32

        );


        gain.gain.exponentialRampToValueAtTime(

            0.20,

            now +
            i *
            0.32 +
            0.01

        );


        gain.gain.exponentialRampToValueAtTime(

            0.0001,

            now +
            i *
            0.32 +
            0.12

        );


        osc.connect(
            gain
        );


        gain.connect(
            masterGain
        );


        osc.start(

            now +
            i *
            0.32

        );


        osc.stop(

            now +
            i *
            0.32 +
            0.14

        );

    }

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
        0.08,
        now
    );


    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.045
    );


    osc.connect(
        gain
    );


    gain.connect(
        masterGain
    );


    osc.start(now);

    osc.stop(
        now + 0.05
    );

}


/* =========================================================
   MAIN LOOP
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
        !paused
    ) {

        elapsed += dt;


        updateMovement(
            dt
        );


        updateBattery(
            dt
        );


        updateInteraction();


        if (
            doorOpen &&
            doorProgress < 1
        ) {

            doorProgress =

                Math.min(

                    1,

                    doorProgress +
                    dt *
                    0.8

                );

        }

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
   INITIAL OBJECTIVE
========================================================= */

objective.textContent =
    "Find a way out.";
