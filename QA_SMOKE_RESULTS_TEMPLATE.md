# QA_SMOKE_RESULTS_TEMPLATE — NeuroPed EDJ

Data do teste: ____/____/______
Navegador: _____________________
Dispositivo: ____________________
URL testada: `https://jadsonfraga.github.io/neuroped/qa-smoke-test.html`

## Resultado geral

- [ ] Todos os testes passaram
- [ ] Houve falhas
- [ ] Foi necessário recarregar a página para atualizar service worker

## Resultado copiado do smoke test

```txt
Cole aqui o resultado do botão “Copiar resultado”.
```

## Checklist manual complementar

### CAA Gratuita

- [ ] Abriu `comunicacao-alternativa.html`
- [ ] Tocar figurinha fala em PT-BR
- [ ] Figurinha entra na frase
- [ ] Falar frase funciona
- [ ] Apagar remove último cartão
- [ ] Limpar remove tudo
- [ ] Repetir funciona
- [ ] Copiar frase aparece
- [ ] Salvar frase rápida aparece
- [ ] Frases salvas persistem após recarregar
- [ ] Busca encontra: água, dor, banheiro, mamãe, pausa, barulho
- [ ] Exportar/importar prancha funciona

### Diário v2

- [ ] Cadastrar criança funciona
- [ ] Novo registro funciona
- [ ] Filtro Escola funciona
- [ ] Filtro Terapias funciona
- [ ] Evolução aparece após habilidade com nível
- [ ] Relatório 7/14/30/60/90 funciona
- [ ] Preparar para consulta aparece
- [ ] Copiar resumo médico funciona
- [ ] Imprimir relatório abre impressão
- [ ] Exportar/importar JSON funciona
- [ ] Data local não pula por UTC

### Filtro de escalas

Testar frases:

- [ ] `18 meses, não fala, não responde nome, barulho`
- [ ] `4 anos, seletividade alimentar, textura, engasgo`
- [ ] `9 anos, desatenção, não termina tarefa, escola`
- [ ] `13 anos, tristeza, não quer viver, se machuca`
- [ ] `autimo, birrra, nao fala`

Critério:

- [ ] Top 5 sem lote genérico acima de instrumento específico
- [ ] Perguntas fáceis aparecem
- [ ] Justificativa do resultado aparece

### Mapa de Instrumentos

- [ ] Filtro por público funciona
- [ ] Filtro por idade funciona
- [ ] Filtro por sintoma funciona
- [ ] Busca textual funciona
- [ ] Abrir instrumento não quebra
- [ ] Usar no filtro abre `filtro-escalas.html`

### Índice

- [ ] CAA Gratuita aparece
- [ ] Mapa de Instrumentos aparece
- [ ] Diário aparece
- [ ] Filtro aparece
- [ ] Bancos seguem acessíveis
- [ ] Não aparece `CAA Premium`

## Observações

```txt
Descrever aqui qualquer erro visual, tela branca, demora, botão duplicado ou falha de voz.
```
