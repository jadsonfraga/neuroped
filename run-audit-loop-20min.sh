#!/bin/bash
# Loop de Auditoria a Cada 20 Minutos
# Executa até às 11:00 de hoje

AUDIT_SCRIPT="/home/user/neuroped/audit-filter-random-patients.mjs"
STOP_TIME="11:00"
LOG_FILE="/home/user/neuroped/audit-loop-$(date +%Y%m%d).log"
ITERATION=1

echo "==================================================================" | tee -a "$LOG_FILE"
echo "🔁 INICIANDO LOOP DE AUDITORIA — A CADA 20 MINUTOS" | tee -a "$LOG_FILE"
echo "⏱️  Vai até: $STOP_TIME de hoje" | tee -a "$LOG_FILE"
echo "📋 Log: $LOG_FILE" | tee -a "$LOG_FILE"
echo "==================================================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

while true; do
  CURRENT_TIME=$(date +%H:%M)
  CURRENT_EPOCH=$(date +%s)
  STOP_EPOCH=$(date -d "$STOP_TIME" +%s)

  # Verificar se já passou da hora de parar
  if [ "$CURRENT_EPOCH" -ge "$STOP_EPOCH" ]; then
    echo "⏹️  $(date '+%Y-%m-%d %H:%M:%S') — Parando (hora: $CURRENT_TIME >= $STOP_TIME)" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    break
  fi

  # Executar auditoria
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOG_FILE"
  echo "▶️  ITERAÇÃO #$ITERATION — $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOG_FILE"

  node "$AUDIT_SCRIPT" 2>&1 | tee -a "$LOG_FILE"

  AUDIT_EXIT=$?

  if [ $AUDIT_EXIT -eq 0 ]; then
    echo "✅ Auditoria #$ITERATION: PASSOU" | tee -a "$LOG_FILE"
  else
    echo "❌ Auditoria #$ITERATION: COM AVISOS/BUGS" | tee -a "$LOG_FILE"
  fi

  echo "" | tee -a "$LOG_FILE"

  # Incrementar contador
  ((ITERATION++))

  # Aguardar 20 minutos (1200 segundos) antes da próxima iteração
  echo "⏳ Aguardando 20 minutos até próxima auditoria..." | tee -a "$LOG_FILE"
  for i in {1..120}; do
    CURRENT_TIME=$(date +%H:%M)
    CURRENT_EPOCH=$(date +%s)

    # Verificar a cada 10 segundos se já passou da hora de parar
    if [ "$CURRENT_EPOCH" -ge "$STOP_EPOCH" ]; then
      echo "⏹️  Hora de parar atingida ($CURRENT_TIME >= $STOP_TIME)" | tee -a "$LOG_FILE"
      break 2  # Sair dos dois loops
    fi

    # Esperar 10 segundos antes de próxima verificação
    sleep 10

    # Mostrar progresso a cada 2 minutos
    if [ $((i % 12)) -eq 0 ]; then
      REMAINING=$((120 - i))
      echo "  [$((REMAINING/2)) min restantes]" | tee -a "$LOG_FILE"
    fi
  done
done

echo "==================================================================" | tee -a "$LOG_FILE"
echo "🏁 LOOP FINALIZADO" | tee -a "$LOG_FILE"
echo "📊 Total de iterações: $((ITERATION - 1))" | tee -a "$LOG_FILE"
echo "📋 Log completo em: $LOG_FILE" | tee -a "$LOG_FILE"
echo "==================================================================" | tee -a "$LOG_FILE"
