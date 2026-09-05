/**
 * Guarda de verdade clínica do encaminhamento remoto de escalas.
 *
 * O que está sendo protegido: a família responde em casa, sem supervisão, e o
 * que ela vê na tela é o descritor de shared/remoteScaleCatalog.ts. Se o
 * descritor nomear um instrumento que o app não executa por inteiro, o
 * prontuário passa a registrar um instrumento que nunca foi aplicado.
 *
 * Rodar: node --import tsx scripts/guards/check-remote-scale-clinical-truth.mjs
 */
import assert from "node:assert/strict";
import {
  REMOTE_SCALE_IDS,
  getRemoteScaleDescriptor,
} from "../../shared/remoteScaleCatalog.ts";

const failures = [];
function check(label, fn) {
  try {
    fn();
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
  }
}

// A allowlist é uma decisão clínica, não um default técnico: ampliar exige
// editar esta lista de propósito, o que força a revisão do instrumento novo
// (autorrelato/relato dos pais, sem item de risco de suicídio, sem exigir
// examinador treinado) antes de chegar à família.
const ALLOWLIST_REVISADA = [
  "mchat",
  "q-chat-10",
  "psc17",
  "ari",
  "gad7ped",
  "smfq",
];

check("allowlist remota sob revisão clínica", () => {
  assert.deepEqual(
    [...REMOTE_SCALE_IDS],
    ALLOWLIST_REVISADA,
    "a allowlist remota mudou — revise clinicamente o instrumento e atualize ALLOWLIST_REVISADA nesta guarda",
  );
});

// Nº de itens que cada instrumento precisa ter para ser aquele instrumento.
// Uma coleta truncada não é o instrumento: é um subconjunto sem escore válido.
const ITENS_ESPERADOS = {
  mchat: 20,
  "q-chat-10": 10,
  psc17: 17,
  ari: 6,
  gad7ped: 7,
  smfq: 13,
};

for (const id of REMOTE_SCALE_IDS) {
  const descriptor = getRemoteScaleDescriptor(id);

  check(`${id} tem descritor`, () => {
    assert.ok(descriptor, "getRemoteScaleDescriptor retornou null");
  });
  if (!descriptor) continue;

  check(`${id} coleta o instrumento inteiro`, () => {
    assert.equal(descriptor.items.length, ITENS_ESPERADOS[id]);
  });

  check(`${id} não entrega pontuação à família`, () => {
    for (const item of descriptor.items) {
      for (const option of item.options) {
        assert.deepEqual(
          Object.keys(option),
          ["label"],
          "opção remota carrega peso/escore — a família não pode receber pontuação automática",
        );
      }
    }
  });
}

// O app coleta só os 20 itens de triagem do M-CHAT-R. A entrevista de
// seguimento (Follow-Up) exige entrevistador treinado percorrendo o branching,
// então o descritor remoto não pode se apresentar como M-CHAT-R/F.
check("M-CHAT remoto não se apresenta como R/F", () => {
  const mchat = getRemoteScaleDescriptor("mchat");
  assert.ok(mchat);
  const texto = `${mchat.name} ${mchat.fullName}`;
  assert.doesNotMatch(
    texto,
    /\bR\s*\/\s*F\b/,
    "descritor remoto do M-CHAT voltou a se declarar R/F sem executar o Follow-Up",
  );
  assert.doesNotMatch(
    texto,
    /with\s+follow[-\s]?up/i,
    "descritor remoto do M-CHAT voltou a alegar 'with Follow-Up' sem aplicar a entrevista",
  );
});

if (failures.length > 0) {
  console.error("❌ Verdade clínica do encaminhamento remoto violada:");
  for (const failure of failures) console.error(`   - ${failure}`);
  process.exit(1);
}

console.log(
  `✅ Verdade clínica remota: ${REMOTE_SCALE_IDS.length} instrumentos íntegros, sem alegação de Follow-Up não executado.`,
);
