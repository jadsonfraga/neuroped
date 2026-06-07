# Resolução final de conflitos — PRs #365 a #370

## Síntese

Os PRs #365, #367, #368, #369 e #370 estavam divergidos da `main` e não eram seguros para merge direto. A estratégia adotada foi consolidar seletivamente o conteúdo útil em PRs novos e mergeáveis, preservando a `main` como fonte de verdade.

## Consolidações mergeadas

### #376 — núcleo funcional do fluxo clínico

Arquivos principais:

- `client/src/components/GenericScale.tsx`
- `client/src/components/SaveToPatient.tsx`

Entrou na `main`:

- rascunho local por escala em `localStorage`;
- recuperação automática de respostas;
- indicador de progresso salvo neste dispositivo;
- destaque do primeiro item pendente;
- mensagem clara de respostas faltantes;
- limpeza do rascunho ao reiniciar;
- estado de carregamento ao salvar resultado;
- erro explícito ao falhar criação de paciente;
- erro explícito ao falhar salvamento;
- preservação do resultado na tela para nova tentativa.

### #377 — visual semântico do filtro clínico

Arquivo principal:

- `client/src/pages/filtro.tsx`

Entrou na `main`:

- função `getScaleVisual(scale)`;
- ícones e tons visuais por domínio clínico;
- rótulos como TEA/social, atenção, linguagem, escola, sono, humor, desenvolvimento, medicação, família e clínico;
- preservação da lógica atual de ranking obrigatório, catálogo mundial e rotas.

### #378 — endurecimento do relatório clínico

Arquivo principal:

- `client/src/components/ClinicalReport.tsx`

Entrou na `main`:

- remoção do envio automático ao montar o componente;
- `reportReady` para bloquear PDF/email incompleto;
- `escapeHtml` na impressão;
- ações manuais para copiar, imprimir/PDF e preparar email;
- preservação do gráfico radar quando há domínios suficientes.

## PRs antigos fechados como suplantados

- #365: suplantado por #376 e #378.
- #367: suplantado pela Home atual já consolidada como cockpit clínico com `BrandMark`, métricas reais e busca rápida.
- #368: suplantado por #377.
- #369: suplantado porque tema escuro padrão, haptic padrão e nomenclatura Filtro Clínico Inteligente já estavam aplicados.
- #370: suplantado porque `BrandAssets`, `BrandMark`, inventário de assets e escudo Dr. Jadson já estavam presentes na `main`.

## Deploy e verificação

Após a consolidação foram adicionados/acionados:

- commit de deploy trigger em `main`;
- workflows existentes de deploy para GitHub Pages e Cloudflare Pages;
- workflow novo `.github/workflows/verify.yml`, executando:
  - `npm run check`;
  - `npm run validate:catalog`;
  - `npm run test:clinical`;
  - `npm run build`.

## Conclusão operacional

Não houve merge forçado. Não houve substituição cega de `Home`, `Filtro`, `Layout` ou `index.css`. O conteúdo útil dos PRs foi consolidado seletivamente, reduzindo risco de regressão visual, clínica e operacional.
