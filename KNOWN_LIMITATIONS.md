# KNOWN LIMITATIONS — NeuroPed EDJ v5.1

Este documento existe para evitar que a aparência polida do produto seja confundida com prontidão clínica.

## Limitações que tornam esta build INADEQUADA para uso com pacientes reais

### Autenticação
- Não há autenticação real. PIN MASTER `FRAGA1108` é apenas barreira de UX
- O PIN está em texto claro no JavaScript público — qualquer pessoa com DevTools descobre
- Não há MFA
- Não há sessão segura server-side
- Não há controle de quem acessou o quê

### Banco de dados
- Não há banco de dados profissional ativo neste deploy
- Dados ficam em localStorage do navegador, texto claro
- Sem Row Level Security
- Sem backup automático
- Sem retenção definida
- Sem trilha de auditoria

### Instrumentos clínicos
- Instrumentos clássicos (M-CHAT-R, SNAP-IV, SRS-2, CBCL, GMFCS, ASQ-3, Vineland-3, Conners-3) NÃO estão implementados
- Aparecem apenas como referência catalogada, sem botão "Aplicar"
- Para implementar, é obrigatório obter licença formal dos autores/editoras
- Os 15 instrumentos AUTORAIS são triagem operacional, não substituem escala normatizada

### Laudos
- PDF gerado leva carimbo "DEMONSTRAÇÃO"
- Não há assinatura digital qualificada (ICP-Brasil)
- O hash interno é identificador técnico, não assinatura jurídica
- Documento gerado NÃO deve ser entregue como laudo formal

### Cobrança e planos
- Botões "Pro / Clínica" foram REMOVIDOS desta build
- Não há provedor de pagamento integrado
- Não há checkout funcional
- Não há webhook de pagamento
- O módulo Planos não aparece mais na navegação

### Comunicação
- Módulo Mensagens REMOVIDO desta build
- Não havia persistência segura, isolamento por paciente, ou RLS
- Risco LGPD inaceitável → removido

### Telemedicina
- REMOVIDA dos textos públicos
- Vídeo-chamada exige WebRTC + consentimento + registro em prontuário + conformidade CFM 2.314/2022

### Sincronização em nuvem
- Configuração opcional pelo proprietário em Configurações
- Por padrão, NÃO sincroniza
- Mesmo quando configurado, não há criptografia adicional além do TLS

### LGPD
- Não há fluxo de consentimento implementado
- Não há política de retenção configurada
- Não há mecanismo de portabilidade ou esquecimento
- Status: **não conforme com LGPD para uso com pacientes reais**

### Backend
- Cloudflare Pages Functions existem no repositório
- Mas o domínio público (GitHub Pages) NÃO executa Functions
- Endpoints `/api/health` e `/api/submissions` não estão ativos em `jadsonfraga.github.io/neuroped/`

### Service Worker
- Cacheia o shell estático para offline
- NÃO deve ser usado para armazenar dados clínicos
- Em produção, dados privados precisam de `Cache-Control: no-store` em rotas privadas

### Testes
- Não há suíte de testes automatizados
- Não há CI/CD com gates de qualidade
- Não há Lighthouse automatizado por commit

## Limitações aceitáveis para uso EDUCACIONAL atual

### O que esta versão FAZ bem
- 15 instrumentos autorais do Dr. Jadson Fraga aplicáveis em modo família
- 8 materiais educativos com conteúdo real
- 9 marcos do desenvolvimento por faixa etária
- 2 calculadoras (IMC, dose pediátrica) funcionais
- CAA com 72 pictogramas + síntese de voz pt-BR
- Página de contato com WhatsApp direto
- Apresentação institucional do Dr. Jadson com credenciais (CRM-PE 25227, RQE 17756)
- Tema claro/escuro, instalação como PWA, offline básico para conteúdo público

### Para quem esta versão SERVE
- Famílias buscando triagem orientadora antes de procurar especialista
- Escolas e equipes terapêuticas usando como referência
- Marketing institucional do Dr. Jadson para captação de pacientes
- Demonstração de roadmap para investidores/sócios

### Para quem esta versão NÃO SERVE (ainda)
- Médico operando rotina clínica diária real
- Clínica multi-profissional gerenciando vários médicos
- Pacientes esperando prontuário eletrônico seguro
- Operação financeira recorrente
- Telemedicina

## Como ler o restante da documentação

- `ARCHITECTURE.md` — para onde vamos
- `SECURITY.md` — controles obrigatórios antes de aceitar dados reais
- `INSTRUMENT_REGISTRY.md` — fonte única de verdade clínica
- `GO_LIVE_CHECKLIST.md` — checklist antes de aceitar primeiro paciente real
- `AUDIT_REMEDIATION_REPORT.md` — auditoria que originou esta versão
- `PRIVACY_AND_LGPD.md` — documento jurídico obrigatório
