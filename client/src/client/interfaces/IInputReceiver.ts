// import { KeyBinding } from '../core/KeyBinding';

import { KeyBinding } from "./keybindings";

export interface IInputReceiver
{
    lastInputManager: IInputReceiver|undefined;
	actions: { [action: string]: KeyBinding };

	handleKeyboardEvent(event: KeyboardEvent, code: string, pressed: boolean): void;
	handleMouseButton(event: MouseEvent, code: string, pressed: boolean): void;
	handleMouseMove(event: MouseEvent, deltaX: number, deltaY: number): void;
	handleMouseWheel(event: WheelEvent, value: number): void;

	inputReceiverInit(): void;
	inputReceiverUpdate(timeStep: number): void;
}