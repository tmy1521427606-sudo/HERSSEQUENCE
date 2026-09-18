import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./load-module.mjs";

const advisor = loadModule("@/lib/advisor-utils");
const content = loadModule("@/advisor-content");

test("messages carry a role, a unique id and optional safety flag", () => {
  const first = advisor.createMessage("user", "睡眠不好该关注什么？");
  const second = advisor.createMessage("assistant", "先从作息记录开始。", { safety: true, followUps: ["测评怎么开始？"] });

  assert.equal(first.role, "user");
  assert.equal(second.role, "assistant");
  assert.equal(second.safety, true);
  assert.deepEqual(second.followUps, ["测评怎么开始？"]);
  assert.notEqual(first.id, second.id);
});

test("text questions resolve to the scripted reply with the strongest keyword overlap", () => {
  const sleep = advisor.matchAdvisorReply("我最近总是入睡很慢，白天压力也大", content.advisorScript, content.advisorFallback);
  assert.equal(sleep.id, "sleep");
  assert.ok(sleep.reply.includes("甘氨酸镁"));

  const price = advisor.matchAdvisorReply("订阅价格和周期怎么算？", content.advisorScript, content.advisorFallback);
  assert.equal(price.id, "price");
  assert.ok(price.reply.includes("¥299"));

  const shipping = advisor.matchAdvisorReply("发货一般多久能到", content.advisorScript, content.advisorFallback);
  assert.equal(shipping.id, "shipping");
});

test("pregnancy, medication and allergy answers always carry the professional-consult flag", () => {
  for (const query of ["孕期可以补充什么？", "我在吃处方药要注意什么？", "备孕需要提前准备什么？"]) {
    const match = advisor.matchAdvisorReply(query, content.advisorScript, content.advisorFallback);
    assert.equal(match.safety, true, `${query} should require professional confirmation`);
  }
});

test("unmatched questions fall back to the guided answer instead of inventing content", () => {
  const match = advisor.matchAdvisorReply("你们公司在哪个城市", content.advisorScript, content.advisorFallback);
  assert.equal(match.id, "fallback");
  assert.ok(match.followUps.length > 0);
});

test("every scripted entry exposes keywords and a non-trivial reply", () => {
  for (const entry of content.advisorScript) {
    assert.ok(entry.keywords.length > 0, `${entry.id} needs keywords`);
    assert.ok(entry.reply.length >= 30, `${entry.id} reply is too short to be useful`);
    assert.equal(new Set(entry.keywords).size, entry.keywords.length, `${entry.id} repeats a keyword`);
  }
  const ids = content.advisorScript.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("quick replies all resolve to a dedicated scripted answer", () => {
  for (const question of content.advisorQuickReplies) {
    const match = advisor.matchAdvisorReply(question, content.advisorScript, content.advisorFallback);
    assert.notEqual(match.id, "fallback", `quick reply "${question}" must be covered by the script`);
  }
});

test("typing delay stays inside a human-looking range and grows with answer length", () => {
  const short = advisor.typingDelay("好的");
  const long = advisor.typingDelay("x".repeat(400));

  assert.ok(short >= 420 && short <= 1400);
  assert.ok(long <= 1400);
  assert.ok(long > short);
});

test("too-short input is rejected before it reaches the transcript", () => {
  assert.equal(advisor.isAdvisorQueryTooShort(" "), true);
  assert.equal(advisor.isAdvisorQueryTooShort("a"), true);
  assert.equal(advisor.isAdvisorQueryTooShort("睡眠"), false);
});
