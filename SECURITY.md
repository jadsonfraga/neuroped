# Política de Segurança — NeuroPed

Este repositório publica um aplicativo PWA estático via GitHub Pages.

## Escopo

Esta ferramenta tem caráter educacional e de apoio clínico. Ela não deve armazenar dados sensíveis de pacientes diretamente no frontend, no GitHub Pages, no `localStorage` ou em arquivos públicos do repositório.

## Dados sensíveis

Não incluir no repositório:

- senhas, PINs reais, tokens ou chaves privadas;
- CPF, RG, prontuários, laudos ou dados identificáveis de pacientes;
- credenciais de serviços externos;
- arquivos `.env`, `.env.local` ou equivalentes.

## Relato de vulnerabilidades

Caso encontre falha de segurança, segredo exposto ou comportamento indevido, não abra issue pública com detalhes sensíveis. Entre em contato diretamente com o mantenedor do projeto.

## Recomendações operacionais

- Usar Pull Requests antes de publicar alterações na branch `main`.
- Ativar proteção de branch para `main`.
- Não tratar PIN de frontend como autenticação forte.
- Para dados clínicos reais, usar backend seguro, banco com criptografia, autenticação individual e trilha de auditoria.
