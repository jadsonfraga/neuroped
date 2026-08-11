from pathlib import Path

path = Path('.github/workflows/deploy-cloudflare.yml')
text = path.read_text()

before_deploy = '''          put_optional ADMIN_NAME "$admin_name"\n\n      - name: Deploy para Cloudflare Pages\n'''
insert_before_deploy = '''          put_optional ADMIN_NAME "$admin_name"\n\n      - name: Preparar migração clínica P0, backup e chaves separadas\n        env:\n          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}\n          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}\n          NEUROPED_JWT_SECRET: ${{ secrets.NEUROPED_JWT_SECRET }}\n        run: bash scripts/prepare-clinical-encryption-release.sh\n\n      - name: Preservar backup clínico pré-migração cifrado\n        if: env.CLINICAL_MIGRATION_REQUIRED == 'true'\n        uses: actions/upload-artifact@v4\n        with:\n          name: clinical-d1-pre-migration-${{ github.run_id }}\n          path: /tmp/neuroped-clinical-pre-migration.enc.json\n          if-no-files-found: error\n          retention-days: 7\n\n      - name: Deploy para Cloudflare Pages\n'''
if before_deploy in text:
    text = text.replace(before_deploy, insert_before_deploy, 1)
elif 'Preparar migração clínica P0, backup e chaves separadas' not in text:
    raise SystemExit('anchor before deploy not found')

before_health = '''      - name: Validar health autenticado do backend publicado\n'''
insert_before_health = '''      - name: Finalizar criptografia clínica strict e retirar segredos legados\n        env:\n          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}\n          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}\n        run: bash scripts/finalize-clinical-encryption-release.sh\n\n      - name: Validar health autenticado do backend publicado\n'''
if before_health in text:
    text = text.replace(before_health, insert_before_health, 1)
elif 'Finalizar criptografia clínica strict e retirar segredos legados' not in text:
    raise SystemExit('anchor before health not found')

old_health = '''               && jq -e '.database == "ok" and .authentication.required == true and .authentication.configured == true' \\\n                    /tmp/cloudflare-health.json >/dev/null; then\n'''
new_health = '''               && jq -e '\n                    .database == "ok" and\n                    .authentication.required == true and\n                    .authentication.configured == true and\n                    .encryption.readyForIdentifiableClinicalData == true and\n                    .encryption.clinicalStrict == true and\n                    .encryption.clinicalPhase == "strict" and\n                    .encryption.operationalConfigured == true\n                  ' /tmp/cloudflare-health.json >/dev/null; then\n'''
if old_health in text:
    text = text.replace(old_health, new_health, 1)
elif 'readyForIdentifiableClinicalData' not in text:
    raise SystemExit('health anchor not found')

text = text.replace(
    'echo "✅ HEALTH OK — D1 e autenticação nominal configurados."',
    'echo "✅ HEALTH OK — D1, auth e criptografia clínica strict confirmados."',
    1,
)

path.write_text(text)
print('deploy-cloudflare.yml P0 patch applied')
