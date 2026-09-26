import assert from "node:assert/strict";
import { parseFilterQueryIntent, parseFilterSearchAge, inferComplaintIds } from "../../client/src/lib/filterClinicalInput.ts";
import { queixas } from "../../client/src/data/scaleFilter.ts";

// Intenção lida do texto livre: respondente, tempo, finalidade, comunicação,
// alfabetização. NUNCA aplicada sozinha — a UI mostra chips e a pessoa confirma.
const empty = { respondent: null, timeBudgetMinutes: null, assessmentType: null, communication: null, literacy: null };
assert.deepEqual(parseFilterQueryIntent(""), empty);
assert.deepEqual(parseFilterQueryIntent("mchat"), empty, "sigla sem contexto não inventa intenção");

const parents = parseFilterQueryIntent("menino 5 anos não fala, pais, 10 min");
assert.equal(parents.respondent, "pais");
assert.equal(parents.timeBudgetMinutes, 10);
assert.equal(parents.communication, "nonverbal", "'não fala' sugere criança não-verbal");
assert.equal(parseFilterSearchAge("menino 5 anos não fala, pais, 10 min").ageMonths, 60, "idade continua lida pelo parser existente");
assert.deepEqual(inferComplaintIds("menino 5 anos não fala, pais, 10 min", queixas).includes("linguagem"), true, "queixa continua inferida");

assert.equal(parseFilterQueryIntent("questionário para a professora").respondent, "professor");
assert.equal(parseFilterQueryIntent("escala que o próprio adolescente responde").respondent, "autoaplicavel");
assert.equal(parseFilterQueryIntent("teste direto com a criança").respondent, "teste_direto_crianca");
assert.equal(parseFilterQueryIntent("observação clínica em consulta").respondent, "clinico");
assert.equal(parseFilterQueryIntent("mãe relata birras").respondent, "pais", "mãe/pai/cuidador → pais");

// Tempo exige unidade "min" — "5 anos" e "18 meses" nunca viram orçamento.
assert.equal(parseFilterQueryIntent("5 anos 18 meses").timeBudgetMinutes, null);
assert.equal(parseFilterQueryIntent("até 15 minutos").timeBudgetMinutes, 15);
assert.equal(parseFilterQueryIntent("algo rápido para TDAH").timeBudgetMinutes, 5, "'rápido' sugere 5 min");
assert.equal(parseFilterQueryIntent("300 min").timeBudgetMinutes, null, "fora do plausível é ignorado");

assert.equal(parseFilterQueryIntent("acompanhamento da medicação").assessmentType, "monitoring");
assert.equal(parseFilterQueryIntent("retorno TDAH").assessmentType, "monitoring");
assert.equal(parseFilterQueryIntent("confirmar diagnóstico de autismo").assessmentType, "diagnostic");
assert.equal(parseFilterQueryIntent("criança não alfabetizada").literacy, "preliterate");
assert.equal(parseFilterQueryIntent("já lê bem").literacy, "literate");
assert.equal(parseFilterQueryIntent("não verbal").communication, "nonverbal");
assert.equal(parseFilterQueryIntent("criança verbal").communication, "verbal");
console.log("✓ intenção de busca: respondente/tempo/finalidade/comunicação/alfabetização lidos sem auto-aplicar");
