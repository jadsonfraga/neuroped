import { useEffect, useState, type FormEvent } from "react";
import { Check, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/lib/authClient";
import { invalidateIssuerCache } from "@/lib/issuer";
import {
  BRANDING_LIMITS,
  DEFAULT_PDF_ACCENT_HEX,
  DEFAULT_PDF_BAND_HEX,
  decodeLogoDataUri,
  validateBrandingInput,
  type ClinicBranding,
} from "@shared/clinic-branding";

/** Marca própria da clínica: logo, cores, cabeçalho e rodapé dos documentos. Só quem gere a clínica altera. */
export function BrandingSection({ clinicId, clinicName, initial, canEdit, onSaved }: {
  clinicId: string;
  clinicName: string;
  initial: ClinicBranding | undefined;
  canEdit: boolean;
  onSaved?: (branding: ClinicBranding) => void;
}) {
  const { toast } = useToast();
  const [primary, setPrimary] = useState(initial?.primaryColor ?? "");
  const [accent, setAccent] = useState(initial?.accentColor ?? "");
  const [header, setHeader] = useState(initial?.headerText ?? "");
  const [footer, setFooter] = useState(initial?.footerText ?? "");
  const [logo, setLogo] = useState<string | null>(initial?.logoDataUri ?? null);
  const [logoTouched, setLogoTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPrimary(initial?.primaryColor ?? ""); setAccent(initial?.accentColor ?? "");
    setHeader(initial?.headerText ?? ""); setFooter(initial?.footerText ?? "");
    setLogo(initial?.logoDataUri ?? null); setLogoTouched(false);
  }, [initial]);

  const draft = { primaryColor: primary || null, accentColor: accent || null, headerText: header, footerText: footer, ...(logoTouched || logo ? { logoDataUri: logo } : {}) };
  const check = validateBrandingInput(draft);

  function onLogoFile(file: File | undefined) {
    if (!file) return;
    if (file.size > BRANDING_LIMITS.maxLogoBytes) { setError("Logo acima de 150 KB. Reduza a imagem e tente de novo."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? "");
      if (!decodeLogoDataUri(value)) { setError("Logo inválido: use PNG ou JPEG (SVG não é aceito)."); return; }
      setError(null); setLogo(value); setLogoTouched(true);
    };
    reader.readAsDataURL(file);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!check.ok) { setError(check.message); return; }
    setSaving(true); setError(null);
    try {
      const response = await authFetch(`/api/tenants/${clinicId}`, {
        method: "PATCH",
        body: JSON.stringify({ branding: { ...draft, ...(logoTouched ? { logoDataUri: logo } : logo ? { logoDataUri: logo } : {}) } }),
      });
      const payload = (await response.json().catch(() => null)) as ({ error?: string; branding?: ClinicBranding }) | null;
      if (!response.ok) throw new Error(payload?.error || `Falha ao salvar (${response.status}).`);
      invalidateIssuerCache();
      if (payload?.branding) onSaved?.(payload.branding);
      setLogoTouched(false);
      toast({ title: "Marca da clínica atualizada ✓" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally { setSaving(false); }
  }

  const band = (check.ok && check.value.primaryColor) || DEFAULT_PDF_BAND_HEX;
  const accentShown = (check.ok && check.value.accentColor) || (primary ? "#ffffff" : DEFAULT_PDF_ACCENT_HEX);

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5" data-testid="branding-section">
      <div>
        <h2 className="text-base font-semibold">Marca da clínica nos documentos</h2>
        <p className="text-sm text-muted-foreground">
          {canEdit ? "Logo, cores, cabeçalho e rodapé aplicados à moldura dos documentos e laudos desta clínica. O conteúdo clínico não é alterado." : "Somente proprietário(a) e administrador(a) alteram a marca."}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border" data-testid="branding-preview" aria-label="Pré-visualização do cabeçalho do documento">
        <div style={{ background: band, borderBottom: `3px solid ${accentShown}` }} className="flex items-center gap-3 p-4 text-white">
          {logo && <img src={logo} alt="Logo da clínica" className="h-12 w-12 rounded bg-white/90 object-contain p-1" data-testid="branding-preview-logo" />}
          <div>
            <p className="text-lg font-semibold" style={{ fontFamily: "serif" }}>Laudo (exemplo)</p>
            <p className="text-xs" style={{ color: accentShown }}>{clinicName}</p>
          </div>
        </div>
        <div className="space-y-1 bg-[#f8f5ef] p-3 text-xs text-slate-700">
          {header && <p className="font-semibold" data-testid="branding-preview-header" style={{ color: band }}>{header}</p>}
          <p>Conteúdo do documento (não alterado pela marca).</p>
          {footer && <p className="text-[11px] text-slate-500" data-testid="branding-preview-footer">{footer}</p>}
        </div>
      </div>

      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="brand-primary">Cor primária (faixa do cabeçalho)</Label>
            <div className="flex gap-2">
              <input aria-label="Seletor da cor primária" type="color" disabled={!canEdit} value={primary || DEFAULT_PDF_BAND_HEX} onChange={(e) => setPrimary(e.target.value)} className="h-9 w-12 rounded border" />
              <Input id="brand-primary" disabled={!canEdit} placeholder="#0b1f3a" maxLength={7} value={primary} onChange={(e) => setPrimary(e.target.value)} data-testid="brand-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-accent">Cor de destaque (filetes)</Label>
            <div className="flex gap-2">
              <input aria-label="Seletor da cor de destaque" type="color" disabled={!canEdit} value={accent || DEFAULT_PDF_ACCENT_HEX} onChange={(e) => setAccent(e.target.value)} className="h-9 w-12 rounded border" />
              <Input id="brand-accent" disabled={!canEdit} placeholder="#c9a24a" maxLength={7} value={accent} onChange={(e) => setAccent(e.target.value)} data-testid="brand-accent" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand-header">Cabeçalho (linha sob o título)</Label>
          <Input id="brand-header" disabled={!canEdit} maxLength={BRANDING_LIMITS.maxHeaderText} value={header} onChange={(e) => setHeader(e.target.value)} data-testid="brand-header" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand-footer">Rodapé (texto institucional)</Label>
          <Input id="brand-footer" disabled={!canEdit} maxLength={BRANDING_LIMITS.maxFooterText} value={footer} onChange={(e) => setFooter(e.target.value)} data-testid="brand-footer" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand-logo">Logo (PNG ou JPEG, até 150 KB)</Label>
          <div className="flex items-center gap-2">
            <input id="brand-logo" type="file" accept="image/png,image/jpeg" disabled={!canEdit} onChange={(e) => onLogoFile(e.target.files?.[0])} data-testid="brand-logo-input" />
            {logo && canEdit && <Button type="button" variant="ghost" size="sm" onClick={() => { setLogo(null); setLogoTouched(true); }}><Trash2 className="mr-1 h-4 w-4" />Remover</Button>}
          </div>
        </div>
        {!check.ok && <p role="status" className="text-xs text-amber-700" data-testid="brand-warning">{check.message}</p>}
        {error && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs text-destructive" data-testid="brand-error">{error}</p>}
        {canEdit && (
          <Button type="submit" disabled={saving || !check.ok} className="gap-2" data-testid="brand-save">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
            Salvar marca
          </Button>
        )}
      </form>
    </section>
  );
}
