/**
 * Testes unitários para Availability Templates
 * Valida: schema validation, data transformation, business logic
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createAvailabilityTemplateApiSchema } from "../../shared/saas-schema.js";

describe("Availability Templates", () => {
  describe("Template Creation Schema", () => {
    it("should validate valid availability template with all fields", () => {
      const validInput = {
        name: "Horário Padrão",
        description: "Template padrão de disponibilidade",
        rules: {
          monday: [{ start: "08:00", end: "12:00" }, { start: "14:00", end: "18:00" }],
          tuesday: [{ start: "08:00", end: "12:00" }, { start: "14:00", end: "18:00" }],
          wednesday: [{ start: "08:00", end: "12:00" }, { start: "14:00", end: "18:00" }],
          thursday: [{ start: "08:00", end: "12:00" }, { start: "14:00", end: "18:00" }],
          friday: [{ start: "08:00", end: "12:00" }, { start: "14:00", end: "18:00" }],
          saturday: [],
          sunday: [],
        },
      };

      const result = createAvailabilityTemplateApiSchema.safeParse(validInput);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.name, "Horário Padrão");
        assert.equal(result.data.description, "Template padrão de disponibilidade");
      }
    });

    it("should validate template with minimal fields (no description)", () => {
      const input = {
        name: "Mínimo",
        rules: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
      };

      const result = createAvailabilityTemplateApiSchema.safeParse(input);
      assert.equal(result.success, true);
    });

    it("should require template name", () => {
      const input = {
        // missing name
        description: "Sem nome",
        rules: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
      };

      const result = createAvailabilityTemplateApiSchema.safeParse(input);
      assert.equal(result.success, false);
    });

    it("should accept rules with subset of days (record pattern)", () => {
      const input = {
        name: "Subconjunto de dias",
        rules: {
          monday: [],
          tuesday: [],
          // Can have subset of days - z.record doesn't require all enum values
        },
      };

      const result = createAvailabilityTemplateApiSchema.safeParse(input);
      assert.equal(result.success, true);
    });

    it("should validate time format (HH:MM)", () => {
      const validInput = {
        name: "Formato válido",
        rules: {
          monday: [{ start: "08:00", end: "12:30" }],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
      };

      const result = createAvailabilityTemplateApiSchema.safeParse(validInput);
      assert.equal(result.success, true);
    });

    it("should reject invalid time format", () => {
      const invalidInput = {
        name: "Formato inválido",
        rules: {
          monday: [{ start: "8:00", end: "12:00" }], // missing leading zero
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
      };

      const result = createAvailabilityTemplateApiSchema.safeParse(invalidInput);
      assert.equal(result.success, false);
    });

    it("should allow multiple time slots per day", () => {
      const input = {
        name: "Múltiplos slots",
        rules: {
          monday: [
            { start: "08:00", end: "12:00" },
            { start: "14:00", end: "18:00" },
            { start: "19:00", end: "21:00" },
          ],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
      };

      const result = createAvailabilityTemplateApiSchema.safeParse(input);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.rules.monday.length, 3);
      }
    });

    it("should reject negative name length", () => {
      const input = {
        name: "", // empty string
        rules: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
      };

      const result = createAvailabilityTemplateApiSchema.safeParse(input);
      assert.equal(result.success, false);
    });

    it("should enforce description max length", () => {
      const longDescription = "a".repeat(1001);
      const input = {
        name: "Descrição longa",
        description: longDescription,
        rules: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
      };

      const result = createAvailabilityTemplateApiSchema.safeParse(input);
      assert.equal(result.success, false);
    });

    it("should accept valid name length up to 255 chars", () => {
      const longName = "a".repeat(255);
      const input = {
        name: longName,
        rules: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
      };

      const result = createAvailabilityTemplateApiSchema.safeParse(input);
      assert.equal(result.success, true);
    });

    it("should reject name longer than 255 chars", () => {
      const longName = "a".repeat(256);
      const input = {
        name: longName,
        rules: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
      };

      const result = createAvailabilityTemplateApiSchema.safeParse(input);
      assert.equal(result.success, false);
    });

    it("should reject extra fields (strict mode)", () => {
      const input = {
        name: "Strict",
        rules: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
        extraField: "should not be here",
      };

      const result = createAvailabilityTemplateApiSchema.safeParse(input);
      assert.equal(result.success, false);
    });

    it("should reject missing end time in slot", () => {
      const input = {
        name: "Slot incompleto",
        rules: {
          monday: [{ start: "08:00" }], // missing end
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
      };

      const result = createAvailabilityTemplateApiSchema.safeParse(input);
      assert.equal(result.success, false);
    });

    it("should reject null time values", () => {
      const input = {
        name: "Null times",
        rules: {
          monday: [{ start: null, end: "12:00" }],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
      };

      const result = createAvailabilityTemplateApiSchema.safeParse(input);
      assert.equal(result.success, false);
    });
  });

  describe("Template Data Processing", () => {
    it("should handle empty description as optional", () => {
      const input = {
        name: "Sem descrição",
        rules: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
      };

      const result = createAvailabilityTemplateApiSchema.safeParse(input);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.description, undefined);
      }
    });

    it("should preserve time slot order", () => {
      const input = {
        name: "Ordenação",
        rules: {
          monday: [
            { start: "08:00", end: "12:00" },
            { start: "14:00", end: "18:00" },
          ],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
      };

      const result = createAvailabilityTemplateApiSchema.safeParse(input);
      assert.equal(result.success, true);
      if (result.success) {
        assert.deepEqual(result.data.rules.monday, [
          { start: "08:00", end: "12:00" },
          { start: "14:00", end: "18:00" },
        ]);
      }
    });

    it("should handle all days of week correctly", () => {
      const input = {
        name: "Semana completa",
        rules: {
          monday: [{ start: "09:00", end: "17:00" }],
          tuesday: [{ start: "09:00", end: "17:00" }],
          wednesday: [{ start: "09:00", end: "17:00" }],
          thursday: [{ start: "09:00", end: "17:00" }],
          friday: [{ start: "09:00", end: "17:00" }],
          saturday: [{ start: "10:00", end: "14:00" }],
          sunday: [],
        },
      };

      const result = createAvailabilityTemplateApiSchema.safeParse(input);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(Object.keys(result.data.rules).length, 7);
        assert.equal(result.data.rules.friday.length, 1);
        assert.equal(result.data.rules.sunday.length, 0);
      }
    });
  });

  describe("Business Logic", () => {
    it("should support clinic standard business hours", () => {
      const standardHours = {
        name: "Horário Comercial Padrão",
        description: "Segunda a sexta, 8h-12h e 14h-18h",
        rules: {
          monday: [
            { start: "08:00", end: "12:00" },
            { start: "14:00", end: "18:00" },
          ],
          tuesday: [
            { start: "08:00", end: "12:00" },
            { start: "14:00", end: "18:00" },
          ],
          wednesday: [
            { start: "08:00", end: "12:00" },
            { start: "14:00", end: "18:00" },
          ],
          thursday: [
            { start: "08:00", end: "12:00" },
            { start: "14:00", end: "18:00" },
          ],
          friday: [
            { start: "08:00", end: "12:00" },
            { start: "14:00", end: "18:00" },
          ],
          saturday: [],
          sunday: [],
        },
      };

      const result = createAvailabilityTemplateApiSchema.safeParse(standardHours);
      assert.equal(result.success, true);
    });

    it("should support clinic extended hours", () => {
      const extendedHours = {
        name: "Horário Estendido",
        rules: {
          monday: [{ start: "08:00", end: "20:00" }],
          tuesday: [{ start: "08:00", end: "20:00" }],
          wednesday: [{ start: "08:00", end: "20:00" }],
          thursday: [{ start: "08:00", end: "20:00" }],
          friday: [{ start: "08:00", end: "20:00" }],
          saturday: [{ start: "09:00", end: "14:00" }],
          sunday: [],
        },
      };

      const result = createAvailabilityTemplateApiSchema.safeParse(extendedHours);
      assert.equal(result.success, true);
    });

    it("should support 24-hour clinic", () => {
      const twentyFourHours = {
        name: "Clínica 24h",
        rules: {
          monday: [{ start: "00:00", end: "23:59" }],
          tuesday: [{ start: "00:00", end: "23:59" }],
          wednesday: [{ start: "00:00", end: "23:59" }],
          thursday: [{ start: "00:00", end: "23:59" }],
          friday: [{ start: "00:00", end: "23:59" }],
          saturday: [{ start: "00:00", end: "23:59" }],
          sunday: [{ start: "00:00", end: "23:59" }],
        },
      };

      const result = createAvailabilityTemplateApiSchema.safeParse(twentyFourHours);
      assert.equal(result.success, true);
    });

    it("should support clinic closed on weekends", () => {
      const weekendClosed = {
        name: "Fechado no fim de semana",
        rules: {
          monday: [{ start: "09:00", end: "18:00" }],
          tuesday: [{ start: "09:00", end: "18:00" }],
          wednesday: [{ start: "09:00", end: "18:00" }],
          thursday: [{ start: "09:00", end: "18:00" }],
          friday: [{ start: "09:00", end: "18:00" }],
          saturday: [],
          sunday: [],
        },
      };

      const result = createAvailabilityTemplateApiSchema.safeParse(weekendClosed);
      assert.equal(result.success, true);
    });
  });
});
