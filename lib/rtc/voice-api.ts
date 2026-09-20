/**
 * 语音交互的后端 HTTP 客户端。
 *
 * hersequence 是 `output: "export"` 的纯静态站，没有服务端，所以：
 *   - 页面只跑浏览器端 RTC SDK，负责采集麦克风、进出房间、播放 AI 声音；
 *   - 所有密钥（AK/SK、ASR/TTS AppId）留在独立部署的 FastAPI 后端里，
 *     由它签发 RTC Token、下发 VoiceChat 配置、并提供 CustomLLM 回调。
 *
 * 后端地址通过构建期环境变量注入，绝不写进代码：
 *   NEXT_PUBLIC_VOICE_API=https://voice.example.com
 *
 * 对应后端接口（rtc_basic/rag_llm_server/main.py）：
 *   POST /getScenes                        → 签发 RTC Token + 场景信息
 *   POST /proxy?Action=StartVoiceChat      → 让火山拉起 AI 智能体
 *   POST /proxy?Action=StopVoiceChat       → 结束智能体
 *   GET  /health                           → 自检（缺哪些环境变量）
 */

export const VOICE_API_BASE = (process.env.NEXT_PUBLIC_VOICE_API ?? "").replace(/\/+$/, "");

/** 是否配置了后端地址。没配时语音入口应给出明确提示，而不是静默失败。 */
export function isVoiceBackendConfigured(): boolean {
  return VOICE_API_BASE.length > 0;
}

export type VoiceSceneInfo = {
  id: string;
  name: string;
  /** 房间里的机器人 userId，发打断指令时要指定它 */
  botName: string;
  icon?: string;
  isInterruptMode?: boolean;
};

export type VoiceRtcCredential = {
  AppId: string;
  RoomId: string;
  UserId: string;
  Token: string;
};

export type VoiceSceneEntry = {
  scene: VoiceSceneInfo;
  rtc: VoiceRtcCredential;
};

type ProxyResponse = {
  ResponseMetadata?: { Error?: { Code?: string; Message?: string } };
};

async function postJson<T>(path: string, body: unknown, timeoutMs = 15000): Promise<T> {
  if (!isVoiceBackendConfigured()) {
    throw new Error("语音后端未配置（缺少 NEXT_PUBLIC_VOICE_API）");
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${VOICE_API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
      signal: controller.signal,
    });

    if (!response.ok) {
      // 后端在缺 AK/SK 时会返回 500 + {error, hint}
      let detail = `HTTP ${response.status}`;
      try {
        const payload = (await response.json()) as { error?: string; hint?: string };
        detail = [payload.error, payload.hint].filter(Boolean).join(" — ") || detail;
      } catch {
        /* 响应不是 JSON，保留状态码即可 */
      }
      throw new Error(detail);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("语音服务响应超时，请稍后重试");
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

/** 取 RTC 入房凭据。Token 由后端每次动态签发，不要在前端缓存。 */
export async function fetchScenes(): Promise<VoiceSceneEntry> {
  const data = await postJson<{ Result?: { scenes?: VoiceSceneEntry[] } }>("/getScenes", {});
  const entry = data.Result?.scenes?.[0];

  if (!entry?.rtc?.Token || !entry.rtc.AppId || !entry.rtc.RoomId) {
    throw new Error("后端未返回有效的 RTC 凭据，请检查 .env 中的 RTC_APP_ID / RTC_APP_KEY");
  }

  return entry;
}

/**
 * 让火山 RTC 在房间里拉起 AI 智能体（ASR + LLM + TTS 的编排）。
 * 注意：智能体真正「开口」还要等房间内的机器人用户加入，见 onUserJoined。
 */
export async function startVoiceChat(sceneId: string): Promise<void> {
  const result = await postJson<ProxyResponse>("/proxy?Action=StartVoiceChat&Version=2024-12-01", {
    SceneID: sceneId,
  });
  assertNoApiError(result);
}

export async function stopVoiceChat(sceneId: string): Promise<void> {
  const result = await postJson<ProxyResponse>("/proxy?Action=StopVoiceChat&Version=2024-12-01", {
    SceneID: sceneId,
  });
  assertNoApiError(result);
}

/**
 * 火山 OpenAPI 的失败是「HTTP 200 + 响应体里带 Error」，
 * 不看这一层的话前端会以为启动成功，然后卡在「AI 准备中」。
 */
function assertNoApiError(result: ProxyResponse): void {
  const error = result?.ResponseMetadata?.Error;
  if (error) {
    throw new Error(`火山 RTC 接口报错：${error.Code ?? "Unknown"} ${error.Message ?? ""}`.trim());
  }
}

export type VoiceBackendHealth = {
  status: "ok" | "incomplete";
  missing_env: string[];
  retrieval_source: string;
  callback_url: string;
};

/** 自检：一眼看出后端还缺哪些配置。用于开发期排查。 */
export async function checkVoiceBackendHealth(): Promise<VoiceBackendHealth> {
  const response = await fetch(`${VOICE_API_BASE}/health`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as VoiceBackendHealth;
}
