use serde::{Deserialize, Serialize};
use ts_rs::TS;
use super::{idle::IdleState, jumpidle::JumpIdleState};

#[ts(export)]
#[derive(Serialize, Deserialize,TS,Clone, Debug)]
pub enum CharacterState{
    Idle(IdleState),
    Walk,
    Falling,
    JumpIdle(JumpIdleState),
    JumpWalking,
    Ragdoll
}

