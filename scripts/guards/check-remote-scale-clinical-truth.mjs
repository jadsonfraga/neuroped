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
  RETIRED_REMOTE_SCALES,
  decodeRetiredRemoteAnswers,
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
// O M-CHAT-R saiu em 17/10/2026 (licenciado): só o histórico continua legível.
const ALLOWLIST_REVISADA = [
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

// Escala retirada (M-CHAT-R, licenciado): nenhum convite novo nem tela para a família,
// e o histórico continua legível por número do item, sem o texto do instrumento.
check("M-CHAT retirado do envio remoto, histórico legível", () => {
  assert.equal(getRemoteScaleDescriptor("mchat"), null, "M-CHAT voltou ao envio remoto");
  assert.ok(RETIRED_REMOTE_SCALES.mchat, "histórico do M-CHAT perdeu o decodificador");
  const historico = decodeRetiredRemoteAnswers("mchat", [0, 1]);
  assert.equal(historico.length, 20);
  assert.deepEqual(historico[0], { label: "Item 1", value: "Sim" });
  assert.deepEqual(historico[1], { label: "Item 2", value: "Não" });
  assert.equal(historico[2].value, "—");
});

if (failures.length > 0) {
  console.error("❌ Verdade clínica do encaminhamento remoto violada:");
  for (const failure of failures) console.error(`   - ${failure}`);
  process.exit(1);
}

console.log(
  `✅ Verdade clínica remota: ${REMOTE_SCALE_IDS.length} instrumentos íntegros; M-CHAT retirado com histórico legível.`,
);
