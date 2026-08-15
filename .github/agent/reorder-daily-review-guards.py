from pathlib import Path

workflow_path = Path('.github/workflows/daily-authorial-inventory.yml')
workflow = workflow_path.read_text(encoding='utf-8')
old = '''          if [ -n "$remote_sha" ]; then
            review_issue="$(register_pending_review "$remote_sha" "A branch já existia sem PR; o conteúdo foi preservado sem sobrescrever revisão anterior.")"
            write_outputs false "$remote_sha" "" branch_preserved_pending_pr "$review_issue"
            echo "Branch $branch preservada no commit $remote_sha; revisão rastreada na issue #$review_issue."
            exit 0
          fi

          git add client/src/data/daily-authorial
          if git diff --cached --quiet; then
            write_outputs false "$(git rev-parse HEAD)" "" already_in_main ""
            echo "Inventário já está na main; execução idempotente concluída."
            exit 0
          fi
'''
new = '''          git add client/src/data/daily-authorial
          if git diff --cached --quiet; then
            write_outputs false "$(git rev-parse HEAD)" "" already_in_main ""
            echo "Inventário já está na main; execução idempotente concluída."
            exit 0
          fi

          if [ -n "$remote_sha" ]; then
            review_issue="$(register_pending_review "$remote_sha" "A branch já existia sem PR; o conteúdo foi preservado sem sobrescrever revisão anterior.")"
            write_outputs false "$remote_sha" "" branch_preserved_pending_pr "$review_issue"
            echo "Branch $branch preservada no commit $remote_sha; revisão rastreada na issue #$review_issue."
            exit 0
          fi
'''
if workflow.count(old) != 1:
    raise SystemExit(f'Bloco de precedência encontrado {workflow.count(old)} vez(es), esperado 1.')
workflow_path.write_text(workflow.replace(old, new), encoding='utf-8')

test_path = Path('tests/unit/workflow-governance.test.mjs')
test = test_path.read_text(encoding='utf-8')
marker = '''assert.match(
  dailyInventory,
  /remote_sha="\\$\\(git ls-remote origin "refs\\/heads\\/\\$branch"/,
  "uma branch de revisão já existente deve ser detectada antes de qualquer sobrescrita",
);
'''
addition = marker + '''assert.ok(
  dailyInventory.indexOf("git add client/src/data/daily-authorial") <
    dailyInventory.indexOf('if [ -n "$remote_sha" ]; then'),
  "conteúdo já incorporado à main deve encerrar idempotentemente antes de classificar branch antiga como pendência",
);
'''
if test.count(marker) != 1:
    raise SystemExit('Ponto de inserção do contrato de precedência não encontrado exatamente uma vez.')
test_path.write_text(test.replace(marker, addition), encoding='utf-8')
