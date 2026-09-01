# Inspeção inicial dos sites Manus — registro histórico

Data da verificação original: 2026-08-20.  
Estado atual: **histórico; não é contrato de runtime**.

## Secretaria IA — legado aposentado

URL inspecionada em 20/08/2026: `https://secretariaia-7jubr6nq.manus.space`

Na inspeção original, o site apresentava a Clínica Dr. Jadson Fraga, área de equipe em `/admin`, fluxo de triagem em `/triagem` e conteúdo administrativo próprio.

**Decisão consolidada em 01/09/2026:** essa publicação não é mais a Secretaria IA canônica e não deve aparecer em navegação, iframe, CTA ou fallback do NeuroPed. A única porta institucional vigente é `#/marcacao`, implementada no próprio NeuroPed e integrada à disponibilidade oficial do BoaConsulta. O contrato atual está em `docs/SECRETARIA_IA_RECONSTRUCAO.md`.

## Missão Saúde

URL histórica: `https://drjadsongame-ko8qudqs.manus.space`

O site original era um jogo educativo público chamado “Missão Saúde — Dr. Jadson”. A experiência foi posteriormente incorporada ao próprio NeuroPed em `#/missao-saude`; a URL Manus é apenas referência histórica e não é dependência do runtime atual.

## Página institucional do neuropediatra

URL: `https://drjadsonmd-iqeiteek.manus.space`

Na inspeção inicial, a página renderizou apenas uma tela clara com a marca “Made with Manus”, sem elementos interativos ou conteúdo textual visível. Esta continua sendo uma integração externa independente da Secretaria IA.

## Regra de precedência

Quando este registro histórico divergir do código ou do runbook consolidado, prevalecem nesta ordem:

1. `client/src/pages/marcacao.tsx` + testes executáveis;
2. `docs/SECRETARIA_IA_RECONSTRUCAO.md`;
3. auditorias datadas em `docs/audits/`;
4. este documento histórico.
