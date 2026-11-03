import { describe, expect, it } from "vitest";
import { actorFrame, actorFrameGeometry, STREET_ACTOR_FILES } from "./spriteFrames";

describe("street actor sprite atlas contract", () => {
  it("defines the imported four-frame 30x52 and 42x30 sheets", () => {
    expect(STREET_ACTOR_FILES.cleaner).toMatchObject({width:30,height:52,frames:4});
    expect(STREET_ACTOR_FILES.partner).toMatchObject({width:42,height:30,frames:4});
  });
  it("plays a walk cycle but holds the first frame while idle", () => {
    expect([0,165,330,495,660].map(time=>actorFrame(time,true))).toEqual([0,1,2,3,0]);
    expect(actorFrame(498,false)).toBe(0);
    expect(actorFrame(-1,true)).toBe(0);
  });
  it("uses the correct pixel-perfect 4-frame source crop", () => {
    const atlas={frameWidth:30,frameHeight:52,frames:4};
    expect(actorFrameGeometry(atlas,56.4,119,2,1)).toEqual({
      sourceX:60,sourceY:0,width:30,height:52,
      destinationX:41,destinationY:67,mirrorOriginX:null,
    });
    expect(actorFrameGeometry(atlas,56.4,119,1,-1)).toEqual({
      sourceX:30,sourceY:0,width:30,height:52,
      destinationX:-15,destinationY:67,mirrorOriginX:56,
    });
  });
});
