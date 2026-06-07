# Resolução de conflitos — PRs #365 a #370

## Síntese

Esta branch foi criada para resolver a fila de PRs conflitantes sem forçar merge sobre a `main` atual.

A análise mostrou que os PRs #367, #368, #369 e #370 estavam muito defasados em relação à `main` e conflitavam com arquivos já evoluídos. A `main` atual já contém boa parte das propostas visuais desses PRs, incluindo:

- `BrandAssets.tsx` e componentes de marca (`BrandMark`, `MiniShield`, `BrandWatermark`, `ClinicalBrandIcon`);
- `ASSET_INVENTORY.md` com diretriz de uso dos assets;
- Home como painel/cockpit clínico de decisão;
- busca rápida na Home;
- modo escuro padrão quando não há preferência salva;
- haptic/vibração ativada por padrão quando suportada.

Por esse motivo, a estratégia segura foi tratar #367–#370 como **superseded** em vez de aplicar merge direto.

## PR #365

O PR #365 tinha valor funcional, mas não era seguro mesclar inteiro porque falhou no workflow `Verify (catraca)` e também alterava áreas que já evoluíram muito na `main`, especialmente Home e Filtro.

Esta branch reaplica apenas o subconjunto seguro:

1. `GenericScale.tsx`
   - rascunho local por escala em `localStorage`;
   - recuperação automática de respostas;
   - indicador de progresso salvo neste dispositivo;
   - destaque do primeiro item pendente;
   - scroll para item pendente ao tentar concluir incompleto;
   - mensagem clara de respostas faltantes;
   - limpeza do rascunho ao reiniciar.

2. `SaveToPatient.tsx`
   - estado de carregamento ao salvar;
   - mensagem de erro ao falhar criação de paciente;
   - mensagem de erro ao falhar salvamento do resultado;
   - aviso quando a lista de pacientes não carrega;
   - preservação do resultado na tela para nova tentativa.

## O que não foi reaplicado

Não foram reaplicadas alterações amplas do #365 em:

- `home.tsx`;
- `filtro.tsx`;
- `paciente-detalhe.tsx`;
- `ClinicalReport.tsx`;
- `scripts/guards/scorecard.mjs`.

Motivo: esses arquivos já estão muito diferentes na `main`; reaplicar versões antigas poderia regredir fluxo visual, navegação, identidade premium e catraca técnica.

## Validação esperada

Após abrir PR desta branch, rodar:

```bash
npm run check
npm run build
npm run validate:catalog
npm run test:clinical
npm run verify
```

Se `npm run verify` falhar, a falha deve ser corrigida explicitamente ou registrada sem mascaramento.

## Conclusão operacional

- #367–#370: recomendar fechamento como superseded após confirmação visual.
- #365: manter aberto apenas se ainda houver trechos desejados; esta branch já reaplica o núcleo funcional seguro.
- Não houve merge forçado.
- Não houve substituição de Home/Filtro/Layout atuais.
