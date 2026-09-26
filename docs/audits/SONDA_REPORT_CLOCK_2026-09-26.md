# Relatório presencial: tempo estável ao encerrar

A CI do censo (#877, run 36268537052) reproduziu diferença entre textarea e
arquivo: 3 s na primeira leitura, 4 s no download. O cleanup passivo do relógio
somava a fração final depois de o relatório já estar visível.

O relógio agora usa layout effect, concluindo o tempo acumulado antes de pintar
o relatório. Preserva as frações entre pausas e missões. O teste de navegador
exige relatório idêntico após mais 1,5 s e continua comparando integralmente o
arquivo baixado com o texto mostrado; nenhuma assertiva foi relaxada.

Validação: suíte `test:sonda`, tipos e lint locais; fluxo Chromium na CI,
sete missões por faixa, caminhos incompletos e modalidade presencial. Fixtures
sintéticas. Sem mudança de interpretação ou instrumento.

Rollback: PR de revert deste commit, mantendo o teste de igualdade que revela
qualquer reaparecimento da divergência.
