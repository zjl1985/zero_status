import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#08090d",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "LLM Status · 全球大模型服务状态监控看板",
  description:
    "实时聚合监控 OpenAI、Anthropic Claude、Google Gemini、xAI Grok、Perplexity、DeepSeek 等全球主流 AI 基础设施服务官方状态。",
  keywords: [
    "LLM Status",
    "OpenAI status",
    "Claude status",
    "Gemini status",
    "DeepSeek status",
    "大模型状态",
    "服务状态监控",
  ],
  authors: [{ name: "Zero Status" }],
  openGraph: {
    title: "LLM Status · 全球大模型服务状态监控看板",
    description: "实时聚合监控 OpenAI、Anthropic、Google Gemini、xAI、Perplexity、DeepSeek 官方状态",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen text-neutral-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        <div className="fixed inset-0 bg-grid-pattern pointer-events-none z-0" />
        <div className="relative z-10 flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
