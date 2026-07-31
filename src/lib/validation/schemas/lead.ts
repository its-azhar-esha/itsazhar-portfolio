import { z } from "zod";
import { LEAD_STATUSES } from "@/types/lead";

export const submitLeadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or fewer"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .max(254, "Email must be 254 characters or fewer"),
  phone: z
    .string()
    .trim()
    .max(50, "Phone must be 50 characters or fewer")
    .optional()
    .nullable()
    .default(null)
    .or(z.literal("")),
  message: z
    .string()
    .trim()
    .max(2000, "Message must be 2000 characters or fewer")
    .optional()
    .nullable()
    .default(null)
    .or(z.literal("")),
  source: z.string().trim().max(50).default("contact"),
});

export const updateLeadStatusSchema = z.object({
  status: z.enum([...LEAD_STATUSES]),
});
