import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Code2 } from "lucide-react";

const sections = [
  {
    key: "about",
    title: "About Page",
    description: "Manage your biography, tools, timeline, social links, and more.",
    icon: FileText,
    href: "/admin/content/about",
  },
  {
    key: "hero",
    title: "Hero Section",
    description: "Edit the homepage hero — headline, actions, metrics, and badges.",
    icon: Code2,
    href: "/admin/content/hero",
  },
];

export default function AdminContentPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Content</h2>
        <p className="text-muted-foreground mt-1 text-sm">Manage site copy, pages, and sections.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.key} href={section.href}>
              <Card className="border-border/50 hover:border-primary/30 hover:shadow-primary/5 cursor-pointer transition-all duration-200 hover:shadow-md">
                <CardHeader className="flex flex-row items-center gap-3 pb-3">
                  <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">{section.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {section.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
