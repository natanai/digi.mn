import { describe, expect, it } from "vitest";
import { actorFrame, drawActor, STREET_ACTOR_FILES, type ActorAtlas } from "./ui/actorSprites";

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
  it("uses an integer pixel destination and real four-frame source crop", () => {
    const calls: unknown[][]=[];
    const context={
      save:()=>calls.push(["save"]),
      restore:()=>calls.push(["restore"]),
      translate:(...p:unknown[])=>calls.push(["translate",...p]),
      scale:(...p:unknown[])=>calls.push(["scale",...p]),
      drawImage:(...p:unknown[])=>calls.push(["drawImage",...p]),
      imageSmoothingEnabled:true,
    } as unknown as CanvasRenderingContext2D;
    const image={naturalWidth:120,naturalHeight:52} as HTMLImageElement;
    const atlas:ActorAtlas={image,frameWidth:30,frameHeight:52,frames:4};
    drawActor(context,atlas,56.4,119,2,1);
    expect(calls.find(c=>c[0]==="drawImage")).toEqual([
      "drawImage",image,60,0,30,52,41,67,30,52,
    ]);
    calls.length=0;
    drawActor(context,atlas,56.4,119,1,-1);
    expect(calls).toContainEqual(["scale",-1,1]);
    expect(calls).toContainEqual(["translate",56,0]);
    expect(calls.find(c=>c[0]==="drawImage")).toEqual([
      "drawImage",image,30,0,30,52,-15,67,30,52,
    ]);
  });
});
