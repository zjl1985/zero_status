import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#f2f4f7",
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
      className={`${plusJakartaSans.variable} ${spaceGrotesk.variable}`}
    >
      <body className="min-h-screen antialiased">
        <main className="relative flex min-h-screen flex-col">{children}</main>
      </body>
    </html>
  );
}
