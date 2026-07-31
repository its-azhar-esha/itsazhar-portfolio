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
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";
import type { SiteSettings } from "@/types/settings";

interface SettingsFormProps {
  initial: SiteSettings;
}

function toFormValues(settings: SiteSettings) {
  return {
    site_name: settings.site_name,
    tagline: settings.tagline,
    location: settings.location,
    contact_email: settings.contact_email,
    contact_phone: settings.contact_phone ?? "",
    social_github: settings.social_github ?? "",
    social_linkedin: settings.social_linkedin ?? "",
    social_twitter: settings.social_twitter ?? "",
    social_fiverr: settings.social_fiverr ?? "",
    footer_text: settings.footer_text,
    maintenance_mode: settings.maintenance_mode,
    show_ai_chat: settings.show_ai_chat,
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
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const messageTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasChanges = React.useMemo(
    () => JSON.stringify(fields) !== JSON.stringify(defaultValues),
    [fields, defaultValues],
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

  function handleChange(partial: Partial<FormValues>) {
    setFields((prev) => ({ ...prev, ...partial }));
    if (message) setMessage(null);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const parsed = siteSettingsSchema.safeParse(fields);
      if (!parsed.success) {
        showMessage("error", parsed.error.issues.map((i) => i.message).join("; "));
        return;
      }
      const result = await saveSiteSettingsAction(parsed.data);
      if (!result.success) {
        showMessage("error", result.error);
        return;
      }
      showMessage("success", "Site settings saved successfully.");
    } finally {
      setSaving(false);
    }
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

      <SectionCard title="Site Identity" description="Name and tagline used across the site.">
        <div className="grid gap-4 sm:grid-cols-2">
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

      <SectionCard title="Toggles" description="Global site behavior switches.">
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
          <ToggleRow
            label="Featured Projects Section"
            description="Show the featured projects (case studies) section on the homepage."
            checked={fields.featured_projects_enabled}
            onCheckedChange={(v) => handleChange({ featured_projects_enabled: v })}
          />
          <ToggleRow
            label="Featured Services Section"
            description="Show the featured services section on the homepage."
            checked={fields.featured_services_enabled}
            onCheckedChange={(v) => handleChange({ featured_services_enabled: v })}
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
