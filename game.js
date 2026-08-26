const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const message = document.getElementById("message");
const door = document.getElementById("door");
const game = document.getElementById("game");

let gameStarted = false;
let doorOpened = false;
let flashlightOn = true;

const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

let playerX = 0;
let playerZ = 0;

let cameraYaw = 0;
let cameraPitch = 0;


/* -------------------------
   START GAME
------------------------- */

startButton.addEventListener("click", () => {

    gameStarted = true;

    startScreen.style.transition = "opacity 2s";
    startScreen.style.opacity = "0";

    setTimeout(() => {
        startScreen.style.display = "none";
    }, 2000);

    message.innerHTML =
        "The room is quiet." +
        "<span>WASD to move • Mouse to look • E to interact • F for flashlight</span>";

    game.requestPointerLock();
});


/* -------------------------
   KEYBOARD
------------------------- */

document.addEventListener("keydown", (event) => {

    if (!gameStarted) return;

    const key = event.key.toLowerCase();

    if (key === "w") keys.w = true;
    if (key === "a") keys.a = true;
    if (key === "s") keys.s = true;
    if (key === "d") keys.d = true;


    /* Flashlight */

    if (key === "f") {

        flashlightOn = !flashlightOn;

        document.body.classList.toggle(
            "flashlight-off",
            !flashlightOn
        );

        if (flashlightOn) {

            message.innerHTML =
                "The flashlight flickers back on." +
                "<span>Something moved in the darkness.</span>";

        } else {

            message.innerHTML =
                "You turned the flashlight off." +
                "<span>You can still hear something.</span>";
        }
    }


    /* Door interaction */

    if (key === "e") {

        if (!doorOpened) {

            doorOpened = true;

            door.classList.add("open");

            message.innerHTML =
                "The door slowly opens." +
                "<span>There is another room behind it.</span>";

            setTimeout(() => {

                message.innerHTML =
                    "You don't remember there being another room." +
                    "<span>Something is breathing inside.</span>";

            }, 3500);

        } else {

            message.innerHTML =
                "The doorway is completely dark." +
                "<span>You hear three knocks behind you.</span>";
        }
    }
});


document.addEventListener("keyup", (event) => {

    const key = event.key.toLowerCase();

    if (key === "w") keys.w = false;
    if (key === "a") keys.a = false;
    if (key === "s") keys.s = false;
    if (key === "d") keys.d = false;
});


/* -------------------------
   MOUSE LOOK
------------------------- */

document.addEventListener("mousemove", (event) => {

    if (!gameStarted) return;

    if (document.pointerLockElement !== game) return;

    cameraYaw -= event.movementX * 0.12;
    cameraPitch -= event.movementY * 0.08;

    cameraPitch = Math.max(
        -25,
        Math.min(25, cameraPitch)
    );

    updateCamera();
});


/* -------------------------
   CAMERA
------------------------- */

function updateCamera() {

    game.style.transform =
        `rotateX(${cameraPitch * 0.05}deg)
         rotateY(${cameraYaw * 0.05}deg)`;
}


/* -------------------------
   MOVEMENT
------------------------- */

function updateMovement() {

    if (!gameStarted) return;

    const speed = 0.12;

    if (keys.w) playerZ -= speed;
    if (keys.s) playerZ += speed;
    if (keys.a) playerX -= speed;
    if (keys.d) playerX += speed;

    playerX = Math.max(-350, Math.min(350, playerX));
    playerZ = Math.max(-250, Math.min(250, playerZ));

    const room = document.getElementById("room");

    room.style.transform =
        `translate(${-playerX}px, ${-playerZ}px)`;

    requestAnimationFrame(updateMovement);
}

updateMovement();


/* -------------------------
   POINTER LOCK
------------------------- */

document.addEventListener("pointerlockchange", () => {

    if (!gameStarted) return;

    if (document.pointerLockElement !== game) {

        message.innerHTML =
            "The game is paused." +
            "<span>Click the screen to continue.</span>";
    }
});


game.addEventListener("click", () => {

    if (gameStarted) {
        game.requestPointerLock();
    }

});
