import { ENTRY_DOCKING_DEPTH } from '../world/entryLayout'

/** Edge-triggered intent: a held key never queues another jump on landing. */
export class JumpInput {
  private held = false
  private queued = false

  press(repeat: boolean) {
    if (!repeat && !this.held) this.queued = true
    this.held = true
  }

  release() {
    this.held = false
  }

  clear() {
    this.held = false
    this.queued = false
  }

  takeRequest() {
    const requested = this.queued
    this.queued = false
    return requested
  }
}

export const PLAYER_CAPSULE_HALF_HEIGHT = 0.65
export const PLAYER_CAPSULE_RADIUS = 0.3
export const PLAYER_EYE_OFFSET = 0.75
export const PLAYER_SPAWN_Y = 1
export const PLAYER_SPAWN_POSITION = [
  0,
  PLAYER_SPAWN_Y,
  ENTRY_DOCKING_DEPTH - 1.2,
] as const
export const JUMP_SPEED = 4
