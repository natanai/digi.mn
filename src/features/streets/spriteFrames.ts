/**
 * Pixel-art atlas geometry is engine-independent so Node tests can validate
 * every crop/flip without loading DOM or depending on Chromium.
 */
export const STREET_ACTOR_FILES = {
  cleaner: { file: "cleaner-walk.png", width: 30, height: 52, frames: 4 },
  partner: { file: "partner-walk.png", width: 42, height: 30, frames: 4 },
} as const;

export function actorFrame(elapsed: number, moving: boolean, frames = 4) {
  if (!moving || !Number.isFinite(elapsed) || frames < 1) return 0;
  return Math.floor(Math.max(0, elapsed) / 165) % frames;
}

export function actorFrameGeometry(
  atlas: { frameWidth: number; frameHeight: number; frames: number },
  x: number, groundY: number, frame: number, facing: -1 | 1,
) {
  const width = atlas.frameWidth;
  const height = atlas.frameHeight;
  const index = Math.max(0, Math.min(atlas.frames - 1, Math.trunc(frame)));
  const px = Math.round(x);
  return {
    sourceX: index * width, sourceY: 0, width, height,
    destinationX: facing < 0 ? -Math.floor(width / 2) : px - Math.floor(width / 2),
    destinationY: Math.round(groundY) - height,
    mirrorOriginX: facing < 0 ? px : null,
  };
}
