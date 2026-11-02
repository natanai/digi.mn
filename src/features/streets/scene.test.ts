import { describe, expect, it } from "vitest";
import { buildStreetScene, integerPixelScale, moveStreet, nearbyStreetObject } from "./scene";

describe("authored street scenes", () => {
  const inputs = [
    { id: "person", text: "speak with the cleaner", x: 145, y: 110, kind: "person" as const, entityName: "Cleaner" },
    { id: "door", text: "enter the clinic", x: 302, y: 114, kind: "entrance" as const, entityName: "Clinic" },
    { id: "object", text: "examine the Sapotama", x: 500, y: 118, kind: "object" as const },
  ];

  it("uses authored coordinates and semantic identities, not randomized interaction positions", () => {
    const one = buildStreetScene("seed", inputs);
    const another = buildStreetScene("different", inputs);
    expect(one.objects).toEqual(another.objects);
    expect(one.objects.map((object) => object.label)).toEqual(["Cleaner", "Clinic", "examine the Sapotama"]);
    expect(one.objects.map((object) => object.kind)).toEqual(["person", "entrance", "object"]);
    expect(one.objects.map((object) => object.input)).toEqual(inputs.map((choice) => choice.text));
    expect(one.seed).not.toEqual(another.seed);
  });

  it("rejects invalid coordinates and duplicate interaction identities", () => {
    const one = inputs[0];
    expect(buildStreetScene("seed", [one, { ...one, x: 210 }, { ...inputs[1], x: Infinity }]).objects).toHaveLength(1);
    expect(buildStreetScene("seed", [{ ...one, y: 130 }, { ...one, id: "bad-x", x: -1 }]).objects).toHaveLength(0);
  });

  it("allows authored scene width to follow distant targets", () => {
    expect(buildStreetScene("seed", [{ ...inputs[0], x: 2000 }]).width).toBe(2160);
    expect(buildStreetScene("seed", []).width).toBe(768);
  });

  it("clamps walking to street bounds without accelerating diagonally", () => {
    const initial = { x: 30, y: 120 };
    const right = moveStreet(initial, { x: 1, y: 0 }, 0.03, 300);
    const diagonal = moveStreet(initial, { x: 1, y: 1 }, 0.03, 300);
    expect(right.x - initial.x).toBeGreaterThan(diagonal.x - initial.x);
    expect(Math.hypot(diagonal.x - initial.x, diagonal.y - initial.y)).toBeCloseTo(right.x - initial.x);
    expect(moveStreet(initial, { x: -1, y: -1 }, 10, 300).x).toBeGreaterThanOrEqual(9);
    expect(moveStreet({ x: 299, y: 140 }, { x: 1, y: 1 }, 0.05, 300)).toEqual({ x: 291, y: 129 });
  });

  it("offers only nearby authored targets", () => {
    const obj = { id: "a", label: "talk", input: "talk", kind: "person" as const, x: 100, y: 112 };
    expect(nearbyStreetObject({ x: 100, y: 113 }, [obj])?.id).toBe("a");
    expect(nearbyStreetObject({ x: 10, y: 113 }, [obj])).toBeNull();
  });

  it("keeps integer pixel scaling", () => {
    expect(integerPixelScale(1024, 576)).toBe(4);
    expect(integerPixelScale(300, 170)).toBe(1);
  });
});
