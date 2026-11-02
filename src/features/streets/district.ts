import type { GameNode, Interaction } from "../narrative/model";
import { flowDestinations } from "../narrative/flow";
import { streetHash } from "./scene";

export type DistrictSite = { nodeId: string; x: number; y: number; index: number };
export type DistrictRoad = { from: string; to: string; interactionId: string };
export type DistrictLayout = { seed: string; width: number; height: number; sites: DistrictSite[]; roads: DistrictRoad[] };

/**
 * Map only. Narrative entrance outcomes remain the sole authority for moving
 * between streets; the generated district has no travel/teleport operation.
 * The same seed + same authored graph creates the same map.
 */
export function buildDistrict(
  seed: string,
  nodes: readonly GameNode[],
  interactions: readonly Interaction[],
  startNodeId: string,
): DistrictLayout {
  const valid = new Set(nodes.map((node) => node.id));
  const streets = new Set(interactions.filter((item) => item.matchMode !== "fallback" && item.streetPlacement)
    .map((item) => item.sourceNodeId).filter((id) => valid.has(id)));
  const roads: DistrictRoad[] = [];
  for (const item of interactions) {
    if (item.streetPlacement?.kind !== "entrance" || !streets.has(item.sourceNodeId)) continue;
    for (const outcome of item.outcomes) {
      if (outcome.authorStatus === "draft") continue;
      for (const destination of flowDestinations(outcome.after)) {
        if (!valid.has(destination.nodeId)) continue;
        streets.add(destination.nodeId);
        if (!roads.some((road) => road.from === item.sourceNodeId && road.to === destination.nodeId && road.interactionId === item.id)) {
          roads.push({ from: item.sourceNodeId, to: destination.nodeId, interactionId: item.id });
        }
      }
    }
  }
  if (streets.has(startNodeId)) streets.add(startNodeId);
  const ids = [...streets].sort((a, b) =>
    streetHash(seed + ":" + a) - streetHash(seed + ":" + b) || a.localeCompare(b));
  // Permute the abstract grid by seed; do not imply physical route length.
  const variant = streetHash(seed + ":layout") % 4;
  const columns = 4;
  const rows = Math.max(1, Math.ceil(ids.length / columns));
  const width = 320;
  const height = Math.max(165, rows * 64 + 36);
  const sites = ids.map((nodeId, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = variant % 2 ? 275 - col * 71 : 43 + col * 71;
    const y = variant >= 2 ? height - 41 - row * 64 : 38 + row * 64;
    return { nodeId, index: index + 1, x, y };
  });
  const included = new Set(ids);
  return {
    seed, width, height, sites,
    roads: roads.filter((road) => included.has(road.from) && included.has(road.to))
      .sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to) || a.interactionId.localeCompare(b.interactionId)),
  };
}
