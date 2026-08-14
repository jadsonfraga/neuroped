import assert from "node:assert/strict";
import fs from "node:fs";

const patientsPage = fs.readFileSync("client/src/pages/pacientes.tsx", "utf8");
const patientDetail = fs.readFileSync(
  "client/src/pages/paciente-detalhe.tsx",
  "utf8",
);
const resultPagination = fs.readFileSync(
  "client/src/lib/patientResultsPagination.ts",
  "utf8",
);
const cloudflareResults = fs.readFileSync(
  "functions/api/patients/[id]/results.ts",
  "utf8",
);
const expressRoutes = fs.readFileSync("server/routes.ts", "utf8");
const confirmDialog = fs.readFileSync(
  "client/src/components/ConfirmDialog.tsx",
  "utf8",
);
const patientCockpit = fs.readFileSync(
  "client/src/components/clinical/PatientCockpit.tsx",
  "utf8",
);

// A lista nunca pode transformar falha de rede em estado vazio.
const listLoading = patientsPage.indexOf("{isLoading ? (");
const listError = patientsPage.indexOf(") : isError ? (", listLoading);
const listEmpty = patientsPage.indexOf(
  ") : filtered.length === 0 ? (",
  listError,
);
assert.ok(
  listLoading >= 0 && listLoading < listError && listError < listEmpty,
  "pacientes deve ordenar loading, error e empty como estados distintos",
);
assert.match(patientsPage, /refetch: refetchPatients/);
assert.match(patientsPage, /void refetchPatients\(\)/);

// O backup é transacional: pagina os dois runtimes, exige todas as respostas e
// somente cria o arquivo depois que o carregamento integral terminou.
assert.match(
  patientsPage,
  /\/api\/patients\?page=\$\{page\}&limit=\$\{BACKUP_PAGE_SIZE\}&offset=\$\{offset\}/,
);
assert.match(patientsPage, /all\.length === expectedTotal/);
assert.match(patientsPage, /current\.hasMore === false/);
assert.match(patientsPage, /getWithRateLimitBackoff/);
assert.match(patientsPage, /loadAllPatientResults\(patientId\)/);
assert.match(
  resultPagination,
  /page=\$\{requestedPage\}&limit=\$\{pageSize\}&offset=\$\{offset\}/,
);
assert.match(resultPagination, /seenIds\.has\(id\)/);
assert.match(resultPagination, /status[^\n]{0,80}429/);
assert.match(resultPagination, /Retry-After|retryAfter/);
for (const apiSource of [cloudflareResults, expressRoutes]) {
  assert.match(apiSource, /data,/);
  assert.match(apiSource, /total,/);
  assert.match(apiSource, /page,/);
  assert.match(apiSource, /limit,/);
  assert.match(apiSource, /hasMore:/);
}
assert.doesNotMatch(
  patientsPage,
  /catch\s*\{\s*results\[[^\]]+\]\s*=\s*\[\]/,
  "falha de resultados não pode ser convertida silenciosamente em lista vazia",
);
const resultsFetch = patientsPage.indexOf(
  "for (const patient of backupPatients)",
);
const blobCreation = patientsPage.indexOf(
  "const blob = new Blob",
  resultsFetch,
);
assert.ok(
  resultsFetch >= 0 && blobCreation > resultsFetch,
  "o arquivo só pode nascer depois do carregamento de resultados",
);
assert.match(patientsPage, /Backup completo de/);
assert.match(patientsPage, /Nenhum arquivo parcial foi salvo/);

// A importação distingue paciente integral, parcial e não criado; um erro de
// resultado nunca pode ser engolido e contabilizado como sucesso integral.
assert.match(patientsPage, /let partial = 0/);
assert.match(patientsPage, /let failedResults = 0/);
assert.match(patientsPage, /patientComplete = false/);
assert.match(patientsPage, /if \(patientComplete\) imported\+\+/);
assert.match(patientsPage, /Importação concluída com pendências\./);
assert.doesNotMatch(
  patientsPage,
  /pula resultados com erro/,
  "falhas de resultados não podem ser engolidas pelo importador",
);

// O detalhe diferencia carga, erro geral e 404; a ausência de avaliações só é
// exibida após sucesso da consulta de resultados.
assert.match(patientDetail, /isLoading: patientLoading/);
assert.match(patientDetail, /isError: patientIsError/);
assert.match(patientDetail, /isNotFoundError\(patientError\)/);
assert.match(patientDetail, /title="Paciente não encontrado"/);
assert.match(patientDetail, /void refetchPatient\(\)/);
const resultsLoading = patientDetail.indexOf("{resultsLoading ? (");
const resultsError = patientDetail.indexOf(
  ") : resultsUnavailable ? (",
  resultsLoading,
);
const resultsEmpty = patientDetail.indexOf(
  ") : sortedResultsDesc.length === 0 ? (",
  resultsError,
);
assert.ok(
  resultsLoading >= 0 &&
    resultsLoading < resultsError &&
    resultsError < resultsEmpty,
  "resultados deve ordenar loading, error e empty sem falso vazio",
);
assert.match(
  patientDetail,
  /<PatientCockpit[\s\S]*?scaleCount=\{\s*resultsLoading \|\| resultsUnavailable \? null : results\.length\s*\}/,
  "cockpit deve permanecer montado e representar contagem indisponível",
);
assert.doesNotMatch(
  patientDetail,
  /!resultsLoading && !resultsUnavailable && \(\s*<PatientCockpit/,
  "falha de avaliações não pode desmontar todo o cockpit longitudinal",
);
assert.match(patientCockpit, /scaleCount: number \| null/);
assert.match(
  patientCockpit,
  /scaleCount === null \? "Indisponível"/,
  "ausência da contagem não pode ser anunciada como zero",
);
assert.match(patientDetail, /O relatório não pode ser montado/);

// Exportação e cópia só anunciam sucesso após concluir a API correspondente;
// falhas mantêm o usuário na tela com feedback explícito.
assert.match(
  patientDetail,
  /async function exportAsImage\(\)[\s\S]*?try \{[\s\S]*?await html2canvas[\s\S]*?catch \{[\s\S]*?Não foi possível exportar a imagem\./,
);
assert.match(
  patientDetail,
  /async function copyReportText\(\)[\s\S]*?try \{[\s\S]*?await navigator\.clipboard\.writeText\(text\)[\s\S]*?catch \{[\s\S]*?Não foi possível copiar o relatório\./,
);
assert.match(patientDetail, /disabled=\{imageExporting \|\| reportCopying\}/);

// Exclusão é uma ação destrutiva confirmada, acessível e observável.
assert.match(patientDetail, /aria-label={`Excluir avaliação /);
assert.match(patientDetail, /setResultPendingDeletion\(\{/);
assert.doesNotMatch(
  patientDetail,
  /onClick=\{\(\) => deleteResultMutation\.mutate/,
  "o botão de lixeira não pode excluir imediatamente",
);
assert.match(patientDetail, /<ConfirmDialog[\s\S]*?variant="destructive"/);
assert.match(
  patientDetail,
  /deleteResultMutation\.mutate\(resultPendingDeletion\.id\)/,
);
assert.match(
  patientDetail,
  /onSettled: async \(\) => \{[\s\S]*?invalidateQueries\(\{[\s\S]*?\/api\/patients\/\$\{patientId\}\/results/,
);
assert.match(
  patientDetail,
  /onError: \(\) => \{[\s\S]*?Não foi possível excluir a avaliação\.[\s\S]*?variant: "destructive"/,
);
assert.doesNotMatch(
  patientDetail,
  /(?:permanece|foi) preservad[oa]/i,
  "erro ambíguo de DELETE não pode afirmar que o registro foi preservado",
);

// Confirmações destrutivas usam o primitive modal com foco, inert e Escape
// providos pelo Radix; a API visual anterior continua compatível.
assert.match(
  confirmDialog,
  /@radix-ui\/react-alert-dialog/,
  "confirmação deve usar AlertDialog acessível",
);
assert.match(confirmDialog, /<AlertDialogPrimitive\.Root/);
assert.match(confirmDialog, /<AlertDialogPrimitive\.Title/);
assert.match(confirmDialog, /<AlertDialogPrimitive\.Description/);
assert.match(confirmDialog, /<AlertDialogPrimitive\.Cancel asChild>/);
assert.match(confirmDialog, /<AlertDialogPrimitive\.Action asChild>/);
assert.doesNotMatch(confirmDialog, /role="alertdialog"/);

console.log(
  "[patient-ui-safety] ✓ estados, backup e exclusão falham de forma segura",
);
