import type { Metadata } from "next";
import { Check, Sparkles, Clock, MapPin, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialLinks } from "@/components/social-links";
import { LeadForm } from "@/components/lead-form";
import { getPageMetadata } from "@/lib/seo";
import { getPublicSiteSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("contact");
}

const benefits = [
  "Identify repetitive tasks",
  "Find automation opportunities",
  "Get actionable recommendations",
  "No charge",
  "No obligation",
];

export default async function ContactPage() {
  const settings = await getPublicSiteSettings();

  return (
    <div className="pt-24 md:pt-32">
      <section className="border-border/40 border-b py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 gap-1.5 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Let&apos;s work together
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Let&apos;s automate something.
            </h1>
            <p className="text-muted-foreground mt-6 text-lg">
              Have a repetitive process slowing your business down? Book a free 15-minute automation
              audit. I&apos;ll review your workflow, identify automation opportunities, and suggest
              the right approach — with no pressure and no obligation.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <Card className="border-primary/20 from-card to-background hover:shadow-primary/5 h-full bg-gradient-to-b transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <Badge variant="secondary" className="mb-2 w-fit">
                    Free
                  </Badge>
                  <CardTitle className="text-xl">Free Automation Audit</CardTitle>
                  <CardDescription>
                    15-minute call to discover automation opportunities in your business workflow.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {benefits.map((benefit) => (
                      <li
                        key={benefit}
                        className="text-muted-foreground flex items-center gap-2 text-sm"
                      >
                        <Check className="text-primary h-4 w-4 shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4">
                    <LeadForm />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Find me on</CardTitle>
                </CardHeader>
                <CardContent>
                  <SocialLinks />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <MapPin className="text-primary h-4 w-4 shrink-0" />
                    {settings.location}
                  </div>
                  {settings.contact_email ? (
                    <a
                      href={`mailto:${settings.contact_email}`}
                      className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
                    >
                      <Mail className="text-primary h-4 w-4 shrink-0" />
                      {settings.contact_email}
                    </a>
                  ) : null}
                  {settings.contact_phone ? (
                    <a
                      href={`tel:${settings.contact_phone}`}
                      className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
                    >
                      <Phone className="text-primary h-4 w-4 shrink-0" />
                      {settings.contact_phone}
                    </a>
                  ) : null}
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Clock className="text-primary h-4 w-4 shrink-0" />
                    Response Time: Within 24 Hours
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
