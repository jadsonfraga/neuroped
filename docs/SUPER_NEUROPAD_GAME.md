# Super NeuroPad Game

Aba em destaque (`/super-neuropad-game`) usada pela secretária na pré-consulta para
aplicar, sem câmera, um jogo de triagem de déficits grosseiros diretamente com a criança.

## O que é

- União reconciliada de quatro abas que continuam existindo: Sonda 10 (`/testes-diretos`),
  OBS-10 (`/avaliacao-pre-consulta-faixa-etaria`), Reconhecimento Visual
  (`/testes-reconhecimento`) e Testes Cognitivos por Faixa Etária (`/testes-cognitivos`).
- Estrutura de RPG: personagem à escolha, cinco fases (Floresta dos Olhos, Ilha das Palavras,
  Montanha dos Números, Caverna da Memória, Torre do Corpo), XP por participação, conquista
  por fase, trilha chiptune sintetizada no dispositivo (Web Audio, sem arquivos de áudio).
- Faixa etária somente em anos: 2–3, 4–5, 6–7, 8–9, 10–12, 13–17. Quatro desafios por fase,
  vinte por partida, cerca de dez minutos.
- Todo item tem certo e errado explícitos. Itens de toque são conferidos pelo jogo; itens de
  fala e de ação são conferidos pela aplicadora contra o critério exibido na tela
  (Acertou / Errou / Não respondeu).
- Resultado objetivo em tela e em PDF detalhado (pergunta, resposta esperada, resposta
  registrada, certo/errado, tempo por item), via `buildDocumentPdf`, com figuras transcritas
  em texto pelo glossário `describeArt`.

## Contrato clínico

- Triagem autoral, não normativa: as faixas operacionais (por fase 3–4 esperado / 2 observar /
  0–1 alerta; total 16+ / 12–15 / ≤11) são leitura rápida da equipe, nunca escore, percentil,
  idade equivalente ou diagnóstico. A conclusão é do médico.
- A criança nunca vê certo/errado durante o jogo.
- Nada é persistido no navegador nem enviado por rede; o PDF é gerado localmente.
- Rota sensível (`SENSITIVE_ROUTES`): exige sessão; papéis admin, professional e operator.

## Código

- `client/src/features/super-neuropad/model.ts` — faixas, personagens, fases, banco de 120
  itens, motor de registro/resultado, relatório em texto e glossário para PDF.
- `client/src/features/super-neuropad/music.ts` — trilha chiptune.
- `client/src/features/super-neuropad/pdf.ts` — especificação do PDF detalhado.
- `client/src/pages/super-neuropad-game.tsx` — página.

## Verificação

- `npm run test:super-neuropad` (também encadeado em `test:direct-track`).
- `npm run build:client && npm run test:e2e:super-neuropad` — jornada completa no navegador
  com capturas, axe e download do PDF.

## Rollback

Reverter o commit desta entrega remove a rota, o item de navegação, a entrada em
`SENSITIVE_ROUTES` e os arquivos acima. Nenhuma migração, nenhum dado persistido.
