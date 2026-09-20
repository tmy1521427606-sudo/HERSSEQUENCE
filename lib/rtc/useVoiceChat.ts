"use client";

/**
 * 语音对话会话 hook —— 把火山 RTC 的生命周期收敛成一个状态机。
 *
 * 一次完整的语音交互要做六件事，顺序不能乱：
 *   1. 取 RTC 凭据（后端签发 Token）
 *   2. 建引擎 → 加入房间（此时已能听到自己）
 *   3. 开麦采集 → 把自己的音频发布出去（不发布，ASR 收不到声音）
 *   4. 让火山在房间里拉起 AI 智能体（StartVoiceChat）
 *   5. 监听房间内二进制消息 → 驱动状态与字幕
 *   6. 结束时停智能体 → 退房 → 销毁引擎
 *
 * 第 4 步之后 AI 不一定马上开口：还要等机器人 userId 加入房间（onUserJoined），
 * 所以「连接中」的判定挂在机器人加入上，而不是挂在 StartVoiceChat 返回上。
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  COMMAND,
  INTERRUPT_PRIORITY,
  AGENT_STAGE,
  parseAgentMessage,
  string2tlv,
  type AgentMessage,
} from "./tlv";
import {
  fetchScenes,
  isVoiceBackendConfigured,
  startVoiceChat,
  stopVoiceChat,
  type VoiceSceneEntry,
} from "./voice-api";

export type VoiceChatStatus = "idle" | "connecting" | "active" | "error";

/** 对话气泡里显示的角色 */
export type SubtitleLine = {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** 该句是否已经说完 */
  definite: boolean;
};

export type VoiceChatController = {
  status: VoiceChatStatus;
  /** 已连接的秒数，用于面板上的计时器 */
  seconds: number;
  /** 本地麦克风音量 0-1，驱动音量条 */
  level: number;
  /** 智能体当前在做什么 */
  stage: "idle" | "listening" | "thinking" | "speaking";
  subtitles: SubtitleLine[];
  error: string | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  /** 打断 AI 当前播报（走 TLV 私有协议，不是业务接口） */
  interrupt: () => void;
};

const AUDIO_LEVEL_SCALE = 90;

export function useVoiceChat(): VoiceChatController {
  const [status, setStatus] = useState<VoiceChatStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [stage, setStage] = useState<VoiceChatController["stage"]>("idle");
  const [subtitles, setSubtitles] = useState<SubtitleLine[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 引擎实例不放进 state：它不需要触发重渲染，放 state 反而会在重建时泄漏。
  const engineRef = useRef<import("@volcengine/rtc").IRTCEngine | null>(null);
  const sceneRef = useRef<VoiceSceneEntry | null>(null);
  const runningRef = useRef(false);
  const subtitleSeq = useRef(0);

  const teardown = useCallback(async () => {
    const scene = sceneRef.current;
    const engine = engineRef.current;

    if (scene && engine) {
      // 先停智能体再退房：反过来会让 StopVoiceChat 找不到房间里的目标用户
      try {
        await stopVoiceChat(scene.scene.id);
      } catch {
        /* 智能体可能已经自己结束了，这里失败不影响退房 */
      }
    }

    if (engine) {
      try {
        engine.leaveRoom();
      } catch {
        /* 未入房时 leaveRoom 会抛，忽略 */
      }
      try {
        // 注意：createEngine / destroyEngine 挂在 default 导出上，不在模块命名空间上，
        // 所以不能写 const { destroyEngine } = await import("@volcengine/rtc")
        const VERTC = (await import("@volcengine/rtc")).default;
        VERTC.destroyEngine(engine);
      } catch {
        /* 引擎销毁失败只影响内存，不阻塞 UI 复位 */
      }
    }

    engineRef.current = null;
    sceneRef.current = null;
    runningRef.current = false;
  }, []);

  // 卸载时确保房间被正确清理，否则麦克风指示灯会一直亮着
  useEffect(
    () => () => {
      void teardown();
    },
    [teardown],
  );

  // 计时器
  useEffect(() => {
    if (status !== "active") {
      setSeconds(0);
      return;
    }
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [status]);

  // 音量条回落：没有新报告时把音量缓慢归零，避免卡在峰值
  useEffect(() => {
    if (status !== "active") {
      setLevel(0);
      return;
    }
    const id = window.setInterval(() => setLevel((value) => (value <= 0.02 ? 0 : value * 0.72)), 180);
    return () => window.clearInterval(id);
  }, [status]);

  const pushSubtitle = useCallback((message: AgentMessage, selfUserId: string) => {
    if (message.kind !== "subtitle") return;
    const role: SubtitleLine["role"] = message.userId === selfUserId ? "user" : "assistant";

    setSubtitles((current) => {
      const last = current[current.length - 1];
      // 同一方连续说话且不是新段落 → 覆盖最后一行，形成「逐字上屏」效果
      if (last && last.role === role && !last.definite && !message.paragraph) {
        const next = current.slice(0, -1);
        next.push({ ...last, text: message.text, definite: message.definite });
        return next;
      }
      subtitleSeq.current += 1;
      return [
        ...current,
        {
          id: `voice-${subtitleSeq.current}`,
          role,
          text: message.text,
          definite: message.definite,
        },
      ];
    });
  }, []);

  const start = useCallback(async () => {
    if (runningRef.current) return;

    if (typeof window === "undefined") return;

    if (!isVoiceBackendConfigured()) {
      setError("语音服务未配置：构建时缺少 NEXT_PUBLIC_VOICE_API");
      setStatus("error");
      return;
    }

    // getUserMedia 只在安全上下文可用：localhost 或 HTTPS。http 域名拿不到麦克风。
    if (!window.isSecureContext) {
      setError("当前不是安全上下文，浏览器不会授权麦克风。请使用 HTTPS 或 localhost 访问。");
      setStatus("error");
      return;
    }

    runningRef.current = true;
    setError(null);
    setSubtitles([]);
    setStage("idle");
    setStatus("connecting");

    try {
      // 2MB 左右的 SDK，按需加载，不进首屏
      const VERTC = (await import("@volcengine/rtc")).default;

      // 1. 取凭据
      const scene = await fetchScenes();
      sceneRef.current = scene;

      // 授权并确认有麦克风设备
      const permission = await VERTC.enableDevices({ video: false, audio: true });
      if (!permission.audio) {
        throw new Error("未获得麦克风权限，请在浏览器地址栏允许后重试");
      }

      // 2. 建引擎 + 入房
      const engine = VERTC.createEngine(scene.rtc.AppId);
      engineRef.current = engine;

      engine.on(VERTC.events.onError, (event: { errorCode: unknown }) => {
        console.error("[voice] RTC error", event);
        setError(`语音服务异常（${String(event.errorCode)}）`);
        setStatus("error");
      });

      engine.on(VERTC.events.onUserJoined, (event: { userInfo: { userId: string } }) => {
        // AI 机器人进房 = 对话真正开始
        if (event.userInfo?.userId === scene.scene.botName) {
          setStatus("active");
          setStage("listening");
        }
      });

      engine.on(VERTC.events.onUserLeave, (event: { userInfo: { userId: string } }) => {
        if (event.userInfo?.userId === scene.scene.botName) {
          setStage("idle");
        }
      });

      engine.on(VERTC.events.onLocalAudioPropertiesReport, (reports: { audioPropertiesInfo?: { linearVolume?: number } }[]) => {
        const info = reports?.[0]?.audioPropertiesInfo;
        const volume = info?.linearVolume ?? 0;
        setLevel(Math.min(1, volume / AUDIO_LEVEL_SCALE));
      });

      engine.on(VERTC.events.onRoomBinaryMessageReceived, (event: { message: ArrayBuffer }) => {
        const parsed = parseAgentMessage(event.message);
        if (!parsed) return;
        if (parsed.kind === "brief") {
          if (parsed.stage === AGENT_STAGE.THINKING) setStage("thinking");
          else if (parsed.stage === AGENT_STAGE.SPEAKING) setStage("speaking");
          else if (parsed.stage === AGENT_STAGE.FINISHED || parsed.stage === AGENT_STAGE.LISTENING) {
            setStage("listening");
          }
          return;
        }
        pushSubtitle(parsed, scene.rtc.UserId);
      });

      await engine.joinRoom(
        scene.rtc.Token,
        scene.rtc.RoomId,
        {
          userId: scene.rtc.UserId,
          extraInfo: JSON.stringify({
            call_scene: "RTC-AIGC",
            user_name: scene.rtc.UserId,
            user_id: scene.rtc.UserId,
          }),
        },
        { isAutoPublish: true, isAutoSubscribeAudio: true },
      );

      // 3. 采集并发布自己的声音 —— 少了这一步 ASR 收不到任何东西
      // MediaType 是命名导出，不属于 default 导出
      const { MediaType } = await import("@volcengine/rtc");
      await engine.startAudioCapture();
      await engine.publishStream(MediaType.AUDIO);

      // 4. 拉起智能体
      await startVoiceChat(scene.scene.id);

      // 注意：这里不把 status 置为 active。StartVoiceChat 只是「下达了任务」，
      // AI 真正能对话的标志是机器人 userId 加入房间（onUserJoined）。
      // 提前置 active 会让用户在 AI 还没准备好时就开始说话。
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      setError(message);
      setStatus("error");
      await teardown();
    }
  }, [pushSubtitle, teardown]);

  const stop = useCallback(async () => {
    await teardown();
    setStatus("idle");
    setStage("idle");
    setLevel(0);
  }, [teardown]);

  const interrupt = useCallback(() => {
    const engine = engineRef.current;
    const scene = sceneRef.current;
    if (!engine || !scene) return;
    try {
      engine.sendUserBinaryMessage(
        scene.scene.botName,
        string2tlv(
          JSON.stringify({
            Command: COMMAND.INTERRUPT,
            InterruptMode: INTERRUPT_PRIORITY.HIGH,
            Message: "",
          }),
          "ctrl",
        ),
      );
    } catch {
      /* 房间已断开时发指令会抛，忽略即可 */
    }
  }, []);

  return { status, seconds, level, stage, subtitles, error, start, stop, interrupt };
}
