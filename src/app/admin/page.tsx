import {
  ArrowRight,
  FolderKanban,
  ImageIcon,
  Sparkles,
  FileText,
  Settings,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getProjects } from "@/lib/projects";
import { getServices } from "@/lib/services";
import { getLeadStats } from "@/lib/leads";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [projectsResult, servicesResult, leadsResult] = await Promise.all([
    getProjects({ page: 1, pageSize: 1 }),
    getServices(),
    getLeadStats(),
  ]);

  const projectCount = projectsResult.success ? projectsResult.data.pagination.total : 0;
  const serviceCount = servicesResult.success ? servicesResult.data.length : 0;
  const leadStats = leadsResult.success ? leadsResult.data : null;
  const projectError = projectsResult.success ? null : projectsResult.error;
  const serviceError = servicesResult.success ? null : servicesResult.error;
  const leadError = leadsResult.success ? null : leadsResult.error;

  const stats = [
    {
      label: "Total Projects",
      value: String(projectCount),
      change: projectError ? `Error: ${projectError}` : "Across all statuses",
    },
    {
      label: "Services",
      value: String(serviceCount),
      change: serviceError ? `Error: ${serviceError}` : "All statuses",
    },
    {
      label: "New Leads",
      value: leadStats ? String(leadStats.new) : "0",
      change: leadError ? `Error: ${leadError}` : `${leadStats?.total ?? 0} total captured`,
    },
    { label: "AI Conversations", value: "—", change: "Waiting for data" },
  ];

  const quickActions = [
    {
      label: "View Leads",
      href: "/admin/leads",
      icon: Users,
      desc: "Review audit requests from visitors",
    },
    {
      label: "Manage Projects",
      href: "/admin/projects",
      icon: FolderKanban,
      desc: "Add or update portfolio projects",
    },
    {
      label: "Upload Media",
      href: "/admin/media",
      icon: ImageIcon,
      desc: "Manage images and videos",
    },
    {
      label: "AI Assistant",
      href: "/admin/ai",
      icon: Sparkles,
      desc: "Chat with your CMS content",
    },
    {
      label: "Edit Content",
      href: "/admin/content",
      icon: FileText,
      desc: "Update site copy and pages",
    },
    { label: "Settings", href: "/admin/settings", icon: Settings, desc: "Site configuration" },
  ];

  const recentActivity = [
    {
      action: leadStats
        ? `${leadStats.total} lead${leadStats.total === 1 ? "" : "s"} captured`
        : "Leads module ready",
      detail: "Book a Free Audit submissions land here",
      time: "live",
    },
    {
      action: "Projects and services seeded",
      detail: "5 projects + 6 services now editable in the CMS",
      time: "2026-07-31",
    },
    {
      action: "CMS fully operational",
      detail: "Projects, services, SEO, media, content, settings",
      time: "2026-07-31",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <div className="space-y-8">
        <div>
          <Card className="border-border/50 from-primary/5 to-background bg-gradient-to-br">
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                Manage your portfolio, leads, projects, and site content from one place.
              </p>
            </CardHeader>
          </Card>
        </div>

        <div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="border-border/50">
                <CardHeader className="p-4">
                  <CardTitle className="text-muted-foreground text-sm font-medium">
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pt-0 pb-4">
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="group border-border/40 hover:border-primary/30 hover:bg-accent/30 flex items-start gap-3 rounded-lg border p-3 transition-all duration-200 hover:shadow-sm"
                    >
                      <div className="bg-primary/10 text-primary group-hover:bg-primary/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{action.label}</p>
                        <p className="text-muted-foreground mt-0.5 text-xs">{action.desc}</p>
                      </div>
                      <ArrowRight className="text-muted-foreground mt-1 h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="bg-primary/40 mt-1.5 h-2 w-2 rounded-full" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.action}</p>
                      <p className="text-muted-foreground text-xs">{item.detail}</p>
                    </div>
                    <p className="text-muted-foreground shrink-0 text-xs">{item.time}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
