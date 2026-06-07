## Resumo

Descreva objetivamente o que este PR altera.

## Tipo de mudança

- [ ] Correção de bug
- [ ] Melhoria de UI/UX
- [ ] Escala/questionário
- [ ] Documento/PDF
- [ ] Portal família
- [ ] Backend/API
- [ ] Segurança/LGPD
- [ ] PWA/deploy
- [ ] Documentação
- [ ] Migração de legado pré-React

## Checklist geral

- [ ] Não remove funcionalidade útil sem justificativa.
- [ ] Não duplica rota, menu ou seção já existente.
- [ ] Não altera lógica clínica sem critério de aceite.
- [ ] Não expõe dado sensível em localStorage.
- [ ] Não adiciona senha, chave, token ou segredo no frontend.
- [ ] Não transforma escala/teste em diagnóstico automático.
- [ ] Mantém aviso de que resultados exigem interpretação profissional quando aplicável.
- [ ] Mantém experiência mobile utilizável.

## Checklist para legado pré-React

Preencher se este PR reaproveita recurso do app antigo.

- [ ] Recurso legado identificado em `AUDITORIA_LEGADO_PRE_REACT.md`.
- [ ] Equivalente React atual verificado.
- [ ] Sem duplicidade de rota.
- [ ] Sem duplicidade de menu/sidebar.
- [ ] Sem mega merge de código antigo.
- [ ] Migração feita como componente/alteração isolada.
- [ ] Sem regressão visual evidente.
- [ ] Sem aumento desnecessário de bundle/assets.
- [ ] Sem área clínica exposta ao portal família.
- [ ] Recurso melhora valor clínico, operacional, visual ou documental.

## Testes executados

Marcar o que foi rodado.

- [ ] `npm run check`
- [ ] `npm run lint`
- [ ] `npm run validate:catalog`
- [ ] `npm run test:clinical`
- [ ] `npm run build`
- [ ] Teste manual mobile
- [ ] Teste manual desktop
- [ ] Teste de impressão/PDF, se aplicável
- [ ] Teste de rota pública vs rota clínica, se aplicável

## Evidência

Cole logs, prints, links de deploy ou resumo do teste manual.

## Riscos remanescentes

Descreva qualquer pendência conhecida. Não declarar pronto sem evidência.
