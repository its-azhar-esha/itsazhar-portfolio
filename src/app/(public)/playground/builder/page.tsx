import type { Metadata } from "next";
import {
  getPublicNodeTypesAction,
  getPublicTemplateAction,
  getPublicTemplatesAction,
} from "@/lib/hub/actions";
import { getPublicSiteSettings } from "@/lib/settings";
import { getPublicPageContent } from "@/lib/content";
import { getSiteUrl } from "@/lib/site/urls";
import {
  DEFAULT_PLAYGROUND_CONTENT,
  type PlaygroundPageContent,
} from "@/lib/content/defaults/playground";
import { WorkflowBuilder } from "@/components/playground/workflow-builder";
import type { WorkflowEdge, WorkflowNode } from "@/types/hub";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const baseUrl = await getSiteUrl();
  const title = `Workflow Builder | ${settings.site_name || "Azhar"}`;
  const description =
    "Free visual workflow builder. Drag, connect and configure automation steps, then save and share your flow.";
  const canonical = `${baseUrl}/playground/builder`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
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
  const [nodeTypes, templates, content] = await Promise.all([
    getPublicNodeTypesAction(),
    getPublicTemplatesAction({}),
    getPublicPageContent<PlaygroundPageContent>("playground", DEFAULT_PLAYGROUND_CONTENT),
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
            <h1 className="text-2xl font-bold tracking-tight">{content.builder.title}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{content.builder.subtitle}</p>
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
