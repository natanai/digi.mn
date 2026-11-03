import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StreetView } from "../StreetView";
import { StreetLayoutEditor } from "./StreetLayoutEditor";
import type { DistrictLayout } from "../district";

const district: DistrictLayout = {
  seed: "author-test", width: 256, height: 144,
  sites: [{nodeId:"node",x:90,y:85,index:1}], roads: [],
};
const props = {
  seed: "author-test",
  choices: [{id:"vendor",text:"ask the vendor",kind:"person" as const,x:148,y:114}],
  onChoose: (_text: string) => {},
  canChoose: true,
  district,
  currentNodeId: "node",
  visitedNodeIds: [] as string[],
};

describe("author inspection uses the running street and existing scene layout", () => {
  it("offers Edit Scene only when both Author routes exist", () => {
    const player = renderToStaticMarkup(<StreetView {...props} />);
    const partial = renderToStaticMarkup(<StreetView {...props} onEditStreetTarget={() => {}} />);
    const author = renderToStaticMarkup(
      <StreetView {...props} onEditStreetTarget={() => {}} onArrangeStreet={() => {}} />,
    );
    expect(player).not.toContain("[EDIT SCENE]");
    expect(partial).not.toContain("[EDIT SCENE]");
    expect(author).toContain("[EDIT SCENE]");
    expect(author).toContain("Inspect and edit street interactions");
    expect(author).toContain("Click ground to walk");
  });

  it("makes new interaction creation available from the existing layout workspace", () => {
    const props = {
      draft: {nodeId:"node",placements:{}},
      setDraft: () => {},
      interactions: [],
      onEdit: (_id:string) => {},
      onCreate: () => {},
    };
    const clean = renderToStaticMarkup(<StreetLayoutEditor {...props} dirty={false} />);
    const dirty = renderToStaticMarkup(<StreetLayoutEditor {...props} dirty />);
    expect(clean).toContain("[+ NEW STREET INTERACTION]");
    expect(clean).not.toContain("disabled=\"\"");
    expect(dirty).toContain("disabled");
  });
});
