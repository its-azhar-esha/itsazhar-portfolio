import { z } from "zod";

export const cleanupRequestSchema = z
  .object({
    mode: z.enum(["keep-days", "keep-records", "keep-latest"]),
    value: z.number().int().min(1).max(100000),
  })
  .refine((v) => (v.mode === "keep-latest" ? v.value === 1 : true), {
    message: "Keep-latest deletes everything except the single newest item.",
    path: ["value"],
  });
