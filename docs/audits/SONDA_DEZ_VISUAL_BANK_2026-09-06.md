# Sonda Dez — banco visual integrado

Data: 06/09/2026

## Objetivo

Manter dentro da rota canônica `/testes-diretos` os estímulos visuais necessários à aplicação cotidiana da Sonda Dez, sem depender de busca externa, impressão, CDN ou imagens remotas.

## Implementação

A rota carrega `client/src/pages/sonda-dez-daily.tsx`, que preserva o núcleo clínico existente em `client/src/pages/testes-diretos.tsx` e adiciona um banco visual autoral em SVG/HTML. O material abre em tela cheia para a criança e é organizado pelas seis faixas etárias.

## Conteúdo visual

Inclui objetos/conceitos, cenas narrativas, cena social ambígua, sequências de atenção, SOL/LUA, modelo de seis blocos, grade de cancelamento, DIA/NOITE, rotina e imprevisto, mensagem visualizada sem resposta, grade de símbolos/letras, DIREITA/ESQUERDA, nomeação seriada, reta numérica 0–100, leitura de um minuto e planejamento executivo.

## Segurança e operação

- sem URL externa, CDN ou download em tempo de aplicação;
- sem nova persistência clínica ou localStorage;
- sem escore normativo, percentil, ponto de corte ou diagnóstico automático;
- objetos físicos continuam preferidos nas tarefas em que a manipulação faz parte da observação; o apoio visual infantil é contingência, não substituição automática;
- `scripts/guards/audit-inventory.mjs` registra explicitamente que `testes-diretos.tsx` permanece como núcleo interno da rota composta pelo wrapper diário;
- as cores vetoriais do novo banco usam HSL, sem aumentar o contador de cores cruas protegido por `audit:design`.

## Reconciliação pré-publicação

O gate integral de acessibilidade identificou um `main` duplicado em `/#/especialidades`, superfície já presente no `main` de base e não pertencente ao banco visual. A própria branch de publicação removeu apenas o landmark interno redundante dessa tela, preservando seu conteúdo e permitindo que a auditoria global valide novamente todas as rotas antes do merge.

## Critério de publicação

Somente considerar o banco visual disponível para uso diário após os checks obrigatórios do PR e os workflows oficiais de produção no SHA mesclado.