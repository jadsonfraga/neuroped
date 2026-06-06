# Compliance LGPD — NeuroPed

## Problema

Ferramentas clínicas digitais precisam explicar finalidade, limites, armazenamento, exclusão, exportação e responsabilidade profissional de forma visível.

## Solução aplicada

- Rodapé global inclui Política de Privacidade, Termos de Uso, Consentimento LGPD e Aviso clínico.
- Tela de pacientes exibe aviso sobre responsabilidade profissional, PIN, consentimento e backup.
- Service worker mantém APIs clínicas fora de cache.

## Arquivos alterados

- `client/src/components/Layout.tsx`
- `client/src/pages/pacientes.tsx`
- `client/public/sw.js`
- `client/public/offline.html`

## Critério de aceitação

- Usuário encontra links legais em qualquer tela.
- Dados clínicos não são cacheados pelo service worker.
- Ações destrutivas continuam exigindo confirmação.

## Evidência

- Rodapé legal global implementado.
- Comentário LGPD preservado/atualizado no service worker.
- Confirmação de exclusão já existente mantida em pacientes.

## Pendências honestas

- Revisão jurídica formal não foi realizada.
- Política/termos HTML existentes devem ser revisados por advogado antes de uso comercial amplo.
- Backup/importação em lote precisa integração de backend antes de ser habilitado.
