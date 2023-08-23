import * as THREE from "three";
import { World } from "../World/World";
import { IInputReceiver } from "../interfaces/IInputReceiver";
import { KeyBinding } from "../interfaces/keybindings";
import * as Utils from "../Utils/utils";
import { FreeCam } from "./FreeCam";
import { Vector2, Vector3 } from "three";

export class Character implements IInputReceiver {
  public actions: { [action: string]: KeyBinding };
  public updateOrder: number = 4;

  public world: World;
  public camera: THREE.Camera;
  public target: THREE.Vector3;
  public sensitivity: THREE.Vector2;
  public radius: number = 1;
  public theta: number;
  public phi: number;
  public onMouseDownPosition: THREE.Vector2;
  public onMouseDownTheta: any;
  public onMouseDownPhi: any;
  public targetRadius: number = 1;

  public socket: WebSocket;

  public movementSpeed: number;

  public upVelocity: number = 0;
  public forwardVelocity: number = 0;
  public rightVelocity: number = 0;

  // public followMode: boolean = false;
  public lastInputManager: IInputReceiver | undefined;

  public viewVector: Vector3 = new Vector3();

  constructor(
    world: World,
    camera: THREE.Camera,
    socket: WebSocket,
    sensitivityX: number = 1,
    sensitivityY: number = sensitivityX * 0.8
  ) {
    this.world = world;
    this.camera = camera;
    this.target = new THREE.Vector3();
    this.sensitivity = new THREE.Vector2(sensitivityX, sensitivityY);
    this.socket = socket;

    this.movementSpeed = 0.06;
    this.radius = 3;
    this.theta = 0;
    this.phi = 0;

    this.onMouseDownPosition = new THREE.Vector2();
    this.onMouseDownTheta = this.theta;
    this.onMouseDownPhi = this.phi;

    // Actions
    this.actions = {
      up: new KeyBinding("KeyW"),
      down: new KeyBinding("KeyS"),
      left: new KeyBinding("KeyA"),
      right: new KeyBinding("KeyD"),
      run: new KeyBinding("ShiftLeft"),
      jump: new KeyBinding("Space"),
      use: new KeyBinding("KeyE"),
      enter: new KeyBinding("KeyF"),
      enter_passenger: new KeyBinding("KeyG"),
      seat_switch: new KeyBinding("KeyX"),
      primary: new KeyBinding("Mouse0"),
      secondary: new KeyBinding("Mouse1"),
      throw: new KeyBinding("KeyP"),
      ragdoll: new KeyBinding("KeyO"),
    };
  }

  public setRadius(value: number, instantly: boolean = false): void {
    this.targetRadius = Math.max(0.001, value);
    if (instantly === true) {
      this.radius = value;
    }
  }

  public handleKeyboardEvent(
    event: KeyboardEvent,
    code: string,
    pressed: boolean
  ): void {
    // Free camera
    if (code === "KeyC" && pressed === true && event.shiftKey === true) {
      this.world.inputManager.setInputReceiver(
        this.world.inputManager.freeCamReceiver
      );
      if (this.world.inputManager.inputReceiver != undefined) {
        this.world.inputManager.inputReceiver.lastInputManager = this;
        this.world.inputManager.freeCamReceiver.target =
          this.camera.position.clone();
      }
    } else {
      for (const action in this.actions) {
        if (this.actions.hasOwnProperty(action)) {
          const binding = this.actions[action];
          if (binding.eventCodes.includes(code)) {
            // binding.isPressed = pressed;
            this.triggerAction(action, pressed);
          }
        }
      }
    }
  }

  public triggerAction(actionName: string, value: boolean): void {
    // Get action and set it's parameters
    let action = this.actions[actionName];

    if (action.isPressed !== value) {
      // Set value
      action.isPressed = value;

      // Reset the 'just' attributes

      // Set the 'just' attributes
      if (value && action.justPressed) {
        action.justPressed = false;
        action.justReleased = false;
      } else if (value && !action.justPressed) {
        action.justPressed = true;
        action.justReleased = false;
      }

      if (!value && action.justReleased) {
        action.justReleased = false;
        action.justPressed = false;
      } else if (!value && !action.justReleased) {
        action.justPressed = false;
        action.justReleased = true;
      }
    } else {
      action.justPressed = false;
      action.justReleased = false;
    }

    this.handleAction(actionName, action);
  }

  public handleAction(actionName: string, action: KeyBinding) {
    console.log("handleAction", action);
    if (actionName == "throw" && action.justPressed) {
      this.socket.send(JSON.stringify(["throw", {}]));
    }
    if (actionName == "jump" && action.justPressed) {
      this.socket.send(JSON.stringify(["update_jump", {}]));
    }
    if (actionName == "ragdoll" && action.justPressed) {
      this.socket.send(JSON.stringify(["is_ragdoll", {}]));
    }

    let movement = new Vector2(0, 0);

    if (this.actions["up"].isPressed) {
      movement.y += 1;
    }
    if (this.actions["down"].isPressed) {
      movement.y -= 1;
    }
    if (this.actions["left"].isPressed) {
      movement.x += 1;
    }
    if (this.actions["right"].isPressed) {
      movement.x -= 1;
    }

    this.socket.send(
      JSON.stringify([
        "update",
        {
          t: Date.now(),
          moveVector: movement,
          keyMap: {},
          viewVector: this.viewVector,
        },
      ])
    );
  }

  public handleMouseButton(event: MouseEvent, code: string, pressed: boolean) {}

  public move(deltaX: number, deltaY: number): void {
    this.theta -= deltaX * (this.sensitivity.x / 2);
    this.theta %= 360;
    this.phi += deltaY * (this.sensitivity.y / 2);
    this.phi = Math.min(85, Math.max(-85, this.phi));
  }

  public handleMouseMove(
    event: MouseEvent,
    deltaX: number,
    deltaY: number
  ): void {
    this.move(deltaX, deltaY);
  }

  public handleMouseWheel(event: WheelEvent, value: number): void {}

  public inputReceiverInit(): void {}

  public inputReceiverUpdate(timeStep: number): void {
    // Set fly speed
    // let speed = this.movementSpeed * (this.actions.fast.isPressed ? timeStep * 600 : timeStep * 60);

    // const up = Utils.getUp(this.camera);
    // const right = Utils.getRight(this.camera);
    // const forward = Utils.getBack(this.camera);

    // this.upVelocity = THREE.MathUtils.lerp(this.upVelocity, +this.actions.up.isPressed - +this.actions.down.isPressed, 0.3);
    // this.forwardVelocity = THREE.MathUtils.lerp(this.forwardVelocity, +this.actions.forward.isPressed - +this.actions.back.isPressed, 0.3);
    // this.rightVelocity = THREE.MathUtils.lerp(this.rightVelocity, +this.actions.right.isPressed - +this.actions.left.isPressed, 0.3);

    // this.target.add(up.multiplyScalar(speed * this.upVelocity));
    // this.target.add(forward.multiplyScalar(speed * this.forwardVelocity));
    // this.target.add(right.multiplyScalar(speed * this.rightVelocity));

    this.update(timeStep);
  }

  public update(timeScale: number): void {
    this.target =
      this.world.playerManager.players[this.world.player_id].get_position();
    this.radius = THREE.MathUtils.lerp(this.radius, this.targetRadius, 0.1);

    this.camera.position.x =
      this.target.x +
      this.radius *
        Math.sin((this.theta * Math.PI) / 180) *
        Math.cos((this.phi * Math.PI) / 180);
    this.camera.position.y =
      this.target.y + this.radius * Math.sin((this.phi * Math.PI) / 180);
    this.camera.position.z =
      this.target.z +
      this.radius *
        Math.cos((this.theta * Math.PI) / 180) *
        Math.cos((this.phi * Math.PI) / 180);
    this.camera.updateMatrix();
    this.camera.lookAt(this.target);

    let old_view = this.viewVector;
    this.viewVector = new THREE.Vector3().subVectors(
      this.target,
      this.world.camera.position
    );
    this.viewVector = this.viewVector.normalize();

    if (old_view !== this.viewVector) {
      this.socket.send(
        JSON.stringify([
          "update_view",
          {
            viewVector: this.viewVector,
          },
        ])
      );
    }
  }
}
