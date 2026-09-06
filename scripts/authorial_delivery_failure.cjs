'use strict';

// Public operational metadata only. Never attach logs, message bodies, credentials,
// or patient data to the incident. A successful/no-op run does NOT prove recovery.
const MARKER = '<!-- neuroped-authorial-delivery-incident-v1 -->';
const TITLE = '[automação] Falha no arquivamento das escalas autorais';

module.exports = async function reportAuthorialDeliveryFailure({ github, context, core, results }) {
  if (context.eventName === 'pull_request' || context.ref !== 'refs/heads/main') {
    return { status: 'not_applicable' };
  }
  const failed = Object.entries(results).filter(([, value]) => value === 'failure' || value === 'cancelled');
  if (failed.length === 0) return { status: 'no_incident' };
  const { owner, repo } = context.repo;
  if (!Number.isSafeInteger(context.runId) || context.runId <= 0) {
    throw new Error('Invalid workflow run ID; no incident was written.');
  }
  const runUrl = `https://github.com/${owner}/${repo}/actions/runs/${context.runId}`;
  const states = failed.map(([job, value]) => {
    if (!['test', 'deliver'].includes(job)) throw new Error('Unexpected job name.');
    return `- ${job}: ${value}`;
  }).join('\n');
  const body = `${MARKER}\n## Incidente operacional não resolvido\n\n` +
    `Última execução com falha: ${runUrl}\n\n${states}\n\n` +
    'Não considerar o turno concluído. Verificar o erro no runner, os PDFs e os recibos persistentes antes de recuperar. ' +
    'Uma falha após envio de resultado incerto exige reconciliação do recibo; não fazer reenvio cego. ' +
    'Um teste verde ou execução sem novos arquivos não comprova envio nem entrega.\n\n' +
    'O incidente não é encerrado automaticamente por uma execução vazia. Encerrar somente após verificar a causa e a recuperação. ' +
    'Não publicar logs brutos, dados clínicos ou valores de credenciais nesta issue.\n';
  const issues = await github.paginate(github.rest.issues.listForRepo, { owner, repo, state: 'open', creator: 'github-actions[bot]', per_page: 100 });
  const existing = issues.find((issue) => !issue.pull_request && issue.user?.login === 'github-actions[bot]' && typeof issue.body === 'string' && issue.body.includes(MARKER));
  const result = existing
    ? await github.rest.issues.update({ owner, repo, issue_number: existing.number, title: TITLE, body })
    : await github.rest.issues.create({ owner, repo, title: TITLE, body });
  core.warning(`Incidente de arquivamento registrado: issue #${result.data.number}.`);
  return { status: existing ? 'updated' : 'created', issue: result.data.number };
};
