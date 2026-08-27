/* =========================================================
   END OF PART 5/6
========================================================= */

/* =========================================================
   INPUT EVENTS
========================================================= */


/* =========================================================
   KEY DOWN
========================================================= */

window.addEventListener(
    "keydown",
    function(event) {

        const code =
            event.code;


        /* =================================================
           ENTER — SAFE START / RESUME / RESTART
        ================================================= */

        if (code === "Enter") {

            event.preventDefault();
            event.stopPropagation();

            if (event.repeat) {
                return;
            }


            /* =================================================
               RESTART AFTER GAME OVER
            ================================================= */

            if (
                state.gameOver === true
            ) {

                restartGame();

                return;
            }


            /* =================================================
               RESUME FROM PAUSE
            ================================================= */

            if (
                state.paused === true
            ) {

                resumeGame();

                return;
            }


            /* =================================================
               START GAME
            ================================================= */

            if (
                state.started !== true
            ) {

                startGame();

                return;
            }


            return;
        }


        /* =================================================
           ESCAPE / PAUSE
        ================================================= */

        if (
            code === "Escape"
        ) {

            event.preventDefault();


            if (
                state.started &&
                !state.gameOver
            ) {

                if (
                    state.paused
                ) {

                    resumeGame();

                } else {

                    pauseGame();
                }
            }

            return;
        }


        /* =================================================
           STORE KEY
        ================================================= */

        keys[code] =
            true;


        /* =================================================
           FLASHLIGHT
        ================================================= */

        if (
            code === "KeyF"
        ) {

            event.preventDefault();

            toggleFlashlight();

            return;
        }


        /* =================================================
           RELOAD
        ================================================= */

        if (
            code === "KeyR"
        ) {

            event.preventDefault();

            reload();

            return;
        }


        /* =================================================
           INTERACT
        ================================================= */

        if (
            code === "KeyE"
        ) {

            event.preventDefault();

            interact();

            return;
        }


        /* =================================================
           JUMP
        ================================================= */

        if (
            code === "Space"
        ) {

            event.preventDefault();

            jump();

            return;
        }


        /* =================================================
           CROUCH
        ================================================= */

        if (
            code === "ControlLeft" ||
            code === "ControlRight"
        ) {

            setCrouch(
                true
            );

            return;
        }


        /* =================================================
           WEAPON 1
        ================================================= */

        if (
            code === "Digit1"
        ) {

            currentWeaponIndex =
                0;

            updateWeaponUI();

            return;
        }


        /* =================================================
           WEAPON 2
        ================================================= */

        if (
            code === "Digit2"
        ) {

            currentWeaponIndex =
                1;

            updateWeaponUI();

            return;
        }


        /* =================================================
           WEAPON 3
        ================================================= */

        if (
            code === "Digit3"
        ) {

            currentWeaponIndex =
                2;

            updateWeaponUI();

            return;
        }


        /* =================================================
           WEAPON NEXT
        ================================================= */

        if (
            code === "KeyQ"
        ) {

            switchWeapon(
                1
            );

            return;
        }


        /* =================================================
           WEAPON PREVIOUS
        ================================================= */

        if (
            code === "KeyZ"
        ) {

            switchWeapon(
                -1
            );

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


        /*
           IMPORTANT:
           Enter is intentionally NOT handled
           inside keyup.
        */


        if (
            code === "ControlLeft" ||
            code === "ControlRight"
        ) {

            setCrouch(
                false
            );
        }


        keys[code] =
            false;
    },
    {
        passive: false
    }
);


/* =========================================================
   MOUSE EVENTS
========================================================= */

window.addEventListener(
    "mousemove",
    handleMouseMove
);


if (
    renderer &&
    renderer.domElement
) {

    renderer.domElement.addEventListener(
        "mousedown",
        handleMouseDown
    );

    renderer.domElement.addEventListener(
        "mouseup",
        handleMouseUp
    );

} else {

    window.addEventListener(
        "mousedown",
        handleMouseDown
    );

    window.addEventListener(
        "mouseup",
        handleMouseUp
    );
}


/* =========================================================
   POINTER LOCK CHANGE
========================================================= */

document.addEventListener(
    "pointerlockchange",
    function() {

        if (
            !state.started ||
            state.gameOver
        ) {
            return;
        }


        if (
            renderer &&
            document.pointerLockElement !==
            renderer.domElement
        ) {

            if (
                !state.paused
            ) {

                pauseGame();
            }
        }
    }
);


/* =========================================================
   WINDOW BLUR
========================================================= */

window.addEventListener(
    "blur",
    function() {

        resetKeyboardState();
    }
);


/* =========================================================
   WINDOW RESIZE
========================================================= */

window.addEventListener(
    "resize",
    function() {

        if (
            !camera ||
            !renderer
        ) {
            return;
        }


        camera.aspect =
            window.innerWidth /
            window.innerHeight;


        camera.updateProjectionMatrix();


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );


        renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio || 1,
                2
            )
        );


        updateMobileVisibility();
    }
);

/* =========================================================
   BUTTON EVENTS
========================================================= */

if (
    startButton
) {

    startButton.addEventListener(
        "click",
        function() {

            startGame();
        }
    );
}


if (
    resumeButton
) {

    resumeButton.addEventListener(
        "click",
        function() {

            resumeGame();
        }
    );
}


if (
    restartButton
) {

    restartButton.addEventListener(
        "click",
        function() {

            restartGame();
        }
    );
}


if (
    againButton
) {

    againButton.addEventListener(
        "click",
        function() {

            restartGame();
        }
    );
}


if (
    controlsButton
) {

    controlsButton.addEventListener(
        "click",
        function() {

            controlsPanel.classList.add(
                "visible"
            );
        }
    );
}


if (
    pauseControlsButton
) {

    pauseControlsButton.addEventListener(
        "click",
        function() {

            controlsPanel.classList.add(
                "visible"
            );
        }
    );
}


if (
    closeControls
) {

    closeControls.addEventListener(
        "click",
        function() {

            controlsPanel.classList.remove(
                "visible"
            );
        }
    );
}


/* =========================================================
   MOBILE SHOOT
========================================================= */

if (
    mobileShoot
) {

    mobileShoot.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            shoot();
        }
    );
}


/* =========================================================
   MOBILE RELOAD
========================================================= */

if (
    mobileReload
) {

    mobileReload.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            reload();
        }
    );
}


/* =========================================================
   MOBILE JUMP
========================================================= */

if (
    mobileJump
) {

    mobileJump.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            jump();
        }
    );
}


/* =========================================================
   MOBILE CROUCH
========================================================= */

if (
    mobileCrouch
) {

    mobileCrouch.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            setCrouch(
                true
            );
        }
    );


    mobileCrouch.addEventListener(
        "pointerup",
        function(event) {

            event.preventDefault();

            setCrouch(
                false
            );
        }
    );


    mobileCrouch.addEventListener(
        "pointercancel",
        function() {

            setCrouch(
                false
            );
        }
    );
}


/* =========================================================
   MOBILE FLASHLIGHT
========================================================= */

if (
    mobileFlashlight
) {

    mobileFlashlight.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            toggleFlashlight();
        }
    );
}


/* =========================================================
   MOBILE INTERACT
========================================================= */

if (
    mobileInteract
) {

    mobileInteract.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            interact();
        }
    );
}


/* =========================================================
   MOBILE WEAPON SWITCH
========================================================= */

if (
    mobileWeapons
) {

    mobileWeapons.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            switchWeapon(
                1
            );
        }
    );
}


/* =========================================================
   MOBILE JOYSTICK
========================================================= */

if (
    joystickBase &&
    joystickKnob
) {

    joystickBase.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            joystick.active =
                true;

            joystick.pointerId =
                event.pointerId;

            joystickBase.setPointerCapture(
                event.pointerId
            );

            updateJoystick(
                event
            );
        }
    );


    joystickBase.addEventListener(
        "pointermove",
        function(event) {

            if (
                !joystick.active ||
                event.pointerId !==
                    joystick.pointerId
            ) {
                return;
            }

            event.preventDefault();

            updateJoystick(
                event
            );
        }
    );


    function endJoystick(
        event
    ) {

        if (
            event.pointerId !==
            joystick.pointerId
        ) {
            return;
        }


        joystick.active =
            false;

        joystick.pointerId =
            null;

        joystick.x =
            0;

        joystick.y =
            0;


        joystickKnob.style.transform =
            "translate(-50%, -50%)";
    }


    joystickBase.addEventListener(
        "pointerup",
        endJoystick
    );

    joystickBase.addEventListener(
        "pointercancel",
        endJoystick
    );
}


/* =========================================================
   JOYSTICK UPDATE
========================================================= */

function updateJoystick(
    event
) {

    const rect =
        joystickBase.getBoundingClientRect();


    const centerX =
        rect.left +
        rect.width / 2;


    const centerY =
        rect.top +
        rect.height / 2;


    let dx =
        event.clientX -
        centerX;


    let dy =
        event.clientY -
        centerY;


    const radius =
        rect.width / 2;


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    if (
        distance > radius
    ) {

        dx =
            dx /
            distance *
            radius;

        dy =
            dy /
            distance *
            radius;
    }


    joystick.x =
        dx / radius;

    joystick.y =
        dy / radius;


    joystickKnob.style.transform =
        `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}


/* =========================================================
   MOBILE LOOK
========================================================= */

if (
    lookArea
) {

    lookArea.addEventListener(
        "pointerdown",
        function(event) {

            event.preventDefault();

            look.active =
                true;

            look.pointerId =
                event.pointerId;

            look.lastX =
                event.clientX;

            look.lastY =
                event.clientY;

            lookArea.setPointerCapture(
                event.pointerId
            );
        }
    );


    lookArea.addEventListener(
        "pointermove",
        function(event) {

            if (
                !look.active ||
                event.pointerId !==
                    look.pointerId
            ) {
                return;
            }


            event.preventDefault();


            const dx =
                event.clientX -
                look.lastX;


            const dy =
                event.clientY -
                look.lastY;


            look.lastX =
                event.clientX;

            look.lastY =
                event.clientY;


            const sensitivity =
                0.006;


            player.yaw -=
                dx *
                sensitivity;


            player.pitch -=
                dy *
                sensitivity;


            const limit =
                Math.PI / 2 -
                0.05;


            player.pitch =
                clamp(
                    player.pitch,
                    -limit,
                    limit
                );


            updateCamera();
        }
    );


    function endLook(
        event
    ) {

        if (
            event.pointerId !==
            look.pointerId
        ) {
            return;
        }


        look.active =
            false;

        look.pointerId =
            null;
    }


    lookArea.addEventListener(
        "pointerup",
        endLook
    );

    lookArea.addEventListener(
        "pointercancel",
        endLook
    );
}

/* =========================================================
   INITIALIZE GAME
========================================================= */

function initializeGame() {

    try {

        initThree();

        createGun();

        initZombies();

        updateHealthUI();

        updateWeaponUI();

        setObjective(
            state.objective
        );

        updateFlashlight(
            0
        );

        updateCamera();


        if (
            loadingProgress
        ) {

            loadingProgress.style.width =
                "100%";
        }


        if (
            loadingText
        ) {

            loadingText.textContent =
                "READY";
        }


        setTimeout(
            function() {

                if (
                    loadingScreen
                ) {

                    loadingScreen.classList.add(
                        "hidden"
                    );
                }


                if (
                    mainMenu
                ) {

                    mainMenu.classList.add(
                        "visible"
                    );
                }

            },
            450
        );


    } catch (error) {

        console.error(
            "GAME INITIALIZATION ERROR:",
            error
        );


        if (
            loadingText
        ) {

            loadingText.textContent =
                "ERROR: " +
                error.message;
        }


        throw error;
    }
}


/* =========================================================
   MAIN GAME LOOP
========================================================= */

function animate() {

    requestAnimationFrame(
        animate
    );


    if (
        !clock
    ) {

        clock =
            new THREE.Clock();
    }


    const delta =
        Math.min(
            clock.getDelta(),
            0.05
        );


    state.elapsed +=
        delta;


    if (
        state.messageTimer > 0
    ) {

        state.messageTimer -=
            delta * 1000;


        if (
            state.messageTimer <= 0
        ) {

            hideMessage();
        }
    }


    if (
        state.started &&
        !state.paused &&
        !state.gameOver
    ) {

        updateSprint();

        updatePlayer(
            delta
        );

        updateZombies(
            delta
        );

        updateFlashlight(
            delta
        );

        updateGun(
            delta
        );

        updateApparition(
            delta
        );

        updateLightFlicker(
            delta
        );

        updateInteraction();


        if (
            mouseDown
        ) {

            shoot();
        }
    }


    renderer.render(
        scene,
        camera
    );
}


/* =========================================================
   STARTUP
========================================================= */

initializeGame();

animate();


/* =========================================================
   FINAL CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    function() {

        resetKeyboardState();


        try {

            if (
                document.pointerLockElement
            ) {

                document.exitPointerLock();
            }

        } catch (error) {}
    }
);
