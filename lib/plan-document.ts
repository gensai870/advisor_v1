import type { FullTrainingPlanResult } from "./training-plan";

export type DocSection =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "note"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "kv"; rows: [string, string][] };

const HAZARD_FIELD_LABELS: [key: string, label: string][] = [
  ["confirmed", "現在確認できていること"],
  ["unconfirmed", "未確認事項"],
  ["hazardPhenomena", "この場所で何が起こる？"],
  ["currentMeasures", "現在、どのような対策がある？"],
  ["remainingRisk", "それでも何が残る？"],
  ["expectedDamage", "その結果、どんな被害が起こる？"],
  ["mitigationGoal", "減災目標"],
  ["avoidanceCondition", "回避要件"],
  ["measuresHardware", "必要な対策｜ハードウェア"],
  ["measuresSoftware", "必要な対策｜ソフトウェア"],
  ["measuresHumanware", "必要な対策｜ヒューマンウェア"],
];

const MONTH_HEADERS = [
  "月",
  "災害種別",
  "想定する被害・リスク",
  "今回確認する課題・テーマ",
  "訓練対象",
  "訓練単位",
  "参加形態",
  "確認する力",
  "備考",
];

export function buildPlanDocument(result: FullTrainingPlanResult): DocSection[] {
  const sections: DocSection[] = [];

  sections.push({ type: "h1", text: "避難訓練2.0 帳票一式（下書き）" });
  sections.push({
    type: "kv",
    rows: [
      ["施設名", result.facility.facilityName],
      ["所在地", result.facility.location || "（未記入）"],
      ["クラス構成・人数", result.facility.classInfo || "（未記入）"],
      ["想定する主な災害", (result.facility.disasterTypes ?? []).join("、") || "（未記入）"],
      ["特記事項", result.facility.notes || "（なし）"],
    ],
  });
  sections.push({
    type: "note",
    text: "※本資料はAIが避難訓練2.0のナレッジベースを参照して自動生成した下書きです。実施前に必ず施設内で内容を確認・調整してください。",
  });

  // ①被害想定・減災設計シート
  sections.push({ type: "h1", text: "①被害想定・減災設計シート" });
  sections.push({
    type: "kv",
    rows: [
      ["想定災害", result.hazardAssessment.disasterType || "（未記入）"],
      ["想定震度・規模", result.hazardAssessment.assumedIntensity || "（未記入）"],
      ["根拠となる公的資料", result.hazardAssessment.referenceDoc || "（未記入）"],
    ],
  });
  for (const loc of result.hazardAssessment.locations) {
    sections.push({ type: "h2", text: `場所：${loc.locationName}` });
    sections.push({
      type: "kv",
      rows: HAZARD_FIELD_LABELS.map(([key, label]) => [label, (loc as any)[key] || ""]),
    });
    sections.push({ type: "note", text: "【写真・園内図】は施設側で現地確認のうえ追加してください。" });
  }

  // ②年間避難訓練計画
  sections.push({ type: "h1", text: "②年間避難訓練計画" });
  sections.push({
    type: "table",
    headers: MONTH_HEADERS,
    rows: result.months.map((m) => [
      m.month,
      m.disasterType,
      m.risk,
      m.theme,
      m.target,
      m.unit,
      m.participation,
      m.ability,
      m.notes,
    ]),
  });

  // ③避難訓練 実施・評価・改善シート
  sections.push({ type: "h1", text: "③避難訓練 実施・評価・改善シート（下書きテンプレート）" });
  sections.push({
    type: "note",
    text: "以下は「事前学習・準備」部分のみAIが下書きしています。実際の訓練ごとにこのシートを複製し、【実践】【ふり返り・改善】は実施後に記入してください。",
  });
  const d = result.drillTemplate;
  sections.push({
    type: "kv",
    rows: [
      ["訓練単位", d.unit],
      ["対象", d.target],
      ["対象の詳細", d.targetDetail],
      ["対応する①の災害種別・場所", d.linkedHazard],
      ["今回避けたい被害", d.avoidedDamage],
      ["訓練の目的・ねらい・確認したいこと", d.purpose],
      ["育てたい・確認したい力（予測／認知／判断／行動）", d.abilities],
      ["到達目標", d.goalLevel],
      ["場所・条件（時間帯・活動内容）", d.conditions],
      ["事前に伝えること・学ぶこと", d.preLearning],
      ["想定される安全確保の方法・選択肢", d.safetyOptions],
      ["参加形態", d.participationForm],
      ["評価方法", d.evaluationMethod],
    ],
  });
  sections.push({ type: "h2", text: "【実践】（実施後に記入）" });
  sections.push({
    type: "kv",
    rows: [
      ["実施条件", ""],
      ["実施日・実施シナリオ", ""],
      ["何が起こったか（観察事実）", ""],
    ],
  });
  sections.push({ type: "h2", text: "【ふり返り・改善】（実施後に記入）" });
  sections.push({
    type: "kv",
    rows: [
      ["ねらいの結果", ""],
      ["被害回避・軽減", ""],
      ["実際に必要だった支援・指示", ""],
      ["どこにつまずいたか（予測／認知／判断／行動）", ""],
      ["課題の所在（ハードウェア／ソフトウェア／ヒューマンウェア）", ""],
      ["何が足りなかったか／何を改善するか／誰が・いつまでに", ""],
      ["施設側の振り返り", ""],
      ["第三者からの評価・助言", ""],
    ],
  });

  // ④年間評価・次年度改善シート
  sections.push({ type: "h1", text: "④年間評価・次年度改善シート（記入ガイド）" });
  sections.push({
    type: "note",
    text: "以下は年度末に③の実績を集計した後に記入するための「記入ガイド」です。実績データが未生成のため、AIによる断定的な結果は記載していません。",
  });
  const a = result.annualReviewGuide;
  sections.push({ type: "h2", text: "【1年間で何が改善・確認できたか】" });
  sections.push({
    type: "kv",
    rows: [
      ["施設・設備面", a.improvementsFacility],
      ["マニュアル・運用面", a.improvementsManual],
      ["人・教育面", a.improvementsPeople],
      ["まだ残っている課題", a.remainingIssues],
    ],
  });
  sections.push({ type: "h2", text: "【対策への反映】" });
  sections.push({
    type: "kv",
    rows: [
      ["ハードウェア", a.reflectHardware],
      ["ソフトウェア", a.reflectSoftware],
      ["ヒューマンウェア", a.reflectHumanware],
    ],
  });
  sections.push({ type: "h2", text: "【その他への反映】" });
  sections.push({
    type: "kv",
    rows: [
      ["①シートへの反映事項", a.reflectSheet1],
      ["マニュアル・教育・研修への反映事項", a.reflectManualTraining],
      ["翌年度②計画への申し送り", a.reflectNextYearPlan],
    ],
  });

  if (result.sources.length > 0) {
    sections.push({
      type: "note",
      text: `参照した参考情報チャンクID: ${result.sources.map((s) => s.id).join(", ")}`,
    });
  }

  return sections;
}
