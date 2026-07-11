# NeuroPed Notes — Roadmap de Produto

## Estado inicial

O repositório atual já possui uma plataforma clínica React/Vite + Express/Drizzle, autenticação, criptografia, auditorias e catálogo de escalas. O NeuroPed Notes deve aproveitar esses ativos por integração, não por reescrita imediata.

## Fase 0 — Fundação

- Arquitetura, limites de domínio e threat model.
- Contratos de transcrição, diarização, proveniência e revisão.
- Política de retenção, consentimento e exclusão.
- ADRs para monorepo, autenticação, criptografia e provedores de IA.
- CI com lint, typecheck, testes, SAST, dependency review e secret scanning.

## Fase 1 — MVP de consulta

- Criar, pausar, retomar e finalizar consulta.
- Gravação local em chunks com recuperação automática.
- Transcrição por um provedor inicial, atrás de interface substituível.
- Correção manual de falantes.
- Organização clínica em seções.
- Separação visual de relato, observação, exame, escala e inferência de IA.
- Geração de resumo clínico e PANT revisável.
- Exportação em texto, Markdown e JSON.

## Fase 2 — Segurança operacional

- PostgreSQL/Prisma e segregação multi-tenant.
- KMS/envelope encryption.
- RBAC/ABAC, MFA, sessões e revogação.
- Auditoria imutável.
- Backups com restauração testada.
- Central de consentimento, retenção e direitos do titular.
- Testes de invasão antes do uso com dados reais.

## Fase 3 — Copiloto longitudinal

- Checklist inteligente discreto.
- Timeline automática.
- Auditoria clínica, inconsistências e vieses cognitivos.
- Diagnósticos diferenciais apenas como sugestões revisáveis.
- Revisor científico com referências e data de atualização.
- Busca semântica com filtros estruturados e autorização por linha.

## Fase 4 — Ecossistema NeuroPed

- Escalas e resultados estruturados.
- EEG e laudos associados.
- Nesplora e eye tracking.
- Agenda e prontuário.
- Importação e exportação FHIR.
- Cartas escolares, encaminhamentos, exames e modelos de receita.

## Fase 5 — Produto comercial

- Onboarding de clínicas.
- Planos, limites e faturamento.
- Painel administrativo e suporte.
- Métricas de qualidade e custo por consulta.
- Residência regional de dados.
- Contratos com operadores e subprocessadores.
- Programa de segurança, resposta a incidentes e continuidade.

## Backlog por módulos e branches

1. `agent/notes-domain-contracts`
2. `agent/notes-recording-offline`
3. `agent/notes-transcription-adapters`
4. `agent/notes-speaker-diarization`
5. `agent/notes-clinical-organizer`
6. `agent/notes-smart-checklist`
7. `agent/notes-timeline`
8. `agent/notes-pant-generator`
9. `agent/notes-clinical-audit`
10. `agent/notes-semantic-search`
11. `agent/notes-dashboard`
12. `agent/notes-export-fhir`
13. `agent/notes-integrations`
14. `agent/notes-security-hardening`

## Critério de pronto

Um módulo só pode sair de Draft quando:

- critérios de aceitação foram demonstrados;
- riscos clínicos e de privacidade foram revisados;
- não há mistura entre fatos e inferências;
- testes críticos passam;
- acessibilidade WCAG 2.2 AA foi verificada;
- documentação técnica e de usuário foi atualizada;
- telemetria não contém dados clínicos identificáveis;
- rollback foi definido.

## Indicadores

- recuperação de gravação após falha;
- taxa de correção da diarização;
- tempo até primeira transcrição;
- percentual de campos confirmados pelo médico;
- taxa de rejeição de inferências;
- tempo economizado na documentação;
- incidentes de privacidade e segurança;
- disponibilidade e custo por consulta;
- satisfação do profissional sem medir “acurácia diagnóstica” como promessa do produto.
