import { STREET_BOUNDS, VIEW_HEIGHT, VIEW_WIDTH, WALK_SPEED, moveStreet,
  type StreetObject, type StreetPosition, type StreetScene } from "./scene";

export type StreetPointerTarget =
  | { kind: "walk"; position: StreetPosition }
  | { kind: "interact"; objectId: string; position: StreetPosition };

export function streetCamera(sceneWidth: number, playerX: number) {
  return Math.max(0, Math.min(Math.max(0, sceneWidth - VIEW_WIDTH), Math.round(playerX - 94)));
}

/** Return logical canvas coordinates only for pointer hits on the rendered canvas. */
export function canvasStreetPoint(
  clientX: number, clientY: number,
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">,
): StreetPosition | null {
  if (rect.width <= 0 || rect.height <= 0) return null;
  const x = (clientX - rect.left) / rect.width * VIEW_WIDTH;
  const y = (clientY - rect.top) / rect.height * VIEW_HEIGHT;
  if (x < 0 || x >= VIEW_WIDTH || y < 0 || y >= VIEW_HEIGHT) return null;
  return { x, y };
}

function hitBounds(object: StreetObject) {
  if (object.kind === "entrance") return { left: object.x - 15, right: object.x + 15, top: 65, bottom: 110 };
  if (object.kind === "person") return {
    left: object.x - 12, right: object.x + 12, top: object.y - 27, bottom: object.y + 10,
  };
  return { left: object.x - 13, right: object.x + 13, top: object.y - 18, bottom: object.y + 11 };
}

/** Pixel hit-testing is separate from choosing an authored Narrative interaction. */
export function hitStreetObject(point: StreetPosition, scene: StreetScene, camera: number): StreetObject | null {
  const x = point.x + camera;
  const matches = scene.objects.filter((object) => {
    const box = hitBounds(object);
    return x >= box.left && x <= box.right && point.y >= box.top && point.y <= box.bottom;
  });
  // When objects overlap, prefer the one closest to the actual click.
  matches.sort((a, b) => Math.hypot(a.x - x, a.y - point.y) - Math.hypot(b.x - x, b.y - point.y));
  return matches[0] ?? null;
}

export function resolveStreetPointer(
  point: StreetPosition, scene: StreetScene, player: StreetPosition,
): StreetPointerTarget | null {
  const camera = streetCamera(scene.width, player.x);
  const hit = hitStreetObject(point, scene, camera);
  if (hit) return {
    kind: "interact", objectId: hit.id,
    position: { x: hit.x, y: hit.y },
  };
  // Sky, roofs, windows and upper building facades are scenery, not walkable.
  if (point.y < 91) return null;
  return {
    kind: "walk",
    position: {
      x: Math.max(9, Math.min(scene.width - 9, point.x + camera)),
      y: Math.max(STREET_BOUNDS.minY, Math.min(STREET_BOUNDS.maxY, point.y)),
    },
  };
}

/** Motion is a view-only animation; actual transitions remain owned by Narrative. */
export function walkToStreetPoint(
  position: StreetPosition, destination: StreetPosition, delta: number, sceneWidth: number,
): { position: StreetPosition; arrived: boolean } {
  if (!Number.isFinite(destination.x) || !Number.isFinite(destination.y)) {
    return { position, arrived: true };
  }
  const dx = destination.x - position.x, dy = destination.y - position.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.8) return { position: destination, arrived: true };
  const travel = Math.min(Math.max(0, delta), 0.05) * WALK_SPEED;
  if (travel >= distance) return { position: destination, arrived: true };
  const next = moveStreet(position, { x: dx, y: dy }, delta, sceneWidth);
  return { position: next, arrived: Math.hypot(destination.x - next.x, destination.y - next.y) < 0.8 };
}
