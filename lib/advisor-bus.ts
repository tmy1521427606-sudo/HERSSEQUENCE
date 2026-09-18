/** 顾问面板的全局打开事件：让页面上任意入口都能唤起右下角的顾问。 */
export const ADVISOR_OPEN_EVENT = "hersequence:advisor-open";

export function openAdvisorPanel(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ADVISOR_OPEN_EVENT));
}
