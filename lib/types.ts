export type StatusLevel =
  | "operational"
  | "degraded"
  | "partial_outage"
  | "major_outage"
  | "maintenance"
  | "unknown";

export interface ComponentStatus {
  name: string;
  level: StatusLevel;
  /** 90 天可用性百分比（可选，DeepSeek 提供） */
  uptime?: number;
}

export interface Incident {
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  url?: string;
}

export interface ProviderStatus {
  id: string;
  name: string;
  homepage?: string;
  statusPage: string;
  /** 状态判定来源说明，如 "官方状态页" / "Google Cloud 事件流（推断）" */
  source: string;
  level: StatusLevel;
  headline: string;
  components: ComponentStatus[];
  incidents: Incident[];
  error?: string;
}

export interface StatusResponse {
  ok: boolean;
  generatedAt: string;
  providers: ProviderStatus[];
}
