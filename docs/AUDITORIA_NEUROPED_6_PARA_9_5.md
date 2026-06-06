# Auditoria NeuroPed 6,0 → 9,5 real

Data: 2026-06-06.

## Problema

A auditoria inicial confirmou alto volume funcional, mas com risco de sobrecarga: home com muitos atalhos secundários, filtro com lógica útil porém pouco apresentado como fluxo clínico, navegação lateral longa, confiança legal pouco visível no rodapé e evidência PWA/documental dispersa.

## Solução aplicada

- Home reorganizada com quatro CTAs dominantes: encontrar escala, aplicar teste, meus pacientes e calculadora de doses.
- Acesso secundário agrupado em Ferramentas rápidas, Biblioteca e Referência.
- Filtro Inteligente convertido visualmente em fluxo de 5 etapas: idade, queixa, objetivo, contexto e sugestões.
- Menu lateral convertido em grupos recolhíveis para reduzir lista contínua.
- Rodapé global com links visíveis para privacidade, termos, consentimento LGPD e aviso clínico.
- Service worker atualizado para versão v6 com página offline explícita.

## Arquivos alterados

- `client/src/pages/home.tsx`
- `client/src/pages/filtro.tsx`
- `client/src/components/Layout.tsx`
- `client/src/pages/pacientes.tsx`
- `client/public/sw.js`
- `client/public/offline.html`
- `docs/*9_5*.md` e documentação correlata desta entrega.

## Critério de aceitação

- Home com no máximo quatro CTAs dominantes.
- Busca e filtro visíveis como instrumentos centrais.
- Menu lateral colapsável/recolhível por categoria.
- Avisos legais visíveis sem depender de conhecimento prévio do usuário.
- Offline comunica limites e evita cache de dados clínicos.

## Evidência

- Implementação em código nos arquivos acima.
- `npm run check` executado.
- `npm run build:client` executado.
- `npm run validate:catalog` executado.

## Pendências honestas

- Não foi possível garantir nota 9,5 real apenas com esta iteração porque auditorias Lighthouse/E2E completas e screenshots comparativos exigem ambiente de browser/produção estável.
- Exportação/importação em lote de pacientes permanece marcada como pendente na UI.
- Escalas legadas ainda variam em profundidade de instrução clínica por página.
