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
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Check,
} from "lucide-react";

const DEFAULT_VISIBLE_COMPONENTS = 6;

function ComponentRow({
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
      className="flex min-w-0 items-center justify-between gap-2 py-1 text-[length:var(--text-sm)]"
      title={`${name} (${meta.label}${uptime !== undefined ? `, ${t.uptime90d(uptime)}` : ""})`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
        <span
          className={`truncate ${
            isOk
              ? "text-[var(--text-secondary)]"
              : `${meta.text} font-medium`
          }`}
        >
          {name}
        </span>
      </div>
      {uptime !== undefined && (
        <span className="shrink-0 tabular-nums text-[var(--text-muted)]">
          {uptime}%
        </span>
      )}
    </div>
  );
}

function IncidentRow({ incident }: { incident: Incident }) {
  const { locale } = useI18n();
  const statusInfo = INCIDENT_STATUS_MAP[incident.status];
  const label = statusInfo?.[locale] ?? incident.status;
  const textCls = statusInfo?.textCls ?? "text-[var(--text-muted)]";
  const dotCls = statusInfo?.dotCls ?? "bg-[#94a3b8]";

  const formattedDate = formatIncidentDate(incident.createdAt, locale);

  return (
    <li className="py-3 first:pt-1.5 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {incident.url ? (
            <a
              href={incident.url}
              target="_blank"
              rel="noreferrer"
              title={incident.name}
              className="group flex min-w-0 items-center gap-1 text-[length:var(--text-body)] font-medium text-[var(--text-primary)] ui-transition-colors hover:text-[var(--accent)]"
            >
              <span className="min-w-0 truncate">{incident.name}</span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] ui-transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--accent)]" />
            </a>
          ) : (
            <span
              title={incident.name}
              className="block truncate text-[length:var(--text-body)] font-medium text-[var(--text-primary)]"
            >
              {incident.name}
            </span>
          )}
          {formattedDate && (
            <span className="mt-0.5 block tabular-nums text-[length:var(--text-sm)] text-[var(--text-muted)]">
              {formattedDate}
            </span>
          )}
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 pt-0.5 text-[length:var(--text-sm)] font-medium whitespace-nowrap ${textCls}`}
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
  highlighted = false,
}: {
  provider: ProviderStatus;
  highlighted?: boolean;
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
    <article
      id={`provider-${p.id}`}
      className={`min-w-0 scroll-mt-24 flex flex-col justify-between overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] ui-transition-colors hover:border-[var(--border-strong)] ${
        highlighted ? "provider-flash" : ""
      }`}
    >
      {/* Top semantic edge indicator for non-operational states */}
      <div
        className={`h-0.5 w-full ${isAbnormal ? meta.bar : "bg-transparent"}`}
        aria-hidden="true"
      />

      <div className="flex min-w-0 flex-1 flex-col justify-between p-5 sm:p-6">
        <div className="min-w-0">
          {/* Provider header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center text-[var(--text-primary)]">
                <ProviderIcon id={p.id} size={22} className="h-[22px] w-[22px]" />
              </div>

              <div className="min-w-0">
                <h2 className="font-display truncate text-[length:var(--text-heading)] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                  {p.homepage ? (
                    <a
                      href={p.homepage}
                      target="_blank"
                      rel="noreferrer"
                      className="ui-transition-colors hover:text-[var(--accent)]"
                    >
                      {p.name}
                    </a>
                  ) : (
                    p.name
                  )}
                </h2>
                <p className="mt-0.5 truncate text-[length:var(--text-sm)] text-[var(--text-muted)]">
                  {displaySource}
                </p>
              </div>
            </div>

            {/* Plain typographic status indicator */}
            <div
              className={`flex shrink-0 items-center gap-2 pt-1 text-[length:var(--text-sm)] font-medium whitespace-nowrap ${meta.text}`}
            >
              <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
              <span>{meta.label}</span>
            </div>
          </div>

          {/* Status summary line */}
          <div className="mt-4">
            {isAbnormal ? (
              <p
                className={`border-l-2 py-1.5 pl-3.5 text-[length:var(--text-body)] font-medium ${meta.rule} ${meta.tint} ${meta.text}`}
              >
                {displayHeadline}
              </p>
            ) : (
              <p className="text-[length:var(--text-body)] text-[var(--text-secondary)]">
                {displayHeadline}
              </p>
            )}
          </div>

          {/* Fetch error notice */}
          {p.error && (
            <div className="mt-3.5 flex items-start gap-2 border-l-2 border-l-[#e11d48] bg-[#fff1f2] py-2 pl-3.5 pr-3 text-[length:var(--text-sm)] text-[#be123c]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#e11d48]" />
              <p>
                {t.fetchFailed}
                {p.error}
              </p>
            </div>
          )}

          {/* Component status ledger */}
          {p.components.length > 0 && (
            <div className="mt-5 border-t border-[var(--border-subtle)] pt-4">
              <div className="mb-2.5 flex items-center justify-between gap-2 text-[length:var(--text-sm)]">
                <span className="font-medium text-[var(--text-muted)]">
                  {t.componentsCount(p.components.length)}
                </span>
                {remainingCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="inline-flex cursor-pointer items-center gap-1 font-medium text-[var(--text-secondary)] ui-transition-colors hover:text-[var(--accent)]"
                  >
                    <span>
                      {expanded ? t.collapse : t.expandAll(remainingCount)}
                    </span>
                    {expanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-x-5 gap-y-0.5 sm:grid-cols-2">
                {visibleComponents.map((c) => (
                  <ComponentRow
                    key={c.name}
                    name={c.name}
                    level={c.level}
                    uptime={c.uptime}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Incidents timeline */}
          {p.incidents.length > 0 ? (
            <div className="mt-5 border-t border-[var(--border-subtle)] pt-4">
              <p className="mb-1.5 text-[length:var(--text-sm)] font-medium text-[var(--text-muted)]">
                {isAbnormal ? t.currentIncidents : t.recentIncidents}
              </p>
              <ul className="divide-y divide-[var(--border-subtle)]">
                {p.incidents.slice(0, 3).map((inc) => (
                  <IncidentRow
                    key={`${inc.name}-${inc.createdAt}`}
                    incident={inc}
                  />
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-5 flex items-center gap-2 border-t border-[var(--border-subtle)] pt-4 text-[length:var(--text-sm)] text-[var(--text-muted)]">
              <Check className="h-3.5 w-3.5 shrink-0 text-[#059669]" />
              <span>{t.noRecentIncidents}</span>
            </div>
          )}
        </div>

        {/* Provider footer */}
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-4 text-[length:var(--text-sm)]">
          <span className="truncate text-[var(--text-muted)]">
            {p.statusPage.replace(/^https?:\/\//, "")}
          </span>
          <a
            href={p.statusPage}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex shrink-0 items-center gap-1 font-medium text-[var(--text-primary)] ui-transition-colors hover:text-[var(--accent)]"
          >
            <span>{t.officialStatus}</span>
            <ArrowUpRight className="h-3.5 w-3.5 ui-transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </article>
  );
}
