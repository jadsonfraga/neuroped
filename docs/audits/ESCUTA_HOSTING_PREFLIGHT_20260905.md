# Escuta Clínica: verificação real dos ambientes

Run33986949157 (05/09/2026,19:23UTC), apenasGET, sem alteração de configuração, ambiente, segredo ou publicação.

Cloudflare: GET do projeto canônico retornou200, nome neuroped, subdomínio neuroped.pages.dev. Em preview e production: bindingAI ausente, ESCUTA_ENABLED não ativo e CLINICAL_LIVE_ENABLED não ativo. Portanto há acesso ao projetoPages, mas não se pode afirmar que a camada clínica/IA esteja provisionada. Esse acesso não elimina a negativa401 do teste REST de inferência. O uso de binding nativo é uma configuração de runtime distinta, ainda não provisionada/validada nesta execução. Não ativar a camada clínica global apenas para forçar um teste a passar.

Vercel: conector recebeu404 ao tentar oIDcanônico prj_8gsXbaQoOZHgbhjnqiMPR9A5jg5b na equipe visível. Em seguida, o preflight usou os segredos existentes VERCEL_TOKEN/VERCEL_ORG_ID do próprio pipeline e consultou esse projeto: HTTP403. Não foi criado substituto nem alterado domínio/produção. Bloqueio de escopo/credencial real, não simples ausência de página na lista.

Provedores: WorkersAI REST401 com áudio sintético; alternativaGemini sem segredo configurado (run33986559701). Nenhuma saída clínica foi inventada para esconder essas falhas.

CI: o prebuild canônico modifica sw-build.js, _buildInfo.ts e interactiveScaleIds.generated.ts por projeto. O guard de imutabilidade passa a verificar que nenhuma outra fonte mudou, que SHA/versão dos metadados são exatos e que o inventário se reproduz pelo gerador oficial. Não editar saídas geradas manualmente nem ignorar mudanças inesperadas. Testes de produto foram mantidos integralmente.

Liberação permanece bloqueada até runtime e identidade clínica de teste autorizada, inferência real, persistência real e espelhoVercel verificados. PR797 continuaDraft; esta execução não mesclou emmain nem publicou o módulo. Mudanças independentes no main devem continuar preservadas.
