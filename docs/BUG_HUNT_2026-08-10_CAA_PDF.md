# Bug hunt — CAA e PDFs clínicos

Data: 10 de agosto de 2026

## Corrigido: CAA perdia personalização após reload

A workspace `caa:workspace:v3` usava o mesmo `secureStorage` dos rascunhos clínicos. Esse cofre usa chave AES-GCM efêmera em memória por desenho; portanto, recarregar a página invalida a chave. Para rascunhos clínicos isso é uma proteção deliberada, mas para uma prancha de CAA configurável contradizia a função de salvar/personalizar.

Correção: somente a workspace da CAA passa a usar IndexedDB cifrado com AES-GCM e `CryptoKey` não exportável persistido via structured clone. Não existe fallback para `localStorage`/`sessionStorage` em texto puro. `secureClearAll()` continua destruindo também esse cofre em logout/troca de conta. Todos os demais rascunhos permanecem efêmeros.

## Corrigido: token longo podia ultrapassar margem do PDF

O `wrap()` do construtor de documentos quebrava apenas em espaços. URL de validação, hash, identificador ou texto importado sem espaços podia exceder a largura A4 e vazar visualmente para fora da área editorial.

Correção: tokens maiores que a largura são divididos por medida real da fonte, sem truncar caracteres. Testes travam URLs e hashes longos dentro do limite.

## Deliberadamente não alterado

- assinatura PFX/P12 e validação CAdES;
- conteúdo clínico, doses, scoring e catálogo de escalas;
- autenticação/ownership do backend;
- semântica efêmera de pré-consulta, escalas e demais rascunhos;
- limites de Lighthouse, acessibilidade, bundle ou segurança.
