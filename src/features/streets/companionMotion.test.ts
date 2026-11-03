import { describe, expect, it } from "vitest";
import { followCompanion, walkingFacing } from "./companionMotion";
import { buildStreetScene } from "./scene";

const width=buildStreetScene("sample",[]).width;
describe("visual companion follows and then stops",()=>{
  it("arrives and remains stationary for hundreds of frames",()=>{
    const cleaner={x:240,y:115};
    let companion={x:30,y:118};
    let moving=false;
    for(let i=0;i<400;i++){
      const next=followCompanion(companion,cleaner,1,1/60,width);
      companion=next.position;
      moving=next.moving;
    }
    expect(moving).toBe(false);
    expect(companion).toEqual({x:208,y:118});
    for(let i=0;i<120;i++){
      const next=followCompanion(companion,cleaner,1,1/60,width);
      expect(next.position).toEqual(companion);
      expect(next.moving).toBe(false);
    }
  });
  it("never overshoots even when motion delta is unusually large",()=>{
    const next=followCompanion({x:205,y:118},{x:240,y:115},1,10,width);
    expect(next).toEqual({position:{x:208,y:118},moving:false});
  });
  it("does not reverse the sprite when moving only along scene depth",()=>{
    expect(walkingFacing(150,150,1)).toBe(1);
    expect(walkingFacing(150,150,-1)).toBe(-1);
    expect(walkingFacing(150,140,1)).toBe(-1);
    expect(walkingFacing(150,160,-1)).toBe(1);
  });
  it("remains bounded near the edge of the generated street",()=>{
    const next=followCompanion({x:9,y:118},{x:9,y:114},1,1/60,width);
    expect(next.position.x).toBe(9);
    expect(next.moving).toBe(false);
  });
});
