# Inventário visual NeuroPed — unificação premium

Este inventário consolida os assets premium reaproveitados na identidade atual, sem reiniciar a história visual do produto.

## Regra de ouro

1. Procurar asset já existente.
2. Avaliar reaproveitamento.
3. Modernizar com moldura, contraste, dark mode e micro branding.
4. Integrar ao fluxo principal.
5. Criar arte nova somente quando não houver equivalente reaproveitável.
6. Todo asset oficial deve constar em `visualAssetRegistry` e ser renderizado em `/qualidade`.
7. `npm run audit:assets` deve falhar se asset oficial sumir, estiver vazio, não estiver registrado ou não for auditável.

## Logo oficial

| Asset | Classificação | Uso definido |
| --- | --- | --- |
| `attached_assets/dr-jadson-logo.jpeg` — Escudo Dr. Jadson Fraga | A — premium e reutilizável | Logo mestre do ecossistema; também renderizado em `/qualidade` para provar carregamento do arquivo físico do repositório. |
| `attached_assets/neuroped-logo.webp` — símbolo histórico NeuroPed roxo | A — premium e reutilizável | Marca secundária/legado otimizada para a web; renderizada em `/qualidade` como asset histórico preservado. |

## Mascotes e personagens

| Asset | Classificação | Reaproveitamento |
| --- | --- | --- |
| `attached_assets/images/dr-jadson-logo-super.jpeg` | A — premium e reutilizável | Mascote principal de boas-vindas/home e estados vazios; renderizado em `/qualidade`. |
| `attached_assets/images/dr-jadson-consultorio-superman.jpeg` | A — premium e reutilizável | Recomendações, resultados de escalas e mensagens clínicas; renderizado em `/qualidade`. |
| `attached_assets/images/dr-jadson-arte.jpeg` | A — premium e reutilizável | Celebrações, conclusão de fluxos e exportações; renderizado em `/qualidade`. |
| `attached_assets/images/dr-jadson-selfie.jpeg` | B — aceitável | Estado vazio neutro e apoio humano pontual; renderizado em `/qualidade`. |
| `attached_assets/images/dr-jadson-consultorio-batman.jpeg` | B — aceitável | Uso pediátrico/superpoder pontual, sem visual gamer; renderizado em `/qualidade`. |
| `attached_assets/images/dr-jadson-consultorio-full.jpeg` | B — aceitável | Conteúdo institucional e sobre a clínica; renderizado em `/qualidade`. |

## Ilustrações, fundos e banners

| Asset | Classificação | Reaproveitamento |
| --- | --- | --- |
| `attached_assets/images/neural-abstract.webp` | A — premium e reutilizável | Hero institucional e fundos premium discretos; renderizado em `/qualidade`. |
| `attached_assets/images/hero-brain.webp` | A — premium e reutilizável | Login, splash secundário e clínica pediátrica; renderizado em `/qualidade`. |
| `attached_assets/images/child-assessment.webp` | A — premium e reutilizável | Onboarding, filtro clínico e telas vazias; renderizado em `/qualidade`. |
| `attached_assets/images/child-development.webp` | A — premium e reutilizável | Educação familiar e desenvolvimento; renderizado em `/qualidade`. |
| `attached_assets/images/mental-health-child.webp` | A — premium e reutilizável | Saúde mental pediátrica; renderizado em `/qualidade`. |
| `attached_assets/images/team-multiprofessional.webp` | A — premium e reutilizável | Fluxos multiprofissionais, PDFs e família; renderizado em `/qualidade`. |

## Componentes de unificação implementados

| Componente | Função |
| --- | --- |
| `BrandMark` | Aplica o escudo mestre com moldura premium, glow controlado e wordmark opcional. |
| `MiniShield` | Micro branding discreto em cards, navegação ativa e estados visuais. |
| `BrandWatermark` | Marca d'água suave para evitar telas genéricas. |
| `ClinicalBrandIcon` | Ícone clínico premium para ferramentas principais, sem excesso futurista/gamer. |
| `Mascote` | Reaproveita personagens premium em home, resultados, celebração e telas vazias. |
| `SafeAssetImage` | Renderiza imagem com fallback visual se houver falha de carregamento. |
| `visualAssetRegistry` | Registro único dos assets oficiais, com caminho, uso, status e rota de auditoria. |

## Auditoria viva

A rota pública `/qualidade` renderiza todos os assets oficiais usando `SafeAssetImage`. O painel mostra:

- total de imagens abertas;
- total de falhas;
- caminho de cada arquivo;
- uso previsto;
- status de cada asset.

## Auditoria de CI

O comando abaixo valida existência, tamanho, registro e renderização auditável:

```bash
npm run audit:assets
```

Esse comando foi ligado aos fluxos:

- `npm run verify`;
- workflow `Verify NeuroPed`;
- workflow `Deploy NeuroPed`;
- workflow `Deploy Cloudflare Pages`.

## Paleta consolidada

### Principal

- Vermelho institucional.
- Dourado.
- Azul petróleo profundo.
- Grafite.
- Branco.

### Secundária

- Roxo NeuroPed histórico.
- Teal clínico.
- Azul claro.
- Verde discreto.

## Diretrizes de aplicação

- O escudo Dr. Jadson Fraga é a identidade central.
- O símbolo roxo NeuroPed permanece preservado como patrimônio visual secundário.
- Mascotes premium devem aparecer em estados vazios, boas-vindas, resultados e conclusão de tarefas.
- O modo noturno continua prioritário: todo asset deve receber contraste por borda, sombra, overlay ou opacidade controlada.
- Evitar excesso de brilho, estética gamer ou futurista exagerada.
- Nenhuma imagem oficial deve ficar esquecida no repositório sem registro em `visualAssetRegistry` e sem renderização em `/qualidade`.
