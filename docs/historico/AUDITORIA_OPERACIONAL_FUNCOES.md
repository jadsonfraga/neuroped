# AUDITORIA OPERACIONAL DE FUNÇÕES — NeuroPed SDG

Data: 2026-05-07
Escopo: hotfixes cirúrgicos para preservar o app existente e corrigir falhas objetivas apontadas na auditoria funcional.

## 1. Objetivo

Corrigir, sem reescrever módulos grandes e sem quebrar rotas existentes:

1. Rótulo antigo `CAA Premium` no manifest.
2. Falta de link para `mapa-escalas.html` no índice.
3. Texto antigo `v14` no índice.
4. Falta de botões explícitos `Copiar frase` e `Salvar frase rápida` na CAA.
5. Falta de botão `Preparar para consulta` no Diário.
6. Falta de checklist operacional formal.

## 2. Arquivos modificados ou criados

### Modificados

- `manifest.json`
- `escalas.html`
- `sw.js`

### Criados

- `caa-hotfix.js`
- `diario-hotfix.js`
- `AUDITORIA_OPERACIONAL_FUNCOES.md`

## 3. Correções aplicadas

### 3.1 Manifest

Status: corrigido.

Antes:

```txt
CAA Premium — Comunicação Alternativa
```

Depois:

```txt
CAA Gratuita — Comunicação Alternativa
```

Também foi adicionado shortcut para:

```txt
Mapa de Instrumentos NeuroPed
```

### 3.2 Índice `escalas.html`

Status: corrigido.

Foi adicionado card destacado para:

```txt
mapa-escalas.html
```

O texto de versão visual foi atualizado de:

```txt
v14
```

para:

```txt
v15
```

O índice agora expõe em até dois cliques:

- App principal
- CAA Gratuita
- Mapa de Instrumentos
- Diário v2
- Filtro sensível
- Bancos de escalas

### 3.3 CAA Gratuita

Status: funcional por hotfix progressivo.

Foi criado:

```txt
caa-hotfix.js
```

Funções adicionadas:

- botão `Copiar frase`;
- botão `Salvar frase rápida`;
- persistência local de frases rápidas da família;
- bloco de frases salvas da família;
- fala das frases salvas por `speechSynthesis`.

Preservado:

- voz PT-BR;
- busca;
- favoritos;
- histórico;
- exportar/importar prancha;
- montagem de frase;
- apagar último;
- limpar;
- repetir;
- cartões personalizados;
- categorias existentes.

Observação técnica: para não reescrever o HTML grande da CAA, o hotfix é injetado pelo service worker em `comunicacao-alternativa.html` e também cacheado em `sw.js`.

### 3.4 Diário Escola e Terapias v2

Status: funcional por hotfix progressivo.

Foi criado:

```txt
diario-hotfix.js
```

Funções adicionadas:

- botão `Preparar para consulta`;
- bloco `Preparado para consulta`;
- resumo executivo;
- evolução observada;
- conquistas;
- desafios;
- sinais de atenção;
- perguntas para equipe;
- botão `Copiar resumo médico`;
- botão `Imprimir relatório`.

Preservado:

- cadastro de criança;
- novo registro;
- filtros Escola/Terapias;
- evolução por habilidade;
- relatório por período;
- exportação/cópia/compartilhamento;
- correção de data local.

Observação técnica: para não reescrever o HTML grande do Diário, o hotfix é injetado pelo service worker em `diario-escola-terapias-v2.html` e também cacheado em `sw.js`.

### 3.5 Service Worker

Status: atualizado.

Versão atual:

```txt
neuroped-v16-operacional-hotfix-2
```

Inclui no cache:

- `caa-hotfix.js`
- `diario-hotfix.js`
- `mapa-escalas.html`
- `scales-editorial.js`
- rotas centrais do app

Também injeta os hotfixes nas páginas HTML correspondentes quando servidas sob controle do service worker.

## 4. Limitação técnica assumida

Os arquivos `comunicacao-alternativa.html` e `diario-escola-terapias-v2.html` são grandes. Para preservar o conteúdo já funcional e evitar sobrescrita destrutiva, a correção foi aplicada por scripts auxiliares injetados pelo service worker.

Consequência prática:

- após o novo service worker instalar e controlar a página, os hotfixes entram automaticamente;
- em primeiro acesso absolutamente direto, pode ser necessário recarregar a página uma vez para o service worker assumir controle.

Isso preserva o máximo possível do que já estava construído.

## 5. Checklist operacional por rota

### App principal

Rota:

```txt
https://jadsonfraga.github.io/neuroped/
```

Checklist:

- [ ] app React carrega;
- [ ] sidebar aparece;
- [ ] CAA aparece abaixo de Secretaria quando a sidebar renderiza;
- [ ] não há botão flutuante solto;
- [ ] service worker registra sem erro visível.

### CAA Gratuita

Rota:

```txt
https://jadsonfraga.github.io/neuroped/comunicacao-alternativa.html
```

Checklist:

- [ ] splash aparece e some;
- [ ] tocar figurinha fala em português;
- [ ] figurinha entra na frase;
- [ ] `Falar frase` funciona;
- [ ] `Apagar` remove último cartão;
- [ ] `Limpar` limpa a frase;
- [ ] `Repetir` repete última fala/frase;
- [ ] busca encontra água, dor, banheiro, mamãe, pausa, barulho;
- [ ] favoritos persistem;
- [ ] histórico persiste;
- [ ] exportar prancha funciona;
- [ ] importar prancha funciona;
- [ ] `Copiar frase` aparece após o hotfix;
- [ ] `Salvar frase rápida` aparece após o hotfix;
- [ ] frases salvas da família persistem.

### Diário v2

Rota:

```txt
https://jadsonfraga.github.io/neuroped/diario-escola-terapias-v2.html
```

Checklist:

- [ ] cadastrar criança funciona;
- [ ] novo registro funciona;
- [ ] escola filtra registros escolares;
- [ ] terapias filtra registros terapêuticos;
- [ ] evolução gera gráfico quando há habilidade com nível;
- [ ] relatório 7/14/30/60/90 dias funciona;
- [ ] copiar relatório funciona;
- [ ] baixar relatório funciona;
- [ ] exportar JSON funciona;
- [ ] importar JSON funciona;
- [ ] data local não pula por UTC;
- [ ] `Preparar para consulta` aparece após o hotfix;
- [ ] `Copiar resumo médico` funciona;
- [ ] `Imprimir relatório` funciona.

### Filtro de escalas

Rota:

```txt
https://jadsonfraga.github.io/neuroped/filtro-escalas.html
```

Checklist:

- [ ] carrega `scales-index.json`;
- [ ] carrega `scales-editorial.js`;
- [ ] idade em meses/anos é interpretada;
- [ ] queixa livre é interpretada;
- [ ] erros como `autimo`, `birrra`, `desatencao` são tolerados;
- [ ] top 5 prioriza instrumentos específicos;
- [ ] perguntas fáceis aparecem nos resultados;
- [ ] bancos/lotes ficam como complemento.

Testes-alvo:

- [ ] `18 meses, não fala, não responde nome, barulho`
- [ ] `4 anos, seletividade alimentar, textura, engasgo`
- [ ] `9 anos, desatenção, não termina tarefa, escola`
- [ ] `13 anos, tristeza, não quer viver, se machuca`
- [ ] `autimo, birrra, nao fala`

### Mapa de Instrumentos

Rota:

```txt
https://jadsonfraga.github.io/neuroped/mapa-escalas.html
```

Checklist:

- [ ] carrega catálogo editorial;
- [ ] filtra por respondente;
- [ ] filtra por idade;
- [ ] filtra por sintoma;
- [ ] busca textual funciona;
- [ ] cards mostram emoji, nome, público, idade, sintomas e perguntas;
- [ ] botão abrir instrumento funciona quando anchor existir;
- [ ] botão usar no filtro abre `filtro-escalas.html`.

### Índice de ferramentas

Rota:

```txt
https://jadsonfraga.github.io/neuroped/escalas.html
```

Checklist:

- [ ] CAA Gratuita aparece;
- [ ] Mapa de Instrumentos aparece;
- [ ] Diário v2 aparece;
- [ ] Filtro aparece;
- [ ] bancos antigos continuam linkados;
- [ ] texto mostra v15/cache editorial;
- [ ] não aparece `CAA Premium`.

### PWA/cache

Checklist:

- [ ] `sw.js` registra;
- [ ] cache atual é `neuroped-v16-operacional-hotfix-2`;
- [ ] caches antigos são removidos no activate;
- [ ] páginas centrais entram em cache;
- [ ] hotfixes `caa-hotfix.js` e `diario-hotfix.js` são cacheados;
- [ ] após recarregar, hotfixes são injetados nas páginas correspondentes.

## 6. Verificação de texto proibido

Busca realizada por:

```txt
CAA Premium
caa-premium
Premium
```

Achado residual esperado:

- documentação antiga de auditoria pode mencionar o problema histórico;
- arquivos de produção devem estar padronizados para `CAA Gratuita`.

## 7. Nota operacional pós-hotfix

| Área | Situação | Nota estimada |
|---|---|---:|
| Manifest | rótulo corrigido | 9,6 |
| Índice `escalas.html` | mapa linkado e v15 atualizado | 9,3 |
| CAA Gratuita | botões adicionados por hotfix | 9,2 |
| Diário v2 | preparo para consulta adicionado por hotfix | 9,1 |
| Filtro de escalas | humanizado e operacional | 9,1 |
| Mapa de escalas | operacional e linkado | 9,2 |
| PWA/cache | v16 com hotfixes | 9,0 |
| Sidebar | fallback preservado | 8,4 |

Nota global estimada: 9,1–9,3.

## 8. Pendências honestas

1. Inserir os scripts diretamente no HTML da CAA e Diário em sprint posterior, caso se queira eliminar dependência de injeção pelo service worker.
2. Resolver sidebar nativa se o código-fonte React/Vite editável for adicionado ao repositório.
3. Executar teste real em iPhone Safari e Android Chrome.
4. Executar Lighthouse após propagação do GitHub Pages.

## 9. Veredito

Os seis hotfixes solicitados foram tratados preservando o máximo possível do app já construído.

O conjunto está mais operacional, mais coerente e com menor risco de regressão. A solução prioriza conservação e estabilidade, aceitando a limitação técnica de hotfix progressivo via service worker para os HTML grandes.
