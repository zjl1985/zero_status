import type {
  ComponentStatus,
  Incident,
  ProviderStatus,
  StatusLevel,
  StatusResponse,
} from "./types";

const FETCH_TIMEOUT_MS = 10_000;
const UPSTREAM_REVALIDATE = 60;

async function fetchWithTimeout(url: string, accept: string): Promise<Response> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      Accept: accept,
      "User-Agent": "zero-status/1.0 (LLM status aggregator)",
    },
    next: { revalidate: UPSTREAM_REVALIDATE },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetchWithTimeout(url, "application/json");
  return (await res.json()) as T;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetchWithTimeout(url, "application/atom+xml, application/xml, text/xml, */*");
  return res.text();
}

// ---------------------------------------------------------------------------
// Statuspage.io 适配器（OpenAI / Anthropic / Perplexity / DeepSeek 等通用）
// ---------------------------------------------------------------------------

interface SpSummary {
  page: { name: string; url: string; updated_at: string };
  status: { indicator: string; description: string };
  components: SpComponent[];
  incidents: SpIncident[];
  scheduled_maintenances?: SpIncident[];
}

interface SpComponent {
  id: string;
  name: string;
  status: string;
  group?: boolean;
}

interface SpIncident {
  id: string;
  name: string;
  status: string;
  impact: string;
  shortlink?: string;
  created_at: string;
  updated_at: string;
}

const INDICATOR_MAP: Record<string, StatusLevel> = {
  none: "operational",
  minor: "degraded",
  major: "partial_outage",
  critical: "major_outage",
  maintenance: "maintenance",
};

const COMPONENT_MAP: Record<string, StatusLevel> = {
  operational: "operational",
  degraded_performance: "degraded",
  partial_outage: "partial_outage",
  major_outage: "major_outage",
  under_maintenance: "maintenance",
};

async function fetchStatuspage(base: string): Promise<{
  level: StatusLevel;
  headline: string;
  components: ComponentStatus[];
  incidents: Incident[];
}> {
  const data = await fetchJson<SpSummary>(`${base}/api/v2/summary.json`);

  const level = INDICATOR_MAP[data.status.indicator] ?? "unknown";

  const components = (data.components ?? [])
    .filter((c) => !c.group)
    .map((c) => ({ name: c.name, level: COMPONENT_MAP[c.status] ?? "unknown" as StatusLevel }))
    // 异常组件排前面，便于截断展示
    .sort((a, b) => rank(a.level) - rank(b.level));

  const incidents: Incident[] = [
    ...(data.incidents ?? []),
    ...(data.scheduled_maintenances ?? []),
  ].map((i) => ({
    name: i.name,
    status: i.status,
    createdAt: i.created_at,
    updatedAt: i.updated_at,
    url: i.shortlink,
  }));

  return { level, headline: data.status.description, components, incidents };
}

function rank(level: StatusLevel): number {
  const order: StatusLevel[] = [
    "major_outage",
    "partial_outage",
    "degraded",
    "maintenance",
    "unknown",
    "operational",
  ];
  return order.indexOf(level);
}

// ---------------------------------------------------------------------------
// Google 适配器：解析 status.cloud.google.com 的公开 Atom 事件流。
// 该源不含实时 indicator，只能根据最近事件更新时间做启发式推断。
// ---------------------------------------------------------------------------

interface AtomEntry {
  title: string;
  updated: string;
  link?: string;
  content: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function parseAtomFeed(xml: string): AtomEntry[] {
  const entries: AtomEntry[] = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(xml)) !== null) {
    const block = m[1];
    const title = stripTags(block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
    const updated = block.match(/<updated>([\s\S]*?)<\/updated>/)?.[1]?.trim() ?? "";
    const link = block.match(/<link[^>]*href="([^"]+)"/)?.[1];
    const content = stripTags(block.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] ?? "");
    if (title && updated) entries.push({ title, updated, link, content });
  }
  return entries;
}

const DAY_MS = 86_400_000;

async function fetchGoogle(): Promise<{
  level: StatusLevel;
  headline: string;
  components: ComponentStatus[];
  incidents: Incident[];
}> {
  const xml = await fetchText("https://status.cloud.google.com/feed.atom");
  const entries = parseAtomFeed(xml);
  const now = Date.now();

  const recent = entries.filter((e) => now - Date.parse(e.updated) < 3 * DAY_MS);
  const active = entries.filter((e) => {
    const age = now - Date.parse(e.updated);
    return age < DAY_MS && !/resolved|restored/i.test(e.content);
  });

  const level: StatusLevel = active.length > 0 ? "degraded" : "operational";
  const headline =
    active.length > 0
      ? `检测到 ${active.length} 起近期事件，可能有影响`
      : "所有系统运行正常";

  const incidents: Incident[] = entries.slice(0, 5).map((e) => ({
    name: e.title,
    status: /resolved|restored/i.test(e.content) ? "resolved" : "monitoring",
    createdAt: e.updated,
    updatedAt: e.updated,
    url: e.link,
  }));

  const components: ComponentStatus[] = [];

  return { level, headline, components, incidents };
}

// ---------------------------------------------------------------------------
// DeepSeek 适配器：status.deepseek.com 是 FlashCat 自建状态页（非 Statuspage），
// 数据以 RSC flight payload 形式内嵌在首页 HTML 中，这里直接解析。
// 页面逻辑：组件当前状态 = 未解决事件的 affected_components 中最严重等级。
// ---------------------------------------------------------------------------

const ACTIVE_IMPACT_MAP: Record<string, StatusLevel> = {
  operational: "operational",
  maintenance: "maintenance",
  degraded: "degraded",
  partial_outage: "partial_outage",
  full_outage: "major_outage",
};

interface FlashcatComponent {
  component_id: string;
  name: string;
}

interface FlashcatIncident {
  title: string;
  status: string;
  type?: string;
  start_at_seconds?: number;
  end_at_seconds?: number;
  affected_components?: { component_id: string; status?: string }[];
}

interface FlashcatData {
  components: Map<string, FlashcatComponent>;
  incidents: Map<string, FlashcatIncident>;
  initialData: {
    component_uptimes?: { component_id: string; uptime: number }[];
  } | null;
}

function parseFlashcatHtml(html: string): FlashcatData {
  const flight = [...html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)]
    .map((m) => JSON.parse(m[1]))
    .join("");

  const data: FlashcatData = {
    components: new Map(),
    incidents: new Map(),
    initialData: null,
  };

  const walk = (o: unknown): void => {
    if (!o || typeof o !== "object") return;
    const obj = o as Record<string, unknown>;
    if (Array.isArray(obj.component_uptimes)) {
      data.initialData = obj as FlashcatData["initialData"];
    }
    if (typeof obj.component_id === "string" && typeof obj.name === "string") {
      const comp: FlashcatComponent = {
        component_id: obj.component_id,
        name: obj.name,
      };
      data.components.set(comp.component_id, comp);
    }
    if (
      typeof obj.title === "string" &&
      ("start_at_seconds" in obj || "change_id" in obj)
    ) {
      const inc: FlashcatIncident = {
        title: obj.title,
        status: typeof obj.status === "string" ? obj.status : "unknown",
        type: typeof obj.type === "string" ? obj.type : undefined,
        start_at_seconds:
          typeof obj.start_at_seconds === "number" ? obj.start_at_seconds : undefined,
        end_at_seconds:
          typeof obj.end_at_seconds === "number" ? obj.end_at_seconds : undefined,
        affected_components: Array.isArray(obj.affected_components)
          ? (obj.affected_components as FlashcatIncident["affected_components"])
          : undefined,
      };
      const id = String(obj.change_id ?? obj.title);
      if (!data.incidents.has(id)) data.incidents.set(id, inc);
    }
    for (const k in obj) walk(obj[k]);
  };

  for (const line of flight.split("\n")) {
    const ci = line.indexOf(":");
    if (ci === -1) continue;
    const payload = line.slice(ci + 1);
    if (payload.startsWith("{") || payload.startsWith("[")) {
      try {
        walk(JSON.parse(payload));
      } catch {
        // 非 JSON 行（如引用占位），跳过
      }
    }
  }
  return data;
}

async function fetchDeepseek(): Promise<{
  level: StatusLevel;
  headline: string;
  components: ComponentStatus[];
  incidents: Incident[];
}> {
  const html = await fetchText("https://status.deepseek.com/");
  const data = parseFlashcatHtml(html);
  if (data.components.size === 0) throw new Error("页面中未找到状态数据");

  const uptimeOf = new Map(
    (data.initialData?.component_uptimes ?? []).map((u) => [u.component_id, u.uptime]),
  );

  const components: ComponentStatus[] = [];
  let worst: StatusLevel = "operational";
  for (const comp of data.components.values()) {
    let level: StatusLevel = "operational";
    for (const inc of data.incidents.values()) {
      if (inc.status === "resolved" || inc.status === "completed") continue;
      for (const aff of inc.affected_components ?? []) {
        if (aff.component_id !== comp.component_id) continue;
        const mapped = ACTIVE_IMPACT_MAP[aff.status ?? ""] ?? "degraded";
        if (rank(mapped) < rank(level)) level = mapped;
      }
    }
    if (rank(level) < rank(worst)) worst = level;
    components.push({
      name: comp.name,
      level,
      uptime: uptimeOf.get(comp.component_id),
    });
  }
  components.sort((a, b) => rank(a.level) - rank(b.level));

  const bad = components.filter((c) => c.level !== "operational");
  const headline =
    bad.length === 0 ? "所有系统运行正常" : `${bad.length} 个组件异常`;

  const incidents: Incident[] = [...data.incidents.values()]
    .sort((a, b) => (b.start_at_seconds ?? 0) - (a.start_at_seconds ?? 0))
    .slice(0, 5)
    .map((i) => ({
      name: i.title,
      status: i.status,
      createdAt: new Date((i.start_at_seconds ?? 0) * 1000).toISOString(),
      updatedAt: new Date((i.end_at_seconds ?? i.start_at_seconds ?? 0) * 1000).toISOString(),
    }));

  return { level: worst, headline, components, incidents };
}

// ---------------------------------------------------------------------------
// xAI 适配器：status.x.ai 的 HTML 页面有 Cloudflare 防护，但官方文档提供的
// RSS feed（status.x.ai/feed.xml）不设防。feed 只含事件历史，当前状态按
// "是否存在未解决事件"启发式推断。
// ---------------------------------------------------------------------------

const XAI_SEVERITY_MAP: Record<string, StatusLevel> = {
  outage: "major_outage",
  disruption: "partial_outage",
  degradation: "degraded",
  maintenance: "maintenance",
};

interface XaiItem {
  title: string;
  link?: string;
  pubDate: string;
  categories: string[];
  status?: string; // description 中的 Status: X
  severity?: string;
}

function parseRssItems(xml: string): XaiItem[] {
  const items: XaiItem[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const cdata = (s: string) => s.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
    const title = stripTags(cdata(block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ""));
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim();
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";
    const categories = [...block.matchAll(/<category>([\s\S]*?)<\/category>/g)].map((c) =>
      stripTags(cdata(c[1])).toLowerCase(),
    );
    const descHtml = cdata(block.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? "");
    const status = stripTags(descHtml.match(/<h3>Status:\s*([^<]+)<\/h3>/i)?.[1] ?? "")
      .toLowerCase();
    const severity = stripTags(descHtml.match(/Severity:\s*([a-z]+)/i)?.[1] ?? "")
      .toLowerCase();
    if (title) items.push({ title, link, pubDate, categories, status, severity });
  }
  return items;
}

async function fetchXai(): Promise<{
  level: StatusLevel;
  headline: string;
  components: ComponentStatus[];
  incidents: Incident[];
}> {
  const xml = await fetchText("https://status.x.ai/feed.xml");
  const items = parseRssItems(xml);

  const isResolved = (i: XaiItem) =>
    i.status === "resolved" || i.categories.includes("resolved");

  const active = items.filter((i) => !isResolved(i));
  let level: StatusLevel = "operational";
  for (const i of active) {
    const mapped = XAI_SEVERITY_MAP[i.severity ?? ""] ?? "degraded";
    if (rank(mapped) < rank(level)) level = mapped;
  }

  const headline =
    active.length === 0
      ? "所有系统运行正常"
      : `${active.length} 起事件处理中`;

  const incidents: Incident[] = items.slice(0, 5).map((i) => ({
    name: i.title,
    status: isResolved(i) ? "resolved" : i.status || "monitoring",
    createdAt: new Date(Date.parse(i.pubDate) || Date.now()).toISOString(),
    updatedAt: new Date(Date.parse(i.pubDate) || Date.now()).toISOString(),
    url: i.link,
  }));

  const components: ComponentStatus[] = [];

  return { level, headline, components, incidents };
}

// ---------------------------------------------------------------------------
// 厂商注册表
// ---------------------------------------------------------------------------

interface ProviderDef {
  id: string;
  name: string;
  homepage: string;
  statusPage: string;
  source: string;
  fetch: () => Promise<{
    level: StatusLevel;
    headline: string;
    components: ComponentStatus[];
    incidents: Incident[];
  }>;
}

export const PROVIDERS: ProviderDef[] = [
  {
    id: "openai",
    name: "OpenAI",
    homepage: "https://openai.com",
    statusPage: "https://status.openai.com",
    source: "官方状态页",
    fetch: () => fetchStatuspage("https://status.openai.com"),
  },
  {
    id: "anthropic",
    name: "Anthropic",
    homepage: "https://www.anthropic.com",
    statusPage: "https://status.anthropic.com",
    source: "官方状态页",
    fetch: () => fetchStatuspage("https://status.anthropic.com"),
  },
  {
    id: "google-gemini",
    name: "Google Gemini / Vertex AI",
    homepage: "https://gemini.google.com",
    statusPage: "https://status.cloud.google.com",
    source: "Google Cloud 事件流（推断）",
    fetch: fetchGoogle,
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    homepage: "https://x.ai",
    statusPage: "https://status.x.ai",
    source: "官方状态页 RSS（推断）",
    fetch: fetchXai,
  },
  {
    id: "perplexity",
    name: "Perplexity",
    homepage: "https://www.perplexity.ai",
    statusPage: "https://status.perplexity.com",
    source: "官方状态页",
    fetch: () => fetchStatuspage("https://status.perplexity.com"),
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    homepage: "https://www.deepseek.com",
    statusPage: "https://status.deepseek.com",
    source: "官方状态页（FlashCat）",
    fetch: fetchDeepseek,
  },
];

// ---------------------------------------------------------------------------
// 聚合入口
// ---------------------------------------------------------------------------

export async function getStatuses(): Promise<StatusResponse> {
  const checkedAt = new Date().toISOString();
  const results = await Promise.allSettled(PROVIDERS.map((p) => p.fetch()));

  const providers: ProviderStatus[] = results.map((r, i) => {
    const meta = PROVIDERS[i];
    if (r.status === "fulfilled") {
      return {
        id: meta.id,
        name: meta.name,
        homepage: meta.homepage,
        statusPage: meta.statusPage,
        source: meta.source,
        checkedAt,
        ...r.value,
      };
    }
    const reason = r.reason instanceof Error ? r.reason.message : String(r.reason);
    return {
      id: meta.id,
      name: meta.name,
      homepage: meta.homepage,
      statusPage: meta.statusPage,
      source: meta.source,
      checkedAt,
      level: "unknown",
      headline: "无法获取状态",
      components: [],
      incidents: [],
      error: reason,
    };
  });

  return { ok: true, generatedAt: checkedAt, providers };
}
