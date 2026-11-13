# Ponte ChatGPT / NeuroPed: Markdown -> PDF

Usa o motor já existente em C:\NeuroPed\RenderHTML\render_md.py.
Não envia Markdown clínico para serviços externos: só loopback 127.0.0.1.

## Instalação

No Windows autorizado, executar uma vez:
    python tools\pant_chat_bridge\install_windows.py

Arquivos instalados em C:\NeuroPed\PantChatBridge.
O serviço inicia no login e é supervisionado em caso de falha.
A página /renderizador do app usa a ponte local, sem armazenamento
de texto clínico no navegador.

Todo .md deixado atomicamente em
C:\NeuroPed\PantChatBridge\entrada é monitorado e renderizado como
PDF de revisão em C:\NeuroPed\PantChatBridge\saida.
A ponte registra a integridade no diretório recibos.
A versão sem marca de rascunho exige aceite explícito do texto
integral e SHA-256 idêntico, sem assinatura automática.

## Proteções

- Limite de tamanho 1 MB; sem execução de HTML ativo.
- Origens do app explicitamente permitidas; token de sessão efêmero.
- Conteúdo clínico não é publicado em GitHub, Cloudflare ou Vercel.
- PDFs de revisão identificados em todas as páginas.
- Renderização pelo motor original e seu QA, sem fallback.

## Limitação da plataforma

O ChatGPT não oferece ao aplicativo um evento universal para todo Markdown
criado em todas as conversas nem uma conexão automática que anexe PDFs
de volta a todas elas. O retorno como arquivo no chat exige uma integração
ChatGPT autorizada a enviar arquivos, além da ponte local.
