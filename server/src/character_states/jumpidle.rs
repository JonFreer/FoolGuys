use crate::{character_states::character_base::CharacterState::JumpIdle, character::Character};
use ts_rs::TS;
use super::{character_base::CharacterState, idle::IdleState};

use serde::{Deserialize, Serialize};

#[ts(export)]
#[derive(Serialize, Deserialize, Clone, Debug,TS)]
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

    pub fn update(player: &mut Character, time_step: f32) {
        if let JumpIdle(state) = &mut player.character_state {
            state.timer += time_step;
            // player.can_jump= false;
            if state.timer > 0.2 && !state.already_jumped {
                
                state.already_jumped = true;
                // player.jump();

            } else if state.timer > 0.3 && player.on_ground {
                if !(player.client_move_vec.x == 0.0 && player.client_move_vec.y == 0.0) {
                    player.character_state = CharacterState::Walk;
                } else {
                    player.character_state = CharacterState::Idle(IdleState::new());
                }
            } else if state.timer > 1.0 {
                player.character_state = CharacterState::Falling
            }
        }

    }
}
