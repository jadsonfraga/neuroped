# Auditoria de imagens e zoom — NeuroPed

## Objetivo

Reduzir cortes, zoom involuntário e quebras visuais em logos, mascotes e painéis do app, sem redesenhar a interface e sem alterar conteúdo clínico.

## Achados

1. Componentes de marca usavam `object-cover` em assets que funcionam melhor com `object-contain`, especialmente escudos e logos.
2. Alguns blocos renderizavam `<img>` diretamente, sem fallback visual em caso de falha de carregamento.
3. Mascotes misturavam imagens de natureza diferente: alguns são ilustrações que não devem cortar; outros são fotos/contexto, onde `object-cover` é aceitável.
4. O CSS global já protege imagens com `max-width: 100%`, `height: auto`, `display: block` e `object-fit: contain`; a correção fina precisava acontecer nos componentes que forçam altura/largura.

## Correções aplicadas

- Criado `SafeImage` para fallback visual estável quando o asset falha.
- `BrandMark` passou de `object-cover` para `object-contain`, preservando o escudo/logomarca sem corte.
- `BrandWatermark` passou a usar fallback seguro.
- `Mascote` passou a ter regra de enquadramento por contexto:
  - `contain` para mascotes/arte/logos que não devem cortar;
  - `cover` apenas para imagens fotográficas/contextuais.
- `PremiumVisualPanel` passou a usar imagem segura com fallback.
- `Onboarding` passou a preservar ilustrações com `object-contain`, evitando zoom/corte no mobile.

## Regra daqui para frente

- Logos, escudos, QR codes, documentos, ilustrações clínicas e mascotes de corpo inteiro: `object-contain`.
- Banners abstratos, fundos decorativos e fotos de ambiente: `object-cover`, sempre dentro de container com proporção explícita.
- Toda imagem institucional nova deve usar `SafeImage` ou componente equivalente.

## Verificação recomendada

Rodar:

```bash
npm run check
npm run build:client
npm run audit:lighthouse
```

Depois conferir manualmente:

- Home
- Tela de bloqueio clínico
- Onboarding
- Portal família
- Sobre
- Páginas com painéis premium
- Instalação PWA em tela inicial
