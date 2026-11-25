import assert from "node:assert/strict";
import test from "node:test";
import { decodeProntuarioEncounterId as decode, encodeProntuarioEncounterId as encode, prontuarioPayloadFingerprint as fingerprint } from "../../client/src/lib/prontuarioEncounterId";

test("seções persistem com ID opaco e voltam para a chave original", () => {
  const ids = ["encounter", "anamnese:queixaPrincipal", "marcos:crises", "medicacao:a1-b2", "terapia:c3", "exame:d4"];
  for (const id of ids) {
    assert.match(encode(id), /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/);
    assert.equal(decode(encode(id)), id);
    assert.equal(decode(id), id);
  }
  assert.equal(new Set(ids.map(encode)).size, ids.length);
  assert.throws(() => encode("regra:inválida"));
});

test("compara payload já salvo sem substituir campos omitidos ou vazios", () => {
  assert.equal(fingerprint({ a: 2, b: { x: 1, c: undefined } }), fingerprint({ b: { x: 1 }, a: 2 }));
  assert.notEqual(fingerprint({ valueText: "" }), fingerprint({ valueText: "Não" }));
});
