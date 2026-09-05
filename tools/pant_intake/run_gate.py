"""CLI independente: valida entrada JSON; não emite documento médico."""
from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path
from neuroped_fluxo.core import empty_case, validate


def read_case(path: str):
    source = Path(path)
    if source.stat().st_size > 1_000_000:
        raise ValueError("Arquivo maior que 1 MB.")
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError("Chave JSON duplicada: " + key)
            result[key] = value
        return result
    def constant(value):
        raise ValueError("Constante não JSON: " + value)
    return json.loads(source.read_text(encoding="utf-8-sig"), object_pairs_hook=pairs, parse_constant=constant)


def main(argv=None):
    parser = argparse.ArgumentParser(description="Portão de entrada NeuroPed SDG, sem emissão clínica.")
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--input", help="Caso JSON pseudonimizado")
    source.add_argument("--template", action="store_true", help="Produzir contrato vazio, não aprovado")
    parser.add_argument("--output", help="Novo arquivo; não sobrescreve existente")
    args = parser.parse_args(argv)
    try:
        result = empty_case() if args.template else validate(read_case(args.input))
        text = json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False)
        if args.output:
            with Path(args.output).open("x", encoding="utf-8") as destination:
                destination.write(text + "\n")
        else:
            print(text)
        return 2 if not args.template and result["status"] == "BLOQUEADO" else 0
    except (OSError, ValueError, TypeError, OverflowError, RecursionError) as error:
        print("Erro: " + str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
