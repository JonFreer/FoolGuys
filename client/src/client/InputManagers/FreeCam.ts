import * as THREE from "three";
import { World } from "../World/World";
import { IInputReceiver } from "../interfaces/IInputReceiver";
import { KeyBinding } from "../interfaces/keybindings";
import * as Utils from '../Utils/utils';

export class FreeCam implements IInputReceiver{


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

	public movementSpeed: number;

	public upVelocity: number = 0;
	public forwardVelocity: number = 0;
	public rightVelocity: number = 0;

	public followMode: boolean = false;

    public lastInputManager: IInputReceiver | undefined;

    constructor(world: World, camera: THREE.Camera, sensitivityX: number = 1, sensitivityY: number = sensitivityX * 0.8){

        this.world = world;
		this.camera = camera;
		this.target = new THREE.Vector3();
		this.sensitivity = new THREE.Vector2(sensitivityX, sensitivityY);

		this.movementSpeed = 0.06;
		this.radius = 3;
		this.theta = 0;
		this.phi = 0;

		this.onMouseDownPosition = new THREE.Vector2();
		this.onMouseDownTheta = this.theta;
		this.onMouseDownPhi = this.phi;

        this.actions = {
			'forward': new KeyBinding('KeyW'),
			'back': new KeyBinding('KeyS'),
			'left': new KeyBinding('KeyA'),
			'right': new KeyBinding('KeyD'),
			'up': new KeyBinding('KeyE'),
			'down': new KeyBinding('KeyQ'),
			'fast': new KeyBinding('ShiftLeft'),
		};
    }
    
    public handleKeyboardEvent(event: KeyboardEvent, code: string, pressed: boolean): void{
        // Free camera
		if (code === 'KeyC' && pressed === true && event.shiftKey === true)
		{
			if (this.lastInputManager !== undefined)
			{
                console.log(this.lastInputManager)
				this.world.inputManager.setInputReceiver(this.lastInputManager);
				this.lastInputManager = undefined;
			}
		}
		else
		{
            for (const action in this.actions) {
                if (this.actions.hasOwnProperty(action)) {
                    const binding = this.actions[action];
                    if (binding.eventCodes.includes(code))
                    {
                        binding.isPressed = pressed;
                    }
                }
            }
        }
    }

	public handleMouseButton(event: MouseEvent, code: string, pressed: boolean){

    }

    public move(deltaX: number, deltaY: number): void
	{
		this.theta -= deltaX * (this.sensitivity.x / 2);
		this.theta %= 360;
		this.phi += deltaY * (this.sensitivity.y / 2);
		this.phi = Math.min(85, Math.max(-85, this.phi));
	}


	public handleMouseMove(event: MouseEvent, deltaX: number, deltaY: number): void{
        this.move(deltaX, deltaY);
    }

	public handleMouseWheel(event: WheelEvent, value: number): void{

    }

	public inputReceiverInit(): void{

    }

	public inputReceiverUpdate(timeStep: number): void{
        
        // Set fly speed
		let speed = this.movementSpeed * (this.actions.fast.isPressed ? timeStep * 600 : timeStep * 60);

		const up = Utils.getUp(this.camera);
		const right = Utils.getRight(this.camera);
		const forward = Utils.getBack(this.camera);

		this.upVelocity = THREE.MathUtils.lerp(this.upVelocity, +this.actions.up.isPressed - +this.actions.down.isPressed, 0.3);
		this.forwardVelocity = THREE.MathUtils.lerp(this.forwardVelocity, +this.actions.forward.isPressed - +this.actions.back.isPressed, 0.3);
		this.rightVelocity = THREE.MathUtils.lerp(this.rightVelocity, +this.actions.right.isPressed - +this.actions.left.isPressed, 0.3);

		this.target.add(up.multiplyScalar(speed * this.upVelocity));
		this.target.add(forward.multiplyScalar(speed * this.forwardVelocity));
		this.target.add(right.multiplyScalar(speed * this.rightVelocity));

        this.update(timeStep)
    }

    public update(timeScale: number): void
        {
			this.radius = THREE.MathUtils.lerp(this.radius, this.targetRadius, 0.1);
	
			this.camera.position.x = this.target.x + this.radius * Math.sin(this.theta * Math.PI / 180) * Math.cos(this.phi * Math.PI / 180);
			this.camera.position.y = this.target.y + this.radius * Math.sin(this.phi * Math.PI / 180);
			this.camera.position.z = this.target.z + this.radius * Math.cos(this.theta * Math.PI / 180) * Math.cos(this.phi * Math.PI / 180);
			this.camera.updateMatrix();
			this.camera.lookAt(this.target);
		}
    
    
}