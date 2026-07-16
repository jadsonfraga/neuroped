#!/usr/bin/env node

/**
 * Auditoria estrutural do catálogo clínico realmente entregue pelo app.
 *
 * Este guard importa `allScales` diretamente; não usa amostras nem mocks. As
 * validações clínicas de conteúdo continuam em `tests/clinical`, enquanto este
 * arquivo impede que CI aprove um catálogo vazio, truncado ou inconsistente.
 */
import {
  allScales,
  allScalesComFichas,
  EXPECTED_INTERACTIVE_ITEM_COUNTS,
  getDeliveredInteractiveItemCount,
  queixas,
} from "../client/src/data/scaleFilter.ts";

const MINIMUM_CATALOG_SIZE = 200;
const REQUIRED_TEXT_FIELDS = ["id", "name", "fullName", "tempo", "description"];
const VALID_RESPONDENTS = new Set([
  "pais",
  "clinico",
  "professor",
  "autoaplicavel",
  "crianca",
  "teste_direto_crianca",
]);
const VALID_PRIORITIES = new Set(["triagem", "diagnostica", "monitorizacao"]);
const VALID_IMPLEMENTATION_STATUSES = new Set([
  "complete",
  "metadata_only",
  "external_only",
  "not_implemented",
]);
const VALID_APPLICATION_MODES = new Set([
  "questionario_pais",
  "questionario_professor",
  "autoquestionario_crianca_adolescente",
  "teste_direto_crianca",
  "observacional_clinico",
  "entrevista_clinica",
  "registro_clinico",
  "psicoeducacao",
]);
const VALID_ASSESSMENT_USES = new Set([
  "triagem",
  "diagnostico",
  "monitorizacao",
  "seguimento",
  "psicoeducacao",
]);

const validComplaints = new Set(queixas.map((complaint) => complaint.id));
const seenIds = new Map();
const visibleIds = new Set(allScales.map((scale) => scale.id));
const errors = [];
const warnings = [];
let incompleteItemContracts = 0;

function fail(scaleId, message) {
  errors.push(`${scaleId || "(sem id)"}: ${message}`);
}

if (allScales.length < MINIMUM_CATALOG_SIZE) {
  fail(
    "catálogo",
    `somente ${allScales.length} instrumentos carregados; mínimo de segurança é ${MINIMUM_CATALOG_SIZE}`,
  );
}

for (const [scaleId, expectedItems] of Object.entries(EXPECTED_INTERACTIVE_ITEM_COUNTS)) {
  const scale = allScalesComFichas.find((entry) => entry.id === scaleId);
  const deliveredItems = getDeliveredInteractiveItemCount(scaleId);
  if (!scale) {
    fail(scaleId, "contrato de extensão aponta para instrumento inexistente");
    continue;
  }
  if (deliveredItems !== expectedItems) {
    incompleteItemContracts += 1;
    if (scale.implementationStatus !== "metadata_only") {
      fail(
        scaleId,
        `aplicação parcial (${deliveredItems}/${expectedItems}) deve ser metadata_only`,
      );
    }
    if (visibleIds.has(scaleId)) {
      fail(
        scaleId,
        `aplicação parcial (${deliveredItems}/${expectedItems}) não pode ser oferecida como completa`,
      );
    }
  }
}

for (const scale of allScales) {
  const scaleId = typeof scale.id === "string" ? scale.id : "(sem id)";

  for (const field of REQUIRED_TEXT_FIELDS) {
    if (typeof scale[field] !== "string" || scale[field].trim() === "") {
      fail(scaleId, `campo obrigatório ${field} está vazio`);
    }
  }

  if (seenIds.has(scale.id)) {
    fail(scaleId, `ID duplicado; primeira ocorrência: ${seenIds.get(scale.id)}`);
  } else {
    seenIds.set(scale.id, scale.name);
  }

  if (!/^[a-z0-9][a-z0-9-]*$/.test(scale.id)) {
    fail(scaleId, "ID deve usar apenas letras minúsculas, números e hífen");
  }

  if (!Number.isInteger(scale.ageMin) || !Number.isInteger(scale.ageMax)) {
    fail(scaleId, `faixa etária deve usar meses inteiros (${scale.ageMin}–${scale.ageMax})`);
  } else if (scale.ageMin < 0 || scale.ageMax > 216 || scale.ageMin > scale.ageMax) {
    fail(scaleId, `faixa etária inválida (${scale.ageMin}–${scale.ageMax} meses)`);
  }

  if (!Array.isArray(scale.queixas) || scale.queixas.length === 0) {
    fail(scaleId, "nenhum domínio/queixa informado");
  } else {
    for (const complaint of scale.queixas) {
      if (!validComplaints.has(complaint)) fail(scaleId, `domínio desconhecido: ${complaint}`);
    }
  }

  if (!Array.isArray(scale.respondente) || scale.respondente.length === 0) {
    fail(scaleId, "nenhum respondente informado");
  } else {
    for (const respondent of scale.respondente) {
      if (!VALID_RESPONDENTS.has(respondent)) fail(scaleId, `respondente desconhecido: ${respondent}`);
    }
  }

  if (!VALID_PRIORITIES.has(scale.prioridade)) {
    fail(scaleId, `prioridade desconhecida: ${scale.prioridade}`);
  }

  if (typeof scale.appRoute !== "string" || !scale.appRoute.startsWith("/")) {
    fail(scaleId, "appRoute ausente ou não absoluto");
  }

  if (
    scale.implementationStatus !== undefined &&
    !VALID_IMPLEMENTATION_STATUSES.has(scale.implementationStatus)
  ) {
    fail(scaleId, `implementationStatus desconhecido: ${scale.implementationStatus}`);
  }

  if (
    scale.applicationMode !== undefined &&
    !VALID_APPLICATION_MODES.has(scale.applicationMode)
  ) {
    fail(scaleId, `applicationMode desconhecido: ${scale.applicationMode}`);
  }

  if (
    scale.assessmentUse !== undefined &&
    !VALID_ASSESSMENT_USES.has(scale.assessmentUse)
  ) {
    fail(scaleId, `assessmentUse desconhecido: ${scale.assessmentUse}`);
  }

  if (scale.pendente_validacao_clinica === true && !scale.pendencia?.trim()) {
    warnings.push(`${scaleId}: validação clínica pendente sem descrição específica`);
  }
}

console.log(
  `[audit:scales:clinical] completos=${allScales.length} | domínios=${queixas.length} | parciais bloqueados=${incompleteItemContracts} | avisos=${warnings.length}`,
);

for (const warning of warnings) console.warn(`  ⚠ ${warning}`);

if (errors.length > 0) {
  console.error(`\n[audit:scales:clinical] ${errors.length} erro(s) estrutural(is):`);
  for (const error of errors) console.error(`  ✗ ${error}`);
  process.exit(1);
}

console.log("[audit:scales:clinical] ✓ catálogo real aprovado sem mocks.");
