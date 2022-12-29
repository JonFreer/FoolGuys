use crate::character_states::character_base::CharacterState::JumpIdle;
use crate::player::Player;

use super::{character_base::CharacterState, idle::IdleState};

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct JumpIdleState {
    already_jumped: bool,
    timer: f32,
}

impl JumpIdleState {
    pub fn new() -> Self {
        Self {
            already_jumped: false,
            timer: 0.0,
        }
    }

    pub fn update(player: &mut Player, time_step: f32) {
        if let JumpIdle(state) = &mut player.character_state {
            state.timer += time_step;
            // player.can_jump= false;
            if state.timer > 0.2 && !state.already_jumped {
                state.already_jumped = true;
                // player.jump();
            } else if state.timer > 0.3 && player.on_ground_2 {
                if !(player.client_move_vec.x == 0.0 && player.client_move_vec.y == 0.0) {
                    player.character_state = CharacterState::Walk;
                    // this.character.setState(new Walk(this.character));
                } else {
                    player.character_state = CharacterState::Idle(IdleState::new());
                }
            } else if state.timer > 1.0 {
                player.character_state = CharacterState::Falling
            }
        }

    }
}
