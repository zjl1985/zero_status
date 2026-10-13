"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { StatusLevel, StatusResponse } from "@/lib/types";
import ProviderCard from "./ProviderCard";
import {
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Server,
  Activity,
  Layers,
  Code2,
  Clock,
  Radio,
  X,
} from "lucide-react";

export const LEVEL_META: Record<
  StatusLevel,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  operational: {
    label: "运行正常",
    dot: "bg-emerald-400",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
  },
  degraded: {
    label: "性能下降",
    dot: "bg-amber-400",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
  },
  partial_outage: {
    label: "部分故障",
    dot: "bg-orange-400",
    text: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/25",
  },
  major_outage: {
    label: "严重故障",
    dot: "bg-red-400",
    text: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/25",
  },
  maintenance: {
    label: "维护中",
    dot: "bg-sky-400",
    text: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/25",
  },
  unknown: {
    label: "无法获取",
    dot: "bg-neutral-500",
    text: "text-neutral-400",
    bg: "bg-neutral-500/10",
    border: "border-neutral-500/25",
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
          : s < 86400
            ? `${Math.floor(s / 3600)} 小时前`
            : `${Math.floor(s / 86400)} 天前`;

  return <span suppressHydrationWarning>{text}</span>;
}

export default function StatusBoard({ initial }: { initial: StatusResponse }) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [auto, setAuto] = useState(true);
  const [countdown, setCountdown] = useState(60);
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
      setCountdown(60);
    }
  }, []);

  // 倒计时与定时轮询
  useEffect(() => {
    if (!auto) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refresh();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [auto, refresh]);

  // 统计指标
  const totalProviders = data.providers.length;
  const operationalCount = data.providers.filter(
    (p) => p.level === "operational",
  ).length;
  const issueCount = data.providers.filter(
    (p) => p.level !== "operational" && p.level !== "unknown",
  ).length;
  const unknownCount = data.providers.filter((p) => p.level === "unknown").length;
  const totalComponents = data.providers.reduce(
    (acc, p) => acc + p.components.length,
    0,
  );

  const healthScore = totalProviders > 0
    ? Math.round((operationalCount / totalProviders) * 100)
    : 100;

  const worst = data.providers
    .map((p) => p.level)
    .sort((a, b) => SEVERITY.indexOf(a) - SEVERITY.indexOf(b))[0] || "operational";

  const allOk = issueCount === 0 && unknownCount === 0;
  const worstMeta = LEVEL_META[worst];

  // 过滤逻辑
  const filteredProviders = useMemo(() => {
    return data.providers.filter((p) => {
      // 标签过滤
      if (filterTab === "issues" && p.level === "operational") return false;
      if (filterTab === "operational" && p.level !== "operational") return false;

      // 搜索过滤
      if (!query.trim()) return true;
      const q = query.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchHeadline = p.headline.toLowerCase().includes(q);
      const matchComponent = p.components.some((c) =>
        c.name.toLowerCase().includes(q),
      );
      const matchIncident = p.incidents.some((i) =>
        i.name.toLowerCase().includes(q),
      );

      return matchName || matchHeadline || matchComponent || matchIncident;
    });
  }, [data.providers, filterTab, query]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      {/* 顶部主导航栏 */}
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800/80 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 shadow-lg shadow-emerald-500/10">
            <Radio className="h-5 w-5 text-emerald-400" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                LLM Status
              </h1>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-400">
                LIVE
              </span>
            </div>
            <p className="text-xs text-neutral-400 sm:text-sm mt-0.5">
              全球主流大模型服务实时运行状态监控
            </p>
          </div>
        </div>

        {/* 右侧控制条 */}
        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
          {/* 更新倒计时 */}
          <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-neutral-400">
            <Clock className="h-3.5 w-3.5 text-neutral-500" />
            <span>
              已更新：<TimeAgo iso={data.generatedAt} />
            </span>
            {auto && (
              <span className="text-[11px] text-neutral-500 font-mono">
                ({countdown}s)
              </span>
            )}
          </div>

          {/* 自动刷新开关 */}
          <button
            onClick={() => setAuto(!auto)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 font-medium transition ${
              auto
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:text-white"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                auto ? "bg-emerald-400 animate-pulse" : "bg-neutral-600"
              }`}
            />
            <span>{auto ? "自动同步" : "已暂停"}</span>
          </button>

          {/* 手动刷新按钮 */}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/80 px-3.5 py-2 font-medium text-white shadow-sm transition hover:border-neutral-600 hover:bg-neutral-750 disabled:opacity-50 active:scale-95"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`}
            />
            <span>{loading ? "同步中…" : "刷新"}</span>
          </button>
        </div>
      </header>

      {/* KPI 关键指标卡片群 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* 指标 1：服务总览 */}
        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/50 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">监控厂商</span>
            <Layers className="h-4 w-4 text-neutral-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {totalProviders}
            </span>
            <span className="text-xs text-neutral-500">家服务商</span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-500 truncate">
            OpenAI, Anthropic, Gemini, xAI...
          </p>
        </div>

        {/* 指标 2：健康指数 */}
        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/50 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">服务正常率</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold tracking-tight font-mono ${
                healthScore >= 90 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {healthScore}%
            </span>
            <span className="text-xs text-neutral-500">
              {operationalCount}/{totalProviders} 正常
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
            <div
              className={`h-full transition-all duration-500 ${
                healthScore >= 90 ? "bg-emerald-400" : "bg-amber-400"
              }`}
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>

        {/* 指标 3：异常与故障 */}
        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/50 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">异常关注</span>
            <AlertTriangle
              className={`h-4 w-4 ${issueCount > 0 ? "text-amber-400" : "text-neutral-500"}`}
            />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold tracking-tight font-mono ${
                issueCount > 0 ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {issueCount}
            </span>
            <span className="text-xs text-neutral-500">个存在异常</span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            {issueCount === 0 ? "全网无服务性能下降" : "部分厂商出现部分降级"}
          </p>
        </div>

        {/* 指标 4：组件覆盖 */}
        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/50 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">监控组件</span>
            <Server className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {totalComponents}
            </span>
            <span className="text-xs text-neutral-500">细分子项</span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            涵盖 API、UI、语音与微调等
          </p>
        </div>
      </div>

      {/* 全局大横幅 Banner */}
      <div
        className={`mb-8 rounded-2xl border p-4 sm:p-5 backdrop-blur-md transition ${worstMeta.bg} ${worstMeta.border}`}
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`mt-0.5 sm:mt-0 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              allOk ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
            }`}
          >
            {allOk ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`font-semibold text-sm sm:text-base ${worstMeta.text}`}>
              {allOk
                ? "所有监控的主流大模型核心服务均运行正常"
                : `检测到 ${issueCount} 个厂商存在异常或性能下降，其余服务正常运行`}
            </h3>
            <p className="mt-0.5 text-xs text-neutral-400 leading-relaxed">
              {allOk
                ? "各服务商官方系统状态良好，API 响应及客户端交互均无异常通报。"
                : "请参考下方对应厂商卡片的具体影响组件及官方事故处理公告。"}
            </p>
          </div>
        </div>
      </div>

      {/* 搜索与过滤工具栏 */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* 状态过滤选项卡 */}
        <div className="flex items-center gap-1.5 rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-1 backdrop-blur-sm">
          <button
            onClick={() => setFilterTab("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filterTab === "all"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            全部 ({totalProviders})
          </button>
          <button
            onClick={() => setFilterTab("issues")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filterTab === "issues"
                ? "bg-amber-500/20 text-amber-300 shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            存在异常 ({issueCount})
          </button>
          <button
            onClick={() => setFilterTab("operational")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filterTab === "operational"
                ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            运行正常 ({operationalCount})
          </button>
        </div>

        {/* 实时搜索框 */}
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索厂商或组件 (如 GPT, Claude)..."
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 py-1.5 pl-9 pr-8 text-xs text-neutral-200 placeholder-neutral-500 transition focus:border-emerald-500/50 focus:bg-neutral-900 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 厂商卡片网格列表 */}
      {filteredProviders.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredProviders.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 py-16 text-center">
          <Server className="mx-auto h-10 w-10 text-neutral-600 mb-3" />
          <p className="text-sm font-medium text-neutral-300">
            未找到符合条件的厂商或组件
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            尝试更换搜索关键词或清除过滤条件
          </p>
          <button
            onClick={() => {
              setQuery("");
              setFilterTab("all");
            }}
            className="mt-4 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:text-white transition"
          >
            重置筛选
          </button>
        </div>
      )}

      {/* 页脚与说明 */}
      <footer className="mt-12 border-t border-neutral-800/80 pt-8 text-xs leading-relaxed text-neutral-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-neutral-400 font-medium">
              数据来源于各 AI 厂商官方状态页，系统每 60 秒自动并行同步。
            </p>
            <p className="text-[11px] text-neutral-500">
              包含 OpenAI · Anthropic · Google Gemini · xAI · Perplexity · DeepSeek · 官方服务可用性以厂商公布为准。
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/api/status"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 px-2.5 py-1 text-neutral-400 hover:border-neutral-700 hover:text-emerald-400 transition font-mono text-[11px]"
            >
              <Code2 className="h-3 w-3" />
              <span>GET /api/status</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
