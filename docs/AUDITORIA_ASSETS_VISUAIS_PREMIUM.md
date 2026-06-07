# Auditoria visual de assets premium — NeuroPed

## Objetivo

Reaproveitar imagens e artes existentes sem piorar a experiência visual. A regra é usar cada arte com função clara: hero discreto, estado vazio, apoio familiar, contexto clínico, marca d'água ou card editorial.

## Regra de trava visual

- Não inserir imagem decorativa sem função.
- Não aumentar poluição visual.
- Usar opacidade, borda, overlay e recorte arredondado.
- Evitar excesso de mascotes na mesma tela.
- Preferir 1 imagem forte por tela ou marca d'água muito discreta.
- Preservar aparência atual do app.

## Mapa funcional dos assets

| Asset | Função premium definida |
|---|---|
| Escudo Dr. Jadson Fraga | Logo mestre, favicon, desbloqueio, marca principal e watermark. |
| NeuroPed roxo legado | Selo secundário/histórico, nunca competir com o escudo. |
| Dr. Jadson SuperNeuroPed | Home, boas-vindas e estados vazios. |
| Dr. Jadson consultório Superman | Recomendações clínicas, resultados e mensagens de consulta. |
| Dr. Jadson Arte | Conclusão de fluxos, celebração e exportações. |
| Dr. Jadson selfie | Humanização pontual e página Sobre. |
| Consultório Batman | Conteúdo pediátrico e lúdico, com uso restrito. |
| Consultório full | Sobre/estrutura da clínica e contexto institucional. |
| Neural abstract | Hero institucional e fundos premium discretos. |
| Hero brain | Bloqueio/login, referência clínica e neurociência. |
| Child assessment | Filtro clínico, pré-consulta e triagem. |
| Child development | Portal dos pais, orientação parental e marcos do desenvolvimento. |
| Mental health child | Saúde mental, ansiedade, humor e comportamento. |
| Team multiprofessional | Avaliação multiprofissional, plano terapêutico e família/escola. |

## Implementação sugerida

1. Centralizar imports em `BrandAssets.tsx`.
2. Usar `brandAssets.illustrations.*` e `brandAssets.mascots.*` em telas específicas.
3. Evitar imagens em páginas muito densas, exceto como thumbnail lateral ou watermark.
4. Validar mobile antes de considerar concluído.
