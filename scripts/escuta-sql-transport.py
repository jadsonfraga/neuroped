"""Compatibility transport for complete SQLite statements; historical files stay unchanged."""
import json
import re
import sqlite3
import sys


def parenthesize_cases(source: str) -> str:
    """D1 must not mistake CASE END for the end of a trigger."""
    pieces: list[str] = []
    depth = 0
    quote = None
    i = 0
    while i < len(source):
        ch = source[i]
        if quote:
            pieces.append(ch)
            if ch == quote:
                if quote != ']' and i + 1 < len(source) and source[i + 1] == quote:
                    pieces.append(source[i + 1])
                    i += 1
                else:
                    quote = None
            i += 1
            continue
        if ch in ("'", '"', '`', '['):
            quote = ']' if ch == '[' else ch
            pieces.append(ch)
            i += 1
            continue
        match = re.match(r'[A-Za-z_][A-Za-z_0-9]*', source[i:])
        if match:
            word = match.group()
            if word.upper() == 'CASE':
                pieces.append('(' + word)
                depth += 1
            elif word.upper() == 'END' and depth:
                pieces.append(word + ')')
                depth -= 1
            else:
                pieces.append(word)
            i += len(word)
        else:
            pieces.append(ch)
            i += 1
    if depth or quote:
        raise ValueError('Incomplete CASE or quoted literal')
    return ''.join(pieces)


def split_sql(source: str) -> list[str]:
    cleaned: list[str] = []
    state = 'plain'
    quote = ''
    i = 0
    while i < len(source):
        ch = source[i]
        pair = source[i:i + 2]
        if state == 'line':
            if ch == '\n':
                cleaned.append(ch)
                state = 'plain'
        elif state == 'block':
            if pair == '*/':
                cleaned.append(' ')
                state = 'plain'
                i += 1
            elif ch == '\n':
                cleaned.append(ch)
        elif state == 'quoted':
            cleaned.append(ch)
            if ch == quote:
                if i + 1 < len(source) and source[i + 1] == quote and quote != ']':
                    cleaned.append(source[i + 1])
                    i += 1
                else:
                    state = 'plain'
        elif pair in ('--', '/*'):
            state = 'line' if pair == '--' else 'block'
            cleaned.append(' ')
            i += 1
        else:
            cleaned.append(ch)
            if ch in ("'", '"', '`', '['):
                quote = ']' if ch == '[' else ch
                state = 'quoted'
        i += 1
    if state in ('block', 'quoted'):
        raise ValueError('Unterminated SQL comment or literal')
    result: list[str] = []
    pending = ''
    for ch in ''.join(cleaned):
        pending += ch
        if ch == ';' and sqlite3.complete_statement(pending):
            result.append(parenthesize_cases(pending.strip()))
            pending = ''
    if pending.strip():
        if not sqlite3.complete_statement(pending + ';'):
            raise ValueError('Incomplete SQL statement')
        result.append(parenthesize_cases(pending.strip() + ';'))
    return result


def d1_statements(source: str) -> list[str]:
    """Return statements safe for D1 REST, which already provides transaction semantics.

    Historical schemas/migrations may wrap DDL in top-level BEGIN/COMMIT. Sending those
    wrappers through D1's query endpoint causes a nested-transaction error. Only complete,
    standalone transaction-control statements are removed; trigger END tokens remain inside
    their CREATE TRIGGER statement and are never filtered.
    """
    transaction_control = re.compile(
        r'^\s*(?:BEGIN(?:\s+(?:DEFERRED|IMMEDIATE|EXCLUSIVE))?(?:\s+TRANSACTION)?|COMMIT(?:\s+TRANSACTION)?|END\s+TRANSACTION|ROLLBACK(?:\s+TRANSACTION)?)\s*;?\s*$',
        re.IGNORECASE,
    )
    return [statement for statement in split_sql(source) if not transaction_control.fullmatch(statement)]


if __name__ == '__main__':
    print(json.dumps(d1_statements(sys.stdin.read()), ensure_ascii=False))
