// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.
import type { CharacterState } from "./CharacterState";
import type { Colour } from "./Colour";
import type { Quat } from "./Quat";
import type { Translation } from "./Translation";
import type { Vec3 } from "./Vec3";

export interface PlayerUpdate { name: string, p: Vec3, q: Quat, colour: Colour, state: CharacterState, dir: Vec3, is_ragdoll: boolean, ragdoll_info: Record<string, Translation>, camera_distance: number, }