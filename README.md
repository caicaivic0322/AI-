# 高考志愿 AI 助手

一个面向高考志愿决策场景的 Next.js Web 应用。  
它会结合政策变化、录取率与趋势判断，以就业结果为导向，生成更贴近真实决策的志愿分析报告。

## 产品能力

- 4 步表单收集省份、分数、位次、选科、城市偏好、学校层次、家庭诉求和路径优先级
- 调用 AI 生成个性化志愿分析，输出学生定位、家庭总结、核心策略、冲稳保方案和就业趋势判断
- 报告页支持未支付脱敏展示，支付后解锁完整学校、专业与详细理由
- 集成虎皮椒支付，支持微信支付与支付宝
- 首页展示 3 条最新高考政策与高校招考摘要
- 新闻摘要采用 x-crawl + 搜索发现 + 原始 HTML 回退的多层抓取策略
- 已配置首页新闻的定时刷新能力

## 用户流程

1. 进入首页查看产品价值与最新政策摘要
2. 填写表单，提交省份、分数、位次、选科和偏好信息
3. 后端异步生成报告并返回报告 ID
4. 报告页先展示脱敏内容，用户可继续支付解锁完整分析
5. 支付成功后查看完整学校、专业、风险和就业趋势建议

## 技术栈

- Next.js 16 App Router
- React 19
- SQLite + better-sqlite3
- Node.js 原生 `node:test`
- x-crawl
- DeepSeek / Kimi / MiniMax 多提供商回退
- Tavily 搜索增强
- 虎皮椒支付

## 目录结构

```text
webapp
├─ app
│  ├─ api
│  ├─ form
│  ├─ lib
│  ├─ report
│  └─ page.js
├─ data
├─ public
├─ scripts
├─ tests
├─ package.json
└─ vercel.json
```

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在项目根目录创建 `.env.local`，常用变量如下：

```bash
DEEPSEEK_API_KEY=
KIMI_API_KEY=
MINIMAX_API_KEY=
TAVILY_API_KEY=
XUNHU_APPID=
XUNHU_APPSECRET=
CRON_SECRET=
```

说明：

- 至少配置一个 AI Key，推荐优先配置 `DEEPSEEK_API_KEY`
- 如果未配置支付密钥，支付接口会进入开发模式
- `CRON_SECRET` 用于保护定时刷新接口

### 3. 启动项目

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

## 可用脚本

```bash
npm run dev
npm run build
npm run start
npm test
npm run news:refresh
npm run rebuild:db
```

## 首页新闻摘要刷新

### 手动刷新

```bash
npm run news:refresh
```

### 自动刷新

- 首页只读取 `data/homepage-news.json` 缓存，不会在每次请求时现抓
- Vercel Cron 会调用 `/api/cron/refresh-homepage-news`
- 当前固定每天刷新 3 次
- UTC 调度时间：
  - `0 0 * * *`
  - `0 5 * * *`
  - `0 12 * * *`
- 对应北京时间：
  - 08:00
  - 13:00
  - 20:00

## 接口概览

- `POST /api/generate` 生成报告
- `GET /api/report/[id]` 查询报告
- `POST /api/pay/create` 创建支付订单
- `POST /api/pay/notify` 支付回调
- `GET /api/cron/refresh-homepage-news` 定时刷新首页新闻缓存

## 测试与构建

```bash
npm test
npm run build
```

项目当前包含：

- API handler 测试
- 首页新闻抓取与来源配额测试
- Tavily 查询构建测试
- 运行时工具测试

## 部署说明

推荐部署到 Vercel。

部署前请确认：

- 已配置 AI 服务密钥
- 已配置 `CRON_SECRET`
- 如需真实支付，已配置虎皮椒支付密钥
- 定时任务将由 `vercel.json` 自动声明

## 当前特性说明

- 首页新闻抓取已支持教育部原始 HTML 回退
- 阳光高考已支持“搜索发现链接 + 详情页抓取”
- 选稿阶段有来源配额策略，避免 3 条摘要都来自同一来源
- 首页已做桌面端与移动端适配优化
