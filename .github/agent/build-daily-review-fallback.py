from pathlib import Path
import re

workflow_path = Path('.github/workflows/daily-authorial-inventory.yml')
workflow = workflow_path.read_text(encoding='utf-8')

publish_pattern = re.compile(
    r'''      - name: Publicar branch de revisão e abrir PR draft\n'''
    r'''        id: publish\n'''
    r'''[\s\S]*?'''
    r'''(?=      - name: Resumo operacional\n)'''
)

publish_replacement = '''      - name: Publicar branch de revisão e abrir PR draft
        id: publish
        env:
          GH_TOKEN: ${{ secrets.NEUROPED_AUTOMATION_TOKEN || github.token }}
          DEDICATED_AUTOMATION_TOKEN: ${{ secrets.NEUROPED_AUTOMATION_TOKEN }}
        run: |
          set -euo pipefail
          using_dedicated_token=false
          if [ -n "${DEDICATED_AUTOMATION_TOKEN:-}" ]; then
            using_dedicated_token=true
          else
            echo "::warning::NEUROPED_AUTOMATION_TOKEN ausente; github.token preservará o rascunho em branch. Se a política do repositório bloquear PRs do Actions, uma issue de revisão será criada sem mascarar falhas inesperadas."
          fi
          unset DEDICATED_AUTOMATION_TOKEN

          branch="automation/daily-authorial-${NEUROPED_GENERATION_DATE}"
          review_title="[revisão] Inventário autoral diário — ${NEUROPED_GENERATION_DATE}"
          review_url="${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/compare/main...${branch}?expand=1"

          write_outputs() {
            local changed="$1"
            local commit_sha="$2"
            local pr_number="$3"
            local review_status="$4"
            local review_issue="$5"
            {
              echo "changed=$changed"
              echo "commit=$commit_sha"
              echo "pr=$pr_number"
              echo "review_branch=$branch"
              echo "review_status=$review_status"
              echo "review_issue=$review_issue"
            } >> "$GITHUB_OUTPUT"
          }

          register_pending_review() {
            local commit_sha="$1"
            local reason="$2"
            local body
            local issue
            local issue_url
            body="$(cat <<EOF
          O inventário autoral de ${NEUROPED_GENERATION_DATE} foi gerado, auditado e preservado fora da main, mas ainda exige revisão humana.

          - Branch de revisão: ${branch}
          - Commit preservado: ${commit_sha}
          - Comparação e criação manual de PR: ${review_url}
          - Motivo operacional: ${reason}
          - Execução: ${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}

          Não promover o conteúdo para uso clínico até revisão explícita. Esta issue rastreia a revisão; não representa falha da geração ou da auditoria.
          EOF
          )"
            issue="$(gh issue list --repo "$GITHUB_REPOSITORY" --state open --search "${review_title} in:title" --json number --jq '.[0].number // empty')"
            if [ -n "$issue" ]; then
              gh issue comment "$issue" --repo "$GITHUB_REPOSITORY" --body "$body" >/dev/null
            else
              issue_url="$(gh issue create --repo "$GITHUB_REPOSITORY" --title "$review_title" --body "$body")"
              issue="$(gh issue view "$issue_url" --repo "$GITHUB_REPOSITORY" --json number --jq .number)"
            fi
            printf '%s' "$issue"
          }

          existing_pr="$(gh pr list --repo "$GITHUB_REPOSITORY" --state open --base main --head "$branch" --json number --jq '.[0].number // empty')"
          remote_sha="$(git ls-remote origin "refs/heads/$branch" | awk '{print $1}')"

          if [ -n "$existing_pr" ]; then
            write_outputs false "${remote_sha:-$(git rev-parse HEAD)}" "$existing_pr" pr_draft_open ""
            echo "PR #$existing_pr já representa o inventário da data; nenhuma mutação automática será feita sobre revisão humana em andamento."
            exit 0
          fi

          if [ -n "$remote_sha" ]; then
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

          git config user.name "NeuroPed Daily Bot"
          git config user.email "neuroped-daily-bot@users.noreply.github.com"
          git commit -m "feat(escalas): preparar inventário autoral diário ${NEUROPED_GENERATION_DATE}"
          git push origin "HEAD:refs/heads/$branch"
          review_commit="$(git rev-parse HEAD)"

          cat > /tmp/daily-pr-body.md <<EOF
          ## Inventário autoral diário — ${NEUROPED_GENERATION_DATE}

          Artefato gerado e validado automaticamente, preservado como rascunho para revisão humana.

          - Modelo: ${{ steps.verify.outputs.model }}
          - Contingência: ${{ steps.verify.outputs.contingency }}
          - Arquivo: ${{ steps.verify.outputs.file }}
          - Status esperado: rascunho_revisao

          Não promover para uso clínico operacional sem revisar redação, segurança, utilidade, originalidade e coerência com o restante do catálogo. A publicação no aplicativo exige status revisado_clinicamente.
          EOF

          pr_error="$(mktemp)"
          if pr_url="$(gh pr create --repo "$GITHUB_REPOSITORY" --base main --head "$branch" --draft \
            --title "chore(clinical): revisar inventário autoral ${NEUROPED_GENERATION_DATE}" \
            --body-file /tmp/daily-pr-body.md 2>"$pr_error")"; then
            pr_number="$(gh pr view "$pr_url" --repo "$GITHUB_REPOSITORY" --json number --jq .number)"
            write_outputs true "$review_commit" "$pr_number" pr_draft_created ""
            echo "Rascunho encaminhado ao PR #$pr_number; main permaneceu inalterada."
            exit 0
          fi

          cat "$pr_error" >&2
          if [ "$using_dedicated_token" = "false" ] \
            && grep -Fq "GitHub Actions is not permitted to create or approve pull requests" "$pr_error"; then
            review_issue="$(register_pending_review "$review_commit" "A política do repositório não permite que github.token crie PRs; a branch e a revisão rastreável foram preservadas.")"
            write_outputs true "$review_commit" "" branch_preserved_pending_pr "$review_issue"
            echo "::warning::PR automático bloqueado pela política do repositório; branch preservada e issue #$review_issue aberta para revisão humana."
            exit 0
          fi

          echo "::error::Erro inesperado ao criar o PR draft; a branch foi preservada, mas a execução permanece falha para investigação."
          exit 1

'''

workflow, publish_count = publish_pattern.subn(publish_replacement, workflow)
if publish_count != 1:
    raise SystemExit(f'Passo de publicação substituído {publish_count} vez(es), esperado 1.')

summary_marker = '''            echo "- **PR de revisão:** ${{ steps.publish.outputs.pr || 'não criado' }}"
'''
summary_addition = summary_marker + '''            echo "- **Branch de revisão:** ${{ steps.publish.outputs.review_branch || 'não necessária' }}"
            echo "- **Estado da revisão:** ${{ steps.publish.outputs.review_status || 'não confirmado' }}"
            echo "- **Issue de revisão:** ${{ steps.publish.outputs.review_issue || 'não criada' }}"
'''
if workflow.count(summary_marker) != 1:
    raise SystemExit('Linha do PR no resumo não encontrada exatamente uma vez.')
workflow = workflow.replace(summary_marker, summary_addition)
workflow_path.write_text(workflow, encoding='utf-8')

governance_path = Path('tests/unit/workflow-governance.test.mjs')
governance = governance_path.read_text(encoding='utf-8')
governance_marker = '''assert.match(
  dailyInventory,
  /git push origin "HEAD:refs\\/heads\\/\\$branch"/,
  "o fallback deve continuar publicando somente uma branch de revisão, nunca a main",
);
'''
governance_addition = governance_marker + '''assert.match(
  dailyInventory,
  /remote_sha="\\$\\(git ls-remote origin "refs\\/heads\\/\\$branch"/,
  "uma branch de revisão já existente deve ser detectada antes de qualquer sobrescrita",
);
assert.match(
  dailyInventory,
  /branch_preserved_pending_pr/,
  "branch auditada sem PR deve virar pendência de revisão, não falso erro de geração",
);
assert.match(
  dailyInventory,
  /GitHub Actions is not permitted to create or approve pull requests/,
  "o bloqueio conhecido da política do repositório deve possuir fallback explícito e restrito",
);
assert.match(
  dailyInventory,
  /gh issue create[\\s\\S]{0,220}\\$review_title/,
  "o fallback deve abrir uma issue rastreável para revisão humana",
);
assert.match(
  dailyInventory,
  /Erro inesperado ao criar o PR draft[\\s\\S]{0,180}exit 1/,
  "erros diferentes da limitação conhecida devem continuar falhando fechado",
);
'''
if governance.count(governance_marker) != 1:
    raise SystemExit('Ponto de inserção do contrato de governança não encontrado exatamente uma vez.')
governance_path.write_text(governance.replace(governance_marker, governance_addition), encoding='utf-8')

loose_path = Path('tests/unit/loose-ends-regression.test.mjs')
loose = loose_path.read_text(encoding='utf-8')
loose_marker = '''assert.doesNotMatch(
  dailyAuthorialWorkflow,
  /NEUROPED_AUTOMATION_TOKEN é obrigatório/,
  "a ausência do token dedicado não deve transformar geração, auditoria e preservação bem-sucedidas em falha operacional",
);
'''
loose_addition = loose_marker + '''assert.match(
  dailyAuthorialWorkflow,
  /branch_preserved_pending_pr/,
  "branch sem PR precisa permanecer rastreável sem reclassificar uma auditoria aprovada como falha",
);
assert.match(
  dailyAuthorialWorkflow,
  /gh issue create[\\s\\S]{0,220}\\$review_title/,
  "a revisão humana pendente deve receber issue própria quando o Actions não puder criar PR",
);
assert.match(
  dailyAuthorialWorkflow,
  /Erro inesperado ao criar o PR draft[\\s\\S]{0,180}exit 1/,
  "o fallback conhecido não pode mascarar falhas inesperadas",
);
'''
if loose.count(loose_marker) != 1:
    raise SystemExit('Ponto de inserção do contrato de pontas soltas não encontrado exatamente uma vez.')
loose_path.write_text(loose.replace(loose_marker, loose_addition), encoding='utf-8')
