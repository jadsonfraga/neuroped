# O QUE AINDA FALTA — NeuroPed

> **Atualizado em 2026-07-01** durante a reconciliação de pontas soltas.
> Este documento antes descrevia um subsistema de "metadata clínica + regras de
> bloqueio" (`scalesWithMetadata`, `blockingRules`, `FilterContext` UI) que nunca
> foi integrado à interface. Esse código órfão foi **removido** nesta reconciliação
> (recuperável pelo histórico do git). O texto abaixo reflete o estado real do app.

---

## Estado atual do filtro de escalas

O filtro clínico (`client/src/pages/filtro.tsx` + `client/src/data/*`) usa o motor
de ranking ativo:

- `filterScalesWithClinicalRescue` / `filterScalesIntelligently` — seleção de
  candidatos seguros.
- `selectCuratedTiers` + `selectPodium` — pódio Ouro/Prata/Bronze ordenado por
  score, com resgate por respondente e fallback broadband.
- `clinicalHardBlock` — bloqueio clínico duro (idade/segurança) já aplicado no
  motor real.

A cobertura é validada por:

- `npm run test:practical-filter` — 100 casos práticos. O gate exige **integridade
  de segurança em todos os casos** (sempre encontra candidato, sem escala repetida
  no pódio, todas abrem internamente, nenhuma viola bloqueio clínico duro) e
  **qualidade agregada** (média ≥ 9.5 com piso de 8.0 por caso). Combinações
  clinicamente impossíveis (ex.: TDAH aos 8 meses) não são penalizadas como erro,
  pois o catálogo legitimamente não tem 3 escalas de alta relevância para elas.
- `npm run test:podium`, `npm run test:clinical`, `npm run validate:ranking`,
  `npm run validate:catalog` — provas exaustivas de robustez e integridade.

---

## Melhorias possíveis (não bloqueiam produção)

Estas são ideias de produto, não pendências quebradas:

1. **Coletar contexto do respondente na UI** — hoje o filtro infere respondente e
   idade; poderia coletar disponibilidade de pais/escola/profissional e nível de
   leitura para refinar o pódio. (Era a intenção do subsistema removido; se for
   retomado, reimplementar de forma integrada desde o início.)
2. **Persistir o contexto do filtro** — salvar seleções em localStorage para não
   reselecionar ao trocar de página.
3. **Exportar escalas filtradas** — gerar PDF/Excel da lista recomendada.
4. **Comparação lado a lado** entre versões de uma escala (ex.: SCARED-pais vs
   SCARED-criança).

---

## Como verificar o estado do projeto

```bash
npm run check                 # TypeScript
npm run lint                  # ESLint (0 warnings)
npm run test:clinical         # provas clínicas exaustivas
npm run test:podium           # robustez do pódio
npm run test:practical-filter # qualidade prática (gate honesto)
npm run verify                # suíte completa de guards + testes
```
