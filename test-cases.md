# 5 Casos de Teste - NeuroPed Filter System
**Para testar incrementalmente e validar o sistema**

---

## CASO 1: Suspeita de Autismo em Lactente (TEA + Atraso + Linguagem)
**Objetivo:** Validar padrão-ouro TEA com recomendação de Gold + Silver + Bronze + Teste Direto

### Dados do Paciente
- **Nome:** Lucas M.
- **Idade:** 20 meses
- **Queixa Principal:** "Não aponta, pouca brincadeira simbólica, sons repetitivos"

### Passos no Filtro
1. ✅ Selecionar idade: **1-2 anos**
2. ✅ Selecionar sintomas: **Autismo/TEA** + **Atraso do Desenvolvimento** + **Linguagem/Comunicação**
3. ✅ Clicar em "Filtrar"

### Esperado
- **Ouro:** M-CHAT-R/F ou ADOS-2 → "PADRÃO-OURO: Suspeita TEA em lactentes"
- **Prata:** Bayley-III (atraso global)
- **Bronze:** Denver II (triagem)
- **Teste Direto:** Campo visual ou reconhecimento → Nível 1 (0-2 anos)
- **5º Slot (Medicação):** EUSM-10 → "Acompanhamento de benefício..."

### Validação
- [ ] 5 slots aparecem na ordem correta
- [ ] Padrão-ouro detectado corretamente
- [ ] Dificuldade do teste direto = Nível 1
- [ ] Clique em EUSM-10 abre a escala

---

## CASO 2: TDAH com Comportamento Disruptivo em Criança de Escola (TDAH + Comportamento)
**Objetivo:** Validar padrão-ouro TDAH com recomendações contextualizadas

### Dados do Paciente
- **Nome:** Marina S.
- **Idade:** 7 anos (84 meses)
- **Queixa Principal:** "Dificuldade de atenção na escola, comportamento agressivo com colegas"

### Passos no Filtro
1. ✅ Selecionar idade: **6-12 anos**
2. ✅ Selecionar sintomas: **TDAH** + **Comportamento/Externalizantes**
3. ✅ Selecionar respondente: **Professor**
4. ✅ Clicar em "Filtrar"

### Esperado
- **Ouro:** SNAP-IV ou BRIEF-2 → "PADRÃO-OURO: Suspeita TDAH (completo)"
- **Prata:** SDQ (detecta problemas + acadêmicos)
- **Bronze:** Conners 3-P
- **Teste Direto:** Teste de atenção/vigilância → Nível 3 (6-8 anos)
- **5º Slot:** EUSM-10 (se em uso medicamentoso)

### Validação
- [ ] Professor aparece em respondentes filtrados
- [ ] SNAP-IV priorizado sobre SDQ
- [ ] Dificuldade = Nível 3
- [ ] Clique em SNAP-IV abre a escala

---

## CASO 3: Depressão + Ansiedade em Adolescente (Humor + Ansiedade)
**Objetivo:** Validar recomendações para adolescentes com padrão complexo

### Dados do Paciente
- **Nome:** João A.
- **Idade:** 14 anos (168 meses)
- **Queixa Principal:** "Tristeza, isolamento social, preocupação excessiva"

### Passos no Filtro
1. ✅ Selecionar idade: **12-18 anos**
2. ✅ Selecionar sintomas: **Depressão/Humor** + **Ansiedade**
3. ✅ Selecionar respondente: **Pais**
4. ✅ Clicar em "Filtrar"

### Esperado
- **Ouro:** RCADS → "Ansiedade + depressão comórbida"
- **Prata:** SCARED ou PHQ-9
- **Bronze:** Columbia Suicide Risk Scale
- **Teste Direto:** Teste de reconhecimento emocional → Nível 6 (15-18 anos)
- **5º Slot:** EUSM-10

### Validação
- [ ] RCADS priorizado (comorbidade detectada)
- [ ] Dificuldade = Nível 6 (máxima)
- [ ] Clique em Columbia abre (ou indica restrição de licença)
- [ ] EUSM-10 aparece como 5º slot

---

## CASO 4: Atraso Global do Desenvolvimento em Bebê (Atraso + Motor + Linguagem)
**Objetivo:** Validar recomendação de padrão-ouro para diagnóstico de atraso

### Dados do Paciente
- **Nome:** Sofia R.
- **Idade:** 10 meses
- **Queixa Principal:** "Não senta sozinha, pouca vocalização, desenvolvimento lento"

### Passos no Filtro
1. ✅ Selecionar idade: **6-12 meses**
2. ✅ Selecionar sintomas: **Atraso do Desenvolvimento** + **Motor** (se aparecer)
3. ✅ Selecionar respondente: **Clínico**
4. ✅ Clicar em "Filtrar"

### Esperado
- **Ouro:** Bayley-III → "Atraso desenvolvimento global"
- **Prata:** Griffiths III
- **Bronze:** Denver II
- **Teste Direto:** Reconhecimento visual → Nível 1 (0-2 anos)
- **5º Slot:** EUSM-10

### Validação
- [ ] Bayley-III aparece como Ouro
- [ ] Griffiths como Prata
- [ ] Todos com appRoute funcionando
- [ ] Dificuldade = Nível 1

---

## CASO 5: Monitorização de Medicação com Tolerabilidade Questionada (Medicação + Efeitos)
**Objetivo:** Validar que EUSM-10 aparece como 5º slot de forma apropriada

### Dados do Paciente
- **Nome:** Pedro G.
- **Idade:** 9 anos (108 meses)
- **Queixa Principal:** "Paciente em metilfenidato há 3 meses, ganhou peso, questionável adesão"

### Passos no Filtro
1. ✅ Selecionar idade: **6-12 anos**
2. ✅ Selecionar sintomas: **TDAH** (contexto atual)
3. ✅ **Não selecionar queixa de "Efeitos Colaterais"** (foi removida)
4. ✅ Clicar em "Filtrar"

### Esperado
- **Ouro:** SNAP-IV ou BRIEF-2
- **Prata:** Conners
- **Bronze:** Outro instrumento TDAH
- **Teste Direto:** Teste de atenção → Nível 4 (9-11 anos)
- **5º Slot (IMPORTANTE):** EUSM-10 → "Acompanhamento de benefício, tolerabilidade e adesão medicamentosa"

### Validação
- [ ] EUSM-10 sempre aparece como 5º slot
- [ ] Descrição menciona "tolerabilidade" e "adesão"
- [ ] Clique abre a escala completa
- [ ] **Validar que "Efeitos Colaterais" NÃO aparece mais**

---

## CHECKLIST DE VALIDAÇÃO CONSOLIDADO

### Após testar TODOS os 5 casos:

#### ✅ Padrões-Ouro Detectados
- [ ] Caso 1: TEA detectado (M-CHAT ou ADOS)
- [ ] Caso 2: TDAH detectado (SNAP-IV ou BRIEF)
- [ ] Caso 3: Comorbidade detectada (RCADS)
- [ ] Caso 4: Atraso global detectado (Bayley)
- [ ] Caso 5: TDAH detectado

#### ✅ Dificuldades de Testes Diretos
- [ ] Caso 1: Nível 1 (0-2 anos) ✓
- [ ] Caso 2: Nível 3 (6-8 anos) ✓
- [ ] Caso 3: Nível 6 (15-18 anos) ✓
- [ ] Caso 4: Nível 1 (0-2 anos) ✓
- [ ] Caso 5: Nível 4 (9-11 anos) ✓

#### ✅ 5º Slot (Medicação)
- [ ] Aparece em todos os 5 casos
- [ ] Sempre EUSM-10
- [ ] Descrição correta
- [ ] Clique abre escala

#### ✅ Funcionalidades Críticas
- [ ] Filtro por idade funciona
- [ ] Filtro por queixas funciona
- [ ] Filtro por respondente funciona
- [ ] Escalas abrem corretamente
- [ ] Sem erros no console
- [ ] Sem escalas "Sem escala ideal"

#### ✅ Regressões
- [ ] Nenhuma escala quebrada
- [ ] Nenhuma rota 404
- [ ] Licenças aparecem corretamente
- [ ] Badges de "mundial" aparecem onde apropriado

---

## INSTRUÇÕES PARA SUA SECRETÁRIA

1. **Acesse:** http://localhost:5173/filtro (ou URL de staging)
2. **Para cada caso:**
   - Preencha os dados conforme o cenário
   - **Tire screenshot dos 5 slots recomendados**
   - Clique em cada escala e confirme que abre
   - Anote qualquer erro ou comportamento inesperado

3. **Envie relatório com:**
   - ✅ O que funcionou
   - ❌ O que não funcionou
   - 📸 Screenshots dos 5 casos
   - 🐛 Erros do console (F12 → Console tab)

---

## REFINAMENTO INCREMENTAL

**Iteração 1:** Todos os 5 casos rodam sem erro  
**Iteração 2:** Todos os padrões-ouro detectados corretamente  
**Iteração 3:** Dificuldades de teste direto corretas por idade  
**Iteração 4:** EUSM-10 sempre no 5º slot com descrição correta  
**Iteração 5:** Zero regressões nas 260+ escalas existentes  

---

