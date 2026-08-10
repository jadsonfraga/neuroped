from __future__ import annotations
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def replace_once(path: str, old: str, new: str) -> None:
    p = ROOT / path
    s = p.read_text('utf-8')
    n = s.count(old)
    if n != 1:
        raise SystemExit(f'{path}: esperado 1 trecho, encontrado {n}: {old[:160]!r}')
    p.write_text(s.replace(old, new, 1), 'utf-8')

replace_once(
    'client/src/pages/agenda.tsx',
    '''  async function mutate(payload: Record<string, unknown>, success: string) {\n    setBusy(true);\n    try {\n      await apiRequest("POST", "/api/operations", payload);\n      await queryClient.invalidateQueries({ queryKey: [DASHBOARD_KEY] });\n      await dashboard.refetch();\n      toast({ title: success });\n    } catch (error) {\n      toast({ title: "Não foi possível concluir.", description: String(error), variant: "destructive" });\n    } finally {\n      setBusy(false);\n    }\n  }''',
    '''  async function mutate(payload: Record<string, unknown>, success: string): Promise<boolean> {\n    setBusy(true);\n    try {\n      await apiRequest("POST", "/api/operations", payload);\n    } catch (error) {\n      toast({ title: "Não foi possível concluir.", description: String(error), variant: "destructive" });\n      setBusy(false);\n      return false;\n    }\n\n    try {\n      await queryClient.invalidateQueries({ queryKey: [DASHBOARD_KEY] });\n      const refreshed = await dashboard.refetch();\n      if (refreshed.isError) throw refreshed.error ?? new Error("Falha ao atualizar a agenda.");\n      toast({ title: success });\n    } catch (error) {\n      // A mutação já foi persistida. Não rotular uma falha de atualização da UI\n      // como falha transacional, pois isso pode induzir o usuário a repetir a ação.\n      toast({\n        title: success,\n        description: `A alteração foi salva, mas a tela não conseguiu atualizar agora. Use “Tentar novamente” se necessário. (${String(error)})`,\n      });\n    } finally {\n      setBusy(false);\n    }\n    return true;\n  }''',
)

replace_once(
    'client/src/pages/agenda.tsx',
    '''onClick={async () => { await mutate({ action: "staff_link", email: staffEmail }, "Recepção vinculada à agenda."); setStaffEmail(""); }}''',
    '''onClick={async () => {\n                    const saved = await mutate({ action: "staff_link", email: staffEmail }, "Recepção vinculada à agenda.");\n                    if (saved) setStaffEmail("");\n                  }}''',
)

replace_once(
    'client/src/pages/agenda.tsx',
    '''mutate: (payload: Record<string, unknown>, success: string) => Promise<void>''',
    '''mutate: (payload: Record<string, unknown>, success: string) => Promise<boolean>''',
)

# Trava permanente para não voltar a confundir commit remoto com refresh local.
test = ROOT / 'tests/unit/witch-hunt-regressions.test.mjs'
s = test.read_text('utf-8')
anchor = 'assert.match(auditLog, /created_at < \\?/, "data final deve usar próximo dia exclusivo");\n'
addition = anchor + '''\nconst agendaPage = read("client/src/pages/agenda.tsx");\nassert.match(agendaPage, /async function mutate[\\s\\S]{0,800}apiRequest[\\s\\S]{0,800}return false/, "falha da mutação deve retornar false antes do refresh");\nassert.match(agendaPage, /A alteração foi salva, mas a tela não conseguiu atualizar/, "falha de refetch não pode fingir rollback da mutação");\nassert.match(agendaPage, /const saved = await mutate[\\s\\S]{0,300}if \\(saved\\) setStaffEmail/, "formulário de equipe só limpa após mutação aceita");\nassert.match(agendaPage, /Promise<boolean>/, "componentes filhos devem preservar o resultado da mutação");\n'''
if anchor not in s:
    raise SystemExit('witch-hunt test anchor not found')
test.write_text(s.replace(anchor, addition, 1), 'utf-8')

print('Round 4 UI truth fixes applied')
