# BLOCKED_EXTERNAL_SECRETARIA_WHATSAPP — 2026-09-01

## Sistema externo

WhatsApp Business Platform / Meta, para avisos automáticos administrativos à equipe de agendamento.

## Permissão e recursos necessários

- `phone_number_id` de um número habilitado na WhatsApp Business Platform;
- token de acesso válido armazenado exclusivamente como secret de produção;
- template administrativo aprovado para o aviso de novo pré-agendamento;
- canal confiável que produza o evento de novo pré-agendamento do BoaConsulta, diretamente ou por sincronização operacional autorizada.

## Ação que falta

Provisionar as credenciais e o template no ambiente de produção, definir o evento idempotente que inicia o aviso e implantar a fila durável que repete a notificação a cada 30 minutos somente enquanto a caução não tiver sido conferida ou a secretaria não tiver reconhecido o caso.

## Risco de não executar

Sem essa infraestrutura, o frontend não consegue garantir notificação automática nem reenvio recorrente. Simular esse comportamento no navegador produziria falso sucesso e poderia fazer a equipe deixar de perceber um pré-agendamento.

## Contingência ativa

A Secretaria IA usa handoff explícito para o WhatsApp **Agendamento (Dr. Jadson Fraga), (87) 99105-5790**. A mensagem sai do próprio WhatsApp do responsável, permitindo à secretaria receber o número de contato e prosseguir com a caução. O BoaConsulta permanece com confirmação automática desligada; a consulta só é considerada confirmada após conferência manual da caução.

## Como verificar a conclusão futura

1. criar pré-agendamento sintético, sem dado real de paciente;
2. confirmar que a primeira notificação chega ao número/equipe configurada uma única vez;
3. sem reconhecer o caso, confirmar um novo aviso após 30 minutos;
4. registrar reconhecimento/caução em ambiente de teste e confirmar que não há novo reenvio;
5. repetir o teste com entrega temporariamente indisponível para provar retry idempotente e ausência de duplicação.
