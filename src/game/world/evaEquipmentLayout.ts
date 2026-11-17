export const EVA_EQUIPMENT_MODEL_URL = '/models/cruz-del-sur-eva-full.glb'

/** Solid equipment locker; all dimensions include its structural surround. */
export const EVA_ALCOVE = {
  centerX: -2.17,
  width: 1.16,
  height: 2.64,
  frontZ: -0.98,
  frameZ: -0.3,
  backZ: 0.02,
  floorY: 0.18,
  jamb: 0.075,
} as const

/** Coordinates relative to the rear outfitting wall, in runtime metres. */
export const EVA_EQUIPMENT_LAYOUT = {
  position: [-2.17, 0.18, -0.46] as const,
  colliderPosition: [
    EVA_ALCOVE.centerX,
    EVA_ALCOVE.height / 2,
    (EVA_ALCOVE.frontZ + EVA_ALCOVE.backZ) / 2,
  ] as const,
  colliderHalfSize: [
    EVA_ALCOVE.width / 2,
    EVA_ALCOVE.height / 2,
    (EVA_ALCOVE.backZ - EVA_ALCOVE.frontZ) / 2,
  ] as const,
}
