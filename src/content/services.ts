import type { LucideIcon } from "lucide-react"
import { Bot, Workflow, Cable, FileText, Building2, Cpu } from "lucide-react"

export interface Service {
  id: string
  title: string
  description: string
  icon: LucideIcon
  features: string[]
  order: number
  cta?: string
}

export const services: Service[] = [
  {
    id: "ai-agents",
    title: "AI Agents & Intelligent Assistants",
    description:
      "Build AI-powered assistants that understand requests, make decisions, and automate complex tasks across business operations.",
    icon: Bot,
    features: [
      "Custom AI agent development",
      "Decision-making workflows",
      "Multi-step task automation",
      "Natural language interfaces",
    ],
    order: 1,
  },
  {
    id: "workflow-automation",
    title: "Workflow Automation with n8n",
    description:
      "Design reliable automation workflows that connect your tools, move data automatically, and eliminate repetitive manual processes.",
    icon: Workflow,
    features: [
      "End-to-end workflow design",
      "Tool and API integrations",
      "Conditional logic branches",
      "Error handling and retries",
    ],
    order: 2,
  },
  {
    id: "api-integration",
    title: "API & System Integration",
    description:
      "Connect different platforms, databases, and services to create seamless automated ecosystems.",
    icon: Cable,
    features: [
      "REST and webhook integrations",
      "Database synchronization",
      "Legacy system connections",
      "Real-time data pipelines",
    ],
    order: 3,
  },
  {
    id: "document-intelligence",
    title: "Document Intelligence Systems",
    description:
      "Extract, classify, analyze, and process documents using AI-powered automation pipelines.",
    icon: FileText,
    features: [
      "PDF and document parsing",
      "Intelligent data extraction",
      "Document classification",
      "Automated validation",
    ],
    order: 4,
  },
  {
    id: "business-process",
    title: "Business Process Automation",
    description:
      "Transform slow manual processes into efficient, scalable systems that save time and reduce errors.",
    icon: Building2,
    features: [
      "Process mapping and analysis",
      "Automation opportunity identification",
      "Scalable system architecture",
      "Performance monitoring",
    ],
    order: 5,
  },
  {
    id: "custom-solutions",
    title: "Custom AI Automation Solutions",
    description:
      "Build tailored automation systems based on unique business challenges and operational goals.",
    icon: Cpu,
    features: [
      "Custom workflow engineering",
      "AI model integration",
      "Business-specific solutions",
      "End-to-end implementation",
    ],
    order: 6,
  },
]
