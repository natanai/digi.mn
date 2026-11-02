export type StreetChoice = { id: string; text: string };
export type StreetObject = { id: string; label: string; input: string; x: number; y: number };
export type StreetPosition = { x: number; y: number };
export type StreetDirection = { x: number; y: number };
export type StreetScene = { seed: string; width: number; objects: StreetObject[] };

export const VIEW_WIDTH = 256;
export const VIEW_HEIGHT = 144;
export const WALK_SPEED = 54;
export const STREET_BOUNDS = { minY: 104, maxY: 129 } as const;

export function streetHash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

/** Narrative choices are the source of interaction text. No separate dialogue content is introduced. */
export function buildStreetScene(seed: string, choices: readonly StreetChoice[]): StreetScene {
  const distinct = new Set<string>();
  const objects = choices.filter((choice) => {
    if (!choice.text.trim() || distinct.has(choice.id)) return false;
    distinct.add(choice.id);
    return true;
  }).slice(0, 10).map((choice, index) => ({
    id: choice.id,
    label: choice.text,
    input: choice.text,
    x: 144 + index * 104 + streetHash(seed + ":" + choice.id) % 21,
    y: 109 + streetHash(choice.id + ":" + seed) % 17,
  }));
  return { seed, width: Math.max(768, objects.length * 104 + 280), objects };
}

export function moveStreet(
  position: StreetPosition,
  direction: StreetDirection,
  deltaSeconds: number,
  sceneWidth: number,
): StreetPosition {
  const length = Math.hypot(direction.x, direction.y);
  const fraction = Math.min(Math.max(0, deltaSeconds), 0.05);
  const dx = length > 0 ? direction.x / length : 0;
  const dy = length > 0 ? direction.y / length : 0;
  return {
    x: Math.max(9, Math.min(sceneWidth - 9, position.x + dx * WALK_SPEED * fraction)),
    y: Math.max(STREET_BOUNDS.minY, Math.min(STREET_BOUNDS.maxY, position.y + dy * WALK_SPEED * fraction)),
  };
}

export function nearbyStreetObject(position: StreetPosition, objects: readonly StreetObject[], radius = 29): StreetObject | null {
  let nearest: StreetObject | null = null;
  let distance = radius;
  for (const object of objects) {
    const next = Math.hypot((object.x - position.x), (object.y - position.y) * 1.6);
    if (next < distance) { nearest = object; distance = next; }
  }
  return nearest;
}

export function integerPixelScale(width: number, height: number) {
  return Math.max(1, Math.floor(Math.min(width / VIEW_WIDTH, height / VIEW_HEIGHT)));
}
