# Dez medidas de evolução das integrações

## Estado atual

O NeuroPed agora possui um hub único de experiências incorporadas, com cinco destinos locais ou versionados: Secretaria IA, Missão Saúde, Nesplora, Vídeo-EEG domiciliar e Página institucional.

## Medidas executadas

1. **Manifesto único.** Criado `client/src/data/integrations.ts` como fonte declarativa de nomes, rotas, proprietário, superfície e persistência.
2. **Hub ampliado.** A rota `/manus` continua compatível, mas a interface agora se apresenta como “Experiências dentro do NeuroPed”.
3. **Vídeo-EEG incorporado.** O serviço interno `/#/eletroencefalograma` passou a aparecer como aba própria no hub.
4. **Classificação visual.** Cada aba informa se é “Rota interna” ou “Microsite local” e se usa “Código versionado” ou “Assets versionados”.
5. **Métricas operacionais.** O hub apresenta contagem de experiências, rotas internas, microsites locais e dependências Manus no runtime.
6. **Caminho copiável.** A experiência ativa possui ação para copiar o caminho completo local, reduzindo dependência de lembrar URLs.
7. **Institucional internalizado.** O fallback para `manus.space` e `VITE_MANUS_INSTITUCIONAL_URL` foi removido; a aba usa `/#/sobre-neuroped`.
8. **Nesplora autocontida.** O HTML local não chama Google Fonts ou `manus-analytics.com`; bundles e mídias permanecem versionados.
9. **Sincronização protegida.** `scripts/sync-nesplora-static.mjs` remove dependências externas proibidas sempre que o microsite for atualizado.
10. **Qualidade automatizada.** Criados `npm run audit:integrations` e `npm run test:integrations`, além de contratos de navegação e divisão público/clínico.

## Evidência

- Auditoria persistente: **13/13 verificações aprovadas**.
- Smoke test de navegador: **5/5 abas ativas**, sem erros de página.
- Navegação: aprovada.
- Divisão público/clínico: **30 rotas públicas exatas** e **27 rotas sensíveis protegidas**.
- Lint direcionado: aprovado.
- Build do cliente: aprovado.

## Limites intencionais

PubMed, ITI, WhatsApp, e-mail, telefone, Google Drive e referências institucionais continuam externos por serem fontes, autoridades ou protocolos de comunicação. Eles não são runtime Manus nem experiências incorporadas e não devem ser falsificados ou copiados para dentro do produto sem autorização.
