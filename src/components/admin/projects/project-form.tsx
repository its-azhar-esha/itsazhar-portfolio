"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, FileText, ImageIcon, Layout, Search, Send } from "lucide-react";
import type { DbProject } from "@/types/project";
import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
} from "@/lib/projects/actions";
import { createProjectSchema } from "@/lib/validation";
import { generateSlug } from "@/lib/slug";
import { PROJECT_INDUSTRIES, PROJECT_CATEGORIES, DB_PROJECT_STATUSES } from "@/constants/projects";
import { ProjectGeneral } from "./project-general";
import { ProjectContent } from "./project-content";
import { ProjectMedia } from "./project-media";
import { ProjectSeo } from "./project-seo";
import { ProjectPublishing } from "./project-publishing";
import { ProjectFormActions } from "./project-form-actions";
import { ConfirmDialog } from "./confirm-dialog";

export interface FormFields {
  title: string;
  slug: string;
  short_description: string;
  description: string;
  industry: string[];
  technologies: string;
  category: string;
  client: string;
  demo_url: string;
  github_url: string;
  featured: boolean;
  status: "draft" | "active" | "archived";
  order: number;
  thumbnail: string;
  images: string;
  video_url: string;
  seo_title: string;
  seo_description: string;
  og_image: string;
  canonical_url: string;
  keywords: string;
}

const VALID_INDUSTRIES = PROJECT_INDUSTRIES as readonly string[];
const VALID_CATEGORIES = PROJECT_CATEGORIES as readonly string[];
const VALID_STATUSES = DB_PROJECT_STATUSES as readonly string[];

function defaultFields(project?: DbProject): FormFields {
  return {
    title: project?.title ?? "",
    slug: project?.slug ?? "",
    short_description: project?.short_description ?? "",
    description: project?.description ?? "",
    industry: (project?.industry ?? []).filter((i): i is string => VALID_INDUSTRIES.includes(i)),
    technologies: project?.technologies?.join(", ") ?? "",
    category:
      project?.category && VALID_CATEGORIES.includes(project.category)
        ? project.category
        : "Logistics",
    client: project?.client ?? "",
    demo_url: project?.demo_url ?? "",
    github_url: project?.github_url ?? "",
    featured: project?.featured ?? false,
    status:
      project?.status && VALID_STATUSES.includes(project.status)
        ? (project.status as FormFields["status"])
        : "draft",
    order: Number.isFinite(project?.order) ? (project?.order ?? 0) : 0,
    thumbnail: project?.thumbnail ?? "",
    images: project?.images?.join("\n") ?? "",
    video_url: project?.video_url ?? "",
    seo_title: project?.seo_title ?? "",
    seo_description: project?.seo_description ?? "",
    og_image: project?.og_image ?? "",
    canonical_url: project?.canonical_url ?? "",
    keywords: project?.keywords?.join(", ") ?? "",
  };
}

function fieldsToJson(fields: FormFields): Record<string, unknown> {
  return {
    title: fields.title,
    slug: fields.slug,
    short_description: fields.short_description,
    description: fields.description || null,
    industry: fields.industry,
    technologies: fields.technologies
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    category: fields.category,
    client: fields.client || null,
    demo_url: fields.demo_url || null,
    github_url: fields.github_url || null,
    featured: fields.featured,
    status: fields.status,
    order: fields.order,
    thumbnail: fields.thumbnail || null,
    images: fields.images
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean),
    video_url: fields.video_url || null,
    seo_title: fields.seo_title || null,
    seo_description: fields.seo_description || null,
    og_image: fields.og_image || null,
    canonical_url: fields.canonical_url || null,
    keywords: fields.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
  };
}

interface ProjectFormProps {
  project?: DbProject;
}

export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter();
  const mode = project ? "edit" : "create";
  const [initial, setInitial] = React.useState<FormFields>(() => defaultFields(project));
  const [fields, setFields] = React.useState<FormFields>(initial);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormFields, string>>>({});
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const slugManuallyEdited = React.useRef(false);
  const messageTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasChanges = React.useMemo(
    () => JSON.stringify(fields) !== JSON.stringify(initial),
    [fields, initial],
  );

  React.useEffect(() => {
    return () => {
      if (messageTimer.current) clearTimeout(messageTimer.current);
    };
  }, []);

  function showMessage(type: "success" | "error", text: string) {
    if (messageTimer.current) clearTimeout(messageTimer.current);
    setMessage({ type, text });
    messageTimer.current = setTimeout(() => setMessage(null), 4000);
  }

  function handleChange(partial: Partial<FormFields>) {
    setFields((prev) => {
      const next = { ...prev, ...partial };
      if ("title" in partial && !slugManuallyEdited.current && partial.title) {
        const generated = generateSlug(partial.title);
        if (generated !== next.slug) {
          next.slug = generated;
        }
      }
      return next;
    });
    if (message) setMessage(null);
  }

  function handleSlugChange(value: string) {
    slugManuallyEdited.current = true;
    handleChange({ slug: value });
  }

  function validateForPublish(): boolean {
    const data = fieldsToJson(fields);
    const result = createProjectSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormFields, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormFields | undefined;
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      showMessage("error", "Please fix the validation errors before publishing.");
      return false;
    }
    setErrors({});
    return true;
  }

  async function handleSaveDraft() {
    setErrors({});
    setSaving(true);
    setMessage(null);
    try {
      const data = { ...fieldsToJson(fields), status: mode === "create" ? "draft" : fields.status };
      if (mode === "create") {
        const result = await createProjectAction(data);
        if (!result.success) {
          showMessage("error", result.error);
          return;
        }
        showMessage("success", "Draft created successfully.");
        router.push("/admin/projects");
      } else {
        const result = await updateProjectAction(project!.id, data);
        if (!result.success) {
          showMessage("error", result.error);
          return;
        }
        const fresh = defaultFields(result.data);
        setInitial(fresh);
        setFields(fresh);
        router.refresh();
        showMessage("success", "Draft saved.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!validateForPublish()) return;
    setSaving(true);
    setMessage(null);
    try {
      const data = { ...fieldsToJson(fields), status: "active" };
      if (mode === "create") {
        const result = await createProjectAction(data);
        if (!result.success) {
          showMessage("error", result.error);
          return;
        }
        showMessage("success", "Project published successfully.");
        router.push("/admin/projects");
      } else {
        const result = await updateProjectAction(project!.id, data);
        if (!result.success) {
          showMessage("error", result.error);
          return;
        }
        const fresh = defaultFields(result.data);
        setInitial(fresh);
        setFields(fresh);
        router.refresh();
        showMessage("success", "Project updated and published.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!project) return;
    setShowDeleteConfirm(false);
    setSaving(true);
    setMessage(null);
    try {
      const result = await deleteProjectAction(project.id);
      if (!result.success) {
        showMessage("error", result.error);
        return;
      }
      router.push("/admin/projects");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push("/admin/projects");
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
              : "border-red-500/30 bg-red-500/10 text-red-600"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <Card className="border-border/50">
        <CardHeader className="border-border/40 flex flex-row items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">
              {mode === "create" ? "New Project" : "Edit Project"}
            </CardTitle>
            {project && (
              <Badge
                variant="outline"
                className={
                  project.status === "active"
                    ? "border-emerald-500/30 text-emerald-500"
                    : project.status === "draft"
                      ? "border-amber-500/30 text-amber-500"
                      : "border-muted-foreground/30 text-muted-foreground"
                }
              >
                {project.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="mb-6 inline-flex h-auto flex-wrap gap-1 bg-transparent p-0">
              <TabsTrigger
                value="general"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm data-[state=active]:shadow-none"
              >
                <Layout className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger
                value="content"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm data-[state=active]:shadow-none"
              >
                <FileText className="h-4 w-4" />
                Content
              </TabsTrigger>
              <TabsTrigger
                value="media"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm data-[state=active]:shadow-none"
              >
                <ImageIcon className="h-4 w-4" />
                Media
              </TabsTrigger>
              <TabsTrigger
                value="seo"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm data-[state=active]:shadow-none"
              >
                <Search className="h-4 w-4" />
                SEO
              </TabsTrigger>
              <TabsTrigger
                value="publishing"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm data-[state=active]:shadow-none"
              >
                <Send className="h-4 w-4" />
                Publishing
              </TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="mt-0">
              <ProjectGeneral
                fields={fields}
                errors={errors}
                onChange={(partial) => {
                  if ("slug" in partial) {
                    handleSlugChange(partial.slug!);
                  } else {
                    handleChange(partial);
                  }
                }}
              />
            </TabsContent>
            <TabsContent value="content" className="mt-0">
              <ProjectContent fields={fields} errors={errors} onChange={handleChange} />
            </TabsContent>
            <TabsContent value="media" className="mt-0">
              <ProjectMedia fields={fields} errors={errors} onChange={handleChange} />
            </TabsContent>
            <TabsContent value="seo" className="mt-0">
              <ProjectSeo fields={fields} errors={errors} onChange={handleChange} />
            </TabsContent>
            <TabsContent value="publishing" className="mt-0">
              <ProjectPublishing fields={fields} errors={errors} onChange={handleChange} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="border-border/40 bg-card flex items-center justify-between rounded-lg border px-5 py-4">
        <ProjectFormActions
          mode={mode}
          saving={saving}
          hasChanges={hasChanges}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          onDelete={mode === "edit" ? () => setShowDeleteConfirm(true) : undefined}
          onCancel={handleCancel}
        />
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete project"
        description={`Are you sure you want to delete "${project?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
