# LEGACY_INTEGRATION_GUARD

## Finalidade
Este guia impede que recursos do NeuroPed pré-React sejam reinseridos de forma desorganizada no app atual.

A regra é simples: **o legado só entra se fortalecer o produto atual**.

---

## Princípio central

Não migrar por saudade. Migrar por valor.

Um recurso legado só deve entrar se cumprir pelo menos um dos critérios:

1. melhora uma decisão clínica;
2. reduz tempo da consulta;
3. melhora comunicação com família/escola;
4. aumenta qualidade documental;
5. melhora usabilidade mobile;
6. preserva identidade NeuroPed sem poluir a interface;
7. reduz risco de erro operacional.

---

## Fluxo obrigatório antes de qualquer migração

### 1. Identificar

Descrever o recurso legado:

- nome;
- onde estava;
- qual problema resolvia;
- público-alvo;
- dependências;
- arquivos antigos relacionados, se localizados.

### 2. Comparar

Verificar se já existe no React:

- mesma rota;
- mesmo componente;
- função equivalente;
- versão parcial;
- duplicidade no menu;
- conflito com design system atual.

### 3. Classificar

Usar uma decisão objetiva:

- manter como está;
- lapidar no React;
- migrar parcialmente;
- fundir com recurso atual;
- migrar depois;
- descartar.

### 4. Proteger

Responder antes de codar:

- cria risco LGPD?
- usa localStorage com dado sensível?
- expõe conteúdo médico para família sem controle?
- duplica rota?
- duplica menu?
- quebra mobile?
- piora performance?
- depende de asset pesado?
- tem saída segura se der errado?

### 5. Implementar pequeno

Cada PR deve mexer em apenas uma família de recurso:

- CAA;
- diários;
- relatórios;
- portal família;
- assets;
- navegação;
- PWA.

Não misturar CAA + PDF + menu + design no mesmo PR.

### 6. Testar

Rodar no mínimo:

```bash
npm run check
npm run validate:catalog
npm run test:clinical
npm run build
```

Se houver alteração visual importante, registrar evidência manual:

- desktop;
- iPhone/Safari;
- Android/Chrome, se possível;
- rota pública;
- rota clínica;
- fallback offline, se afetar PWA.

---

## Lista de componentes preserváveis

### CAA / Vou Falar

Status: preservar e lapidar.

Permitido:

- melhorar responsividade;
- reduzir ruído visual;
- criar modo criança/família/terapeuta;
- melhorar favoritos/histórico;
- melhorar exportação/importação.

Proibido:

- trocar por biblioteca pesada sem necessidade;
- remover voz;
- remover frase montada;
- misturar com prontuário sem consentimento;
- salvar dados clínicos sensíveis em localStorage.

### Diários clínicos

Status: preservar motor genérico.

Permitido:

- padronizar exportação;
- melhorar tendência;
- adicionar impressão/PDF;
- conectar a paciente apenas quando houver backend/autenticação.

Proibido:

- criar vários motores paralelos;
- duplicar rotas;
- apagar CSV sem substituto;
- salvar dados sensíveis em storage local se for modo SaaS.

### Relatórios de escala

Status: preservar e endurecer.

Permitido:

- garantir relatório completo;
- melhorar impressão;
- destacar respostas elevadas;
- reforçar aviso de interpretação clínica;
- preparar exportação PDF.

Proibido:

- envio automático por WhatsApp;
- laudo médico automático sem revisão;
- ocultar respostas;
- permitir relatório incompleto.

### Portal da família

Status: separar com clareza.

Permitido:

- conteúdo educativo;
- pré-consulta;
- pré-retorno;
- orientações gerais;
- novidades.

Proibido:

- liberar prontuário;
- liberar farmacologia sensível;
- liberar documentos médicos sem controle;
- misturar família com área clínica.

### Mascotes e imagens

Status: uso seletivo.

Permitido:

- estados vazios;
- feedback amigável;
- áreas familiares;
- onboarding.

Proibido:

- excesso em área médica formal;
- imagens distorcidas;
- assets pesados sem otimização;
- decoração sem função.

---

## Checklist por PR

Copiar este bloco para cada PR que mexer em legado:

```md
## Legacy safety checklist

- [ ] Recurso legado identificado.
- [ ] Equivalente React verificado.
- [ ] Sem duplicidade de rota.
- [ ] Sem duplicidade de menu.
- [ ] Sem dado sensível novo em localStorage.
- [ ] Sem área clínica exposta à família.
- [ ] Sem regressão mobile evidente.
- [ ] Sem alteração estética fora de escopo.
- [ ] `npm run check` executado.
- [ ] `npm run validate:catalog` executado.
- [ ] `npm run test:clinical` executado, se aplicável.
- [ ] `npm run build` executado.
- [ ] Evidência manual registrada.
```

---

## Ordem recomendada

1. Auditoria documental.
2. CAA.
3. Diários.
4. Relatórios/PDF.
5. Portal família.
6. Assets.
7. Navegação.
8. PWA.

Nunca começar por assets ou redesign.

---

## Frase de governança

O NeuroPed React é a matriz atual. O app pré-React é fonte de componentes, ideias e assets — não é mais a arquitetura principal.
