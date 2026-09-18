import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./load-module.mjs";

const auth = loadModule("@/lib/auth-utils");
const content = loadModule("@/auth-content");

test("体验账号为 123 / 123 并写入内容文件", () => {
  assert.equal(content.demoAccount.username, "123");
  assert.equal(content.demoAccount.password, "123");
  assert.ok(content.demoAccount.displayName.length > 0);
});

test("正确的体验账号可以登录并返回会话用户", () => {
  const result = auth.authenticate("123", "123", 1_700_000_000_000);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.user.username, "123");
  assert.equal(result.user.displayName, content.demoAccount.displayName);
  assert.equal(result.user.initial, content.demoAccount.initial);
  assert.equal(result.user.signedInAt, 1_700_000_000_000);
});

test("账号输入忽略首尾空格与大小写，密码只去首尾空格", () => {
  assert.equal(auth.authenticate("  123  ", " 123 ").ok, true);
  assert.equal(auth.authenticate("123", "1234").ok, false);
  assert.equal(auth.authenticate("1234", "123").ok, false);
});

test("空账号或空密码返回可展示的错误文案", () => {
  const empty = auth.authenticate("", "");
  assert.equal(empty.ok, false);
  if (!empty.ok) assert.equal(empty.error, content.authCopy.errorEmpty);

  const partial = auth.authenticate("123", "   ");
  assert.equal(partial.ok, false);
  if (!partial.ok) assert.equal(partial.error, content.authCopy.errorEmpty);
});

test("账号或密码错误时给出统一的提示，不泄露是哪一项错了", () => {
  const wrongName = auth.authenticate("someone", "123");
  const wrongSecret = auth.authenticate("123", "hunter2");
  assert.equal(wrongName.ok, false);
  assert.equal(wrongSecret.ok, false);
  if (!wrongName.ok && !wrongSecret.ok) {
    assert.equal(wrongName.error, content.authCopy.errorInvalid);
    assert.equal(wrongSecret.error, content.authCopy.errorInvalid);
  }
});

test("会话判定与账号展示辅助函数", () => {
  assert.equal(auth.isSignedIn(null), false);
  const user = { username: "123", displayName: "她序体验用户", initial: "她", signedInAt: 1 };
  assert.equal(auth.isSignedIn(user), true);
  assert.equal(auth.accountLabel(user), user.displayName);
  assert.equal(auth.accountLabel(null), content.authCopy.signedIn);
});

test("登录文案覆盖提醒、结算门禁与会话说明", () => {
  for (const key of [
    "reminderTitle",
    "reminderCopy",
    "savePromptCta",
    "checkoutGateCta",
    "signOut",
    "sessionNote",
    "demoValue",
  ]) {
    assert.ok(content.authCopy[key], `authCopy.${key} 不能为空`);
  }
});
