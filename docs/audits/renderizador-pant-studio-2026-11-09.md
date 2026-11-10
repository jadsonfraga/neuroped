# Renderizador PANT dentro do NeuroPed

Issue: #1299.

A rota `/#/renderizador` e a aba **Renderizador** incorporam o PANT Studio ao
próprio React do NeuroPed. O usuário envia Markdown, edita o texto e a capa,
confere o PDF paginado e confirma a revisão antes de baixar PDF e manifesto
SHA-256. Não há redirecionamento para o site ChatGPT nem login adicional.

Os arquivos são processados somente na memória do navegador. As requisições
carregam exclusivamente fontes e brasão estáticos da mesma origem. A aba não
consulta prontuários, não envia Markdown/PDF a APIs, não guarda dados clínicos
em localStorage e não aplica assinatura médica. HTML e imagens embutidas em
Markdown são recusados explicitamente, sem omissão silenciosa.

O gerador preserva parágrafos, títulos, listas, tabelas, ênfase e citações.
O brasão fornecido pelo proprietário e as fontes Cormorant Garamond estão
incluídos nos recursos locais; a licença OFL acompanha as fontes. O CSS é
limitado a `.pant-studio-root`. O jsPDF e o parser Markdown são carregados
somente ao gerar o documento, mantendo o chunk de renderização abaixo do teto.

Cloudflare e Vercel recebem o mesmo frontend. A CSP permite `frame-src 'self'
blob:` somente para a prévia PDF local; `frame-ancestors 'none'` e demais
restrições permanecem. O backend e as políticas de autenticação não mudam.

## Validação

- `npm run check`: exit 0 (TypeScript cliente/servidor e Functions).
- `npm run lint`: exit 0.
- `npm run build:client`: exit 0.
- `npm run test:known-routes`: exit 0.
- `npm run audit:navigation`: exit 0.
- `node --import tsx --test tests/unit/featured-navigation.test.ts`: 10 testes aprovados.
- `node tests/unit/renderizador-navigation-static.test.mjs`: 3 testes aprovados.
- `node tests/unit/renderizador-pdf.test.mjs`: PDFs demonstrativo e longo,
  paginação com 60 linhas de tabela e rejeição de HTML/imagens aprovados.
- `npm run audit:bundle`: maior chunk 1.148,63 KB bruto / 306,87 KB gzip,
  abaixo dos limites de 1.240 KB / 320 KB.

## Rollback

Reverter o commit deste PR e executar novamente os workflows canônicos de
Cloudflare e Vercel. Nenhuma migração de banco nem configuração de segredo é
necessária. O site PANT Studio original permanece independente.


## Falha de produção e correção (#1303)

Após autenticação, a primeira abertura de `/#/renderizador` falhou no preload do CSS lazy; atualizar o cache não resolveu. A causa identificada no bundle era a importação redundante de Google Fonts no CSS, apesar da fonte local incorporada. A correção remove essa chamada externa e adiciona teste estático para proibir regressão. A aba usa agora somente os recursos visuais empacotados localmente.

Rollback: reverter o PR #1304 e redeployar o commit anterior; isso restaura a importação remota que se mostrou incompatível com a execução observada.

Validação deste incidente: após deploy, autenticar, abrir Renderizador, usar o exemplo demonstrativo, gerar PDF local, revisar e verificar exportação e manifesto. Registrar resultado no PR antes do merge.
