"use client";

import { useEffect, useRef, useState } from "react";
import { ClipboardList, Download, FileText, Loader2, RotateCcw, Sparkles } from "lucide-react";
import AppShell from "@/components/AppShell";

type HazardLocationBlock = {
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

type HazardAssessment = {
  disasterType: string;
  assumedIntensity: string;
  referenceDoc: string;
  locations: HazardLocationBlock[];
};

type MonthPlanRow = {
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

type DrillTemplate = {
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

type AnnualReviewGuide = {
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

type FacilityInput = {
  facilityName: string;
  location: string;
  classInfo: string;
  disasterTypes: string[];
  notes: string;
};

type PlanResult = {
  facility: FacilityInput;
  hazardAssessment: HazardAssessment;
  months: MonthPlanRow[];
  drillTemplate: DrillTemplate;
  annualReviewGuide: AnnualReviewGuide;
  sources: { id: string; chapter_no: string | null; title: string }[];
};

const DISASTER_OPTIONS = ["地震", "水害", "火災", "土砂災害", "不審者対応", "感染症"];

const MONTH_COLUMNS: { key: keyof MonthPlanRow; label: string }[] = [
  { key: "month", label: "月" },
  { key: "disasterType", label: "災害種別" },
  { key: "risk", label: "想定する被害・リスク" },
  { key: "theme", label: "今回確認する課題・テーマ" },
  { key: "target", label: "訓練対象" },
  { key: "unit", label: "訓練単位" },
  { key: "participation", label: "参加形態" },
  { key: "ability", label: "確認する力" },
  { key: "notes", label: "備考" },
];

const HAZARD_FIELD_LABELS: { key: keyof HazardLocationBlock; label: string }[] = [
  { key: "confirmed", label: "現在確認できていること" },
  { key: "unconfirmed", label: "未確認事項" },
  { key: "hazardPhenomena", label: "この場所で何が起こる？" },
  { key: "currentMeasures", label: "現在、どのような対策がある？" },
  { key: "remainingRisk", label: "それでも何が残る？" },
  { key: "expectedDamage", label: "その結果、どんな被害が起こる？" },
  { key: "mitigationGoal", label: "減災目標" },
  { key: "avoidanceCondition", label: "回避要件" },
  { key: "measuresHardware", label: "必要な対策｜ハードウェア" },
  { key: "measuresSoftware", label: "必要な対策｜ソフトウェア" },
  { key: "measuresHumanware", label: "必要な対策｜ヒューマンウェア" },
];

const DRILL_FIELD_LABELS: { key: keyof DrillTemplate; label: string }[] = [
  { key: "unit", label: "訓練単位" },
  { key: "target", label: "対象" },
  { key: "targetDetail", label: "対象の詳細" },
  { key: "linkedHazard", label: "対応する①の災害種別・場所" },
  { key: "avoidedDamage", label: "今回避けたい被害" },
  { key: "purpose", label: "訓練の目的・ねらい・確認したいこと" },
  { key: "abilities", label: "育てたい・確認したい力" },
  { key: "goalLevel", label: "到達目標" },
  { key: "conditions", label: "場所・条件" },
  { key: "preLearning", label: "事前に伝えること・学ぶこと" },
  { key: "safetyOptions", label: "想定される安全確保の方法・選択肢" },
  { key: "participationForm", label: "参加形態" },
  { key: "evaluationMethod", label: "評価方法" },
];

const REVIEW_FIELD_LABELS: { key: keyof AnnualReviewGuide; label: string }[] = [
  { key: "improvementsFacility", label: "施設・設備面" },
  { key: "improvementsManual", label: "マニュアル・運用面" },
  { key: "improvementsPeople", label: "人・教育面" },
  { key: "remainingIssues", label: "まだ残っている課題" },
  { key: "reflectHardware", label: "ハードウェアへの反映" },
  { key: "reflectSoftware", label: "ソフトウェアへの反映" },
  { key: "reflectHumanware", label: "ヒューマンウェアへの反映" },
  { key: "reflectSheet1", label: "①シートへの反映事項" },
  { key: "reflectManualTraining", label: "マニュアル・教育・研修への反映" },
  { key: "reflectNextYearPlan", label: "翌年度②計画への申し送り" },
];

const DRAFT_KEY = "training-plan-draft-v1";

type Draft = {
  savedAt: string;
  facilityName: string;
  location: string;
  classInfo: string;
  disasterTypes: string[];
  notes: string;
  result: PlanResult | null;
};

function KvTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/10">
      <table className="w-full text-xs">
        <tbody>
          {rows.map(([label, value], i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-black/[0.02]"}>
              <th className="w-1/3 border-b border-black/5 px-3 py-2 text-left align-top font-semibold text-ink-soft">
                {label}
              </th>
              <td className="whitespace-pre-wrap border-b border-black/5 px-3 py-2 align-top text-ink">
                {value || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TrainingPlanPage() {
  const [facilityName, setFacilityName] = useState("");
  const [location, setLocation] = useState("");
  const [classInfo, setClassInfo] = useState("");
  const [disasterTypes, setDisasterTypes] = useState<string[]>(["地震"]);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [result, setResult] = useState<PlanResult | null>(null);
  const [draftBanner, setDraftBanner] = useState<string | null>(null);

  const restoredRef = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft: Draft = JSON.parse(raw);
        setFacilityName(draft.facilityName ?? "");
        setLocation(draft.location ?? "");
        setClassInfo(draft.classInfo ?? "");
        setDisasterTypes(draft.disasterTypes ?? ["地震"]);
        setNotes(draft.notes ?? "");
        setResult(draft.result ?? null);
        if (draft.savedAt) {
          setDraftBanner(`前回の下書きを復元しました（保存日時: ${new Date(draft.savedAt).toLocaleString("ja-JP")}）`);
        }
      }
    } catch {
    } finally {
      restoredRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!restoredRef.current) return;
    const t = setTimeout(() => {
      try {
        const draft: Draft = {
          savedAt: new Date().toISOString(),
          facilityName,
          location,
          classInfo,
          disasterTypes,
          notes,
          result,
        };
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
      }
    }, 600);
    return () => clearTimeout(t);
  }, [facilityName, location, classInfo, disasterTypes, notes, result]);

  function toggleDisaster(d: string) {
    setDisasterTypes((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  }

  function startNew() {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
    }
    setFacilityName("");
    setLocation("");
    setClassInfo("");
    setDisasterTypes(["地震"]);
    setNotes("");
    setResult(null);
    setDraftBanner(null);
    setError(null);
    setQuotaExceeded(false);
  }

  async function generate() {
    if (!facilityName.trim() || loading) return;
    setLoading(true);
    setError(null);
    setQuotaExceeded(false);
    setResult(null);
    setDraftBanner(null);
    try {
      const res = await fetch("/api/training-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityName, location, classInfo, disasterTypes, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "QUOTA_EXCEEDED") {
          setQuotaExceeded(true);
          return;
        }
        throw new Error(data.error || "エラーが発生しました");
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function exportAs(format: "docx" | "pdf" | "html") {
    if (!result || exporting) return;
    setExporting(format);
    try {
      const res = await fetch(`/api/training-plan/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (!res.ok) throw new Error("ファイルの生成に失敗しました");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = format === "docx" ? "docx" : format;
      a.download = `hinan_kunren_2_0_choho.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExporting(null);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex items-center gap-2">
          <ClipboardList className="text-coral" size={22} />
          <h1 className="text-xl font-bold text-ink">避難訓練計画書AI</h1>
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          施設の情報を入力すると、避難訓練2.0の帳票一式（①被害想定・減災設計シート／②年間避難訓練計画／③実施・評価・改善シートの下書き／④年間評価・次年度改善シートの記入ガイド）をAIが下書きします。入力内容は自動的にこの端末に一時保存されます。
        </p>

        {draftBanner && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-mint/40 px-3 py-2 text-xs text-ink">
            <span>{draftBanner}</span>
            <button onClick={startNew} className="flex items-center gap-1 text-ink-soft hover:text-ink">
              <RotateCcw size={12} /> 新規作成
            </button>
          </div>
        )}

        <div className="mt-6 space-y-4 rounded-2xl border border-black/10 bg-white p-4">
          <div>
            <label className="block text-xs font-medium text-ink-soft">施設名（必須）</label>
            <input
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
              placeholder="例：さくら保育園"
              className="mt-1 w-full rounded-xl border border-black/10 p-3 text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft">所在地（任意）</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例：〇〇市〇〇町"
              className="mt-1 w-full rounded-xl border border-black/10 p-3 text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft">クラス構成・人数（任意）</label>
            <input
              value={classInfo}
              onChange={(e) => setClassInfo(e.target.value)}
              placeholder="例：0〜5歳児クラス全6クラス、園児72名、職員15名"
              className="mt-1 w-full rounded-xl border border-black/10 p-3 text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft">想定する主な災害</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {DISASTER_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDisaster(d)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    disasterTypes.includes(d)
                      ? "border-mint-dark bg-mint font-semibold text-ink"
                      : "border-black/10 bg-white text-ink hover:bg-black/5"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft">特記事項（任意）</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="例：2階建て、給食室あり、昨年度は書棚の転倒対策が課題だった 等"
              className="mt-1 w-full resize-none rounded-xl border border-black/10 p-3 text-sm outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={generate}
              disabled={loading || !facilityName.trim()}
              className="flex items-center justify-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-bold text-white hover:bg-coral-dark disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {loading ? "作成中…" : result ? "再作成する" : "帳票一式を作成"}
            </button>
            {result && (
              <button
                onClick={startNew}
                className="flex items-center gap-1 rounded-full border border-black/10 px-4 py-2 text-xs text-ink-soft hover:bg-black/5"
              >
                <RotateCcw size={13} /> 新規作成
              </button>
            )}
          </div>

          {quotaExceeded && (
            <div className="rounded-xl bg-coral/10 px-3 py-2">
              <p className="text-xs font-medium text-coral">今月の使用上限に達しました。</p>
              <p className="mt-0.5 text-[11px] text-ink-soft">※追加のお支払いで上限をリセットできます。</p>
            </div>
          )}
          {error && <p className="text-xs font-medium text-coral">{error}</p>}
        </div>

        {result && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white p-4">
              <h2 className="text-sm font-bold text-ink">
                {result.facility.facilityName} 避難訓練2.0 帳票一式（下書き）
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => exportAs("docx")}
                  disabled={exporting !== null}
                  className="flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-xs text-ink hover:bg-black/5 disabled:opacity-50"
                >
                  {exporting === "docx" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  Word
                </button>
                <button
                  onClick={() => exportAs("pdf")}
                  disabled={exporting !== null}
                  className="flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-xs text-ink hover:bg-black/5 disabled:opacity-50"
                >
                  {exporting === "pdf" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  PDF
                </button>
                <button
                  onClick={() => exportAs("html")}
                  disabled={exporting !== null}
                  className="flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-xs text-ink hover:bg-black/5 disabled:opacity-50"
                >
                  {exporting === "html" ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  HTML
                </button>
              </div>
            </div>

            <section className="rounded-2xl border border-black/10 bg-white p-4">
              <h3 className="text-sm font-bold text-ink">①被害想定・減災設計シート</h3>
              <div className="mt-3">
                <KvTable
                  rows={[
                    ["想定災害", result.hazardAssessment.disasterType],
                    ["想定震度・規模", result.hazardAssessment.assumedIntensity],
                    ["根拠となる公的資料", result.hazardAssessment.referenceDoc],
                  ]}
                />
              </div>
              <div className="mt-4 space-y-4">
                {result.hazardAssessment.locations.map((loc, i) => (
                  <div key={i}>
                    <p className="mb-2 text-xs font-semibold text-ink">場所：{loc.locationName}</p>
                    <KvTable rows={HAZARD_FIELD_LABELS.map(({ key, label }) => [label, loc[key]])} />
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-ink-soft">
                ※【写真・園内図】は施設側で現地確認のうえ追加してください。
              </p>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white p-4">
              <h3 className="text-sm font-bold text-ink">②年間避難訓練計画</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-black/5">
                      {MONTH_COLUMNS.map((c) => (
                        <th key={c.key} className="border border-black/10 px-2 py-1.5 text-left font-semibold text-ink">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.months.map((m, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-black/[0.02]"}>
                        {MONTH_COLUMNS.map((c) => (
                          <td key={c.key} className="border border-black/10 px-2 py-1.5 align-top text-ink">
                            {m[c.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white p-4">
              <h3 className="text-sm font-bold text-ink">③避難訓練 実施・評価・改善シート（下書きテンプレート）</h3>
              <p className="mt-1 text-[11px] text-ink-soft">
                「事前学習・準備」部分のみAIが下書きしています。実際の訓練ごとにこのシートを複製し、【実践】【ふり返り・改善】は実施後に記入してください。
              </p>
              <div className="mt-3">
                <KvTable rows={DRILL_FIELD_LABELS.map(({ key, label }) => [label, result.drillTemplate[key]])} />
              </div>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white p-4">
              <h3 className="text-sm font-bold text-ink">④年間評価・次年度改善シート（記入ガイド）</h3>
              <p className="mt-1 text-[11px] text-ink-soft">
                年度末に③の実績を集計した後に記入するための記入ガイドです。実績データが無いため、AIによる断定的な結果は記載していません。
              </p>
              <div className="mt-3">
                <KvTable rows={REVIEW_FIELD_LABELS.map(({ key, label }) => [label, result.annualReviewGuide[key]])} />
              </div>
            </section>

            <p className="text-[11px] text-ink-soft">
              ※AIによる下書きです。実施前に必ず施設内で内容をご確認・調整ください。
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
