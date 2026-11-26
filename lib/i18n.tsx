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
  hex: string;
  softBg: string;
}

const LEVEL_STYLES: Record<StatusLevel, Omit<LevelStyle, "label">> = {
  operational: {
    dot: "bg-[#10b981]",
    text: "text-[#047857]",
    bar: "bg-[#10b981]",
    hex: "#10b981",
    softBg: "bg-[#10b981]/10",
  },
  degraded: {
    dot: "bg-[#f59e0b]",
    text: "text-[#b45309]",
    bar: "bg-[#f59e0b]",
    hex: "#f59e0b",
    softBg: "bg-[#f59e0b]/12",
  },
  partial_outage: {
    dot: "bg-[#f97316]",
    text: "text-[#c2410c]",
    bar: "bg-[#f97316]",
    hex: "#f97316",
    softBg: "bg-[#f97316]/12",
  },
  major_outage: {
    dot: "bg-[#ef4444]",
    text: "text-[#b91c1c]",
    bar: "bg-[#ef4444]",
    hex: "#ef4444",
    softBg: "bg-[#ef4444]/12",
  },
  maintenance: {
    dot: "bg-[#2b4bff]",
    text: "text-[#1d3be6]",
    bar: "bg-[#2b4bff]",
    hex: "#2b4bff",
    softBg: "bg-[#2b4bff]/10",
  },
  unknown: {
    dot: "bg-[#a1a19a]",
    text: "text-[#575752]",
    bar: "bg-[#a1a19a]",
    hex: "#a1a19a",
    softBg: "bg-[#a1a19a]/14",
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
  { zh: string; en: string; textCls: string; dotCls: string; active: boolean }
> = {
  investigating: {
    zh: "调查中",
    en: "Investigating",
    textCls: "text-[#b45309]",
    dotCls: "bg-[#f59e0b]",
    active: true,
  },
  identified: {
    zh: "已定位",
    en: "Identified",
    textCls: "text-[#c2410c]",
    dotCls: "bg-[#f97316]",
    active: true,
  },
  monitoring: {
    zh: "监控中",
    en: "Monitoring",
    textCls: "text-[#1d3be6]",
    dotCls: "bg-[#2b4bff]",
    active: true,
  },
  resolved: {
    zh: "已恢复",
    en: "Resolved",
    textCls: "text-[#767670]",
    dotCls: "bg-[#b5b5ae]",
    active: false,
  },
  scheduled: {
    zh: "已排期",
    en: "Scheduled",
    textCls: "text-[#767670]",
    dotCls: "bg-[#b5b5ae]",
    active: false,
  },
  in_progress: {
    zh: "进行中",
    en: "In progress",
    textCls: "text-[#b45309]",
    dotCls: "bg-[#f59e0b]",
    active: true,
  },
  verifying: {
    zh: "验证中",
    en: "Verifying",
    textCls: "text-[#1d3be6]",
    dotCls: "bg-[#2b4bff]",
    active: true,
  },
  completed: {
    zh: "已完成",
    en: "Completed",
    textCls: "text-[#767670]",
    dotCls: "bg-[#b5b5ae]",
    active: false,
  },
  postmortem: {
    zh: "复盘",
    en: "Postmortem",
    textCls: "text-[#6d28d9]",
    dotCls: "bg-[#7c3aed]",
    active: false,
  },
};

export const DICTIONARY = {
  zh: {
    title: "LLM Status · 全球大模型服务状态监控",
    subtitle: "官方状态页实时遥测",
    globalPulse: "全局健康",
    allNormal: "所有监控服务运行正常",
    issuesDetected: (count: number) => `${count} 家服务存在异常`,
    affectedProviders: "涉及：",
    operationalRatio: "服务正常",
    liveSync: "实时同步",
    syncPaused: "同步已暂停",
    syncOn: "开启",
    syncOff: "暂停",
    syncNow: "立即同步",
    syncing: "同步中",
    nextSync: "下次同步",
    updated: "更新于",
    justNow: "刚刚",
    secondsAgo: (s: number) => `${s} 秒前`,
    minutesAgo: (m: number) => `${m} 分钟前`,
    daysAgo: (d: number) => `${d} 天前`,
    incidentFeed: "事件动态",
    activeIncidentsCount: (n: number) => `${n} 起进行中`,
    recentLogsCount: (n: number) => `近 ${n} 条记录`,
    noRecentIncidents: "近期无故障记录",
    tabAll: (total: number) => `全部 ${total}`,
    tabIssues: (issues: number) => `异常 ${issues}`,
    tabOperational: (ops: number) => `正常 ${ops}`,
    searchPlaceholder: "搜索厂商、模型组件或事件...",
    clearSearch: "清除搜索",
    noResultsTitle: "未找到匹配服务",
    noResultsHint: "清除搜索关键词或切换状态筛选",
    resetFilter: "重置筛选",
    componentsHealthy: "组件正常",
    avgUptime90d: "90 天均值",
    expandComponents: (count: number) => `展开全部 ${count} 项`,
    collapseComponents: "收起组件",
    uptime90d: (uptime: number) => `90 天可用性 ${uptime}%`,
    currentIncidents: "当前事件",
    recentIncidents: "近期事件",
    officialStatus: "官方页",
    fetchFailed: "获取失败：",
    footerText:
      "聚合自 OpenAI、Anthropic、Google Cloud、xAI、Perplexity 与 DeepSeek 官方状态源。",
    apiEndpoint: "JSON API",
    jumpToProvider: (name: string) => `定位至 ${name}`,
  },
  en: {
    title: "LLM Status · Real-Time AI Service Monitor",
    subtitle: "Live official status telemetry",
    globalPulse: "Global pulse",
    allNormal: "All services operating normally",
    issuesDetected: (count: number) =>
      `${count} ${count === 1 ? "provider" : "providers"} degraded`,
    affectedProviders: "Affected: ",
    operationalRatio: "operational",
    liveSync: "Live sync",
    syncPaused: "Sync paused",
    syncOn: "On",
    syncOff: "Off",
    syncNow: "Sync now",
    syncing: "Syncing",
    nextSync: "Next sync",
    updated: "Updated",
    justNow: "just now",
    secondsAgo: (s: number) => `${s}s ago`,
    minutesAgo: (m: number) => `${m}m ago`,
    daysAgo: (d: number) => `${d}d ago`,
    incidentFeed: "Incident feed",
    activeIncidentsCount: (n: number) => `${n} active`,
    recentLogsCount: (n: number) => `${n} recent`,
    noRecentIncidents: "No recent incidents",
    tabAll: (total: number) => `All ${total}`,
    tabIssues: (issues: number) => `Issues ${issues}`,
    tabOperational: (ops: number) => `Normal ${ops}`,
    searchPlaceholder: "Filter providers, components, incidents...",
    clearSearch: "Clear search",
    noResultsTitle: "No matching services",
    noResultsHint: "Clear the search query or switch the status filter",
    resetFilter: "Reset filters",
    componentsHealthy: "healthy",
    avgUptime90d: "90d avg",
    expandComponents: (count: number) => `All ${count} components`,
    collapseComponents: "Collapse",
    uptime90d: (uptime: number) => `90-day uptime ${uptime}%`,
    currentIncidents: "Active incidents",
    recentIncidents: "Recent incidents",
    officialStatus: "Status page",
    fetchFailed: "Fetch failed: ",
    footerText:
      "Aggregated from official status feeds of OpenAI, Anthropic, Google Cloud, xAI, Perplexity, and DeepSeek.",
    apiEndpoint: "JSON API",
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
    if (/^Partial System Degradation$/i.test(headline)) return "部分系统性能下降";
    if (/^Partially Degraded Service$/i.test(headline)) return "部分服务性能下降";
    return headline;
  } else {
    if (headline === "所有系统运行正常") return "All systems operational";
    if (headline === "无法获取状态") return "Unable to fetch status";
    const m1 = headline.match(/^检测到 (\d+) 起近期事件，可能有影响$/);
    if (m1) return `${m1[1]} recent incident(s) detected`;
    const m1b = headline.match(/^检测到 (\d+) 起 AI 相关事件$/);
    if (m1b) return `${m1b[1]} active AI-related incident(s)`;
    const m2 = headline.match(/^(\d+) 个组件异常$/);
    if (m2) return `${m2[1]} component(s) degraded`;
    const m3 = headline.match(/^(\d+) 起事件处理中$/);
    if (m3) return `${m3[1]} active incident(s)`;
    return headline;
  }
}

export function formatShortDate(iso: string, locale: Locale): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return locale === "zh" ? `${mm}/${dd} ${hh}:${min}` : `${mm}/${dd} ${hh}:${min}`;
  } catch {
    return "";
  }
}

export function formatTimeAgo(iso: string, now: number, locale: Locale): string {
  const diff = Math.max(0, now - Date.parse(iso));
  const s = Math.floor(diff / 1000);
  const dict = DICTIONARY[locale];

  if (s < 15) return dict.justNow;
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
