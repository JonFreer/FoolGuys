use crate::player::Player;

use super::{character_base::CharacterState, idle::IdleState};

pub struct FallingState{}

impl FallingState{
  
    pub fn new() -> Self{
        Self{}
    }

    pub fn update(player: &mut Player, time_step: f32) {


        if player.on_ground{
                if !(player.client_move_vec.x == 0.0 && player.client_move_vec.y == 0.0) {
                    player.character_state = CharacterState::Walk;
                } else {
                    player.character_state = CharacterState::Idle(IdleState::new());
                }
         
        }
    }

}