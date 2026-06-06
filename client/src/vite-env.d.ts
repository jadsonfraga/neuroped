/// <reference types="vite/client" />

/**
 * Variáveis de ambiente Vite — tipagem para import.meta.env
 * Todas as variáveis VITE_* usadas no frontend devem ser declaradas aqui.
 *
 * NUNCA coloque valores padrão com credenciais reais.
 * Configure via .env ou variáveis de ambiente do servidor de CI/CD.
 */
interface ImportMetaEnv {
  /**
   * Hash SHA-256 (hex) do PIN de acesso ao frontend.
   * Geração: node -e "require('crypto').createHash('sha256').update('SEU_PIN').digest('hex') |> console.log(%)"
   * Ou no DevTools: const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('SEU_PIN'));
   *                 console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''));
   */
  readonly VITE_PIN_HASH: string;

  /** Ambiente de execução (development | production | staging) */
  readonly VITE_APP_ENV?: string;

  /** Versão do aplicativo (injetada no build) */
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
