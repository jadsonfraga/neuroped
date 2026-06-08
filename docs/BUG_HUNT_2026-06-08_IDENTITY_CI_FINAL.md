# NeuroPed — Bug hunt final: identidade, CI e deploy

Data: 2026-06-08

## Objetivo

Caçar bugs/falhas remanescentes após a consolidação do app, com foco em pontos que podem quebrar produção ou gerar documento público errado.

## Achados e correções

### 1. Workflow Cloudflare sem auditoria institucional

Achado:

- `deploy-cloudflare.yml` ainda rodava catálogo, acesso, assets e testes clínicos, mas não rodava `audit:identity`.

Correção:

- incluído `npm run audit:identity` antes de `npm run audit:assets` no workflow Cloudflare.

Resultado:

- GitHub Pages, Cloudflare e Verify passam pela mesma catraca institucional.

### 2. Identidade institucional central

Confirmado:

- `ClinicalReport.tsx` usa `drjadsonfraga@proton.me`;
- `ClinicalReport.tsx` usa `CRM-PE 25227 · RQE 17756`;
- `sobre.tsx` usa telefone `+5587991097371`;
- `sobre.tsx` usa endereço `Rua Raimundo Lacerda, nº 001 — Bairro São José — CEP 56302-470`.

### 3. Busca por termos antigos

Busca final não retornou ocorrências indexadas para:

- `CRM-BA`;
- `jadsonfraga@hotmail.com`;
- `Cardoso de Sá`;
- `32013648`.

### 4. Busca por marcadores de dívida técnica explícita

Busca final não retornou ocorrências indexadas para:

- `TODO`;
- `FIXME`;
- `HACK`;
- `console.error`;
- `throw new Error`.

## Checks esperados no pipeline

- `npm run check`
- `npm run validate:catalog`
- `npm run audit:access`
- `npm run audit:identity`
- `npm run audit:assets`
- `npm run test:clinical`
- `npm run build` ou `npm run build:client`

## Rotas para checagem manual pós-deploy

Públicas:

- `/`
- `/sobre`
- `/filtro`
- `/qualidade`
- `/portal-familia`
- `/pre-retorno`

Sensíveis:

- `/pant`
- `/pacientes`
- `/prontuario`
- `/farmacologia`

## Veredito

A rodada corrigiu a última divergência de CI conhecida entre GitHub Pages e Cloudflare, além de confirmar a limpeza dos termos institucionais antigos nos pontos públicos/centrais.
