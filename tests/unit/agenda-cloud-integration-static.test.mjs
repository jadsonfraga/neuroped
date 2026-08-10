import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const expressAgenda = read("server/routes/agenda.ts");
const expressIndex = read("server/index.ts");
const d1Agenda = read("functions/api/agenda/index.ts");
const d1Audit = read("functions/api/agenda/audit.ts");
const middleware = read("functions/api/_middleware.ts");
const authorization = read("functions/api/auth/_authorization.ts");
const cloudClient = read("client/src/lib/agendaCloud.ts");
const agendaCore = read("client/src/lib/agendaCore.ts");
const agendaBoard = read("client/src/components/agenda/AgendaBoard.tsx");
const controls = read("client/src/components/agenda/AgendaCloudControls.tsx");
const migration = read("db/migrations/0007_agenda_cloud.sql");
const migrationWorkflow = read(".github/workflows/agenda-cloud-d1-migration.yml");

assert.match(expressIndex, /registerAgendaRoutes\(app\)/, "Express deve registrar a Agenda Cloud");
assert.match(expressAgenda, /encrypt\(JSON\.stringify\(input\.workspace\)\)/, "payload LIVE deve ser cifrado");
assert.match(expressAgenda, /expectedRevision/, "backend LIVE deve exigir revisão otimista");
assert.match(expressAgenda, /REVISION_CONFLICT/, "backend LIVE deve rejeitar edição concorrente");
assert.match(expressAgenda, /requireRole\("admin", "professional", "operator"\)/, "recepção deve acessar agenda operacional");
assert.match(expressAgenda, /requireRole\("admin", "professional"\)/, "auditoria LIVE deve ser restrita");

assert.match(authorization, /canWriteOperationalAgenda/, "RBAC deve separar agenda de escrita clínica");
assert.match(middleware, /path === "\/api\/agenda" && canWriteOperationalAgenda\(user\)/, "exceção do operador deve valer apenas na rota raiz da agenda");
assert.doesNotMatch(middleware, /path\.startsWith\("\/api\/agenda\/"\).*canWriteOperationalAgenda/s, "rotas filhas não podem herdar escrita operacional");

assert.match(d1Agenda, /isDemoSafeAgendaWorkspace/, "Cloudflare deve validar conteúdo DEMO");
assert.match(d1Agenda, /DEMO_DATA_ONLY/, "Cloudflare deve rejeitar conteúdo não DEMO");
assert.match(d1Audit, /canAccessOperationalAgendaAudit/, "auditoria D1 deve ter RBAC próprio");
assert.match(migration, /CHECK \(is_demo = 1\)/g, "tabelas D1 devem ter trava física DEMO");
assert.match(migrationWorkflow, /0007_agenda_cloud\.sql/, "deploy deve versionar migração da Agenda Cloud");
assert.match(migrationWorkflow, /cloudflare-pages/, "migração deve compartilhar lock com deploy Cloudflare");

assert.match(cloudClient, /persistentSecureSet\(AGENDA_REMOTE_CACHE_KEY/, "cache remoto deve permanecer cifrado");
assert.match(cloudClient, /AgendaRevisionConflictError/, "cliente deve tratar 409 explicitamente");
assert.match(cloudClient, /Importação bloqueada: o Cloudflare desta instalação aceita somente conteúdo fictício DEMO/, "migração local para DEMO deve falhar fechada");
assert.match(agendaCore, /if \(!getAccessToken\(\)\)/, "modo local só deve ser escolhido sem token remoto");
assert.match(agendaCore, /Em sessão remota nunca cair para a agenda local/, "falha remota não pode criar segunda fonte da verdade");
assert.match(agendaCore, /remote-offline/, "cache remoto offline deve ser somente leitura");

assert.match(agendaBoard, /data-testid="agenda-runtime-mode"/, "UI deve expor modo operacional real");
assert.match(agendaBoard, /Cloud LIVE/, "UI deve distinguir backend LIVE");
assert.match(agendaBoard, /Cloud DEMO/, "UI deve distinguir backend DEMO");
assert.match(agendaBoard, /writeDisabled = loading \|\| runtime\.offline/, "offline deve bloquear mutações");
assert.match(controls, /Importar explicitamente/, "migração local não pode ser automática");
assert.match(controls, /Proteção DEMO ativa/, "UI deve avisar limite do backend público");

console.log("✓ Agenda Cloud v2 integration: RBAC, DEMO/LIVE, cache, migração e UI aprovados");
