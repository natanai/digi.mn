import { describe, expect, it } from "vitest";
import { buildStreetScene, integerPixelScale, moveStreet, nearbyStreetObject } from "./scene";

describe("street feature", () => {
  it("builds reproducible interaction targets from authored choices", () => {
    const choices = [{ id: "a", text: "ask about the bounty" }, { id: "b", text: "look at the door" }];
    expect(buildStreetScene("seed", choices)).toEqual(buildStreetScene("seed", choices));
    expect(buildStreetScene("seed", choices).objects.map((object) => object.input)).toEqual(choices.map((choice) => choice.text));
    expect(buildStreetScene("seed", choices).objects[0].x).not.toBe(buildStreetScene("different", choices).objects[0].x);
  });
  it("clamps walking to street bounds without accelerating diagonal movement", () => {
    const initial = { x: 30, y: 120 };
    const right = moveStreet(initial, { x: 1, y: 0 }, 0.03, 300);
    const diagonal = moveStreet(initial, { x: 1, y: 1 }, 0.03, 300);
    expect(right.x - initial.x).toBeGreaterThan(diagonal.x - initial.x);
    expect(Math.hypot(diagonal.x - initial.x, diagonal.y - initial.y)).toBeCloseTo(right.x - initial.x);
    expect(moveStreet(initial, { x: -1, y: -1 }, 10, 300).x).toBeGreaterThanOrEqual(9);
    expect(moveStreet({ x: 299, y: 140 }, { x: 1, y: 1 }, 0.05, 300)).toEqual({ x: 291, y: 129 });
  });
  it("only offers reachable nearby authored targets", () => {
    const obj = { id: "a", label: "talk", input: "talk", x: 100, y: 112 };
    expect(nearbyStreetObject({ x: 100, y: 113 }, [obj])?.id).toBe("a");
    expect(nearbyStreetObject({ x: 10, y: 113 }, [obj])).toBeNull();
  });
  it("returns integer scaling, preserving pixel grid", () => {
    expect(integerPixelScale(1024, 576)).toBe(4);
    expect(integerPixelScale(300, 170)).toBe(1);
  });
});
