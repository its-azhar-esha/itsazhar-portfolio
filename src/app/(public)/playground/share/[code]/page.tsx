import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Wand2 } from "lucide-react";
import { getSharedWorkflowAction, getPublicNodeTypesAction } from "@/lib/hub/actions";
import { getPublicPageContent } from "@/lib/content";
import {
  DEFAULT_PLAYGROUND_CONTENT,
  type PlaygroundPageContent,
} from "@/lib/content/defaults/playground";
import { SharedWorkflowView } from "@/components/playground/shared-view";
import { Button } from "@/components/ui/button";

interface SharePageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { code } = await params;
  const workflow = await getSharedWorkflowAction(code);
  if (!workflow) return {};
  return {
    title: `${workflow.title} — Shared Workflow`,
    description: "A shared automation workflow built in the Workflow Playground. Remix it freely.",
    openGraph: { title: workflow.title, type: "website" },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { code } = await params;
  const [workflow, nodeTypes, content] = await Promise.all([
    getSharedWorkflowAction(code),
    getPublicNodeTypesAction(),
    getPublicPageContent<PlaygroundPageContent>("playground", DEFAULT_PLAYGROUND_CONTENT),
  ]);
  if (!workflow) notFound();

  return (
    <div className="pt-24 md:pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <Link
          href="/playground"
          className="text-muted-foreground hover:text-primary mb-6 inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {content.share.back}
        </Link>
        {workflow.nodes.length === 0 ? (
          <div className="border-border/60 bg-card flex flex-col items-center rounded-2xl border p-16 text-center">
            <Wand2 className="text-muted-foreground h-12 w-12" />
            <h1 className="mt-4 text-xl font-bold">{workflow.title}</h1>
            <p className="text-muted-foreground mt-2 max-w-md text-sm">{content.share.empty}</p>
            <Link href="/playground/builder" className="mt-6">
              <Button size="lg">{content.share.openBuilder}</Button>
            </Link>
          </div>
        ) : (
          <SharedWorkflowView workflow={workflow} nodeTypes={nodeTypes} />
        )}
      </div>
    </div>
  );
}
