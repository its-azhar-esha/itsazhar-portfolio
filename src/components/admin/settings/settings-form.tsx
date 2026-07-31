"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { saveSiteSettingsAction } from "@/lib/settings/actions";
import { siteSettingsSchema } from "@/lib/validation";
import { useToast } from "@/components/ui/toast";
import { MediaField } from "@/components/media/media-field";
import { Loader2, Save } from "lucide-react";
import type { SiteSettings } from "@/types/settings";

interface SettingsFormProps {
  initial: SiteSettings;
}

function toFormValues(settings: SiteSettings) {
  return {
    site_name: settings.site_name,
    site_title: settings.site_title,
    site_description: settings.site_description,
    tagline: settings.tagline,
    logo: settings.logo ?? "",
    location: settings.location,
    contact_email: settings.contact_email,
    contact_phone: settings.contact_phone ?? "",
    booking_url: settings.booking_url ?? "",
    social_github: settings.social_github ?? "",
    social_linkedin: settings.social_linkedin ?? "",
    social_twitter: settings.social_twitter ?? "",
    social_fiverr: settings.social_fiverr ?? "",
    social_instagram: settings.social_instagram ?? "",
    social_youtube: settings.social_youtube ?? "",
    footer_text: settings.footer_text,
    maintenance_mode: settings.maintenance_mode,
    show_ai_chat: settings.show_ai_chat,
    show_hero: settings.show_hero,
    show_showcase: settings.show_showcase,
    show_services: settings.show_services,
    show_case_studies: settings.show_case_studies,
    show_about: settings.show_about,
    show_testimonials: settings.show_testimonials,
    show_contact: settings.show_contact,
    show_blog: settings.show_blog,
    show_hub: settings.show_hub,
    show_playground: settings.show_playground,
    featured_projects_enabled: settings.featured_projects_enabled,
    featured_services_enabled: settings.featured_services_enabled,
    ga4_measurement_id: settings.ga4_measurement_id ?? "",
    gtm_id: settings.gtm_id ?? "",
    clarity_project_id: settings.clarity_project_id ?? "",
  };
}

type FormValues = ReturnType<typeof toFormValues>;

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

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function SettingsForm({ initial }: SettingsFormProps) {
  const defaultValues = React.useMemo(() => toFormValues(initial), [initial]);
  const [fields, setFields] = React.useState<FormValues>(defaultValues);
  const [saving, setSaving] = React.useState(false);
  const toast = useToast();

  const hasChanges = React.useMemo(
    () => JSON.stringify(fields) !== JSON.stringify(defaultValues),
    [fields, defaultValues],
  );

  function handleChange(partial: Partial<FormValues>) {
    setFields((prev) => ({ ...prev, ...partial }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const parsed = siteSettingsSchema.safeParse(fields);
      if (!parsed.success) {
        toast.error(parsed.error.issues.map((i) => i.message).join("; "));
        return;
      }
      const result = await saveSiteSettingsAction(parsed.data);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Site settings saved successfully.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Site Identity"
        description="Name, logo and default SEO values used across the site."
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Site Title" hint="Browser tab title and default SEO title.">
              <Input
                value={fields.site_title}
                onChange={(e) => handleChange({ site_title: e.target.value })}
                placeholder="Azhar — AI Automation Specialist"
              />
            </Field>
            <Field label="Site Name">
              <Input
                value={fields.site_name}
                onChange={(e) => handleChange({ site_name: e.target.value })}
                placeholder="Azhar"
              />
            </Field>
            <Field label="Tagline">
              <Input
                value={fields.tagline}
                onChange={(e) => handleChange({ tagline: e.target.value })}
                placeholder="AI Automation Specialist"
              />
            </Field>
            <Field label="Location">
              <Input
                value={fields.location}
                onChange={(e) => handleChange({ location: e.target.value })}
                placeholder="Remote, Worldwide"
              />
            </Field>
          </div>
          <Field
            label="Logo"
            hint="Shown in the navbar and footer. Upload to the media library or paste a URL."
          >
            <MediaField
              value={fields.logo}
              onChange={(value) => handleChange({ logo: value ?? "" })}
              previewClassName="h-12 w-12 rounded-lg"
            />
          </Field>
          <Field label="Default Meta Description" hint="Used when a page has no SEO description.">
            <Textarea
              value={fields.site_description}
              onChange={(e) => handleChange({ site_description: e.target.value })}
              className="min-h-[60px]"
              placeholder="AI Automation Specialist building intelligent agents, workflows and integrations."
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Contact" description="Contact details shown on the contact page.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email">
            <Input
              type="email"
              value={fields.contact_email}
              onChange={(e) => handleChange({ contact_email: e.target.value })}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Phone" hint="Optional. Leave blank to hide.">
            <Input
              value={fields.contact_phone}
              onChange={(e) => handleChange({ contact_phone: e.target.value })}
              placeholder="+880 1234 567890"
            />
          </Field>
          <Field
            label="Booking URL"
            hint="Used by the 'Book a Free Audit' buttons. Leave blank to link to the contact page."
          >
            <Input
              value={fields.booking_url}
              onChange={(e) => handleChange({ booking_url: e.target.value })}
              placeholder="https://calendly.com/..."
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="Social Links"
        description="Profile URLs shown in the footer and contact page."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="GitHub">
            <Input
              value={fields.social_github}
              onChange={(e) => handleChange({ social_github: e.target.value })}
              placeholder="https://github.com/..."
            />
          </Field>
          <Field label="LinkedIn">
            <Input
              value={fields.social_linkedin}
              onChange={(e) => handleChange({ social_linkedin: e.target.value })}
              placeholder="https://linkedin.com/in/..."
            />
          </Field>
          <Field label="X / Twitter">
            <Input
              value={fields.social_twitter}
              onChange={(e) => handleChange({ social_twitter: e.target.value })}
              placeholder="https://x.com/..."
            />
          </Field>
          <Field label="Fiverr">
            <Input
              value={fields.social_fiverr}
              onChange={(e) => handleChange({ social_fiverr: e.target.value })}
              placeholder="https://fiverr.com/..."
            />
          </Field>
          <Field label="Instagram">
            <Input
              value={fields.social_instagram}
              onChange={(e) => handleChange({ social_instagram: e.target.value })}
              placeholder="https://instagram.com/..."
            />
          </Field>
          <Field label="YouTube">
            <Input
              value={fields.social_youtube}
              onChange={(e) => handleChange({ social_youtube: e.target.value })}
              placeholder="https://youtube.com/@..."
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Content" description="Footer text shown site-wide.">
        <Field label="Footer Text">
          <Textarea
            value={fields.footer_text}
            onChange={(e) => handleChange({ footer_text: e.target.value })}
            className="min-h-[60px]"
            placeholder="© 2026 Azhar (itsazhar.com). All rights reserved."
          />
        </Field>
      </SectionCard>

      <SectionCard title="Global Settings" description="Global site behavior switches.">
        <div className="divide-border/40 divide-y">
          <ToggleRow
            label="Maintenance Mode"
            description="Shows a maintenance screen on public pages. Admin panel stays accessible."
            checked={fields.maintenance_mode}
            onCheckedChange={(v) => handleChange({ maintenance_mode: v })}
          />
          <ToggleRow
            label="AI Chat Assistant"
            description="Show the AI chat button on the public site."
            checked={fields.show_ai_chat}
            onCheckedChange={(v) => handleChange({ show_ai_chat: v })}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Page Sections"
        description="Show or hide each section on the public homepage. Off sections also show an Off badge in the sidebar."
      >
        <div className="divide-border/40 divide-y">
          <ToggleRow
            label="Hero Section"
            description="Intro banner with headline and CTA."
            checked={fields.show_hero}
            onCheckedChange={(v) => handleChange({ show_hero: v })}
          />
          <ToggleRow
            label="Showcase Section"
            description="Featured projects showcase."
            checked={fields.show_showcase}
            onCheckedChange={(v) => handleChange({ show_showcase: v })}
          />
          <ToggleRow
            label="Services Section"
            description="AI services grid."
            checked={fields.show_services}
            onCheckedChange={(v) => handleChange({ show_services: v })}
          />
          <ToggleRow
            label="Case Studies Section"
            description="From manual to automated — case study cards."
            checked={fields.show_case_studies}
            onCheckedChange={(v) => handleChange({ show_case_studies: v })}
          />
          <ToggleRow
            label="About Section"
            description="About / bio section."
            checked={fields.show_about}
            onCheckedChange={(v) => handleChange({ show_about: v })}
          />
          <ToggleRow
            label="Testimonials Section"
            description="Animated testimonial carousel."
            checked={fields.show_testimonials}
            onCheckedChange={(v) => handleChange({ show_testimonials: v })}
          />
          <ToggleRow
            label="Contact Section"
            description="Contact form and details."
            checked={fields.show_contact}
            onCheckedChange={(v) => handleChange({ show_contact: v })}
          />
          <ToggleRow
            label="Blog"
            description="Show the blog in navigation and enable the blog module."
            checked={fields.show_blog}
            onCheckedChange={(v) => handleChange({ show_blog: v })}
          />
          <ToggleRow
            label="Automation Hub"
            description="Show the resource library (/hub) in navigation and enable the hub module."
            checked={fields.show_hub}
            onCheckedChange={(v) => handleChange({ show_hub: v })}
          />
          <ToggleRow
            label="Workflow Playground"
            description="Show the playground (/playground) in navigation and enable the playground module."
            checked={fields.show_playground}
            onCheckedChange={(v) => handleChange({ show_playground: v })}
          />
        </div>
      </SectionCard>

      <SectionCard title="Analytics" description="Tracking IDs. Leave blank to disable.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="GA4 Measurement ID" hint="Format: G-XXXXXXXXXX">
            <Input
              value={fields.ga4_measurement_id}
              onChange={(e) => handleChange({ ga4_measurement_id: e.target.value })}
              placeholder="G-XXXXXXXXXX"
            />
          </Field>
          <Field label="Google Tag Manager ID" hint="Format: GTM-XXXXXXX">
            <Input
              value={fields.gtm_id}
              onChange={(e) => handleChange({ gtm_id: e.target.value })}
              placeholder="GTM-XXXXXXX"
            />
          </Field>
          <Field label="Clarity Project ID">
            <Input
              value={fields.clarity_project_id}
              onChange={(e) => handleChange({ clarity_project_id: e.target.value })}
              placeholder="Clarity project ID"
            />
          </Field>
        </div>
      </SectionCard>

      <div className="border-border/40 bg-card flex items-center justify-between rounded-lg border px-5 py-4">
        <Button
          variant="default"
          size="sm"
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </Button>
        {hasChanges && !saving && <span className="text-xs text-amber-500">Unsaved changes</span>}
      </div>
    </div>
  );
}
