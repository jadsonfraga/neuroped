# Acabamento sensorial: plano de implementação

**Objetivo:** elevar o acabamento comum sem alterar a operação clínica.
**Arquitetura:** manter Layout e PreferencesPanel, os tokens e a API de feedback; CSS de tela com seletores limitados ao chrome compartilhado. Nenhuma dependência nova.
**Especificação:** docs/superpowers/specs/2026-11-25-visual-sensory-foundation-design.md.

1. Em tests/unit/sound-user-activation.test.ts: provar silêncio sem configuração, após gesto sem consentimento, com 0%, com preferência inválida ou armazenamento bloqueado. Preservar preferência ligada e confirmar amostra após gesto único.
2. Em softSounds.ts, useUiPreferences.ts, Layout.tsx, home.tsx e ClinicalReport.tsx: consentimento explícito, sons leves nas ações e sem efeitos ambientais; confirmação de email sem fanfarra de jogo. Dar amostra e atualizar legenda em PreferencesPanel.tsx.
3. Em motion-coherence-v15.css e no CSS da marca: superfície e foco do shell, entrada sem primeiro quadro invisível e sem transform no modo reduzido. Provar no Chromium com redução de movimento e teclado.
4. Reexecutar auditoria visual autenticada e os gates do repositório; salvar evidência comparativa sem dados reais. Não publicar sem autorização específica.
