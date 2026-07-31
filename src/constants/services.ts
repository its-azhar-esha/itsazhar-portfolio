import {
  Bot,
  Workflow,
  Cable,
  FileText,
  Building2,
  Cpu,
  Zap,
  Shield,
  ChartLine,
  Boxes,
} from "lucide-react";

export const SERVICE_ICONS = {
  bot: Bot,
  workflow: Workflow,
  cable: Cable,
  file_text: FileText,
  building2: Building2,
  cpu: Cpu,
  zap: Zap,
  shield: Shield,
  chart: ChartLine,
  boxes: Boxes,
} as const;

export type ServiceIconName = keyof typeof SERVICE_ICONS;

export const SERVICE_ICON_NAMES = Object.keys(SERVICE_ICONS) as ServiceIconName[];

export const SERVICE_STATUSES = ["draft", "published"] as const;

export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

export const SERVICE_DEFAULTS = {
  STATUS: "draft" as ServiceStatus,
  ICON: "bot" as ServiceIconName,
  DISPLAY_ORDER: 0,
} as const;
