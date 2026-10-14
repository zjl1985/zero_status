"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { StatusLevel } from "./types";

export type Locale = "zh" | "en";

export interface LevelStyle {
  label: string;
  dot: string;
  text: string;
  bg: string;
  border: string;
}

const LEVEL_STYLES: Record<StatusLevel, Omit<LevelStyle, "label">> = {
  operational: {
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50/80",
    border: "border-emerald-200/80",
  },
  degraded: {
    dot: "bg-amber-500",
    text: "text-amber-800",
    bg: "bg-amber-50/80",
    border: "border-amber-200/80",
  },
  partial_outage: {
    dot: "bg-orange-500",
    text: "text-orange-800",
    bg: "bg-orange-50/80",
    border: "border-orange-200/80",
  },
  major_outage: {
    dot: "bg-rose-500",
    text: "text-rose-800",
    bg: "bg-rose-50/80",
    border: "border-rose-200/80",
  },
  maintenance: {
    dot: "bg-sky-500",
    text: "text-sky-800",
    bg: "bg-sky-50/80",
    border: "border-sky-200/80",
  },
  unknown: {
    dot: "bg-zinc-400",
    text: "text-zinc-600",
    bg: "bg-zinc-100",
    border: "border-zinc-200",
  },
};

const LEVEL_LABELS: Record<Locale, Record<StatusLevel, string>> = {
  zh: {
    operational: "运行正常",
    degraded: "性能下降",
    partial_outage: "部分故障",
    major_outage: "严重故障",
    maintenance: "维护中",
    unknown: "无法获取",
  },
  en: {
    operational: "Operational",
    degraded: "Degraded",
    partial_outage: "Partial Outage",
    major_outage: "Major Outage",
    maintenance: "Maintenance",
    unknown: "Unknown",
  },
};

export const INCIDENT_STATUS_MAP: Record<
  string,
  { zh: string; en: string; cls: string }
> = {
  investigating: {
    zh: "调查中",
    en: "Investigating",
    cls: "bg-amber-50 text-amber-800 border-amber-200",
  },
  identified: {
    zh: "已定位",
    en: "Identified",
    cls: "bg-orange-50 text-orange-800 border-orange-200",
  },
  monitoring: {
    zh: "监控中",
    en: "Monitoring",
    cls: "bg-sky-50 text-sky-800 border-sky-200",
  },
  resolved: {
    zh: "已恢复",
    en: "Resolved",
    cls: "bg-zinc-100 text-zinc-600 border-zinc-200",
  },
  scheduled: {
    zh: "已排期",
    en: "Scheduled",
    cls: "bg-zinc-100 text-zinc-600 border-zinc-200",
  },
  in_progress: {
    zh: "进行中",
    en: "In Progress",
    cls: "bg-amber-50 text-amber-800 border-amber-200",
  },
  verifying: {
    zh: "验证中",
    en: "Verifying",
    cls: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  completed: {
    zh: "已完成",
    en: "Completed",
    cls: "bg-zinc-100 text-zinc-600 border-zinc-200",
  },
  postmortem: {
    zh: "复盘",
    en: "Postmortem",
    cls: "bg-purple-50 text-purple-800 border-purple-200",
  },
};

export const DICTIONARY = {
  zh: {
    title: "LLM Status · 全球大模型服务状态监控",
    subtitle: "全球主流大模型官方服务状态聚合监控",
    updated: "更新于",
    justNow: "刚刚",
    secondsAgo: (s: number) => `${s} 秒前`,
    minutesAgo: (m: number) => `${m} 分钟前`,
    daysAgo: (d: number) => `${d} 天前`,
    autoRefresh: "自动刷新 (60s)",
    refreshing: "更新中",
    refresh: "刷新",
    allNormal: "所有监控服务目前运行正常",
    issuesDetected: (count: number) => `${count} 个服务存在性能下降或异常`,
    affectedProviders: "涉及厂商：",
    operationalSummary: (ok: number, total: number) => `${ok}/${total} 正常`,
    tabAll: (total: number) => `全部 (${total})`,
    tabIssues: (issues: number) => `异常 (${issues})`,
    tabOperational: (ops: number) => `正常 (${ops})`,
    searchPlaceholder: "按厂商或组件筛选...",
    noResultsTitle: "未找到匹配的服务",
    noResultsHint: "请尝试清除搜索或筛选条件",
    resetFilter: "重置筛选",
    footerText:
      "数据聚合自 OpenAI · Anthropic · Google Cloud · xAI · Perplexity · DeepSeek 官方状态页。",
    apiEndpoint: "API 接口 (/api/status)",
    componentsCount: (count: number) => `监控组件 (${count})`,
    collapse: "收起",
    expandAll: (count: number) => `展开全部 (+${count})`,
    uptime90d: (uptime: number) => `90 天可用性 ${uptime}%`,
    currentIncidents: "当前事件",
    recentIncidents: "近期事件",
    noRecentIncidents: "近期无故障记录",
    officialStatus: "官方状态",
    fetchFailed: "获取失败：",
    langSwitch: "English",
  },
  en: {
    title: "LLM Status · Real-Time LLM & AI Service Monitoring",
    subtitle:
      "Aggregated status monitoring for major LLM & AI services worldwide",
    updated: "Updated",
    justNow: "just now",
    secondsAgo: (s: number) => `${s}s ago`,
    minutesAgo: (m: number) => `${m}m ago`,
    daysAgo: (d: number) => `${d}d ago`,
    autoRefresh: "Auto refresh (60s)",
    refreshing: "Updating...",
    refresh: "Refresh",
    allNormal: "All monitored services are operating normally",
    issuesDetected: (count: number) =>
      `${count} ${count === 1 ? "service has" : "services have"} issues or degraded performance`,
    affectedProviders: "Affected: ",
    operationalSummary: (ok: number, total: number) => `${ok}/${total} operational`,
    tabAll: (total: number) => `All (${total})`,
    tabIssues: (issues: number) => `Issues (${issues})`,
    tabOperational: (ops: number) => `Operational (${ops})`,
    searchPlaceholder: "Search by provider or component...",
    noResultsTitle: "No matching services found",
    noResultsHint: "Try clearing your search or filter",
    resetFilter: "Reset filters",
    footerText:
      "Data aggregated from official status pages of OpenAI, Anthropic, Google Cloud, xAI, Perplexity, and DeepSeek.",
    apiEndpoint: "API Endpoint (/api/status)",
    componentsCount: (count: number) => `Components (${count})`,
    collapse: "Collapse",
    expandAll: (count: number) => `Show all (+${count})`,
    uptime90d: (uptime: number) => `90-day uptime ${uptime}%`,
    currentIncidents: "Current Incidents",
    recentIncidents: "Recent Incidents",
    noRecentIncidents: "No recent incidents",
    officialStatus: "Official Status",
    fetchFailed: "Failed to fetch: ",
    langSwitch: "中文",
  },
} as const;

export function getLevelMeta(level: StatusLevel, locale: Locale): LevelStyle {
  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES.unknown;
  const label = LEVEL_LABELS[locale][level] ?? LEVEL_LABELS[locale].unknown;
  return { ...style, label };
}

export function translateHeadline(headline: string, locale: Locale): string {
  if (!headline) return headline;

  if (locale === "zh") {
    if (/^All Systems Operational$/i.test(headline)) return "所有系统运行正常";
    if (/^Minor Service Outage$/i.test(headline)) return "部分服务异常";
    if (/^Partial System Outage$/i.test(headline)) return "系统部分故障";
    if (/^Major System Outage$/i.test(headline)) return "系统严重故障";
    return headline;
  } else {
    if (headline === "所有系统运行正常") return "All Systems Operational";
    if (headline === "无法获取状态") return "Unable to fetch status";
    const m1 = headline.match(/^检测到 (\d+) 起近期事件，可能有影响$/);
    if (m1) return `${m1[1]} recent incident(s) detected, possible impact`;
    const m2 = headline.match(/^(\d+) 个组件异常$/);
    if (m2) return `${m2[1]} component(s) degraded`;
    const m3 = headline.match(/^(\d+) 起事件处理中$/);
    if (m3) return `${m3[1]} incident(s) in progress`;
    return headline;
  }
}

export function translateSource(source: string, locale: Locale): string {
  if (locale === "zh") return source;
  const map: Record<string, string> = {
    官方状态页: "Official Status Page",
    "Google Cloud 事件流（推断）": "Google Cloud Feed (Inferred)",
    "官方状态页 RSS（推断）": "Official Status RSS (Inferred)",
    "官方状态页（FlashCat）": "Official Status (FlashCat)",
  };
  return map[source] || source;
}

export function formatIncidentDate(iso: string, locale: Locale): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
      month: locale === "zh" ? "numeric" : "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

export function formatTimeAgo(iso: string, now: number, locale: Locale): string {
  const diff = Math.max(0, now - Date.parse(iso));
  const s = Math.floor(diff / 1000);
  const dict = DICTIONARY[locale];

  if (s < 30) return dict.justNow;
  if (s < 60) return dict.secondsAgo(s);
  if (s < 3600) return dict.minutesAgo(Math.floor(s / 60));
  return dict.daysAgo(Math.floor(s / 86400));
}

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (typeof DICTIONARY)["zh"] | (typeof DICTIONARY)["en"];
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = "zero_status_locale";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved === "zh" || saved === "en") {
        setLocaleState(saved);
      } else {
        const browserLang = navigator.language.toLowerCase();
        if (!browserLang.startsWith("zh")) {
          setLocaleState("en");
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.documentElement.lang = newLocale === "zh" ? "zh-CN" : "en";
      document.title = DICTIONARY[newLocale].title;
    } catch {
      // ignore
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "zh" ? "en" : "zh");
  }, [locale, setLocale]);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  const value = {
    locale,
    setLocale,
    toggleLocale,
    t: DICTIONARY[locale],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}
