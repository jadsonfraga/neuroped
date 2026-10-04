# Rascunho D-004: `/planos` sem promessa que a produção ainda não cumpre (Ciclo 6)

STATUS: PROPOSTA para aprovação do proprietário. `client/src/pages/planos.tsx` NÃO foi alterado.
Motivo: a própria página declara (regra 2) que "só entra aqui capacidade que existe no produto
hoje". Em produção, hoje: cripto clínica não configurada e R2/exportação LGPD não configurados
(audit Clinical/LGPD, `ready=false`), e o isolamento do domínio clínico LEGADO tem o P0 S9 aberto.
O contrato `tests/unit/planos-page-contract.test.mjs` NÃO trava este texto (só preço derivado do
domínio, rota pública e CTA), então a troca não quebra teste, desde que o preço continue vindo
de `CANONICAL_PRICE_CENTS`.

## Alterações propostas (texto exato em pt-BR)

### 1. Parágrafo do cabeçalho
ANTES: "...reúne a escolha do instrumento, a coleta com a família, o registro cifrado e o documento
assinado no mesmo fluxo — com a clínica isolada e a trilha de auditoria que a LGPD exige."
DEPOIS: "...reúne a escolha do instrumento, a coleta com a família, o registro e o documento
assinado no mesmo fluxo, com cada clínica em seu próprio espaço e trilha de auditoria das
operações."
Por quê: remove "cifrado" (G1) e "que a LGPD exige" (afirmação jurídica não revisada, G6).

### 2. Card "Clínica isolada por padrão"
ANTES: "Cada clínica é um tenant próprio. Pacientes, documentos e escalas de uma clínica não são
alcançáveis por outra — o isolamento é decidido no servidor, a partir do vínculo do usuário, e não
do que o navegador envia."
DEPOIS: "No NeuroPed LIVE, cada clínica é um espaço próprio e o acesso é decidido no servidor, a
partir do vínculo do usuário, e não do que o navegador envia."
Por quê: "não são alcançáveis por outra" é absoluto e o legado tem bypass de admin (S9).

### 3. Mover para um bloco novo "Em implantação" (mesmo ícone, selo visível)
Itens que dependem de G1/G2 e não podem aparecer como disponíveis:
- "Documentos e prontuário cifrados" → título "Prontuário e documentos cifrados" com corpo:
  "Em implantação: a cifra do conteúdo clínico no servidor será ativada antes da abertura para
  novas clínicas. Até lá, não cadastre dado de paciente real."
- "LGPD executável, não declarativa" → título "Direitos do titular pelo sistema" com corpo:
  "Em implantação: exportação e eliminação de dados atendidas pelo próprio sistema, com retenção
  e bloqueio legal. Ainda sem revisão jurídica dos textos."
- "Encerramento sem refém" → revisar com a engenharia (exportação completa depende do R2).
  Enquanto não confirmado, mover também para "Em implantação".
- "Escalas respondidas pela família" → manter só se a resposta gravada não depender da cifra em
  produção; confirmar com a engenharia. Dúvida registrada, não resolvida aqui.

### 4. Aviso no topo da lista (uma linha)
"Esta página separa o que já funciona do que está em implantação. Não use dado real de paciente
no NeuroPed LIVE até a cifra estar ativa."

## Reversão ao cumprir os gates
Quando o audit Clinical/LGPD mostrar `ready=true` (G1+G2) e a revisão jurídica (G6) estiver feita,
mover os itens de volta para "Incluído". Melhor a longo prazo (engenharia, PR própria): o selo
"Em implantação" vir de um sinal do servidor (ex.: `/api/health` já expõe
`clinicalCryptoConfigured`), para a página nunca mentir por esquecimento.

## Como aplicar (se aprovado)
PR pequena e atômica só em `client/src/pages/planos.tsx` + conferência de
`node tests/unit/planos-page-contract.test.mjs` e `npm run check`; merge e deploy ficam com o
proprietário. Exige branch própria (esta branch é a designada para o audit Cloudflare).
