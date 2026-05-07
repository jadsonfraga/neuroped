# Public Safety Review — NeuroPed EDJ

> Checklist de curadoria aplicado a cada conteúdo antes de ser exposto na camada pública.
> Apenas conteúdo com **todas as respostas seguras** pode permanecer público.

---

## Como usar

Para cada módulo, rota ou bloco de conteúdo candidato a ficar público, responder honestamente:

### Checklist obrigatório

| # | Pergunta | Resposta segura |
|---|----------|-----------------|
| 1 | Conteúdo tem dado identificável (nome, CPF, data de nascimento, foto, endereço)? | **Não** |
| 2 | Simula consulta individual ou avaliação personalizada? | **Não** |
| 3 | Parece diagnóstico ou afirma classificação clínica fechada? | **Não** |
| 4 | Parece prescrição (medicamento + dose + posologia)? | **Não** |
| 5 | Usa escala proprietária reproduzida na íntegra (itens completos, score normativo)? | **Não** |
| 6 | Exibe laudo, receita, relatório ou documento real de paciente? | **Não** |
| 7 | Pode gerar crítica de propaganda médica indevida (CFM)? | **Não** |
| 8 | Pode gerar crítica LGPD (dado sensível sem base legal explícita)? | **Não** |
| 9 | Pode ser entendido como promessa terapêutica ou cura? | **Não** |
| 10 | Tem aviso educativo suficiente e visível? | **Sim** |

---

## Critério de aprovação

- **Aprovado para público**: 9 perguntas com "Não" + pergunta 10 com "Sim"
- **Reprovado para público**: qualquer pergunta de 1 a 9 com "Sim", ou pergunta 10 com "Não"
- **Status intermediário (revisão)**: dúvida em qualquer pergunta exige nova revisão tripla (jurídica, médica, reputacional)

---

## Aviso padrão obrigatório nos módulos públicos

> **Conteúdo educativo. Não substitui consulta médica, avaliação individualizada, diagnóstico clínico, prescrição ou acompanhamento com profissional habilitado.**

Diretrizes de aplicação:

- Sem tom alarmista
- Sem poluição visual
- Sem emojis em excesso (máximo um, se necessário)
- Posição: rodapé do módulo ou início discreto
- Estilo: tipografia secundária, cor de texto suave (não destacada)

---

## Aplicação por módulo (referência)

### Aprovados para camada pública

| Módulo | Status checklist | Aviso aplicado? |
|--------|-----------------|-----------------|
| Home institucional | OK | Sim — rodapé |
| CAA Premium (comunicação alternativa) | OK | Sim — onboarding |
| Biblioteca educativa | OK | Sim — rodapé |
| Guias para famílias | OK | Sim — topo |
| Guias escolares gerais | OK | Sim — topo |
| Metadados de escalas (sem itens) | OK | Sim — em cada escala |
| Filtro orientativo de escalas | OK | Sim — saída |
| Marcos do desenvolvimento | OK | Sim — rodapé |
| Glossário neuropediátrico | OK | Sim — header |
| Preparo para consulta | OK | Sim — topo |
| Testes lúdicos sem diagnóstico | OK | Sim — em cada teste |
| Diário local educativo | OK | Sim — rodapé |

### Restritos da camada pública

| Módulo | Razão | Status |
|--------|-------|--------|
| Pacientes | Dados identificáveis | Oculto do menu, guard em rota direta |
| Paciente/:id | Dados identificáveis | Oculto, guard |
| Prontuário | Documento clínico | Oculto, guard |
| Prescrição / Receita Eletrônica | Prescrição médica | Oculto, guard |
| Calculadora de Dose | Risco clínico se usado por leigo | Oculto, guard |
| Farmacologia clínica | Risco clínico/legal | Oculto, guard |
| Laudos | Documento médico | Oculto, guard |
| Relatórios com aparência médica | Documento médico | Oculto, guard |
| Portal Família — documentos reais | Dados identificáveis | Restrito (somente educativo público) |
| Agenda clínica real | Dados identificáveis | Oculto, guard |
| Lembretes clínicos | Dados de saúde | Oculto, guard |
| Escalas proprietárias completas | Direito autoral + risco diagnóstico | Apenas metadados expostos |
| Diagnóstico automático | Não compatível com prática médica | Removido — apenas orientação |

---

## Tela de guard padrão (rota sensível acessada na versão pública)

**Título:** Área profissional restrita

**Texto:**
> Este módulo envolve dados clínicos, documentos médicos, prescrição, prontuário ou informações identificáveis. Por segurança, ele não fica disponível na camada pública do NeuroPed EDJ.

**Botões:**
- Voltar ao início
- Abrir conteúdos educativos

**Comportamento esperado:**
- Não pedir PIN
- Não pedir senha
- Não exibir nenhum dado clínico ou de paciente
- Não revelar a estrutura interna de tabelas ou rotas

---

## Linguagem proibida na camada pública

Termos que **nunca** podem aparecer em conteúdo público:

- "diagnóstico provável"
- "fechou TEA"
- "fechou TDAH"
- "precisa de medicação"
- "precisa de laudo"
- "conduta médica"
- "dose recomendada"
- "prescrição automática"
- "laudo automático"
- "CPF é usado como login e senha"
- "senha é o CPF"
- "CPF da criança (login no Portal)"

Termos preferidos:

- "domínios a investigar"
- "instrumentos que costumam ser usados por profissionais"
- "informantes úteis"
- "próximo passo sugerido: avaliação profissional"
- "observação"
- "atividade"
- "habilidade explorada"
- "sinal para discutir com profissional"
- "área profissional restrita"

---

## QA obrigatório antes de cada release público

Comando de busca (executar do diretório raiz):

```bash
grep -RIE "CPF é usado como login e senha|senha é o CPF|diagnóstico provável|fechou TEA|fechou TDAH|dose recomendada|prescrição automática|laudo automático" --include="*.html" --include="*.js" --include="*.css" --include="*.json" .
```

Saída esperada: **vazia** ou apenas em arquivos de documentação que estão **citando** os termos como exemplos negativos (como este próprio arquivo).

---

## Revisão tripla a cada release

Cada conteúdo novo passa por três revisões antes de ir ao público:

1. **Risco jurídico e LGPD** — Há dado pessoal? Há base legal documentada? Há possibilidade de violação de propaganda médica (CFM)?
2. **Risco médico-assistencial** — A informação pode levar a decisão clínica errada se interpretada por leigo? Substitui consulta?
3. **Risco reputacional, autoral e interpretação por leigos** — Há reprodução de obra de terceiro? Pode ser entendido como promessa? Pode ser tirado de contexto em redes sociais?

---

## Histórico de revisões

| Data | Conteúdo revisado | Decisão | Revisor |
|------|-------------------|---------|---------|
| 07/05/2026 | Aplicação inicial do framework safe-public-layer | Aprovado | Dr. Jadson Fraga |

---

*Este documento é mantido pelo CODEOWNER do projeto. Atualização obrigatória a cada nova rota pública ou alteração de conteúdo público existente.*
