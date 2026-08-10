# Auditoria profunda de bugs — NeuroPed — 10/08/2026

## Escopo

Revisão dirigida da `main` após a integração da Operational Suite, NeuroPed Conecta e bridge BoaConsulta. A auditoria priorizou bugs reproduzíveis de runtime, validação temporal, consistência de mutações e contratos de transporte.

## Bugs comprovados e corrigidos

1. **Upload BoaConsulta bloqueado pelo middleware** — `POST multipart/form-data` era rejeitado globalmente com 415 antes de chegar ao handler que usa `request.formData()`. Correção: exceção exata somente para `/api/integrations/boaconsulta/import`; demais mutações continuam JSON-only.
2. **Datas e horas impossíveis aceitas na agenda** — validação por regex aceitava `2026-02-31`, `2026-13-01`, `24:00` e `23:60`. Correção: validação calendárica real e limites de relógio.
3. **Horários futuros podiam desaparecer no fim do dia** — `listAvailableSlots()` cortava os primeiros 96 slots antes de filtrar horários passados. Correção: lista interna sem cap prematuro e seleção pública `futuro → deduplicação → cap`.
4. **Slots públicos duplicados** — regras de disponibilidade sobrepostas podiam repetir o mesmo intervalo na resposta. Correção: deduplicação por intervalo no seletor público.
5. **Falso sucesso em mutações operacionais** — exclusão de regra/bloqueio e atualização de pagamento/lista de espera/review/notificação podiam responder sucesso e gravar auditoria mesmo com ID inexistente. Correção: exigir exatamente uma linha afetada; 404 caso contrário.
6. **Timezone inválido persistível** — perfil aceitava qualquer string de timezone. Correção: validação IANA via `Intl.DateTimeFormat`.
7. **Slug de 2 caracteres rejeitado por regex** — um caso de borda incoerente (1 caractere e 3+ eram aceitos). Correção do quantificador.
8. **Data preferencial inválida na lista de espera** — campo era truncado mas não validado. Agora usa a mesma validação calendárica da agenda.
9. **PATCH de paciente simulava atualização sem D1** — podia devolver `updated: true` sem persistir. Agora payload inválido continua 400 e escrita válida sem banco falha com `503 DB_REQUIRED`.
10. **DELETE clínico podia parecer sucesso sem D1** — paciente retornava HTTP 200/deleted:false e resultado de escala também; a UI interpreta 2xx como sucesso. Agora ambos falham fechado com `503 DB_REQUIRED`.
11. **Data impossível em consulta de slots parecia agenda vazia** — a rota pública usava regex; agora rejeita a data calendárica com 400.
12. **Campos inteiros vazios viravam zero** — `Number("")`/`Number(null)` podiam converter ausência em domingo ou 00:00. Agora ausência é inválida.

## Travas adicionadas

- teste runtime do middleware para multipart BoaConsulta + bloqueio multipart nas demais rotas;
- regressões de datas bissextas/impossíveis, horários inválidos, timezone e slug;
- regressão de cap após filtro e deduplicação de slots;
- contrato estático exigindo confirmação de `meta.changes` nas mutações por ID.

## Fora de escopo deliberado

- não alterada lógica clínica de ranking/escalas;
- não ativada persistência LIVE de dados clínicos;
- não alteradas chaves de criptografia existentes;
- não simulados provedores externos de WhatsApp, pagamentos ou vídeo.
