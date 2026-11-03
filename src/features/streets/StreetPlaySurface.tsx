import { useMemo } from "react";
import type { PlayState, ProjectSnapshot } from "../../engine/project/model";
import { isInteractionChoiceVisible } from "../narrative/choiceVisibility";
import { interpolateText } from "../narrative/interpolation";
import { resolveActiveNodeLocationContext } from "../narrative/sceneContext";
import { buildDistrict } from "./district";
import { StreetView } from "./StreetView";

/**
 * Digi-specific extension point for the upstream game's existing play surface.
 * Keep graphics, choice projection and world-location continuity here rather
 * than embedding their implementation in the shared engine's App component.
 */
export function StreetPlaySurface({
  snapshot,
  playState,
  currentNodeId,
  onChoose,
  canChoose,
  onPreviewArt,
  onEditStreetTarget,
  onArrangeStreet,
}: {
  snapshot: ProjectSnapshot;
  playState: PlayState;
  currentNodeId: string;
  onChoose: (text: string) => void;
  canChoose: boolean;
  onPreviewArt?: () => void;
  onEditStreetTarget?: (id: string) => void;
  onArrangeStreet?: () => void;
}) {
  const seed = String(playState.initializationSeed);
  const district = useMemo(
    () => buildDistrict(seed, snapshot.nodes, snapshot.interactions, snapshot.startNodeId),
    [seed, snapshot.nodes, snapshot.interactions, snapshot.startNodeId],
  );
  // Traversing multiple prose Nodes does not reset the player's walking location.
  const physicalLocation = resolveActiveNodeLocationContext(snapshot, playState)?.locationId ?? currentNodeId;

  const choices = playState.pendingNarrativeFlow ? [] : snapshot.interactions
    .filter((interaction) =>
      interaction.sourceNodeId === currentNodeId
      && interaction.matchMode !== "fallback"
      && interaction.choiceVisibility !== "typed"
      && interaction.streetPlacement
      && isInteractionChoiceVisible(snapshot, playState, interaction))
    .map((interaction) => {
      const placement = interaction.streetPlacement!;
      const entity = snapshot.entities.find((candidate) => candidate.id === placement.entityId);
      return {
        id: interaction.id,
        text: interpolateText(interaction.aliases[0] || interaction.wording, { snapshot, state: playState }),
        kind: placement.kind,
        x: placement.x,
        y: placement.y,
        entityName: entity?.name,
      };
    });

  return <StreetView
    seed={seed + ":" + physicalLocation}
    choices={choices}
    canChoose={canChoose}
    onPreviewArt={onPreviewArt}
    onEditStreetTarget={onEditStreetTarget}
    onArrangeStreet={onArrangeStreet}
    district={district}
    currentNodeId={currentNodeId}
    visitedNodeIds={playState.traversal}
    onChoose={onChoose}
  />;
}
