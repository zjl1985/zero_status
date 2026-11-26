"use client";

import { useMemo, useState } from "react";
import type { ComponentStatus, Incident, ProviderStatus, StatusLevel } from "@/lib/types";
import {
  formatShortDate,
  getLevelMeta,
  INCIDENT_STATUS_MAP,
  translateHeadline,
  useI18n,
} from "@/lib/i18n";
import ProviderIcon from "./ProviderIcon";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Check,
} from "lucide-react";

const DEFAULT_VISIBLE_COMPONENTS = 4;

function getComponentFillPercent(c: ComponentStatus): number {
  if (typeof c.uptime === "number") {
    // Scale 95%..100% slightly more expressively while keeping real ordering,
    // or show true percentage directly when below 95%.
    return Math.max(8, Math.min(100, c.uptime));
  }
  switch (c.level) {
    case "operational":
      return 100;
    case "maintenance":
      return 72;
    case "degraded":
      return 58;
    case "partial_outage":
      return 32;
    case "major_outage":
      return 12;
    default:
      return 45;
  }
}

function ComponentGaugeRow({ component: c }: { component: ComponentStatus }) {
  const { locale, t } = useI18n();
  const meta = getLevelMeta(c.level, locale);
  const isOk = c.level === "operational";
  const fillPct = getComponentFillPercent(c);

  return (
    <div
      className="group flex min-w-0 items-center gap-3 py-1"
      title={`${c.name} (${meta.label}${c.uptime !== undefined ? `, ${t.uptime90d(c.uptime)}` : ""})`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
      <span
        className={`min-w-0 flex-1 truncate text-[13px] ${
          isOk
            ? "text-[var(--ink-secondary)]"
            : `${meta.text} font-medium`
        }`}
      >
        {c.name}
      </span>

      {/* Paper-widgets Battery style micro-gauge */}
      <div className="flex shrink-0 items-center gap-2.5">
        <div className="h-[5px] w-14 overflow-hidden rounded-full bg-[var(--paper-track)]">
          <div
            className="h-full rounded-full ui-transform"
            style={{
              width: `${fillPct}%`,
              backgroundColor: isOk ? "#141413" : meta.hex,
              opacity: isOk ? 0.22 : 0.95,
            }}
          />
        </div>
        <span
          className={`w-[42px] text-right font-mono text-[11px] tabular-nums ${
            isOk ? "text-[var(--ink-muted)]" : `${meta.text} font-medium`
          }`}
        >
          {c.uptime !== undefined
            ? `${c.uptime.toFixed(c.uptime === 100 ? 0 : 1)}%`
            : isOk
              ? "OK"
              : "WARN"}
        </span>
      </div>
    </div>
  );
}

function IncidentLine({ incident }: { incident: Incident }) {
  const { locale } = useI18n();
  const statusInfo = INCIDENT_STATUS_MAP[incident.status];
  const label = statusInfo?.[locale] ?? incident.status;
  const textCls = statusInfo?.textCls ?? "text-[var(--ink-muted)]";
  const dotCls = statusInfo?.dotCls ?? "bg-[#b5b5ae]";
  const shortDate = formatShortDate(incident.createdAt, locale);

  return (
    <li className="py-2 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {incident.url ? (
            <a
              href={incident.url}
              target="_blank"
              rel="noreferrer"
              title={incident.name}
              className="group flex min-w-0 items-center gap-1 text-[13px] font-medium text-[var(--ink-primary)] ui-colors hover:text-[var(--ultramarine)]"
            >
              <span className="min-w-0 truncate">{incident.name}</span>
              <ArrowUpRight className="h-3 w-3 shrink-0 text-[var(--ink-muted)] ui-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--ultramarine)]" />
            </a>
          ) : (
            <span
              title={incident.name}
              className="block truncate text-[13px] font-medium text-[var(--ink-primary)]"
            >
              {incident.name}
            </span>
          )}
          {shortDate && (
            <span className="mt-0.5 block font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
              {shortDate}
            </span>
          )}
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 pt-0.5 font-mono text-[11px] whitespace-nowrap ${textCls}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dotCls}`} />
          <span>{label}</span>
        </span>
      </div>
    </li>
  );
}

export default function ProviderCard({
  provider: p,
  index = 0,
  highlighted = false,
}: {
  provider: ProviderStatus;
  index?: number;
  highlighted?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const { locale, t } = useI18n();
  const meta = getLevelMeta(p.level, locale);
  const isAbnormal = p.level !== "operational" && p.level !== "unknown";

  const healthyCount = useMemo(
    () => p.components.filter((c) => c.level === "operational").length,
    [p.components],
  );

  const avgUptime = useMemo(() => {
    const withUptime = p.components.filter((c) => typeof c.uptime === "number");
    if (withUptime.length === 0) return null;
    const sum = withUptime.reduce((acc, c) => acc + (c.uptime ?? 0), 0);
    return sum / withUptime.length;
  }, [p.components]);

  const visibleComponents = expanded
    ? p.components
    : p.components.slice(0, DEFAULT_VISIBLE_COMPONENTS);
  const hasMoreComponents = p.components.length > DEFAULT_VISIBLE_COMPONENTS;

  const displayHeadline = translateHeadline(p.headline, locale);
  const inspectedComponent =
    hoveredIdx !== null ? p.components[hoveredIdx] ?? null : null;
  const inspectedMeta = inspectedComponent
    ? getLevelMeta(inspectedComponent.level, locale)
    : null;

  const domain = p.statusPage.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <article
      id={`provider-${p.id}`}
      style={{ animationDelay: `${index * 45}ms` }}
      className={`paper-tile paper-tile-interactive tile-rise min-w-0 scroll-mt-24 flex flex-col justify-between p-5 sm:p-6 ${
        highlighted ? "tile-flash" : ""
      }`}
    >
      <div className="min-w-0">
        {/* Quiet instrument header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[var(--paper-recessed)] text-[var(--ink-primary)]">
              <ProviderIcon id={p.id} size={19} className="h-[19px] w-[19px]" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-medium tracking-[-0.015em] text-[var(--ink-primary)]">
                {p.homepage ? (
                  <a
                    href={p.homepage}
                    target="_blank"
                    rel="noreferrer"
                    className="ui-colors hover:text-[var(--ultramarine)]"
                  >
                    {p.name}
                  </a>
                ) : (
                  p.name
                )}
              </h2>
              <p className="truncate font-mono text-[11px] text-[var(--ink-muted)]">
                {domain}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex shrink-0 items-center gap-1.5 pt-0.5 text-[12px] font-medium whitespace-nowrap ${meta.text}`}
          >
            <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
            <span>{meta.label}</span>
          </span>
        </div>

        {/* Thin-numeral hero readout */}
        <div className="mt-5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            {avgUptime !== null ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-[36px] font-light leading-none tracking-[-0.04em] tabular-nums text-[var(--ink-primary)]">
                  {avgUptime.toFixed(2)}
                </span>
                <span className="text-[18px] font-light text-[var(--ink-muted)]">
                  %
                </span>
              </div>
            ) : p.components.length > 0 ? (
              <div className="flex items-baseline gap-0.5">
                <span className="text-[36px] font-light leading-none tracking-[-0.04em] tabular-nums text-[var(--ink-primary)]">
                  {healthyCount}
                </span>
                <span className="text-[20px] font-light tabular-nums text-[var(--ink-muted)]">
                  /{p.components.length}
                </span>
              </div>
            ) : (
              <span className="text-[28px] font-light leading-none tracking-[-0.03em] text-[var(--ink-muted)]">
                N/A
              </span>
            )}
            <p className="mt-1.5 font-mono text-[11px] text-[var(--ink-muted)]">
              {avgUptime !== null ? t.avgUptime90d : t.componentsHealthy}
            </p>
          </div>

          <p
            className={`max-w-[58%] truncate text-right text-[12px] ${
              isAbnormal
                ? `${meta.text} font-medium`
                : "text-[var(--ink-muted)]"
            }`}
            title={displayHeadline}
          >
            {displayHeadline}
          </p>
        </div>

        {/* Tactile interactive component pulse bar (inspired by Paper Widgets Steps & Snapblocks) */}
        {p.components.length > 0 && (
          <div className="mt-4">
            <div
              className={`flex items-end ${
                p.components.length > 14
                  ? "h-6 gap-[2.5px]"
                  : p.components.length > 6
                    ? "h-5 gap-1.5"
                    : "h-3.5 gap-1.5"
              }`}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {p.components.map((c, idx) => {
                const cMeta = getLevelMeta(c.level, locale);
                const isCompOk = c.level === "operational";
                const isHovered = hoveredIdx === idx;
                const isDense = p.components.length > 14;
                const heightPct =
                  typeof c.uptime === "number"
                    ? Math.max(48, Math.min(100, (c.uptime - 96) * 25))
                    : isDense
                      ? isCompOk
                        ? 84
                        : c.level === "degraded"
                          ? 62
                          : 44
                      : 100;

                return (
                  <button
                    key={c.name}
                    type="button"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onFocus={() => setHoveredIdx(idx)}
                    onBlur={() => setHoveredIdx(null)}
                    aria-label={`${c.name}: ${cMeta.label}`}
                    className="group relative flex h-full min-w-[4px] flex-1 cursor-pointer items-end focus:outline-none"
                  >
                    <span
                      className={`block w-full ui-transform ${
                        isDense ? "rounded-full" : "rounded-[4px]"
                      }`}
                      style={{
                        height: `${isHovered ? 100 : heightPct}%`,
                        backgroundColor: isHovered
                          ? "#2b4bff"
                          : isCompOk
                            ? "rgba(20, 20, 18, 0.14)"
                            : cMeta.hex,
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Live micro-readout for hovered pulse bar */}
            <div className="mt-2 flex h-4 items-center justify-between gap-2 font-mono text-[11px]">
              {inspectedComponent && inspectedMeta ? (
                <>
                  <span className="min-w-0 truncate text-[var(--ultramarine)] font-medium">
                    {inspectedComponent.name}
                  </span>
                  <span
                    className={`shrink-0 tabular-nums ${inspectedMeta.text}`}
                  >
                    {inspectedComponent.uptime !== undefined
                      ? `${inspectedComponent.uptime}%`
                      : inspectedMeta.label}
                  </span>
                </>
              ) : (
                <>
                  <span className="truncate text-[var(--ink-muted)]">
                    {p.components[0]?.name}
                  </span>
                  <span className="shrink-0 tabular-nums text-[var(--ink-muted)]">
                    {p.components.length} {locale === "zh" ? "项" : "nodes"}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Fetch error notice */}
        {p.error && (
          <div className="mt-4 flex items-start gap-2 rounded-[14px] bg-[#ef4444]/8 px-3 py-2 text-[12px] text-[#b91c1c]">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p className="min-w-0 break-words">
              {t.fetchFailed}
              {p.error}
            </p>
          </div>
        )}

        {/* Battery-style component gauge rows */}
        {p.components.length > 0 && (
          <div className="mt-4 border-t border-[var(--paper-hairline)] pt-3.5">
            <div className="space-y-0.5">
              {visibleComponents.map((c) => (
                <ComponentGaugeRow key={c.name} component={c} />
              ))}
            </div>

            {hasMoreComponents && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-2.5 inline-flex cursor-pointer items-center gap-1 font-mono text-[11px] font-medium text-[var(--ink-muted)] ui-colors hover:text-[var(--ultramarine)]"
              >
                <span>
                  {expanded
                    ? t.collapseComponents
                    : t.expandComponents(p.components.length)}
                </span>
                {expanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
        )}

        {/* Compact incident strip */}
        {p.incidents.length > 0 ? (
          <div className="mt-4 border-t border-[var(--paper-hairline)] pt-3.5">
            <p className="mb-2 font-mono text-[11px] text-[var(--ink-muted)]">
              {isAbnormal ? t.currentIncidents : t.recentIncidents}
            </p>
            <ul className="divide-y divide-[var(--paper-hairline)]">
              {p.incidents.slice(0, 2).map((inc) => (
                <IncidentLine
                  key={`${inc.name}-${inc.createdAt}`}
                  incident={inc}
                />
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-1.5 border-t border-[var(--paper-hairline)] pt-3.5 font-mono text-[11px] text-[var(--ink-muted)]">
            <Check className="h-3 w-3 shrink-0 text-[#10b981]" />
            <span>{t.noRecentIncidents}</span>
          </div>
        )}
      </div>

      {/* Quiet tile footer */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-[var(--paper-hairline)] pt-3 text-[12px]">
        <span className="truncate font-mono text-[11px] text-[var(--ink-muted)]">
          {p.incidents.length > 0
            ? `${p.incidents.length} ${locale === "zh" ? "条事件" : "logs"}`
            : locale === "zh"
              ? "状态正常"
              : "All clear"}
        </span>
        <a
          href={p.statusPage}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex shrink-0 items-center gap-1 font-medium text-[var(--ink-secondary)] ui-colors hover:text-[var(--ultramarine)]"
        >
          <span>{t.officialStatus}</span>
          <ArrowUpRight className="h-3.5 w-3.5 ui-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    </article>
  );
}
