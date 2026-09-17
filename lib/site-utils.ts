export type FilterableItem = { tags: readonly string[] };
export type VoiceState = "idle" | "connecting" | "active";

export function filterIngredients<T extends FilterableItem>(items: T[], filter: string): T[] {
  return filter === "all" ? items : items.filter((item) => item.tags.includes(filter));
}

export function formatPrice(value: number): string {
  return `¥${value}`;
}

export function pricePerDay(price: number, days: number): string {
  return `¥${(price / days).toFixed(1)} / 天`;
}

export function nextVoiceState(state: VoiceState): VoiceState {
  if (state === "idle") return "connecting";
  if (state === "connecting") return "active";
  return "idle";
}
