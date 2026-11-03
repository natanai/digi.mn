import { defineAuthorWorkspace } from "../../../author/ui/workspaceDefinition";
import { StreetLayoutEditor } from "./StreetLayoutEditor";
import { streetLayoutDraft, streetLayoutMutations, type LayoutDraft } from "../layout";

export const streetLayoutWorkspace = defineAuthorWorkspace<LayoutDraft>({
  id: "streets.layout",
  matches(route) {
    return route.type === "feature" && route.feature === "streets" && route.workspace === "layout";
  },
  createDraft(route, context) {
    return streetLayoutDraft(route.data?.nodeId ?? context.playState.currentNodeId, context.snapshot.interactions);
  },
  buildSpec({ context, draft, setDraft, dirty }) {
    const node = context.snapshot.nodes.find((item) => item.id === draft.nodeId);
    return {
      id: "streets.layout",
      title: "Street layout",
      context: node ? `Node #${node.nodeNumber}` : "Node unavailable",
      blocks: [{
        type: "custom",
        id: "street-layout-canvas",
        role: "specialized-control",
        content: <StreetLayoutEditor
          draft={draft}
          setDraft={setDraft}
          dirty={dirty}
          interactions={context.snapshot.interactions}
          onEdit={(id) => context.resources.edit("interaction", id)}
          onCreate={() => context.pushTask({
            type: "feature",
            feature: "narrative",
            workspace: "interaction",
            data: { sourceNodeId: draft.nodeId },
          })}
        />,
      }],
    };
  },
  save: async ({ draft, context }) => {
    const mutations = streetLayoutMutations(draft, context.snapshot.interactions);
    if (!mutations.length) return { accepted: true };
    const result = await context.persist(mutations, `Arrange street for Node ${draft.nodeId}`);
    return { accepted: result.status === "saved" || result.status === "queued" };
  },
});
