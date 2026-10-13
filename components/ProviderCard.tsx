import type { Incident, ProviderStatus, StatusLevel } from "@/lib/types";
import { LEVEL_META } from "./StatusBoard";

const INCIDENT_STATUS: Record<string, string> = {
  investigating: "调查中",
  identified: "已定位",
  monitoring: "监控中",
  resolved: "已恢复",
  scheduled: "已排期",
  in_progress: "进行中",
  verifying: "验证中",
  completed: "已完成",
  postmortem: "复盘",
};

const MAX_COMPONENTS = 8;

function ComponentChip({ name, level, uptime }: { name: string; level: StatusLevel; uptime?: number }) {
  const meta = LEVEL_META[level];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md bg-neutral-800/80 px-2 py-0.5 text-xs text-neutral-300"
      title={`${meta.label}${uptime !== undefined ? ` · 90 天可用性 ${uptime}%` : ""}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {name}
      {uptime !== undefined && (
        <span className="text-neutral-500">{uptime}%</span>
      )}
    </span>
  );
}

function IncidentItem({ incident }: { incident: Incident }) {
  const label = INCIDENT_STATUS[incident.status] ?? incident.status;
  const resolved = incident.status === "resolved" || incident.status === "completed";
  return (
    <li className="flex items-start justify-between gap-3 text-sm">
      <div className="min-w-0">
        {incident.url ? (
          <a
            href={incident.url}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-neutral-300 underline decoration-neutral-700 underline-offset-2 hover:text-white"
          >
            {incident.name}
          </a>
        ) : (
          <p className="truncate text-neutral-300">{incident.name}</p>
        )}
      </div>
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${
          resolved
            ? "bg-neutral-800 text-neutral-400"
            : "bg-amber-500/15 text-amber-300"
        }`}
      >
        {label}
      </span>
    </li>
  );
}

export default function ProviderCard({ provider: p }: { provider: ProviderStatus }) {
  const meta = LEVEL_META[p.level];
  const abnormal = p.components.filter((c) => c.level !== "operational");
  const shown = p.components.slice(0, MAX_COMPONENTS);
  const hidden = p.components.length - shown.length;

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
      {/* 头部：名称 + 状态 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {p.homepage ? (
            <a
              href={p.homepage}
              target="_blank"
              rel="noreferrer"
              className="truncate font-semibold hover:underline"
            >
              {p.name}
            </a>
          ) : (
            <span className="truncate font-semibold">{p.name}</span>
          )}
          <a
            href={p.statusPage}
            target="_blank"
            rel="noreferrer"
            title="打开官方状态页"
            className="shrink-0 text-neutral-600 transition hover:text-neutral-400"
          >
            ↗
          </a>
        </div>
        <span
          className={`flex shrink-0 items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${meta.bg} ${meta.text}`}
        >
          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      {/* 概要 */}
      <p className="mt-2 text-sm text-neutral-400">{p.headline}</p>

      {p.error && (
        <p className="mt-1 text-xs text-red-400/80">获取失败：{p.error}</p>
      )}

      {/* 组件 */}
      {shown.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {shown.map((c) => (
            <ComponentChip key={c.name} name={c.name} level={c.level} uptime={c.uptime} />
          ))}
          {hidden > 0 && (
            <span className="inline-flex items-center px-1 text-xs text-neutral-500">
              +{hidden}
            </span>
          )}
        </div>
      )}

      {/* 事件 */}
      {p.incidents.length > 0 && (
        <div className="mt-4 border-t border-neutral-800 pt-3">
          <h3 className="mb-2 text-xs font-medium tracking-wide text-neutral-500">
            {abnormal.length > 0 || p.level === "degraded" ? "事件" : "近期事件"}
          </h3>
          <ul className="space-y-2">
            {p.incidents.slice(0, 4).map((inc) => (
              <IncidentItem key={`${inc.name}-${inc.createdAt}`} incident={inc} />
            ))}
          </ul>
        </div>
      )}

      {/* 来源 */}
      <p className="mt-4 text-[11px] text-neutral-600">
        来源：{p.source} · {p.statusPage.replace(/^https?:\/\//, "")}
      </p>
    </section>
  );
}
