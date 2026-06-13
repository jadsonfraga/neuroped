# CORE 9 — Gate, Home, Menu e Filtro

Data: 2026-06-07

## Objetivo

Refatorar o nucleo inicial do NeuroPed para um padrao de app medico premium, com foco em entrada protegida, decisao clinica guiada, navegacao em camadas e filtro com saida obrigatoria.

## Arquivos alterados

| Arquivo | Tipo de alteracao | Estado |
| --- | --- | --- |
| `client/src/main.tsx` | `PasswordGate` global antes de renderizar o app | Funcional por revisao de codigo |
| `client/src/components/PasswordGate.tsx` | Hash SHA-256 mestre, sessao via `sessionStorage`, visual premium | Funcional por revisao de codigo |
| `client/src/pages/home.tsx` | Home substituida por cockpit clinico com exatamente 5 fluxos | Funcional por revisao de codigo |
| `client/src/data/navigation.ts` | Menu reorganizado em camadas clinicas recolhiveis | Funcional por revisao de codigo |
| `client/src/pages/filtro.tsx` | Ranking obrigatorio: Ouro, Prata, Bronze, Teste Direto, Questionario Escolar | Funcional por revisao de codigo |
| `client/src/components/BrandAssets.tsx` | Modulo visual institucional reaproveitado na tela de acesso/home | Funcional por revisao de codigo |
| `ASSET_INVENTORY.md` | Inventario visual do ecossistema NeuroPed | Funcional por documentacao |

## Decisoes tecnicas

### 1. Bloqueio inicial antes de qualquer rota

Historico legado: esta revisao introduziu um bloqueio local por hash no navegador.

Status atual: o fluxo foi desativado em 2026-06-13. Areas clinicas com dados reais devem depender de login nominal e autorizacao server-side no backend oficial. Hashes antigos de PIN foram removidos do checkout atual e devem ser tratados como comprometidos no historico Git.

### 2. Home como painel clinico de decisao

A home deixou de funcionar como hub longo de cards e passou a trabalhar como cockpit com cinco fluxos principais:

1. Avaliar crianca / Aplicar escala
2. Encontrar escala ideal
3. Pacientes e prontuario
4. Documentos medicos / PANT / Receita C1
5. Evolucao clinica / acompanhamento

Cada fluxo contem titulo, subtitulo, acao primaria, tipo de uso e icone semantico. Mascote e assets institucionais foram preservados com uso discreto.

### 3. Menu em camadas recolhiveis

A fonte de navegacao (`navigation.ts`) foi reorganizada em camadas clinicas:

- Inicio
- Fluxo clinico
- Escalas
- Pacientes
- Documentos
- Medicamentos
- Ferramentas clinicas
- Configuracoes / Ajuda

Rotas uteis foram preservadas e redistribuidas em grupos. A paleta de comandos continua usando `navigablePages` derivado desses grupos.

### 4. Filtro Clinico Inteligente

A tela do filtro foi simplificada e passou a garantir sempre cinco blocos quando houver busca, idade ou queixa:

- Ouro
- Prata
- Bronze
- Teste Direto
- Questionario Escolar

A logica nao inventa pontuacao clinica: ela usa correspondencia por texto, queixa, idade, respondente, prioridade e disponibilidade de rota (`appRoute`). Quando nao ha escala perfeita, a interface declara aproximacao e mostra estado real.

## Impacto clinico esperado

- Reduz entrada acidental em rotas sem desbloqueio.
- Melhora a primeira decisao do medico ao abrir o app.
- Diminui carga cognitiva da home.
- Torna o filtro previsivel para uso em consulta.
- Evita promessa falsa de assinatura ICP-Brasil ou aplicacao direta inexistente.

## Riscos remanescentes

- O bloqueio local por hash em app estatico e barreira leve, nao substitui autenticacao de servidor.
- A validacao visual automatizada nao foi executada neste ambiente.
- `npm run check`, `npm run build` e `npm run validate:catalog` nao foram executados localmente aqui porque o conector GitHub permite edicao de arquivos, mas nao fornece runtime npm do repositorio.
- O push para `main` deve acionar os workflows/deploys configurados; o resultado do CI deve ser verificado no GitHub Actions.

## Estado de funcionamento

| Item | Estado |
| --- | --- |
| Gate global antes do app | Funcional por revisao de codigo |
| Home com 5 fluxos | Funcional por revisao de codigo |
| Menu em camadas | Funcional por revisao de codigo |
| Ranking obrigatorio do filtro | Funcional por revisao de codigo |
| Testes npm locais | Nao testado neste ambiente |
| Validacao visual em browser | Nao testado neste ambiente |

## Deploy acionado

Deploy acionado por commit operacional em `main` em 2026-06-07, para publicar o nucleo inicial CORE 9: gate global, home em 5 fluxos, menu em camadas e filtro com ranking obrigatorio.

### Metodo

- Commit de rastreabilidade em documentacao.
- Push direto para `main`.
- Publicacao esperada pelo workflow/deploy configurado para eventos de push em `main`.

### Estado honesto

- Deploy: acionado.
- CI/build remoto: aguardando verificacao pelo provedor.
- Testes locais npm: nao executados neste ambiente.

## Proximo passo recomendado

Verificar GitHub Actions apos o push para `main` e corrigir eventuais falhas de TypeScript/build apontadas pelo CI. Nao declarar nota 9.0 final sem CI verde e revisao visual em navegador real.
