/**
 * Tela exibida quando o app é aberto num domínio NÃO autorizado (re-hospedagem
 * de uma cópia). É a face visível da trava de domínio (ver lib/domainGuard.ts).
 * Dissuasão — não é prevenção absoluta.
 */
export function UnauthorizedCopyScreen({ host }: { host: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 text-center shadow-2xl">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-3xl"
          aria-hidden="true"
        >
          🔒
        </div>
        <h1 className="text-lg font-bold">Cópia não autorizada</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Esta é uma cópia não oficial do <strong className="font-semibold text-foreground">NeuroPed</strong>, hospedada
          em um endereço não autorizado{host ? (
            <>
              {" "}(<span className="font-mono text-foreground">{host}</span>)
            </>
          ) : null}
          . O conteúdo é proprietário e educativo; a redistribuição ou re-hospedagem não autorizada é proibida.
        </p>
        <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
          Para usar a versão oficial e segura, acesse:
        </p>
        <a
          href="https://neuroped.pages.dev"
          className="mt-3 inline-block rounded-xl bg-gradient-to-r from-primary to-chart-2 px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-95"
        >
          Abrir o NeuroPed oficial
        </a>
        <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
          © 2026 NeuroPed · Dr. Jadson Fraga. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
