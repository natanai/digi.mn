import type { Interaction, InteractionStreetPlacement } from "../narrative/model";
import { STREET_BOUNDS } from "./scene";

export type LayoutDraft = {
  nodeId: string;
  placements: Record<string, InteractionStreetPlacement | null>;
};

export function streetLayoutDraft(nodeId: string, interactions: readonly Interaction[]): LayoutDraft {
  return {
    nodeId,
    placements: Object.fromEntries(interactions.filter((item) => item.sourceNodeId === nodeId && item.matchMode !== "fallback")
      .map((item) => [item.id, item.streetPlacement ? structuredClone(item.streetPlacement) : null])),
  };
}

export function streetLayoutMutations(draft: LayoutDraft, interactions: readonly Interaction[]) {
  return interactions.filter((item) => item.sourceNodeId === draft.nodeId && item.matchMode !== "fallback")
    .filter((item) => JSON.stringify(draft.placements[item.id] ?? null) !== JSON.stringify(item.streetPlacement ?? null))
    .map((item) => ({
      type: "interaction.upsert" as const,
      interaction: { ...item, streetPlacement: draft.placements[item.id] ?? undefined },
    }));
}

export function clampStreetPlacement(x: number, y: number): Pick<InteractionStreetPlacement, "x" | "y"> {
  return {
    x: Math.max(16, Math.min(4096, Math.round(x / 4) * 4)),
    y: Math.max(STREET_BOUNDS.minY, Math.min(STREET_BOUNDS.maxY, Math.round(y))),
  };
}

