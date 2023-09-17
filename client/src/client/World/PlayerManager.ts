import { PlayerUpdate } from "../../../../server/bindings/PlayerUpdate";
import { Asset } from "./Asset";
import { Character } from "./Character";
import { World } from "./World";

export class PlayerManager {
  public players: { [id: string]: Character } = {};
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  public updatePlayers(updates: Record<string, PlayerUpdate>) {
    
    Object.keys(updates).forEach((p) => {
        this.updatePlayer(p, updates[p])
    });

    Object.keys(updates).forEach((id) => {
        if (updates[id] == undefined) {
            this.removePlayer(id)
        }
    })
  }

  public updatePlayer(client_id: string, update: PlayerUpdate) {
    if (!this.players[client_id]) {
      this.players[client_id] = new Character(
        update,
        this.world.assets,
        this.world
      );
    } else {
      this.players[client_id].updateCharacter(update);
      if(client_id == this.world.player_id){
        if(update.vehicle!=null){
          this.world.inputManager.setInputReceiver(this.world.inputManager.blimpReceiver)
        }else{
          this.world.inputManager.setInputReceiver(this.world.inputManager.characterReceiver)
        }
        
      }
    }
  }

  public removePlayer(id: string) {
    if (this.players[id].gltf_scene != undefined) {
      this.world.graphicsWorld.remove(
        this.players[id].gltf_scene as THREE.Group
      );
    }

    delete this.players[id];
  }
}
