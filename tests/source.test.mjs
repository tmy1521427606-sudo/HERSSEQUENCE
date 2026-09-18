import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readSources(...targets) {
  let source = "";
  for (const target of targets) {
    source += await readFile(path.join(root, target), "utf8");
    source += "\n";
  }
  return source;
}

test("homepage declares every required section", async () => {
  const source = await readSources("app/page.tsx", "components/HomeExperience.tsx");
  for (const id of [
    "hero",
    "pain-points",
    "how-it-works",
    "personas",
    "ingredients",
    "stories",
    "pricing",
    "faq",
    "final-cta",
  ]) {
    assert.match(source, new RegExp(`id=[\\"']${id}[\\"']`));
  }
});

test("homepage exposes accessibility affordances", async () => {
  const source = await readSources(
    "components/HomeExperience.tsx",
    "components/SiteHeader.tsx",
    "components/AdvisorWidget.tsx",
    "components/CookieNotice.tsx",
    "components/PageLayout.tsx",
  );
  for (const marker of [
    "跳到主要内容",
    "aria-expanded",
    "aria-live",
    "aria-current",
    "prefers-reduced-motion",
    "界面交互展示",
  ]) {
    assert.match(source, new RegExp(marker), `storefront should expose ${marker}`);
  }
});

test("assessment route exposes the adaptive flow and accessibility affordances", async () => {
  const files = [
    "app/quiz/page.tsx",
    "assessment-content.ts",
    "components/assessment/AssessmentExperience.tsx",
    "components/assessment/QuestionRenderer.tsx",
    "components/assessment/ExitConfirm.tsx",
    "components/assessment/ResultDashboard.tsx",
    "components/assessment/AssessmentCheckout.tsx",
  ];
  const source = await readSources(...files);

  for (const marker of [
    "AssessmentExperience",
    "生成我的营养方案",
    "退出测评",
    "aria-pressed",
    "aria-live",
    "aria-modal",
    "安全支付",
    "订阅已确认",
    "prefers-reduced-motion",
  ]) {
    assert.match(source, new RegExp(marker), `assessment flow should expose ${marker}`);
  }
});

test("homepage primary assessment CTAs enter the assessment route", async () => {
  const source = await readSources("components/HomeExperience.tsx", "components/SiteHeader.tsx");
  const quizLinks = source.match(/href=["']\/quiz["']/g) ?? [];

  assert.ok(quizLinks.length >= 4, `expected at least four assessment entry points, found ${quizLinks.length}`);
});

test("advisor panel supports typed conversation, quick replies and a voice mode", async () => {
  const source = await readSources("components/AdvisorWidget.tsx", "advisor-content.ts", "lib/advisor-utils.ts");

  for (const marker of [
    "文字提问",
    "语音交互",
    "matchAdvisorReply",
    "advisorQuickReplies",
    "typingDelay",
    "role=\"log\"",
    "aria-live=\"polite\"",
    "advisorCopy.safetyBadge",
    "不会调用麦克风",
  ]) {
    assert.match(source, new RegExp(marker), `advisor panel should expose ${marker}`);
  }
});

test("storefront chrome matches a standalone shop", async () => {
  const header = await readSources("components/SiteHeader.tsx");
  const footprint = await readSources("components/HomeExperience.tsx");
  const footer = await readSources("components/SiteFooter.tsx", "components/NewsletterForm.tsx");

  for (const marker of ["announcement.items", "accountMenu", "cartPanel", "freeShipping", "cartSummary", "accountCopy"]) {
    assert.match(header, new RegExp(marker.replace(".", "\\.")), `header should render ${marker}`);
  }
  for (const marker of ["stickyCta", "StickyBuyBar", "BackToTop", "lockCountdown"]) {
    assert.match(footprint, new RegExp(marker), `homepage should render ${marker}`);
  }
  for (const marker of ["guarantees", "newsletter", "footerPayments", "footerLegal", "NewsletterForm"]) {
    assert.match(footer, new RegExp(marker), `footer should render ${marker}`);
  }
});

test("standalone pages, 404 and SEO artifacts exist", async () => {
  const pages = ["app/about/page.tsx", "app/policies/page.tsx", "app/contact/page.tsx"];
  for (const page of pages) {
    const source = await readSources(page);
    assert.match(source, /export const metadata/, `${page} should declare metadata`);
    assert.match(source, /PageLayout/, `${page} should render the shared page shell`);
  }

  const notFound = await readSources("app/not-found.tsx");
  assert.match(notFound, /ERROR 404/);

  const layout = await readSources("app/layout.tsx");
  for (const marker of ["metadataBase", "openGraph", "twitter", "AdvisorWidget", "CookieNotice"]) {
    assert.match(layout, new RegExp(marker), `layout should configure ${marker}`);
  }

  const home = await readSources("app/page.tsx");
  for (const marker of ["application/ld\\+json", "FAQPage", "Organization", "Product"]) {
    assert.match(home, new RegExp(marker), `homepage should expose ${marker} structured data`);
  }

  const robots = await readSources("public/robots.txt");
  assert.match(robots, /Sitemap:/);

  const sitemap = await readSources("public/sitemap.xml");
  for (const route of ["/quiz", "/about", "/policies", "/contact"]) {
    assert.ok(sitemap.includes(route), `sitemap should list ${route}`);
  }
});

test("login flow gates checkout and reminds the user after the assessment", async () => {
  const experience = await readSources("components/assessment/AssessmentExperience.tsx");
  for (const marker of ["openLogin(\"reminder\")", "requestCheckout", "pendingCheckout", "signedIn={Boolean(user)}"]) {
    assert.match(experience, new RegExp(marker.replace(/[(){}]/g, "\\$&")), `assessment should wire ${marker}`);
  }

  const dashboard = await readSources("components/assessment/ResultDashboard.tsx");
  for (const marker of ["savePromptTitle", "checkoutGateCta", "authCopy.savedBadge"]) {
    assert.match(dashboard, new RegExp(marker.replace(".", "\\.")), `result dashboard should render ${marker}`);
  }

  const dialog = await readSources("components/LoginDialog.tsx", "components/AuthProvider.tsx", "lib/auth-utils.ts");
  for (const marker of ["role=\"dialog\"", "aria-modal=\"true\"", "demoFill", "authenticate", "signOut", "sessionNote"]) {
    assert.match(dialog, new RegExp(marker), `login surface should expose ${marker}`);
  }

  const layout = await readSources("app/layout.tsx");
  assert.match(layout, /AuthProvider/, "layout should wrap the app in AuthProvider");

  const header = await readSources("components/SiteHeader.tsx");
  for (const marker of ["useAuth", "openLogin", "accountMenuLabelSignedIn"]) {
    assert.match(header, new RegExp(marker), `header should expose ${marker}`);
  }

  const authDefaults = await readSources("auth-content.ts");
  assert.match(authDefaults, /username: "123"/);
  assert.match(authDefaults, /password: "123"/);
});

test("advisor panel can be opened from extra entry points", async () => {
  const bus = await readSources("lib/advisor-bus.ts");
  assert.match(bus, /ADVISOR_OPEN_EVENT/);
  assert.match(bus, /openAdvisorPanel/);

  const widget = await readSources("components/AdvisorWidget.tsx");
  assert.match(widget, /ADVISOR_OPEN_EVENT/, "widget should listen to the global open event");
  assert.match(widget, /z-\[70\]/, "trigger should sit above other floating chrome");
  assert.match(widget, /data-advisor-trigger/, "trigger should be identifiable");

  const contact = await readSources("app/contact/page.tsx");
  assert.match(contact, /AdvisorLauncher/, "contact page should offer an advisor entry");

  const footer = await readSources("components/SiteFooter.tsx");
  assert.match(footer, /AdvisorLauncher/, "footer should offer an advisor entry");
});

test("advisor and login also open without a click via URL parameters", async () => {
  const widget = await readSources("components/AdvisorWidget.tsx");
  assert.match(widget, /URLSearchParams\(window\.location\.search\)/, "widget should read query parameters");
  assert.match(widget, /get\("advisor"\)\s*===\s*"1"/, "?advisor=1 should open the panel without a click");

  const provider = await readSources("components/AuthProvider.tsx");
  assert.match(provider, /URLSearchParams\(window\.location\.search\)/, "provider should read query parameters");
  assert.match(provider, /get\("login"\)\s*===\s*"1"/, "?login=1 should open the login dialog without a click");
});

test("every lazy-motion component wraps its m elements in LazyMotion", async () => {
  // 踩过的坑：components/AdvisorWidget.tsx 用了 m as motion 但没包 <LazyMotion>，
  // 动画不执行 → 面板永远停在 initial 的 opacity: 0 → 元素在 DOM 里、尺寸正常、
  // 点击状态也会变（绿点闪烁），但用户完全看不见。必须逐个文件守住。
  const files = [
    "components/AdvisorWidget.tsx",
    "components/LoginDialog.tsx",
    "components/CookieNotice.tsx",
    "components/HomeExperience.tsx",
    "components/SiteHeader.tsx",
    "components/assessment/AssessmentExperience.tsx",
  ];

  for (const file of files) {
    const source = await readSources(file);
    assert.match(source, /m as motion/, `${file} 预期使用轻量 m 组件`);
    assert.match(
      source,
      /<LazyMotion\s+features=\{domAnimation\}/,
      `${file} 用了 m 组件就必须包 <LazyMotion features={domAnimation}>，否则动画不执行、元素会停在 initial（opacity: 0）而完全不可见`,
    );
  }

  const widget = await readSources("components/AdvisorWidget.tsx");
  assert.match(widget, /id="advisor-panel"/);
  assert.match(widget, /data-advisor-trigger="true"/);
  assert.match(widget, /lastAssistant/, "面板应保留上下文追问建议");
});

test("customer-visible sources never use placeholder-ware wording", async () => {
  const targets = [
    "app/page.tsx",
    "app/layout.tsx",
    "app/quiz/page.tsx",
    "app/about/page.tsx",
    "app/policies/page.tsx",
    "app/contact/page.tsx",
    "app/not-found.tsx",
    "components/HomeExperience.tsx",
    "components/SiteHeader.tsx",
    "components/SiteFooter.tsx",
    "components/AdvisorWidget.tsx",
    "components/AdvisorLauncher.tsx",
    "components/CookieNotice.tsx",
    "components/NewsletterForm.tsx",
    "components/ContactForm.tsx",
    "components/PageLayout.tsx",
    "components/AuthProvider.tsx",
    "components/LoginDialog.tsx",
    "content.ts",
    "auth-content.ts",
    "advisor-content.ts",
    "site-pages.ts",
    "assessment-content.ts",
    "lib/site-utils.ts",
    "lib/advisor-utils.ts",
    "lib/advisor-bus.ts",
    "lib/auth-utils.ts",
    "lib/assessment-engine.ts",
    "lib/recommendation-engine.ts",
    "lib/safety-rules.ts",
  ];
  const assessmentDir = await readdir(path.join(root, "components/assessment"));
  for (const file of assessmentDir.filter((name) => name.endsWith(".tsx"))) {
    targets.push(`components/assessment/${file}`);
  }

  const banned = ["模拟", "演示", "概念展示"];
  for (const target of targets) {
    const source = await readFile(path.join(root, target), "utf8");
    for (const phrase of banned) {
      assert.ok(!source.includes(phrase), `${target} must not contain "${phrase}"`);
    }
  }
});
