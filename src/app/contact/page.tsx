import type { Metadata } from "next";
import { ArrowRight, Check, Sparkles, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialLinks } from "@/components/social-links";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Book a free 15-minute automation audit. Let's find automation opportunities in your business workflow — no pressure, no obligation.",
  openGraph: {
    title: "Contact | Book a Free Automation Audit",
    description:
      "Book a free 15-minute automation audit. I'll review your workflow and suggest the right approach.",
    url: "https://azhar.dev/contact",
  },
  twitter: {
    title: "Contact | Book a Free Automation Audit",
    description:
      "Book a free 15-minute automation audit. I'll review your workflow and suggest the right approach.",
  },
  alternates: { canonical: "https://azhar.dev/contact" },
};

const benefits = [
  "Identify repetitive tasks",
  "Find automation opportunities",
  "Get actionable recommendations",
  "No charge",
  "No obligation",
];

export default function ContactPage() {
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
                  <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                    <Button size="lg" className="gap-2">
                      Book Free 15-Min Audit
                      <ArrowRight className="h-4 w-4" />
                    </Button>
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
                    Remote, Worldwide
                  </div>
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
