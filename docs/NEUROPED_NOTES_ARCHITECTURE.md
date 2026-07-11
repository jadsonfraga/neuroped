# NeuroPed Notes — arquitetura inicial

## Diagnóstico da arquitetura atual

O NeuroPed atual é uma aplicação Vite/React/TypeScript com backend Express, Drizzle e armazenamento SQLite/PostgreSQL, já contendo autenticação, RBAC, auditoria, criptografia de pacientes, rotas LGPD e PWA. A integração natural do Notes deve entrar como domínio clínico separado em `shared/notes`, rotas autenticadas em `/api/notes/*`, telas lazy-loaded no cliente e tabelas próprias para consultas, segmentos, documentos e eventos de auditoria.

## Arquitetura proposta

1. **Captura offline-first**: cliente grava chunks curtos, indexa fila local e sincroniza quando houver rede.
2. **Transcrição desacoplada**: `TranscriptionProvider` abstrai OpenAI Whisper, Deepgram, Google Speech e Azure Speech.
3. **Diarização desacoplada**: `DiarizationProvider` separa papéis clínicos e mantém correção manual auditável.
4. **Normalização clínica**: cada trecho recebe tópico, interlocutor, horário e fonte de evidência.
5. **Copiloto discreto**: checklist só exibe pendências, sem interromper o fluxo da consulta.
6. **Geração documental**: anamnese, evolução, PANT, cartas, receitas-modelo, exames e encaminhamentos sempre ficam marcados como rascunho até revisão médica.
7. **Pesquisa e anonimização**: consultas estruturadas usam metadados clínicos; pesquisas exportáveis passam por anonimização.

## Módulos independentes

- `shared/notes`: contratos, taxonomia, checklist e gerador documental determinístico.
- `server/notes`: orquestração, provedores de transcrição/diarização, persistência, auditoria e exportações.
- `client/src/features/notes`: painel do médico, timeline, correções rápidas, busca e atalhos.
- `db/migrations`: tabelas de consultas, segmentos, documentos gerados, consentimentos de gravação e eventos.
- `tests`: unidade para motor clínico, integração para rotas e e2e para fluxo de consulta.

## Roadmap

1. **Fundação clínica compartilhada**: contratos e motor determinístico de tópicos/checklist/documentos.
2. **Persistência segura**: migrations, criptografia em repouso, consentimento de gravação e auditoria.
3. **API Notes**: CRUD de consultas, ingestão de segmentos e geração documental.
4. **Painel médico MVP**: gravação, timeline, correção de interlocutor, pendências e PANT.
5. **Provedores reais**: adaptadores Whisper, Deepgram, Google e Azure com feature flags.
6. **Exportações**: PDF, DOCX, JSON, FHIR e texto.
7. **Pesquisa anonimizada**: query builder clínico com controle de acesso e trilha LGPD.
8. **Revisores IA**: auditor clínico, contraditório, vieses, inconsistências e checklist de segurança.
