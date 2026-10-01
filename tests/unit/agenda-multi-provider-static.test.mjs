/**
 * agenda-multi-provider-static.test.mjs — issue #1064, etapa C.
 *
 * Contrato estático da UI da recepção com mais de um profissional. A prova de
 * comportamento no navegador está em tests/e2e/agenda-multi-provider.mjs; este
 * arquivo guarda o que não pode regredir no código mesmo onde o e2e não roda.
 *
 * Rodar: node tests/unit/agenda-multi-provider-static.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const agenda = read("client/src/pages/agenda.tsx");
const helper = read("client/src/lib/agendaProvider.ts");
const recepcao = read("client/src/pages/recepcao.tsx");

// O profissional vai na chave da consulta: o cache de uma agenda nunca aparece em outra.
assert.match(agenda, /const dashboardKey = dashboardKeyFor\(providerId\)/);
assert.match(agenda, /useQuery<OperationsDashboard>\(\{ queryKey: \[dashboardKey\] \}\)/);
assert.doesNotMatch(agenda, /DASHBOARD_KEY/, "a chave fixa sem profissional saiu: cada agenda tem a sua");

// As ações vão para o profissional escolhido pela query; o corpo nunca o carrega.
assert.match(agenda, /apiRequest\("POST", operationsUrlFor\(providerId\), payload\)/);
assert.doesNotMatch(agenda, /apiRequest\("POST", "\/api\/operations"/, "POST sem passar pelo helper perderia o profissional escolhido");
assert.doesNotMatch(agenda, /providerUserId:\s*providerId|provider:\s*providerId/, "o profissional não vai no corpo da ação");
assert.match(helper, /`\$\{OPERATIONS_ENDPOINT\}\?provider=\$\{encodeURIComponent\(id\)\}`/, "a escolha viaja só na query");

// Todas as agendas em cache são invalidadas (cada uma tem a própria chave).
assert.match(
  agenda,
  /invalidateQueries\(\{ predicate: \(query\) => apiQueryKeyMatches\(query\.queryKey, OPERATIONS_ENDPOINT\) \}\)/,
);

// Escolha: tela do 409, barra com o rótulo e seletor só com mais de um profissional.
assert.match(agenda, /const selectionRequired = parseSelectionRequired\(dashboard\.error\)/);
assert.match(agenda, /<ProviderChooser providers=\{selectionRequired\} onChoose=\{chooseProvider\} \/>/);
assert.match(agenda, /data-testid="agenda-provider-bar"/);
assert.match(agenda, /data-testid="agenda-provider-label"/);
assert.match(agenda, /Agenda de <strong className="text-foreground">\{data\.access\.providerName\}<\/strong>/, "rótulo fixo 'Agenda de <profissional>'");
assert.match(agenda, /\{providerChoices\.length > 1 && \(/, "o seletor só aparece com mais de um profissional");
assert.match(agenda, /data-testid="agenda-provider-select"/);

// O rótulo fica FORA das abas (visível em todas) e antes delas.
assert.ok(
  agenda.indexOf('data-testid="agenda-provider-bar"') < agenda.indexOf("<Tabs value={activeTab}"),
  "a barra da agenda em operação vem antes das abas, então vale para todas",
);

// Etapa D: visão unificada do dia. Só leitura, sem endpoint novo, e só para a
// recepção com mais de um profissional.
const unified = read("client/src/components/AgendaUnifiedDay.tsx");
const unifiedLib = read("client/src/lib/agendaUnifiedDay.ts");
// As asserções "nunca faz X" valem para o CÓDIGO; comentários podem citar o que não fazem.
const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const unifiedCode = stripComments(unified + unifiedLib);
assert.match(agenda, /const unifiedAvailable = data\.access\.delegated && providerChoices\.length > 1/, "só a recepção com mais de um profissional vê a aba");
assert.match(agenda, /\{unifiedAvailable && <TabsTrigger value="dia">Dia de todos<\/TabsTrigger>\}/);
assert.match(agenda, /const activeTab = tab === "dia" && !unifiedAvailable \? "agenda" : tab/, "sem direito à aba, volta para a agenda");
assert.match(
  agenda,
  /onOpenAgenda=\{\(providerUserId\) => \{\s+chooseProvider\(providerUserId\);\s+setTab\("agenda"\);\s+\}\}/,
  "abrir a agenda de um profissional usa a escolha normal e volta para a aba da agenda",
);
// Cada profissional é buscado pela chave da etapa C (um par validado no servidor).
assert.match(unified, /queryKey: \[dashboardKeyFor\(choice\.id\)\]/, "mesma chave por profissional da etapa C");
assert.doesNotMatch(unifiedCode, /apiRequest|\bfetch\(|useMutation|method:\s*"(POST|PUT|PATCH|DELETE)"/, "a visão do dia é só leitura");
assert.doesNotMatch(unifiedCode, /["'`]\/api\/operations/, "sem endpoint novo nem URL montada à mão: só dashboardKeyFor");
assert.doesNotMatch(unifiedCode, /localStorage|sessionStorage/, "nada é guardado no navegador");
assert.match(unified, /staleTime: 0/, "o dia é rebuscado ao abrir a aba (o padrão do app nunca rebusca)");
assert.match(unified, /selectUnifiedProviders\(providers\)/, "o número de profissionais combinados tem teto");
assert.match(unifiedLib, /appointment\.providerUserId !== choice\.id\) continue/, "consulta de outro dono nunca é rotulada com este profissional");
assert.match(unifiedLib, /data\.access\?\.providerUserId === choice\.id/, "agenda cujo dono não é o pedido vira erro");
assert.match(unified, /role="group"[\s\S]{0,80}aria-label=|tabIndex=\{0\}[\s\S]{0,40}role="group"/, "região com rolagem alcançável pelo teclado");

// Cancelar, remarcar e demais ações dizem em qual agenda agiram.
assert.match(agenda, /const agendaOf = agendaOfSuffix\(data\.access\.delegated, data\.access\.providerName\)/);
assert.match(agenda, /`Consulta: \$\{statusLabel\[status\]\}\$\{agendaOf\}\.`/, "status/cancelamento nomeia a agenda");
assert.match(agenda, /`Consulta remarcada\$\{agendaOf\}\.`/, "remarcação nomeia a agenda");
assert.match(agenda, /Remarcando na agenda de \{data\.access\.providerName\}/, "o formulário de remarcação nomeia a agenda");
assert.match(agenda, /title=\{agendaOf \? `Remarcar\$\{agendaOf\}` : undefined\}/);
assert.match(agenda, /title=\{agendaOf \? `\$\{statusLabel\[status\]\}\$\{agendaOf\}` : undefined\}/);

// Trocar de profissional descarta o que estava sendo digitado.
assert.match(agenda, /const activeProviderId = data\?\.access\.providerUserId \?\? null/);
assert.match(
  agenda,
  /setManual\(\{ serviceId: "", startsAtLocal: "", patientId: "", guardianName: "", patientName: "", phone: "", email: "" \}\);\s+setRescheduling\(null\);\s+setPatientSearch\(""\);\s+\}, \[activeProviderId\]\)/,
);

// Só a recepção com vários profissionais manda `provider`; escolha obsoleta é esquecida.
assert.match(agenda, /!data\.access\.delegated \|\| \(data\.access\.availableProviders\?\.length \?\? 0\) <= 1/);
assert.match(agenda, /isProviderUnavailable\(dashboard\.error\)/, "escolha lembrada recusada pelo servidor volta a pedir a escolha");

// localStorage só pelo helper, por conta, em try/catch; nunca direto na página.
assert.doesNotMatch(agenda, /localStorage|sessionStorage/, "a página não toca o armazenamento direto");
assert.match(helper, /neuroped:agenda:provider:v1/);
assert.ok((helper.match(/try \{/g) ?? []).length >= 4, "toda leitura/escrita do armazenamento é protegida");
assert.doesNotMatch(helper, /patient|paciente|guardian|email|phone/i, "nada de dado de paciente no armazenamento da escolha");

// Escopo: a página de pré-consultas (recepcao.tsx) não usa a API de operações.
assert.doesNotMatch(recepcao, /api\/operations/, "recepcao.tsx é local (pré-consultas); só a agenda consome /api/operations");

console.log("agenda-multi-provider-static: chave por profissional, POST pelo helper sem corpo, invalidação de todas as agendas, rótulo antes das abas, ações nomeiam a agenda, formulários limpos na troca e armazenamento só pelo helper OK");
