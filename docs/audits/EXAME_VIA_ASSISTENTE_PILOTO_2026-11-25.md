# Exame via assistente · acesso e ensaio técnico

Base `1c46d528c5287bfaf39a23f8848f00d1fd1c07c1`. Aba em **Atendimento** e no **Painel da recepção**. A entrada é `/#/exame-via-assistente` e requer sessão remota autenticada com papel operador, profissional ou administrador. Não é rota pública nem opção de PIN local. O registro das rotas garante o controle de acesso da ficha médica e do prontuário, preservando seus papéis profissionais.

A aba contém apenas o guia de atividades, 17 faixas e cartões já implementados, sem o conteúdo da ficha médica. O atalho **Abrir Observação Social** abre diretamente a modalidade existente. O operador não interpreta, registra diagnóstico, aplica manobra física nem acessa o exame clínico por este guia. As notas ficam na memória da página e encerramento/reset/recarga as descartam. Não há envio, integração com prontuário, clipboard ou gravação clínica.

## Aceite técnico local

- `node tests/unit/known-routes-sync.test.mjs`; testes de política verificam operador/profissional/admin, leitor/visitante, anônimo e modo local.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/tmp/chromium npm run test:clinical-assistant-guide`: suite clínica e navegador no tablet, incluindo anônimo, recepção, guia e bloqueios de ficha/prontuário; controles temporários e acesso à Observação Social.
- A mesma jornada `tests/e2e/exame-via-assistente.mjs` foi repetida em modo `NEUROPED_ASSISTANT_D1_URL` com Pages Worker compilado e Miniflare D1 descartável; login nominal fictício do operador e profissional. Use apenas loopback e e-mails `@example.test`. Não há API clínica sob teste no guia; D1 autentica os perfis.
- Rollback: reverter o patch; sem migração nem estado persistente. Nenhum push ou deploy nesta implementação, e nenhum uso por pacientes ou treinamento humano foi medido.
