"use client";

import { useState } from "react";
import type { Incident, ProviderStatus, StatusLevel } from "@/lib/types";
import {
  formatIncidentDate,
  getLevelMeta,
  INCIDENT_STATUS_MAP,
  translateHeadline,
  translateSource,
  useI18n,
} from "@/lib/i18n";
import ProviderIcon from "./ProviderIcon";
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Check,
} from "lucide-react";

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
  const { locale, t } = useI18n();
  const meta = getLevelMeta(level, locale);
  const isOk = level === "operational";

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs transition-colors select-none ${
        isOk
          ? "border-zinc-200/70 bg-zinc-50/70 text-zinc-700"
          : `${meta.bg} ${meta.border} ${meta.text} font-medium`
      }`}
      title={`${meta.label}${uptime !== undefined ? ` · ${t.uptime90d(uptime)}` : ""}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
      <span className="truncate max-w-[140px] sm:max-w-[190px]">{name}</span>
      {uptime !== undefined && (
        <span className="text-[10px] text-zinc-400 font-mono ml-0.5">
          {uptime}%
        </span>
      )}
    </div>
  );
}

function IncidentItem({ incident }: { incident: Incident }) {
  const { locale } = useI18n();
  const statusInfo = INCIDENT_STATUS_MAP[incident.status];
  const label = statusInfo?.[locale] ?? incident.status;
  const cls = statusInfo?.cls ?? "bg-zinc-100 text-zinc-600 border-zinc-200";

  const formattedDate = formatIncidentDate(incident.createdAt, locale);

  return (
    <li className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 py-2 border-b border-zinc-100 last:border-b-0 text-xs">
      <div className="min-w-0 flex-1">
        {incident.url ? (
          <a
            href={incident.url}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-1 font-medium text-zinc-800 hover:text-zinc-950 transition"
          >
            <span className="truncate">{incident.name}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-40 group-hover:opacity-100" />
          </a>
        ) : (
          <span className="font-medium text-zinc-800 truncate block">
            {incident.name}
          </span>
        )}
        {formattedDate && (
          <span className="text-[11px] text-zinc-400 block mt-0.5">
            {formattedDate}
          </span>
        )}
      </div>

      <div className="shrink-0 flex items-center">
        <span
          className={`rounded border px-1.5 py-0.2 text-[10px] font-medium leading-tight ${cls}`}
        >
          {label}
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
  const { locale, t } = useI18n();
  const meta = getLevelMeta(p.level, locale);
  const isAbnormal = p.level !== "operational" && p.level !== "unknown";

  const visibleComponents = expanded
    ? p.components
    : p.components.slice(0, DEFAULT_VISIBLE_COMPONENTS);
  const remainingCount = p.components.length - DEFAULT_VISIBLE_COMPONENTS;

  const displayHeadline = translateHeadline(p.headline, locale);
  const displaySource = translateSource(p.source, locale);

  return (
    <article className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-zinc-300">
      <div>
        {/* 头部：厂商标识 + 名称 + 状态 */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-50 text-zinc-900">
              <ProviderIcon id={p.id} size={20} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                {p.homepage ? (
                  <a
                    href={p.homepage}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-base font-medium tracking-tight text-zinc-900 hover:underline"
                  >
                    {p.name}
                  </a>
                ) : (
                  <span className="truncate text-base font-medium tracking-tight text-zinc-900">
                    {p.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {displaySource}
              </p>
            </div>
          </div>

          {/* 状态徽章 */}
          <div
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.bg} ${meta.border} ${meta.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            <span>{meta.label}</span>
          </div>
        </div>

        {/* 描述与事件摘要 */}
        <div className="mt-3.5">
          {isAbnormal ? (
            <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 p-2.5 text-xs font-medium text-amber-900">
              {displayHeadline}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">{displayHeadline}</p>
          )}
        </div>

        {/* 错误提示 */}
        {p.error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50/70 p-2.5 text-xs text-rose-800">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-600" />
            <p className="leading-relaxed">
              {t.fetchFailed}
              {p.error}
            </p>
          </div>
        )}

        {/* 子组件明细 */}
        {p.components.length > 0 && (
          <div className="mt-4 pt-3 border-t border-zinc-100">
            <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
              <span>{t.componentsCount(p.components.length)}</span>
              {remainingCount > 0 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="inline-flex items-center gap-0.5 text-zinc-500 hover:text-zinc-900 transition cursor-pointer"
                >
                  <span>{expanded ? t.collapse : t.expandAll(remainingCount)}</span>
                  {expanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
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

        {/* 事件记录 */}
        {p.incidents.length > 0 ? (
          <div className="mt-4 pt-3 border-t border-zinc-100">
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              {isAbnormal ? t.currentIncidents : t.recentIncidents}
            </div>
            <ul className="divide-y divide-zinc-50">
              {p.incidents.slice(0, 3).map((inc) => (
                <IncidentItem
                  key={`${inc.name}-${inc.createdAt}`}
                  incident={inc}
                />
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center gap-1.5 text-xs text-zinc-400">
            <Check className="h-3 w-3 text-zinc-400" />
            <span>{t.noRecentIncidents}</span>
          </div>
        )}
      </div>

      {/* 底部链接 */}
      <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
        <span className="truncate">
          {p.statusPage.replace(/^https?:\/\//, "")}
        </span>
        <a
          href={p.statusPage}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-900 transition font-medium"
        >
          <span>{t.officialStatus}</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </article>
  );
}
