import { describe, expect, it } from "vitest";
import { buildDistrict } from "./district";
import { clampStreetPlacement, streetLayoutDraft, streetLayoutMutations } from "./layout";
import type { GameNode, Interaction } from "../narrative/model";

const node = (id: string) => ({id, nodeNumber: Number(id.slice(1))+1, authorLabel:id, openings:[], ending:false, tags:[], locationId:null}) as GameNode;
const entrance = (id: string, sourceNodeId: string, destination: string): Interaction => ({
  id, sourceNodeId, wording:"enter", aliases:["enter"], tags:[], notes:"", choiceVisibility:"prompt",
  outcomes:[{id:id+":outcome", order:0, label:"entered", authorStatus:"configured", condition:{type:"always"},
    responseText:"", responsePerformance:{charactersPerSecond:18,cues:[]}, effects:[],
    after:[{id:id+":go",type:"transition",destination:{nodeId:destination,openingId:null}}]}],
  streetPlacement:{kind:"entrance",x:160,y:114},
});
const object = (id: string, sourceNodeId: string): Interaction => ({
  ...entrance(id,sourceNodeId,sourceNodeId), streetPlacement:{kind:"object",x:300,y:120}, outcomes:[],
});

describe("district map graph", () => {
  const nodes = [node("n0"),node("n1"),node("n2"),node("n3")];
  const interactions = [entrance("door-1","n0","n1"), entrance("door-2","n1","n2"),object("note","n2")];
  it("contains only authored streets and their connected destinations", () => {
    const map=buildDistrict("seed",nodes,interactions,"n0");
    expect(map.sites.map(s=>s.nodeId).sort()).toEqual(["n0","n1","n2"]);
    expect(map.roads.map(r=>[r.from,r.to])).toEqual([["n0","n1"],["n1","n2"]]);
    expect(map.sites.every(s=>s.x>=0&&s.x<map.width&&s.y>=0&&s.y<map.height)).toBe(true);
  });
  it("is seed-deterministic and does not create edges that bypass authored transitions", () => {
    const a=buildDistrict("same",nodes,interactions,"n0");
    expect(a).toEqual(buildDistrict("same",nodes,interactions,"n0"));
    expect(a.roads).toEqual(buildDistrict("another",nodes,interactions,"n0").roads);
    expect(buildDistrict("s",nodes,[object("box","n0")],"n0").roads).toHaveLength(0);
  });
  it("does not show unconfigured entrance outcomes as a route", () => {
    const pending=entrance("pending","n0","n1");
    pending.outcomes[0].authorStatus="draft";
    expect(buildDistrict("seed",nodes,[pending],"n0").roads).toHaveLength(0);
  });
});

describe("street Author placement changes", () => {
  const items=[entrance("door","n0","n1"), object("object","n0")];
  it("retains the input's canonical identity and all narrative outcomes on save", () => {
    const draft=streetLayoutDraft("n0",items);
    draft.placements.door={...draft.placements.door!,x:352,y:125};
    const changes=streetLayoutMutations(draft,items);
    expect(changes).toHaveLength(1);
    expect(changes[0].interaction.id).toBe("door");
    expect(changes[0].interaction.outcomes).toEqual(items[0].outcomes);
    expect(changes[0].interaction.streetPlacement).toEqual({kind:"entrance",x:352,y:125});
    expect(items[0].streetPlacement?.x).toBe(160);
  });
  it("supports removal without deleting the authored input", () => {
    const draft=streetLayoutDraft("n0",items);
    draft.placements.door=null;
    const changes=streetLayoutMutations(draft,items);
    expect(changes).toHaveLength(1);
    expect(changes[0].type).toBe("interaction.upsert");
    expect(changes[0].interaction.streetPlacement).toBeUndefined();
  });
  it("snaps to logical pixels and clamps to validated boundaries", () => {
    expect(clampStreetPlacement(35,130)).toEqual({x:36,y:129});
    expect(clampStreetPlacement(-20,0)).toEqual({x:16,y:104});
    expect(clampStreetPlacement(8000,1000)).toEqual({x:4096,y:129});
  });
});
