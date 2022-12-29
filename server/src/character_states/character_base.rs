use serde::{Deserialize, Serialize};

use super::{idle::IdleState, jumpidle::JumpIdleState};

#[derive(Serialize, Deserialize)]
#[derive(Clone, Debug)]
pub enum CharacterState{
    Idle(IdleState),
    Walk,
    Falling,
    JumpIdle(JumpIdleState),
    JumpWalking
}

