export type FilterableItem = { tags: readonly string[] };

/**
 * 语音面板的展示状态。
 *
 * 与 RTC 会话自身的状态（见 lib/rtc/useVoiceChat.ts 的 VoiceChatStatus）有意分开：
 * RTC 只关心「连没连上」，而面板还要表达「这个页面根本用不了语音」这种
 * 与网络无关的情形 —— 两者的处置建议完全不同（去配后端地址 vs 换浏览器/换设备）。
 */
export type VoiceState = "idle" | "connecting" | "active" | "error" | "unsupported";

export function filterIngredients<T extends FilterableItem>(items: T[], filter: string): T[] {
  return filter === "all" ? items : items.filter((item) => item.tags.includes(filter));
}

export function formatPrice(value: number): string {
  return `¥${value}`;
}

export function pricePerDay(price: number, days: number): string {
  return `¥${(price / days).toFixed(1)} / 天`;
}

/**
 * 把「RTC 会话状态 + 构建期是否配了后端地址」映射成面板展示状态。
 *
 * 原来的 nextVoiceState() 是个纯本地的状态轮播（idle→connecting→active→idle），
 * 定时器一拍就切到 active，和真实连接毫无关系 —— 语音接上真的之后必须由真状态驱动，
 * 否则用户会在 AI 还没进房时就开始说话。
 */
export function voiceDisplayState(
  status: "idle" | "connecting" | "active" | "error",
  hasBackend: boolean,
): VoiceState {
  // 静态导出站没有服务端，未注入 NEXT_PUBLIC_VOICE_API 时属于构建配置问题，
  // 不是运行期故障，所以单独给一个状态而不是报错。
  if (!hasBackend) return "unsupported";
  return status;
}
