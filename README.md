# 她序 HERSEQUENCE

女性专属维生素定制化订阅服务的静态单页展示站。项目使用 Next.js 14 App Router、Tailwind CSS、Framer Motion 与 TypeScript 构建。

> **实现边界（开发说明）**：本站为纯前端品牌展示，不接入后端、真实 AI、支付或订单服务。测评由浏览器内规则引擎生成结果，收货信息只存在于当前页面；刷新后所有答案消失，不使用 Local Storage、Session Storage、Cookie 或 URL 参数保存健康答案。站内 AI 顾问支持文字多轮问答（浏览器内脚本匹配，不联网）与语音交互界面状态（不调用麦克风或任何语音服务）。

## 本地运行

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

- `/`：品牌展示页
- `/quiz`：自适应营养测评（四章节、九个核心问题、条件分支）、安全分级结果与订阅结算流程
- `/about`：品牌理念、配方形成方法、成分筛选标准与安全分流机制
- `/policies`：隐私说明、订阅与价格、配送说明、退换与售后
- `/contact`：联系渠道与留言登记表单
- `404`：自定义未找到页，保留导航与常用入口

## 站内 AI 顾问

右下角常驻的顾问面板由 `components/AdvisorWidget.tsx` 提供，两种模式：

| 模式 | 行为 |
| --- | --- |
| 文字提问 | 多轮对话记录（`role="log"` + `aria-live`）、常见问题快捷按钮、逐条回答后的追问建议、“正在输入”停顿 |
| 语音交互 | 待机 / 载入 / 对话三态切换、音量条动画、计时与方案提示，仅呈现界面状态 |

回答来自 `advisor-content.ts` 中的脚本条目，`lib/advisor-utils.ts` 按关键词命中长度选择最匹配的一条；命中孕产、用药、甲状腺或过敏相关条目时，回答会附带专业确认提示。没有命中时返回引导性兜底回答，不编造内容。接入真实模型时只需替换 `matchAdvisorReply` 的调用点。

除了右下角的常驻按钮，页面里还有几个入口（都用 `lib/advisor-bus.ts` 的全局事件唤起面板）：`/contact` 的「站内 AI 顾问」卡片与深色卡片按钮、页脚的「与 AI 顾问聊聊」。这样即使浮动按钮被挡住，也一定打得开。

层叠关系：顾问面板与浮动按钮为 `z-[70]`，高于「关于本地数据」提示卡的 `z-[60]`；页脚底部预留了 `pb-14 lg:pb-36` 的留白，避免固定在左下角的提示卡压住页脚的顾问入口（未关闭提示卡时，页脚那颗链接原本会被覆盖而点不动）。

> **framer-motion 约定（踩过坑）**：项目为控制体积使用 `m as motion`，**用 `m` 就必须把 JSX 包在 `<LazyMotion features={domAnimation}>` 里**，否则动画不执行、元素会永远停在 `initial`。曾经 `AdvisorWidget.tsx` 漏了这层包裹，面板 `initial={{ opacity: 0 }}` 永不推进：元素在 DOM 里、尺寸正常、点击也能切换状态（浮动按钮的绿点会闪），但**用户完全看不见**，还会挡住底下的内容。`tests/source.test.mjs` 里有一条逐个文件的守卫测试，新增用 `m` 的组件记得加进那个列表。

## 账号与登录（前端体验）

| 能力 | 说明 |
| --- | --- |
| 体验账号 | 账号 `123`，密码 `123`（定义在 `auth-content.ts` 的 `demoAccount`） |
| 登录入口 | 站点头部账户面板的「登录」按钮、移动端菜单 |
| 登录提醒 | 测评完成后进入结果页时自动弹出一次提醒（可「稍后再说」关闭），结果页同时常驻一张「登录后保存你的方案」卡片 |
| 结算门禁 | 未登录点「结算」会先弹出登录窗口，登录成功后自动继续进入结算步骤 |
| 登录态 | 头部头像亮绿点、账户面板显示「已登录 · 她序体验用户」、结算页显示账号徽章；可退出登录 |

实现分层：`auth-content.ts`（文案与体验账号）→ `lib/auth-utils.ts`（纯函数校验，可单测）→ `components/auth-context.ts` + `AuthProvider.tsx`（会话状态）→ `components/LoginDialog.tsx`（弹窗，含焦点管理、Escape 关闭、Tab 循环、成功态）。
接入真实后端时替换 `AuthProvider` 里的 `signIn` 实现即可，UI 不需改动。

> 登录状态只保存在页面会话内存中，刷新后需要重新登录；不使用 Cookie / Local Storage / Session Storage 保存账号信息。

## 独立站界面要素

| 区域 | 内容 |
| --- | --- |
| 顶部公告条 | 新客礼遇、免运费门槛、暂停与跳过说明，可关闭 |
| 站点导航 | 账户面板（访客 / 已登录两种状态、方案 / 订阅 / 订单 / 客服入口）、订阅袋面板（免运费进度、小计、禁用态结算按钮）、移动端菜单 |
| 首页 | 信任条、服务保障条、订阅锁单倒计时、回到顶部、移动端底部购买条 |
| 页脚 | 服务保障四栏、政策链接组、支付方式、邮件订阅表单、合规说明与备案占位 |
| 全局提示 | 本地数据说明（不使用跟踪 Cookie、答案与登录态只存在当前页面） |
| 子页面 | 面包屑导航、锚点目录、独立 metadata（canonical / Open Graph） |
| SEO | `public/robots.txt`、`public/sitemap.xml`、首页 JSON-LD（Organization / WebSite / FAQPage / ItemList / Product） |

## 测试与验证

```bash
npm test
npm run lint
npm run build:static   # dev 服务器在跑时用这个，见下方说明
```

`npm test` 覆盖测评引擎、安全规则、推荐引擎、顾问匹配规则、登录校验与页面结构断言（含违禁词扫描）。生产构建使用静态导出，生成目录为 `out/`。

> **构建目录约定（务必遵守）**：实测 Next 14 在 `output: "export"` 下，**构建产物始终写进 `.next/`**，`distDir` 只决定静态导出的目录。因此三条链路这样分工：
>
> | 命令 | dev/构建目录 | 导出目录 |
> | --- | --- | --- |
> | `npm run dev` | `.next-dev/`（由 `scripts/dev.mjs` 注入） | — |
> | `npm run dev:raw` | `.next/`（默认行为，容易与构建互相覆盖） | — |
> | `npm run build` | `.next/` | `.next/` |
> | `npm run build:static` | `.next/` | `.next-build/` → 同步到 `out/` |
>
> **为什么 dev 必须用 `.next-dev/`**：如果 dev 沿用默认的 `.next/`，任何一次生产构建都会把 dev 的 CSS 资源名换成 hash 版，而 dev 请求的是 `/_next/static/css/app/layout.css` → 404 → 页面样式全丢（Tailwind 不生效），右下角 `position: fixed` 的 AI 顾问按钮会掉回文档流里跑到页面很下面，看起来就像“按钮点不开”。这不是按钮的 bug，是 dev 目录被污染。
>
> 如果已经出现这种情况：停掉 dev → 删除 `.next/`（或 `.next-dev/`）→ 重新 `npm run dev`。`npm run build:static` 会在构建后检查 `.next-dev/` 是否被动过并给出警告。
>
> 平时刷新静态预览请用 `npm run build:static`：它把导出写进独立的 `.next-build/`，先复制到临时目录再整体替换 `out/`，因此中途被打断也不会留下半套产物。

## 测评架构

| 模块 | 职责 |
| --- | --- |
| `assessment-content.ts` | 章节、题目、选项、显示条件、成分库、基础包、重点模块与文案 |
| `lib/assessment-engine.ts` | 可见题目计算、分支答案清理、进度与完整度、必答校验 |
| `lib/recommendation-engine.ts` | 六维度得分、阶段基础包、最多两个重点模块、饮食来源提示 |
| `lib/safety-rules.ts` | 绿 / 黄 / 红三级安全分流、强制排除、重复补剂检查 |

推荐四层执行顺序：阶段基础包 → 重点支持模块 → 饮食缺口调整 → 安全排除。安全规则拥有最高优先级：被排除成分不会因任何得分重新加入，黄色与红色结果不提供结算入口。

## 验证补充

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

- 首页文案及数据集中在 `content.ts`，测评内容集中在 `assessment-content.ts`，顾问脚本在 `advisor-content.ts`，子页面文案在 `site-pages.ts`。
- 所有站内场景素材均为本地 WebP，没有运行时外部图片依赖。
- 顾客可见页面使用正式品牌文案；纯前端边界只写在 README 与开发文档中。
- 页面支持 `prefers-reduced-motion`，并提供键盘焦点、跳转链接和语义化交互状态。
- 账户、真实支付、真实订阅、服务端健康数据与成分证据链弹窗不在本次范围内。
- 结果中的“证据等级”表示内容证据类型（人体研究支持 / 营养学共识 / 配方设计依据），不虚构文献或机构认证；正式发布前须由专业人士复核引用与剂量。
