export default class Player {
    bodyId: number;
    body: any;
    screenName: string;
    canJump: boolean;
    keyMap: {
        [id: string]: boolean;
    };
    p: {
        x: number;
        y: number;
        z: number;
    };
    q: {
        x: number;
        y: number;
        z: number;
        w: number;
    };
    t: number;
    constructor();
    resetPlayer(): void;
    getInfo(): {
        screenName: string;
        p: any;
        q: any;
    };
}
