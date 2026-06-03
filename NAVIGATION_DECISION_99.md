# NAVIGATION_DECISION_99 — NeuroPed EDJ

Data: 2026-05-07

## 1. Objetivo

Documentar a decisão técnica sobre a entrada da CAA na navegação principal.

## 2. Busca por fonte React/Vite editável

Foram procurados sinais de fonte editável da sidebar:

- `package.json`
- `src/`
- `components/`
- `Sidebar`
- `Navigation`
- `navItems`
- `menuItems`
- `Secretaria`

Resultado: não foi localizado, na busca disponível, um conjunto React/Vite editável suficiente para inserir a CAA nativamente no componente de navegação e rebuildar os assets com segurança.

## 3. Decisão

Manter `caa-sidebar.js` como fallback conservador.

Motivos:

1. O app principal publicado aparenta depender de build estático/asset compilado.
2. Reescrever ou substituir o app principal colocaria em risco rotas já funcionais.
3. A meta desta fase é elevar funcionalidade preservando estabilidade.
4. O fallback já evita botão flutuante e tenta inserir a CAA abaixo de `Secretaria` quando a sidebar está presente.

## 4. Critérios de funcionamento

`caa-sidebar.js` deve:

- procurar `Secretaria` com tolerância a acento/capitalização;
- inserir `CAA` logo abaixo quando encontrar a sidebar;
- não duplicar o item;
- não criar botão solto no meio da tela;
- falhar silenciosamente se a estrutura mudar;
- preservar o app principal mesmo se não conseguir inserir o item.

## 5. Nota honesta

A navegação não deve ser declarada como nativa enquanto o código-fonte React/Vite da sidebar não estiver disponível.

Nota máxima realista para sidebar neste estado: 8,8 a 9,2.

## 6. Próximo passo ideal

Quando a fonte React/Vite for adicionada ao repositório:

1. localizar componente/array real da sidebar;
2. inserir item `CAA` abaixo de `Secretaria`;
3. remover `caa-sidebar.js`;
4. rebuildar assets;
5. testar desktop e mobile;
6. atualizar este documento.
