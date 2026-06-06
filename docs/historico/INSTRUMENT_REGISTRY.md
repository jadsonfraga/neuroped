# INSTRUMENT REGISTRY — NeuroPed SDG

**Última revisão:** 2026-05-28
**Versão do produto:** v5.1-truth-pass
**Responsável editorial:** Dr. Jadson Fraga Araújo Júnior (CRM-PE 25227, RQE 17756)

Este documento é a fonte única de verdade sobre os instrumentos clínicos disponibilizados pelo NeuroPed SDG.

---

## Esquema obrigatório (todos os instrumentos)

```
id                  — identificador interno (sem espaços)
sigla               — sigla canônica (NP-XXX para autorais, sigla oficial para clássicos)
title               — nome completo
domain              — domínio clínico (TEA, TDAH, Linguagem, etc.)
age_band            — faixa etária descritiva
age_min / age_max   — limites em meses
respondent          — quem responde (pais, professor, profissional, criança)
purpose             — finalidade clínica
n_items             — número de itens
response_type       — tipo de resposta (Likert, sim/não, frequência)
scoring             — método de pontuação
interpretation      — tabela de interpretação
validation_status   — autoral | normatizado | em revisão | descontinuado
license_status      — aberto | aberto com atribuição | licença comercial | sob negociação
source              — autor original / editora
language            — pt-BR (autoral) | pt-BR (oficial) | pt-BR (versão pesquisa)
app_status          — live | preview | catalogado · não aplicável | bloqueado
last_reviewed       — data ISO
notes               — observações clínicas
```

---

## Classificações permitidas

| Classificação | Uso no app | Aparece como aplicável? |
|---|---|---|
| Instrumento implementado e apto para uso | Pode ser aplicado pelo médico | Sim |
| Instrumento autoral estruturado | Pode ser usado em triagem familiar, com identificação correta | Sim |
| Instrumento catalogado, não implementado | Aparece somente como referência, sem botão "Aplicar" | Não |
| Licença necessária | Bloqueado até autorização formal documentada | Não |
| Em revisão clínica | Não utilizável em pacientes reais | Não |
| Descontinuado ou removido | Não aparece como ativo | Não |

---

## Inventário atual

### A. Instrumentos AUTORAIS APLICÁVEIS (15)

Conteúdo desenvolvido pelo Dr. Jadson Fraga, identificado como `autoral · não normatizado`. Uso aberto sob licença CC-BY-NC para fins educacionais e triagem operacional. Não substitui escala normatizada quando indicada.

| Sigla | Título | Faixa etária | Domínio | n itens | App status |
|---|---|---|---|---|---|
| NP-TEA-PREC | Primeiros Sinais TEA | 12–36 meses | TEA | 5 | live |
| NP-FALA-INI | Fala Inicial | 12–36 meses | Linguagem | 5 | live |
| NP-ALIM-SENS | Alimentação Sensorial | 12–36 meses | Alimentação | 5 | live |
| NP-SONO-12M | Sono do Pequeno | 12–36 meses | Sono | 5 | live |
| NP-SOC-12M | Brincar e Interesse Social | 12–36 meses | Social | 5 | live |
| NP-COMF-35 | Comunicação Funcional | 3–5 anos | Linguagem | 5 | live |
| NP-CRIS-35 | Crises e Frustração | 3–5 anos | Comportamento | 5 | live |
| NP-SENS-35 | Sensorial Diário | 3–5 anos | Sensorial | 5 | live |
| NP-AVD-35 | Autonomia Inicial | 3–5 anos | Autonomia | 5 | live |
| NP-FLEX-35 | Flexibilidade e Rotina | 3–5 anos | TEA | 5 | live |
| NP-ATEN-611 | Atenção em Casa | 6–11 anos | TDAH | 5 | live |
| NP-ORG-611 | Organização e Memória | 6–11 anos | Funções Executivas | 5 | live |
| NP-ANS-611 | Ansiedade Infantil | 6–11 anos | Ansiedade | 5 | live |
| NP-OPO-611 | Irritabilidade e Oposição | 6–11 anos | Comportamento | 5 | live |
| NP-SONO-611 | Sono Escolar | 6–11 anos | Sono | 5 | live |

**Scoring uniforme:** soma simples (0–2 por item). Score ÷ máximo → %.
**Interpretação uniforme:** Baixo <33% · Moderado 33–66% · Alto >66%. Sinalização operacional, não diagnóstica.

### B. Instrumentos CATALOGADOS (referência, não aplicáveis)

Instrumentos clínicos clássicos amplamente conhecidos. Aparecem no app **apenas como referência catalogada**, sem botão "Aplicar". Para aplicação real, é obrigatório:
1. Obter licença formal do autor/editora
2. Validar tradução pt-BR oficial
3. Realizar treinamento específico quando exigido
4. Implementar com itens reais, scoring e interpretação documentados
5. Submeter a revisão clínica

| Sigla | Título completo | Domínio | Idioma | Validação | Licença | App status |
|---|---|---|---|---|---|---|
| M-CHAT-R/F | Modified Checklist for Autism in Toddlers, Revised with Follow-up | TEA | pt-BR oficial | normatizado | requer autorização dos autores | catalogado |
| SNAP-IV | Swanson, Nolan, Pelham IV | TDAH | pt-BR versão pesquisa | amplamente utilizado | uso clínico requer cautela | catalogado |
| SRS-2 | Social Responsiveness Scale, 2nd ed. | TEA | pt-BR oficial WPS | normatizado | **licença comercial obrigatória (WPS)** | bloqueado |
| CBCL | Child Behavior Checklist | Comportamento amplo | pt-BR oficial | normatizado | **licença comercial obrigatória (ASEBA)** | bloqueado |
| GMFCS | Gross Motor Function Classification System | Motor | pt-BR oficial | normatizado | uso livre acadêmico (treinamento exigido) | catalogado |
| ASQ-3 | Ages and Stages Questionnaires, 3rd ed. | Desenvolvimento global | pt-BR oficial Brookes | normatizado | **licença comercial obrigatória** | bloqueado |
| Vineland-3 | Vineland Adaptive Behavior Scales, 3rd ed. | Comportamento adaptativo | pt-BR oficial Pearson | normatizado | **licença comercial obrigatória (Pearson)** | bloqueado |
| Conners-3 | Conners 3rd Edition | TDAH/Comportamento | pt-BR oficial | normatizado | **licença comercial obrigatória (MHS)** | bloqueado |

---

## Política de adição de novos instrumentos

Antes de qualquer commit que adicione um novo instrumento como `live`:

1. Preencher TODOS os campos do esquema acima
2. Validar perguntas com revisão clínica (Dr. Jadson como editor final)
3. Definir e documentar scoring e interpretação
4. Obter e arquivar documentação de licença quando exigida
5. Marcar `last_reviewed` com data ISO
6. Atualizar este documento

---

## Histórico de mudanças

| Data | Versão | Mudança | Responsável |
|---|---|---|---|
| 2026-05-28 | v5.1 | Remoção de 487 instrumentos sintéticos placeholders | Auditoria automatizada |
| 2026-05-28 | v5.1 | Reclassificação dos 8 instrumentos clássicos como catálogo | Auditoria automatizada |
| 2026-05-28 | v5.1 | Adição de campos estruturados (scoring, interpretation, license_status) | Auditoria automatizada |
| 2026-05-06 | v3.0 | Criação inicial dos 15 instrumentos autorais | Dr. Jadson Fraga |

---

## Anti-padrões proibidos

- ❌ Adicionar instrumento clássico sem licença formal arquivada
- ❌ Adicionar instrumento com perguntas genéricas / placeholders
- ❌ Marcar instrumento como `live` sem revisão clínica
- ❌ Inflar contagem total ("X instrumentos") incluindo bloqueados ou catalogados
- ❌ Anunciar publicamente "instrumentos normatizados" sem licença
- ❌ Aplicar instrumento sem registrar consentimento informado do responsável (após implementação de consent flow)
