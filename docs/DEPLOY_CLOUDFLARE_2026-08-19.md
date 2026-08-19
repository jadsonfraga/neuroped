# Deploy Cloudflare Pages — 2026-08-19

Commit publicado: `f551b271` (`fix: finalizar experiência infantil e desbloquear release`).

Workflow: https://github.com/jadsonfraga/neuroped/actions/runs/32227609039

Estado observado em 2026-08-19 07:25 UTC: `in_progress`. Os jobs `assert-main` e `status-pending` concluíram com sucesso. No job `deploy-cloudflare`, as etapas de validação de secrets, Node.js 20, instalação de dependências, auditoria de dependências, catraca técnica completa e sentinela de deploy concluíram com sucesso. A etapa atual era `Compilar frontend para Cloudflare Pages`; as etapas de auditoria de carga, verificação do output, criação/configuração do projeto Pages, migração D1, deploy e verificações públicas ainda estavam pendentes.

Endereço canônico esperado: https://neuroped.pages.dev/#/brincando-e-aprendendo
Endereço mirror esperado: https://superneuroped.vercel.app/#/brincando-e-aprendendo


Verificação pública observada após conclusão do workflow: `https://neuroped.pages.dev/#/brincando-e-aprendendo` retornou o shell NeuroPed e o conteúdo completo da experiência infantil, incluindo as três faixas etárias, cinco arenas, missões, mascote e aviso educativo. Os assets foram servidos pelo domínio `neuroped.pages.dev` com caminhos versionados em `/assets/`. O workflow também reportou sucesso nas etapas `Deploy para Cloudflare Pages`, `Verificar publicação pública no Cloudflare`, `Validar health autenticado do backend publicado`, `Validar CORS restrito do mirror oficial` e `Verificar login (auth e2e)`.
