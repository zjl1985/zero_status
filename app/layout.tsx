import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM Status · 大模型状态监控",
  description:
    "实时监控 OpenAI、Anthropic、Google Gemini、Perplexity、DeepSeek 等大模型服务的官方状态",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}
