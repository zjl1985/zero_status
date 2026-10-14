"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { StatusLevel, StatusResponse } from "@/lib/types";
import ProviderCard from "./ProviderCard";
import { RefreshCw, Search, X, Radio, Globe } from "lucide-react";
import {
  formatTimeAgo,
  getLevelMeta,
  I18nProvider,
  translateHeadline,
  useI18n,
} from "@/lib/i18n";

const SEVERITY: StatusLevel[] = [
  "major_outage",
  "partial_outage",
  "degraded",
  "maintenance",
  "unknown",
  "operational",
];

type FilterTab = "all" | "issues" | "operational";

function TimeAgo({ iso }: { iso: string }) {
  const { locale } = useI18n();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  if (now === null) return <span suppressHydrationWarning>—</span>;

  return (
    <span suppressHydrationWarning>
      {formatTimeAgo(iso, now, locale)}
    </span>
  );
}

function StatusBoardInner({ initial }: { initial: StatusResponse }) {
  const { locale, setLocale, t } = useI18n();
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [auto, setAuto] = useState(true);
  const [query, setQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // 保留旧数据
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(refresh, 60_000);
    return () => clearInterval(timer);
  }, [auto, refresh]);

  const totalProviders = data.providers.length;
  const operationalCount = data.providers.filter(
    (p) => p.level === "operational",
  ).length;
  const issueCount = data.providers.filter(
    (p) => p.level !== "operational" && p.level !== "unknown",
  ).length;

  const abnormalProviders = data.providers.filter(
    (p) => p.level !== "operational" && p.level !== "unknown",
  );

  const worst =
    data.providers
      .map((p) => p.level)
      .sort((a, b) => SEVERITY.indexOf(a) - SEVERITY.indexOf(b))[0] ||
    "operational";

  const allOk = issueCount === 0;
  const worstMeta = getLevelMeta(worst, locale);

  // 过滤逻辑（支持双语状态、标题、名称筛选）
  const filteredProviders = useMemo(() => {
    return data.providers.filter((p) => {
      if (filterTab === "issues" && p.level === "operational") return false;
      if (filterTab === "operational" && p.level !== "operational") return false;

      if (!query.trim()) return true;
      const q = query.toLowerCase().trim();
      const headlineI18n = translateHeadline(p.headline, locale).toLowerCase();
      const meta = getLevelMeta(p.level, locale);

      return (
        p.name.toLowerCase().includes(q) ||
        p.headline.toLowerCase().includes(q) ||
        headlineI18n.includes(q) ||
        meta.label.toLowerCase().includes(q) ||
        p.components.some((c) => c.name.toLowerCase().includes(q)) ||
        p.incidents.some((i) => i.name.toLowerCase().includes(q))
      );
    });
  }, [data.providers, filterTab, query, locale]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      {/* 顶部标题与控制 */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-50/70 shadow-xs">
            <Radio className="h-5 w-5 text-emerald-600" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">
              LLM Status
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span>
            {t.updated} <TimeAgo iso={data.generatedAt} />
          </span>
          <span className="text-zinc-300">·</span>
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-800 accent-zinc-800 focus:ring-0"
            />
            <span>{t.autoRefresh}</span>
          </label>
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`h-3 w-3 ${loading ? "animate-spin text-zinc-800" : ""}`}
            />
            <span>{loading ? t.refreshing : t.refresh}</span>
          </button>
          <span className="text-zinc-300">·</span>
          {/* 中英文语言切换按钮 */}
          <div className="inline-flex items-center rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-0.5 text-xs">
            <Globe className="h-3 w-3 text-zinc-400 ml-1.5 mr-1" />
            <button
              onClick={() => setLocale("zh")}
              className={`rounded-md px-2 py-0.5 font-medium transition cursor-pointer ${
                locale === "zh"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              中文
            </button>
            <button
              onClick={() => setLocale("en")}
              className={`rounded-md px-2 py-0.5 font-medium transition cursor-pointer ${
                locale === "en"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Hero 状态总览横幅 */}
      <div
        className={`mt-6 flex items-center justify-between rounded-xl border p-4 transition ${worstMeta.bg} ${worstMeta.border}`}
      >
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${worstMeta.dot}`} />
          <div>
            <p className={`text-sm font-medium ${worstMeta.text}`}>
              {allOk ? t.allNormal : t.issuesDetected(issueCount)}
            </p>
            {!allOk && (
              <p className="mt-0.5 text-xs text-zinc-600">
                {t.affectedProviders}
                {abnormalProviders
                  .map((p) => p.name)
                  .join(locale === "zh" ? "、" : ", ")}
              </p>
            )}
          </div>
        </div>

        <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
          {t.operationalSummary(operationalCount, totalProviders)}
        </span>
      </div>

      {/* 工具栏：分段控件 + 搜索框 */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* 分段过滤控件 */}
        <div className="inline-flex rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-0.5 text-xs">
          <button
            onClick={() => setFilterTab("all")}
            className={`rounded-md px-3 py-1 font-medium transition cursor-pointer ${
              filterTab === "all"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            {t.tabAll(totalProviders)}
          </button>
          <button
            onClick={() => setFilterTab("issues")}
            className={`rounded-md px-3 py-1 font-medium transition cursor-pointer ${
              filterTab === "issues"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            {t.tabIssues(issueCount)}
          </button>
          <button
            onClick={() => setFilterTab("operational")}
            className={`rounded-md px-3 py-1 font-medium transition cursor-pointer ${
              filterTab === "operational"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            {t.tabOperational(operationalCount)}
          </button>
        </div>

        {/* 搜索框 */}
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-7 text-xs text-zinc-900 placeholder-zinc-400 shadow-sm transition focus:border-zinc-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* 厂商列表网格 */}
      {filteredProviders.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredProviders.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-200 bg-white py-12 text-center">
          <p className="text-sm font-medium text-zinc-700">{t.noResultsTitle}</p>
          <p className="mt-1 text-xs text-zinc-400">{t.noResultsHint}</p>
          <button
            onClick={() => {
              setQuery("");
              setFilterTab("all");
            }}
            className="mt-3 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 cursor-pointer"
          >
            {t.resetFilter}
          </button>
        </div>
      )}

      {/* 页脚说明 */}
      <footer className="mt-12 border-t border-zinc-200/80 pt-6 text-xs text-zinc-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p>{t.footerText}</p>
          <a
            href="/api/status"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-500 hover:text-zinc-900 underline underline-offset-2 transition"
          >
            {t.apiEndpoint}
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function StatusBoard({ initial }: { initial: StatusResponse }) {
  return (
    <I18nProvider>
      <StatusBoardInner initial={initial} />
    </I18nProvider>
  );
}
