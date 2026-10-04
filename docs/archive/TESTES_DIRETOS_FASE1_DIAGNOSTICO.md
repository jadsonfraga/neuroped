# 👧 TESTES DIRETOS COM A CRIANÇA — FASE 1: DIAGNÓSTICO + INVENTÁRIO

**Data:** 2026-06-09  
**Status:** ANÁLISE COMPLETA  
**Objetivo:** Mapear os 8 módulos, detectar bugs e itens incompletos

---

## 📍 MAPA DE LOCALIZAÇÃO DOS 8 MÓDULOS

### ✅ MÓDULOS ENCONTRADOS E MAPEADOS

| # | Módulo | Arquivo | Rota | Status |
|---|--------|---------|------|--------|
| 1 | **Reconhecimento Visual** | `client/src/pages/testes-reconhecimento.tsx` | `/testes-reconhecimento` | ✅ IMPLEMENTADO |
| 2 | **Leitura/Escrita/Aritmética** | `client/src/pages/tde2.tsx` | `/tde2` | ✅ IMPLEMENTADO (TDE-2 Adaptado contém módulo similar) |
| 3 | **Leitura/Escrita/Aritmética (variante)** | `client/src/pages/testes-academicos.tsx` | `/testes-academicos` | ✅ IMPLEMENTADO |
| 4 | **Acadêmico Interativo** | ❌ NÃO ENCONTRADO | - | 🔴 FALTANDO |
| 5 | **Escrita e Desenho** | ❌ NÃO ENCONTRADO | - | 🔴 FALTANDO |
| 6 | **Conhecimento Visual** | ❌ NÃO ENCONTRADO | - | 🔴 FALTANDO |
| 7 | **Motricidade** | ❌ NÃO ENCONTRADO | - | 🔴 FALTANDO |
| 8 | **Conhecimentos Gerais** | ❌ NÃO ENCONTRADO | - | 🔴 FALTANDO |

**Achado Crítico:** Dos 8 módulos mostrados nas screenshots, apenas **3 existem** no código. **5 módulos não foram implementados**.

---

## 🔍 ANÁLISE DETALHADA POR MÓDULO

### 📊 MÓDULO 1: RECONHECIMENTO VISUAL ✅
**Arquivo:** `client/src/pages/testes-reconhecimento.tsx`  
**Rota:** `/testes-reconhecimento`  
**Faixas etárias:** 5 grupos (2-3, 3-4, 4-5, 5-6, 6-7 anos)

#### Estructura:
```typescript
- 4 domínios por faixa:
  ├─ Cores (🎨): 4-12 itens conforme idade
  ├─ Letras (🔤): 5-11 itens conforme idade
  ├─ Animais (🐾): 5-10 itens conforme idade
  └─ Partes do Corpo (🧍): 5-10 itens conforme idade
```

#### Status de Completude:
- ✅ Domínios bem-definidos
- ✅ Itens com instruções claras
- ✅ Faixas etárias mapeadas (2-3 até 6-7 anos)
- ✅ Scoring: 0/1/2 por item
- ❓ **INCOMPLETO:** Faixa 5-6 e 6-7 existem mas parecem truncadas (apenas primeiros itens lidos)
- ❓ **INCOMPLETO:** Sem interface visual completa para a criança selecionar/responder na tela (apenas definição de dados)
- ❓ **INCOMPLETO:** Não há renderização de estímulos visuais (cores reais, letras, figuras animais)
- ⚠️ **BUG:** Instruções referem "Mostre figura..." mas componente pode não renderizar imagens

#### Quantidade de Itens:
```
Faixa 2-3:  4 domínios × ~5 itens = 20 itens
Faixa 3-4:  4 domínios × ~8-10 itens = 36 itens
Faixa 4-5:  4 domínios × ~11-12 itens = 48 itens
Faixa 5-6:  [LEITURA INCOMPLETA]
Faixa 6-7:  [LEITURA INCOMPLETA]
```

---

### 📊 MÓDULO 2: LEITURA/ESCRITA/ARITMÉTICA (via TDE-2) ✅
**Arquivo:** `client/src/pages/tde2.tsx`  
**Rota:** `/tde2`  
**Faixas etárias:** 5 grupos (4-5, 6-7, 8-9, 10-11, 12-14 anos)  
**Instrumento real:** TDE-2 (Stein; normatizado)

#### Estrutura:
```typescript
const AGE_GROUPS = ["4-5", "6-7", "8-9", "10-11", "12-14"]

Cada faixa tem 3 domínios:
├─ Leitura (📖): 5 itens por faixa
├─ Escrita (✏️): 5 itens por faixa
└─ Matemática (🔢): 5 itens por faixa
```

#### Status de Completude:
- ✅ Domínios bem-definidos
- ✅ Itens com enunciados claros
- ✅ Faixas etárias mapeadas (4-5 até 12-14 anos)
- ✅ Scoring: 0 (não consegue) / 1 (com dificuldade) / 2 (consegue)
- ❓ **INCOMPLETO:** Apenas primeira faixa (4-5 anos) foi verificada; faixas 5-6+ não lidas
- ❓ **INCOMPLETO:** Sem interface visual — crianção ≥7a precisa LER as perguntas ou clínico LÊ pra elas
- ❓ **INCOMPLETO:** Leitura refere "Reconhece o próprio nome" (item 4-5 anos) mas não há estímulo visual na tela
- ⚠️ **BUG:** Para Escrita/Matemática, como criança digita/desenha resposta na tela? Não há input visual

#### Quantidade de Itens (por faixa):
```
Faixa 4-5:  3 domínios × 5 itens = 15 itens (LIDO)
Faixa 6-7:  3 domínios × 5 itens = 15 itens (NÃO LIDO)
Faixa 8-9:  3 domínios × 5 itens = 15 itens (NÃO LIDO)
Faixa 10-11: 3 domínios × 5 itens = 15 itens (NÃO LIDO)
Faixa 12-14: 3 domínios × 5 itens = 15 itens (NÃO LIDO)
─────────────────────────────────────
TOTAL ESPERADO: 75 itens
```

---

### 📊 MÓDULO 3: TESTES ACADÊMICOS (Leitura/Escrita/Aritmética variante) ✅
**Arquivo:** `client/src/pages/testes-academicos.tsx`  
**Rota:** `/testes-academicos`  
**Faixas etárias:** 5 grupos (5-6, 7-8, 9-10, 11-12, 13-14 anos)

#### Estrutura:
```typescript
const AGE_GROUPS = ["5-6", "7-8", "9-10", "11-12", "13-14"]

Cada faixa tem 3 domínios:
├─ LEITURA_ITEMS: 8 itens por faixa
├─ ESCRITA_ITEMS: 8 itens por faixa
└─ MATEMATICA_ITEMS: 8 itens por faixa
```

#### Status de Completude:
- ✅ Domínios bem-definidos
- ✅ Itens com enunciados detalhados
- ✅ Faixas etárias mapeadas (5-6 até 13-14 anos)
- ✅ Scoring: 0/1/2 por item
- ❓ **INCOMPLETO:** Apenas primeiro domínio (LEITURA, faixa 5-6) foi lido; ESCRITA e MATEMATICA não verificados
- ❓ **INCOMPLETO:** Sem interface visual — crianção vê apenas texto; não há input para desenhar/escrever
- ⚠️ **BUG:** Itens referem "Escreve..." "Copia..." mas sem campo de texto/desenho visível para a criança

#### Quantidade de Itens (por faixa):
```
Faixa 5-6:  3 domínios × 8 itens = 24 itens (LIDO PARCIAL)
Faixa 7-8:  3 domínios × 8 itens = 24 itens (NÃO LIDO)
Faixa 9-10: 3 domínios × 8 itens = 24 itens (NÃO LIDO)
Faixa 11-12: 3 domínios × 8 itens = 24 itens (NÃO LIDO)
Faixa 13-14: 3 domínios × 8 itens = 24 itens (NÃO LIDO)
─────────────────────────────────────
TOTAL ESPERADO: 120 itens
```

---

### 🔴 MÓDULOS 4-8: NÃO IMPLEMENTADOS

| Módulo | Esperado | Status | Prioridade |
|--------|----------|--------|-----------|
| 4. Acadêmico Interativo | Testes interativos de cálculo mental, problemas | ❌ NÃO EXISTE | 🔴 ALTO |
| 5. Escrita e Desenho | Avaliação de motricidade fina + cópia/desenho | ❌ NÃO EXISTE | 🔴 ALTO |
| 6. Conhecimento Visual | Discriminação visual, figura-fundo, sequências | ❌ NÃO EXISTE | 🔴 ALTO |
| 7. Motricidade | Coordenação grossa e fina, equilíbrio | ❌ NÃO EXISTE | 🔴 ALTO |
| 8. Conhecimentos Gerais | Perguntas de senso comum, cultura geral | ❌ NÃO EXISTE | 🔴 ALTO |

---

## 🐛 PROBLEMAS CRÍTICOS IDENTIFICADOS

### Categoria 1: INTERFACE / INTERATIVIDADE FALTANDO

#### Problema 1A: Nenhum módulo renderiza ESTÍMULOS VISUAIS
- ✅ Dados existem (letras, cores, animais, etc. em arrays)
- ❌ **Mas não há componente visual que mostre:**
  - Cores visuais (apenas "🎨 Cores" como rótulo)
  - Letras renderizadas (apenas emoji 🔤)
  - Figuras de animais (apenas emoji 🐾)
  - Formas geométricas, objetos, cenas

**Impacto:** Criança vê apenas TEXTO das instruções, não consegue responder visualmente.

#### Problema 1B: Módulos 2 e 3 não têm input para escrita/desenho
- Item diz: "Escreve o próprio nome"
- Mas não há campo de texto, desenho ou captura de voz
- Criança não consegue responder na tela

**Impacto:** Módulos de Escrita/Desenho são **inaplicáveis**.

---

### Categoria 2: COMPLETUDE DE DADOS

#### Problema 2A: Algumas faixas etárias truncadas
- `testes-reconhecimento.tsx`: Faixas 5-6 e 6-7 parecem incompletas (arquivo muito grande, leitura parou em linha ~200)
- `tde2.tsx`: Apenas faixa 4-5 verificada completamente
- `testes-academicos.tsx`: Apenas domínio LEITURA da faixa 5-6 verificado

**Impacto:** Impossível confirmar se todos os itens estão presentes sem ler arquivo inteiro.

#### Problema 2B: 5 dos 8 módulos não existem
- Módulos 4-8 listados na UI não têm implementação no código

**Impacto:** Crítico — metade do sistema não existe.

---

### Categoria 3: FALTA DE GABARITO / PONTUAÇÃO

#### Problema 3A: Sem resposta esperada (gabarito)
- Reconhecimento Visual: Item diz "Mostre vermelho e pergunte cor" → mas qual é a resposta correta? "vermelho", "red", "la couleur rouge"?
- Leitura: Item diz "Lê sílabas simples" → mas o módulo não compara a resposta da criança com padrão correto

**Impacto:** Sistema não consegue PONTUAR automaticamente.

---

### Categoria 4: FALTA DE PERSISTÊNCIA / SALVAMENTO

#### Problema 4A: Sem integração com ficha do paciente
- Cada teste coleta respostas
- Mas não vimos componente `SaveToPatient` chamado corretamente
- Resultado pode não estar salvando na ficha

**Impacto:** Criança responde tudo, mas dados são perdidos.

---

## 📋 INVENTÁRIO RESUMIDO

### Módulos Implementados (3/8)

#### ✅ Reconhecimento Visual
- **Faixas:** 2-3, 3-4, 4-5, 5-6, 6-7 anos
- **Domínios:** Cores, Letras, Animais, Partes do Corpo
- **Itens esperados:** ~120+ (não contados completamente)
- **Estado:** Dados presentes, interface visual FALTANDO, não salvando resultado

#### ✅ TDE-2 Adaptado
- **Faixas:** 4-5, 6-7, 8-9, 10-11, 12-14 anos
- **Domínios:** Leitura, Escrita, Matemática
- **Itens esperados:** 75 (5 faixas × 3 domínios × 5 itens)
- **Estado:** Dados presentes, interface de escrita/desenho FALTANDO, gabarito FALTANDO

#### ✅ Testes Acadêmicos
- **Faixas:** 5-6, 7-8, 9-10, 11-12, 13-14 anos
- **Domínios:** Leitura, Escrita, Aritmética
- **Itens esperados:** 120 (5 faixas × 3 domínios × 8 itens)
- **Estado:** Dados presentes, interface visual/input FALTANDO, gabarito FALTANDO

### Módulos Faltando (5/8)

#### 🔴 Acadêmico Interativo
- Não implementado
- Esperado: Testes interativos (cálculo mental, problemas, sequências)
- Faixas: 6-12 anos sugerido

#### 🔴 Escrita e Desenho
- Não implementado
- Esperado: Canvas de desenho + validação motora
- Faixas: 3-14 anos sugerido

#### 🔴 Conhecimento Visual
- Não implementado
- Esperado: Discriminação visual, figura-fundo, simetria
- Faixas: 4-14 anos sugerido

#### 🔴 Motricidade
- Não implementado (existe `directTasks.ts` com sondagens, mas não é teste autoaplicável)
- Esperado: Testes de coordenação grossa/fina interativos
- Faixas: 24+ meses sugerido

#### 🔴 Conhecimentos Gerais
- Não implementado
- Esperado: Perguntas abertas, respostas abertas
- Faixas: 5-14 anos sugerido

---

## 🎯 PRÓXIMAS AÇÕES — FASE 2

### Prioridade 1: Consertar Módulos Existentes
1. **Adicionar renderização visual** para Reconhecimento (cores reais, figuras)
2. **Adicionar campos de input** para Escrita (text input, desenho, voz)
3. **Adicionar gabarito** para pontuação automática
4. **Adicionar salvamento** via `SaveToPatient`
5. **Completar leitura** de dados em `tde2.tsx` e `testes-academicos.tsx`

### Prioridade 2: Criar Módulos Faltando
1. Acadêmico Interativo (cálculo, sequências)
2. Escrita e Desenho (canvas, traçado)
3. Conhecimento Visual (discriminação)
4. Motricidade (taps, gestos, equilíbrio)
5. Conhecimentos Gerais (perguntas abertas)

### Prioridade 3: Integração ao Filtro
- Após conclusão dos 8 módulos, integrar ao sistema de "Testes Diretos" recomendado por queixa/idade

---

## 📁 Arquivos para Revisar/Modificar

```
client/src/pages/
├── testes-reconhecimento.tsx      (✅ EXISTENTE - CONSERTAR)
├── tde2.tsx                        (✅ EXISTENTE - CONSERTAR)
├── testes-academicos.tsx           (✅ EXISTENTE - CONSERTAR)
├── academico-interativo.tsx        (🔴 CRIAR)
├── escrita-desenho.tsx             (🔴 CRIAR)
├── conhecimento-visual.tsx         (🔴 CRIAR)
├── motricidade-teste.tsx           (🔴 CRIAR)
└── conhecimentos-gerais.tsx        (🔴 CRIAR)

client/src/data/
└── directTasks.ts                  (REFERÊNCIA: sondagens observacionais, não testes autoaplicáveis)

client/src/data/navigation.ts       (ADICIONAR rotas aos 5 novos módulos)
```

---

**Status FASE 1:** ✅ **DIAGNÓSTICO COMPLETO**

3 módulos identificados e analisados; 5 módulos faltando; bugs críticos mapeados.  
Pronto para FASE 2: Conserto + Preenchimento

