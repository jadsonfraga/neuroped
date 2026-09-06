# Escuta Clínica — integração em validação

Data: 2026-09-05. Não é autorização de uso clínico nem alegação de equivalência a produtos externos.

## Arquitetura

Frontend React/Vite protegido por RouteGuard, sessão e clínica do NeuroPed. Áudio PCM mono 16 kHz capturado por AudioWorklet, pausa/retomada, encerramento com drenagem final, liberação de tracks, reprodução e exportação WAV. Segmentar PCM em blocos válidos completos antes da inferência; não cortar um contêiner de áudio arbitrariamente. Áudio na memória da aba, sem persistência automática; fechamento/reload descarta conteúdo não salvo.

POST /api/live/escuta exige sessão persistida, vínculo ativo e papel clínico com escrita, entitlement existente, autorização explícita para gravar/processar, flag ESCUTA_ENABLED e binding AI. Cloudflare Workers AI transcreve e estrutura; não usa chave da conta OpenAI. JSON/body/áudio limitados; silêncio digital rejeitado e VAD solicitado; cotas atômicas por clínica/usuário antes da inferência. Falha de banco/provedor não vira sucesso. IDs, modelos e tempo retornados sem PHI em logs. Timeout de aplicação não garante cancelamento da inferência já recebida pelo provedor.

Nota contém apenas seções com fontes literais. Existência literal da fonte não prova correção semântica. Preservar negativas/incerteza e manter revisão do médico. Sem assinatura/diagnóstico/prescrição automáticos. Salvar usa /api/live/documents já existente, com criptografia, versão, tenant e visibilidade familiar falsa. Não cria segundo banco/prontuário.

Vercel permanece espelho de frontend com API canônica Cloudflare. Política de microfone passa a same-origin, nunca captura automática; páginas públicas de convite mantêm bloqueio próprio. CSP permite reprodução de blob de áudio. Nenhum dado identificável foi usado nos testes.

## Verificações e limites

Testes locais: 30 asserções dos contratos WAV/nota/transcrição/exportação; 5 asserções do AudioWorklet em VM, incluindo dreno final, pausa/retomada, resampling e contador de limite. Esses testes não são microfone físico nem validação clínica. CI executa typecheck, lint, build do frontend e compilação Pages Functions. Job separado chama provedor real com voz sintética e produz artifacts/escuta/provider.json; só esse relatório pode atestar êxito das chamadas, nunca a existência do código.

Limites configurados: gravação até 60 minutos; arquivo até 25 MiB; trechos até 60 segundos; transcrição até 60 mil caracteres. Gravação real de 60 minutos, iPhone/Safari físico, ruído/vozes sobrepostas, interpretação clínica e fluxo completo em produção NÃO validados nesta revisão. Não apresentar limite configurado como teste aprovado. Política/retenção do provedor e base de tratamento devem ser revistas antes de dados reais.

## Bloqueios externos

- BLOCKED_EXTERNAL_CLOUDFLARE_AI: binding AI e flag ESCUTA_ENABLED precisam existir no ambiente alvo, com permissão e capacidade do provedor verificadas. Sem isso, serviço retorna 503 explícito, não transcript fictício. O job provider registra HTTP/motivo caso credencial de deploy não tenha permissão de inferência. Verificação: requisição sintética real gera transcrição e nota sustentada.
- BLOCKED_EXTERNAL_VERCEL_SCOPE: conector atual lista uma equipe sem projetos; isso não prova ausência do NeuroPed em outra equipe. Publicação deve usar pipeline oficial já existente e confirmar seu resultado, sem criar novo projeto na conta errada.
- BLOCKED_EXTERNAL_PRODUCTION_E2E: não usar conta técnica de leitura para contornar autorização clínica, não criar associação persistida falsa nem acessar pacientes reais para testes. Validação final exige identidade clínica de teste autorizada e dados sintéticos isolados.

## Rollback

Antes de merge: descartar PR/branch sem tocar main. Depois de publicação: desabilitar ESCUTA_ENABLED para fail-closed imediato, reverter o commit do módulo pelo pipeline oficial, preservando documentos já salvos no fluxo canônico. Nenhuma migração destrutiva. Não remover regras de autorização, checks, rotas existentes ou registros clínicos.
