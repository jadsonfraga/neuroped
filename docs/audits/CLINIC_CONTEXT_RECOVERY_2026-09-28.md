# Recuperação do contexto clínico — 28/09/2026

Refs #1039; dependência externa já rastreada em #926 / PR #1035.
Baseline: b97ebcfcada5e68caa256a912a52822bb6e4b1c3.

## Achado e correção transversal

Agenda e Conecta podiam montar consultas antes do retorno de /api/tenants.
Pacientes e Prontuário aguardavam activeClinicId, mas a ausência desse contexto
não tinha um caminho uniforme de recuperação. O seletor de clínica sumia quando
a conta não possuía vínculos. reloadClinics não descartava respostas tardias de
identidade anterior ou de requisições concorrentes. Estado inicial isLoading=false
permitia confundir bootstrap em andamento com contexto ausente.

ClinicProvider agora separa carregando, resposta válida, ausência de associação
e falha de transporte. A resposta só é aplicada se geração, identidade/modo e
época real de autenticação ainda coincidirem. Cleanup cancela a consulta; timeout
impede carregamento indefinido. A seleção persistida é preservada durante o
bootstrap e uma seleção revogada não reutiliza caches de outra clínica.

ClinicRouteBoundary impede o mount das consultas dependentes de /agenda,
/conecta, /pacientes, /paciente e /prontuario até a resolução do vínculo real.
Exibe recuperação explícita por nova leitura, sem conceder permissões, criar
clínica ou assinatura. O seletor mantém esse caminho acessível no restante do app.

Auth, papéis, isolamento, billing e bloqueio de persistência clínica browser-local
continuam valendo antes desta fronteira de dependência. CAA, família, agendamento
público, onboarding, configurações, formulários em memória e demais ferramentas
não recebem esta dependência. A recepção conserva suas restrições próprias.
Nenhum provisionamento institucional foi repetido e nenhuma linha D1 foi alterada.

## Verificação

Local: node --experimental-strip-types tests/unit/clinic-context-readiness.test.mjs;
node tests/unit/live-tenant-client-boundary.test.mjs;
node --check tests/e2e/clinic-context-readiness.mjs; git diff --check.
Todos concluíram com saída 0. Build/lint e navegador ainda dependem do CI no SHA
final: não se considera a criação desta documentação evidência de execução.

O workflow LIVE browser persistence guard preserva todos os passos existentes e
adiciona testes da política e jornada da interface compilada com API localhost
explicitamente sintética: cinco famílias de rotas sem vínculo; contexto atrasado;
falha 503; resposta malformada; atualização real pelo botão; nenhuma consulta de
dados antes da resolução; CAA independente da falha de contexto institucional.
Esses testes não simulam uma prova de sessão publicada ou de persistência D1.

## Bloqueios externos não mascarados

No mesmo baseline, o audit de produção 36453519010 (16:47 UTC) terminou com
ready=false: CLINICAL_CRYPTO_NOT_READY, LGPD_BUCKET_NOT_CONFIGURED e
LGPD_EXPORT_NOT_CONFIGURED. O artefato 10984496536 foi baixado e validado
(SHA-256 52e2cdbdcdcc6b78af4041105760b2d89a08443de48006c04315a0c085a065af).
Nomes de secrets presentes não provam chaves utilizáveis; R2 informou permissão
negada e binding ausente. Não substituir chaves desconhecidas, fabricar valores,
relaxar criptografia ou criar bucket público para produzir resultado verde.
A correção de UI não remove estes bloqueadores nem certifica prontidão clínica.

A criação/edição/releitura de agendamento na sessão legítima continua pendente
em #1039. Não usar senha administrativa como fallback, elevar a conta E2E
reservada ou forjar tokens. Registrar publicação no SHA final separadamente.

## Rollback

Revert normal desta PR. Não há migration, alteração de segredo, cobrança,
concessão de acesso, mudança de clínica institucional ou dados clínicos a desfazer.
A reversão remove a recuperação de contexto, não autoriza nenhuma fonte local.
