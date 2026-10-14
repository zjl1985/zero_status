# LLM Status · 大模型状态监控

聚合展示各大 LLM 厂商官方状态页的监控站，部署于 Vercel。

## 监控对象

| 厂商 | 数据源 | 说明 |
| --- | --- | --- |
| OpenAI | status.openai.com (Statuspage API) | 实时 indicator |
| Anthropic | status.anthropic.com (Statuspage API) | 实时 indicator |
| Google Gemini / Vertex AI | status.cloud.google.com Atom 事件流 | 按最近事件启发式推断 |
| Perplexity | status.perplexity.com (Statuspage API) | 实时 indicator；.ai 旧域名已 301 至此 |
| xAI (Grok) | status.x.ai/feed.xml (官方 RSS) | HTML 页面有 Cloudflare 防护，用 feed 推断 |
| DeepSeek | status.deepseek.com | FlashCat 自建页，解析 HTML 内嵌 RSC 数据 |

## 架构

- `GET /api/status` — Serverless 路由并行抓取各状态源（`Promise.allSettled`，单源 10s 超时），归一化为统一格式，上游与 CDN 均缓存 60s
- `/` — 服务端直出首屏，客户端每 60s 自动轮询刷新
- **国际化 (i18n)** — 支持中英文一键切换，智能识别浏览器偏好并持久化于 LocalStorage
- 新增厂商：在 `lib/providers.ts` 的 `PROVIDERS` 注册表中加一条即可

## 本地开发

```bash
npm install
npm run dev
```

## 部署

```bash
npx vercel --prod
```
