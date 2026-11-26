"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { StatusLevel, StatusResponse } from "@/lib/types";
import ProviderCard from "./ProviderCard";
import { RefreshCw, Search, X, ArrowUpRight } from "lucide-react";
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

const SHORT_NAMES: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  "google-gemini": "Google Gemini",
  xai: "xAI (Grok)",
  perplexity: "Perplexity",
  deepseek: "DeepSeek",
};

function BrandMark() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="24" height="24" rx="5" fill="#0b1220" />
      <rect x="5" y="13" width="3" height="6" rx="1" fill="#64748b" />
      <rect x="10.5" y="9" width="3" height="10" rx="1" fill="#94a3b8" />
      <rect x="16" y="5" width="3" height="14" rx="1" fill="#10b981" />
    </svg>
  );
}

function TimeAgo({ iso }: { iso: string }) {
  const { locale, t } = useI18n();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 15_000);
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

function StatusBoardInner({ initial }: { initial: StatusResponse }) {
  const { locale, setLocale, t } = useI18n();
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [auto, setAuto] = useState(true);
  const [query, setQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [scrolled, setScrolled] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // Retain existing status payload on transient network error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(refresh, 60_000);
    return () => clearInterval(timer);
  }, [auto, refresh]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        }, 1200);
      }
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      {/* Sticky single-line utility navigation */}
      <header
        className={`sticky top-0 z-30 ui-transition-header ${
          scrolled
            ? "border-b border-[var(--border-subtle)] bg-white/95 shadow-[0_1px_2px_rgba(11,18,32,0.04)] backdrop-blur-md"
            : "border-b border-transparent bg-[var(--bg-surface)]"
        }`}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3.5 sm:px-6 lg:h-16 lg:flex-nowrap lg:px-8 lg:py-0">
          {/* Brand wordmark */}
          <a
            href="#top"
            className="inline-flex items-center gap-2.5 text-[var(--text-primary)]"
          >
            <BrandMark />
            <span className="font-display text-[1.25rem] font-bold tracking-[-0.03em]">
              LLM Status
            </span>
          </a>

          {/* Right utility controls */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[length:var(--text-sm)] text-[var(--text-muted)] sm:gap-x-5">
            <span className="hidden md:inline">
              {t.updated} <TimeAgo iso={data.generatedAt} />
            </span>

            {/* Auto-refresh accessible switch */}
            <button
              type="button"
              role="switch"
              aria-checked={auto}
              onClick={() => setAuto((v) => !v)}
              className="inline-flex cursor-pointer items-center gap-2 select-none text-[var(--text-secondary)] ui-transition-colors hover:text-[var(--text-primary)]"
            >
              <span
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full ui-transition-colors ${
                  auto ? "bg-[var(--text-primary)]" : "bg-[var(--border-strong)]"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white ui-transition-transform ${
                    auto ? "translate-x-[18px]" : "translate-x-[3px]"
                  }`}
                />
              </span>
              <span>{t.autoRefresh}</span>
            </button>

            {/* Connected language segmented control */}
            <div
              role="group"
              aria-label="Language"
              className="inline-flex items-center rounded-md bg-[var(--bg-subtle)] p-0.5"
            >
              <button
                type="button"
                onClick={() => setLocale("zh")}
                aria-pressed={locale === "zh"}
                className={`cursor-pointer rounded px-2.5 py-1 font-medium ui-transition-colors ${
                  locale === "zh"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[0_1px_2px_rgba(11,18,32,0.08)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                中文
              </button>
              <button
                type="button"
                onClick={() => setLocale("en")}
                aria-pressed={locale === "en"}
                className={`cursor-pointer rounded px-2.5 py-1 font-medium ui-transition-colors ${
                  locale === "en"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[0_1px_2px_rgba(11,18,32,0.08)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                EN
              </button>
            </div>

            {/* Single primary action */}
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[var(--text-primary)] px-3.5 py-1.5 font-medium text-white ui-transition-colors hover:bg-[var(--accent)] disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span>{loading ? t.refreshing : t.refresh}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Immediate live status masthead bleeding seamlessly from header */}
      <section
        id="top"
        className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]"
      >
        <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-[0.42em] h-3 w-3 shrink-0 rounded-full ${worstMeta.dot}`}
                  style={{ fontSize: "clamp(1.625rem, 3vw, 2.5rem)" }}
                  aria-hidden="true"
                />
                <h1 className="font-display text-[clamp(1.625rem,3vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.03em] text-[var(--text-primary)]">
                  {allOk ? t.allNormal : t.issuesDetected(issueCount)}
                </h1>
              </div>

              <p className="mt-3 max-w-[65ch] text-[length:var(--text-body)] text-[var(--text-muted)] sm:pl-6">
                {allOk
                  ? t.subtitle
                  : `${t.affectedProviders}${abnormalProviders
                      .map((p) => p.name)
                      .join(locale === "zh" ? "、" : ", ")}`}
              </p>
            </div>

            <div className="flex shrink-0 items-baseline justify-between gap-4 sm:flex-col sm:items-end">
              <span
                className={`font-display tabular-nums text-[length:var(--text-heading)] font-semibold tracking-[-0.02em] ${worstMeta.text}`}
              >
                {t.operationalSummary(operationalCount, totalProviders)}
              </span>
              <span className="text-[length:var(--text-sm)] text-[var(--text-muted)] md:hidden">
                {t.updated} <TimeAgo iso={data.generatedAt} />
              </span>
            </div>
          </div>

          {/* Interactive 6-provider live telemetry bar */}
          <nav
            aria-label="Provider quick jump"
            className="mt-7 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-[var(--border-subtle)] pt-6 sm:grid-cols-3 lg:grid-cols-6"
          >
            {data.providers.map((p) => {
              const meta = getLevelMeta(p.level, locale);
              const shortName = SHORT_NAMES[p.id] ?? p.name;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => jumpToProvider(p.id)}
                  title={t.jumpToProvider(p.name)}
                  className="group flex min-w-0 cursor-pointer flex-col text-left focus:outline-none"
                >
                  <span
                    className={`h-1.5 w-full rounded-full ui-transition-transform group-hover:scale-y-125 ${meta.bar}`}
                  />
                  <span className="mt-2.5 flex items-baseline justify-between gap-2 text-[length:var(--text-sm)]">
                    <span className="truncate font-medium text-[var(--text-primary)] ui-transition-colors group-hover:text-[var(--accent)]">
                      {shortName}
                    </span>
                  </span>
                  <span
                    className={`mt-0.5 truncate text-[length:var(--text-sm)] ${
                      p.level === "operational"
                        ? "text-[var(--text-muted)]"
                        : `${meta.text} font-medium`
                    }`}
                  >
                    {meta.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </section>

      {/* Main live workspace */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Filter tabs + search input */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Status filter"
            className="inline-flex self-start rounded-lg bg-[var(--bg-subtle)] p-1 text-[length:var(--text-sm)]"
          >
            {(
              [
                { key: "all", label: t.tabAll(totalProviders) },
                { key: "issues", label: t.tabIssues(issueCount) },
                { key: "operational", label: t.tabOperational(operationalCount) },
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
                  className={`cursor-pointer rounded-md px-3.5 py-1.5 tabular-nums font-medium ui-transition-colors ${
                    active
                      ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[0_1px_2px_rgba(11,18,32,0.08)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search input */}
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-2 pl-9 pr-8 text-[length:var(--text-sm)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] ui-transition-colors focus:border-[var(--accent)] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={t.clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer p-0.5 text-[var(--text-muted)] ui-transition-colors hover:text-[var(--text-primary)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Provider status grid */}
        {filteredProviders.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredProviders.map((p) => (
              <ProviderCard
                key={p.id}
                provider={p}
                highlighted={highlightedId === p.id}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-16 text-center">
            <p className="font-display text-[length:var(--text-heading)] font-semibold text-[var(--text-primary)]">
              {t.noResultsTitle}
            </p>
            <p className="mt-1.5 text-[length:var(--text-body)] text-[var(--text-muted)]">
              {t.noResultsHint}
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilterTab("all");
              }}
              className="mt-5 inline-flex cursor-pointer items-center rounded-md bg-[var(--text-primary)] px-4 py-2 text-[length:var(--text-sm)] font-medium text-white ui-transition-colors hover:bg-[var(--accent)]"
            >
              {t.resetFilter}
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-14 border-t border-[var(--border-subtle)] pt-6 text-[length:var(--text-sm)] text-[var(--text-muted)]">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="max-w-[65ch]">{t.footerText}</p>
            <a
              href="/api/status"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex shrink-0 items-center gap-1 font-medium text-[var(--text-secondary)] ui-transition-colors hover:text-[var(--accent)]"
            >
              <span>{t.apiEndpoint}</span>
              <ArrowUpRight className="h-3.5 w-3.5 ui-transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
