export type StreetChoice = { id: string; text: string; kind: "person" | "object" | "entrance"; x: number; y: number; entityName?: string };
export type StreetObject = { id: string; label: string; input: string; kind: StreetChoice["kind"]; x: number; y: number };
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

/** Positions belong to authored interactions. The seed varies scenery, never who/what an interaction is. */
export function buildStreetScene(seed: string, choices: readonly StreetChoice[]): StreetScene {
  const distinct = new Set<string>();
  const objects = choices.filter((choice) => {
    if (!choice.text.trim() || distinct.has(choice.id)) return false;
    distinct.add(choice.id);
    return Number.isInteger(choice.x) && choice.x >= 16 && choice.x <= 4096
      && Number.isInteger(choice.y) && choice.y >= STREET_BOUNDS.minY && choice.y <= STREET_BOUNDS.maxY;
  }).map((choice) => ({
    id: choice.id,
    label: choice.entityName?.trim() || choice.text,
    input: choice.text,
    kind: choice.kind,
    x: choice.x,
    y: choice.y,
  }));
  return { seed, width: Math.max(768, ...objects.map((object) => object.x + 160)), objects };
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
