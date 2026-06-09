/**
 * BLOCO 2: Testes das 13 Blocking Rules
 *
 * Cada regra tem teste positivo (pass) e negativo (block)
 * Cobertura: 100% das 13 regras
 */

import {
  checkAgeCompatibility,
  checkParentAvailability,
  checkSchoolAvailability,
  checkProfessionalRequirement,
  checkReadingRequirement,
  checkWritingRequirement,
  checkVerbalLanguageRequirement,
  checkDomainCompatibility,
  checkMisuseRisk,
  checkCollaborationRequirement,
  checkTimeRequirement,
  checkScreeningVsDiagnostic,
  checkNoSubjectiveQuestionsAsDirectTests,
  applyAllBlockingRules,
} from "../../client/src/lib/blockingRules";
import type { ScaleEntryWithClinicalMetadata } from "../../client/src/types/ClinicalScaleMetadata";

// Mock scale for testing
const mockScale: ScaleEntryWithClinicalMetadata = {
  id: "test-scale",
  name: "Test Scale",
  fullName: "Test Scale Full",
  respondente: ["pais"],
  ageMin: 24,
  ageMax: 120,
  tempo: "15–20 min",
  queixas: ["atencao", "comportamento"],
  prioridade: "triagem",
  description: "Test scale description",
  source: "Test",
  clinicalMetadata: {
    instrumentType: "questionario_parental",
    requiresParent: false,
    requiresSchool: false,
    requiresProfessional: false,
    requiresReading: false,
    requiresWriting: false,
    requiresVerbalLanguage: false,
    minReadingLevel: undefined,
    misuseRisk: "baixo",
    blockingRules: [],
    isScreeningTool: true,
  },
};

/**
 * REGRA 1: Age Compatibility
 */
describe("RULE 1: checkAgeCompatibility", () => {
  test("✅ PASS: Age within range", () => {
    const result = checkAgeCompatibility(mockScale, 60);
    expect(result.isBlocked).toBe(false);
    expect(result.reasons.length).toBe(0);
  });

  test("❌ BLOCK: Age too young", () => {
    const result = checkAgeCompatibility(mockScale, 12);
    expect(result.isBlocked).toBe(true);
    expect(result.blockType).toBe("hard");
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  test("❌ BLOCK: Age too old", () => {
    const result = checkAgeCompatibility(mockScale, 150);
    expect(result.isBlocked).toBe(true);
    expect(result.blockType).toBe("hard");
  });
});

/**
 * REGRA 2: Parent Availability
 */
describe("RULE 2: checkParentAvailability", () => {
  test("✅ PASS: Parent available when required", () => {
    const scale = { ...mockScale, clinicalMetadata: { ...mockScale.clinicalMetadata, requiresParent: true } };
    const result = checkParentAvailability(scale, { parentAvailable: true });
    expect(result.isBlocked).toBe(false);
  });

  test("❌ BLOCK: Parent required but unavailable", () => {
    const scale = { ...mockScale, clinicalMetadata: { ...mockScale.clinicalMetadata, requiresParent: true } };
    const result = checkParentAvailability(scale, { parentAvailable: false });
    expect(result.isBlocked).toBe(true);
  });

  test("✅ PASS: Parent not required", () => {
    const result = checkParentAvailability(mockScale, { parentAvailable: false });
    expect(result.isBlocked).toBe(false);
  });
});

/**
 * REGRA 3: School Availability
 */
describe("RULE 3: checkSchoolAvailability", () => {
  test("✅ PASS: School available when required", () => {
    const scale = { ...mockScale, clinicalMetadata: { ...mockScale.clinicalMetadata, requiresSchool: true } };
    const result = checkSchoolAvailability(scale, { schoolAvailable: true });
    expect(result.isBlocked).toBe(false);
  });

  test("❌ BLOCK: School required but unavailable", () => {
    const scale = { ...mockScale, clinicalMetadata: { ...mockScale.clinicalMetadata, requiresSchool: true } };
    const result = checkSchoolAvailability(scale, { schoolAvailable: false, teacherAvailable: false });
    expect(result.isBlocked).toBe(true);
    expect(result.blockType).toBe("soft");
  });

  test("✅ PASS: Teacher available as alternative to school", () => {
    const scale = { ...mockScale, clinicalMetadata: { ...mockScale.clinicalMetadata, requiresSchool: true } };
    const result = checkSchoolAvailability(scale, { schoolAvailable: false, teacherAvailable: true });
    expect(result.isBlocked).toBe(false);
  });
});

/**
 * REGRA 4: Professional Requirement
 */
describe("RULE 4: checkProfessionalRequirement", () => {
  test("✅ PASS: Professional available in clinic", () => {
    const scale = { ...mockScale, clinicalMetadata: { ...mockScale.clinicalMetadata, requiresProfessional: true, professionalType: "psicólogo" } };
    const result = checkProfessionalRequirement(scale, {
      isClinicOrHome: "clinic",
      professionalAvailable: true,
      professionalType: "psicólogo"
    });
    expect(result.isBlocked).toBe(false);
  });

  test("❌ BLOCK: Professional required but not available", () => {
    const scale = { ...mockScale, clinicalMetadata: { ...mockScale.clinicalMetadata, requiresProfessional: true, professionalType: "psicólogo" } };
    const result = checkProfessionalRequirement(scale, { professionalAvailable: false });
    expect(result.isBlocked).toBe(true);
  });

  test("❌ BLOCK: Home context with professional requirement", () => {
    const scale = { ...mockScale, clinicalMetadata: { ...mockScale.clinicalMetadata, requiresProfessional: true, professionalType: "psicólogo" } };
    const result = checkProfessionalRequirement(scale, {
      isClinicOrHome: "home",
      professionalAvailable: false
    });
    expect(result.isBlocked).toBe(true);
    expect(result.blockType).toBe("hard");
  });
});

/**
 * REGRA 5: Reading Requirement
 */
describe("RULE 5: checkReadingRequirement", () => {
  test("✅ PASS: Child can read when required", () => {
    const scale = { ...mockScale, clinicalMetadata: { ...mockScale.clinicalMetadata, requiresReading: true } };
    const result = checkReadingRequirement(scale, { canRead: true });
    expect(result.isBlocked).toBe(false);
  });

  test("❌ BLOCK: Reading required but child cannot read", () => {
    const scale = { ...mockScale, clinicalMetadata: { ...mockScale.clinicalMetadata, requiresReading: true } };
    const result = checkReadingRequirement(scale, { canRead: false });
    expect(result.isBlocked).toBe(true);
    expect(result.blockType).toBe("hard");
  });

  test("❌ SOFT BLOCK: Reading level insufficient", () => {
    const scale = { ...mockScale, clinicalMetadata: { ...mockScale.clinicalMetadata, minReadingLevel: "nivel3" } };
    const result = checkReadingRequirement(scale, { canRead: true, readingLevel: "basico" });
    expect(result.isBlocked).toBe(true);
    expect(result.blockType).toBe("soft");
  });
});

/**
 * REGRA 6: Writing Requirement
 */
describe("RULE 6: checkWritingRequirement", () => {
  test("✅ PASS: Child can write when required", () => {
    const scale = { ...mockScale, clinicalMetadata: { ...mockScale.clinicalMetadata, requiresWriting: true } };
    const result = checkWritingRequirement(scale, { canWrite: true });
    expect(result.isBlocked).toBe(false);
  });

  test("❌ SOFT BLOCK: Writing required but child cannot write", () => {
    const scale = { ...mockScale, clinicalMetadata: { ...mockScale.clinicalMetadata, requiresWriting: true } };
    const result = checkWritingRequirement(scale, { canWrite: false });
    expect(result.isBlocked).toBe(true);
    expect(result.blockType).toBe("soft");
  });
});

/**
 * REGRA 7: Verbal Language Requirement
 */
describe("RULE 7: checkVerbalLanguageRequirement", () => {
  test("✅ PASS: Child is verbal when required", () => {
    const scale = { ...mockScale, clinicalMetadata: { ...mockScale.clinicalMetadata, requiresVerbalLanguage: true } };
    const result = checkVerbalLanguageRequirement(scale, { isVerbal: true });
    expect(result.isBlocked).toBe(false);
  });

  test("❌ HARD BLOCK: Verbal required but child is non-verbal", () => {
    const scale = { ...mockScale, clinicalMetadata: { ...mockScale.clinicalMetadata, requiresVerbalLanguage: true } };
    const result = checkVerbalLanguageRequirement(scale, { isVerbal: false });
    expect(result.isBlocked).toBe(true);
    expect(result.blockType).toBe("hard");
  });
});

/**
 * REGRA 8: Domain Compatibility
 */
describe("RULE 8: checkDomainCompatibility", () => {
  test("✅ PASS: Domain matches complaint", () => {
    const scale = { ...mockScale, queixas: ["atencao", "comportamento"] };
    const result = checkDomainCompatibility(scale, { primaryDomain: "atencao", isFirstEvaluation: false });
    expect(result.isBlocked).toBe(false);
  });

  test("❌ SOFT BLOCK: Domain mismatch on first evaluation (non-screening)", () => {
    const scale = { ...mockScale, queixas: ["atencao"], clinicalMetadata: { ...mockScale.clinicalMetadata, isScreeningTool: false } };
    const result = checkDomainCompatibility(scale, { primaryDomain: "linguagem", isFirstEvaluation: true });
    expect(result.isBlocked).toBe(true);
    expect(result.blockType).toBe("soft");
  });

  test("✅ PASS: Screening tool despite domain mismatch on first eval", () => {
    const scale = { ...mockScale, clinicalMetadata: { ...mockScale.clinicalMetadata, isScreeningTool: true } };
    const result = checkDomainCompatibility(scale, { primaryDomain: "linguagem", isFirstEvaluation: true });
    expect(result.isBlocked).toBe(false);
  });
});

/**
 * REGRA 9: Misuse Risk
 */
describe("RULE 9: checkMisuseRisk", () => {
  test("✅ PASS: Low misuse risk", () => {
    const scale = { ...mockScale, clinicalMetadata: { ...mockScale.clinicalMetadata, misuseRisk: "baixo" } };
    const result = checkMisuseRisk(scale, {});
    expect(result.isBlocked).toBe(false);
  });

  test("❌ HARD BLOCK: Very high misuse risk", () => {
    const scale = { ...mockScale, clinicalMetadata: { ...mockScale.clinicalMetadata, misuseRisk: "muito_alto" } };
    const result = checkMisuseRisk(scale, {});
    expect(result.isBlocked).toBe(true);
    expect(result.blockType).toBe("hard");
  });

  test("❌ HARD BLOCK: High misuse risk in home context", () => {
    const scale = { ...mockScale, clinicalMetadata: { ...mockScale.clinicalMetadata, misuseRisk: "alto" } };
    const result = checkMisuseRisk(scale, { isClinicOrHome: "home" });
    expect(result.isBlocked).toBe(true);
    expect(result.blockType).toBe("hard");
  });
});

/**
 * REGRA 10: Collaboration Requirement
 */
describe("RULE 10: checkCollaborationRequirement", () => {
  test("✅ PASS: Minimum collaboration available", () => {
    const scale = { ...mockScale, clinicalMetadata: { ...mockScale.clinicalMetadata, requiresMinimumCollaboration: true } };
    const result = checkCollaborationRequirement(scale, { hasMinimalCollaboration: true });
    expect(result.isBlocked).toBe(false);
  });

  test("❌ SOFT BLOCK: Collaboration required but unavailable", () => {
    const scale = { ...mockScale, clinicalMetadata: { ...mockScale.clinicalMetadata, requiresMinimumCollaboration: true } };
    const result = checkCollaborationRequirement(scale, { hasMinimalCollaboration: false });
    expect(result.isBlocked).toBe(true);
    expect(result.blockType).toBe("soft");
  });
});

/**
 * REGRA 11: Time Requirement
 */
describe("RULE 11: checkTimeRequirement", () => {
  test("✅ PASS: Enough time available", () => {
    const scale = { ...mockScale, tempo: "15–20 min" };
    const result = checkTimeRequirement(scale, { timeAvailable: "normal" });
    expect(result.isBlocked).toBe(false);
  });

  test("❌ SOFT BLOCK: Scale takes too long", () => {
    const scale = { ...mockScale, tempo: "60–90 min" };
    const result = checkTimeRequirement(scale, { timeAvailable: "rapido" });
    expect(result.isBlocked).toBe(true);
    expect(result.blockType).toBe("soft");
  });
});

/**
 * REGRA 12: Screening vs Diagnostic
 */
describe("RULE 12: checkScreeningVsDiagnostic", () => {
  test("✅ PASS: Diagnostic tool on first evaluation", () => {
    const scale = { ...mockScale, prioridade: "diagnostico" };
    const result = checkScreeningVsDiagnostic(scale, { isFirstEvaluation: true });
    expect(result.isBlocked).toBe(false);
  });

  test("❌ SOFT BLOCK: Monitoring tool on first evaluation", () => {
    const scale = { ...mockScale, prioridade: "monitorizacao" };
    const result = checkScreeningVsDiagnostic(scale, { isFirstEvaluation: true });
    expect(result.isBlocked).toBe(true);
    expect(result.blockType).toBe("soft");
  });

  test("✅ PASS: Monitoring tool on follow-up", () => {
    const scale = { ...mockScale, prioridade: "monitorizacao" };
    const result = checkScreeningVsDiagnostic(scale, { isFirstEvaluation: false });
    expect(result.isBlocked).toBe(false);
  });
});

/**
 * REGRA 13: Subjective Questions as Direct Tests
 */
describe("RULE 13: checkNoSubjectiveQuestionsAsDirectTests", () => {
  test("✅ PASS: True direct test with objective components", () => {
    const scale = {
      ...mockScale,
      description: "Child performs tasks: puzzle solving, block stacking",
      clinicalMetadata: {
        ...mockScale.clinicalMetadata,
        instrumentType: "teste_direto_desempenho",
        directTestComponents: ["puzzle", "block"]
      }
    };
    const result = checkNoSubjectiveQuestionsAsDirectTests(scale);
    expect(result.isBlocked).toBe(false);
  });

  test("❌ HARD BLOCK: Subjective question masked as direct test", () => {
    const scale = {
      ...mockScale,
      description: "Criança consegue ler?",
      clinicalMetadata: {
        ...mockScale.clinicalMetadata,
        instrumentType: "teste_direto_desempenho",
        directTestComponents: []
      }
    };
    const result = checkNoSubjectiveQuestionsAsDirectTests(scale);
    expect(result.isBlocked).toBe(true);
    expect(result.blockType).toBe("hard");
  });
});

/**
 * INTEGRATION: All Rules Combined
 */
describe("applyAllBlockingRules (Integration)", () => {
  test("✅ PASS: All conditions met", () => {
    const result = applyAllBlockingRules(mockScale, {
      ageMonths: 60,
      canRead: true,
      canWrite: true,
      isVerbal: true,
      parentAvailable: true,
      schoolAvailable: false,
    });
    expect(result.isBlocked).toBe(false);
  });

  test("❌ HARD BLOCK: Age incompatibility takes precedence", () => {
    const result = applyAllBlockingRules(mockScale, {
      ageMonths: 12,
      canRead: true,
      isVerbal: true,
      parentAvailable: true,
    });
    expect(result.isBlocked).toBe(true);
    expect(result.blockType).toBe("hard");
  });

  test("⚠️ SOFT BLOCK: Multiple soft blocks trigger warning", () => {
    const scale = { ...mockScale, tempo: "60–90 min" };
    const result = applyAllBlockingRules(scale, {
      ageMonths: 60,
      canRead: true,
      timeAvailable: "rapido",
    });
    expect(result.isBlocked).toBe(true);
    expect(result.blockType).toBe("soft");
  });
});
