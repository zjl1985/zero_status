"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { StatusLevel, StatusResponse } from "@/lib/types";
import ProviderCard from "./ProviderCard";
import { RefreshCw, Search, X } from "lucide-react";

export const LEVEL_META: Record<
  StatusLevel,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  operational: {
    label: "运行正常",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50/80",
    border: "border-emerald-200/80",
  },
  degraded: {
    label: "性能下降",
    dot: "bg-amber-500",
    text: "text-amber-800",
    bg: "bg-amber-50/80",
    border: "border-amber-200/80",
  },
  partial_outage: {
    label: "部分故障",
    dot: "bg-orange-500",
    text: "text-orange-800",
    bg: "bg-orange-50/80",
    border: "border-orange-200/80",
  },
  major_outage: {
    label: "严重故障",
    dot: "bg-rose-500",
    text: "text-rose-800",
    bg: "bg-rose-50/80",
    border: "border-rose-200/80",
  },
  maintenance: {
    label: "维护中",
    dot: "bg-sky-500",
    text: "text-sky-800",
    bg: "bg-sky-50/80",
    border: "border-sky-200/80",
  },
  unknown: {
    label: "无法获取",
    dot: "bg-zinc-400",
    text: "text-zinc-600",
    bg: "bg-zinc-100",
    border: "border-zinc-200",
  },
};

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
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  if (now === null) return <span suppressHydrationWarning>—</span>;

  const diff = Math.max(0, now - Date.parse(iso));
  const s = Math.floor(diff / 1000);

  const text =
    s < 30
      ? "刚刚"
      : s < 60
        ? `${s} 秒前`
        : s < 3600
          ? `${Math.floor(s / 60)} 分钟前`
          : `${Math.floor(s / 86400)} 天前`;

  return <span suppressHydrationWarning>{text}</span>;
}

export default function StatusBoard({ initial }: { initial: StatusResponse }) {
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

  const worst = data.providers
    .map((p) => p.level)
    .sort((a, b) => SEVERITY.indexOf(a) - SEVERITY.indexOf(b))[0] || "operational";

  const allOk = issueCount === 0;
  const worstMeta = LEVEL_META[worst];

  // 过滤逻辑
  const filteredProviders = useMemo(() => {
    return data.providers.filter((p) => {
      if (filterTab === "issues" && p.level === "operational") return false;
      if (filterTab === "operational" && p.level !== "operational") return false;

      if (!query.trim()) return true;
      const q = query.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.headline.toLowerCase().includes(q) ||
        p.components.some((c) => c.name.toLowerCase().includes(q)) ||
        p.incidents.some((i) => i.name.toLowerCase().includes(q))
      );
    });
  }, [data.providers, filterTab, query]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      {/* 顶部标题与控制 */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between border-b border-zinc-200/80 pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">
            LLM Status
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            全球主流大模型官方服务状态聚合监控
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span>
            更新于 <TimeAgo iso={data.generatedAt} />
          </span>
          <span className="text-zinc-300">·</span>
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-800 accent-zinc-800 focus:ring-0"
            />
            <span>自动刷新 (60s)</span>
          </label>
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3 w-3 ${loading ? "animate-spin text-zinc-800" : ""}`}
            />
            <span>{loading ? "更新中" : "刷新"}</span>
          </button>
        </div>
      </header>

      {/* Hero 状态总览横幅（参考 Stripe / Apple 极简风格） */}
      <div
        className={`mt-6 flex items-center justify-between rounded-xl border p-4 transition ${worstMeta.bg} ${worstMeta.border}`}
      >
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${worstMeta.dot}`} />
          <div>
            <p className={`text-sm font-medium ${worstMeta.text}`}>
              {allOk
                ? "所有监控服务目前运行正常"
                : `${issueCount} 个服务存在性能下降或异常`}
            </p>
            {!allOk && (
              <p className="mt-0.5 text-xs text-zinc-600">
                涉及厂商：{abnormalProviders.map((p) => p.name).join("、")}
              </p>
            )}
          </div>
        </div>

        <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
          {operationalCount}/{totalProviders} 正常
        </span>
      </div>

      {/* 工具栏：分段控件 + 搜索框 */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* 分段过滤控件 */}
        <div className="inline-flex rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-0.5 text-xs">
          <button
            onClick={() => setFilterTab("all")}
            className={`rounded-md px-3 py-1 font-medium transition ${
              filterTab === "all"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            全部 ({totalProviders})
          </button>
          <button
            onClick={() => setFilterTab("issues")}
            className={`rounded-md px-3 py-1 font-medium transition ${
              filterTab === "issues"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            异常 ({issueCount})
          </button>
          <button
            onClick={() => setFilterTab("operational")}
            className={`rounded-md px-3 py-1 font-medium transition ${
              filterTab === "operational"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            正常 ({operationalCount})
          </button>
        </div>

        {/* 搜索框 */}
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="按厂商或组件筛选..."
            className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-7 text-xs text-zinc-900 placeholder-zinc-400 shadow-sm transition focus:border-zinc-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
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
          <p className="text-sm font-medium text-zinc-700">未找到匹配的服务</p>
          <p className="mt-1 text-xs text-zinc-400">请尝试清除搜索或筛选条件</p>
          <button
            onClick={() => {
              setQuery("");
              setFilterTab("all");
            }}
            className="mt-3 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            重置筛选
          </button>
        </div>
      )}

      {/* 页脚说明 */}
      <footer className="mt-12 border-t border-zinc-200/80 pt-6 text-xs text-zinc-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p>
            数据聚合自 OpenAI · Anthropic · Google Cloud · xAI · Perplexity · DeepSeek 官方状态页。
          </p>
          <a
            href="/api/status"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-500 hover:text-zinc-900 underline underline-offset-2 transition"
          >
            API 接口 (/api/status)
          </a>
        </div>
      </footer>
    </div>
  );
}
