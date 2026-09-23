# OBS-10 Stations — auditoria de não regressão

Escopo: camada visual de estações sobre o OBS-10 Tablet, sem alteração de reducer, protocolo, esquema de registro, temporizador, câmera, catálogo por idade ou backend.

Invariantes:
- mapa e checkpoints são apresentação derivada;
- superfície da criança não contém mapa, instruções do adulto ou indicador de desempenho;
- nenhuma pontuação, estrelas, vidas, XP, ranking, prêmio ou feedback de acerto/erro;
- estados da revisão são factuais: registrada, não aplicada com motivo, parcial ou não observada;
- transições respeitam prefers-reduced-motion;
- regressões clássicas e tablet permanecem obrigatórias.

Issue #937 / PR #938.
