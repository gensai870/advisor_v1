import OpenAI from "openai";
import { retrieve } from "./embeddings";

export type FacilityInput = {
  facilityName: string;
  location?: string;
  classInfo?: string;
  disasterTypes: string[];
  notes?: string;
};

export const HAZARD_LOCATIONS = [
  "保育室",
  "ホール",
  "階段",
  "園庭",
  "給食室",
  "午睡・お昼寝スペース",
] as const;

export type HazardLocationBlock = {
  locationName: string;
  confirmed: string;
  unconfirmed: string;
  hazardPhenomena: string;
  currentMeasures: string;
  remainingRisk: string;
  expectedDamage: string;
  mitigationGoal: string;
  avoidanceCondition: string;
  measuresHardware: string;
  measuresSoftware: string;
  measuresHumanware: string;
};

export type HazardAssessment = {
  disasterType: string;
  assumedIntensity: string;
  referenceDoc: string;
  locations: HazardLocationBlock[];
};

export type MonthPlanRow = {
  month: string;
  disasterType: string;
  risk: string;
  theme: string;
  target: string;
  unit: string;
  participation: string;
  ability: string;
  notes: string;
};

export type DrillTemplate = {
  unit: string;
  target: string;
  targetDetail: string;
  linkedHazard: string;
  avoidedDamage: string;
  purpose: string;
  abilities: string;
  goalLevel: string;
  conditions: string;
  preLearning: string;
  safetyOptions: string;
  participationForm: string;
  evaluationMethod: string;
};

export type AnnualReviewGuide = {
  improvementsFacility: string;
  improvementsManual: string;
  improvementsPeople: string;
  remainingIssues: string;
  reflectHardware: string;
  reflectSoftware: string;
  reflectHumanware: string;
  reflectSheet1: string;
  reflectManualTraining: string;
  reflectNextYearPlan: string;
};

export type TrainingPlanSource = { id: string; chapter_no: string | null; title: string };

export type FullTrainingPlanResult = {
  facility: FacilityInput;
  hazardAssessment: HazardAssessment;
  months: MonthPlanRow[];
  drillTemplate: DrillTemplate;
  annualReviewGuide: AnnualReviewGuide;
  sources: TrainingPlanSource[];
};

const CHAT_MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `あなたは「NPO法人日本減災教育普及協会」の避難訓練2.0メソッドに基づき、保育・幼児教育施設向けの「避難訓練2.0 帳票一式」の下書きを作成する専門アシスタントです。
避難訓練2.0は①被害想定・減災設計シート→②年間避難訓練計画→③避難訓練 実施・評価・改善シート→④年間評価・次年度改善シートの4種類の帳票からなる「施設安全マネジメントサイクル」です。

必ず守ること:
- 続けて渡される「参考情報」の内容を踏まえて、3層対策モデル（ハードウェア／ソフトウェア／ヒューマンウェア）と4能力モデル（予測／認知／判断／行動）に沿った内容にする。
- 出力は必ず有効なJSONオブジェクトのみ。説明文や前置きは一切書かない。
- 各項目は1〜2文、簡潔に。冗長な説明は書かない。
- 施設の入力情報（施設名・立地・クラス構成・想定災害・特記事項）と矛盾しない具体的な内容にする。
- 写真・園内図・実際の被害統計・具体的な行政資料名など、AIが知り得ない・確認できない実データは断定的に書かず、「要現地確認」「施設所在地の自治体ハザードマップ・地域防災計画を要確認」のように、施設側が確認すべき旨を明記する。
- ③・④は「実施前の下書き・記入ガイド」であり、まだ実施していない訓練の結果を断定的に書いてはならない。③は事前学習・準備の項目のみを作成し、実践結果やふり返りは書かない。④は実際の年間実績が無い前提で、年度末に何を振り返り、どこに反映すべきかの「記入ガイド文」を書く（架空の実績を書かない）。

出力するJSONの形式:
{
  "hazardAssessment": {
    "disasterType": "入力された想定災害のうち代表的なもの1つ（例：地震）",
    "assumedIntensity": "想定震度・規模の一般的な目安と、断定を避ける一言",
    "referenceDoc": "根拠とすべき公的資料の種類（例：施設所在地の自治体ハザードマップ・地域防災計画。要確認）",
    "locations": [
      {
        "locationName": "場所名（渡された場所リストの順に、リストの全ての場所を1件ずつ）",
        "confirmed": "施設全体として現在確認できていることの例",
        "unconfirmed": "未確認事項の例（確認方法も一言添える）",
        "hazardPhenomena": "この場所で起こりうる現象・危険",
        "currentMeasures": "現在考えられる対策・施設の防御力の例",
        "remainingRisk": "それでも残る危険・リスク",
        "expectedDamage": "想定される人的・物的被害",
        "mitigationGoal": "減災目標（どの被害をどこまで減らすか）",
        "avoidanceCondition": "被害を避けるために必要な状態（回避要件）",
        "measuresHardware": "ハードウェア面の対策案",
        "measuresSoftware": "ソフトウェア面の対策案",
        "measuresHumanware": "ヒューマンウェア面の対策案"
      }
    ]
  },
  "months": [
    { "month": "4月〜3月まで12件、各キーは month, disasterType, risk, theme, target, unit, participation, ability, notes" }
  ],
  "drillTemplate": {
    "unit": "個別／部分／全体・一斉のいずれか",
    "target": "対象（個人／クラス／複数クラス／職員／施設全体等）",
    "targetDetail": "対象の詳細（年齢・クラス・人数の例）",
    "linkedHazard": "対応する①の災害種別・場所（例：地震・保育室）",
    "avoidedDamage": "今回避けたい被害",
    "purpose": "訓練の目的・ねらい・確認したいこと",
    "abilities": "育てたい・確認したい力（予測／認知／判断／行動のうち該当するもの）",
    "goalLevel": "到達目標（指示理解し行動／一部指示で行動／指示なしで判断行動 等）",
    "conditions": "場所・条件（時間帯・活動内容）",
    "preLearning": "事前に伝えること・学ぶこと（暗記ではなく状況判断力を養う内容）",
    "safetyOptions": "想定される安全確保の方法・選択肢",
    "participationForm": "参加形態（実践する側／見る側の組み合わせ）",
    "evaluationMethod": "評価方法（施設自己評価／第三者評価／併用）"
  },
  "annualReviewGuide": {
    "improvementsFacility": "施設・設備面で年度末に振り返るべき観点の例",
    "improvementsManual": "マニュアル・運用面で年度末に振り返るべき観点の例",
    "improvementsPeople": "人・教育面で年度末に振り返るべき観点の例",
    "remainingIssues": "残りやすい課題の傾向・確認の視点",
    "reflectHardware": "ハードウェア改善へどう反映するかの視点",
    "reflectSoftware": "ソフトウェア改善へどう反映するかの視点",
    "reflectHumanware": "ヒューマンウェア改善へどう反映するかの視点",
    "reflectSheet1": "①シートへ反映する際の視点",
    "reflectManualTraining": "マニュアル・教育・研修へ反映する際の視点",
    "reflectNextYearPlan": "翌年度②計画への申し送りの視点"
  },
  "sources": [{ "id": "参照した参考情報のチャンクID", "chapter_no": "章番号かnull", "title": "タイトル" }]
}`;

function buildRetrievalQuery(input: FacilityInput): string {
  return [
    "被害想定 減災設計 年間避難訓練計画 実施評価改善 年間評価",
    input.disasterTypes.join("・"),
    input.classInfo ?? "",
    input.notes ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function generateFullTrainingPlan(
  client: OpenAI,
  input: FacilityInput
): Promise<FullTrainingPlanResult> {
  const query = buildRetrievalQuery(input);
  const contextRecords = await retrieve(client, query, 10);
  const contextText = contextRecords
    .map(
      (r) =>
        `【id: ${r.id}】【${r.chapter_no ?? r.part} ${r.title}】(source_doc: ${r.source_doc})\n${r.content}`
    )
    .join("\n\n---\n\n");

  const userPrompt = `以下の施設情報をもとに、避難訓練2.0の帳票一式（①被害想定・減災設計シート、②年間避難訓練計画、③避難訓練実施・評価・改善シートの事前学習・準備部分、④年間評価・次年度改善シートの記入ガイド）を、指定のJSON形式で作成してください。

施設名: ${input.facilityName}
所在地: ${input.location || "（未記入）"}
クラス構成・人数: ${input.classInfo || "（未記入）"}
想定する主な災害: ${input.disasterTypes.join("、") || "（未記入）"}
特記事項: ${input.notes || "（なし）"}

①の場所ブロックは、以下の場所について1件ずつ、この順番で必ず全て作成してください:
${HAZARD_LOCATIONS.map((l) => `- ${l}`).join("\n")}

参考情報:

${contextText}`;

  const completion = await client.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.3,
    max_tokens: 4096,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  const hazardAssessment: HazardAssessment = {
    disasterType: parsed.hazardAssessment?.disasterType ?? input.disasterTypes[0] ?? "",
    assumedIntensity: parsed.hazardAssessment?.assumedIntensity ?? "",
    referenceDoc: parsed.hazardAssessment?.referenceDoc ?? "",
    locations: Array.isArray(parsed.hazardAssessment?.locations)
      ? parsed.hazardAssessment.locations
      : [],
  };

  const months: MonthPlanRow[] = Array.isArray(parsed.months) ? parsed.months : [];

  const drillTemplate: DrillTemplate = {
    unit: parsed.drillTemplate?.unit ?? "",
    target: parsed.drillTemplate?.target ?? "",
    targetDetail: parsed.drillTemplate?.targetDetail ?? "",
    linkedHazard: parsed.drillTemplate?.linkedHazard ?? "",
    avoidedDamage: parsed.drillTemplate?.avoidedDamage ?? "",
    purpose: parsed.drillTemplate?.purpose ?? "",
    abilities: parsed.drillTemplate?.abilities ?? "",
    goalLevel: parsed.drillTemplate?.goalLevel ?? "",
    conditions: parsed.drillTemplate?.conditions ?? "",
    preLearning: parsed.drillTemplate?.preLearning ?? "",
    safetyOptions: parsed.drillTemplate?.safetyOptions ?? "",
    participationForm: parsed.drillTemplate?.participationForm ?? "",
    evaluationMethod: parsed.drillTemplate?.evaluationMethod ?? "",
  };

  const annualReviewGuide: AnnualReviewGuide = {
    improvementsFacility: parsed.annualReviewGuide?.improvementsFacility ?? "",
    improvementsManual: parsed.annualReviewGuide?.improvementsManual ?? "",
    improvementsPeople: parsed.annualReviewGuide?.improvementsPeople ?? "",
    remainingIssues: parsed.annualReviewGuide?.remainingIssues ?? "",
    reflectHardware: parsed.annualReviewGuide?.reflectHardware ?? "",
    reflectSoftware: parsed.annualReviewGuide?.reflectSoftware ?? "",
    reflectHumanware: parsed.annualReviewGuide?.reflectHumanware ?? "",
    reflectSheet1: parsed.annualReviewGuide?.reflectSheet1 ?? "",
    reflectManualTraining: parsed.annualReviewGuide?.reflectManualTraining ?? "",
    reflectNextYearPlan: parsed.annualReviewGuide?.reflectNextYearPlan ?? "",
  };

  const sources: TrainingPlanSource[] = Array.isArray(parsed.sources) ? parsed.sources : [];

  return { facility: input, hazardAssessment, months, drillTemplate, annualReviewGuide, sources };
}
