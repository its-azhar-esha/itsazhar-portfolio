"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MediaPicker } from "@/components/admin/media/media-picker";
import { saveAboutContentAction } from "@/lib/about/actions";
import { AlertCircle, CheckCircle2, ImageIcon, Loader2, Save, X } from "lucide-react";
import type { AboutContent } from "@/types/about";

interface AboutEditorProps {
  initial: AboutContent | null;
}

interface FormState {
  name: string;
  title: string;
  tagline: string;
  profileImage: string;
  introVideoUrl: string;
  headline: string;
  paragraphs: string;
  missionStatement: string;
  visionStatement: string;
  roles: string;
  buildSteps: string;
  timeline: string;
  principles: string;
  tools: string;
  industries: string;
  socialLinks: string;
  resumeLabel: string;
  resumeUrl: string;
  seoTitle: string;
  seoDescription: string;
}

function contentToForm(content: AboutContent): FormState {
  return {
    name: content.basic.name,
    title: content.basic.title,
    tagline: content.basic.tagline,
    profileImage: content.basic.profileImage,
    introVideoUrl: content.basic.introVideoUrl,
    headline: content.biography.headline,
    paragraphs: content.biography.paragraphs.join("\n\n"),
    missionStatement: content.biography.missionStatement,
    visionStatement: content.biography.visionStatement,
    roles: content.biography.roles.join(", "),
    buildSteps: JSON.stringify(content.buildSteps, null, 2),
    timeline: JSON.stringify(content.timeline, null, 2),
    principles: JSON.stringify(content.principles, null, 2),
    tools: JSON.stringify(content.tools, null, 2),
    industries: content.industries.join(", "),
    socialLinks: JSON.stringify(content.socialLinks, null, 2),
    resumeLabel: content.resume.label,
    resumeUrl: content.resume.url,
    seoTitle: content.seo.title,
    seoDescription: content.seo.description,
  };
}

function formToContent(form: FormState): Record<string, unknown> {
  return {
    basic: {
      name: form.name,
      title: form.title,
      tagline: form.tagline,
      profileImage: form.profileImage,
      introVideoUrl: form.introVideoUrl,
    },
    biography: {
      headline: form.headline,
      paragraphs: form.paragraphs.split("\n\n").filter(Boolean),
      missionStatement: form.missionStatement,
      visionStatement: form.visionStatement,
      roles: form.roles
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean),
    },
    buildSteps: safeParseJson(form.buildSteps, []),
    timeline: safeParseJson(form.timeline, []),
    principles: safeParseJson(form.principles, []),
    tools: safeParseJson(form.tools, []),
    industries: form.industries
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean),
    socialLinks: safeParseJson(form.socialLinks, []),
    resume: {
      label: form.resumeLabel,
      url: form.resumeUrl,
    },
    seo: {
      title: form.seoTitle,
      description: form.seoDescription,
    },
  };
}

function safeParseJson(value: string, fallback: unknown): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="border-border/40 border-b pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {description && <p className="text-muted-foreground text-xs">{description}</p>}
      </CardHeader>
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}

function JsonTextarea({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[120px] font-mono text-xs"
        spellCheck={false}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function AboutEditor({ initial }: AboutEditorProps) {
  const router = useRouter();
  const defaultContent = React.useMemo(
    () =>
      contentToForm(
        initial ?? {
          basic: { name: "", title: "", tagline: "", profileImage: "", introVideoUrl: "" },
          biography: {
            headline: "",
            paragraphs: [],
            missionStatement: "",
            visionStatement: "",
            roles: [],
          },
          buildSteps: [],
          tools: [],
          industries: [],
          timeline: [],
          principles: [],
          socialLinks: [],
          resume: { label: "Download Resume", url: "" },
          seo: { title: "", description: "" },
        },
      ),
    [initial],
  );

  const [fields, setFields] = React.useState<FormState>(defaultContent);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [jsonErrors, setJsonErrors] = React.useState<Record<string, string>>({});
  const [mediaPickerOpen, setMediaPickerOpen] = React.useState(false);
  const messageTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasChanges = React.useMemo(
    () => JSON.stringify(fields) !== JSON.stringify(defaultContent),
    [fields, defaultContent],
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

  function handleChange(partial: Partial<FormState>) {
    setFields((prev) => ({ ...prev, ...partial }));
    if (message) setMessage(null);
  }

  function validateJson(): boolean {
    const errors: Record<string, string> = {};
    const jsonFields: Array<{ key: keyof FormState; label: string }> = [
      { key: "buildSteps", label: "Build Steps" },
      { key: "timeline", label: "Timeline" },
      { key: "principles", label: "Principles" },
      { key: "tools", label: "Tools" },
      { key: "socialLinks", label: "Social Links" },
    ];
    for (const { key, label } of jsonFields) {
      try {
        const parsed = JSON.parse(fields[key]);
        if (!Array.isArray(parsed)) {
          errors[key] = `${label} must be a JSON array`;
        }
      } catch {
        errors[key] = `${label} contains invalid JSON`;
      }
    }
    setJsonErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (!validateJson()) {
      showMessage("error", "Please fix the JSON errors before saving.");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const data = formToContent(fields);
      const result = await saveAboutContentAction(data);
      if (!result.success) {
        showMessage("error", result.error);
        return;
      }
      showMessage("success", "About content saved successfully.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push("/admin");
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
        <CardHeader className="border-border/40 border-b pb-4">
          <CardTitle className="text-base">About Page Editor</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="mb-6 inline-flex h-auto flex-wrap gap-1 bg-transparent p-0">
              <TabsTrigger
                value="basic"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm data-[state=active]:shadow-none"
              >
                Basic
              </TabsTrigger>
              <TabsTrigger
                value="biography"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm data-[state=active]:shadow-none"
              >
                Biography
              </TabsTrigger>
              <TabsTrigger
                value="sections"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm data-[state=active]:shadow-none"
              >
                Sections
              </TabsTrigger>
              <TabsTrigger
                value="meta"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm data-[state=active]:shadow-none"
              >
                Tools & Social
              </TabsTrigger>
              <TabsTrigger
                value="seo"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm data-[state=active]:shadow-none"
              >
                SEO
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-0 space-y-5">
              <SectionCard
                title="Personal Info"
                description="Your name, title, and tagline shown at the top of the About page."
              >
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={fields.name}
                        onChange={(e) => handleChange({ name: e.target.value })}
                        placeholder="Azhar"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={fields.title}
                        onChange={(e) => handleChange({ title: e.target.value })}
                        placeholder="AI Automation Specialist"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={fields.tagline}
                      onChange={(e) => handleChange({ tagline: e.target.value })}
                      placeholder="About Me"
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Media"
                description="Profile image and intro video for the About page."
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Profile Image</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        value={fields.profileImage}
                        onChange={(e) => handleChange({ profileImage: e.target.value })}
                        placeholder="/images/profile.jpg"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setMediaPickerOpen(true)}
                        className="shrink-0 gap-2"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Browse
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="introVideoUrl">Intro Video URL</Label>
                    <Input
                      id="introVideoUrl"
                      value={fields.introVideoUrl}
                      onChange={(e) => handleChange({ introVideoUrl: e.target.value })}
                      placeholder="/intro.mp4"
                    />
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="biography" className="mt-0 space-y-5">
              <SectionCard
                title="Biography"
                description="The main narrative section of your About page."
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="headline">Headline</Label>
                    <Textarea
                      id="headline"
                      value={fields.headline}
                      onChange={(e) => handleChange({ headline: e.target.value })}
                      className="min-h-[60px]"
                      placeholder="I build intelligent automation systems..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paragraphs">Paragraphs</Label>
                    <Textarea
                      id="paragraphs"
                      value={fields.paragraphs}
                      onChange={(e) => handleChange({ paragraphs: e.target.value })}
                      className="min-h-[120px]"
                      placeholder="Separate paragraphs with a blank line."
                    />
                    <p className="text-muted-foreground text-xs">
                      Separate paragraphs with a blank line.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="missionStatement">Mission Statement</Label>
                      <Textarea
                        id="missionStatement"
                        value={fields.missionStatement}
                        onChange={(e) => handleChange({ missionStatement: e.target.value })}
                        className="min-h-[60px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="visionStatement">Vision Statement</Label>
                      <Textarea
                        id="visionStatement"
                        value={fields.visionStatement}
                        onChange={(e) => handleChange({ visionStatement: e.target.value })}
                        className="min-h-[60px]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roles">Rotating Roles</Label>
                    <Textarea
                      id="roles"
                      value={fields.roles}
                      onChange={(e) => handleChange({ roles: e.target.value })}
                      placeholder="Building AI Agents, Automating Businesses, ..."
                    />
                    <p className="text-muted-foreground text-xs">
                      Comma-separated list of roles that rotate in the hero section.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="sections" className="mt-0 space-y-5">
              <SectionCard
                title="Build Steps"
                description='JSON array of build steps. Each entry: {"icon": "Search", "title": "Discovery", "description": "..."}'
              >
                <JsonTextarea
                  value={fields.buildSteps}
                  onChange={(v) => handleChange({ buildSteps: v })}
                  error={jsonErrors.buildSteps}
                />
              </SectionCard>

              <SectionCard
                title="Timeline"
                description='JSON array of timeline entries. Each entry: {"year": "2024", "title": "...", "description": "..."}'
              >
                <JsonTextarea
                  value={fields.timeline}
                  onChange={(v) => handleChange({ timeline: v })}
                  error={jsonErrors.timeline}
                />
              </SectionCard>

              <SectionCard
                title="Principles"
                description='JSON array of principles. Each entry: {"title": "...", "description": "..."}'
              >
                <JsonTextarea
                  value={fields.principles}
                  onChange={(v) => handleChange({ principles: v })}
                  error={jsonErrors.principles}
                />
              </SectionCard>
            </TabsContent>

            <TabsContent value="meta" className="mt-0 space-y-5">
              <SectionCard
                title="Tools"
                description='JSON array of tools. Each entry: {"name": "n8n", "icon": "n8n", "category": "Automation"}. Icon is optional.'
              >
                <JsonTextarea
                  value={fields.tools}
                  onChange={(v) => handleChange({ tools: v })}
                  error={jsonErrors.tools}
                />
              </SectionCard>

              <SectionCard
                title="Industries"
                description="Comma-separated list of industries served."
              >
                <div className="space-y-2">
                  <Textarea
                    value={fields.industries}
                    onChange={(e) => handleChange({ industries: e.target.value })}
                    className="min-h-[60px]"
                    placeholder="Healthcare, Finance, Logistics"
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="Social Links"
                description='JSON array of social links. Each entry: {"name": "GitHub", "username": "...", "url": "https://...", "placeholder": false}'
              >
                <JsonTextarea
                  value={fields.socialLinks}
                  onChange={(v) => handleChange({ socialLinks: v })}
                  error={jsonErrors.socialLinks}
                />
              </SectionCard>

              <SectionCard
                title="Resume"
                description="Resume download link shown in the social section."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="resumeLabel">Label</Label>
                    <Input
                      id="resumeLabel"
                      value={fields.resumeLabel}
                      onChange={(e) => handleChange({ resumeLabel: e.target.value })}
                      placeholder="Download Resume"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resumeUrl">URL</Label>
                    <Input
                      id="resumeUrl"
                      value={fields.resumeUrl}
                      onChange={(e) => handleChange({ resumeUrl: e.target.value })}
                      placeholder="https://example.com/resume.pdf"
                    />
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="seo" className="mt-0 space-y-5">
              <SectionCard
                title="SEO"
                description="Search engine optimization metadata for the About page."
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="seoTitle">SEO Title</Label>
                    <Input
                      id="seoTitle"
                      value={fields.seoTitle}
                      onChange={(e) => handleChange({ seoTitle: e.target.value })}
                      placeholder="About Me — AI Automation Specialist"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seoDescription">SEO Description</Label>
                    <Textarea
                      id="seoDescription"
                      value={fields.seoDescription}
                      onChange={(e) => handleChange({ seoDescription: e.target.value })}
                      className="min-h-[80px]"
                      placeholder="I build intelligent automation systems..."
                    />
                  </div>
                </div>
              </SectionCard>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="border-border/40 bg-card flex items-center justify-between rounded-lg border px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          {hasChanges && !saving && <span className="text-xs text-amber-500">Unsaved changes</span>}
        </div>
      </div>

      <MediaPicker
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => handleChange({ profileImage: url })}
      />
    </div>
  );
}
