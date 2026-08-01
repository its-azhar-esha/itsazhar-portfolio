import type { DbService } from "@/types/service";

function makeService(
  data: Omit<DbService, "id" | "created_at" | "updated_at">,
  index: number,
): DbService {
  const now = new Date().toISOString();
  return {
    ...data,
    id: `mock-service-${index + 1}`,
    created_at: now,
    updated_at: now,
  };
}

export const MOCK_SERVICES: DbService[] = [
  makeService(
    {
      slug: "ai-agents-and-intelligent-assistants",
      title: "AI Agents & Intelligent Assistants",
      short_description:
        "Build AI-powered assistants that understand requests, make decisions, and automate complex tasks across business operations.",
      content: {
        highlights: [
          "Custom AI agent development",
          "Decision-making workflows",
          "Multi-step task automation",
          "Natural language interfaces",
        ],
      },
      icon: "bot",
      featured: true,
      display_order: 0,
      status: "published",
      scheduled_for: null,
      seo_title: null,
      seo_description: null,
      seo_keywords: [],
    },
    0,
  ),
  makeService(
    {
      slug: "workflow-automation-with-n8n",
      title: "Workflow Automation with n8n",
      short_description:
        "Design reliable automation workflows that connect your tools, move data automatically, and eliminate repetitive manual processes.",
      content: {
        highlights: [
          "End-to-end workflow design",
          "Tool and API integrations",
          "Conditional logic branches",
          "Error handling and retries",
        ],
      },
      icon: "workflow",
      featured: true,
      display_order: 1,
      status: "published",
      scheduled_for: null,
      seo_title: null,
      seo_description: null,
      seo_keywords: [],
    },
    1,
  ),
  makeService(
    {
      slug: "api-and-system-integration",
      title: "API & System Integration",
      short_description:
        "Connect different platforms, databases, and services to create seamless automated ecosystems.",
      content: {
        highlights: [
          "REST and webhook integrations",
          "Database synchronization",
          "Legacy system connections",
          "Real-time data pipelines",
        ],
      },
      icon: "cable",
      featured: true,
      display_order: 2,
      status: "published",
      scheduled_for: null,
      seo_title: null,
      seo_description: null,
      seo_keywords: [],
    },
    2,
  ),
  makeService(
    {
      slug: "document-intelligence-systems",
      title: "Document Intelligence Systems",
      short_description:
        "Extract, classify, analyze, and process documents using AI-powered automation pipelines.",
      content: {
        highlights: [
          "PDF and document parsing",
          "Intelligent data extraction",
          "Document classification",
          "Automated validation",
        ],
      },
      icon: "file_text",
      featured: true,
      display_order: 3,
      status: "published",
      scheduled_for: null,
      seo_title: null,
      seo_description: null,
      seo_keywords: [],
    },
    3,
  ),
  makeService(
    {
      slug: "business-process-automation",
      title: "Business Process Automation",
      short_description:
        "Transform slow manual processes into efficient, scalable systems that save time and reduce errors.",
      content: {
        highlights: [
          "Process mapping and analysis",
          "Automation opportunity identification",
          "Scalable system architecture",
          "Performance monitoring",
        ],
      },
      icon: "building2",
      featured: true,
      display_order: 4,
      status: "published",
      scheduled_for: null,
      seo_title: null,
      seo_description: null,
      seo_keywords: [],
    },
    4,
  ),
  makeService(
    {
      slug: "custom-ai-automation-solutions",
      title: "Custom AI Automation Solutions",
      short_description:
        "Build tailored automation systems based on unique business challenges and operational goals.",
      content: {
        highlights: [
          "Custom workflow engineering",
          "AI model integration",
          "Business-specific solutions",
          "End-to-end implementation",
        ],
      },
      icon: "cpu",
      featured: true,
      display_order: 5,
      status: "published",
      scheduled_for: null,
      seo_title: null,
      seo_description: null,
      seo_keywords: [],
    },
    5,
  ),
];
