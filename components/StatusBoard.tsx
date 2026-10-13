"use client";

import { useCallback, useEffect, useState } from "react";
import type { StatusLevel, StatusResponse } from "@/lib/types";
import ProviderCard from "./ProviderCard";

export const LEVEL_META: Record<
  StatusLevel,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  operational: {
    label: "运行正常",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  degraded: {
    label: "性能下降",
    dot: "bg-amber-400",
    text: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  partial_outage: {
    label: "部分故障",
    dot: "bg-orange-400",
    text: "text-orange-300",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
  },
  major_outage: {
    label: "严重故障",
    dot: "bg-red-400",
    text: "text-red-300",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
  },
  maintenance: {
    label: "维护中",
    dot: "bg-sky-400",
    text: "text-sky-300",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
  },
  unknown: {
    label: "无法获取",
    dot: "bg-neutral-500",
    text: "text-neutral-300",
    bg: "bg-neutral-500/10",
    border: "border-neutral-500/30",
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

function TimeAgo({ iso }: { iso: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return <span suppressHydrationWarning>—</span>;
  const diff = Math.max(0, now - Date.parse(iso));
  const s = Math.floor(diff / 1000);
  const text =
    s < 60
      ? "刚刚"
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
  // 用于让相对时间随轮询刷新
  const [, setTick] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch {
      // 保留旧数据，下次轮询再试
    } finally {
      setLoading(false);
      setTick((x) => x + 1);
    }
  }, []);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(refresh, 60_000);
    return () => clearInterval(t);
  }, [auto, refresh]);

  const worst = data.providers
    .map((p) => p.level)
    .sort((a, b) => SEVERITY.indexOf(a) - SEVERITY.indexOf(b))[0];

  const issueCount = data.providers.filter(
    (p) => p.level !== "operational" && p.level !== "unknown",
  ).length;

  const allOk = data.providers.every((p) => p.level === "operational");
  const meta = LEVEL_META[worst];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* 顶栏 */}
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">LLM Status</h1>
          <span className="hidden text-sm text-neutral-500 sm:inline">
            大模型状态监控
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-neutral-400">
          <span>
            更新于 <TimeAgo iso={data.generatedAt} />
          </span>
          <label className="flex cursor-pointer items-center gap-1.5 select-none">
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
              className="h-3.5 w-3.5 accent-emerald-500"
            />
            自动刷新
          </label>
          <button
            onClick={refresh}
            disabled={loading}
            className="rounded-md border border-neutral-700 px-2.5 py-1 text-neutral-300 transition hover:border-neutral-500 hover:text-white disabled:opacity-50"
          >
            {loading ? "刷新中…" : "刷新"}
          </button>
        </div>
      </header>

      {/* 总览横幅 */}
      <div
        className={`mb-8 rounded-xl border px-5 py-4 ${meta.bg} ${meta.border}`}
      >
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
          <p className={`font-medium ${meta.text}`}>
            {allOk
              ? "所有监控的大模型服务运行正常"
              : `${issueCount} 个服务存在异常，其余正常运行`}
          </p>
        </div>
      </div>

      {/* 厂商卡片 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {data.providers.map((p) => (
          <ProviderCard key={p.id} provider={p} />
        ))}
      </div>

      <footer className="mt-10 border-t border-neutral-800 pt-6 text-xs leading-relaxed text-neutral-500">
        <p>
          数据每 60 秒自动刷新，来源于各厂商官方状态页，仅供参考；
          实际可用性请以官方页面为准。
        </p>
        <p className="mt-1">
          OpenAI · Anthropic · Google Gemini · Perplexity · DeepSeek ·{" "}
          <a
            href="/api/status"
            className="underline decoration-neutral-700 underline-offset-2 hover:text-neutral-300"
          >
            API
          </a>
        </p>
      </footer>
    </div>
  );
}
