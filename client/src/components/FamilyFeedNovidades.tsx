import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw, Rss } from "lucide-react";

/** Glifo do Instagram (o lucide-react atual não distribui ícones de marca). */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export interface FamilyFeedItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string | null;
}

export interface FamilyFeedTopic {
  key: string;
  label: string;
  emoji: string;
  items: FamilyFeedItem[];
  fetchedAt?: string | null;
}

export interface FamilyFeedInstagram {
  username: string;
  profileUrl: string;
  permalink?: string;
  caption?: string;
  timestamp?: string | null;
  image?: string;
  fetchedAt?: string;
  mediaType?: string;
}

export interface FamilyFeed {
  version: number;
  updatedAt: string;
  instagram: FamilyFeedInstagram;
  topics: FamilyFeedTopic[];
}

const FEED_URL = "/family-feed/novidades.json";
const INSTAGRAM_FALLBACK: FamilyFeedInstagram = {
  username: "drjadsonfraganeuroped",
  profileUrl: "https://www.instagram.com/drjadsonfraganeuroped/",
};

export function useFamilyFeed() {
  return useQuery<FamilyFeed>({
    queryKey: ["family-feed-novidades"],
    staleTime: 60 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      const res = await fetch(FEED_URL, { cache: "no-cache" });
      if (!res.ok) throw new Error("Feed de novidades indisponível.");
      return res.json();
    },
  });
}

function fmtDatePt(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}

/**
 * Último post do Instagram do consultório, com link direto para o perfil.
 * A imagem é servida pelo próprio site (atualizada diariamente por automação);
 * sem imagem disponível, o cartão mantém o link direto para o perfil.
 */
export function InstagramLatestCard() {
  const { data } = useFamilyFeed();
  const instagram = data?.instagram ?? INSTAGRAM_FALLBACK;
  const imageSrc = instagram.image
    ? `${instagram.image}?v=${encodeURIComponent(instagram.fetchedAt ?? data?.updatedAt ?? "1")}`
    : null;
  const postDate = fmtDatePt(instagram.timestamp);

  return (
    <Card className="overflow-hidden border-pink-500/20 bg-gradient-to-br from-pink-500/[0.08] via-fuchsia-500/[0.05] to-amber-400/[0.06]">
      <CardContent className="p-0">
        {imageSrc && (
          <a
            href={instagram.permalink ?? instagram.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir o post mais recente no Instagram"
            className="block"
          >
            <img
              src={imageSrc}
              alt={`Post mais recente de @${instagram.username} no Instagram`}
              loading="lazy"
              className="max-h-80 w-full object-cover"
            />
          </a>
        )}
        <div className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-amber-400 shadow-sm">
              <InstagramIcon className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight text-foreground">
                @{instagram.username}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {postDate
                  ? `Post mais recente · ${postDate}`
                  : "Instagram do consultório"}
              </p>
            </div>
            <Badge
              variant="secondary"
              className="ml-auto gap-1 text-[10px] uppercase tracking-wide"
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" /> Atualização
              diária
            </Badge>
          </div>
          {instagram.caption && (
            <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
              {instagram.caption}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {instagram.permalink && (
              <Button asChild size="sm" className="gap-1.5 rounded-xl">
                <a
                  href={instagram.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver post no Instagram
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </Button>
            )}
            <Button
              asChild
              size="sm"
              variant={instagram.permalink ? "outline" : "default"}
              className="gap-1.5 rounded-xl"
            >
              <a
                href={instagram.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <InstagramIcon className="h-3.5 w-3.5" /> Seguir o
                perfil
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Novidades públicas em português sobre neuropediatria, por tema, renovadas
 * diariamente por automação gratuita (fontes abertas + Google Notícias).
 */
export function FamilyNewsFeed() {
  const { data, isLoading } = useFamilyFeed();
  const [topicKey, setTopicKey] = useState("todos");
  const topics = useMemo(() => data?.topics ?? [], [data]);

  const visibleItems = useMemo(() => {
    const selected =
      topicKey === "todos"
        ? topics.flatMap((t) =>
            t.items.map((item) => ({ ...item, topic: t })),
          )
        : (topics.find((t) => t.key === topicKey)?.items ?? []).map(
            (item) => ({
              ...item,
              topic: topics.find((t) => t.key === topicKey),
            }),
          );
    return [...selected]
      .sort((a, b) => {
        const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return tb - ta;
      })
      .slice(0, topicKey === "todos" ? 24 : 12);
  }, [topics, topicKey]);

  return (
    <section className="space-y-4" aria-label="Novidades em neuropediatria">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Rss className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-foreground">
            Novidades em neuropediatria
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Fontes públicas e gratuitas em português
            {data?.updatedAt
              ? ` · atualizado em ${fmtDatePt(data.updatedAt)}`
              : ""}
          </p>
        </div>
        <Badge
          variant="secondary"
          className="ml-auto gap-1 text-[10px] uppercase tracking-wide"
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" /> Automático
        </Badge>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setTopicKey("todos")}
          aria-pressed={topicKey === "todos"}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            topicKey === "todos"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/60 text-muted-foreground hover:bg-muted"
          }`}
        >
          Todos
        </button>
        {topics.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTopicKey(t.key)}
            aria-pressed={topicKey === t.key}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              topicKey === t.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            <span className="mr-1" aria-hidden>
              {t.emoji}
            </span>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <p className="text-xs text-muted-foreground">Carregando novidades…</p>
      )}
      {!isLoading && visibleItems.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhuma novidade disponível agora. As fontes são consultadas
          novamente todos os dias.
        </p>
      )}

      <div className="grid gap-2.5 sm:grid-cols-2">
        {visibleItems.map((item) => (
          <a
            key={`${item.url}-${item.title}`}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardContent className="space-y-1.5 p-4">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  {item.topic && (
                    <span aria-hidden>{item.topic.emoji}</span>
                  )}
                  <span className="truncate font-medium">
                    {item.source || item.topic?.label}
                  </span>
                  {item.publishedAt && (
                    <span className="ml-auto shrink-0">
                      {fmtDatePt(item.publishedAt)}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold leading-snug text-foreground">
                  {item.title}
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] text-primary">
                  Ler na fonte
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        As notícias abrem em sites externos gratuitos e não passam por curadoria
        clínica individual. Conteúdo educativo — não substitui avaliação
        profissional.
      </p>
    </section>
  );
}
