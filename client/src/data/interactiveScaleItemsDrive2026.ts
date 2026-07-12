import type { InteractiveScaleDef } from "./interactiveScaleItems";
import { driveImport2026Items as driveImport2026ItemsBase } from "./interactiveScaleItemsDrive2026Base";
import { authorialDrive2026OperationalItems } from "./interactiveScaleItemsDrive2026Autorais";

/**
 * Registro consolidado das aplicações interativas importadas do Drive.
 * O módulo Base preserva as aplicações previamente validadas no app; o módulo
 * Autorais acrescenta as escalas já criadas pelo Dr. Jadson.
 */
export const driveImport2026Items: Record<string, InteractiveScaleDef> = {
  ...driveImport2026ItemsBase,
  ...authorialDrive2026OperationalItems,
};
