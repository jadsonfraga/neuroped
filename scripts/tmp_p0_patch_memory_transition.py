from pathlib import Path
p=Path('functions/api/memory/search.ts')
s=p.read_text()
s=s.replace('import { ClinicalCryptoError, clinicalStrictMode, searchEncryptedEntityIds } from "../_clinicalCrypto";', 'import { ClinicalCryptoError, clinicalCryptoConfigured, clinicalStrictMode, searchEncryptedEntityIds } from "../_clinicalCrypto";', 1)
s=s.replace('try{let ids=await searchEncryptedEntityIds(env,env.DB,"memory_note","memory_search",query,5000);let rows:Record<string,unknown>[]=[];', 'try{const cryptoReady=clinicalCryptoConfigured(env);if(clinicalStrictMode(env)&&!cryptoReady)throw new ClinicalCryptoError("CLINICAL_CRYPTO_NOT_CONFIGURED","Criptografia clínica estrita está sem chave configurada.");let ids=cryptoReady?await searchEncryptedEntityIds(env,env.DB,"memory_note","memory_search",query,5000):[];let rows:Record<string,unknown>[]=[];', 1)
p.write_text(s)
print('memory dual-read transition fixed')
