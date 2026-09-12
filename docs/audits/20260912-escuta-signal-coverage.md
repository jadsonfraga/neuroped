# PR #855 — presença de sinal e silêncio recorrente

Base revisada: b52f701f. Achado P1: um único pico tornava audible permanente;
o fallback também aprovava qualquer amostra >=16. A nova análise usa PCM real,
janelas contínuas de 20 ms e exige RMS >=0,0005 com pelo menos 25% das amostras
acima do piso de 16 unidades PCM. Exportação/transcrição exigem ao menos 200 ms
de janelas ativas e cobertura mínima de 1% do áudio. Estes são limites técnicos
conservadores de presença de sinal, não detecção de fala ou inteligibilidade.

O watchdog é recorrente, inclusive quando o worklet deixa de enviar blocos.
Sinal antigo não suprime aviso após 8 segundos de silêncio posterior. Pausa não
alerta; retomada reinicia o intervalo. A validação final percorre o PCM atual,
incluindo importações, sem aproveitar aprovação de gravação anterior.

## Evidência local

- node --import tsx tests/unit/escuta-signal-health.test.ts: exit 0.
  Silêncio, impulso máximo isolado, sinal curto, 60 minutos quase silenciosos,
  sinal intercalado por 60 minutos, fronteiras entre blocos, PCM substituído,
  watchdog inicial/recorrente, pausa/retomada, stop/destroy.
- node tests/unit/escuta-worklet.test.mjs: 6 testes, exit 0.
- npm run check: exit 0. npm run lint: exit 0.
- As duas suítes de CI de Escuta executam a nova regressão.

## BLOCKED_EXTERNAL_ESCUTA_BROWSER_PREVIEW

O harness local de navegador não executou: Chromium ausente e download de
cdn.playwright.dev sofreu timeout. Isso não é prova de falha do gravador nem
prova manual concluída. Acesso necessário: Chromium/runner de navegador e preview
acessível. O workflow existente executa o harness com microfone virtual.
Continua necessária prova manual no dispositivo de uso: voz não identificável,
captura prolongada, pausa, troca/bloqueio de microfone e conferência auditiva do WAV.
Risco sem essa prova: particularidades do hardware/Safari/Chrome não cobertas.
Confirmar pelo SHA da PR e resultado documentado antes de merge.

## Limites e rollback

Gravações muito curtas, extremamente baixas ou com menos de 1% de sinal serão
bloqueadas; PCM permanece em memória. Nenhum detector recupera áudio já perdido.
Ruído consistente ainda pode passar: ouvir o preview continua necessário.
Rollback: reverter o commit de cobertura, mantendo a correção inicial da PR.
