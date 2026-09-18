export type IconName =
  | "sparkles"
  | "target"
  | "calendar"
  | "shield"
  | "stethoscope"
  | "heart"
  | "clipboard"
  | "brain"
  | "package";

export type Persona = {
  id: string;
  name: string;
  english: string;
  eyebrow: string;
  tagline: string;
  ingredients: string[];
  detail: string;
  accent: string;
  imagePosition: string;
};

export type IngredientTag = "pregnancy" | "vegan" | "allergenFree";

export type Ingredient = {
  id: string;
  name: string;
  english: string;
  description: string;
  tags: IngredientTag[];
  accent: string;
};

export const navigation = [
  { label: "定制方式", href: "#how-it-works" },
  { label: "女性方案", href: "#personas" },
  { label: "透明成分", href: "#ingredients" },
  { label: "订阅计划", href: "#pricing" },
];

export const trustItems = [
  { id: "packs", label: "每日独立日包", icon: "package" as IconName },
  { id: "transparency", label: "来源与剂型透明", icon: "shield" as IconName },
  { id: "matching", label: "按阶段与目标组合", icon: "target" as IconName },
];

export const painPoints = [
  {
    id: "one-size",
    number: "01",
    icon: "sparkles" as IconName,
    title: "同一款，不适合每一个阶段",
    copy: "从经期到孕产、更年期，女性的营养需求会变化。方案也应该跟着你变化。",
  },
  {
    id: "precision",
    number: "02",
    icon: "target" as IconName,
    title: "盲目买，不如精准补",
    copy: "先了解饮食、作息与阶段需求，再从成分库中组合真正需要的每日方案。",
  },
  {
    id: "subscription",
    number: "03",
    icon: "calendar" as IconName,
    title: "订阅，让坚持更省心",
    copy: "每月按时到家，随状态调整方案。少一点选择疲劳，多一点稳定照顾。",
  },
];

export const steps = [
  {
    id: "assessment",
    number: "01",
    icon: "clipboard" as IconName,
    duration: "约 5 分钟",
    title: "完成女性健康测评",
    copy: "回答阶段、饮食、作息与近期关注，让需求不再停留在猜测。",
  },
  {
    id: "ai-plan",
    number: "02",
    icon: "brain" as IconName,
    duration: "即时生成",
    title: "生成你的专属方案",
    copy: "规则引擎梳理需求，AI 帮助解释方案，并以清晰理由说明每一种选择。",
  },
  {
    id: "delivery",
    number: "03",
    icon: "package" as IconName,
    duration: "每 30 天",
    title: "按月送到你的日常",
    copy: "独立日包、每日一袋；可暂停、可调整，让补充真正成为轻松习惯。",
  },
];

export const personas: Persona[] = [
  {
    id: "active",
    name: "运动达人",
    english: "ACTIVE WOMAN",
    eyebrow: "力量与恢复",
    tagline: "练得尽兴，也恢复得漂亮。",
    ingredients: ["镁", "维生素 D3", "辅酶 Q10"],
    detail: "围绕能量代谢、肌肉状态与日常恢复设计，适合稳定运动与高活动量生活。",
    accent: "#F0A06B",
    imagePosition: "0% 0%",
  },
  {
    id: "preconception",
    name: "备孕期",
    english: "PRECONCEPTION",
    eyebrow: "提前准备",
    tagline: "在相遇之前，先照顾好自己。",
    ingredients: ["活性叶酸", "胆碱", "碘"],
    detail: "关注备孕阶段的基础营养准备，配方信息清晰，并提示与专业人士沟通。",
    accent: "#D58CAA",
    imagePosition: "50% 0%",
  },
  {
    id: "maternal",
    name: "孕期 / 产后",
    english: "MATERNAL",
    eyebrow: "阶段陪伴",
    tagline: "每一段变化，都值得被温柔承接。",
    ingredients: ["DHA", "铁", "维生素 B12"],
    detail: "按孕产阶段呈现营养重点；实际使用应结合个人情况咨询专业人士。",
    accent: "#B998D2",
    imagePosition: "100% 0%",
  },
  {
    id: "cycle",
    name: "经期 / PMS",
    english: "CYCLE CARE",
    eyebrow: "周期支持",
    tagline: "懂你的周期，也懂那些不必硬扛的日子。",
    ingredients: ["镁", "维生素 B6", "钙"],
    detail: "从饮食与日常营养角度关注周期状态，强调规律记录与适量补充。",
    accent: "#E86C8D",
    imagePosition: "0% 100%",
  },
  {
    id: "menopause",
    name: "更年期",
    english: "MENOPAUSE",
    eyebrow: "从容转场",
    tagline: "身体在转场，你仍然可以掌握节奏。",
    ingredients: ["维生素 K2", "钙", "大豆异黄酮"],
    detail: "面向生命阶段变化的日常营养支持，侧重骨骼、活力与长期习惯管理。",
    accent: "#826D9F",
    imagePosition: "50% 100%",
  },
  {
    id: "high-pressure",
    name: "高压 / 熬夜党",
    english: "HIGH DEMAND",
    eyebrow: "作息修复",
    tagline: "忙碌不必等于透支。",
    ingredients: ["甘氨酸镁", "维生素 B 群", "L-茶氨酸"],
    detail: "围绕睡眠节律、精力与高压生活的营养支持设计，同时鼓励从作息本身开始改变。",
    accent: "#4F4B78",
    imagePosition: "100% 100%",
  },
];

export const ingredientFilters = [
  { id: "all", label: "全部成分" },
  { id: "pregnancy", label: "孕期可选" },
  { id: "vegan", label: "素食友好" },
  { id: "allergenFree", label: "无常见过敏原" },
] as const;

export const ingredients: Ingredient[] = [
  {
    id: "folate",
    name: "活性叶酸",
    english: "Methylfolate",
    description: "参与细胞正常生长与形成，使用更易识别的活性形式。",
    tags: ["pregnancy", "vegan", "allergenFree"],
    accent: "#F2A8B7",
  },
  {
    id: "magnesium",
    name: "甘氨酸镁",
    english: "Magnesium Glycinate",
    description: "温和的镁来源，用于支持日常神经与肌肉功能。",
    tags: ["pregnancy", "vegan", "allergenFree"],
    accent: "#9A87C2",
  },
  {
    id: "dha",
    name: "藻油 DHA",
    english: "Algal DHA",
    description: "来自微藻的脂肪酸来源，兼顾纯净来源与素食选择。",
    tags: ["pregnancy", "vegan", "allergenFree"],
    accent: "#7AB8B1",
  },
  {
    id: "b12",
    name: "维生素 B12",
    english: "Methylcobalamin",
    description: "参与正常能量代谢与红细胞形成，适合关注植物性饮食的人群。",
    tags: ["pregnancy", "vegan", "allergenFree"],
    accent: "#E86C8D",
  },
  {
    id: "d3",
    name: "维生素 D3",
    english: "Cholecalciferol",
    description: "支持钙吸收、骨骼与免疫系统的正常功能。",
    tags: ["pregnancy", "allergenFree"],
    accent: "#F0B56B",
  },
  {
    id: "iron",
    name: "温和铁",
    english: "Iron Bisglycinate",
    description: "螯合形态铁来源，面向女性阶段性铁需求设计。",
    tags: ["pregnancy", "vegan", "allergenFree"],
    accent: "#C96B78",
  },
  {
    id: "choline",
    name: "胆碱",
    english: "Choline Bitartrate",
    description: "参与正常脂质代谢，是孕产阶段常被关注的营养素。",
    tags: ["pregnancy", "allergenFree"],
    accent: "#7D93C9",
  },
  {
    id: "theanine",
    name: "L-茶氨酸",
    english: "L-Theanine",
    description: "来自茶叶的氨基酸，用于高压生活中的日常放松支持。",
    tags: ["vegan", "allergenFree"],
    accent: "#7CA480",
  },
  {
    id: "coq10",
    name: "辅酶 Q10",
    english: "Coenzyme Q10",
    description: "参与细胞能量产生，适合关注运动与活力状态的人群。",
    tags: ["allergenFree"],
    accent: "#EE8C66",
  },
];

export const stories = [
  {
    id: "lin",
    scene: "高压工作 · 睡眠关注",
    context: "31 岁 · 互联网从业者",
    quote: "以前买了一柜子瓶瓶罐罐，现在每天一袋，终于知道自己为什么在补。",
    duration: "00:18",
    imagePosition: "0% 50%",
  },
  {
    id: "miao",
    scene: "规律运动 · 素食饮食",
    context: "28 岁 · 运动爱好者",
    quote: "方案会说明成分来源和选择理由，信息很清楚，也更适合我的饮食方式。",
    duration: "00:24",
    imagePosition: "50% 50%",
  },
  {
    id: "chen",
    scene: "双职工家庭 · 周期管理",
    context: "39 岁 · 双职工妈妈",
    quote: "最喜欢的是可以调整和暂停。营养补充终于不再是一件有负担的事。",
    duration: "00:21",
    imagePosition: "100% 50%",
  },
];

export const principles = [
  {
    id: "method",
    title: "配方形成方法",
    role: "阶段基础包 + 最多两个重点模块",
    quote: "好的个性化不是把成分堆得更多，而是让每一种选择都有清楚理由。",
  },
  {
    id: "standards",
    title: "成分筛选标准",
    role: "来源、剂型与适用限制透明呈现",
    quote: "先把来源、剂型和限制条件说清楚，信任才有真正的起点。",
  },
];

export const plans = [
  {
    id: "monthly",
    label: "30 天装",
    days: 30,
    price: 299,
    compareAt: 359,
    saving: 17,
    note: "轻松开始，随时调整",
    badge: "灵活体验",
  },
  {
    id: "quarterly",
    label: "90 天装",
    days: 90,
    price: 759,
    compareAt: 1077,
    saving: 30,
    note: "一次规划，稳定坚持",
    badge: "最受欢迎",
  },
];

export const planBenefits = [
  "按阶段与生活方式组合每日营养",
  "独立日包，出差与通勤更方便",
  "订阅可暂停、跳过或调整周期",
  "每批次完成质量与标签复核",
];

export const faqs = [
  {
    id: "custom",
    question: "个性化方案是怎么生成的？",
    answer: "测评会收集生命阶段、饮食方式、作息与关注方向，再依据预设配方规则组合建议。本站为品牌展示，不会收集或保存真实健康信息。",
  },
  {
    id: "pregnancy",
    question: "备孕、孕期或哺乳期可以直接使用吗？",
    answer: "这些阶段存在更具体的营养需求与限制。本站内容为品牌展示，实际补充前应携带完整配方表咨询医生或营养专业人士。",
  },
  {
    id: "medication",
    question: "正在服用药物时怎么办？",
    answer: "营养补充剂可能与部分药物或检查项目产生相互影响。请先向专业人士确认，并提供当前使用的药物与补充剂清单。",
  },
  {
    id: "adjust",
    question: "状态变化后可以调整方案吗？",
    answer: "可以。品牌概念设定支持重新测评并调整下一周期方案，例如饮食改变、运动量变化或进入新的生命阶段。",
  },
  {
    id: "subscription",
    question: "订阅可以暂停或取消吗？",
    answer: "概念服务支持在下一周期锁单前暂停、跳过或取消。当前展示站没有真实账户和扣款行为。",
  },
  {
    id: "testing",
    question: "如何确认产品质量？",
    answer: "正式产品应提供原料来源、批次检测、标签复核与适用限制。本展示站中的信任数据和专家身份均为概念内容，不代表真实机构认证。",
  },
];

export const footerColumns = [
  { title: "定制营养", links: ["女性方案", "透明成分", "订阅计划", "常见问题"] },
  { title: "了解她序", links: ["品牌理念", "质量标准", "内容中心", "联系我们"] },
  { title: "关注我们", links: ["小红书", "微信", "抖音", "微博"] },
];

export const compliance =
  "本网站为品牌展示站，不销售实体产品、不发起真实扣款。产品信息仅用于营养与生活方式教育，不构成医疗建议；正式发布前，配方内容由专业人士复核。";
