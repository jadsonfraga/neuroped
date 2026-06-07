# Expansão de conteúdo — Portal das Famílias

## Objetivo

Consolidar os ganhos recentes do NeuroPed ampliando número, variedade e utilidade dos conteúdos educativos não sensíveis.

## Estratégia

Em vez de reescrever o arquivo legado `novidadesArtigos.ts`, foi criada uma camada complementar:

- `client/src/data/novidadesConteudoAmpliado.ts`

Essa camada importa os artigos originais, adiciona novos artigos e exporta listas ampliadas para o portal.

## Ganhos aplicados

- 20 novos artigos educativos.
- 7 novas trilhas/categorias:
  - Medicação
  - Epilepsia
  - Terapias
  - Autonomia
  - Segurança
  - Família
  - Exames
- Portal das Famílias agora consome `NOVIDADES_ARTIGOS_AMPLIADOS`.
- Métrica `parentEducationCount` passou a refletir o total real de artigos, sem número fixo.

## Conteúdos novos incluídos

### Medicação

- Efeitos colaterais: o que observar antes do retorno
- Quando parece que o remédio perdeu efeito

### Epilepsia

- Crise convulsiva: primeiros socorros para família e escola
- Diário de epilepsia: o que vale a pena registrar

### Terapias

- Como saber se a terapia está funcionando?
- Relatório terapêutico: o que a família deve pedir

### Autonomia

- Desfralde: sinais de prontidão e erros comuns
- Rotina visual: como usar sem virar enfeite na parede

### Segurança

- Risco de fuga: plano de segurança para crianças neurodivergentes
- Autoagressão: como registrar e quando buscar ajuda

### Família

- Irmãos de crianças neurodivergentes: como cuidar da relação
- Como conversar com a família após um diagnóstico

### Exames

- EEG: para que serve e o que ele não responde
- Atraso de fala: por que avaliar audição?

### Reforço em categorias já existentes

- PEI escolar
- Crise sensorial na escola
- Melatonina e sono infantil
- Seletividade alimentar
- Ecolalia
- Organização familiar no TDAH
- Comunicação funcional no TEA

## Validação recomendada

Rodar:

```bash
npm run check
npm run build:client
npm run validate:catalog
```

Conferir manualmente:

- `/portal-familia/novidades`
- filtros por categoria
- abertura de artigos
- contador de artigos
- home/onboarding caso exibam métrica de educação familiar

## Observação clínica

Os textos foram escritos como psicoeducação familiar, com linguagem conservadora e avisos de que não substituem avaliação profissional individualizada.
