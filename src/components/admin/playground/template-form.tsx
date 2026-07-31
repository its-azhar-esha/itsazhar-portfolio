"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { createWorkflowTemplateAction, updateWorkflowTemplateAction } from "@/lib/hub/actions";
import { createWorkflowTemplateSchema } from "@/lib/validation";
import { generateSlug } from "@/lib/slug";
import { DIFFICULTIES, DIFFICULTY_LABELS } from "@/constants/hub";
import type {
  WorkflowTemplate,
  WorkflowCategory,
  WorkflowNodeType,
  WorkflowNode,
  WorkflowEdge,
  WalkthroughStep,
} from "@/types/hub";
import type { Difficulty } from "@/constants/hub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TagInput } from "@/components/ui/tag-input";
import { MediaField } from "@/components/media/media-field";
import { WorkflowBuilder } from "@/components/playground/workflow-builder";

const selectClass =
  "border-border bg-background text-foreground focus:border-primary/40 focus:ring-primary/20 h-9 w-full rounded-lg border px-3 py-1 text-base transition-all duration-200 focus:ring-1 focus:outline-none";
const inputClass =
  "border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 h-9 w-full rounded-lg border px-3 text-sm transition-all duration-200 focus:ring-1 focus:outline-none";
const textareaClass =
  "border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-primary/20 flex w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-1 focus:outline-none";

interface TemplateFormProps {
  template?: WorkflowTemplate;
  categories: WorkflowCategory[];
  nodeTypes: WorkflowNodeType[];
}

export function TemplateForm({ template, categories, nodeTypes }: TemplateFormProps) {
  const router = useRouter();
  const toast = useToast();
  const slugEdited = React.useRef(false);

  const [title, setTitle] = React.useState(template?.title ?? "");
  const [slug, setSlug] = React.useState(template?.slug ?? "");
  const [description, setDescription] = React.useState(template?.description ?? "");
  const [categoryId, setCategoryId] = React.useState(template?.category_id ?? "");
  const [difficulty, setDifficulty] = React.useState(template?.difficulty ?? "beginner");
  const [tags, setTags] = React.useState<string[]>(template?.tags ?? []);
  const [thumbnail, setThumbnail] = React.useState(template?.thumbnail ?? "");
  const [featured, setFeatured] = React.useState(template?.featured ?? false);
  const [displayOrder, setDisplayOrder] = React.useState(template?.display_order ?? 0);
  const [status, setStatus] = React.useState(template?.status ?? "draft");
  const [seoTitle, setSeoTitle] = React.useState(template?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = React.useState(template?.seo_description ?? "");
  const [keywords, setKeywords] = React.useState<string[]>(template?.keywords ?? []);
  const [nodes, setNodes] = React.useState<WorkflowNode[]>(template?.nodes ?? []);
  const [edges, setEdges] = React.useState<WorkflowEdge[]>(template?.edges ?? []);
  const [canvas, setCanvas] = React.useState<Record<string, unknown>>(template?.canvas ?? {});
  const [walkthrough, setWalkthrough] = React.useState<WalkthroughStep[]>(
    template?.walkthrough ?? [],
  );
  const [walkthroughTitle, setWalkthroughTitle] = React.useState("");
  const [walkthroughDescription, setWalkthroughDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function handleCommit(data: {
    title: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    canvas: Record<string, unknown>;
    walkthrough: WalkthroughStep[];
  }) {
    setNodes(data.nodes);
    setEdges(data.edges);
    setCanvas(data.canvas);
    setWalkthrough(data.walkthrough);
  }

  async function handleSave() {
    setError(null);
    const parsed = createWorkflowTemplateSchema.safeParse({
      title,
      slug,
      description,
      category_id: categoryId || null,
      difficulty,
      tags,
      thumbnail: thumbnail || null,
      nodes,
      edges,
      canvas,
      walkthrough,
      featured,
      display_order: displayOrder,
      status,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      keywords,
    });
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join("; "));
      return;
    }
    setSaving(true);
    const result = template
      ? await updateWorkflowTemplateAction(template.id, parsed.data as never)
      : await createWorkflowTemplateAction(parsed.data as never);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    toast.success(template ? "Template updated." : "Template created.");
    router.push("/admin/playground");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugEdited.current) setSlug(generateSlug(e.target.value));
                }}
                placeholder="AI Research Assistant"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Slug</Label>
              <Input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  slugEdited.current = true;
                }}
                placeholder="ai-research-assistant"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Description</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Shown on the template card and detail page."
                className={textareaClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={selectClass}
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Difficulty</Label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className={selectClass}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {DIFFICULTY_LABELS[d]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tags</Label>
              <TagInput value={tags} onChange={setTags} placeholder="Add tag…" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Thumbnail</Label>
              <MediaField value={thumbnail} onChange={(value) => setThumbnail(value ?? "")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workflow canvas</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkflowBuilder
            nodeTypes={nodeTypes}
            templates={[]}
            mode="form"
            initialNodes={nodes}
            initialEdges={edges}
            initialCanvas={canvas}
            initialTitle={title}
            initialWalkthrough={walkthrough}
            onCommit={handleCommit}
          />
          <p className="text-muted-foreground mt-3 text-xs">
            Edit the flow visually, then press <strong>Apply to form</strong> to sync it into the
            template. Published templates appear in the public library.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Walkthrough steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Step title</Label>
              <Input
                value={walkthroughTitle}
                onChange={(e) => setWalkthroughTitle(e.target.value)}
                placeholder="Connect a trigger"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Step description</Label>
              <Input
                value={walkthroughDescription}
                onChange={(e) => setWalkthroughDescription(e.target.value)}
                placeholder="Start with an app event…"
                className={inputClass}
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              if (!walkthroughTitle.trim()) return;
              setWalkthrough((w) => [
                ...w,
                { title: walkthroughTitle.trim(), description: walkthroughDescription.trim() },
              ]);
              setWalkthroughTitle("");
              setWalkthroughDescription("");
            }}
          >
            <Plus className="h-4 w-4" />
            Add step
          </Button>
          {walkthrough.length > 0 && (
            <div className="space-y-2">
              {walkthrough.map((step, i) => (
                <div
                  key={i}
                  className="border-border/60 bg-muted/30 flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      <span className="text-muted-foreground mr-2">{i + 1}.</span>
                      {step.title}
                    </p>
                    {step.description && (
                      <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                        {step.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                    onClick={() => setWalkthrough((w) => w.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Publication & SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as WorkflowTemplate["status"])}
                className={selectClass}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Display order</Label>
              <Input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
            <div className="flex items-end gap-6 pb-1">
              <div className="space-y-1.5">
                <Label className="text-xs">Featured</Label>
                <Switch checked={featured} onCheckedChange={setFeatured} />
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">SEO title</Label>
              <Input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder={`${title || "Template"} — Workflow Template`}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">SEO description</Label>
              <Input
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="One-line description for search engines."
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Keywords</Label>
              <TagInput value={keywords} onChange={setKeywords} placeholder="Add keyword…" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pb-10">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {template ? "Save changes" : "Create template"}
        </Button>
      </div>
    </div>
  );
}
