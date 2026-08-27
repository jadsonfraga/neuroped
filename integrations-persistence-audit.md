# Auditoria de persistência das integrações

## Conclusão

As experiências que estavam agrupadas como sites relacionados ao Manus foram separadas entre **rotas internas do NeuroPed**, **microsite estático versionado** e **referências externas que não devem ser copiadas para dentro do aplicativo**.

## Destinos tratados

| Destino | Antes | Agora | Persistência |
| --- | --- | --- | --- |
| Secretaria IA | Aba no hub apontando para `/#/marcacao` | Mantida como rota interna | Código do NeuroPed |
| Missão Saúde | Aba no hub apontando para `/#/missao-saude` | Mantida como rota interna | Código do NeuroPed |
| Nesplora | Acesso estático com tratamento de “externo” | Incluída no hub como experiência incorporada | `client/public/nesplora`, com JavaScript, CSS e mídia versionados |
| Página institucional | Fallback para `VITE_MANUS_INSTITUCIONAL_URL` e domínio `manus.space` | Usa `/#/sobre-neuroped` | Código e rota do NeuroPed |

## Proteções adicionadas

O HTML da Nesplora publicado no repositório não chama Google Fonts, `manus-analytics.com`, `manus.space`, `manus-runtime` ou `debug-collector`. O sincronizador também remove essas tags quando uma nova versão do microsite é importada, para evitar regressão futura.

Foi criado o comando `npm run audit:integrations`. Ele verifica HTML, bundles JavaScript/CSS, assets, documentação, navegação e a ausência da URL institucional Manus. O smoke test `npm run test:integrations` abre o hub no Chromium e confirma as quatro abas: Secretaria, Jogo, Nesplora e Institucional.

## Links que permanecem externos por desenho

Links para PubMed, validação oficial do ITI, WhatsApp, e-mail, telefone e fontes documentais continuam externos porque são serviços de autoridade, comunicação ou referência. Eles não são dependências de runtime do Manus e não devem ser falsificados ou clonados dentro do NeuroPed.

A incorporação de conteúdo de terceiros deve continuar condicionada à licença ou autorização correspondente. O código desta rodada tornou persistente o que pertence ao próprio produto e retirou a dependência Manus das experiências incorporadas sem copiar silenciosamente sites proprietários.

## Validações

- Auditoria persistente: **13/13 verificações aprovadas**.
- Smoke test do hub: **4/4 abas ativas**, sem erros de página.
- Auditoria de navegação: aprovada.
- Divisão público/clínico: **30 rotas públicas exatas** e **27 rotas sensíveis protegidas**.
- Lint dos arquivos alterados: aprovado.
- Build do cliente: aprovado.
