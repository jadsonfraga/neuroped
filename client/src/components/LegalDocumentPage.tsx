/**
 * Páginas públicas dos Termos de Uso (assinatura) e da Política de
 * Privacidade. O texto e a versão vêm de shared/legal.ts — a mesma fonte que o
 * servidor grava no aceite do cadastro —, então a tela nunca mostra uma versão
 * diferente da que é registrada.
 */
import { Link } from "wouter";
import { AlertTriangle, FileText } from "lucide-react";
import { LEGAL_DOCUMENTS, LEGAL_PENDING, type LegalDocumentKey } from "@shared/legal";

function dateBr(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function Paragraph({ text }: { text: string }) {
  // Destaca a marca de pendência jurídica onde ela aparece no parágrafo.
  const parts = text.split(LEGAL_PENDING);
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      {parts.map((part, index) => (
        <span key={index}>
          {part}
          {index < parts.length - 1 && (
            <mark className="rounded bg-amber-500/15 px-1 font-semibold text-amber-800 dark:text-amber-200" data-testid="legal-pending-mark">{LEGAL_PENDING}</mark>
          )}
        </span>
      ))}
    </p>
  );
}

export function LegalDocumentPage({ documentKey }: { documentKey: LegalDocumentKey }) {
  const doc = LEGAL_DOCUMENTS[documentKey];
  const other = LEGAL_DOCUMENTS[documentKey === "saas_terms" ? "privacy_policy" : "saas_terms"];
  return (
    <article className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8" data-testid={`legal-document-${doc.key}`}>
      <header className="space-y-3">
        <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <FileText className="h-3.5 w-3.5" aria-hidden="true" /> NeuroPed · documento legal
        </p>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{doc.title}</h1>
        <p className="text-xs text-muted-foreground" data-testid="legal-version">
          Versão <strong className="text-foreground">{doc.version}</strong> · publicada em {dateBr(doc.publishedAt)}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">{doc.summary}</p>
      </header>

      {doc.status !== "final" && (
        <div role="note" className="flex gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm" data-testid="legal-draft-banner">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-bold text-foreground">Rascunho pendente de revisão jurídica</p>
            <p className="text-muted-foreground">
              Este texto descreve como o NeuroPed funciona hoje, mas ainda não passou por revisão jurídica. Os trechos marcados com {LEGAL_PENDING} serão definidos nessa revisão. Uma versão nova será apresentada para novo aceite.
            </p>
          </div>
        </div>
      )}

      {doc.sections.map((section) => (
        <section key={section.title} className="space-y-2">
          <h2 className="text-lg font-bold">{section.title}</h2>
          {section.paragraphs.map((paragraph) => <Paragraph key={paragraph} text={paragraph} />)}
        </section>
      ))}

      <footer className="flex flex-wrap gap-x-4 gap-y-2 border-t pt-4 text-sm">
        <Link href={other.path} className="font-semibold text-primary underline-offset-2 hover:underline">{other.title}</Link>
        <Link href="/planos" className="font-semibold text-primary underline-offset-2 hover:underline">Planos</Link>
        <Link href="/termos" className="text-muted-foreground underline-offset-2 hover:underline">Aviso de uso educativo do conteúdo</Link>
      </footer>
    </article>
  );
}
