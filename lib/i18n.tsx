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
  bar: string;
  tint: string;
  rule: string;
}

const LEVEL_STYLES: Record<StatusLevel, Omit<LevelStyle, "label">> = {
  operational: {
    dot: "bg-[#059669]",
    text: "text-[#047857]",
    bar: "bg-[#10b981]",
    tint: "bg-[#ecfdf5]",
    rule: "border-l-[#059669]",
  },
  degraded: {
    dot: "bg-[#d97706]",
    text: "text-[#b45309]",
    bar: "bg-[#f59e0b]",
    tint: "bg-[#fffbeb]",
    rule: "border-l-[#d97706]",
  },
  partial_outage: {
    dot: "bg-[#ea580c]",
    text: "text-[#c2410c]",
    bar: "bg-[#f97316]",
    tint: "bg-[#fff7ed]",
    rule: "border-l-[#ea580c]",
  },
  major_outage: {
    dot: "bg-[#e11d48]",
    text: "text-[#be123c]",
    bar: "bg-[#f43f5e]",
    tint: "bg-[#fff1f2]",
    rule: "border-l-[#e11d48]",
  },
  maintenance: {
    dot: "bg-[#0284c7]",
    text: "text-[#0369a1]",
    bar: "bg-[#0ea5e9]",
    tint: "bg-[#f0f9ff]",
    rule: "border-l-[#0284c7]",
  },
  unknown: {
    dot: "bg-[#64748b]",
    text: "text-[#475569]",
    bar: "bg-[#94a3b8]",
    tint: "bg-[#f1f5f9]",
    rule: "border-l-[#64748b]",
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
    partial_outage: "Partial outage",
    major_outage: "Major outage",
    maintenance: "Maintenance",
    unknown: "Unknown",
  },
};

export const INCIDENT_STATUS_MAP: Record<
  string,
  { zh: string; en: string; textCls: string; dotCls: string }
> = {
  investigating: {
    zh: "调查中",
    en: "Investigating",
    textCls: "text-[#b45309]",
    dotCls: "bg-[#d97706]",
  },
  identified: {
    zh: "已定位",
    en: "Identified",
    textCls: "text-[#c2410c]",
    dotCls: "bg-[#ea580c]",
  },
  monitoring: {
    zh: "监控中",
    en: "Monitoring",
    textCls: "text-[#0369a1]",
    dotCls: "bg-[#0284c7]",
  },
  resolved: {
    zh: "已恢复",
    en: "Resolved",
    textCls: "text-[#525f72]",
    dotCls: "bg-[#94a3b8]",
  },
  scheduled: {
    zh: "已排期",
    en: "Scheduled",
    textCls: "text-[#525f72]",
    dotCls: "bg-[#94a3b8]",
  },
  in_progress: {
    zh: "进行中",
    en: "In progress",
    textCls: "text-[#b45309]",
    dotCls: "bg-[#d97706]",
  },
  verifying: {
    zh: "验证中",
    en: "Verifying",
    textCls: "text-[#1d4ed8]",
    dotCls: "bg-[#2563eb]",
  },
  completed: {
    zh: "已完成",
    en: "Completed",
    textCls: "text-[#525f72]",
    dotCls: "bg-[#94a3b8]",
  },
  postmortem: {
    zh: "复盘",
    en: "Postmortem",
    textCls: "text-[#6d28d9]",
    dotCls: "bg-[#7c3aed]",
  },
};

export const DICTIONARY = {
  zh: {
    title: "LLM Status · 全球大模型服务状态监控",
    subtitle: "聚合 OpenAI、Anthropic、Google Gemini、xAI、Perplexity 与 DeepSeek 官方状态源",
    updated: "更新于",
    justNow: "刚刚",
    secondsAgo: (s: number) => `${s} 秒前`,
    minutesAgo: (m: number) => `${m} 分钟前`,
    daysAgo: (d: number) => `${d} 天前`,
    autoRefresh: "自动刷新",
    refreshing: "更新中",
    refresh: "刷新状态",
    allNormal: "所有监控服务目前运行正常",
    issuesDetected: (count: number) => `${count} 个服务存在性能下降或异常`,
    affectedProviders: "涉及厂商：",
    operationalSummary: (ok: number, total: number) => `${ok} / ${total} 正常`,
    tabAll: (total: number) => `全部 (${total})`,
    tabIssues: (issues: number) => `异常 (${issues})`,
    tabOperational: (ops: number) => `正常 (${ops})`,
    searchPlaceholder: "按厂商、组件或事件筛选...",
    clearSearch: "清除搜索",
    noResultsTitle: "未找到匹配的服务",
    noResultsHint: "请尝试清除搜索关键词或切换筛选状态",
    resetFilter: "重置筛选",
    footerText:
      "数据聚合自 OpenAI、Anthropic、Google Cloud、xAI、Perplexity 与 DeepSeek 官方状态页，每 60 秒自动同步。",
    apiEndpoint: "JSON API (/api/status)",
    componentsCount: (count: number) => `监控组件 (${count})`,
    collapse: "收起",
    expandAll: (count: number) => `展开其余 ${count} 项`,
    uptime90d: (uptime: number) => `90 天可用性 ${uptime}%`,
    currentIncidents: "当前事件",
    recentIncidents: "近期事件",
    noRecentIncidents: "近期无故障记录",
    officialStatus: "官方状态页",
    fetchFailed: "获取失败：",
    jumpToProvider: (name: string) => `定位至 ${name}`,
  },
  en: {
    title: "LLM Status · Real-Time AI Service Monitor",
    subtitle:
      "Aggregated official status feeds across OpenAI, Anthropic, Google Gemini, xAI, Perplexity, and DeepSeek",
    updated: "Updated",
    justNow: "just now",
    secondsAgo: (s: number) => `${s}s ago`,
    minutesAgo: (m: number) => `${m}m ago`,
    daysAgo: (d: number) => `${d}d ago`,
    autoRefresh: "Auto refresh",
    refreshing: "Updating",
    refresh: "Refresh",
    allNormal: "All monitored services are operating normally",
    issuesDetected: (count: number) =>
      `${count} ${count === 1 ? "service has" : "services have"} active issues`,
    affectedProviders: "Affected: ",
    operationalSummary: (ok: number, total: number) => `${ok} / ${total} operational`,
    tabAll: (total: number) => `All (${total})`,
    tabIssues: (issues: number) => `Issues (${issues})`,
    tabOperational: (ops: number) => `Operational (${ops})`,
    searchPlaceholder: "Filter by provider, component, or incident...",
    clearSearch: "Clear search",
    noResultsTitle: "No matching services found",
    noResultsHint: "Clear the search query or switch the status filter",
    resetFilter: "Reset filters",
    footerText:
      "Data aggregated from official status pages of OpenAI, Anthropic, Google Cloud, xAI, Perplexity, and DeepSeek. Synced every 60 seconds.",
    apiEndpoint: "JSON API (/api/status)",
    componentsCount: (count: number) => `Components (${count})`,
    collapse: "Collapse",
    expandAll: (count: number) => `Show ${count} more`,
    uptime90d: (uptime: number) => `90-day uptime ${uptime}%`,
    currentIncidents: "Current incidents",
    recentIncidents: "Recent incidents",
    noRecentIncidents: "No recent incidents",
    officialStatus: "Official status",
    fetchFailed: "Fetch failed: ",
    jumpToProvider: (name: string) => `Jump to ${name}`,
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
    if (headline === "所有系统运行正常") return "All systems operational";
    if (headline === "无法获取状态") return "Unable to fetch status";
    const m1 = headline.match(/^检测到 (\d+) 起近期事件，可能有影响$/);
    if (m1) return `${m1[1]} recent incident(s) detected with possible impact`;
    const m1b = headline.match(/^检测到 (\d+) 起 AI 相关事件$/);
    if (m1b) return `${m1b[1]} active AI-related incident(s) detected`;
    const m2 = headline.match(/^(\d+) 个组件异常$/);
    if (m2) return `${m2[1]} component(s) degraded`;
    const m3 = headline.match(/^(\d+) 起事件处理中$/);
    if (m3) return `${m3[1]} active incident(s) in progress`;
    return headline;
  }
}

export function translateSource(source: string, locale: Locale): string {
  if (locale === "zh") return source;
  const map: Record<string, string> = {
    官方状态页: "Official status page",
    "Google Cloud 事件流（推断）": "Google Cloud feed (inferred)",
    "官方状态页 RSS（推断）": "Official RSS feed (inferred)",
    "官方状态页（FlashCat）": "Official status (FlashCat)",
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
