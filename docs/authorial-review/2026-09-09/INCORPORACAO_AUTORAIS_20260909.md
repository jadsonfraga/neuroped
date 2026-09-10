# Incorporação de instrumentos autorais — 09/09/2026

## Escopo

Reconciliação entre o diretório canônico de Escalas Autorais no Google Drive e o catálogo/filtro da `main` do NeuroPed.

## Incorporados nesta entrega

- VIGIA-MED 24 — fonte integral verificada; 24 itens; monitorização de tolerabilidade e segurança medicamentosa.
- NEXO-FAM 24 — fonte integral verificada; 24 itens; sustentabilidade familiar do cuidado.
- RITMO-18 SDG — fonte integral verificada; 18 itens; fadiga neurofuncional, participação e recuperação.
- TRILHA-20 SDG — fonte integral verificada; 20 itens; autogestão em saúde e transição do cuidado.

Os quatro instrumentos permanecem explicitamente autorais e não validados psicometricamente. Nenhum ponto de corte diagnóstico foi criado.

## Já existentes — não duplicados

AFI-12 SDG, SDRD-12 SDG, SARF-12 SDG, Irritabilidade e Desregulação VS1, NEXO-S 24, MAPA-RI 18, VIGIA-SD 20, BALANÇO-MED 24 e MCRI-24 já possuíam integração e rastreabilidade na `main`.

## Pendentes por ausência de fonte integral

- PRONTO-SDG 28
- ELO-COM 30
- PASSO-16 SDG

Esses três instrumentos ficam registrados em `pendingAuthorialScaleIntake.ts`, mas bloqueados no catálogo aplicável. O sistema não reconstrói perguntas a partir de resumo, nome, memória conversacional ou domínio clínico.

## Regras de cálculo preservadas

- VIGIA-MED 24: N/O não é zero; total bruto apenas com 24/24 itens pontuáveis.
- NEXO-FAM 24: N/O não entra em soma nem média.
- RITMO-18 SDG: N/O não entra no denominador; média 0–3, maior = maior carga de fadiga/impacto.
- TRILHA-20 SDG: N/O e N/A não entram no denominador; média 0–3, maior = maior autonomia observada.

## Filtro refinado

O ranking preserva os filtros obrigatórios de idade, respondente e finalidade clínica, acrescenta foco semântico por queixa e usa esse foco como desempate antes de critérios genéricos. O objetivo é impedir que instrumentos apenas amplamente relacionados superem ferramentas especificamente desenhadas para a queixa selecionada.
