import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#e8e8e4",
  colorScheme: "light",
};

export const metadata: Metadata = {
  title: "LLM Status · 全球大模型服务状态监控 | Real-Time AI Status",
  description:
    "实时聚合监控 OpenAI、Anthropic Claude、Google Gemini、xAI Grok、Perplexity、DeepSeek 等大模型官方服务状态。Real-time status monitoring for major LLM & AI services worldwide.",
  keywords: [
    "LLM Status",
    "OpenAI status",
    "Claude status",
    "Gemini status",
    "DeepSeek status",
    "大模型状态",
    "服务状态监控",
    "AI status monitor",
  ],
  authors: [{ name: "Zero Status" }],
  openGraph: {
    title: "LLM Status · 全球大模型服务状态监控 | Real-Time AI Status",
    description:
      "实时聚合监控 OpenAI、Anthropic、Google Gemini、xAI、Perplexity、DeepSeek 官方状态",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-CN"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen antialiased">
        <main className="relative flex min-h-screen flex-col">{children}</main>
      </body>
    </html>
  );
}
