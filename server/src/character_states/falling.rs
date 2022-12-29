use crate::player::Player;

use super::{character_base::CharacterState, idle::IdleState, jumpidle::JumpIdleState};

pub struct FallingState{}

impl FallingState{
  
    pub fn new() -> Self{
        Self{}
    }

    pub fn update(player: &mut Player, time_step: f32) {


        if player.on_ground_2{
                if !(player.client_move_vec.x == 0.0 && player.client_move_vec.y == 0.0) {
                    player.character_state = CharacterState::Walk;
                    // this.character.setState(new Walk(this.character));
                } else {
                    player.character_state = CharacterState::Idle(IdleState::new());
                }
         
        }
    }

}