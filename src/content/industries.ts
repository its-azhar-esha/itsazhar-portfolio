import type { LucideIcon } from "lucide-react";
import {
  Stethoscope,
  Landmark,
  Building2,
  Truck,
  Home,
  GraduationCap,
  ShoppingBag,
  Megaphone,
  Headphones,
  FileText,
} from "lucide-react";

export interface Industry {
  name: string;
  icon: LucideIcon;
  slug: string;
}

export const industries: Industry[] = [
  { name: "Healthcare", icon: Stethoscope, slug: "healthcare" },
  { name: "Finance", icon: Landmark, slug: "finance" },
  { name: "Business", icon: Building2, slug: "business" },
  { name: "Logistics", icon: Truck, slug: "logistics" },
  { name: "Real Estate", icon: Home, slug: "real-estate" },
  { name: "Education", icon: GraduationCap, slug: "education" },
  { name: "E-Commerce", icon: ShoppingBag, slug: "e-commerce" },
  { name: "Marketing", icon: Megaphone, slug: "marketing" },
  { name: "Customer Support", icon: Headphones, slug: "customer-support" },
  { name: "Document Intelligence", icon: FileText, slug: "document-intelligence" },
];

export const allIndustries = [
  "All",
  "Healthcare",
  "Finance & FinTech",
  "Business Operations",
  "Logistics",
  "E-Commerce",
  "Real Estate",
  "Education",
  "Manufacturing",
  "Human Resources",
  "Sales & CRM",
  "Marketing",
  "Customer Support",
  "Legal",
  "Insurance",
  "Hospitality",
  "Travel",
  "Construction",
  "Non-Profit",
  "Government",
  "Document Intelligence",
  "Custom Solutions",
];
