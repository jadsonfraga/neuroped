# Contribuindo com o NeuroPed SDG

Obrigado pelo interesse em contribuir. Esta é uma ferramenta clínica de uso profissional, então as contribuições passam por critério mais rigoroso do que repositórios genéricos.

## Quem pode contribuir

- **Profissionais de saúde** com registro ativo no respectivo conselho, para revisão de conteúdo clínico
- **Desenvolvedores** convidados pelo titular do projeto
- **Pacientes/responsáveis** podem reportar problemas de UX e bugs via canal de contato

Pull requests externos não solicitados são revisados, mas o merge depende do alinhamento estratégico com o produto e da aprovação do CODEOWNER.

## Tipos de contribuição

### 1. Correção de conteúdo clínico

Contribuições de correção de escalas, doses, classificações ou referências bibliográficas devem incluir:

- Citação da fonte primária (PMID, DOI ou guideline oficial)
- Versão da escala
- Justificativa clínica
- Identificação do contribuidor (nome completo + registro profissional)

### 2. Correção de bugs

- Descrever passos para reproduzir
- Navegador, versão, sistema operacional
- Screenshot se aplicável
- Comportamento esperado vs observado

### 3. Melhorias de UX/visual

- Mockup ou descrição clara do problema
- Justificativa em termos de usabilidade clínica

### 4. Segurança

Use o canal privado descrito em [SECURITY.md](./SECURITY.md). **Não abra issue pública.**

## Regras técnicas

Todo PR precisa:

1. Passar pelo workflow de qualidade (lint, build, testes)
2. Manter cobertura mínima de testes em código clínico
3. Incluir JSDoc/TSDoc com `@clinical-source` em funções clínicas novas
4. Manter zero dependências CDN externas em runtime
5. Manter conformidade com paleta WarmMinimalism PANT (creme, teal, ouro, bordô, plum, dark)
6. Não introduzir bibliotecas com licenças incompatíveis (avaliar SPDX)

## Critérios de revisão

PRs serão avaliados por:

| Critério | Peso |
|----------|------|
| Correção clínica | Crítico |
| Segurança e LGPD | Crítico |
| Acessibilidade WCAG 2.2 AA | Alto |
| Performance (bundle size, Web Vitals) | Alto |
| Cobertura de testes | Médio |
| Coerência visual com PANT | Médio |
| Qualidade do código | Médio |

## Código de conduta

- Respeito mútuo
- Foco em fatos clínicos e técnicos
- Discordâncias resolvidas com referências, não com afirmação
- Confidencialidade absoluta sobre qualquer dado de paciente que apareça em logs ou screenshots compartilhados

## Canal de comunicação

Para dúvidas sobre processo de contribuição:

- WhatsApp: (87) 9 9109-7371
- GitHub: abrir issue marcando `@jadsonfraga`

---

Última atualização: 2026-05-07.
