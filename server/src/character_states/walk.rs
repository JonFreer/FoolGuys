use crate::character::Character;

use super::{character_base::CharacterState, idle::IdleState, jumpidle::JumpIdleState};

pub struct WalkState{}

impl WalkState{
    // pub fn new()->Self {

    //     Self{}
    // }

    pub fn on_input_change(player : &mut Character){



        // TODO
        // if (this.character.actions.jump.justPressed)
		// {
		// 	this.character.setState(new JumpIdle(this.character));
		// }

        if player.just_jumped{
            player.character_state = CharacterState::JumpIdle(JumpIdleState::new());
        }

        if player.client_move_vec.x == 0.0 && player.client_move_vec.y == 0.0 {
            player.character_state = CharacterState::Idle(IdleState{});
        }
    }


}