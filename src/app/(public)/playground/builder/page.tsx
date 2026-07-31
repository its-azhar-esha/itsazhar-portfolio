import type { Metadata } from "next";
import {
  getPublicNodeTypesAction,
  getPublicTemplateAction,
  getPublicTemplatesAction,
} from "@/lib/hub/actions";
import { getPublicSiteSettings } from "@/lib/settings";
import { WorkflowBuilder } from "@/components/playground/workflow-builder";
import type { WorkflowEdge, WorkflowNode } from "@/types/hub";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  return {
    title: `Workflow Builder | ${settings.site_name || "Azhar"}`,
    description:
      "Free visual workflow builder. Drag, connect and configure automation steps, then save and share your flow.",
    openGraph: { title: "Workflow Builder", type: "website" },
  };
}

function parseRemixPayload(
  raw: string,
): { nodes: WorkflowNode[]; edges: WorkflowEdge[]; title?: string } | null {
  try {
    const parsed = JSON.parse(raw) as {
      nodes?: WorkflowNode[];
      edges?: WorkflowEdge[];
      title?: string;
    };
    if (!Array.isArray(parsed.nodes)) return null;
    return {
      nodes: parsed.nodes,
      edges: Array.isArray(parsed.edges) ? parsed.edges : [],
      title: parsed.title,
    };
  } catch {
    return null;
  }
}

export default async function BuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; template?: string }>;
}) {
  const params = await searchParams;
  const [nodeTypes, templates] = await Promise.all([
    getPublicNodeTypesAction(),
    getPublicTemplatesAction({}),
  ]);

  let initialNodes: WorkflowNode[] = [];
  let initialEdges: WorkflowEdge[] = [];
  let initialTitle = "";
  let initialWalkthrough: { title: string; description: string }[] = [];

  if (params.t) {
    const template = await getPublicTemplateAction(params.t);
    if (template) {
      initialNodes = template.nodes;
      initialEdges = template.edges;
      initialTitle = template.title;
      initialWalkthrough = template.walkthrough;
    }
  } else if (params.template) {
    const payload = parseRemixPayload(params.template);
    if (payload) {
      initialNodes = payload.nodes;
      initialEdges = payload.edges;
      initialTitle = payload.title ?? "";
    }
  }

  return (
    <div className="pt-24 md:pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Workflow Builder</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {initialNodes.length > 0
                ? `Loaded "${initialTitle || "workflow"}" — remix it, then save and share.`
                : "Drag nodes from the library, connect them, then save and share your flow."}
            </p>
          </div>
        </div>
        <WorkflowBuilder
          nodeTypes={nodeTypes}
          templates={templates}
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          initialTitle={initialTitle}
          initialWalkthrough={initialWalkthrough}
        />
      </div>
    </div>
  );
}
