import { z } from "zod";
import {
  NOTIFICATION_CATEGORY_META,
  NOTIFICATION_PRIORITY_META,
  type NotificationCategory,
  type NotificationPriority,
} from "@/types/notifications";

const categoryKeys = Object.keys(NOTIFICATION_CATEGORY_META) as NotificationCategory[];
const priorityKeys = Object.keys(NOTIFICATION_PRIORITY_META) as NotificationPriority[];

export const notificationRecipientSchema = z.object({
  id: z.string().trim().min(1).max(80),
  chatId: z
    .string()
    .trim()
    .min(1, "Chat ID is required")
    .max(120)
    .regex(/^[-\w@.\s]{1,120}$/, "Chat ID looks invalid (use a numeric id or @handle)"),
  label: z.string().trim().min(1, "Recipient label is required").max(60),
  enabled: z.boolean(),
});

export const notificationConfigSchema = z.object({
  enabled: z.boolean(),
  categories: z.record(z.enum(categoryKeys), z.boolean()),
  events: z.record(z.string().min(1).max(80), z.boolean()),
  priorities: z.record(z.string().min(1).max(80), z.enum(priorityKeys)),
  recipients: z.array(notificationRecipientSchema).max(20),
});

export const saveNotificationConfigInputSchema = notificationConfigSchema;

export const testTelegramInputSchema = z.object({
  token: z
    .string()
    .trim()
    .min(1, "Bot token is required")
    .max(200)
    .regex(/^\d+:[A-Za-z0-9_-]+$/, "Token looks invalid (format: 123456:ABCDEF…)"),
});

export const sendTestMessageInputSchema = z.object({
  recipientIds: z.array(z.string().trim().min(1).max(80)).min(1, "Pick at least one recipient"),
});

export const retryDeliveryInputSchema = z.object({
  deliveryId: z.string().trim().min(1).max(80),
});
