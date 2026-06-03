# Plano de Backend Gratuito — NeuroPed EDJ

## Objetivo

Preparar uma camada backend mínima e gratuita para auditoria técnica, versão do app e evolução futura, sem receber dados clínicos reais nesta fase.

## Princípio

O app estático atual é adequado para conteúdo educativo, CAA, diário local e protótipos. Para uso real com dados clínicos, será necessário backend com autenticação, sessão segura, logs, criptografia e regras por paciente.

## Stack sugerida inicial

- Frontend: GitHub Pages atual ou Cloudflare Pages.
- Backend mínimo: Cloudflare Pages Functions ou Cloudflare Workers.
- Banco leve: Cloudflare D1.
- KV: apenas para metadados não sensíveis.
- Arquivos: não iniciar com upload sensível.

## Endpoints mínimos da Camada 1

```text
GET /api/health
GET /api/version
GET /api/config
POST /api/audit-log
```

## Retorno esperado

### GET /api/health

```json
{
  "ok": true,
  "service": "neuroped-api",
  "environment": "homologacao",
  "timestamp": "ISO_DATE"
}
```

### GET /api/version

```json
{
  "app": "NeuroPed EDJ",
  "version": "v37-quality-foundation",
  "frontend": "github-pages",
  "backendStatus": "planned"
}
```

## Etapas seguras

1. Criar endpoints sem dados clínicos.
2. Registrar apenas logs técnicos não identificáveis.
3. Criar schema D1 demo.
4. Só depois discutir autenticação real.
5. Só usar dados reais após LGPD, RLS, criptografia, backup e consentimento.

## Não fazer nesta fase

- Não enviar dados de pacientes reais.
- Não armazenar laudos, prescrições ou prontuário em KV.
- Não expor service_role key.
- Não simular segurança real com PIN frontend.
- Não declarar produção.

## Critério de avanço

A Camada 1 só estará pronta quando:

- `/api/health` responder;
- `/api/version` responder;
- não houver segredos no frontend;
- `SECURITY.md` e `LGPD_CHECKLIST.md` estiverem atualizados;
- modo do app estiver claro como homologação ou produção.
