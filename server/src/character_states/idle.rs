use crate::player::Player;

use super::{character_base::CharacterState, jumpidle::JumpIdleState};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[derive(Clone, Debug)]pub struct IdleState{}

impl IdleState{
    pub fn new()->Self {

        Self{}
    }

    pub fn on_input_change(player : &mut Player){

        if player.just_jumped{
            player.character_state = CharacterState::JumpIdle(JumpIdleState::new());
        }

        if  !(player.client_move_vec.x == 0.0 && player.client_move_vec.y == 0.0)  {
            player.character_state = CharacterState::Walk;
        }

    }


}