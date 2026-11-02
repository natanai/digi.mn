import type { AuthorFeatureManifest } from "../../../author/features/types";
import { streetLayoutWorkspace } from "./StreetLayoutWorkspace";

export const streetAuthorFeature: AuthorFeatureManifest = {
  id: "streets",
  describeTask(route, snapshot) {
    if (route.type !== "feature" || route.feature !== "streets" || route.workspace !== "layout") return null;
    const node = snapshot.nodes.find((item) => item.id === route.data?.nodeId);
    return node ? `Street layout · Node #${node.nodeNumber}` : "Street layout";
  },
  workspaces: [streetLayoutWorkspace],
};
