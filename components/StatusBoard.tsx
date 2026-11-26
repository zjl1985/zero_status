"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Incident, StatusLevel, StatusResponse } from "@/lib/types";
import ProviderCard from "./ProviderCard";
import { RefreshCw, Search, X, ArrowUpRight } from "lucide-react";
import {
  formatShortDate,
  formatTimeAgo,
  getLevelMeta,
  I18nProvider,
  INCIDENT_STATUS_MAP,
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

const SYNC_INTERVAL_SEC = 60;

type FilterTab = "all" | "issues" | "operational";

const SHORT_NAMES: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  "google-gemini": "Gemini",
  xai: "xAI",
  perplexity: "Perplexity",
  deepseek: "DeepSeek",
};

function BrandGlyph() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="24" height="24" rx="7" fill="#fcfbf9" />
      <rect
        x="0.5"
        y="0.5"
        width="23"
        height="23"
        rx="6.5"
        stroke="#141413"
        strokeOpacity="0.1"
      />
      <path
        d="M5.5 15.5 A6.5 6.5 0 0 1 18.5 15.5"
        stroke="#d5d4ce"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="1.2 3.2"
      />
      <path
        d="M5.5 15.5 A6.5 6.5 0 0 1 16.5 10.8"
        stroke="#2b4bff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="16.5" cy="10.8" r="2.2" fill="#2b4bff" />
    </svg>
  );
}

/** Dotted semi-arc gauge inspired by Paper Widgets Weather arc */
function HealthArcGauge({
  ratio,
  accentColor,
}: {
  ratio: number;
  accentColor: string;
}) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const cx = 84;
  const cy = 78;
  const r = 60;
  const ticks = 25;

  // Angle goes from 180deg (left, PI) to 0deg (right, 0)
  const orbAngle = Math.PI * (1 - clamped);
  const orbX = cx + r * Math.cos(orbAngle);
  const orbY = cy - r * Math.sin(orbAngle);
  const activeCount = Math.round(clamped * (ticks - 1));

  return (
    <svg
      viewBox="0 0 168 92"
      className="h-[74px] w-[136px] shrink-0 overflow-visible sm:h-[84px] sm:w-[154px]"
      aria-hidden="true"
    >
      {/* Dotted background arc ticks */}
      {Array.from({ length: ticks }).map((_, i) => {
        const t = i / (ticks - 1);
        const angle = Math.PI * (1 - t);
        const x = cx + r * Math.cos(angle);
        const y = cy - r * Math.sin(angle);
        const isFilled = i <= activeCount;
        return (
          <circle
            key={i}
            cx={x.toFixed(2)}
            cy={y.toFixed(2)}
            r={isFilled ? 2.1 : 1.7}
            fill={isFilled ? accentColor : "rgba(20, 20, 18, 0.14)"}
          />
        );
      })}

      {/* Ambient glow behind riding orb */}
      <circle
        cx={orbX.toFixed(2)}
        cy={orbY.toFixed(2)}
        r="11"
        fill={accentColor}
        opacity="0.16"
      />
      {/* Tactile riding orb */}
      <circle
        cx={orbX.toFixed(2)}
        cy={orbY.toFixed(2)}
        r="5"
        fill={accentColor}
        stroke="#fcfbf9"
        strokeWidth="2"
      />

      {/* Scale anchors */}
      <text
        x="16"
        y="90"
        fill="#8a8a84"
        fontSize="9.5"
        fontFamily="var(--font-geist-mono), monospace"
      >
        0%
      </text>
      <text
        x="130"
        y="90"
        fill="#8a8a84"
        fontSize="9.5"
        fontFamily="var(--font-geist-mono), monospace"
      >
        100%
      </text>
    </svg>
  );
}

/** 36-tick radial countdown dial inspired by Paper Widgets Focus Timer */
function RadialSyncDial({
  secondsLeft,
  totalSeconds,
  active,
  loading,
}: {
  secondsLeft: number;
  totalSeconds: number;
  active: boolean;
  loading: boolean;
}) {
  const ticks = 36;
  const cx = 56;
  const cy = 56;
  const rInner = 42;
  const rOuter = 49;
  const elapsed = totalSeconds - secondsLeft;
  const litTicks = active ? Math.max(1, Math.round((elapsed / totalSeconds) * ticks)) : 0;

  return (
    <div className="relative flex h-[112px] w-[112px] items-center justify-center">
      <svg
        viewBox="0 0 112 112"
        className={`h-full w-full ${loading ? "animate-spin" : ""}`}
        aria-hidden="true"
      >
        {Array.from({ length: ticks }).map((_, i) => {
          const angle = (i / ticks) * Math.PI * 2 - Math.PI / 2;
          const x1 = cx + rInner * Math.cos(angle);
          const y1 = cy + rInner * Math.sin(angle);
          const x2 = cx + rOuter * Math.cos(angle);
          const y2 = cy + rOuter * Math.sin(angle);
          const isLit = loading ? i % 3 === 0 : i < litTicks;
          return (
            <line
              key={i}
              x1={x1.toFixed(2)}
              y1={y1.toFixed(2)}
              x2={x2.toFixed(2)}
              y2={y2.toFixed(2)}
              stroke={
                active
                  ? isLit
                    ? "#4f6bff"
                    : "rgba(255, 255, 255, 0.14)"
                  : "rgba(20, 20, 18, 0.14)"
              }
              strokeWidth={isLit ? "2" : "1.5"}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-[24px] font-light leading-none tracking-[-0.04em] tabular-nums ${
            active ? "text-white" : "text-[var(--ink-primary)]"
          }`}
        >
          {active ? `00:${String(secondsLeft).padStart(2, "0")}` : "00:00"}
        </span>
      </div>
    </div>
  );
}

function TimeAgo({ iso }: { iso: string }) {
  const { locale, t } = useI18n();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(timer);
  }, []);

  if (now === null) {
    return (
      <span className="tabular-nums" suppressHydrationWarning>
        {t.justNow}
      </span>
    );
  }

  return (
    <span className="tabular-nums" suppressHydrationWarning>
      {formatTimeAgo(iso, now, locale)}
    </span>
  );
}

interface FeedIncident extends Incident {
  providerId: string;
  providerName: string;
}

function StatusBoardInner({ initial }: { initial: StatusResponse }) {
  const { locale, setLocale, t } = useI18n();
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [auto, setAuto] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(SYNC_INTERVAL_SEC);
  const [query, setQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // Keep last known good status
    } finally {
      setLoading(false);
      setSecondsLeft(SYNC_INTERVAL_SEC);
    }
  }, []);

  // 1-second real countdown synced to auto-refresh
  useEffect(() => {
    if (!auto) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          void refresh();
          return SYNC_INTERVAL_SEC;
        }
        return prev - 1;
      });
    }, 1_000);
    return () => clearInterval(interval);
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
  const healthRatio = totalProviders > 0 ? operationalCount / totalProviders : 1;

  // Cross-provider incident timeline for Calendar widget
  const { feedIncidents, activeIncidentCount } = useMemo(() => {
    const all: FeedIncident[] = [];
    for (const p of data.providers) {
      for (const inc of p.incidents) {
        all.push({
          ...inc,
          providerId: p.id,
          providerName: SHORT_NAMES[p.id] ?? p.name,
        });
      }
    }

    const isActive = (inc: FeedIncident) =>
      INCIDENT_STATUS_MAP[inc.status]?.active ?? false;

    const sorted = all.sort((a, b) => {
      const aAct = isActive(a) ? 0 : 1;
      const bAct = isActive(b) ? 0 : 1;
      if (aAct !== bAct) return aAct - bAct;
      return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
    });

    return {
      feedIncidents: sorted.slice(0, 3),
      activeIncidentCount: all.filter(isActive).length,
    };
  }, [data.providers]);

  // Deterministic calendar date from server timestamp (zero hydration mismatch)
  const calendarDate = useMemo(() => {
    const d = new Date(data.generatedAt);
    const day = isNaN(d.getTime()) ? "--" : String(d.getDate());
    const monthsEn = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const weekdaysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekdaysZh = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const monthLabel = isNaN(d.getTime())
      ? ""
      : locale === "zh"
        ? `${d.getMonth() + 1}月`
        : monthsEn[d.getMonth()];
    const weekdayLabel = isNaN(d.getTime())
      ? ""
      : locale === "zh"
        ? weekdaysZh[d.getDay()]
        : weekdaysEn[d.getDay()];
    return { day, monthLabel, weekdayLabel };
  }, [data.generatedAt, locale]);

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

  const jumpToProvider = useCallback((id: string) => {
    setQuery("");
    setFilterTab("all");
    requestAnimationFrame(() => {
      const el = document.getElementById(`provider-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedId(id);
        window.setTimeout(() => {
          setHighlightedId((curr) => (curr === id ? null : curr));
        }, 1250);
      }
    });
  }, []);

  return (
    <div className="min-h-screen overflow-x-clip">
      <div className="mx-auto flex min-h-screen w-full max-w-[1220px] flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Whisper-quiet desk masthead */}
        <header className="flex items-center justify-between gap-4 pb-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <BrandGlyph />
            <h1 className="truncate text-[17px] font-medium tracking-[-0.025em] text-[var(--ink-primary)]">
              LLM Status
            </h1>
            <span className="hidden font-mono text-[12px] text-[var(--ink-muted)] sm:inline">
              · {t.subtitle}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <a
              href="/api/status"
              target="_blank"
              rel="noreferrer"
              className="group hidden items-center gap-1 font-mono text-[12px] text-[var(--ink-muted)] ui-colors hover:text-[var(--ink-primary)] sm:inline-flex"
            >
              <span>{t.apiEndpoint}</span>
              <ArrowUpRight className="h-3 w-3 ui-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>

            {/* Tactile pill language switch */}
            <div
              role="group"
              aria-label="Language"
              className="paper-pill-track inline-flex items-center rounded-full p-0.5 text-[12px]"
            >
              <button
                type="button"
                onClick={() => setLocale("zh")}
                aria-pressed={locale === "zh"}
                className={`cursor-pointer rounded-full px-3 py-1 font-medium ui-colors ${
                  locale === "zh"
                    ? "paper-pill-active text-[var(--ink-primary)]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                }`}
              >
                中文
              </button>
              <button
                type="button"
                onClick={() => setLocale("en")}
                aria-pressed={locale === "en"}
                className={`cursor-pointer rounded-full px-3 py-1 font-medium ui-colors ${
                  locale === "en"
                    ? "paper-pill-active text-[var(--ink-primary)]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </header>

        {/* Top Paper Widgets Bento Stage (3 living physical instruments) */}
        <section
          aria-label="Live telemetry overview"
          className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12"
        >
          {/* Widget 1: Global Health Arc Dial (Weather-inspired tile) */}
          <div className="paper-tile tile-rise flex min-w-0 flex-col justify-between p-6 lg:col-span-5">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 font-mono text-[12px] text-[var(--ink-muted)]">
                <span className={`h-2 w-2 rounded-full ${worstMeta.dot}`} />
                <span>{t.globalPulse}</span>
              </span>
              <span className={`text-[13px] font-medium ${worstMeta.text}`}>
                {allOk ? t.allNormal : t.issuesDetected(issueCount)}
              </span>
            </div>

            <div className="mt-5 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-[52px] font-light leading-none tracking-[-0.05em] tabular-nums text-[var(--ink-primary)]">
                    {operationalCount}
                  </span>
                  <span className="text-[26px] font-light tabular-nums text-[var(--ink-muted)]">
                    /{totalProviders}
                  </span>
                </div>
                <p className="mt-2 text-[13px] leading-snug text-[var(--ink-secondary)]">
                  {allOk
                    ? t.operationalRatio
                    : `${t.affectedProviders}${abnormalProviders
                        .map((p) => SHORT_NAMES[p.id] ?? p.name)
                        .join(locale === "zh" ? "、" : ", ")}`}
                </p>
              </div>

              <HealthArcGauge
                ratio={healthRatio}
                accentColor={allOk ? "#2b4bff" : worstMeta.hex}
              />
            </div>

            {/* Quick-jump provider ledger strip */}
            <nav
              aria-label="Provider quick jump"
              className="mt-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-[var(--paper-hairline)] pt-4"
            >
              {data.providers.map((p) => {
                const meta = getLevelMeta(p.level, locale);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => jumpToProvider(p.id)}
                    title={t.jumpToProvider(p.name)}
                    className="group inline-flex cursor-pointer items-center gap-1.5 py-0.5 text-left focus:outline-none"
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`}
                    />
                    <span className="whitespace-nowrap text-[12px] text-[var(--ink-secondary)] ui-colors group-hover:text-[var(--ultramarine)]">
                      {SHORT_NAMES[p.id] ?? p.name}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Widget 2: Cross-Provider Incident Calendar (Calendar-inspired tile) */}
          <div
            style={{ animationDelay: "60ms" }}
            className="paper-tile tile-rise flex min-w-0 flex-col justify-between p-6 lg:col-span-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 font-mono text-[12px] text-[var(--ink-muted)]">
                <span
                  className={`h-2 w-2 rounded-full ${
                    activeIncidentCount > 0 ? "bg-[#f59e0b]" : "bg-[#10b981]"
                  }`}
                />
                <span>{t.incidentFeed}</span>
              </span>
              <span
                className={`font-mono text-[11px] tabular-nums ${
                  activeIncidentCount > 0
                    ? "font-medium text-[#b45309]"
                    : "text-[var(--ink-muted)]"
                }`}
              >
                {activeIncidentCount > 0
                  ? t.activeIncidentsCount(activeIncidentCount)
                  : t.recentLogsCount(feedIncidents.length)}
              </span>
            </div>

            <div className="mt-4 flex flex-1 items-stretch gap-5">
              {/* Thin-numeral calendar date column */}
              <div className="flex w-[64px] shrink-0 flex-col justify-between">
                <div>
                  <span className="block font-mono text-[11px] text-[var(--ink-muted)]">
                    {calendarDate.weekdayLabel}
                  </span>
                  <span className="mt-1 block text-[46px] font-light leading-none tracking-[-0.05em] tabular-nums text-[var(--ink-primary)]">
                    {calendarDate.day}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                  {calendarDate.monthLabel}
                </span>
              </div>

              {/* Hairline vertical divider */}
              <div
                className="w-px shrink-0 bg-[var(--paper-hairline)]"
                aria-hidden="true"
              />

              {/* Compact cross-provider incident rows */}
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                {feedIncidents.length > 0 ? (
                  <ul className="space-y-3">
                    {feedIncidents.map((inc) => {
                      const info = INCIDENT_STATUS_MAP[inc.status];
                      const isAct = info?.active ?? false;
                      const dotCls = info?.dotCls ?? "bg-[#b5b5ae]";
                      return (
                        <li
                          key={`${inc.providerId}-${inc.name}-${inc.createdAt}`}
                          className="min-w-0"
                        >
                          <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                            <button
                              type="button"
                              onClick={() => jumpToProvider(inc.providerId)}
                              className="inline-flex cursor-pointer items-center gap-1.5 text-[var(--ink-muted)] ui-colors hover:text-[var(--ultramarine)]"
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${dotCls}`}
                              />
                              <span>{inc.providerName}</span>
                            </button>
                            <span className="shrink-0 tabular-nums text-[var(--ink-muted)]">
                              {formatShortDate(inc.createdAt, locale)}
                            </span>
                          </div>
                          {inc.url ? (
                            <a
                              href={inc.url}
                              target="_blank"
                              rel="noreferrer"
                              title={inc.name}
                              className={`mt-0.5 block truncate text-[13px] ui-colors hover:text-[var(--ultramarine)] ${
                                isAct
                                  ? "font-medium text-[var(--ink-primary)]"
                                  : "text-[var(--ink-secondary)]"
                              }`}
                            >
                              {inc.name}
                            </a>
                          ) : (
                            <span
                              title={inc.name}
                              className={`mt-0.5 block truncate text-[13px] ${
                                isAct
                                  ? "font-medium text-[var(--ink-primary)]"
                                  : "text-[var(--ink-secondary)]"
                              }`}
                            >
                              {inc.name}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="font-mono text-[12px] text-[var(--ink-muted)]">
                    {t.noRecentIncidents}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Widget 3: Obsidian / Paper Live Sync Control (Focus + Timer hybrid tile!) */}
          <div
            style={{ animationDelay: "120ms" }}
            className={`tile-rise flex min-w-0 flex-col justify-between p-6 md:col-span-2 lg:col-span-3 ${
              auto ? "paper-tile-obsidian text-white" : "paper-tile text-[var(--ink-primary)]"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`font-mono text-[12px] ${
                  auto ? "text-white/65" : "text-[var(--ink-muted)]"
                }`}
              >
                {auto ? t.liveSync : t.syncPaused}
              </span>

              {/* Micro-equalizer indicator (inspired by Now Playing widget) */}
              <div
                className="flex h-3.5 items-end gap-[2.5px]"
                aria-hidden="true"
              >
                <span
                  className={`w-[2px] rounded-full ${
                    auto
                      ? "eq-bar-1 h-full bg-[#4f6bff]"
                      : "h-1 bg-[var(--ink-muted)]/40"
                  }`}
                />
                <span
                  className={`w-[2px] rounded-full ${
                    auto
                      ? "eq-bar-2 h-full bg-[#4f6bff]"
                      : "h-1 bg-[var(--ink-muted)]/40"
                  }`}
                />
                <span
                  className={`w-[2px] rounded-full ${
                    auto
                      ? "eq-bar-3 h-full bg-[#4f6bff]"
                      : "h-1 bg-[var(--ink-muted)]/40"
                  }`}
                />
              </div>
            </div>

            {/* Interactive radial tick dial — click to sync immediately */}
            <div className="my-3 flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={refresh}
                disabled={loading}
                title={t.syncNow}
                className="group relative flex cursor-pointer items-center justify-center rounded-full focus:outline-none disabled:cursor-wait"
              >
                <RadialSyncDial
                  secondsLeft={secondsLeft}
                  totalSeconds={SYNC_INTERVAL_SEC}
                  active={auto}
                  loading={loading}
                />
              </button>
              <span
                className={`mt-1 font-mono text-[11px] ${
                  auto ? "text-white/55" : "text-[var(--ink-muted)]"
                }`}
              >
                {loading ? (
                  t.syncing
                ) : (
                  <>
                    {t.updated} <TimeAgo iso={data.generatedAt} />
                  </>
                )}
              </span>
            </div>

            {/* Bottom tactile Focus-style toggle & manual sync trigger */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                role="switch"
                aria-checked={auto}
                onClick={() => setAuto((v) => !v)}
                className="inline-flex cursor-pointer items-center gap-2.5 select-none focus:outline-none"
              >
                <span
                  className={`relative inline-flex h-[22px] w-10 shrink-0 items-center rounded-full ui-colors ${
                    auto ? "bg-[#2b4bff]" : "bg-black/15"
                  }`}
                >
                  <span
                    className={`inline-block h-[16px] w-[16px] rounded-full bg-white shadow-xs ui-transform ${
                      auto ? "translate-x-[21px]" : "translate-x-[3px]"
                    }`}
                  />
                </span>
                <span
                  className={`text-[13px] font-medium ${
                    auto ? "text-white" : "text-[var(--ink-primary)]"
                  }`}
                >
                  {auto ? t.syncOn : t.syncOff}
                </span>
              </button>

              <button
                type="button"
                onClick={refresh}
                disabled={loading}
                aria-label={t.syncNow}
                className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full ui-colors disabled:opacity-50 ${
                  auto
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-[var(--paper-recessed)] text-[var(--ink-primary)] hover:bg-black/10"
                }`}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Quiet tactile filter & search bar */}
        <div className="mt-7 mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Status filter"
            className="paper-pill-track inline-flex self-start rounded-full p-1 text-[13px]"
          >
            {(
              [
                { key: "all", label: t.tabAll(totalProviders), dot: null },
                {
                  key: "issues",
                  label: t.tabIssues(issueCount),
                  dot: issueCount > 0 ? "bg-[#f59e0b]" : null,
                },
                {
                  key: "operational",
                  label: t.tabOperational(operationalCount),
                  dot: null,
                },
              ] as const
            ).map((tab) => {
              const active = filterTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilterTab(tab.key)}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1 tabular-nums font-medium ui-colors ${
                    active
                      ? "paper-pill-active text-[var(--ink-primary)]"
                      : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                  }`}
                >
                  {tab.dot && (
                    <span className={`h-1.5 w-1.5 rounded-full ${tab.dot}`} />
                  )}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-full border border-[var(--paper-border)] bg-[var(--paper-tile)] py-2 pl-9 pr-8 text-[13px] text-[var(--ink-primary)] shadow-[0_1px_2px_rgba(18,18,15,0.04)] placeholder:text-[var(--ink-muted)] ui-colors focus:border-[var(--ultramarine)] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={t.clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-0.5 text-[var(--ink-muted)] ui-colors hover:text-[var(--ink-primary)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 3-Column Tactile Paper Widgets Provider Matrix */}
        {filteredProviders.length > 0 ? (
          <section
            aria-label="Provider status widgets"
            className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            {filteredProviders.map((p, idx) => (
              <ProviderCard
                key={p.id}
                provider={p}
                index={idx}
                highlighted={highlightedId === p.id}
              />
            ))}
          </section>
        ) : (
          <div className="paper-tile mt-2 px-6 py-16 text-center">
            <p className="text-[16px] font-medium text-[var(--ink-primary)]">
              {t.noResultsTitle}
            </p>
            <p className="mt-1 text-[13px] text-[var(--ink-muted)]">
              {t.noResultsHint}
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilterTab("all");
              }}
              className="mt-5 inline-flex cursor-pointer items-center rounded-full bg-[var(--ink-primary)] px-4 py-1.5 text-[13px] font-medium text-white ui-colors hover:bg-[var(--ultramarine)]"
            >
              {t.resetFilter}
            </button>
          </div>
        )}

        {/* Quiet paper desk footer */}
        <footer className="mt-auto pt-12 pb-2">
          <div className="flex flex-col justify-between gap-2 border-t border-[var(--paper-hairline)] pt-5 font-mono text-[11px] text-[var(--ink-muted)] sm:flex-row sm:items-center">
            <p>{t.footerText}</p>
            <a
              href="/api/status"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex shrink-0 items-center gap-1 text-[var(--ink-secondary)] ui-colors hover:text-[var(--ultramarine)]"
            >
              <span>/api/status</span>
              <ArrowUpRight className="h-3 w-3 ui-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </footer>
      </div>
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
