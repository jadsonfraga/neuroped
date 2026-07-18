import assert from "node:assert/strict";
import { formatPhoneNumber, isValidPhone } from "../../client/src/lib/phoneBr.ts";

// formatPhoneNumber — caminho sensível (número errado = relatório para outra pessoa).
assert.equal(formatPhoneNumber("(85) 98765-4321"), "5585987654321", "celular c/ DDD e máscara");
assert.equal(formatPhoneNumber("85987654321"), "5585987654321", "celular 11 dígitos");
assert.equal(formatPhoneNumber("8532654321"), "558532654321", "fixo 10 dígitos");
// DDD 55 (Santa Maria/RS): o bug antigo com startsWith('55') comia o país.
assert.equal(formatPhoneNumber("55999998888"), "5555999998888", "DDD 55 (11 díg) prefixa país");
assert.equal(formatPhoneNumber("5532654321"), "555532654321", "DDD 55 (10 díg) prefixa país");
// Já com código do país.
assert.equal(formatPhoneNumber("5585987654321"), "5585987654321", "13 díg começando com 55");
assert.equal(formatPhoneNumber("558532654321"), "558532654321", "12 díg começando com 55");
// Internacional já completo (12–15 díg).
assert.equal(formatPhoneNumber("12125551234000"), "12125551234000", "internacional 14 díg");
// Lixo / incompleto → "".
assert.equal(formatPhoneNumber(""), "", "vazio");
assert.equal(formatPhoneNumber("123"), "", "curto demais");
assert.equal(formatPhoneNumber("abc"), "", "sem dígitos");
assert.equal(formatPhoneNumber("1".repeat(16)), "", "longo demais (16 díg)");

// isValidPhone
assert.equal(isValidPhone("(85) 98765-4321"), true, "celular BR válido");
assert.equal(isValidPhone("85987654321"), true, "celular 11 díg válido");
assert.equal(isValidPhone("123"), false, "curto inválido");
assert.equal(isValidPhone(""), false, "vazio inválido");
assert.equal(isValidPhone("1".repeat(16)), false, "longo inválido");

console.log("[phone-br] ✓ formatPhoneNumber/isValidPhone — todos os casos passaram.");
