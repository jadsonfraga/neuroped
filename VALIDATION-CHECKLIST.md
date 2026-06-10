# Checklist de Validação Refinado - NeuroPed
**Status: Pronto para teste em produção**

---

## 📋 VALIDAÇÃO POR CASO (Incremental)

### PASSO 1️⃣: Testar Caso 1 (TEA - Mais Simples)
```
Paciente: Lucas M. | 20 meses | TEA + Atraso + Linguagem
```
**Entrada:**
- Idade: 1-2 anos ✓
- Queixas: ✓ Autismo/TEA ✓ Atraso ✓ Linguagem

**Saída Esperada:**

| Slot | Escala Esperada | Min Critério | Status |
|------|---|---|---|
| 🥇 Ouro | M-CHAT-R/F ou ADOS-2 | Padrão-ouro TEA | [ ] |
| 🥈 Prata | Bayley-III | Atraso global | [ ] |
| 🥉 Bronze | Denver II | Triagem | [ ] |
| 📋 Teste Direto | Campo Visual/Reconhec. | **Nível 1** | [ ] |
| 💊 Medicação | EUSM-10 | Sempre presente | [ ] |

**Validar:**
- [ ] M-CHAT ou ADOS abrem (appRoute funciona)
- [ ] Bayley-III abrem
- [ ] Denver II abre
- [ ] Teste Direto mostra **"Nível 1 - Muito Simples (0-2 anos)"**
- [ ] EUSM-10 abrem no 5º slot

---

### PASSO 2️⃣: Testar Caso 2 (TDAH - Escolar)
```
Paciente: Marina S. | 7 anos (84m) | TDAH + Comportamento
Respondente: Professor
```
**Entrada:**
- Idade: 6-12 anos ✓
- Queixas: ✓ TDAH ✓ Comportamento
- Respondente: Professor ✓

**Saída Esperada:**

| Slot | Escala Esperada | Min Critério | Status |
|------|---|---|---|
| 🥇 Ouro | SNAP-IV ou BRIEF-2 | Padrão-ouro TDAH | [ ] |
| 🥈 Prata | SDQ | Comportamento+escola | [ ] |
| 🥉 Bronze | Conners 3 | Alternativa | [ ] |
| 📋 Teste Direto | Teste Atenção/Vigilância | **Nível 3** | [ ] |
| 💊 Medicação | EUSM-10 | Sempre presente | [ ] |

**Validar:**
- [ ] SNAP-IV aparece (pois respondentes incluem pais/professor/clínico)
- [ ] BRIEF-2 alternativa aceitável
- [ ] Teste Direto mostra **"Nível 3 - Moderado (6-8 anos)"**
- [ ] SDQ com respondente professor priorizado
- [ ] EUSM-10 aparece com texto sobre medicação

---

### PASSO 3️⃣: Testar Caso 3 (Adolescente - Complexo)
```
Paciente: João A. | 14 anos (168m) | Depressão + Ansiedade
```
**Entrada:**
- Idade: 12-18 anos ✓
- Queixas: ✓ Depressão/Humor ✓ Ansiedade

**Saída Esperada:**

| Slot | Escala Esperada | Min Critério | Status |
|------|---|---|---|
| 🥇 Ouro | RCADS | Comorbidade detectada | [ ] |
| 🥈 Prata | SCARED ou PHQ-9 | Ansiedade específica | [ ] |
| 🥉 Bronze | Columbia Suicide Risk | Risco | [ ] |
| 📋 Teste Direto | Reconhec. Emocional | **Nível 6** | [ ] |
| 💊 Medicação | EUSM-10 | Sempre presente | [ ] |

**Validar:**
- [ ] Comorbidade DETECTADA: "Ansiedade + depressão comórbida"
- [ ] RCADS como Ouro (não SCARED sozinho)
- [ ] Teste Direto mostra **"Nível 6 - Muito Avançado (15-18 anos)"**
- [ ] Detalhes do nível 6 aparecem (minutos, tempo rigoroso, etc)
- [ ] Columbia Risk Scale aparece (validar licença)
- [ ] EUSM-10 com aviso sobre medicação psicotrópica

---

### PASSO 4️⃣: Testar Caso 4 (Bebê - Diagnóstico)
```
Paciente: Sofia R. | 10 meses | Atraso Global
```
**Entrada:**
- Idade: 6-12 meses ✓
- Queixas: ✓ Atraso ✓ Motor
- Respondente: Clínico ✓

**Saída Esperada:**

| Slot | Escala Esperada | Min Critério | Status |
|------|---|---|---|
| 🥇 Ouro | Bayley-III | Gold standard atraso | [ ] |
| 🥈 Prata | Griffiths III | Alternativa diagnóstica | [ ] |
| 🥉 Bronze | Denver II | Triagem + detecção | [ ] |
| 📋 Teste Direto | Vis. Motor/Reconhec. | **Nível 1** | [ ] |
| 💊 Medicação | EUSM-10 | Sempre presente | [ ] |

**Validar:**
- [ ] Bayley-III aparece (é padrão-ouro para atraso)
- [ ] Griffiths III abre (rota implementada)
- [ ] Denver II funciona
- [ ] Teste Direto = **Nível 1** (ilimitado, 2-3 opções)
- [ ] EUSM-10 presente (mesmo sem medicação prescrita)

---

### PASSO 5️⃣: Testar Caso 5 (Monitorização - Crítico para Medicação)
```
Paciente: Pedro G. | 9 anos (108m) | TDAH em uso metilfenidato
Contexto: Avaliar tolerabilidade
```
**Entrada:**
- Idade: 6-12 anos ✓
- Queixas: ✓ TDAH
- **NÃO selecionar "Efeitos Colaterais"** (foi removido) ✓

**Saída Esperada:**

| Slot | Escala Esperada | Min Critério | Status |
|------|---|---|---|
| 🥇 Ouro | SNAP-IV ou BRIEF-2 | Reavaliação TDAH | [ ] |
| 🥈 Prata | Conners | Reavaliação | [ ] |
| 🥉 Bronze | Outra TDAH | Complemento | [ ] |
| 📋 Teste Direto | Teste Atenção | **Nível 4** | [ ] |
| 💊 Medicação | EUSM-10 | **CRÍTICO: Deve aparecer** | [ ] |

**Validar CRÍTICO:**
- [ ] **EUSM-10 SEMPRE aparece no 5º slot**
- [ ] Descrição = "Acompanhamento de benefício, tolerabilidade e adesão medicamentosa"
- [ ] Clique em EUSM-10 abre a escala
- [ ] **Nenhuma queixa "Efeitos Colaterais" deve aparecer** ✓
- [ ] Teste Direto = Nível 4 (9-11 anos, 5 opções, 2-3seg)

---

## 🎯 VALIDAÇÃO CONSOLIDADA (Após os 5 Casos)

### ✅ Padrões-Ouro Detectados Corretamente
```
[ ] Caso 1: TEA → M-CHAT/ADOS ✓
[ ] Caso 2: TDAH → SNAP-IV/BRIEF ✓
[ ] Caso 3: Comorbidade → RCADS ✓ (não só SCARED)
[ ] Caso 4: Atraso global → Bayley-III ✓
[ ] Caso 5: TDAH → SNAP-IV/BRIEF ✓
```

### ✅ Dificuldades de Testes Diretos
```
[ ] Nível 1 (0-2 anos): Casos 1 e 4 ✓
[ ] Nível 2 (3-5 anos): (não testado, validar visualmente) ✓
[ ] Nível 3 (6-8 anos): Caso 2 ✓
[ ] Nível 4 (9-11 anos): Caso 5 ✓
[ ] Nível 5 (12-14 anos): (não testado, validar visualmente) ✓
[ ] Nível 6 (15-18 anos): Caso 3 ✓
```

### ✅ 5º Slot - EUSM-10 (Medicação)
```
[ ] Aparece em TODOS os 5 casos
[ ] Sempre é EUSM-10 (nunca outra escala)
[ ] Descrição menciona "tolerabilidade" e "adesão"
[ ] Clique abre a página da escala
[ ] Badge mostra "Satisfação Medicação"
```

### ✅ Funcionalidades Core
```
[ ] Filtro por idade: funciona em todos os casos
[ ] Filtro por queixas: múltiplas seleções funcionam
[ ] Filtro por respondente: professor/clínico detectados
[ ] Escalas abrem sem erro 404
[ ] Badges "mundial" aparecem para escalas globais
[ ] Licenças aparecem corretamente (livre/comercial/restrita)
```

### ✅ Regressões (NÃO deve quebrar)
```
[ ] Nenhuma escala mostra "Sem escala ideal"
[ ] Nenhum erro no console (F12)
[ ] Todos os 260+ escalas ainda filtráveis
[ ] Routes antigas não quebradas
[ ] UI não quebrada em mobile/desktop
```

### ✅ Comportamento do Usuário
```
[ ] Limpar filtros ("Limpar" botão) funciona
[ ] Atualizar página mantém filtros? (validar comportamento esperado)
[ ] Escalas restritas mostram aviso de licença
[ ] Print/Download funcionam (se implementado)
```

---

## 🔴 CRITÉRIOS DE REJEIÇÃO (BLOCKER)

Se qualquer um desses falhar, **volte para desenvolvimento**:

1. ❌ EUSM-10 **não aparece** em qualquer caso
2. ❌ Dificuldade do teste direto = **idade errada**
3. ❌ Padrão-ouro não detectado (ex: RCADS em Caso 3, aparece SCARED sozinho)
4. ❌ Queixa "Efeitos Colaterais" **ainda aparece** (deve ser removida)
5. ❌ Escalas com erro 404 ao clicar
6. ❌ Erro no console que quebra a aplicação

---

## 🟡 ITENS PARA VALIDAÇÃO VISUAL (Nice-to-Have)

```
[ ] Dificuldades mostram características apropriadas
[ ] Cards do filtro têm cores/ícones corretos
[ ] Responsividade mobile não quebrada
[ ] Tabela de níveis exibe corretamente
[ ] Animações não travando
```

---

## 📊 RELATÓRIO FINAL

**Após testar tudo, preencha:**

```
Data Teste: ____________
Testador: ____________
Versão App: ____________

✅ PASSOU:  ___ / 5 casos
⚠️  PARCIAL: ___ / 5 casos
❌ FALHOU:  ___ / 5 casos

Blocker encontrado? SIM / NÃO
Se SIM: ____________

Sugestões:
____________
____________
```

---

