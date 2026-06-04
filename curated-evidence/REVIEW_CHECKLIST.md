# Checklist de Revisão Clínica — Curadoria de Escalas

> Documento auxiliar pro **Dr. Jadson** validar o conteúdo curado (`fase1-2-3.md` + `fase4.md` + `instruments.json`) antes de alimentar produção.
> Caso queira marcar a revisão, **duplique este arquivo** como `REVIEW_LOG_<data>.md` e preencha os checkboxes.
> Marque ⚠️ em qualquer divergência e abra issue/PR específico de correção.

---

## Como usar

1. Abrir `curated-evidence/fase1-2-3.md` e `curated-evidence/fase4.md` em paralelo
2. Para cada instrumento, percorrer os 7 pontos do **Portão de Auditoria** (Seção 7 do PROMPT SUPREMO v2.0)
3. Validar PMIDs clicando no DOI quando houver dúvida
4. Marcar como ✅ aprovado · ⚠️ rever · ❌ reescrever
5. Assinar o changelog clínico ao fim

---

## Critérios universais (aplicar a CADA instrumento)

| # | Critério | M-CHAT | SDQ | Vand | ASQ | C-SSRS | PSC-17 | SWYC | RCADS | PHQ/GAD | CRAFFT | GMFCS | MACS | MiniMACS | MABC-2 | SCQ | GARS-3 | BASC-3 | Conners-3 | BRIEF | CBCL |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Cutoff em fonte primária | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 2 | Métrica com nível ✔/≈/⚠ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 3 | PMID real (clicar DOI) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 4 | Rastreio ≠ Diagnóstico | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 5 | Limitações declaradas | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 6 | Sem reescrita de itens | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 7 | Divergências explicitadas | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

---

## Critérios clínicos específicos (Dr. Jadson)

### Alinhamento com a prática brasileira

- ☐ Versões PT-BR mencionadas estão **realmente disponíveis** no Brasil
- ☐ Cortes brasileiros, quando existirem, foram sinalizados como "consolidação"
- ☐ Links de portais nacionais (CVV 188, SAMU 192, CAPS/CAPSi) coerentes
- ☐ Nomenclatura DSM-5-TR / CID-11 atualizada onde apropriado

### Linguagem familiar

- ☐ Seção `guidance_for_families` realmente acolhe sem infantilizar
- ☐ Sem expressões médicas inacessíveis nas explicações pra pais
- ☐ Recomendações específicas pra contexto brasileiro (escola pública × privada, acesso a TO/fono via SUS)
- ☐ Emojis usados com moderação (✅ ⚠️ 🧠 👨‍👩‍👧 📋) — não excessivos

### Segurança clínica

- ☐ **Risco suicida** (C-SSRS, ASQ, item 9 PHQ, item específico CBCL/YSR) com protocolo claro
- ☐ **Auto-lesão** vs **ideação suicida** diferenciados onde aplicável
- ☐ Contatos de emergência presentes em todos os instrumentos com componente de risco
- ☐ Nenhuma orientação de "esperar" diante de red flag

### Anti-fabricação científica

- ☐ Nenhuma sensibilidade/especificidade que você **não consiga rastrear no abstract** do PMID citado
- ☐ Nenhum item específico do instrumento foi reproduzido (apenas descritos genericamente)
- ☐ Nenhuma sugestão de uso fora da faixa etária validada
- ☐ Versões antigas e novas (ex: MABC-2 vs MABC, BRIEF vs BRIEF-2, BASC-2 vs BASC-3) corretamente identificadas

---

## Decisões de produto pendentes

### Formato de ingestão no app
- ☐ Confirmar que o painel "📚 Evidência curada" no `escala.html` está visualmente alinhado com o resto da UI
- ☐ Verificar se o JSON `instruments.json` cobre **todos** os instrumentos que aparecem no filtro
- ☐ Decidir se as escalas autorais (com prefixo `fam-`) recebem painel próprio ou apenas as oficiais
- ☐ Avaliar se o painel deveria abrir **automaticamente** em escalas críticas (C-SSRS, ASQ)

### Cobertura futura (Fase 5+)
- ☐ Considerar incluir: ADOS-2, ADI-R, WISC-V, WPPSI-IV, Vineland-3
- ☐ Considerar instrumentos brasileiros: EDM Rosa Neto (declarar status de não-PubMed), ATA, IPCD
- ☐ Considerar instrumentos de comorbidade médica: PedsQL (qualidade de vida), Bristol Stool Scale, Pittsburgh Sleep Quality Index pediátrico

### Atualizações periódicas
- ☐ Definir cadência de revisão dos PMIDs (anual? por demanda?)
- ☐ Definir critério para incluir um novo instrumento (PMID obrigatório? Uso clínico mínimo?)
- ☐ Manter `version` no JSON atualizado a cada mudança

---

## Changelog de revisão clínica

| Data | Revisor | Versão revisada | Observações | Decisão |
|---|---|---|---|---|
| _____ | Dr. Jadson Fraga | v1.0 (curated-evidence/) | _____ | ⏳ Em revisão |

---

## Assinatura

**Eu, Dr. Jadson Fraga Araújo Júnior (CRM-PE 25227 · RQE 17756 — Neuropediatria), revisei** o conteúdo das curadorias `fase1-2-3.md` e `fase4.md`, aplicando os 7 critérios do Portão de Auditoria + critérios clínicos específicos, e:

- ☐ **Aprovo na íntegra** para uso no NeuroPed SDG
- ☐ **Aprovo com ressalvas** (listadas acima como ⚠️)
- ☐ **Requeresce revisão** antes de ir para produção

Data: _____ /_____ /2026

Assinatura: ____________________________

---

*Documento curatorial gerado conforme PROMPT SUPREMO v2.0 · Protocolo PubMed + Portão de Auditoria.*

*Soli Deo Gloria.*
