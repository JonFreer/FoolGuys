import Physics from './physics';
import Player from './player';
export default class Game {
    players: {
        [id: string]: Player;
    };
    physics: Physics;
    private playerCount;
    constructor(io: any);
    loadScene(): void;
}
