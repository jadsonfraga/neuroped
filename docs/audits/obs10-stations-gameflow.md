# OBS-10 Stations — invariantes de não regressão

Baseline integrado: `710ca9d272b997a894d82cf168481cc41419afdb` (#936).

A camada de estações é estritamente de apresentação. Não altera:

- `obs10-tablet/1.0.0`, reducer, schemas ou eventos;
- catálogo e ordem por idade;
- ritmo sugerido por atividade;
- propostas recuperadas pela câmera e regra SOL/LUA oral;
- limite absoluto de 600 segundos;
- câmera, mídia, importação, exportação ou backend.

Contratos de produto:

- mapa: Base → Radar → Tutorial → Pronto → Missões → Revisão → Saída;
- durante coleta: HUD compacto da estação atual + próxima;
- criança: nenhum mapa, checkpoint, instrução do adulto ou indicador de desempenho;
- revisão: estados factuais — registrada, não aplicada, descrição pendente, parcial ou não observada;
- proibido: pontos, estrelas, vidas, XP, ranking, prêmio, acerto/erro ou recompensa condicionada;
- animações curtas e removidas por `prefers-reduced-motion`;
- workflows clássicos e tablet permanecem obrigatórios.

Issue #937.
