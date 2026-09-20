/**
 * 火山 RTC 私有消息协议（TLV）—— 从 rtc_basic/src/utils 移植。
 *
 * 房间内的 AI 智能体不通过业务接口回传状态，而是往房间里发**二进制消息**：
 *
 *   | magic number(4B) | length(4B, big-endian) | value(JSON) |
 *
 * magic number 是 4 个字符的类型码，决定 value 该怎么解读：
 *   'conv' → 对话状态（倾听 / 思考 / 说话 / 被打断 / 结束）
 *   'subv' → 实时字幕（用户说了什么、AI 说了什么）
 *   'tool' → Function Calling 调用请求
 *   'ctrl' → 我们发出去的指令（打断等）
 *   'func' → 我们回过去的工具调用结果
 *
 * 这套格式没有官方 npm 包，必须整段搬过来 —— 只搬 RtcClient 不搬这里，
 * 打断指令会发不出去（表现为按了「打断」AI 继续说）。
 */

export type AnyRecord = Record<string, unknown>;

/** 二进制消息类型码 */
export enum MESSAGE_TYPE {
  /** 对话状态变化 */
  BRIEF = "conv",
  /** 实时字幕 */
  SUBTITLE = "subv",
  /** Function Calling */
  FUNCTION_CALL = "tool",
}

/** 'conv' 消息里的 Stage.Code，对应智能体当前状态 */
export enum AGENT_STAGE {
  UNKNOWN = 0,
  LISTENING = 1,
  THINKING = 2,
  SPEAKING = 3,
  INTERRUPTED = 4,
  FINISHED = 5,
}

/** 我们发给智能体的指令类型 */
export enum COMMAND {
  /** 打断当前播报 */
  INTERRUPT = "interrupt",
  /** 外部文本直接走 TTS */
  EXTERNAL_TEXT_TO_SPEECH = "ExternalTextToSpeech",
  /** 外部文本走一轮完整 LLM */
  EXTERNAL_TEXT_TO_LLM = "ExternalTextToLLM",
}

/** 打断优先级 */
export enum INTERRUPT_PRIORITY {
  /** 占位，不发打断 */
  NONE = 0,
  /** 高：立即打断当前交互 */
  HIGH = 1,
  /** 中：等当前交互结束后再处理 */
  MEDIUM = 2,
  /** 低：正在交互时直接丢弃 */
  LOW = 3,
}

/**
 * 把字符串按 TLV 打包成二进制，用于 sendUserBinaryMessage。
 */
export function string2tlv(str: string, type: string): ArrayBuffer {
  const typeBuffer = new Uint8Array(4);

  for (let i = 0; i < type.length; i += 1) {
    typeBuffer[i] = type.charCodeAt(i);
  }

  const valueBuffer = new TextEncoder().encode(str);
  const length = valueBuffer.length;
  const tlvBuffer = new Uint8Array(8 + length);

  tlvBuffer.set(typeBuffer, 0);
  // length 用大端写入第 4-7 字节
  tlvBuffer[4] = (length >> 24) & 0xff;
  tlvBuffer[5] = (length >> 16) & 0xff;
  tlvBuffer[6] = (length >> 8) & 0xff;
  tlvBuffer[7] = length & 0xff;
  tlvBuffer.set(valueBuffer, 8);

  return tlvBuffer.buffer;
}

/** TLV 解包 */
export function tlv2String(tlvBuffer: ArrayBufferLike): { type: string; value: string } {
  const typeBuffer = new Uint8Array(tlvBuffer, 0, 4);
  const lengthBuffer = new Uint8Array(tlvBuffer, 4, 4);
  const valueBuffer = new Uint8Array(tlvBuffer, 8);

  let type = "";
  for (let i = 0; i < typeBuffer.length; i += 1) {
    type += String.fromCharCode(typeBuffer[i]);
  }

  const length =
    (lengthBuffer[0] << 24) | (lengthBuffer[1] << 16) | (lengthBuffer[2] << 8) | lengthBuffer[3];

  // 长度字段异常时退回剩余全部字节，避免字幕整段丢失
  const safeLength = Math.min(Math.max(length, 0), valueBuffer.length);
  const value = new TextDecoder().decode(valueBuffer.subarray(0, safeLength));

  return { type, value };
}

export type AgentBrief = {
  kind: "brief";
  stage: AGENT_STAGE;
  description: string;
};

export type AgentSubtitle = {
  kind: "subtitle";
  text: string;
  /** 是否是一个稳定的句子（false 表示还会接着变，用于增量字幕） */
  definite: boolean;
  /** 说话方：用户或 AI 的 userId */
  userId: string;
  paragraph: boolean;
};

export type AgentMessage = AgentBrief | AgentSubtitle;

/**
 * 解析房间内收到的二进制消息。
 * 任何解析失败都返回 null —— 房间里的消息格式由火山控制，不该因为它崩掉整个页面。
 */
export function parseAgentMessage(buffer: ArrayBuffer): AgentMessage | null {
  try {
    const { type, value } = tlv2String(buffer);
    const parsed = JSON.parse(value) as AnyRecord;

    if (type === MESSAGE_TYPE.BRIEF) {
      const stage = (parsed.Stage ?? {}) as { Code?: number; Description?: string };
      return {
        kind: "brief",
        stage: (stage.Code ?? AGENT_STAGE.UNKNOWN) as AGENT_STAGE,
        description: stage.Description ?? "",
      };
    }

    if (type === MESSAGE_TYPE.SUBTITLE) {
      const data = (Array.isArray(parsed.data) ? parsed.data[0] : undefined) as
        | { text?: string; definite?: boolean; userId?: string; paragraph?: boolean }
        | undefined;
      if (!data?.text) return null;
      return {
        kind: "subtitle",
        text: data.text,
        definite: Boolean(data.definite),
        userId: data.userId ?? "",
        paragraph: Boolean(data.paragraph),
      };
    }

    return null;
  } catch {
    return null;
  }
}
