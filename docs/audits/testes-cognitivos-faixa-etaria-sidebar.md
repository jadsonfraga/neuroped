# Testes cognitivos por faixa etária — retorno à sidebar

Branch: `claude/testes-cognitivos-sidebar-t3jm51`

## Problema e correção

- A antiga "Avaliação Cognitiva Infantil" (triagem lúdica por faixa etária:
  reconhecimento visual, leitura, escrita e aritmética, 2–19 anos, perfis exatos
  6–13) foi esvaziada em shim na consolidação da Sonda Dez (`f2d7f48`) e extinta
  em `b93a04b`, quando `/avaliacao-cognitiva-infantil` virou redirect para
  `/testes-diretos`. A sidebar perdeu a aba.
- A página volta integralmente, com o conteúdo histórico, em
  `client/src/pages/testes-cognitivos-faixa-etaria.tsx`, rota própria
  `/testes-cognitivos`, separada da Sonda Dez — o mesmo padrão do PR #935
  (Teste de Reconhecimento Visual).
- Item "Testes cognitivos por faixa etária" na seção TRIAGEM E FERRAMENTAS,
  logo após o Teste de Reconhecimento Visual.
- O bookmark antigo `/avaliacao-cognitiva-infantil` passa a redirecionar para
  `/testes-cognitivos` (não mais para a Sonda Dez). O fallback de destaque da
  navegação (`sondaOwnedRoutes`) só considera origens cujo destino é a própria
  Sonda Dez.
- RBAC: rota inventariada como sensível com os papéis dos testes diretos
  (admin, professional, operator); reader continua sem acesso. A origem legada
  herda a mesma política pelo mapa de redirects.
- Verdade clínica preservada: a página registra pergunta a pergunta e entrega
  relatório qualitativo; não produz escore, percentil, idade equivalente nem
  interpretação diagnóstica. Não há vínculo com instrumento licenciado.

## Formato de jogo (segunda entrega)

- A mesma bateria é apresentada como aventura: a criança escolhe um herói,
  explora quatro mundos (Floresta dos Olhos, Ilha das Palavras, Castelo da
  Escrita, Montanha dos Números) e joga as fases de cada um na ordem que quiser.
- Estrelas contam respostas registradas (participação) e medalhas contam mundos
  concluídos. O feedback após cada resposta é neutro e gira por posição da fase,
  nunca pela resposta dada: a criança não vê certo/errado, e nenhum número da
  tela é escore.
- Escrita nas bandas 2–5 anos continua sendo lista de observação do adulto,
  agora "missão do guia", com uma única estrela pela missão inteira.
- O profissional recebe o mesmo relatório e o mesmo salvamento, numa área
  recolhível abaixo do jogo, com o aviso explícito de que estrelas e medalhas
  não são escores.
- Animações via framer-motion e confete respeitam `prefers-reduced-motion`; sons
  usam as preferências já existentes do app.
- Smoke em navegador real (build estático + API sintética, login real): item da
  sidebar ativo, mundo jogado até a medalha, área do profissional com 4 itens,
  missão do guia na banda A, viewport 390 px sem rolagem horizontal, zero erros
  de página.

## Verificação local

Comandos concluídos com código de saída 0:

- `npm run check`
- `npx eslint --max-warnings=0` nos arquivos alterados
- `node tests/unit/infant-assessment-navigation.test.mjs`
- `node --import tsx tests/unit/route-guard-policy.test.ts`
- `node --import tsx --test tests/unit/featured-navigation.test.ts`
- `npm run test:hardening-regressions`
- `npm run audit:navigation`, `npm run audit:instruments`, `npm run audit:access`,
  `npm run guard:open-access`, `npm run audit:filter-fillable`
- `npm run build:client` e `npm run test:bundle-audit`

## Rollback

Reverter o commit desta branch. Sem migração, sem mudança de API e sem dado
persistido novo: a rota volta a redirecionar para a Sonda Dez e o item some do
menu.
