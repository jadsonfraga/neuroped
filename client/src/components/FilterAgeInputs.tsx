import { Input } from "@/components/ui/input";
import type { ExactFilterAge, ResolvedFilterAge } from "@/lib/filterClinicalInput";
interface Props { value: ExactFilterAge; onChange: (value: ExactFilterAge) => void; resolved: ResolvedFilterAge }
export function FilterAgeInputs({ value, onChange, resolved }: Props) {
  const invalid = resolved.status === "invalid";
  return (
    <fieldset className="space-y-2 rounded-xl border border-border/60 p-3">
      <legend className="px-1 text-xs font-semibold">Idade exata · opcional</legend>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label htmlFor="filter-age-years" className="text-xs font-medium">Anos completos</label>
          <Input id="filter-age-years" data-testid="filter-age-years" inputMode="numeric"
            autoComplete="off" maxLength={3} value={value.years} placeholder="Ex.: 5"
            onChange={(event) => onChange({ ...value, years: event.target.value })}
            aria-invalid={invalid} aria-describedby="filter-age-help filter-age-status" className="h-10 rounded-xl" />
        </div>
        <div className="space-y-1">
          <label htmlFor="filter-age-months" className="text-xs font-medium">Meses adicionais</label>
          <Input id="filter-age-months" data-testid="filter-age-months" inputMode="numeric"
            autoComplete="off" maxLength={3} value={value.months} placeholder="0 a 11"
            onChange={(event) => onChange({ ...value, months: event.target.value })}
            aria-invalid={invalid} aria-describedby="filter-age-help filter-age-status" className="h-10 rounded-xl" />
        </div>
      </div>
      <p id="filter-age-help" className="text-xs text-muted-foreground">
        Ao preencher um campo, o outro vazio vale zero. Ambos vazios: idade não informada nestes campos.
        A idade dos campos tem prioridade sobre a busca.
      </p>
      <p id="filter-age-status" data-testid="filter-age-status" role="status" aria-live="polite" aria-atomic="true"
        className={`text-xs leading-relaxed ${invalid ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
        <strong>{resolved.label}</strong> · {resolved.message}
      </p>
      {(value.years || value.months) && (
        <button type="button" onClick={() => onChange({ years: "", months: "" })}
          className="min-h-9 text-xs font-semibold text-primary underline underline-offset-2">Limpar idade exata</button>
      )}
    </fieldset>
  );
}
