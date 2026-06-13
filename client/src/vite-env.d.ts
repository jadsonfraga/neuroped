/// <reference types="vite/client" />

/**
 * Variaveis de ambiente Vite.
 * Nunca coloque valores padrao com credenciais reais no frontend.
 */
interface ImportMetaEnv {
  readonly VITE_APP_ENV?: string;
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
