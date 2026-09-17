# 她序 HERSEQUENCE

女性专属维生素定制化订阅服务的静态单页展示站。项目使用 Next.js 14 App Router、Tailwind CSS、Framer Motion 与 TypeScript 构建。

> 当前为品牌概念展示：不会收集健康数据，不会产生真实营养建议、订单或扣款；AI 语音顾问仅模拟待机、连接和对话状态，不调用麦克风或任何 AI / 语音服务。

## 本地运行

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

- `/`：品牌单页展示
- `/quiz`：四步定制询问、模拟营养方案、模拟结算与演示订单完成状态

定制结果由浏览器内固定规则生成；收货信息只存在于当前页面内。流程不会调用真实 AI、支付、订单或数据库服务，刷新页面后填写内容即消失。

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

本次交付在移动端默认配置下测得：Performance 91、Accessibility 96、CLS 0。

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

- 首页文案及数据集中在 `content.ts`，定制流程内容集中在 `quiz-content.ts`。
- 所有站内人物与故事素材均为本地 WebP，没有运行时外部图片依赖。
- 页面支持 `prefers-reduced-motion`，并提供键盘焦点、跳转链接和语义化交互状态。
- 账户、真实支付、真实订阅、服务端健康数据与成分证据链弹窗不在本次静态展示范围内。
