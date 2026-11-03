import { STREET_BOUNDS, type StreetPosition } from "./scene";

/**
 * Screen-only companionship. The partner catches up with the Cleaner, then
 * becomes exactly stationary instead of oscillating forever around a target.
 * No independent state, commands, combat or narrative effects are introduced.
 */
export function followCompanion(
  companion: StreetPosition, cleaner: StreetPosition, facing: -1 | 1,
  deltaSeconds: number, sceneWidth: number,
): { position: StreetPosition; moving: boolean } {
  const desired = {
    x: Math.min(Math.max(cleaner.x - facing * 32, 9), sceneWidth - 9),
    y: Math.min(Math.max(cleaner.y + 3, STREET_BOUNDS.minY), STREET_BOUNDS.maxY),
  };
  const dx = desired.x - companion.x;
  const dy = desired.y - companion.y;
  const distance = Math.hypot(dx, dy);
  // This dead zone prevents a permanent one-pixel wobble while standing still.
  if (distance <= 2) return { position: desired, moving: false };
  const step = Math.min(distance, Math.min(Math.max(0, deltaSeconds), 0.05) * 72);
  if (step >= distance - 0.01) return { position: desired, moving: false };
  return {
    position: { x: companion.x + dx / distance * step, y: companion.y + dy / distance * step },
    moving: step > 0.04,
  };
}

/** Retain facing while the Cleaner walks only vertically or comes to rest. */
export function walkingFacing(previousX: number, nextX: number, current: -1 | 1): -1 | 1 {
  if (nextX - previousX > 0.15) return 1;
  if (previousX - nextX > 0.15) return -1;
  return current;
}
