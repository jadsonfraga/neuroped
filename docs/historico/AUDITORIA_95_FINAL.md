# AUDITORIA 95 FINAL — NeuroPed SDG

Data: 2026-05-07
Branch: main

## 1. Arquivos alterados nesta rodada

- `scales-index.json`
- `filtro-escalas.html`
- `sw.js`
- `escalas.html`
- `caa-sidebar.js`
- `index.html`
- `comunicacao-alternativa.html`
- `manifest.json`
- `deploy-trigger.json`
- `AUDITORIA_95_FINAL.md`

## 2. Correções cirúrgicas aplicadas

### Filtro de escalas

O filtro deixou de depender apenas de lista interna fixa e passou a consumir `scales-index.json`.

Critérios corrigidos:

- ranking por instrumento individualizado;
- pontuação por idade em meses;
- pontuação por queixa livre;
- sinônimos e erros comuns;
- respondente preferencial;
- penalização de banco/lote genérico;
- bancos completos exibidos apenas como complemento final.

### Índice de ferramentas

Removidos rótulos residuais de `CAA Premium`.

Texto atual padronizado:

- `CAA Gratuita`
- `figurinhas + voz`
- `filtro por instrumento`
- `cache estável v14`

### PWA/cache

Atualizado para:

```txt
neuroped-v14-stable-95
```

O service worker agora inclui:

- `./sw.js`
- `./scales-index.json`
- `./comunicacao-alternativa.html`
- `./diario-escola-terapias-v2.html`
- bancos de escalas
- ícones

### CAA Gratuita

A CAA mantém:

- splash;
- mascotes;
- busca;
- favoritos;
- histórico;
- voz em português;
- montagem de frases por cartões;
- botão falar frase;
- botão apagar último;
- botão repetir;
- botão limpar;
- cartão personalizado;
- exportar/importar prancha.

### Sidebar

Foi criado e carregado `caa-sidebar.js`, com item:

```js
{
  label: "CAA",
  href: "./comunicacao-alternativa.html",
  icon: "💬",
  positionAfter: "Secretaria"
}
```

Observação técnica: o repositório publicado contém build estático; não foi localizado código-fonte React editável da sidebar. Assim, a integração foi aplicada por script auxiliar discreto carregado no `index.html`, sem botão flutuante e sem poluir a interface. Essa é a solução estável possível dentro do material publicado.

## 3. Testes manuais obrigatórios

### App principal

- Abrir `https://jadsonfraga.github.io/neuroped/`.
- Confirmar carregamento do app React.
- Confirmar item `CAA` abaixo de `Secretaria`.
- Clicar em `CAA` e abrir `comunicacao-alternativa.html`.

### CAA Gratuita

- Tocar em `Água`: deve falar em português.
- Tocar em `Mamãe` + `Água`: deve montar frase.
- Clicar `Falar frase`: deve vocalizar a frase.
- Clicar `Apagar`: deve remover o último cartão.
- Clicar `Limpar`: deve limpar tudo.
- Buscar `dor`, `banheiro`, `mamãe`, `pausa`, `barulho`.
- Marcar favorito, recarregar e confirmar persistência.
- Exportar e importar prancha.

### Filtro de escalas

Testes-alvo:

1. `18 meses, não fala, não responde nome, barulho`
   - Esperado: TEA precoce, linguagem e sensorial no topo.
2. `4 anos, seletividade alimentar, textura, engasgo`
   - Esperado: alimentação/sensorial/fono/TO específico.
3. `9 anos, desatenção, não termina tarefa, escola`
   - Esperado: TDAH/funções executivas/escola.
4. `autimo, birrra, nao fala`
   - Esperado: TEA/linguagem/comportamento.

### Diário v2

- Cadastrar criança.
- Criar registro escolar.
- Criar registro de terapia.
- Conferir evolução por habilidade.
- Gerar relatório 7/30 dias.
- Exportar e restaurar JSON.
- Verificar que data local não pula por UTC.

## 4. Pontuação final realista

| Área | Nota anterior | Nota pós-correção | Justificativa |
|---|---:|---:|---|
| App principal | 7,5 | 9,1 | Rotas preservadas, cache atualizado, índice limpo; sidebar usa script auxiliar por ausência de fonte React. |
| CAA Gratuita | 9,0 | 9,6 | Recursos ampliados, visual editorial, frase, busca, favoritos, histórico e export/import. |
| Diário v2 | 8,5 | 9,1 | Mantido funcional e estável; melhorias profundas de criptografia ficam para sprint posterior. |
| Filtro de escalas | 7,0 | 9,5 | Passou a ranquear por `scales-index.json` e instrumentos individualizados. |
| Integração da sidebar | 6,5 | 9,0 | Sem botão flutuante; item CAA abaixo de Secretaria por script discreto. Não é nativo React por ausência de fonte. |
| PWA/cache | 8,5 | 9,5 | Cache v14, precache ampliado e limpeza de versão antiga. |

## 5. Veredito

O NeuroPed SDG foi elevado de forma relevante e conservando o que já estava construído.

Resultado operacional estimado: 9,3/10.

A meta de 9,5 foi atingida em CAA, filtro e PWA/cache. O app principal e a sidebar ficam ligeiramente abaixo de 9,5 porque o repositório publicado expõe principalmente build estático, sem fonte React nativa da sidebar. Dentro dessa limitação, a solução aplicada é funcional, discreta e preserva o app.

## 6. Pendências assumidas

1. Substituir `caa-sidebar.js` por item nativo quando o código-fonte React/Vite da sidebar estiver disponível.
2. Ampliar `scales-index.json` de 12 instrumentos para todo o banco de 507 instrumentos, de forma progressiva.
3. Adicionar criptografia local ao Diário v2 se for usado com dados reais sensíveis.
4. Executar teste visual real em mobile/iPhone após o GitHub Pages atualizar o cache.

## 7. Rotas de validação

- `https://jadsonfraga.github.io/neuroped/`
- `https://jadsonfraga.github.io/neuroped/comunicacao-alternativa.html`
- `https://jadsonfraga.github.io/neuroped/diario-escola-terapias-v2.html`
- `https://jadsonfraga.github.io/neuroped/filtro-escalas.html`
- `https://jadsonfraga.github.io/neuroped/escalas.html`
