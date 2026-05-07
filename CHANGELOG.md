# NeuroPed EDJ v3.1

## Alterações principais

- Removidos metadados e rastros de gerador externo do arquivo principal.
- Removidas fontes externas e dependências de CDN no runtime do app v3.1.
- Corrigido `theme-color` para `#1a6b65`.
- Corrigido `manifest.json` para identidade WarmMinimalism.
- Atualizado `sw.js` com versionamento `neuroped-edj-v3.1.0`.
- Implementada camada LGPD com criptografia local AES-GCM.
- Implementado fluxo de PIN robusto com PBKDF2 100000 iterações.
- Criada estrutura funcional de 6 áreas clínicas: Pacientes, Cadastrar, Paciente, Alertas, Relatórios e Config.
- Implementados registros longitudinais para VB-MAPP, Vineland-3, ADOS-2, ABLLS-R, Mullen e CARS-2 sem reprodução de itens protegidos.
- Criado módulo de prescrição educacional com 8 campos e disclaimer regulatório.
- Criado motor de teto terapêutico por idade e nível DSM-5-TR.
- Criado módulo de documentação interna.
- Criado relatório imprimível com SHA-256 do payload do paciente.
- Criado `validation_report.json`.

## Segurança

- Sem dados clínicos novos em texto puro.
- Sem analytics.
- Sem chamadas externas em runtime pelo app v3.1.
- Sem PIN hardcoded.
- Storage principal restrito à chave `neuroped_edj_v3`.

## Deploy

Compatível com GitHub Pages. Para publicar, usar a branch final mesclada em `main` e configurar Pages para servir a raiz do repositório.
