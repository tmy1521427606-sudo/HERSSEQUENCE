import type { AdvisorScriptEntry } from "@/advisor-content";

export type AdvisorRole = "assistant" | "user";

export type AdvisorMessage = {
  id: string;
  role: AdvisorRole;
  text: string;
  /** 需要额外强调专业确认的回答。 */
  safety?: boolean;
  followUps?: string[];
};

let sequence = 0;

export function createMessage(
  role: AdvisorRole,
  text: string,
  extra: { safety?: boolean; followUps?: string[] } = {},
): AdvisorMessage {
  sequence += 1;
  return { id: `${role}-${sequence}`, role, text, ...extra };
}

export function normalizeQuery(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, "");
}

/**
 * 依据关键词命中程度挑选预设回答：命中数多的优先，其次按关键词长度。
 */
export function matchAdvisorReply(
  query: string,
  script: AdvisorScriptEntry[],
  fallback: { id: string; reply: string; followUps?: string[] },
): { id: string; reply: string; followUps: string[]; safety: boolean } {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return { id: fallback.id, reply: fallback.reply, followUps: fallback.followUps ?? [], safety: false };
  }

  let best: AdvisorScriptEntry | null = null;
  let bestScore = 0;
  for (const entry of script) {
    let score = 0;
    for (const keyword of entry.keywords) {
      const term = normalizeQuery(keyword);
      if (term && normalized.includes(term)) score += term.length;
    }
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  if (!best) {
    return { id: fallback.id, reply: fallback.reply, followUps: fallback.followUps ?? [], safety: false };
  }

  return {
    id: best.id,
    reply: best.reply,
    followUps: best.followUps ?? [],
    safety: Boolean(best.safety),
  };
}

/** 按回答长度估算“正在输入”的停顿，让对话节奏更接近真人客服。 */
export function typingDelay(text: string): number {
  const estimated = 320 + text.length * 22;
  return Math.min(1400, Math.max(420, estimated));
}

export function isAdvisorQueryTooShort(input: string): boolean {
  return normalizeQuery(input).length < 2;
}
