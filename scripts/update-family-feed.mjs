// @ts-check
/**
 * update-family-feed.mjs — Atualização diária e gratuita do feed das famílias.
 *
 * 1. Notícias: busca RSS público do Google Notícias (pt-BR) por tema de
 *    neuropediatria (autismo, TDAH, linguagem, sono, desenvolvimento,
 *    epilepsia, paralisia cerebral, genética/neurogenética) — sem chave,
 *    sem custo.
 * 2. Instagram: busca o post mais recente de @drjadsonfraganeuroped.
 *    - Preferência: Instagram Graph API, se INSTAGRAM_ACCESS_TOKEN existir
 *      (gratuita; o token longo é renovado a cada execução).
 *    - Alternativa: endpoint público de perfil web (sem token).
 *    - A imagem é baixada para o repositório e servida pelo próprio site
 *      (compatível com a CSP img-src 'self').
 * 3. Persistência: o resultado é mesclado com o JSON já commitado. Falha de
 *    rede nunca apaga conteúdo anterior — o feed apenas deixa de avançar.
 *
 * Saídas:
 *   client/public/family-feed/novidades.json
 *   client/public/family-feed/instagram-latest.jpg (quando disponível)
 *
 * Uso: node scripts/update-family-feed.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(repoRoot, "client/public/family-feed");
const feedPath = join(outDir, "novidades.json");
const instagramImagePath = join(outDir, "instagram-latest.jpg");

const INSTAGRAM_USERNAME = "drjadsonfraganeuroped";
const INSTAGRAM_PROFILE_URL = `https://www.instagram.com/${INSTAGRAM_USERNAME}/`;
const MAX_ITEMS_PER_TOPIC = 8;
const MAX_ITEM_AGE_DAYS = 60;
const FETCH_TIMEOUT_MS = 20000;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Temas cobertos, com a consulta pt-BR usada no Google Notícias. */
const TOPICS = [
  { key: "autismo", label: "Autismo", emoji: "🧩", query: 'autismo criança OR "transtorno do espectro autista"' },
  { key: "tdah", label: "TDAH", emoji: "⚡", query: "TDAH criança OR adolescente" },
  { key: "linguagem", label: "Linguagem", emoji: "🗣️", query: '"desenvolvimento da linguagem" OR "atraso de fala" criança' },
  { key: "sono", label: "Sono infantil", emoji: "😴", query: '"sono infantil" OR "sono da criança"' },
  { key: "desenvolvimento", label: "Desenvolvimento", emoji: "🌱", query: '"atraso no desenvolvimento" OR "marcos do desenvolvimento" infantil' },
  { key: "epilepsia", label: "Epilepsia", emoji: "🧠", query: '"epilepsia infantil" OR "epilepsia" criança tratamento' },
  { key: "paralisia-cerebral", label: "Paralisia cerebral", emoji: "🦋", query: '"paralisia cerebral" criança' },
  { key: "genetica", label: "Genética", emoji: "🧬", query: 'neurogenética OR "doença rara" OR "síndrome genética" criança' },
];

function log(message) {
  console.log(`[family-feed] ${message}`);
}

function warn(message) {
  console.warn(`[family-feed] ⚠️ ${message}`);
}

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal, redirect: "follow" });
  } finally {
    clearTimeout(timer);
  }
}

function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function stripCdata(text) {
  return text.replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1");
}

function extractTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? decodeEntities(stripCdata(match[1].trim())).trim() : "";
}

/** Título do Google Notícias vem como "Título - Fonte"; remove o sufixo. */
function cleanTitle(title, source) {
  if (source && title.endsWith(` - ${source}`)) {
    return title.slice(0, -(source.length + 3)).trim();
  }
  return title;
}

function normalizeForDedupe(title) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseRssItems(xml) {
  const items = [];
  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const block = match[1];
    const source = extractTag(block, "source");
    const rawTitle = extractTag(block, "title");
    const link = extractTag(block, "link");
    const pubDate = extractTag(block, "pubDate");
    if (!rawTitle || !link) continue;
    const publishedAt = pubDate ? new Date(pubDate) : null;
    items.push({
      title: cleanTitle(rawTitle, source),
      url: link,
      source: source || "Google Notícias",
      publishedAt:
        publishedAt && !Number.isNaN(publishedAt.getTime())
          ? publishedAt.toISOString()
          : null,
    });
  }
  return items;
}

async function fetchTopicNews(topic) {
  const query = encodeURIComponent(`${topic.query} when:${MAX_ITEM_AGE_DAYS}d`);
  const url = `https://news.google.com/rss/search?q=${query}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
  const response = await fetchWithTimeout(url, {
    headers: { "user-agent": "NeuroPedFamilyFeed/1.0 (+https://neuroped.pages.dev)" },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return parseRssItems(await response.text());
}

function mergeTopicItems(freshItems, previousItems) {
  const cutoff = Date.now() - MAX_ITEM_AGE_DAYS * 24 * 60 * 60 * 1000;
  const seen = new Set();
  const merged = [];
  for (const item of [...freshItems, ...(previousItems ?? [])]) {
    if (!item?.title || !item?.url) continue;
    const key = normalizeForDedupe(item.title);
    if (!key || seen.has(key)) continue;
    if (item.publishedAt && new Date(item.publishedAt).getTime() < cutoff) continue;
    seen.add(key);
    merged.push({
      title: String(item.title).slice(0, 300),
      url: String(item.url),
      source: String(item.source ?? "").slice(0, 120),
      publishedAt: item.publishedAt ?? null,
    });
  }
  merged.sort((a, b) => {
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return tb - ta;
  });
  return merged.slice(0, MAX_ITEMS_PER_TOPIC);
}

async function downloadInstagramImage(mediaUrl) {
  const response = await fetchWithTimeout(mediaUrl, {
    headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
  });
  if (!response.ok) {
    throw new Error(`download HTTP ${response.status}`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`tipo inesperado: ${contentType}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new Error(`tamanho inesperado: ${bytes.byteLength} bytes`);
  }
  await writeFile(instagramImagePath, bytes);
  return bytes.byteLength;
}

/** Via oficial e gratuita: Instagram Graph API (token de longa duração). */
async function fetchInstagramViaGraph(token) {
  const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
  const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=5&access_token=${encodeURIComponent(token)}`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`Graph API HTTP ${response.status}`);
  }
  const payload = await response.json();
  const post = (payload?.data ?? []).find((item) =>
    ["IMAGE", "CAROUSEL_ALBUM", "VIDEO"].includes(item?.media_type),
  );
  if (!post) {
    throw new Error("Graph API sem posts elegíveis");
  }
  const imageUrl = post.media_type === "VIDEO" ? (post.thumbnail_url ?? post.media_url) : post.media_url;
  if (!imageUrl) {
    throw new Error("Graph API sem URL de mídia");
  }
  await downloadInstagramImage(imageUrl);
  return {
    permalink: post.permalink ?? INSTAGRAM_PROFILE_URL,
    caption: (post.caption ?? "").slice(0, 400),
    timestamp: post.timestamp ?? null,
    mediaType: post.media_type,
    source: "graph-api",
  };
}

/** Renova o token longo (validade de 60 dias) a cada execução diária. */
async function refreshInstagramToken(token) {
  const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`refresh HTTP ${response.status}`);
  }
  const payload = await response.json();
  if (!payload?.access_token) {
    throw new Error("refresh sem access_token");
  }
  const refreshFile = process.env.INSTAGRAM_TOKEN_REFRESH_FILE;
  if (refreshFile) {
    await writeFile(refreshFile, JSON.stringify({ access_token: payload.access_token }), {
      mode: 0o600,
    });
  }
  log(`Token do Instagram renovado (expira em ${Math.round((payload.expires_in ?? 0) / 86400)} dias).`);
}

/** Alternativa sem token: endpoint público de perfil usado pelo site web. */
async function fetchInstagramViaWebProfile() {
  const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${INSTAGRAM_USERNAME}`;
  const response = await fetchWithTimeout(url, {
    headers: {
      "x-ig-app-id": "936619743392459",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`perfil web HTTP ${response.status}`);
  }
  const payload = await response.json();
  const node = payload?.data?.user?.edge_owner_to_timeline_media?.edges?.[0]?.node;
  if (!node) {
    throw new Error("perfil web sem posts");
  }
  const imageUrl = node.is_video ? (node.thumbnail_src ?? node.display_url) : node.display_url;
  if (!imageUrl || !node.shortcode) {
    throw new Error("perfil web sem mídia utilizável");
  }
  await downloadInstagramImage(imageUrl);
  return {
    permalink: `https://www.instagram.com/p/${node.shortcode}/`,
    caption: (node.edge_media_to_caption?.edges?.[0]?.node?.text ?? "").slice(0, 400),
    timestamp: node.taken_at_timestamp
      ? new Date(node.taken_at_timestamp * 1000).toISOString()
      : null,
    mediaType: node.is_video ? "VIDEO" : "IMAGE",
    source: "web-profile",
  };
}

async function updateInstagram(previous) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (token) {
    try {
      const post = await fetchInstagramViaGraph(token);
      refreshInstagramToken(token).catch((error) =>
        warn(`Renovação do token do Instagram falhou: ${error.message}`),
      );
      log(`Instagram atualizado via Graph API (${post.permalink}).`);
      return { ...basicInstagramInfo(), ...post, image: "/family-feed/instagram-latest.jpg", fetchedAt: new Date().toISOString() };
    } catch (error) {
      warn(`Graph API do Instagram indisponível: ${error.message}`);
    }
  }
  try {
    const post = await fetchInstagramViaWebProfile();
    log(`Instagram atualizado via perfil público (${post.permalink}).`);
    return { ...basicInstagramInfo(), ...post, image: "/family-feed/instagram-latest.jpg", fetchedAt: new Date().toISOString() };
  } catch (error) {
    warn(`Perfil público do Instagram indisponível: ${error.message}`);
  }
  if (previous?.permalink) {
    warn("Mantendo o último post do Instagram já publicado (persistência).");
    return previous;
  }
  return basicInstagramInfo();
}

function basicInstagramInfo() {
  return {
    username: INSTAGRAM_USERNAME,
    profileUrl: INSTAGRAM_PROFILE_URL,
  };
}

async function readPreviousFeed() {
  try {
    return JSON.parse(await readFile(feedPath, "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const previous = await readPreviousFeed();
  const previousTopics = new Map(
    (previous?.topics ?? []).map((topic) => [topic.key, topic]),
  );

  const topics = [];
  let fetchedTopics = 0;
  for (const topic of TOPICS) {
    const previousTopic = previousTopics.get(topic.key);
    let freshItems = [];
    try {
      freshItems = await fetchTopicNews(topic);
      fetchedTopics += 1;
      log(`Tema "${topic.label}": ${freshItems.length} notícias recebidas.`);
    } catch (error) {
      warn(`Tema "${topic.label}" indisponível agora (${error.message}); mantendo itens anteriores.`);
    }
    topics.push({
      key: topic.key,
      label: topic.label,
      emoji: topic.emoji,
      items: mergeTopicItems(freshItems, previousTopic?.items),
      fetchedAt: freshItems.length > 0 ? new Date().toISOString() : (previousTopic?.fetchedAt ?? null),
    });
  }

  const instagram = await updateInstagram(previous?.instagram);

  const feed = {
    version: 1,
    app: "NeuroPed",
    description:
      "Feed educativo gratuito para famílias: notícias públicas em português sobre neuropediatria e o post mais recente do Instagram do consultório.",
    updatedAt: new Date().toISOString(),
    instagram,
    topics,
  };

  await writeFile(feedPath, `${JSON.stringify(feed, null, 2)}\n`);
  log(`Feed gravado em ${feedPath} (${fetchedTopics}/${TOPICS.length} temas atualizados).`);

  if (fetchedTopics === 0 && !previous) {
    throw new Error("Nenhuma fonte respondeu e não há feed anterior para preservar.");
  }
}

main().catch((error) => {
  console.error(`[family-feed] ❌ ${error.message}`);
  process.exitCode = 1;
});
