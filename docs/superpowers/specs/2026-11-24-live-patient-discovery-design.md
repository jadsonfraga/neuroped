# Descoberta de pacientes LIVE

A tela deve alcançar cadastros antigos no backend canônico, sem marcar uma
busca parcial como inexistente ou paginar uma lista já truncada no navegador.

Abordagens: (1) paginação estável por data e ID, com busca por lote cifrado no
servidor; (2) novo índice de pesquisa, mais rápido em catálogos grandes mas
dependente de migração e revisão de privacidade. Opção 1 aprovada em 24/11.
A busca de nome iniciada pela tela envia o termo no corpo, não na URL.
Listar, buscar e continuar sempre verificam permissões e restringem o SQL à
clínica; nenhum nome adicional é materializado no navegador. Não mudar chaves,
persistência ou ambiente publicado para esta entrega.

Aceite: encontrar registro além dos 100 mais recentes; lidar com datas iguais,
zero parcial vs. zero final, clínica diferente, mudança de termo e ida/volta.
Validar UI + Pages Functions + D1 com cadastro sintético antes de qualificar a
jornada como E2E; outros testes continuam sendo evidência parcial.
