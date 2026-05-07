# Fluxo de documentos — NeuroPed EDJ

## Regra

O app deve separar documento preliminar de documento final validado.

## Documento preliminar

Pode ser gerado pelo frontend para revisao medica.

Texto sugerido:

```txt
Documento gerado para revisao profissional.
```

## Documento final

Para uso real, o arquivo final precisa passar por fluxo externo validado, com registro de auditoria e verificacao.

## Hash local

O hash local pode ajudar a detectar alteracao do texto, mas nao substitui validacao externa formal.

## Antes de liberar producao

1. escolher provedor de validacao documental;
2. testar emissao de PDF final;
3. testar verificacao externa;
4. registrar evento em audit_events;
5. revisar os textos exibidos ao usuario.
