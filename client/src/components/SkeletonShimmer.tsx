import { motion } from "framer-motion";
import { Brain, FileText, Users, FlaskConical } from "lucide-react";

/**
 * Skeleton com efeito shimmer (gradiente animado).
 *
 * Variantes:
 *  - card    bloco com header + 3 linhas
 *  - list    3 items com avatar + 2 linhas
 *  - table   header + 5 linhas tipo tabela
 *  - page    titulo + 2 paragrafos
 *  - patient cartao de paciente
 *  - report  layout de relatorio clinico
 */

export function SkeletonShimmer({
  variant = "card",
  count = 1,
  className = "",
}: {
  variant?: "card" | "list" | "table" | "page" | "patient" | "report";
  count?: number;
  className?: string;
}) {
  const items = Array.from({ length: count });

  if (variant === "card") {
    return (
      <div className={`space-y-3 ${className}`}>
        {items.map((_, i) => (
          <ShimmerCard key={i} />
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={`space-y-2 ${className}`}>
        {items.map((_, i) => (
          <ShimmerListItem key={i} />
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return <ShimmerTable rows={5} className={className} />;
  }

  if (variant === "page") {
    return <ShimmerPage className={className} />;
  }

  if (variant === "patient") {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
        {items.map((_, i) => (
          <ShimmerPatient key={i} />
        ))}
      </div>
    );
  }

  if (variant === "report") {
    return <ShimmerReport className={className} />;
  }

  return null;
}

const baseClass = "rounded-md bg-gradient-to-r from-muted/30 via-muted/60 to-muted/30 bg-[length:200%_100%]";

const shimmerAnim = {
  backgroundPosition: ["200% 0", "-200% 0"],
};

const shimmerTrans = {
  duration: 1.6,
  repeat: Infinity,
  ease: "linear" as const,
};

function ShimmerCard() {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4 space-y-3" aria-hidden="true">
      <motion.div animate={shimmerAnim} transition={shimmerTrans} className={`h-5 w-1/3 ${baseClass}`} />
      <motion.div animate={shimmerAnim} transition={shimmerTrans} className={`h-3 w-full ${baseClass}`} />
      <motion.div animate={shimmerAnim} transition={shimmerTrans} className={`h-3 w-4/5 ${baseClass}`} />
      <motion.div animate={shimmerAnim} transition={shimmerTrans} className={`h-3 w-2/3 ${baseClass}`} />
    </div>
  );
}

function ShimmerListItem() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-card-border bg-card" aria-hidden="true">
      <motion.div animate={shimmerAnim} transition={shimmerTrans} className={`w-10 h-10 rounded-full shrink-0 ${baseClass}`} />
      <div className="flex-1 space-y-2">
        <motion.div animate={shimmerAnim} transition={shimmerTrans} className={`h-4 w-1/2 ${baseClass}`} />
        <motion.div animate={shimmerAnim} transition={shimmerTrans} className={`h-3 w-3/4 ${baseClass}`} />
      </div>
    </div>
  );
}

function ShimmerTable({ rows = 5, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`rounded-xl border border-card-border bg-card overflow-hidden ${className}`} aria-hidden="true">
      <div className="grid grid-cols-4 gap-3 p-4 border-b border-card-border bg-muted/30">
        {[0, 1, 2, 3].map((i) => (
          <motion.div key={i} animate={shimmerAnim} transition={shimmerTrans} className={`h-3 ${baseClass}`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid grid-cols-4 gap-3 p-4 border-b border-card-border last:border-0">
          {[0, 1, 2, 3].map((c) => (
            <motion.div
              key={c}
              animate={shimmerAnim}
              transition={shimmerTrans}
              className={`h-4 ${baseClass}`}
              style={{ width: `${60 + ((r * c) % 35)}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function ShimmerPage({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`} aria-hidden="true">
      <div className="flex items-center gap-3">
        <motion.div animate={shimmerAnim} transition={shimmerTrans} className={`w-10 h-10 rounded-xl ${baseClass}`} />
        <div className="flex-1 space-y-2">
          <motion.div animate={shimmerAnim} transition={shimmerTrans} className={`h-5 w-1/3 ${baseClass}`} />
          <motion.div animate={shimmerAnim} transition={shimmerTrans} className={`h-3 w-1/2 ${baseClass}`} />
        </div>
      </div>
      <ShimmerCard />
      <ShimmerCard />
    </div>
  );
}

function ShimmerPatient() {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4 space-y-3" aria-hidden="true">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <motion.div animate={shimmerAnim} transition={shimmerTrans} className={`h-5 w-2/3 ${baseClass}`} />
          <motion.div animate={shimmerAnim} transition={shimmerTrans} className={`h-3 w-1/3 ${baseClass}`} />
          <motion.div animate={shimmerAnim} transition={shimmerTrans} className={`h-2.5 w-1/2 ${baseClass}`} />
        </div>
        <motion.div animate={shimmerAnim} transition={shimmerTrans} className={`w-7 h-7 rounded-full ${baseClass}`} />
      </div>
      <motion.div animate={shimmerAnim} transition={shimmerTrans} className={`h-8 w-full rounded-md ${baseClass}`} />
    </div>
  );
}

function ShimmerReport({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`} aria-hidden="true">
      <div className="rounded-xl border border-card-border bg-card p-6 space-y-3">
        <motion.div animate={shimmerAnim} transition={shimmerTrans} className={`h-6 w-1/2 ${baseClass}`} />
        <motion.div animate={shimmerAnim} transition={shimmerTrans} className={`h-3 w-1/3 ${baseClass}`} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-card-border bg-card p-4 space-y-2">
            <motion.div animate={shimmerAnim} transition={shimmerTrans} className={`h-3 w-1/3 ${baseClass}`} />
            <motion.div animate={shimmerAnim} transition={shimmerTrans} className={`h-7 w-2/3 ${baseClass}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Empty state premium com ilustracao opcional + CTA.
 */
export function EmptyState({
  icon: Icon = Brain,
  title,
  description,
  action,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center text-center py-16 px-6 space-y-4"
    >
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-30"
          style={{ background: "hsl(var(--primary))" }}
        />
        <div
          className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--chart-2) / 0.1))",
            border: "1px solid hsl(var(--primary) / 0.2)",
          }}
        >
          <Icon className="w-7 h-7" style={{ color: "hsl(var(--primary))" }} />
        </div>
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-base font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 active:scale-95"
          style={{
            background: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
          }}
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
