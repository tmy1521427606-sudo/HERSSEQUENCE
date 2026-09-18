export type ChapterId = "profile" | "diet" | "lifestyle" | "safety";

export type QuestionType = "single" | "multi" | "scale" | "matrix" | "confirm";

export type StageId = "daily" | "preconception" | "pregnancy" | "postpartum" | "cycle" | "menopause";

export type DimensionId = "sleep" | "energy" | "cycle" | "recovery" | "digestion" | "hairSkin";

export type AnswerValue = string | string[] | Record<string, number | string>;
export type AssessmentAnswers = Record<string, AnswerValue>;

export type QuestionOption = { id: string; label: string; detail?: string };

export type ScaleItem = { id: string; label: string };

export type MatrixRow = { id: string; label: string };

export type ConfirmItem = {
  id: string;
  label: string;
  /** yes 时的安全后果：high 直接停止具体推荐，medium 进入专业确认。 */
  risk: "high" | "medium";
};

export type VisibilityContext = {
  single: (id: string) => string;
  multi: (id: string) => string[];
  scale: (id: string) => Record<string, number>;
  matrix: (id: string) => Record<string, string>;
  confirm: (id: string) => Record<string, string>;
  answered: (id: string) => boolean;
};

export type AssessmentQuestion = {
  id: string;
  chapter: ChapterId;
  core: boolean;
  type: QuestionType;
  title: string;
  description?: string;
  options?: QuestionOption[];
  maxSelections?: number;
  scaleItems?: ScaleItem[];
  scaleLabels?: string[];
  matrixRows?: MatrixRow[];
  matrixOptions?: QuestionOption[];
  confirmItems?: ConfirmItem[];
  visibleWhen?: (ctx: VisibilityContext) => boolean;
};

export const chapters: { id: ChapterId; label: string; eyebrow: string; description: string }[] = [
  { id: "profile", label: "基础画像", eyebrow: "CHAPTER 01", description: "年龄、生命阶段与你最想优先照顾的方向。" },
  { id: "diet", label: "饮食与来源", eyebrow: "CHAPTER 02", description: "饮食方式、排除项与关键食物的日常频率。" },
  { id: "lifestyle", label: "感受与节奏", eyebrow: "CHAPTER 03", description: "身体感受、运动、作息与生活压力概况。" },
  { id: "safety", label: "补剂与安全", eyebrow: "CHAPTER 04", description: "现有补剂与安全情况，用来守住推荐边界。" },
];

const stageOf = (ctx: VisibilityContext) => ctx.single("stage");

const hasLifestyle = (ctx: VisibilityContext, id: string) => ctx.multi("lifestyle").includes(id);
const scaleAtLeast = (ctx: VisibilityContext, id: string, value: number) => (ctx.scale("wellbeing")[id] ?? 0) >= value;
const matrixIs = (ctx: VisibilityContext, row: string, value: string) => ctx.matrix("foodFrequency")[row] === value;

export const questions: AssessmentQuestion[] = [
  {
    id: "age",
    chapter: "profile",
    core: true,
    type: "single",
    title: "你处在哪个年龄区间？",
    description: "年龄影响不同营养素的优先级，我们只记录区间。",
    options: [
      { id: "18-24", label: "18–24 岁" },
      { id: "25-34", label: "25–34 岁" },
      { id: "35-44", label: "35–44 岁" },
      { id: "45-54", label: "45–54 岁" },
      { id: "55+", label: "55 岁及以上" },
    ],
  },
  {
    id: "stage",
    chapter: "profile",
    core: true,
    type: "single",
    title: "你当前处于哪个生命阶段？",
    description: "阶段优先于一般目标，是整个方案的第一层依据。",
    options: [
      { id: "daily", label: "日常女性", detail: "暂无特殊阶段计划" },
      { id: "preconception", label: "备孕", detail: "正在或计划迎接新生命" },
      { id: "pregnancy", label: "孕期", detail: "确认怀孕中" },
      { id: "postpartum", label: "产后", detail: "分娩后的恢复阶段" },
      { id: "cycle", label: "周期关注", detail: "希望更细地照顾周期" },
      { id: "menopause", label: "更年期", detail: "围绝经期或绝经后" },
    ],
  },
  {
    id: "goals",
    chapter: "profile",
    core: true,
    type: "multi",
    maxSelections: 2,
    title: "你最想优先照顾哪两个方向？",
    description: "最多选择两项。少即是多，克制才有坚持。",
    options: [
      { id: "sleep", label: "睡眠与压力", detail: "希望更从容地放松" },
      { id: "energy", label: "精力与专注", detail: "白天状态更稳定" },
      { id: "active", label: "运动与恢复", detail: "训练之外也重视恢复" },
      { id: "cycle", label: "周期营养", detail: "经期前后的支持" },
      { id: "digestion", label: "消化舒适", detail: "日常消化更轻松" },
      { id: "hairSkin", label: "头发与皮肤", detail: "状态更稳定有光泽" },
      { id: "balance", label: "基础均衡", detail: "先补齐基础营养" },
    ],
  },
  {
    id: "preconceptionTiming",
    chapter: "profile",
    core: false,
    type: "single",
    title: "备孕计划大概在什么时间？",
    visibleWhen: (ctx) => stageOf(ctx) === "preconception",
    options: [
      { id: "within3", label: "3 个月内" },
      { id: "within12", label: "3–12 个月" },
      { id: "planning", label: "暂无明确时间" },
    ],
  },
  {
    id: "preconceptionSupplement",
    chapter: "profile",
    core: false,
    type: "single",
    title: "是否正在使用备孕或产前补剂？",
    visibleWhen: (ctx) => stageOf(ctx) === "preconception",
    options: [
      { id: "yes", label: "是，正在使用" },
      { id: "no", label: "没有使用" },
    ],
  },
  {
    id: "pregnancyStage",
    chapter: "profile",
    core: false,
    type: "single",
    title: "目前处于哪个孕期阶段？",
    visibleWhen: (ctx) => stageOf(ctx) === "pregnancy",
    options: [
      { id: "first", label: "孕早期（1–12 周）" },
      { id: "second", label: "孕中期（13–27 周）" },
      { id: "third", label: "孕晚期（28 周后）" },
    ],
  },
  {
    id: "pregnancyAdvice",
    chapter: "profile",
    core: false,
    type: "single",
    title: "是否已有医生建议的补充安排？",
    visibleWhen: (ctx) => stageOf(ctx) === "pregnancy",
    options: [
      { id: "yes", label: "有明确建议" },
      { id: "partial", label: "有部分建议" },
      { id: "no", label: "还没有" },
    ],
  },
  {
    id: "postpartumStage",
    chapter: "profile",
    core: false,
    type: "single",
    title: "产后处于哪个阶段？",
    visibleWhen: (ctx) => stageOf(ctx) === "postpartum",
    options: [
      { id: "early", label: "产后 0–6 个月" },
      { id: "middle", label: "产后 6–12 个月" },
      { id: "later", label: "产后 12 个月以上" },
    ],
  },
  {
    id: "breastfeeding",
    chapter: "profile",
    core: false,
    type: "single",
    title: "目前是否正在哺乳？",
    visibleWhen: (ctx) => stageOf(ctx) === "postpartum",
    options: [
      { id: "yes", label: "是，正在哺乳" },
      { id: "no", label: "没有哺乳" },
    ],
  },
  {
    id: "cycleRegularity",
    chapter: "profile",
    core: false,
    type: "single",
    title: "你的周期规律程度如何？",
    visibleWhen: (ctx) => stageOf(ctx) === "cycle",
    options: [
      { id: "regular", label: "比较规律" },
      { id: "irregular", label: "经常提前或推迟" },
      { id: "varies", label: "变化较大，难以预测" },
    ],
  },
  {
    id: "cycleImpact",
    chapter: "profile",
    core: false,
    type: "single",
    title: "周期对你日常的影响程度？",
    visibleWhen: (ctx) => stageOf(ctx) === "cycle",
    options: [
      { id: "mild", label: "影响不大" },
      { id: "moderate", label: "有一些影响" },
      { id: "strong", label: "影响明显" },
    ],
  },
  {
    id: "menopausePhase",
    chapter: "profile",
    core: false,
    type: "single",
    title: "目前处于更年期的哪个阶段？",
    visibleWhen: (ctx) => stageOf(ctx) === "menopause",
    options: [
      { id: "peri", label: "围绝经期" },
      { id: "post", label: "绝经后" },
    ],
  },
  {
    id: "menopauseChange",
    chapter: "profile",
    core: false,
    type: "single",
    title: "最近最明显的变化是什么？",
    visibleWhen: (ctx) => stageOf(ctx) === "menopause",
    options: [
      { id: "hotFlush", label: "潮热与夜间醒来" },
      { id: "mood", label: "情绪波动" },
      { id: "bone", label: "骨骼与关节关注" },
      { id: "energy", label: "活力下降" },
    ],
  },
  {
    id: "dietPattern",
    chapter: "diet",
    core: true,
    type: "single",
    title: "哪一种最接近你的饮食方式？",
    options: [
      { id: "balanced", label: "均衡饮食", detail: "日常食物种类相对丰富" },
      { id: "vegetarian", label: "偏素食", detail: "多数时候以植物性食物为主" },
      { id: "vegan", label: "纯素食", detail: "不选择动物来源食物" },
      { id: "irregular", label: "饮食不规律", detail: "经常外食、跳餐或时间不固定" },
    ],
  },
  {
    id: "exclusions",
    chapter: "diet",
    core: true,
    type: "multi",
    title: "是否有过敏、不耐受或主动排除的食物？",
    description: "这些会进入强制排除范围，用于核对成分来源。可多选。",
    options: [
      { id: "none", label: "没有需要排除的" },
      { id: "fish", label: "鱼类 / 海鲜" },
      { id: "dairy", label: "奶制品" },
      { id: "egg", label: "蛋类" },
      { id: "soy", label: "大豆" },
      { id: "gluten", label: "麸质" },
    ],
  },
  {
    id: "foodFrequency",
    chapter: "diet",
    core: true,
    type: "matrix",
    title: "这些食物你多久吃一次？",
    description: "逐行选择最接近的频率，用来估计饮食缺口方向。",
    matrixRows: [
      { id: "redMeat", label: "红肉" },
      { id: "fish", label: "鱼类" },
      { id: "eggs", label: "蛋类" },
      { id: "dairy", label: "奶制品" },
      { id: "legumes", label: "豆类" },
      { id: "darkVeg", label: "深色蔬菜" },
      { id: "fruit", label: "水果" },
      { id: "grains", label: "全谷物" },
    ],
    matrixOptions: [
      { id: "rarely", label: "几乎不吃" },
      { id: "weekly12", label: "每周 1–2 次" },
      { id: "weekly35", label: "每周 3–5 次" },
      { id: "daily", label: "几乎每天" },
    ],
  },
  {
    id: "plantFocus",
    chapter: "diet",
    core: false,
    type: "multi",
    maxSelections: 2,
    title: "植物性饮食下，最想优先保障哪些来源？",
    description: "这些营养素在植物性饮食中更需要留意来源。",
    visibleWhen: (ctx) => ctx.single("dietPattern") === "vegetarian" || ctx.single("dietPattern") === "vegan",
    options: [
      { id: "b12", label: "维生素 B12" },
      { id: "omega3", label: "Omega-3（藻油来源）" },
      { id: "iron", label: "铁" },
      { id: "iodine", label: "碘" },
    ],
  },
  {
    id: "algalPreference",
    chapter: "diet",
    core: false,
    type: "single",
    title: "对藻油来源的 Omega-3 接受吗？",
    visibleWhen: (ctx) =>
      ctx.single("dietPattern") === "vegan" || matrixIs(ctx, "fish", "rarely") || matrixIs(ctx, "fish", "weekly12"),
    options: [
      { id: "prefer", label: "倾向藻油来源" },
      { id: "open", label: "来源没有特别偏好" },
    ],
  },
  {
    id: "calciumSource",
    chapter: "diet",
    core: false,
    type: "single",
    title: "不依赖奶制品时，钙主要来自哪里？",
    visibleWhen: (ctx) => matrixIs(ctx, "dairy", "rarely") || ctx.multi("exclusions").includes("dairy"),
    options: [
      { id: "fortified", label: "钙强化植物奶 / 食品" },
      { id: "tofu", label: "豆制品" },
      { id: "greens", label: "绿叶菜 / 芝麻" },
      { id: "unsure", label: "不太确定" },
    ],
  },
  {
    id: "wellbeing",
    chapter: "lifestyle",
    core: true,
    type: "scale",
    title: "最近一个月，这些感受出现的频率？",
    description: "按困扰频率打分：1 表示几乎没有，5 表示经常出现。只用于排序，不作诊断。",
    scaleItems: [
      { id: "sleep", label: "入睡慢或睡眠不足" },
      { id: "stress", label: "紧张或压力感受" },
      { id: "energy", label: "精力不济或难以专注" },
      { id: "digestion", label: "胀气或消化不适" },
      { id: "cycle", label: "周期前后不适" },
      { id: "hairSkin", label: "头发或皮肤状态下滑" },
      { id: "recovery", label: "运动后恢复慢" },
    ],
    scaleLabels: ["几乎没有", "偶尔", "有时", "经常", "几乎总是"],
  },
  {
    id: "lifestyle",
    chapter: "lifestyle",
    core: true,
    type: "multi",
    maxSelections: 3,
    title: "最近的节奏中，哪些符合你的情况？",
    description: "最多选择三项。",
    options: [
      { id: "exercise", label: "每周规律运动" },
      { id: "indoor", label: "户外与日照较少" },
      { id: "caffeine", label: "下午之后仍摄入咖啡因" },
      { id: "alcohol", label: "每周会饮酒" },
      { id: "lateSleep", label: "经常晚睡" },
      { id: "shiftWork", label: "轮班或频繁差旅" },
    ],
  },
  {
    id: "sleepDetail",
    chapter: "lifestyle",
    core: false,
    type: "single",
    title: "睡眠与压力方面，最想改善的是？",
    visibleWhen: (ctx) =>
      scaleAtLeast(ctx, "sleep", 4) ||
      scaleAtLeast(ctx, "stress", 4) ||
      hasLifestyle(ctx, "lateSleep") ||
      hasLifestyle(ctx, "shiftWork") ||
      hasLifestyle(ctx, "caffeine"),
    options: [
      { id: "hardFall", label: "入睡困难" },
      { id: "lightSleep", label: "夜间易醒" },
      { id: "caffeineLate", label: "咖啡因时间偏晚" },
      { id: "shift", label: "作息随工作频繁变化" },
    ],
  },
  {
    id: "exerciseDetail",
    chapter: "lifestyle",
    core: false,
    type: "single",
    title: "运动与恢复方面，最接近的是？",
    visibleWhen: (ctx) => hasLifestyle(ctx, "exercise") || scaleAtLeast(ctx, "recovery", 4),
    options: [
      { id: "wellRecovered", label: "训练后恢复良好" },
      { id: "sore", label: "常感酸痛或疲劳" },
      { id: "plateau", label: "状态进入平台期" },
    ],
  },
  {
    id: "cycleDetail",
    chapter: "lifestyle",
    core: false,
    type: "single",
    title: "周期前后，最明显的感受是？",
    visibleWhen: (ctx) => scaleAtLeast(ctx, "cycle", 4) || stageOf(ctx) === "cycle",
    options: [
      { id: "pms", label: "经前情绪波动" },
      { id: "cramps", label: "经期不适" },
      { id: "fatigue", label: "经期疲劳" },
      { id: "heavy", label: "经量较多" },
    ],
  },
  {
    id: "hairDetail",
    chapter: "lifestyle",
    core: false,
    type: "single",
    title: "头发与皮肤的变化持续多久了？",
    visibleWhen: (ctx) => scaleAtLeast(ctx, "hairSkin", 4),
    options: [
      { id: "recent", label: "近 3 个月内" },
      { id: "longer", label: "超过 3 个月" },
      { id: "withDietChange", label: "伴随饮食变化出现" },
    ],
  },
  {
    id: "digestionDetail",
    chapter: "lifestyle",
    core: false,
    type: "single",
    title: "消化方面，最接近的情况是？",
    visibleWhen: (ctx) => scaleAtLeast(ctx, "digestion", 4) || ctx.single("dietPattern") === "irregular",
    options: [
      { id: "bloating", label: "餐后胀气" },
      { id: "irregularMeal", label: "进餐时间不规律" },
      { id: "sensitive", label: "对特定食物敏感" },
    ],
  },
  {
    id: "supplements",
    chapter: "safety",
    core: true,
    type: "multi",
    title: "目前正在使用哪些补剂？",
    description: "只记录类别，用于避免重复摄入。可多选。",
    options: [
      { id: "none", label: "目前没有使用" },
      { id: "multivitamin", label: "综合维生素" },
      { id: "iron", label: "铁" },
      { id: "calcium", label: "钙" },
      { id: "vitaminD", label: "维生素 D" },
      { id: "omega3", label: "Omega-3" },
      { id: "folate", label: "叶酸" },
      { id: "magnesium", label: "镁" },
      { id: "other", label: "其他补剂" },
    ],
  },
  {
    id: "safetyChecks",
    chapter: "safety",
    core: true,
    type: "confirm",
    title: "最后，请逐项确认以下安全情况",
    description: "这些回答决定我们能否为你生成具体方案，只保存在当前页面。",
    confirmItems: [
      { id: "prescription", label: "正在服用处方药", risk: "medium" },
      { id: "thyroid", label: "存在甲状腺相关情况", risk: "medium" },
      { id: "chronic", label: "存在慢性疾病", risk: "medium" },
      { id: "surgery", label: "近期手术或处于恢复期", risk: "medium" },
      { id: "restricted", label: "专业人士要求限制某些营养素", risk: "high" },
      { id: "ingredientAllergy", label: "已知对补充剂成分过敏", risk: "high" },
    ],
  },
];

export type EvidenceLevel = "human" | "consensus" | "design";

export const evidenceLevels: Record<EvidenceLevel, { label: string; copy: string }> = {
  human: { label: "人体研究支持", copy: "针对该用途已有公开人体研究，具体剂量与人群结论以专业人士复核为准。" },
  consensus: { label: "营养学共识", copy: "属于营养学界普遍认可的基础营养素用途。" },
  design: { label: "配方设计依据", copy: "基于配方设计原则与常见饮食缺口估计，属于品牌内部设计依据。" },
};

export type PlanIngredient = {
  id: string;
  name: string;
  english: string;
  source: string;
  dose: string;
  timing: string;
  benefit: string;
  evidence: EvidenceLevel;
  accent: string;
  /** 与补剂类别重合时的映射，用于重复摄入检查。 */
  supplementCategory?: string;
  /** 甲状腺相关情况需要暂缓推荐的成分。 */
  requiresThyroidCaution?: boolean;
};

export const ingredients: Record<string, PlanIngredient> = {
  b12: {
    id: "b12",
    name: "活性 B12",
    english: "Methylcobalamin",
    source: "深度发酵来源",
    dose: "500 µg",
    timing: "早餐后",
    benefit: "参与正常能量代谢与红细胞形成",
    evidence: "consensus",
    accent: "#E86C8D",
    supplementCategory: "multivitamin",
  },
  d3: {
    id: "d3",
    name: "维生素 D3",
    english: "Lichen Cholecalciferol",
    source: "地衣来源，素食可用",
    dose: "1000 IU",
    timing: "早餐后",
    benefit: "支持钙吸收与骨骼、免疫的正常功能",
    evidence: "consensus",
    accent: "#F0B56B",
    supplementCategory: "vitaminD",
  },
  magnesium: {
    id: "magnesium",
    name: "甘氨酸镁",
    english: "Magnesium Glycinate",
    source: "螯合形态",
    dose: "300 mg",
    timing: "晚餐后",
    benefit: "支持正常神经与肌肉功能",
    evidence: "consensus",
    accent: "#9A87C2",
    supplementCategory: "magnesium",
  },
  theanine: {
    id: "theanine",
    name: "L-茶氨酸",
    english: "L-Theanine",
    source: "茶叶提取",
    dose: "200 mg",
    timing: "睡前",
    benefit: "适合高压节奏下的日常放松支持",
    evidence: "human",
    accent: "#7CA480",
  },
  algalDha: {
    id: "algalDha",
    name: "藻油 DHA",
    english: "Algal DHA",
    source: "微藻来源，不含鱼类",
    dose: "250 mg",
    timing: "午餐后",
    benefit: "来自微藻的脂肪酸来源",
    evidence: "consensus",
    accent: "#7AB8B1",
    supplementCategory: "omega3",
  },
  iron: {
    id: "iron",
    name: "甘氨酸铁",
    english: "Iron Bisglycinate",
    source: "螯合形态，温和易耐受",
    dose: "18 mg",
    timing: "午餐后",
    benefit: "提供女性常关注的铁来源",
    evidence: "consensus",
    accent: "#C96B78",
    supplementCategory: "iron",
  },
  folate: {
    id: "folate",
    name: "活性叶酸",
    english: "5-Methylfolate",
    source: "活性形式，无需转换",
    dose: "400 µg",
    timing: "早餐后",
    benefit: "参与细胞正常生长与形成",
    evidence: "consensus",
    accent: "#F2A8B7",
    supplementCategory: "folate",
  },
  choline: {
    id: "choline",
    name: "胆碱",
    english: "Choline Bitartrate",
    source: "合成来源，无常见过敏原",
    dose: "300 mg",
    timing: "午餐后",
    benefit: "参与正常脂质代谢，孕产阶段常被关注",
    evidence: "consensus",
    accent: "#7D93C9",
  },
  k2: {
    id: "k2",
    name: "维生素 K2",
    english: "Menaquinone-7",
    source: "发酵来源",
    dose: "90 µg",
    timing: "晚餐后",
    benefit: "支持正常骨骼营养管理",
    evidence: "consensus",
    accent: "#826D9F",
  },
  calcium: {
    id: "calcium",
    name: "海藻钙",
    english: "Algal Calcium",
    source: "海藻来源，不依赖奶制品",
    dose: "250 mg",
    timing: "晚餐后",
    benefit: "提供基础钙来源",
    evidence: "consensus",
    accent: "#B8C4A8",
    supplementCategory: "calcium",
  },
  b6: {
    id: "b6",
    name: "活性 B6",
    english: "Pyridoxal-5-Phosphate",
    source: "活性形式",
    dose: "20 mg",
    timing: "早餐后",
    benefit: "参与正常能量代谢与神经功能",
    evidence: "consensus",
    accent: "#D58CAA",
  },
  coq10: {
    id: "coq10",
    name: "辅酶 Q10",
    english: "Coenzyme Q10",
    source: "发酵法",
    dose: "100 mg",
    timing: "午餐后",
    benefit: "参与细胞能量产生",
    evidence: "human",
    accent: "#EE8C66",
  },
  iodine: {
    id: "iodine",
    name: "碘",
    english: "Potassium Iodide",
    source: "钾盐来源",
    dose: "150 µg",
    timing: "早餐后",
    benefit: "支持正常甲状腺功能所需的营养素",
    evidence: "consensus",
    accent: "#6FA8C9",
    requiresThyroidCaution: true,
  },
  fiber: {
    id: "fiber",
    name: "菊粉益生元",
    english: "Inulin Fiber",
    source: "菊苣根提取",
    dose: "5 g",
    timing: "晚餐后",
    benefit: "为肠道菌群提供日常膳食纤维",
    evidence: "design",
    accent: "#A8C6A0",
  },
  zinc: {
    id: "zinc",
    name: "甘氨酸锌",
    english: "Zinc Bisglycinate",
    source: "螯合形态",
    dose: "15 mg",
    timing: "晚餐后",
    benefit: "支持皮肤与免疫的正常功能",
    evidence: "consensus",
    accent: "#8FB6C9",
  },
};

export type BasePack = {
  id: StageId;
  title: string;
  label: string;
  summary: string;
  ingredientIds: string[];
  reason: string;
};

export const basePacks: Record<StageId, BasePack> = {
  daily: {
    id: "daily",
    title: "每日平衡基础包",
    label: "DAILY BALANCE",
    summary: "以稳定、易坚持为优先，补齐最常被忽略的基础营养。",
    ingredientIds: ["d3", "b12", "magnesium"],
    reason: "日常阶段没有额外压力信号时，优先建立可长期坚持的基础组合。",
  },
  preconception: {
    id: "preconception",
    title: "备孕准备基础包",
    label: "PRECONCEPTION CARE",
    summary: "围绕细胞生长与基础状态，提前为备孕阶段做准备。",
    ingredientIds: ["folate", "d3", "iodine"],
    reason: "备孕阶段以叶酸为核心，并关注维生素 D 与碘的基础状态。",
  },
  pregnancy: {
    id: "pregnancy",
    title: "孕期陪伴基础包",
    label: "PREGNANCY SUPPORT",
    summary: "以孕产阶段常被关注的营养素构成，需与产检医生确认。",
    ingredientIds: ["folate", "choline", "algalDha"],
    reason: "孕期对叶酸、胆碱与 DHA 的关注度高，具体剂量应遵医嘱。",
  },
  postpartum: {
    id: "postpartum",
    title: "产后恢复基础包",
    label: "POSTPARTUM RECOVERY",
    summary: "照顾分娩后的恢复节奏，关注铁与基础状态。",
    ingredientIds: ["iron", "b12", "d3"],
    reason: "产后阶段常关注铁与 B12 的补充，同时维持基础维生素 D。",
  },
  cycle: {
    id: "cycle",
    title: "周期关照基础包",
    label: "CYCLE CARE",
    summary: "从周期记录与日常营养入手，提供温和支持。",
    ingredientIds: ["b6", "magnesium", "iron"],
    reason: "周期关注从规律记录开始，镁、B6 与铁是常被讨论的组合方向。",
  },
  menopause: {
    id: "menopause",
    title: "更年期护航基础包",
    label: "MENOPAUSE SUPPORT",
    summary: "面向阶段转场，侧重骨骼营养与长期活力。",
    ingredientIds: ["k2", "d3", "calcium"],
    reason: "更年期阶段骨骼营养的优先级上升，K2、D3 与钙形成协作方向。",
  },
};

export type FocusModule = {
  id: DimensionId;
  title: string;
  label: string;
  ingredientIds: string[];
  summary: string;
};

export const focusModules: Record<DimensionId, FocusModule> = {
  sleep: {
    id: "sleep",
    title: "睡眠与压力支持",
    label: "CALM & REST",
    ingredientIds: ["magnesium", "theanine"],
    summary: "围绕高压生活中的日常放松与正常神经功能。",
  },
  energy: {
    id: "energy",
    title: "精力与专注支持",
    label: "ENERGY & FOCUS",
    ingredientIds: ["b12", "coq10"],
    summary: "从正常能量代谢出发，支持忙碌白天的基础状态。",
  },
  cycle: {
    id: "cycle",
    title: "周期营养支持",
    label: "CYCLE NOURISH",
    ingredientIds: ["b6", "iron"],
    summary: "为周期前后的节奏变化提供温和的营养方向。",
  },
  recovery: {
    id: "recovery",
    title: "运动恢复支持",
    label: "MOVE & RECOVER",
    ingredientIds: ["magnesium", "d3"],
    summary: "照顾规律运动后的肌肉状态与骨骼营养。",
  },
  digestion: {
    id: "digestion",
    title: "消化舒适支持",
    label: "GUT COMFORT",
    ingredientIds: ["fiber", "zinc"],
    summary: "用益生元膳食纤维与日常饮食节奏共同照顾消化。",
  },
  hairSkin: {
    id: "hairSkin",
    title: "头发与皮肤支持",
    label: "GLOW SUPPORT",
    ingredientIds: ["zinc", "iron"],
    summary: "从基础营养状态入手，支持皮肤与头发的正常状态。",
  },
};

export type DietaryNote = {
  id: string;
  title: string;
  copy: string;
};

export const stageLabels: Record<StageId, string> = {
  daily: "日常女性",
  preconception: "备孕",
  pregnancy: "孕期",
  postpartum: "产后",
  cycle: "周期关注",
  menopause: "更年期",
};

export const dimensionLabels: Record<DimensionId, string> = {
  sleep: "睡眠与压力",
  energy: "精力与专注",
  cycle: "周期营养",
  recovery: "运动恢复",
  digestion: "消化舒适",
  hairSkin: "头发与皮肤",
};

export const checkoutCopy = {
  title: "确认你的订阅",
  eyebrow: "SECURE CHECKOUT",
  intro: "选择适合你的节奏，方案内容根据测评结果生成。",
  cycleLabel: "选择订阅周期",
  addressLabel: "收货信息",
  addressNote: "收货信息只保存在当前页面内，刷新后即清除。",
  paymentLabel: "支付方式",
  summary: "订单摘要",
  original: "原价",
  saving: "订阅优惠",
  total: "应付总额",
  confirm: "确认订阅",
  successTitle: "订阅已确认",
  successEyebrow: "SUBSCRIPTION CONFIRMED",
  successCopy:
    "感谢你的信任。这是品牌站内的流程体验，不会发起扣款、发货或保存任何收货信息。",
  successOrderId: "HER-2026-0000",
  successOrderNote: "流程体验编号 · 未生成真实订单",
  backHome: "返回首页",
  retake: "重新测评",
};

export type BillingCycle = "monthly" | "quarterly";

export type OrderSummary = {
  days: number;
  compareAt: number;
  total: number;
  saving: number;
};

export const planPricing: Record<BillingCycle, OrderSummary> = {
  monthly: { days: 30, compareAt: 359, total: 299, saving: 60 },
  quarterly: { days: 90, compareAt: 1077, total: 759, saving: 318 },
};

export const paymentMethods = [
  { id: "wechat", label: "微信支付", mark: "微" },
  { id: "alipay", label: "支付宝", mark: "支" },
  { id: "card", label: "银行卡", mark: "卡" },
];

export const assessmentCopy = {
  intro: {
    eyebrow: "HER NUTRITION ASSESSMENT",
    title: "生成我的营养方案",
    copy: "四个章节、约 4–6 分钟。我们会结合你的生命阶段、饮食来源、生活节奏与安全情况，梳理出此刻更适合你的每日营养方向。",
    bullets: ["不询问疾病名称或检查结果", "答案只保存在当前页面", "安全规则优先于一切推荐得分"],
    duration: "约 4–6 分钟",
    start: "开始测评",
  },
  nav: {
    next: "下一题",
    prev: "上一题",
    submit: "生成我的营养方案",
    exit: "退出测评",
    chapter: "章节",
    progress: "整体进度",
  },
  errors: {
    single: "请先选择一个最接近你的选项。",
    multi: "请至少选择一项。",
    multiMax: "最多只能选择指定数量的选项。",
    scale: "请为每一行完成打分。",
    matrix: "请为每一种食物选择频率。",
    confirm: "请逐项确认安全情况。",
  },
  exitDialog: {
    title: "退出测评？",
    copy: "退出后当前答案不会保留，返回时需要重新开始。",
    confirm: "退出并返回首页",
    cancel: "继续测评",
  },
  result: {
    eyebrow: "YOUR PLAN",
    title: "你的阶段营养方案",
    profileTitle: "阶段营养画像",
    focusTitle: "关注度概览",
    baseTitle: "阶段基础方案",
    modulesTitle: "重点支持模块",
    dietTitle: "饮食来源提示",
    whyTitle: "为什么加入",
    whyNotTitle: "为什么没有加入",
    completenessTitle: "方案依据完整度",
    evidenceTitle: "证据等级说明",
    cautionTitle: "适用限制与提示",
    restart: "重新测评",
    checkout: "确认订阅",
    backEdit: "返回修改答案",
    greenLabel: "已生成完整方案",
    yellowLabel: "一般方向与专业确认",
    redLabel: "暂停具体推荐",
  },
  safety: {
    green: {
      title: "可以生成完整方案",
      copy: "根据你的回答，没有命中需要专业复核的条件。以下方案在安全范围内生成，正式使用前请阅读适用限制。",
    },
    yellow: {
      title: "先给出方向，再请专业人士确认",
      copy: "你的回答命中了需要专业确认的条件。我们只展示一般营养关注方向与排除项，不展示未经确认的精确组合。",
    },
    red: {
      title: "暂停具体推荐",
      copy: "根据你的回答，当前信息不足以安全生成具体方案。我们不会为这一组合给出成分建议，请先咨询专业人士。",
    },
    consult: "请携带完整配方表咨询医生或注册营养专业人士。",
    yellowReasons: {
      preconception: "备孕阶段的补充安排应结合个人计划与专业意见确认。",
      pregnancy: "孕期的营养需求与剂量应遵产检医生指导。",
      postpartumBreastfeeding: "哺乳期的成分选择需要额外谨慎，建议专业确认。",
      prescription: "处方药可能与部分营养素相互影响，需要专业人士核对。",
      thyroid: "甲状腺相关情况涉及碘等营养素的边界，需要专业确认。",
      chronic: "慢性疾病状态下的补充方案应先经专业评估。",
      surgery: "恢复期内的补充安排应先与主诊医生确认。",
      duplicate: "你已在使用的补剂与推荐成分存在重复，需要核对总摄入量。",
    },
    redReasons: {
      restricted: "专业人士要求限制某些营养素，规则无法确认安全边界。",
      ingredientAllergy: "已知对补充剂成分过敏，规则不能确认当前组合的安全性。",
      insufficient: "安全筛查未完成，当前信息不足以安全生成方案。",
    },
  },
};
