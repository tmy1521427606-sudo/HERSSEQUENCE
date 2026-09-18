# 她序 HERSEQUENCE

女性专属维生素定制化订阅服务的静态单页展示站。项目使用 Next.js 14 App Router、Tailwind CSS、Framer Motion 与 TypeScript 构建。

> **实现边界（开发说明）**：本站为纯前端品牌展示，不接入后端、真实 AI、支付或订单服务。测评由浏览器内规则引擎生成结果，收货信息只存在于当前页面；刷新后所有答案消失，不使用 Local Storage、Session Storage、Cookie 或 URL 参数保存健康答案。AI 语音顾问仅呈现待机、连接和对话状态，不调用麦克风或任何 AI / 语音服务。

## 本地运行

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

- `/`：品牌单页展示
- `/quiz`：自适应营养测评（四章节、九个核心问题、条件分支）、安全分级结果与订阅结算流程

## 测评架构

| 模块 | 职责 |
| --- | --- |
| `assessment-content.ts` | 章节、题目、选项、显示条件、成分库、基础包、重点模块与文案 |
| `lib/assessment-engine.ts` | 可见题目计算、分支答案清理、进度与完整度、必答校验 |
| `lib/recommendation-engine.ts` | 六维度得分、阶段基础包、最多两个重点模块、饮食来源提示 |
| `lib/safety-rules.ts` | 绿 / 黄 / 红三级安全分流、强制排除、重复补剂检查 |

推荐四层执行顺序：阶段基础包 → 重点支持模块 → 饮食缺口调整 → 安全排除。安全规则拥有最高优先级：被排除成分不会因任何得分重新加入，黄色与红色结果不提供结算入口。

## 验证

```bash
npm test
npm run lint
npm run build
```

生产构建使用静态导出，生成目录为 `out/`。

如本机已安装 Chrome，可在启动静态服务器后运行 Lighthouse：

```bash
npx serve out -l 4173
npm run lighthouse
```

首页在移动端默认配置下曾测得：Performance 91、Accessibility 96、CLS 0。

## 部署

### Vercel

1. 将仓库推送到 GitHub / GitLab。
2. 在 Vercel 导入仓库。
3. Framework Preset 选择 Next.js，Build Command 使用 `npm run build`。

### 静态托管

适用于 Netlify、Cloudflare Pages、对象存储或任意静态服务器：

1. Build Command：`npm run build`
2. Publish Directory：`out`

## 内容与素材

- 首页文案及数据集中在 `content.ts`，测评内容集中在 `assessment-content.ts`。
- 所有站内场景素材均为本地 WebP，没有运行时外部图片依赖。
- 顾客可见页面使用正式品牌文案；纯前端边界只写在 README 与开发文档中。
- 页面支持 `prefers-reduced-motion`，并提供键盘焦点、跳转链接和语义化交互状态。
- 账户、真实支付、真实订阅、服务端健康数据与成分证据链弹窗不在本次范围内。
- 结果中的“证据等级”表示内容证据类型（人体研究支持 / 营养学共识 / 配方设计依据），不虚构文献或机构认证；正式发布前须由专业人士复核引用与剂量。
