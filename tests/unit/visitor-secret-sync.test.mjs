import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Prova por comportamento: o script roda contra um dublê do wrangler cujo
// estado (segredos do Pages) fica num arquivo. Assim a remoção é observada no
// estado final, não só no texto do script.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SCRIPT = join(root, "scripts/visitor-secret-sync.sh");
const WORKFLOW = join(root, ".github/workflows/deploy-cloudflare.yml");
const KEY = "NEUROPED_VISITOR_PASSWORD";

const FAKE_WRANGLER = `#!/usr/bin/env bash
set -u
state="$FAKE_WRANGLER_STATE"
echo "$*" >> "$FAKE_WRANGLER_LOG"
touch "$state"
action="\${3:-}"
key="\${4:-}"
case "$action" in
  list)
    [ "\${FAKE_WRANGLER_FAIL_LIST:-0}" = 1 ] && exit 1
    cut -d' ' -f1 "$state" ;;
  put)
    value=$(cat)
    { grep -v "^$key " "$state" || true; printf '%s %s\\n' "$key" "$value"; } > "$state.tmp"
    mv "$state.tmp" "$state" ;;
  delete)
    [ "\${FAKE_WRANGLER_FAIL_DELETE:-0}" = 1 ] && exit 1
    [ "\${FAKE_WRANGLER_NOOP_DELETE:-0}" = 1 ] && exit 0
    { grep -v "^$key " "$state" || true; } > "$state.tmp"
    mv "$state.tmp" "$state" ;;
  *) exit 2 ;;
esac
`;

function run({ value, previous = null, extraEnv = {} }) {
  const dir = mkdtempSync(join(tmpdir(), "visitor-sync-"));
  try {
    const wrangler = join(dir, "fake-wrangler.sh");
    const state = join(dir, "state");
    const log = join(dir, "log");
    writeFileSync(wrangler, FAKE_WRANGLER, { mode: 0o755 });
    chmodSync(wrangler, 0o755);
    writeFileSync(state, previous === null ? "" : `${KEY} ${previous}\n`);
    writeFileSync(log, "");
    const env = {
      PATH: process.env.PATH,
      WRANGLER: wrangler,
      FAKE_WRANGLER_STATE: state,
      FAKE_WRANGLER_LOG: log,
      ...extraEnv,
    };
    if (value !== undefined) env.VISITOR_PW_VALUE = value;
    const result = spawnSync("bash", [SCRIPT], { env, encoding: "utf8" });
    return {
      status: result.status,
      output: `${result.stdout}${result.stderr}`,
      state: readFileSync(state, "utf8"),
      calls: readFileSync(log, "utf8"),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const SYNTHETIC_NEW = "senha-sintetica-nova-2026";
const SYNTHETIC_OLD = "senha-sintetica-antiga-2026";

// 1. Valor válido é gravado, sem remoção, e não vaza para a saída.
{
  const r = run({ value: SYNTHETIC_NEW });
  assert.equal(r.status, 0, r.output);
  assert.equal(r.state, `${KEY} ${SYNTHETIC_NEW}\n`);
  assert.doesNotMatch(r.calls, /delete/);
  assert.ok(!r.output.includes(SYNTHETIC_NEW) && !r.calls.includes(SYNTHETIC_NEW), "valor não pode vazar");
}

// 2. Valor válido substitui o anterior.
{
  const r = run({ value: SYNTHETIC_NEW, previous: SYNTHETIC_OLD });
  assert.equal(r.status, 0, r.output);
  assert.equal(r.state, `${KEY} ${SYNTHETIC_NEW}\n`);
}

// 3. Espaços nas pontas saem antes da gravação, como no servidor (trim).
{
  const r = run({ value: "   abcdefgh  " });
  assert.equal(r.status, 0, r.output);
  assert.equal(r.state, `${KEY} abcdefgh\n`);
}

// 4. O achado da revisão: segredo removido no GitHub (valor vazio) tira o
//    valor antigo do Pages. Antes da correção, a senha antiga continuava válida.
{
  const r = run({ value: "", previous: SYNTHETIC_OLD });
  assert.equal(r.status, 0, r.output);
  assert.equal(r.state, "", "segredo antigo precisa sair do Pages");
  assert.match(r.calls, /pages secret delete NEUROPED_VISITOR_PASSWORD/);
  assert.doesNotMatch(r.calls, /pages secret put/);
}

// 5. Senha inválida (7 caracteres) também remove o valor antigo, sem gravar.
{
  const r = run({ value: "1234567", previous: SYNTHETIC_OLD });
  assert.equal(r.status, 0, r.output);
  assert.equal(r.state, "", "senha inválida não pode deixar credencial antiga");
  assert.match(r.output, /::warning::/);
  assert.doesNotMatch(r.calls, /pages secret put/);
  assert.ok(!r.output.includes("1234567") && !r.calls.includes("1234567"));
}

// 6. Sem segredo prévio e sem valor: nada a remover, nenhum delete.
{
  const r = run({ value: "" });
  assert.equal(r.status, 0, r.output);
  assert.equal(r.state, "");
  assert.doesNotMatch(r.calls, /delete/);
}

// 7. Falha ao remover é fail-closed: o passo falha e a chave continua visível.
{
  const r = run({ value: "", previous: SYNTHETIC_OLD, extraEnv: { FAKE_WRANGLER_FAIL_DELETE: "1" } });
  assert.notEqual(r.status, 0, "remoção não confirmada não pode ser sucesso");
  assert.match(r.output, /::error::/);
  assert.equal(r.state, `${KEY} ${SYNTHETIC_OLD}\n`);
}

// 8. delete que "passa" mas não remove é detectado pela releitura da listagem.
{
  const r = run({ value: "", previous: SYNTHETIC_OLD, extraEnv: { FAKE_WRANGLER_NOOP_DELETE: "1" } });
  assert.notEqual(r.status, 0, "remoção sem efeito não pode ser sucesso");
  assert.match(r.output, /continua no Pages após a remoção/);
}

// 9. Sem listagem não há como confirmar a remoção: falha, não presume sucesso.
{
  const r = run({ value: "", previous: SYNTHETIC_OLD, extraEnv: { FAKE_WRANGLER_FAIL_LIST: "1" } });
  assert.notEqual(r.status, 0);
  assert.match(r.output, /não foi possível listar/);
}

// 10. O deploy usa o script e não grava o segredo pelo put_optional antigo.
{
  const workflow = readFileSync(WORKFLOW, "utf8");
  assert.match(workflow, /VISITOR_PW_VALUE="\$visitor_pw" bash scripts\/visitor-secret-sync\.sh/);
  assert.doesNotMatch(workflow, /put_optional NEUROPED_VISITOR_PASSWORD/);
}

console.log("[visitor-secret-sync] ✓ valor válido grava; ausente ou inválido remove o segredo do Pages; falha de remoção reprova o passo.");
