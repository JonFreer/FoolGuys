import * as THREE from "three";
import { World } from "../World/World";
import { IInputReceiver } from "../interfaces/IInputReceiver";
import { KeyBinding } from "../interfaces/keybindings";
import { Vector2 } from "three";

export interface VehicleInput {
  up: boolean;
}

export class BlimpReciever implements IInputReceiver {
  public lastInputManager: IInputReceiver | undefined;
  public actions: { [action: string]: KeyBinding };
  public world: World;
  public camera: THREE.Camera;
  public target: THREE.Vector3 = new THREE.Vector3();
  public socket: WebSocket;
  public radius: number = 30;
  public theta: number = 0;
  public phi: number = 0;
  public sensitivity: THREE.Vector2;
  public targetRadius: number = 30;

  constructor(
    world: World,
    camera: THREE.Camera,
    socket: WebSocket,
    sensitivityX: number = 1,
    sensitivityY: number = sensitivityX * 0.8
  ) {
    this.world = world;
    this.camera = camera;
    this.socket = socket;
    this.sensitivity = new THREE.Vector2(sensitivityX, sensitivityY);

    this.actions = {
      forward: new KeyBinding("KeyW"),
      backward: new KeyBinding("KeyS"),
      left: new KeyBinding("KeyA"),
      right: new KeyBinding("KeyD"),
      up: new KeyBinding("KeyE"),
      down: new KeyBinding("KeyQ"),
      enter_passenger: new KeyBinding("KeyG"),
    };
  }

  public onInputChange(): void {

    let movement = new Vector2(0, 0);

    if (this.actions["forward"].isPressed) {
      movement.y += 1;
    }
    if (this.actions["backward"].isPressed) {
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
        "update_move",
        {
          moveVector: movement,
        },
      ])
    );

    this.socket.send(
      JSON.stringify([
        "update_blimp",
        {
          actions: this.actions,
        },
      ])
    );

    console.log(this.actions)


  }

  public setRadius(value: number, instantly: boolean = false): void {
    this.targetRadius = Math.max(0.001, value);
    if (instantly === true) {
      this.radius = value;
    }
  }

  public move(deltaX: number, deltaY: number): void {
    this.theta -= deltaX * (this.sensitivity.x / 2);
    this.theta %= 360;
    this.phi += deltaY * (this.sensitivity.y / 2);
    this.phi = Math.min(85, Math.max(-85, this.phi));
  }

  public triggerAction(actionName: string, value: boolean): void {
    // Get action and set it's parameters
    let action = this.actions[actionName];
    console.log("aaaa")
    if (action.isPressed !== value) {
      // Set value
      action.isPressed = value;

      // Reset the 'just' attributes
      action.justPressed = false;
      action.justReleased = false;

      // Set the 'just' attributes
      if (value) action.justPressed = true;
      else action.justReleased = true;

      this.onInputChange();

      // Reset the 'just' attributes
      action.justPressed = false;
      action.justReleased = false;
    }
  }

  handleKeyboardEvent(
    event: KeyboardEvent,
    code: string,
    pressed: boolean
  ): void {
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
        // console.log(action)
        if (this.actions.hasOwnProperty(action)) {
          const binding = this.actions[action];
          console.log(binding,code)
          if (binding.eventCodes.includes(code)) {
            // binding.isPressed = pressed;
            this.triggerAction(action, pressed);
          }
        }
      }
    }
  }
  handleMouseButton(event: MouseEvent, code: string, pressed: boolean): void {
    // throw new Error("Method not implemented.");
  }
  handleMouseMove(event: MouseEvent, deltaX: number, deltaY: number): void {
    this.move(deltaX, deltaY);
    // throw new Error("Method not implemented.");
  }
  handleMouseWheel(event: WheelEvent, value: number): void {
    // throw new Error("Method not implemented.");
  }
  inputReceiverInit(): void {
    // throw new Error("Method not implemented.");
    this.actions = {
      forward: new KeyBinding("KeyW"),
      backward: new KeyBinding("KeyS"),
      left: new KeyBinding("KeyA"),
      right: new KeyBinding("KeyD"),
      up: new KeyBinding("KeyE"),
      down: new KeyBinding("KeyQ"),
      enter_passenger: new KeyBinding("KeyG"),
    };
    
  }
  inputReceiverUpdate(timeStep: number): void {
    // throw new Error("Method not implemented.");

    let vehicle_name =
      this.world.playerManager.players[this.world.player_id].vehicle;

    if (vehicle_name != null) {
      let vehicle = this.world.vehicles.vehicles[vehicle_name.toString()];
      this.target = vehicle.object.position;
      this.radius = THREE.MathUtils.lerp(this.radius, this.targetRadius, 0.1);

      // this.radius = 5.0;
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

        // let old_view = this.viewVector;
        // this.viewVector = new THREE.Vector3().subVectors(
        //   this.target,
        //   this.world.camera.position
        // );
        // this.viewVector = this.viewVector.normalize();
    }


  }
}
