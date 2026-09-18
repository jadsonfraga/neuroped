# OBS-10 — apresentação internacional e kit para pilotos externos

Apresentação editorial **1.0.0**, referência clínica **OBS-10 1.4.0**. Issue #907.

## Escopo entregue

Microsite estático público, separado da SPA clínica, em `/obs10-global/` (português), `/obs10-global/en/` (inglês) e `/obs10-global/es/` (espanhol). Explica o fluxo, apresenta três exemplos inteiramente fictícios em quatro etapas e permite baixar um kit editorial para conversa com parceiros. Não é o instrumento clínico traduzido e não autoriza aplicação em outro idioma.

O kit inclui finalidade, estado real da evidência, portas de entrada, perguntas de governança, medidas operacionais e critérios a definir prospectivamente. Nenhuma amostra, limiar, ganho de tempo, acurácia, parceria, validação ou certificação é inventada. Divulgação internacional não é adoção internacional.

O e-mail usa o contato institucional já publicado em `client/src/pages/sobre.tsx`. O link abre o aplicativo de e-mail com um texto editável: não envia mensagem e não registra adesão. A página não tem lista de pacientes, login, formulário, upload, vídeo real, câmera/microfone, API, persistência, analytics ou cookies de rastreamento. A hospedagem pode produzir logs técnicos normais; isso não é uma promessa de ausência de registros na infraestrutura.

## Arquitetura e segurança

Fonte editorial única: `scripts/obs10-global/content.mjs`. Gerador determinístico: `scripts/obs10-global/render.mjs`. Saídas HTML e Markdown versionadas em `client/public/obs10-global/`. Nenhum relógio ou dado externo entra na geração. O Vite copia os arquivos para `dist/public`; nenhuma dependência de aplicação é adicionada ao JavaScript público (~2 KB sem compressão).

Conteúdo completo e download funcionam sem JavaScript. Idiomas têm `lang`, canonical e alternates próprios. A demonstração utiliza controles nativos com teclado, estados explícitos, `hidden` e anúncio de etapa. Nenhum texto de visitante é interpolado. Templates escapam HTML; JS altera apenas visibilidade e texto de status.

CSP da página bloqueia conexões, formulários, mídia, objetos e scripts externos. Os links de email são ações explícitas do visitante. Nenhuma rota de API ou permissão clínica foi aberta. A exclusão na regra SPA do Vercel cobre só `/obs10-global` e seus recursos; o SW não transforma a apresentação em shell clínico/offline. As políticas de autenticação e isolamento existentes permanecem intactas.

## Testes reproduzíveis

```sh
node scripts/obs10-global/render.mjs --check
node tests/unit/obs10-global.test.mjs
node tests/unit/browser-audit-chromium-resolution.test.mjs
npm run check
VITE_OPEN_ACCESS=false npm run build:client
node tests/e2e/obs10-global.mjs
```

O unitário verifica paridade dos três idiomas, limites, conteúdo fictício, arquivos determinísticos, ausência de captura de dados, limites do rewrite e o handler real do service worker. O navegador percorre 36 etapas (3 idiomas × 3 cenários × 4 etapas), valida downloads byte a byte, links de idioma, teclado, conteúdo sem JavaScript, impressão, redução de movimento e seis telas desktop/mobile com axe. Falhas do teste não são ignoradas.

O ambiente local recusou navegação com `ERR_BLOCKED_BY_ADMINISTRATOR`; não alterar política nem usar contorno. A jornada roda no GitHub Actions autorizado. Não apresentar verificações unitárias como navegação real aprovada antes da execução.

## Operação e manutenção

A apresentação não é uma área clínica alternativa. O link para `/#/avaliacao-pre-consulta-faixa-etaria` continua levando ao controle de acesso existente. O link no rodapé do OBS-10 abre a apresentação em outra aba, preservando a sessão atual; abrir outra aba durante coleta ainda encerra a coleta conforme política clínica existente, portanto divulgar/visitar fora da interação.

Revisar traduções editoriais com parceiros antes de alegar adaptação cultural do protocolo. Nenhuma campanha, convite em massa, parceria ou recrutamento foi executado. Antes de qualquer piloto real, definir responsáveis, elegibilidade, consentimento/assentimento, treinamento, retenção e aprovações aplicáveis. O kit é uma pauta de decisão, não autorização ética ou regulatória.

Manter o status da evidência atualizado somente a partir de resultados verificáveis. Referências FDA e W3C são fontes metodológicas, nunca endosso, selo ou certificação.

Rollback: reverter exclusivamente esta PR. Não há migração nem novo dado clínico persistido. Remover também a exceção do rewrite e do SW e o link editorial se a apresentação for retirada. O workflow de verificação permanente é somente leitura. Arquivos temporários de transferência/integração não integram a entrega.
