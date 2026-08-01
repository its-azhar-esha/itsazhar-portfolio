"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { submitLeadAction } from "@/lib/leads/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { SharedLeadFormContent } from "@/lib/content/defaults/shared";

export function LeadForm({ content }: { content: SharedLeadFormContent }) {
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await submitLeadAction({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      message: formData.get("message"),
      source: "contact",
    });

    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error);
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        <p className="text-lg font-semibold">{content.successTitle}</p>
        <p className="text-muted-foreground text-sm">{content.successDescription}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="lead-name">{content.nameLabel}</Label>
        <Input
          id="lead-name"
          name="name"
          placeholder={content.namePlaceholder}
          required
          maxLength={200}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lead-email">{content.emailLabel}</Label>
        <Input
          id="lead-email"
          name="email"
          type="email"
          placeholder={content.emailPlaceholder}
          required
          maxLength={254}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lead-phone">{content.phoneLabel}</Label>
        <Input
          id="lead-phone"
          name="phone"
          type="tel"
          placeholder={content.phonePlaceholder}
          maxLength={50}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lead-message">{content.messageLabel}</Label>
        <Textarea
          id="lead-message"
          name="message"
          placeholder={content.messagePlaceholder}
          rows={3}
          maxLength={2000}
        />
      </div>
      {error && (
        <p className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm">{error}</p>
      )}
      <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> {content.sendingLabel}
          </>
        ) : (
          <>
            {content.submitLabel} <Send className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
