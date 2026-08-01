"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MediaField } from "@/components/media/media-field";
import { saveHeroContentAction } from "@/lib/hero/actions";
import { AlertCircle, CheckCircle2, Loader2, Save, X } from "lucide-react";
import type { HeroContent } from "@/types/hero";

interface HeroEditorProps {
  initial: HeroContent | null;
}

interface FormState {
  headline: string;
  highlight: string;
  subheadline: string;
  availability: string;
  location: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  badges: string;
  backgroundImage: string;
  backgroundVideo: string;
  seoTitle: string;
  seoDescription: string;
}

function contentToForm(content: HeroContent): FormState {
  return {
    headline: content.basic.headline,
    highlight: content.basic.highlight,
    subheadline: content.basic.subheadline,
    availability: content.basic.availability,
    location: content.basic.location,
    primaryLabel: content.actions.primary.label,
    primaryHref: content.actions.primary.href,
    secondaryLabel: content.actions.secondary.label,
    secondaryHref: content.actions.secondary.href,
    badges: content.badges.join(", "),
    backgroundImage: content.background.image,
    backgroundVideo: content.background.video,
    seoTitle: content.seo.title,
    seoDescription: content.seo.description,
  };
}

function formToContent(form: FormState): Record<string, unknown> {
  return {
    basic: {
      headline: form.headline,
      highlight: form.highlight,
      subheadline: form.subheadline,
      availability: form.availability,
      location: form.location,
    },
    actions: {
      primary: { label: form.primaryLabel, href: form.primaryHref },
      secondary: { label: form.secondaryLabel, href: form.secondaryHref },
    },
    badges: form.badges
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean),
    background: {
      image: form.backgroundImage,
      video: form.backgroundVideo,
    },
    seo: {
      title: form.seoTitle,
      description: form.seoDescription,
    },
  };
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

export function HeroEditor({ initial }: HeroEditorProps) {
  const router = useRouter();
  const defaultContent = React.useMemo(
    () =>
      contentToForm(
        initial ?? {
          basic: { headline: "", highlight: "", subheadline: "", availability: "", location: "" },
          actions: { primary: { label: "", href: "" }, secondary: { label: "", href: "" } },
          badges: [],
          background: { image: "", video: "" },
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

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const data = formToContent(fields);
      const result = await saveHeroContentAction(data);
      if (!result.success) {
        showMessage("error", result.error);
        return;
      }
      showMessage("success", "Hero content saved successfully.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push("/admin/content");
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
          <CardTitle className="text-base">Hero Section Editor</CardTitle>
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
                value="actions"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm data-[state=active]:shadow-none"
              >
                Actions
              </TabsTrigger>
              <TabsTrigger
                value="badges"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm data-[state=active]:shadow-none"
              >
                Badges
              </TabsTrigger>
              <TabsTrigger
                value="background"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm data-[state=active]:shadow-none"
              >
                Background
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
                title="Hero Content"
                description="The main headline, highlight, and subheadline shown at the top of the homepage."
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="headline">Headline</Label>
                    <Input
                      id="headline"
                      value={fields.headline}
                      onChange={(e) => handleChange({ headline: e.target.value })}
                      placeholder="Automate anything."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="highlight">Highlight</Label>
                    <Input
                      id="highlight"
                      value={fields.highlight}
                      onChange={(e) => handleChange({ highlight: e.target.value })}
                      placeholder="Scale everything."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subheadline">Subheadline</Label>
                    <Textarea
                      id="subheadline"
                      value={fields.subheadline}
                      onChange={(e) => handleChange({ subheadline: e.target.value })}
                      className="min-h-[80px]"
                      placeholder="I design and build intelligent automation systems..."
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="availability">Availability Badge</Label>
                      <Input
                        id="availability"
                        value={fields.availability}
                        onChange={(e) => handleChange({ availability: e.target.value })}
                        placeholder="Available for Automation Projects"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={fields.location}
                        onChange={(e) => handleChange({ location: e.target.value })}
                        placeholder="Bangladesh (optional)"
                      />
                    </div>
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="actions" className="mt-0 space-y-5">
              <SectionCard title="Primary Action" description="The main call-to-action button.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="primaryLabel">Label</Label>
                    <Input
                      id="primaryLabel"
                      value={fields.primaryLabel}
                      onChange={(e) => handleChange({ primaryLabel: e.target.value })}
                      placeholder="Book a Free 15-Min Audit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primaryHref">URL</Label>
                    <Input
                      id="primaryHref"
                      value={fields.primaryHref}
                      onChange={(e) => handleChange({ primaryHref: e.target.value })}
                      placeholder="/contact"
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Secondary Action"
                description="The secondary call-to-action button."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="secondaryLabel">Label</Label>
                    <Input
                      id="secondaryLabel"
                      value={fields.secondaryLabel}
                      onChange={(e) => handleChange({ secondaryLabel: e.target.value })}
                      placeholder="View Projects"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryHref">URL</Label>
                    <Input
                      id="secondaryHref"
                      value={fields.secondaryHref}
                      onChange={(e) => handleChange({ secondaryHref: e.target.value })}
                      placeholder="/projects"
                    />
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="badges" className="mt-0 space-y-5">
              <SectionCard title="Badges" description="Trust badges shown below the CTA buttons.">
                <div className="space-y-2">
                  <Textarea
                    value={fields.badges}
                    onChange={(e) => handleChange({ badges: e.target.value })}
                    className="min-h-[60px]"
                    placeholder="AI Agents, n8n, APIs, Workflow Automation, Business Systems"
                  />
                  <p className="text-muted-foreground text-xs">
                    Comma-separated list of trust badges.
                  </p>
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="background" className="mt-0 space-y-5">
              <SectionCard
                title="Background Media"
                description="Optional background image or video for the hero section."
              >
                <div className="space-y-4">
                  <MediaField
                    label="Background Image"
                    description="Hero section background image."
                    value={fields.backgroundImage}
                    onChange={(value) => handleChange({ backgroundImage: value ?? "" })}
                  />
                  <div className="space-y-2">
                    <Label>Background Video</Label>
                    <Input
                      value={fields.backgroundVideo}
                      onChange={(e) => handleChange({ backgroundVideo: e.target.value })}
                      placeholder="/hero-bg.mp4"
                    />
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="seo" className="mt-0 space-y-5">
              <SectionCard
                title="SEO"
                description="Search engine optimization metadata for the homepage."
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="seoTitle">SEO Title</Label>
                    <Input
                      id="seoTitle"
                      value={fields.seoTitle}
                      onChange={(e) => handleChange({ seoTitle: e.target.value })}
                      placeholder="AI Automation & Intelligent Systems"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seoDescription">SEO Description</Label>
                    <Textarea
                      id="seoDescription"
                      value={fields.seoDescription}
                      onChange={(e) => handleChange({ seoDescription: e.target.value })}
                      className="min-h-[80px]"
                      placeholder="I design and build intelligent automation systems..."
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
    </div>
  );
}
