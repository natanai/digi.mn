const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { buildDemoOperations } = require("./preview-demo.cjs");

const scenes = [
  ["cleaner-briefing", "accept the bounty"],
  ["alley-rescue", "offer to help them"],
];

test("the game ships two stable authored Media cutaways", () => {
  const snapshot = {
    startNodeId: "00000000-0000-4000-8000-000000000001",
    revision: 0,
    nodes: [{ id: "00000000-0000-4000-8000-000000000001", nodeNumber: 1 }],
    interactions: [],
  };
  const operations = buildDemoOperations(snapshot);
  for (const [file, label] of scenes) {
    const root = join(__dirname, "..", "public", "assets", "cutaways", file + ".svg");
    const svg = readFileSync(root, "utf8");
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(svg, /viewBox="0 0 960 540"/);
    const receipt = JSON.parse(readFileSync(root + ".asset.json", "utf8"));
    assert.equal(receipt.id, "digi.mn.cutaway." + file);
    assert.equal(receipt.defaultPresentation, "overlay");
    const interaction = operations.find((operation) =>
      operation.type === "interaction.upsert" && operation.interaction.wording === label);
    assert.ok(interaction);
    const cue = interaction.interaction.outcomes[0].responsePerformance.cues[0];
    assert.equal(cue.type, "sprite");
    assert.equal(cue.value, receipt.id);
  }
});
