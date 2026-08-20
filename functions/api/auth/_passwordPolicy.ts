import { z } from "zod";

/** Política única para troca, convite e futuras criações de credencial. */
export const strongPasswordSchema = z.string()
  .min(12)
  .max(128)
  .regex(/[A-Z]/, "Inclua uma letra maiúscula.")
  .regex(/[a-z]/, "Inclua uma letra minúscula.")
  .regex(/[0-9]/, "Inclua um número.")
  .regex(/[^A-Za-z0-9]/, "Inclua um símbolo.");
