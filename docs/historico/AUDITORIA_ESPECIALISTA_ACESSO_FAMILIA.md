# AUDITORIA_ESPECIALISTA_ACESSO_FAMILIA — NeuroPed SDG

Data: 2026-05-07
Escopo: Portal da Família, PIN master, área do filho, dados pessoais, dados clínicos sensíveis e rotas públicas.

## 1. Veredito técnico

O modelo correto deve ter três camadas:

1. **Médico / Master** — PIN master local abre a interface profissional.
2. **Família / Público** — conteúdo educativo livre, sem CPF, sem senha, sem barreira.
3. **Família / Área leve do filho** — pode usar data de nascimento + último sobrenome apenas para personalização local e ferramentas familiares não sensíveis.

Data de nascimento + último sobrenome **não deve abrir documentos, prontuário, laudos, prescrições, mensagens clínicas ou histórico identificável**. Esses dados exigem autenticação forte e backend com controle por paciente.

## 2. Problemas encontrados

### 2.1 CPF como senha

**Gravidade:** crítica.

CPF como senha é inadequado para família, aumenta risco LGPD e cria falsa segurança.

**Conduta:** remover esse padrão do fluxo familiar público.

### 2.2 Data de nascimento + sobrenome como chave única

**Gravidade:** alta se usada para dados sensíveis.

Esses dados são frequentemente conhecidos por escola, familiares e terceiros. Podem ser usados como identificação leve, mas não como senha forte.

**Conduta:** permitir apenas para área familiar local não sensível.

### 2.3 App estático no GitHub Pages

**Gravidade:** estrutural.

GitHub Pages não possui backend, sessão segura por usuário, Row Level Security ou autorização real por paciente.

**Conduta:** não armazenar nem expor dados clínicos reais por família em página estática. Usar apenas ferramentas locais e educativas.

### 2.4 PIN master em camada de interface

**Gravidade:** média.

O PIN master local é útil para fluxo clínico no navegador, mas não substitui segurança de servidor.

**Conduta:** manter como chave operacional do médico para abrir áreas do app, mas não chamar isso de proteção criptográfica de backend.

### 2.5 Portal da Família antigo com CPF/senha

**Gravidade:** alta para experiência e LGPD.

O fluxo visual antigo induz a família a usar dado identificável como credencial.

**Conduta:** redirecionar para portal familiar livre e bloquear dados sensíveis.

## 3. Modelo recomendado

### 3.1 Médico

- PIN master.
- Acesso a todas as rotas profissionais.
- Uso em aparelho de confiança.

### 3.2 Família pública

Sem login:

- biblioteca educativa;
- orientação parental;
- marcos do desenvolvimento;
- guia de terapias;
- CAA gratuita;
- diário local;
- filtro de instrumentos;
- mapa de escalas;
- perguntas frequentes.

### 3.3 Área leve do filho

Identificação simples:

- data de nascimento;
- último sobrenome.

Libera apenas:

- personalização local da experiência;
- diário local;
- CAA da criança;
- rotina familiar;
- instrumentos educativos;
- exportações criadas no próprio aparelho.

Não libera:

- documentos médicos;
- mensagens clínicas;
- laudos;
- prescrições;
- prontuário;
- histórico clínico armazenado no servidor;
- dados de outros pacientes.

### 3.4 Dados sensíveis

Exigem solução futura com:

- autenticação real;
- convite familiar por paciente;
- backend;
- regras por paciente;
- logs mínimos de acesso;
- revogação de acesso;
- expiração de convite.

## 4. Solução genial e realista

### Fase atual — GitHub Pages

Manter o Portal da Família como **hub livre e educativo**.

Criar “área do filho” apenas local, sem expor dado remoto sensível.

### Fase ideal — backend

Usar:

- magic link ou código familiar gerado pela clínica;
- segundo fator leve: data de nascimento;
- autorização por `patient_id`;
- tabela de permissões familiares;
- regra: família só lê documentos liberados pelo médico.

## 5. Regras anti-regressão

Nunca implementar:

- CPF como senha;
- RG como senha;
- nome completo como senha;
- data de nascimento sozinha como senha;
- sobrenome sozinho como senha;
- documentos clínicos sensíveis em JSON público;
- prontuário real em GitHub Pages.

Permitido:

- conteúdo público livre;
- dados locais criados pela própria família;
- PIN master para interface médica;
- data + sobrenome apenas para área familiar leve e local;
- backend futuro para dados sensíveis.

## 6. Nota honesta

Com a estrutura estática atual:

- Portal educativo público: 9,5
- Proteção de dados sensíveis por bloqueio de interface: 8,0
- Segurança real por paciente: não aplicável sem backend
- Experiência familiar: 8,8
- Caminho de evolução para produção clínica real: 9,5

## 7. Decisão final

A correção correta é preservar a liberdade do portal público, permitir área leve do filho com identificação simples e manter dados sensíveis fora desse fluxo. A família não deve ser obrigada a usar CPF. O médico continua com PIN master para operação interna.
