import { z } from "zod";

export const ZGetMembersInput = z.object({
  teamIdToExclude: z.number().optional(),
  accepted: z.boolean().optional().default(true),
  distinctUser: z.boolean().optional().default(false),
});

export type TGetMembersInputSchema = z.infer<typeof ZGetMembersInput>;
