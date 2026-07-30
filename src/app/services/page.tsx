import type { Metadata } from "next"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Services",
  description:
    "AI automation services including AI agents, n8n workflow automation, API integration, document intelligence, and custom AI solutions for businesses.",
  openGraph: {
    title: "Services | AI Automation Solutions",
    description:
      "AI agents, n8n workflow automation, API integration, and custom AI solutions to eliminate repetitive work and scale your business.",
    url: "https://azhar.dev/services",
  },
  twitter: {
    title: "Services | AI Automation Solutions",
    description:
      "AI agents, n8n workflow automation, API integration, and custom AI solutions.",
  },
  alternates: { canonical: "https://azhar.dev/services" },
}

const services = [
  {
    title: "AI Agents & Intelligent Assistants",
    description:
      "Build AI-powered assistants that understand requests, make decisions, and automate complex tasks across business operations.",
    items: [
      "Custom AI agent development",
      "Decision-making workflows",
      "Multi-step task automation",
      "Natural language interfaces",
    ],
  },
  {
    title: "Workflow Automation with n8n",
    description:
      "Design reliable automation workflows that connect your tools, move data automatically, and eliminate repetitive manual processes.",
    items: [
      "End-to-end workflow design",
      "Tool and API integrations",
      "Conditional logic branches",
      "Error handling and retries",
    ],
  },
  {
    title: "API & System Integration",
    description:
      "Connect different platforms, databases, and services to create seamless automated ecosystems.",
    items: [
      "REST and webhook integrations",
      "Database synchronization",
      "Legacy system connections",
      "Real-time data pipelines",
    ],
  },
  {
    title: "Document Intelligence Systems",
    description:
      "Extract, classify, analyze, and process documents using AI-powered automation pipelines.",
    items: [
      "PDF and document parsing",
      "Intelligent data extraction",
      "Document classification",
      "Automated validation",
    ],
  },
  {
    title: "Business Process Automation",
    description:
      "Transform slow manual processes into efficient, scalable systems that save time and reduce errors.",
    items: [
      "Process mapping and analysis",
      "Automation opportunity identification",
      "Scalable system architecture",
      "Performance monitoring",
    ],
  },
  {
    title: "Custom AI Automation Solutions",
    description:
      "Build tailored automation systems based on unique business challenges and operational goals.",
    items: [
      "Custom workflow engineering",
      "AI model integration",
      "Business-specific solutions",
      "End-to-end implementation",
    ],
  },
]

export default function ServicesPage() {
  return (
    <div className="pt-24 md:pt-32">
      <section className="border-b border-border/40 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 gap-1.5 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Services
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              What I build.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Intelligent automation systems designed around real business needs.
              From AI agents to workflow orchestration, I build scalable solutions
              that reduce manual effort and improve efficiency.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.title} className="transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <CardDescription className="mt-2 text-sm">{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-16 flex justify-center">
            <Button size="lg" className="gap-2">
              Book a Free 15-Min Audit
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
