# Auditoria: unidade no campo Dose do Prontuário

O formulário é de documentação do que o profissional informa, não de prescrição. O campo Dose aceita texto. O evento estruturado `doseMg` representa apenas massa expressa em miligramas. A UI e o relatório devem usar a mesma interpretação estrita. Preservar o texto literal independentemente da unidade e não inferir conversões, concentração, composição de faixas ou quantidades a partir de abreviações.

Critério de segurança: quando Dose não for uma massa inequívoca em mg, não registrar `doseMg` e não exibir razão mg/kg. Quando o peso estiver indisponível ou não for uma massa positiva inequívoca no campo já rotulado em kg, não mostrar a razão. Não alterar ou migrar registros, PDFs ou prescrições anteriores. Nenhuma conversão clínica nova faz parte do patch.

Referência sobre identificação clara de unidade: [Protocolo de segurança na prescrição, uso e administração de medicamentos (Anvisa/Ministério da Saúde)](https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/servicosdesaude/publicacoes/protocolo-de-seguranca-na-prescricao-uso-e-administracao-de-medicamentos).

Rollback: reverter o patch de apresentação e serialização; não há migração. Sem aceite específico, não corrigir dados históricos em massa.

## Reprodução e teste

- Antes: na aplicação compilada, um formulário sintético com `5 mL` persistiu o texto e, incorretamente, `doseMg: 5`. A prova fez login, enviou pelo formulário, voltou a ler o evento da API canônica e falhou com `5 !== undefined`.
- Depois: o mesmo teste usou Chromium, Worker Pages Functions e D1 local (sem serviço externo). Conferiu leitura de quatro registros: volume, faixa e concentração ficaram só no texto, e a massa explícita continuou disponível no campo estruturado. Após recarga, a ficha, a prévia e o HTML de impressão apresentaram a única razão legítima.
- Comando: com build autenticado e Worker local compilado, configure `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, `SCALE_RETRY_WORKER` e `SCALE_RETRY_MINIFLARE`, e rode `node --import tsx tests/e2e/fixtures/run-live-scale-save-retry.mjs --prontuario-dose`. Use uma fixture D1 nova; reutilizar a mesma sessão de uma jornada longa pode acionar o limite real do middleware. Não foi alterado.
- Publicar a correção não varre nem regrava dados anteriores. Se o profissional salvar um prontuário novamente, a trilha normal de supersessão pode registrar o metadado corrigido sem apagar a versão anterior. Uma revisão retroativa em lote é outro escopo.
