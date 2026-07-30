import { Search, Layers, Cpu, Settings, Quote } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface TimelineEvent {
  year: string;
  title: string;
  description: string;
}

export interface Value {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface BuildStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface Tool {
  name: string;
  icon?: string;
  category?: string;
}

export const roles = [
  "Building AI Agents",
  "Automating Businesses",
  "Connecting Systems",
  "Saving Thousands of Hours",
  "Creating Intelligent Workflows",
];

export const buildSteps: BuildStep[] = [
  {
    icon: Search,
    title: "Discovery",
    description: "Understand your business workflow, pain points, and automation goals.",
  },
  {
    icon: Layers,
    title: "Workflow Design",
    description:
      "Map existing processes, identify bottlenecks, and design the automation approach.",
  },
  {
    icon: Cpu,
    title: "Development",
    description:
      "Build and configure the automation system using n8n, AI agents, and integrations.",
  },
  {
    icon: Settings,
    title: "Optimization",
    description: "Rigorously test, deploy, document, and optimize for long-term reliability.",
  },
];

export const tools: Tool[] = [
  { name: "OpenAI", icon: "openai", category: "AI" },
  { name: "Claude", icon: "claude", category: "AI" },
  { name: "Anthropic", category: "AI" },
  { name: "Google Gemini", category: "AI" },
  { name: "Groq", category: "AI" },
  { name: "OpenRouter", category: "AI" },
  { name: "DeepSeek", category: "AI" },
  { name: "Qwen", category: "AI" },
  { name: "Llama", category: "AI" },
  { name: "Mistral", category: "AI" },
  { name: "Cohere", category: "AI" },
  { name: "Perplexity", category: "AI" },
  { name: "Ollama", category: "AI" },
  { name: "LM Studio", category: "AI" },
  { name: "Hugging Face", category: "AI" },
  { name: "n8n", icon: "n8n", category: "Automation" },
  { name: "Make", category: "Automation" },
  { name: "Zapier", category: "Automation" },
  { name: "Pipedream", category: "Automation" },
  { name: "Activepieces", category: "Automation" },
  { name: "Node-RED", category: "Automation" },
  { name: "Apache Airflow", category: "Automation" },
  { name: "Next.js", icon: "nextjs", category: "Development" },
  { name: "React", icon: "react", category: "Development" },
  { name: "TypeScript", icon: "typescript", category: "Development" },
  { name: "JavaScript", category: "Development" },
  { name: "Tailwind CSS", icon: "tailwind", category: "Development" },
  { name: "Framer Motion", category: "Development" },
  { name: "Node.js", category: "Development" },
  { name: "Express.js", category: "Development" },
  { name: "Python", icon: "python", category: "Development" },
  { name: "FastAPI", category: "Development" },
  { name: "Docker", icon: "docker", category: "Development" },
  { name: "Git", category: "Development" },
  { name: "GitHub", icon: "github", category: "Development" },
  { name: "GitHub Actions", category: "Development" },
  { name: "Vercel", icon: "vercel", category: "Development" },
  { name: "Netlify", category: "Development" },
  { name: "Cloudflare", category: "Development" },
  { name: "PostgreSQL", icon: "postgresql", category: "Databases" },
  { name: "MySQL", category: "Databases" },
  { name: "SQLite", category: "Databases" },
  { name: "Supabase", icon: "supabase", category: "Databases" },
  { name: "Firebase", category: "Databases" },
  { name: "MongoDB", category: "Databases" },
  { name: "Redis", category: "Databases" },
  { name: "Prisma", category: "Databases" },
  { name: "Google Workspace", category: "Business" },
  { name: "Google Sheets", category: "Business" },
  { name: "Slack", category: "Business" },
  { name: "Discord", category: "Business" },
  { name: "Notion", category: "Business" },
  { name: "Airtable", category: "Business" },
  { name: "Trello", category: "Business" },
  { name: "ClickUp", category: "Business" },
  { name: "Calendly", category: "Business" },
  { name: "HubSpot", category: "CRM" },
  { name: "Salesforce", category: "CRM" },
  { name: "Stripe", icon: "stripe", category: "CRM" },
  { name: "PayPal", category: "CRM" },
  { name: "WhatsApp Business", category: "Communication" },
  { name: "Telegram", category: "Communication" },
  { name: "Twilio", category: "Communication" },
  { name: "Resend", category: "Communication" },
  { name: "SendGrid", category: "Communication" },
  { name: "REST API", category: "API" },
  { name: "GraphQL", category: "API" },
  { name: "Webhooks", category: "API" },
  { name: "OAuth", category: "API" },
  { name: "Postman", category: "API" },
  { name: "Sentry", category: "Monitoring" },
  { name: "Better Stack", category: "Monitoring" },
  { name: "UptimeRobot", category: "Monitoring" },
  { name: "Grafana", category: "Monitoring" },
  { name: "Google Analytics", category: "Analytics" },
  { name: "Plausible", category: "Analytics" },
  { name: "Microsoft Clarity", category: "Analytics" },
  { name: "Figma", icon: "figma", category: "Design" },
  { name: "Canva", category: "Design" },
  { name: "FFmpeg", category: "Media" },
  { name: "Cloudinary", category: "Media" },
  { name: "AWS S3", category: "Infrastructure" },
  { name: "Cloudflare R2", category: "Infrastructure" },
  { name: "Railway", category: "Infrastructure" },
  { name: "Render", category: "Infrastructure" },
  { name: "DigitalOcean", category: "Infrastructure" },
  { name: "Linux", category: "Infrastructure" },
  { name: "NGINX", category: "Infrastructure" },
];

export const timeline: TimelineEvent[] = [
  {
    year: "2021",
    title: "Started Learning",
    description: "Began exploring automation and AI technologies to solve real problems.",
  },
  {
    year: "2022",
    title: "Built First Workflow",
    description: "Created my first automated workflow using n8n and API integrations.",
  },
  {
    year: "2023",
    title: "First AI System",
    description: "Developed and deployed my first production AI automation system.",
  },
  {
    year: "2024",
    title: "Portfolio Launch",
    description: "Launched my portfolio to showcase automation systems to the world.",
  },
  {
    year: "2025+",
    title: "Building Enterprise Solutions",
    description: "Delivering enterprise-grade automation systems for global clients.",
  },
];

export const values: Value[] = [
  {
    icon: Quote,
    title: "Build once. Automate forever.",
    description:
      "I design systems that keep running without constant maintenance — reliable, self-sustaining, and built to last.",
  },
  {
    icon: Quote,
    title: "Simple beats complicated.",
    description:
      "The best automation is invisible. Simple, maintainable, and easy to understand — never over-engineered.",
  },
  {
    icon: Quote,
    title: "Reliable over flashy.",
    description:
      "Production-ready systems that work consistently. I prioritize stability over experimental features.",
  },
  {
    icon: Quote,
    title: "Business first. Technology second.",
    description:
      "Every solution starts with a real business problem. Tools are chosen to serve the outcome, not the other way around.",
  },
];
