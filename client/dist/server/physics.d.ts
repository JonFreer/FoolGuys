import * as CANNON from 'cannon-es';
import Game from './game';
export default class Physics {
    world: CANNON.World;
    bodies: {
        [id: string]: CANNON.Body;
    };
    groundMaterial: CANNON.Material;
    slipperyMaterial: CANNON.Material;
    private game;
    constructor(game: Game, io: any);
    createPlayer(id: string): number;
}
