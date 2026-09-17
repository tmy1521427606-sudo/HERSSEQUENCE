export type StageId = "daily" | "preconception" | "maternal" | "cycle" | "menopause";
export type GoalId = "sleep" | "energy" | "active" | "cycle" | "balance";
export type DietId = "balanced" | "vegetarian" | "vegan" | "irregular";
export type RoutineId = "regular" | "pressure" | "late" | "shift";
export type AnswerKey = "stage" | "goal" | "diet" | "routine";

export type QuizOption = {
  id: string;
  label: string;
  detail: string;
  symbol: string;
};

export type QuizQuestion = {
  id: AnswerKey;
  eyebrow: string;
  title: string;
  description: string;
  options: QuizOption[];
};

export type Nutrient = {
  name: string;
  english: string;
  timing: string;
  benefit: string;
  accent: string;
};

export const questions: QuizQuestion[] = [
  {
    id: "stage",
    eyebrow: "LIFE STAGE",
    title: "此刻的你，正处在哪个阶段？",
    description: "阶段不同，值得优先关注的营养重点也会改变。",
    options: [
      { id: "daily", label: "日常维持", detail: "关注长期基础营养与稳定状态", symbol: "日" },
      { id: "preconception", label: "备孕准备", detail: "提前关注叶酸、胆碱等基础营养", symbol: "芽" },
      { id: "maternal", label: "孕期 / 产后", detail: "处于变化更明显的孕产阶段", symbol: "伴" },
      { id: "cycle", label: "经期关注", detail: "希望更细致地理解周期营养", symbol: "月" },
      { id: "menopause", label: "更年期", detail: "关注生命阶段转场与长期活力", symbol: "序" },
    ],
  },
  {
    id: "goal",
    eyebrow: "YOUR FOCUS",
    title: "你最近最想优先照顾什么？",
    description: "只选一个主要方向，我们会让方案保持克制。",
    options: [
      { id: "sleep", label: "睡眠与压力", detail: "忙碌之后，希望更从容地放松", symbol: "眠" },
      { id: "energy", label: "精力与专注", detail: "希望白天的状态更稳定", symbol: "能" },
      { id: "active", label: "运动与恢复", detail: "规律训练，也重视日常恢复", symbol: "动" },
      { id: "cycle", label: "周期营养", detail: "关注经期前后与日常记录", symbol: "期" },
      { id: "balance", label: "基础均衡", detail: "先把每天的基础营养补齐", symbol: "衡" },
    ],
  },
  {
    id: "diet",
    eyebrow: "YOUR DIET",
    title: "哪一种更接近你的饮食方式？",
    description: "这会影响原料来源与部分营养素的呈现方式。",
    options: [
      { id: "balanced", label: "均衡饮食", detail: "日常食物种类相对丰富", symbol: "衡" },
      { id: "vegetarian", label: "偏素食", detail: "多数时候以植物性食物为主", symbol: "植" },
      { id: "vegan", label: "纯素食", detail: "不选择动物来源食物", symbol: "素" },
      { id: "irregular", label: "饮食不规律", detail: "经常外食、跳餐或时间不固定", symbol: "时" },
    ],
  },
  {
    id: "routine",
    eyebrow: "DAILY RHYTHM",
    title: "最近的生活节奏怎么样？",
    description: "营养只是支持，真正的改变也来自可持续的日常。",
    options: [
      { id: "regular", label: "比较规律", detail: "睡眠、用餐和工作节奏稳定", symbol: "稳" },
      { id: "pressure", label: "高压忙碌", detail: "任务密集，很少真正放松", symbol: "压" },
      { id: "late", label: "经常晚睡", detail: "入睡时间偏晚或睡眠不足", symbol: "夜" },
      { id: "shift", label: "轮班 / 差旅", detail: "作息经常随工作地点变化", symbol: "换" },
    ],
  },
];

export const goalPlans: Record<GoalId, { title: string; label: string; reason: string; nutrients: [Nutrient, Nutrient] }> = {
  sleep: {
    title: "静夜舒缓方案",
    label: "CALM & REST",
    reason: "围绕高压生活中的日常放松与正常能量代谢，减少不必要的成分堆叠。",
    nutrients: [
      { name: "甘氨酸镁", english: "Magnesium Glycinate", timing: "晚餐后", benefit: "支持正常神经与肌肉功能", accent: "#9A87C2" },
      { name: "L-茶氨酸", english: "L-Theanine", timing: "睡前", benefit: "适合高压节奏下的日常放松支持", accent: "#7CA480" },
    ],
  },
  energy: {
    title: "清醒续航方案",
    label: "ENERGY & FOCUS",
    reason: "从正常能量代谢与稳定补充出发，支持忙碌白天的基础状态。",
    nutrients: [
      { name: "活性 B12", english: "Methylcobalamin", timing: "早餐后", benefit: "参与正常能量代谢与红细胞形成", accent: "#E86C8D" },
      { name: "辅酶 Q10", english: "Coenzyme Q10", timing: "午餐后", benefit: "参与细胞能量产生", accent: "#EE8C66" },
    ],
  },
  active: {
    title: "轻盈恢复方案",
    label: "MOVE & RECOVER",
    reason: "围绕规律运动后的日常恢复与骨骼营养，把补充融入训练节奏。",
    nutrients: [
      { name: "维生素 D3", english: "Vitamin D3", timing: "早餐后", benefit: "支持钙吸收与骨骼正常功能", accent: "#F0B56B" },
      { name: "甘氨酸镁", english: "Magnesium Glycinate", timing: "晚餐后", benefit: "支持正常肌肉功能", accent: "#9A87C2" },
    ],
  },
  cycle: {
    title: "周期从容方案",
    label: "CYCLE CARE",
    reason: "从周期记录与日常营养入手，为每个月的节奏变化提供温和支持。",
    nutrients: [
      { name: "维生素 B6", english: "Vitamin B6", timing: "早餐后", benefit: "参与正常能量代谢", accent: "#D58CAA" },
      { name: "温和铁", english: "Iron Bisglycinate", timing: "午餐后", benefit: "提供女性常关注的铁来源", accent: "#C96B78" },
    ],
  },
  balance: {
    title: "每日基础方案",
    label: "DAILY BALANCE",
    reason: "先补齐容易被忽略的基础营养，用清晰、轻量的组合建立长期习惯。",
    nutrients: [
      { name: "维生素 D3", english: "Vitamin D3", timing: "早餐后", benefit: "支持骨骼与免疫系统正常功能", accent: "#F0B56B" },
      { name: "活性 B12", english: "Methylcobalamin", timing: "早餐后", benefit: "参与正常能量代谢", accent: "#E86C8D" },
    ],
  },
};

export const stageNutrients: Record<StageId, Nutrient> = {
  daily: { name: "藻油 DHA", english: "Algal DHA", timing: "午餐后", benefit: "来自微藻的脂肪酸来源", accent: "#7AB8B1" },
  preconception: { name: "活性叶酸", english: "Methylfolate", timing: "早餐后", benefit: "备孕阶段常关注的基础营养", accent: "#F2A8B7" },
  maternal: { name: "胆碱", english: "Choline", timing: "午餐后", benefit: "孕产阶段常被关注的营养素", accent: "#7D93C9" },
  cycle: { name: "温和铁", english: "Iron Bisglycinate", timing: "午餐后", benefit: "提供女性常关注的铁来源", accent: "#C96B78" },
  menopause: { name: "维生素 K2", english: "Vitamin K2", timing: "晚餐后", benefit: "支持正常骨骼营养管理", accent: "#826D9F" },
};

export const stageReasons: Record<StageId, string> = {
  daily: "日常阶段以稳定、易坚持为优先。",
  preconception: "备孕阶段加入活性叶酸方向，并建议结合个人计划咨询专业人士。",
  maternal: "孕产阶段的实际补充应结合孕周、饮食与专业建议确认。",
  cycle: "经期关注从规律记录和均衡饮食开始，再观察长期变化。",
  menopause: "更年期阶段兼顾骨骼营养、活力与可持续生活习惯。",
};

export const routineNotes: Record<RoutineId, string> = {
  regular: "继续保留规律睡眠与用餐，让补充成为稳定日常的一部分。",
  pressure: "高压忙碌时，优先保留固定用餐和短暂休息，再谈额外补充。",
  late: "经常晚睡时，先从固定起床时间与减少睡前刺激开始调整。",
  shift: "轮班或差旅时，可用随身日包减少遗漏，并尽量锚定一段稳定休息时间。",
};

export const paymentMethods = [
  { id: "wechat", label: "微信支付", mark: "微" },
  { id: "alipay", label: "支付宝", mark: "支" },
  { id: "card", label: "银行卡", mark: "卡" },
];
