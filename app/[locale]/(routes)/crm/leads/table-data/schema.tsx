import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const leadSchema = z.object({
  //TODO: fix all the types and nullable
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  firstName: z.string().optional().nullable(),
  // min(1): leads criados via WhatsApp podem ter nome curto (ex.: pushName de 1-2 chars)
  lastName: z.string().min(1).max(60),
});

export type Lead = z.infer<typeof leadSchema>;
