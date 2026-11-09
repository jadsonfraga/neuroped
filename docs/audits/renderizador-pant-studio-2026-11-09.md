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
limitado a `.pant-studio-root`. O PDFMake é carregado apenas ao gerar um PDF.

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
- `node tests/unit/renderizador-pdf.test.mjs`: PDF demonstrativo de 2 páginas,
  documento longo com 60 linhas de tabela e rejeição de HTML/imagens aprovados.

## Rollback

Reverter o commit deste PR e executar novamente os workflows canônicos de
Cloudflare e Vercel. Nenhuma migração de banco nem configuração de segredo é
necessária. O site PANT Studio original permanece independente.
