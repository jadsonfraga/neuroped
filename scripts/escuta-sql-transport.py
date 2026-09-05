"""Split SQLite migrations safely; never mutate migration files."""
import json
import sqlite3
import sys


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
            result.append(pending.strip())
            pending = ''
    if pending.strip():
        if not sqlite3.complete_statement(pending + ';'):
            raise ValueError('Incomplete SQL statement')
        result.append(pending.strip() + ';')
    return result


if __name__ == '__main__':
    print(json.dumps(split_sql(sys.stdin.read()), ensure_ascii=False))
