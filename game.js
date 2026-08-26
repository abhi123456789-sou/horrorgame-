const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const message = document.getElementById("message");
const door = document.getElementById("door");

let gameStarted = false;
let doorOpened = false;
let flashlightOn = true;

startButton.addEventListener("click", () => {

    gameStarted = true;

    startScreen.style.transition = "opacity 2s";
    startScreen.style.opacity = "0";

    setTimeout(() => {
        startScreen.style.display = "none";
    }, 2000);

    message.innerHTML =
        "The room is colder than before." +
        "<span>WASD to move • E to interact • F for flashlight</span>";
});


document.addEventListener("keydown", (event) => {

    if (!gameStarted) return;

    const key = event.key.toLowerCase();

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


    /* Door */

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
