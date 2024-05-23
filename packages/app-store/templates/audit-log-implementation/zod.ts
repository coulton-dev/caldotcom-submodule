import { z } from "zod";

export const appSettingsSchema = z.object({
  bookings: z.object({
    modified: z.object({
      reschedule: z.boolean(),
    }),
  }),
});

export const appKeysSchema = z.object({
  apiKey: z.string().min(1),
  projectId: z.string().min(1),
  endpoint: z.string().min(1),
});

export type AppKeys = z.infer<typeof appKeysSchema>;

export const appDataSchema = z.object({});