# Biblioteca Clínica NeuroPed — trilha canônica 365

**Índice-mestre:** `Biblioteca_Clinica_NeuroPed_365_Indice_Mestre.xlsx` (Drive ID `1uZ-Lr_ztbnWTue5fuVZsbJ72Ilc_s9NX`, aba `Trilha 365`, 365 entradas). **Pasta canônica:** `1D6HYj6AZ0m7fwd-tbnmXbbA-6nFYm0oy`.

## Capítulo do Dia 01/365 — 29/10/2026
**Pergunta exata:** Como distinguir sinais de TEA de timidez na primeira infância?
**Rota:** `/#/biblioteca-clinica?capitulo=tea-timidez-primeira-infancia`.
**Estado clínico:** `revisao_medica` — material educacional provisório, sem aceite ou assinatura médica.
**Documento editável no Drive:** https://docs.google.com/document/d/1rMf_yvKbLRfDy5zbyKC45nLdRt8O347pcLoddRoxIIY/edit

- Página mobile-first com fluxograma, matriz achado/interpretação/ação, roteiro em cinco etapas, red flags, decisões investigar/observar, família/escola, caso fictício, três erros, incertezas e oito referências auditáveis.
- Fontes: Ministério da Saúde (APS e linha de cuidado), AAP (2020, reafirmada 2025), NICE CG128, metanálise M-CHAT(-R/F) 2023 (DOI 10.1001/jamapediatrics.2022.5975), CDC e revisão de intervenção precoce 2023.
- Proveniência: dispositivo Windows PCDRJADSON **offline** em 29/10/2026. Conector Consensus oficial tentou investigação Pro, mas retornou cota de 500 pesquisas mensais esgotada (reinício anunciado para 01/11/2026). Não houve pesquisa Consensus; fontes públicas foram verificadas diretamente. O capítulo permanece provisório.
- Não contém dados reais de pacientes, escores inventados ou itens protegidos de testes.

## Reconciliação inicial
Em 29/10/2026 o XLSX apresentava as 365 entradas da `Trilha 365` como `Pendente`. O app já tinha um capítulo WISC-IV, entregue via PR #1231 (merge 28/10/2026), mas seu título não é a pergunta exata do Dia 09 e não havia revisão médica. Por isso a presença desse capítulo não autoriza declarar o Dia 09 concluído no índice. A sequência atual inicia pelo menor Dia sem capítulo canônico concluído: Dia 01.

## Governança da pauta
O workflow `.github/workflows/biblioteca-clinica-pauta-diaria.yml` **não gera mais pautas por rotação independente**: foi tornado fail-closed, porque o CI não dispõe de leitura autenticada do XLSX canônico. Não cria issues, não escolhe temas e não publica capítulos. O processo externo lê o índice real antes de cada produção e mantém manifesto incremental no Drive quando não é possível atualizar o XLSX original com segurança.

A visualização de conteúdo `revisao_medica` não equivale a validação clínica. Somente aceite explícito do médico permite alterar o estado para `publicado`. Merge/deploy do material educacional não representa assinatura médica.

## Gates técnicos
`node tests/unit/clinical-library-static.test.mjs`, `node tests/unit/clinical-library-day001.test.mjs`, `npm run test:known-routes`, `npm run check`, `npm run lint`, `npm run build:client`; revisão de diff e checks obrigatórios do HEAD exato. Merge apenas via PR protegido, depois validação do deploy Cloudflare e navegação em produção.

## Retomada e idempotência
Verificar o mesmo Dia no XLSX, no manifesto, no app/main e em PRs antes de qualquer nova criação. Se falhar um gate ou deploy, retomar a PR/rascunho do mesmo Dia; não avançar arbitrariamente ao Dia 02. Não alterar a numeração nem a pergunta canônica.
