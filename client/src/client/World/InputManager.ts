// import { World } from '../world/World';
import {World} from './World'
import { IInputReceiver } from '../interfaces/IInputReceiver';
import { FreeCam } from '../InputManagers/FreeCam';
import { Character } from '../InputManagers/Character';
import { BlimpReciever } from '../InputManagers/BlimpReciever';
// import { EntityType } from '../enums/EntityType';
// import { IUpdatable } from '../interfaces/IUpdatable';

export class InputManager 
{
	public updateOrder: number = 3;

	public world: World;
	public domElement: any;
	public pointerLock: any;
	public isLocked: boolean;
	public inputReceiver: IInputReceiver | undefined;

	public freeCamReceiver: FreeCam;
	public characterReceiver: Character;
	public blimpReceiver: BlimpReciever;

	public boundOnMouseDown: (evt: any) => void;
	public boundOnMouseMove: (evt: any) => void;
	public boundOnMouseUp: (evt: any) => void;
	public boundOnMouseWheelMove: (evt: any) => void;
	public boundOnPointerlockChange: (evt: any) => void;
	public boundOnPointerlockError: (evt: any) => void;
	public boundOnKeyDown: (evt: any) => void;
	public boundOnKeyUp: (evt: any) => void;
	
	constructor(world: World, domElement: HTMLElement)
	{
		this.world = world;
		this.pointerLock = true;//world.params.Pointer_Lock;
		this.domElement = domElement || document.body;
		this.isLocked = false;
		
		// Bindings for later event use
		// Mouse
		this.boundOnMouseDown = (evt) => this.onMouseDown(evt);
		this.boundOnMouseMove = (evt) => this.onMouseMove(evt);
		this.boundOnMouseUp = (evt) => this.onMouseUp(evt);
		this.boundOnMouseWheelMove = (evt) => this.onMouseWheelMove(evt);

		// Pointer lock
		this.boundOnPointerlockChange = (evt) => this.onPointerlockChange(evt);
		this.boundOnPointerlockError = (evt) => this.onPointerlockError(evt);

		// Keys
		this.boundOnKeyDown = (evt) => this.onKeyDown(evt);
		this.boundOnKeyUp = (evt) => this.onKeyUp(evt);

		// Init event listeners
		// Mouse
		this.domElement.addEventListener('mousedown', this.boundOnMouseDown, false);
		document.addEventListener('wheel', this.boundOnMouseWheelMove, false);
		document.addEventListener('pointerlockchange', this.boundOnPointerlockChange, false);
		document.addEventListener('pointerlockerror', this.boundOnPointerlockError, false);
		
		// Keys
		document.addEventListener('keydown', this.boundOnKeyDown, false);
		document.addEventListener('keyup', this.boundOnKeyUp, false);

		// this.inputReceiver = new FreeCam

		this.freeCamReceiver = new FreeCam(world,world.camera);
		this.characterReceiver = new Character(world,world.camera,world.socket);
		this.blimpReceiver = new BlimpReciever(world,world.camera,world.socket);
		// world.registerUpdatable(this);
	}

	public setRadius(value: number, instantly: boolean = false): void
	{
		this.characterReceiver.setRadius(value,instantly);
		this.characterReceiver.setRadius(value,instantly);
	}

	public update(timestep: number, unscaledTimeStep: number,world:World,camera:THREE.Camera): void
	{
		if (this.inputReceiver === undefined && this.world !== undefined)
		{
			this.setInputReceiver(this.characterReceiver);
		}

		this.inputReceiver?.inputReceiverUpdate(unscaledTimeStep);
	}

	public setInputReceiver(receiver: IInputReceiver): void
	{	
		if(receiver!= this.inputReceiver){
			this.inputReceiver = receiver;
			this.inputReceiver.inputReceiverInit();
		}
		// this.inputReceiver.inputReceiverInit();
	}

	public setPointerLock(enabled: boolean): void
	{
		this.pointerLock = enabled;
	}

	public onPointerlockChange(event: MouseEvent): void
	{
		if (document.pointerLockElement === this.domElement)
		{
			this.domElement.addEventListener('mousemove', this.boundOnMouseMove, false);
			this.domElement.addEventListener('mouseup', this.boundOnMouseUp, false);
			this.isLocked = true;
		}
		else
		{
			this.domElement.removeEventListener('mousemove', this.boundOnMouseMove, false);
			this.domElement.removeEventListener('mouseup', this.boundOnMouseUp, false);
			this.isLocked = false;
		}
	}

	public onPointerlockError(event: MouseEvent): void
	{
		console.error('PointerLockControls: Unable to use Pointer Lock API');
	}

	public onMouseDown(event: MouseEvent): void
	{
		if (this.pointerLock)
		{
			this.domElement.requestPointerLock();
		}
		else
		{
			this.domElement.addEventListener('mousemove', this.boundOnMouseMove, false);
			this.domElement.addEventListener('mouseup', this.boundOnMouseUp, false);
		}

		if (this.inputReceiver !== undefined)
		{
			this.inputReceiver.handleMouseButton(event, 'mouse' + event.button, true);
		}
	}

	public onMouseMove(event: MouseEvent): void
	{	
		if (this.inputReceiver !== undefined)
		{
			this.inputReceiver.handleMouseMove(event, event.movementX, event.movementY);
		}
	}

	public onMouseUp(event: MouseEvent): void
	{
		if (!this.pointerLock)
		{
			this.domElement.removeEventListener('mousemove', this.boundOnMouseMove, false);
			this.domElement.removeEventListener('mouseup', this.boundOnMouseUp, false);
		}

		if (this.inputReceiver !== undefined)
		{
			this.inputReceiver.handleMouseButton(event, 'mouse' + event.button, false);
		}
	}

	public onKeyDown(event: KeyboardEvent): void
	{
		if (this.inputReceiver !== undefined)
		{
			this.inputReceiver.handleKeyboardEvent(event, event.code, true);
		}
	}

	public onKeyUp(event: KeyboardEvent): void
	{
		if (this.inputReceiver !== undefined)
		{
			this.inputReceiver.handleKeyboardEvent(event, event.code, false);
		}
	}

	public onMouseWheelMove(event: WheelEvent): void
	{
		if (this.inputReceiver !== undefined)
		{
			this.inputReceiver.handleMouseWheel(event, event.deltaY);
		}
	}
}