import { describe, expect, it } from "vitest";
import { buildStreetScene, VIEW_HEIGHT, VIEW_WIDTH } from "./scene";
import { canvasStreetPoint, hitStreetObject, resolveStreetPointer, streetCamera, walkToStreetPoint } from "./pointer";

const scene = buildStreetScene("demo", [
  { id: "vendor", text: "ask vendor", kind: "person", x: 140, y: 114 },
  { id: "crate", text: "examine crate", kind: "object", x: 275, y: 114 },
  { id: "door", text: "enter alley", kind: "entrance", x: 430, y: 114 },
]);
const camera = (x: number) => streetCamera(scene.width, x);

describe("pixel-street pointer navigation", () => {
  it("converts a CSS-scaled canvas click into logical pixel coordinates", () => {
    const rect = { left: 100, top: 50, width: VIEW_WIDTH * 3, height: VIEW_HEIGHT * 3 };
    expect(canvasStreetPoint(100 + 140 * 3, 50 + 97 * 3, rect)).toEqual({ x: 140, y: 97 });
    expect(canvasStreetPoint(100 - 1, 100, rect)).toBeNull();
    expect(canvasStreetPoint(100 + VIEW_WIDTH * 3, 100, rect)).toBeNull();
    expect(canvasStreetPoint(160, 110, { ...rect, width: 0 })).toBeNull();
  });
  it("clicks a rendered person without needing the keyboard or standing beside them", () => {
    const player = { x: 56, y: 114 };
    const hit = resolveStreetPointer({ x: 140, y: 98 }, scene, player);
    expect(hit).toEqual({ kind: "interact", objectId: "vendor", position: { x: 140, y: 114 } });
  });
  it("clicks a door where the doorway is actually drawn, even above the walkable ground", () => {
    const player = { x: 360, y: 114 };
    const projected = 430 - camera(player.x);
    const hit = resolveStreetPointer({ x: projected, y: 82 }, scene, player);
    expect(hit?.kind).toBe("interact");
    expect(hit).toMatchObject({ objectId: "door" });
  });
  it("tracks the scrolling camera, rather than treating screen x as a world location", () => {
    const player = { x: 260, y: 114 };
    const projected = 275 - camera(player.x);
    expect(hitStreetObject({ x: projected, y: 108 }, scene, camera(player.x))?.id).toBe("crate");
    expect(resolveStreetPointer({ x: projected, y: 108 }, scene, player))
      .toMatchObject({ kind: "interact", objectId: "crate" });
  });
  it("ignores clicks on noninteractable sky or buildings but permits pavement movement", () => {
    const player = { x: 56, y: 114 };
    expect(resolveStreetPointer({ x: 45, y: 32 }, scene, player)).toBeNull();
    expect(resolveStreetPointer({ x: 60, y: 110 }, scene, player))
      .toEqual({ kind: "walk", position: { x: 60, y: 110 } });
    expect(resolveStreetPointer({ x: 60, y: 140 }, scene, player))
      .toMatchObject({ kind: "walk", position: { y: 129 } });
  });
  it("walks smoothly with capped delta, clamps at destination, and stops instead of overshooting", () => {
    let position = { x: 56, y: 114 };
    const target = { x: 145, y: 121 };
    let arrived = false;
    for (let i = 0; i < 200; i++) {
      const result = walkToStreetPoint(position, target, 1 / 60, scene.width);
      position = result.position;
      arrived = result.arrived;
      if (arrived) break;
    }
    expect(arrived).toBe(true);
    expect(position).toEqual(target);
    expect(walkToStreetPoint(target, target, 0.016, scene.width).arrived).toBe(true);
    const oneFrame = walkToStreetPoint({x: 56,y:114}, {x:300,y:114}, 10, scene.width);
    expect(oneFrame.position.x).toBeLessThan(60);
    expect(oneFrame.arrived).toBe(false);
  });
  it("ignores invalid scripted destinations", () => {
    const initial = { x: 50, y: 110 };
    expect(walkToStreetPoint(initial, {x:NaN,y:120}, .01, scene.width)).toEqual({
      position:initial,arrived:true,
    });
  });
});
