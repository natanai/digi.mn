import { describe, expect, it } from "vitest";
import { legacyAssetId, normalizeMediaCueAssetReference } from "./assetReference";

describe("Media cue identity persistence",()=>{
  it("never turns a modern authored Media ID into a repository path",()=>{
    expect(normalizeMediaCueAssetReference("digi.mn.cutaway.cleaner-briefing"))
      .toBe("digi.mn.cutaway.cleaner-briefing");
    expect(normalizeMediaCueAssetReference("digi.mn.cutaway.alley-rescue"))
      .toBe("digi.mn.cutaway.alley-rescue");
    expect(normalizeMediaCueAssetReference("local-media-acceptance"))
      .toBe("local-media-acceptance");
  });
  it("still migrates legacy file paths and preserves canonical repo asset URLs",()=>{
    expect(normalizeMediaCueAssetReference("assets/cutaways/example.png"))
      .toBe("repo:/assets/cutaways/example.png");
    expect(normalizeMediaCueAssetReference("assets\\samples\\kick.wav"))
      .toBe("repo:/assets\\samples\\kick.wav");
    expect(normalizeMediaCueAssetReference("repo:/assets/images/portrait.svg"))
      .toBe("repo:/assets/images/portrait.svg");
    expect(legacyAssetId("images/title.png")).toBe("repo:/images/title.png");
  });
  it("recovers the previous prototype's damaged cutaway references",()=>{
    expect(normalizeMediaCueAssetReference("repo:/digi.mn.cutaway.cleaner-briefing"))
      .toBe("digi.mn.cutaway.cleaner-briefing");
    expect(normalizeMediaCueAssetReference("repo:/digi.mn.cutaway.alley-rescue"))
      .toBe("digi.mn.cutaway.alley-rescue");
  });
});