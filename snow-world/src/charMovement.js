import * as CANNON from "cannon-es";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
// import { A, D, DIRECTIONS, S, W } from './utils'

export const W = "w";
export const A = "a";
export const S = "s";
export const D = "d";
export const SHIFT = "shift";
export const SPACE = " ";
export const DIRECTIONS = [W, A, S, D];

export class CharacterControls {
  model = null;
  mixer = null;
  animationsMap = new Map(); // Walk, Run, Idle
  orbitControl = null;
  camera = null;

  // state
  toggleRun = true;
  currentAction = null;

  // temporary data
  walkDirection = new THREE.Vector3();
  rotateAngle = new THREE.Vector3(0, 1, 0);
  rotateQuarternion = new THREE.Quaternion();
  cameraTarget = new THREE.Vector3();

  // constants
  fadeDuration = 0.2;
  runVelocity = 5;
  walkVelocity = 2;
  jumpVelocity = 0.5;

  /**
   *
   * @param {*} model
   * @param {*} mixer
   * @param {*} animationsMap
   * @param {OrbitControls} orbitControl
   * @param {*} camera
   * @param {*} currentAction
   * @param {*} playerName
   */
  constructor(
    model,
    mixer,
    animationsMap,
    orbitControl,
    camera,
    currentAction,
    playerName,
    body
  ) {
    this.model = model;
    this.mixer = mixer;
    this.animationsMap = animationsMap;
    this.currentAction = currentAction;
    this.animationsMap.forEach((value, key) => {
      if (key == currentAction) {
        value.play();
      }
    });
    this.orbitControl = orbitControl;
    this.camera = camera;
    this.updateCameraTarget(0, 0);
    this.playerName = playerName;
    this.updatePlayerNamePos();

    this.orbitControl;

    this.body = body;
  }

  switchRunToggle() {
    this.toggleRun = !this.toggleRun;
  }

  update(delta, keysPressed) {
    const directionPressed = DIRECTIONS.some((key) => keysPressed[key] == true);

    var play = "";
    if (directionPressed && this.toggleRun) {
      play = "Run";
    } else if (directionPressed) {
      play = "Walk";
    } else {
      play = "Survey";
    }

    if (this.currentAction != play) {
      const toPlay = this.animationsMap.get(play);
      const current = this.animationsMap.get(this.currentAction);

      current.fadeOut(this.fadeDuration);
      toPlay.reset().fadeIn(this.fadeDuration).play();

      this.currentAction = play;
    }

    this.mixer.update(delta);

    // calculate towards camera direction
    var angleYCameraDirection = Math.atan2(
      this.model.position.x - this.camera.position.x,
      this.model.position.z - this.camera.position.z
    );
    // diagonal movement angle offset
    var directionOffset = this.directionOffset(keysPressed);

    // rotate model
    this.rotateQuarternion.setFromAxisAngle(
      this.rotateAngle,
      angleYCameraDirection + directionOffset
    );
    this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.2);

    // calculate direction
    this.camera.getWorldDirection(this.walkDirection);
    this.walkDirection.y = 0;
    this.walkDirection.normalize();
    this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset);

    // run/walk velocity
    const velocity =
      this.currentAction == "Run" ? this.runVelocity : this.walkVelocity;

    let moveX = 0;
    let moveZ = 0;
    if (this.currentAction == "Run" || this.currentAction == "Walk") {
      // move model & camera
      moveX = this.walkDirection.x * velocity * delta;
      moveZ = this.walkDirection.z * velocity * delta;

      // this.model.position.x += moveX
      // this.model.position.z += moveZ
      this.body.position.x += moveX;
      this.body.position.z += moveZ;
    }
    this.updateCameraTarget(moveX, moveZ);

    // Jump
    if (
      keysPressed[SPACE] &&
      this.body.velocity.y <= 0.5 &&
      this.body.position.y <= 0.1
    ) {
      console.log(this.body.velocity.y);
      const impulse = new CANNON.Vec3(0, 3, 0);
      this.body.applyImpulse(impulse);
    }

    // console.log(this.body.position, this.model.position)
    this.model.position.copy(this.body.position);
    this.model.position.y -= 0.1;
    this.body.quaternion.copy(this.model.quaternion);

    this.updatePlayerNamePos();
  }

  updatePlayerNamePos() {
    this.playerName.position.set(
      this.model.position.x,
      this.model.position.y + 0.5,
      this.model.position.z
    );

    this.playerName.lookAt(this.camera.position);
  }

  updateCameraTarget(moveX, moveZ) {
    // move camera
    this.camera.position.x += moveX;
    this.camera.position.z += moveZ;

    // update camera target
    this.cameraTarget.x = this.model.position.x;
    this.cameraTarget.y = this.model.position.y + 1;
    this.cameraTarget.z = this.model.position.z;
    this.orbitControl.target = this.cameraTarget;
  }

  directionOffset(keysPressed) {
    var directionOffset = 0; // w

    if (keysPressed[W]) {
      if (keysPressed[A]) {
        directionOffset = Math.PI / 4; // w+a
      } else if (keysPressed[D]) {
        directionOffset = -Math.PI / 4; // w+d
      }
    } else if (keysPressed[S]) {
      if (keysPressed[A]) {
        directionOffset = Math.PI / 4 + Math.PI / 2; // s+a
      } else if (keysPressed[D]) {
        directionOffset = -Math.PI / 4 - Math.PI / 2; // s+d
      } else {
        directionOffset = Math.PI; // s
      }
    } else if (keysPressed[A]) {
      directionOffset = Math.PI / 2; // a
    } else if (keysPressed[D]) {
      directionOffset = -Math.PI / 2; // d
    }

    return directionOffset;
  }
}
