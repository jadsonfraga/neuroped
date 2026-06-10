# 🚀 Guia Rápido de Teste - 5 Casos
**Para testar rapidinho e volta pra mim**

---

## 📌 O Que Testar em 2 Minutos Por Caso

### CASO 1️⃣: Lucas (20 meses, TEA)
**URL:** http://localhost:5173/filtro

```
1. Idade: "1-2 anos"
2. Sintomas: ✓ TEA  ✓ Atraso  ✓ Linguagem
3. Ver resultado
```

**Validar (30 seg):**
- [ ] 5 cards aparecem (Ouro, Prata, Bronze, Teste Direto, Medicação)
- [ ] Teste Direto diz "Nível 1" (não 3, 4, 5, 6)
- [ ] 5º card é EUSM-10
- [ ] Clique em EUSM-10 abre (não erro 404)

---

### CASO 2️⃣: Marina (7 anos, TDAH)
**URL:** http://localhost:5173/filtro

```
1. Idade: "6-12 anos"
2. Sintomas: ✓ TDAH  ✓ Comportamento
3. Respondente: "Escola" (Professor)
4. Ver resultado
```

**Validar (30 seg):**
- [ ] Ouro = SNAP-IV ou BRIEF-2
- [ ] Teste Direto diz "Nível 3" (não 1, 2, 4, 5, 6)
- [ ] EUSM-10 aparece
- [ ] Clique em SNAP-IV abre

---

### CASO 3️⃣: João (14 anos, Depressão+Ansiedade)
**URL:** http://localhost:5173/filtro

```
1. Idade: "12-18 anos"
2. Sintomas: ✓ Depressão  ✓ Ansiedade
3. Ver resultado
```

**Validar (30 seg):**
- [ ] Ouro = **RCADS** (combinação dos dois)
- [ ] Teste Direto diz "Nível 6"
- [ ] EUSM-10 aparece
- [ ] Clique em RCADS abre

---

### CASO 4️⃣: Sofia (10 meses, Atraso)
**URL:** http://localhost:5173/filtro

```
1. Idade: "6-12 meses"
2. Sintomas: ✓ Atraso  ✓ Motor (se tiver)
3. Ver resultado
```

**Validar (30 seg):**
- [ ] Ouro = **Bayley-III**
- [ ] Teste Direto diz "Nível 1"
- [ ] EUSM-10 aparece
- [ ] Clique em Bayley-III abre

---

### CASO 5️⃣: Pedro (9 anos, TDAH em medicação)
**URL:** http://localhost:5173/filtro

```
1. Idade: "6-12 anos"
2. Sintomas: ✓ TDAH
3. Ver resultado
```

**Validar (30 seg):**
- [ ] Ouro = SNAP-IV ou BRIEF-2
- [ ] Teste Direto diz "Nível 4"
- [ ] **5º card é EUSM-10** (NÃO "Efeitos Colaterais")
- [ ] Clique em EUSM-10 abre

---

## 🎯 O QUE PODE DAR ERRADO (Blocker)

❌ **Teste Direto mostra número errado**
- Caso 1 = Deve ser Nível 1, não 3/4/5
- Caso 2 = Deve ser Nível 3, não 1/2/4/5
- Caso 5 = Deve ser Nível 4, não 1/2/3/5

❌ **5º card não é EUSM-10**
- Em TODOS os 5 casos deve ser EUSM-10
- Se não aparecer = FALHOU

❌ **Cliques dão erro 404**
- Escala deve abrir, não quebrar

❌ **"Efeitos Colaterais" ainda aparece**
- Deve estar removido do filtro

❌ **Padrão-ouro errado**
- Caso 3: se SCARED sozinho em vez de RCADS = FALHOU

---

## ✅ PASS / FAIL RÁPIDO

Depois de testar os 5, marca aqui:

```
Caso 1 (TEA):           [ ] PASS  [ ] FAIL
Caso 2 (TDAH):          [ ] PASS  [ ] FAIL
Caso 3 (Depress+Ansi):  [ ] PASS  [ ] FAIL
Caso 4 (Atraso):        [ ] PASS  [ ] FAIL
Caso 5 (Medicação):     [ ] PASS  [ ] FAIL

BLOCKER encontrado?     [ ] SIM   [ ] NÃO

Resultado final:        [ ] PRONTO PRODUÇÃO
                        [ ] VOLTA PRO DEV
```

---

## 💬 FEEDBACK

**Se FALHOU:**
```
Qual caso? ________
O que quebrou? ________
Screenshot? (sim/não)
```

**Se PASSOU:**
```
✅ Tá tudo certo, pode fazer deploy
```

---
