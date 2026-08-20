import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => value || undefined);

export const memoryNoteInputSchema = z.object({
  patientId: optionalText(128),
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(20_000),
  category: optionalText(80),
  source: optionalText(120),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
});

export const memoryNotePatchSchema = memoryNoteInputSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Informe ao menos um campo para atualizar.",
);

export type MemoryNoteInput = z.infer<typeof memoryNoteInputSchema>;
