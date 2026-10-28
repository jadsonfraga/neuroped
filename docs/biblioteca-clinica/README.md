# Biblioteca Clínica NeuroPed — capítulo 01

**Rota:** `/#/biblioteca-clinica` · **Data:** 28/10/2026 · **Público:** médicos e equipe clínica · **Estado:** `revisao_medica`.

## Entrega inicial
- Página responsiva independente da Biblioteca de instrumentos, integrada no menu **REFERÊNCIA**;
- Diagrama dos quatro índices WISC-IV, explorador por domínio, relação QIT/IAG/IPC;
- Discussão de TDAH, TEA, dificuldades de aprendizagem, linguagem, deficiência intelectual e altas habilidades;
- Três casos inteiramente fictícios, sem cálculo de QIT ou atribuição de diagnóstico;
- Checklist educativo de interpretação e sete referências rastreáveis.

## Método e proveniência
Foi tentada uma investigação no Consensus em 28/10/2026, mas a cota de 500 pesquisas mensais estava esgotada. A pesquisa **não ocorreu** na plataforma. As referências foram conferidas por consulta às fontes públicas e são exibidas com URLs. A metanálise de TEA de 2026 inclui várias versões Wechsler; não extrapolar diretamente seus resultados para uma única versão do teste.

## Fluxo diário
O workflow `.github/workflows/biblioteca-clinica-pauta-diaria.yml`, programado diariamente às 08:00 de Recife, cria uma **issue de pauta**, sem conteúdo clínico publicado, com rotação de dez temas. É idempotente por data.
Um capítulo novo requer pesquisa real verificável, elaboração ilustrada, testes, revisão clínica, aceite médico explícito e PR próprio. O agendamento por si só NÃO publica um capítulo por dia. Não utilizar autor de IA como médico revisor.

## Governança
- Nunca reproduzir itens, pranchas, protocolos ou tabelas normativas protegidas do WISC-IV.
- Não calcular escores pela interface, não inferir diagnósticos, não coletar nem persistir dados de pacientes.
- Status `revisao_medica` visível; promover para `publicado` apenas mediante aceite real e registrado em PR.
- Versionar cada capítulo com data, revisão e fontes, em `client/src/data/clinicalLibrary.ts`. Novos temas ganham componentes ou layouts próprios; sem sobreposição com `/biblioteca-instrumentos`.
- Testes: `node tests/unit/clinical-library-static.test.mjs`, `npm run test:known-routes`, `npm run check`, `npm run lint` e `npm run build:client`.
- Produção canônica Cloudflare Pages via merge de PR na `main` e `deploy-cloudflare.yml`; Vercel permanece espelho; sem deploy manual divergente.
- Rollback: reverter o merge do PR; não há alteração de schema/D1 nem migração.

## Gate clínico pendente
O conteúdo do primeiro capítulo é material educativo identificado como **rascunho para revisão médica**. O deploy do módulo não constitui aceite do conteúdo pelo médico.
