"use client";

import { useState } from "react";
import type { Incident, ProviderStatus, StatusLevel } from "@/lib/types";
import { LEVEL_META } from "./StatusBoard";
import ProviderIcon, { getProviderBadgeStyle } from "./ProviderIcon";
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Radio,
} from "lucide-react";

const INCIDENT_STATUS: Record<string, { label: string; cls: string }> = {
  investigating: { label: "调查中", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  identified: { label: "已定位", cls: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  monitoring: { label: "监控中", cls: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  resolved: { label: "已恢复", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  scheduled: { label: "已排期", cls: "bg-neutral-500/15 text-neutral-300 border-neutral-500/30" },
  in_progress: { label: "进行中", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  verifying: { label: "验证中", cls: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30" },
  completed: { label: "已完成", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  postmortem: { label: "复盘报告", cls: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
};

const DEFAULT_VISIBLE_COMPONENTS = 8;

function ComponentChip({
  name,
  level,
  uptime,
}: {
  name: string;
  level: StatusLevel;
  uptime?: number;
}) {
  const meta = LEVEL_META[level];
  const isOk = level === "operational";

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors select-none ${
        isOk
          ? "border-neutral-800/80 bg-neutral-900/70 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-850"
          : `${meta.bg} ${meta.border} ${meta.text} font-medium`
      }`}
      title={`${meta.label}${uptime !== undefined ? ` · 90 天可用性 ${uptime}%` : ""}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
      <span className="truncate max-w-[140px] sm:max-w-[200px]">{name}</span>
      {uptime !== undefined && (
        <span className="ml-0.5 rounded bg-white/5 px-1 py-0.2 text-[10px] text-neutral-400 font-mono">
          {uptime}%
        </span>
      )}
    </div>
  );
}

function IncidentItem({ incident }: { incident: Incident }) {
  const info = INCIDENT_STATUS[incident.status] ?? {
    label: incident.status,
    cls: "bg-neutral-800 text-neutral-400 border-neutral-750",
  };

  const formattedDate = incident.createdAt
    ? new Date(incident.createdAt).toLocaleDateString("zh-CN", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <li className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-neutral-800/60 bg-neutral-900/40 p-2.5 transition hover:border-neutral-700/80 hover:bg-neutral-850/50">
      <div className="min-w-0 flex-1">
        {incident.url ? (
          <a
            href={incident.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-sm text-neutral-200 transition group-hover:text-white"
          >
            <span className="truncate font-medium">{incident.name}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-40 group-hover:opacity-100" />
          </a>
        ) : (
          <p className="truncate text-sm font-medium text-neutral-200">
            {incident.name}
          </p>
        )}
        {formattedDate && (
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-500">
            <Clock className="h-3 w-3" />
            <span>{formattedDate}</span>
          </div>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <span
          className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${info.cls}`}
        >
          {info.label}
        </span>
      </div>
    </li>
  );
}

export default function ProviderCard({
  provider: p,
}: {
  provider: ProviderStatus;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = LEVEL_META[p.level];
  const badgeStyle = getProviderBadgeStyle(p.id);

  const abnormal = p.components.filter((c) => c.level !== "operational");
  const visibleComponents = expanded
    ? p.components
    : p.components.slice(0, DEFAULT_VISIBLE_COMPONENTS);
  const remainingCount = p.components.length - DEFAULT_VISIBLE_COMPONENTS;

  return (
    <section
      className={`group relative flex flex-col justify-between rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-5 sm:p-6 backdrop-blur-md transition-all duration-300 hover:border-neutral-700 hover:bg-neutral-900/85 hover:shadow-2xl ${badgeStyle.glow}`}
    >
      <div>
        {/* 头部：厂商徽标 + 状态徽标 */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border p-2 transition ${badgeStyle.bg} ${badgeStyle.border} ${badgeStyle.text}`}
            >
              <ProviderIcon id={p.id} size={22} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {p.homepage ? (
                  <a
                    href={p.homepage}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-base font-semibold tracking-tight text-white hover:text-emerald-400 transition"
                  >
                    {p.name}
                  </a>
                ) : (
                  <span className="truncate text-base font-semibold tracking-tight text-white">
                    {p.name}
                  </span>
                )}
                <a
                  href={p.statusPage}
                  target="_blank"
                  rel="noreferrer"
                  title="打开官方状态页"
                  className="shrink-0 text-neutral-500 transition hover:text-neutral-300"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <p className="truncate text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-neutral-600" />
                <span>{p.source}</span>
              </p>
            </div>
          </div>

          {/* 状态徽章 */}
          <div
            className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium tracking-wide shadow-sm transition ${meta.bg} ${meta.border} ${meta.text}`}
          >
            <span className="relative flex h-2 w-2">
              {p.level !== "operational" && p.level !== "unknown" && (
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${meta.dot}`}
                />
              )}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${meta.dot}`} />
            </span>
            <span>{meta.label}</span>
          </div>
        </div>

        {/* 状态描述 */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="font-medium text-neutral-300">{p.headline}</p>
        </div>

        {/* 错误提示 */}
        {p.error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
            <p className="leading-relaxed">数据获取异常：{p.error}</p>
          </div>
        )}

        {/* 组件状态列表 */}
        {p.components.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">
                服务组件 ({p.components.length})
              </span>
              {remainingCount > 0 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition"
                >
                  <span>{expanded ? "收起" : `查看全部 (+${remainingCount})`}</span>
                  {expanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {visibleComponents.map((c) => (
                <ComponentChip
                  key={c.name}
                  name={c.name}
                  level={c.level}
                  uptime={c.uptime}
                />
              ))}
            </div>
          </div>
        )}

        {/* 事件列表 */}
        {p.incidents.length > 0 ? (
          <div className="mt-5 border-t border-neutral-800/80 pt-4">
            <div className="mb-2.5 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                {abnormal.length > 0 || p.level !== "operational"
                  ? "当前关联事件"
                  : "近期事件记录"}
              </h4>
              <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-400">
                {p.incidents.length} 条
              </span>
            </div>
            <ul className="space-y-2">
              {p.incidents.slice(0, 3).map((inc) => (
                <IncidentItem
                  key={`${inc.name}-${inc.createdAt}`}
                  incident={inc}
                />
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-5 border-t border-neutral-800/80 pt-3">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/80" />
              <span>近期暂无公开故障报告</span>
            </div>
          </div>
        )}
      </div>

      {/* 底部来源和快速链接 */}
      <div className="mt-5 flex items-center justify-between border-t border-neutral-800/60 pt-3 text-[11px] text-neutral-400">
        <span className="truncate">
          官方源：{p.statusPage.replace(/^https?:\/\//, "")}
        </span>
        <a
          href={p.statusPage}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 font-medium text-neutral-300 hover:text-white transition"
        >
          <span>官方仪表盘</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </section>
  );
}
