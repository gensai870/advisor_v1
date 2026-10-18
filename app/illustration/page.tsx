"use client";

import { useState } from "react";
import { Download, ImagePlus, Loader2, Sparkles } from "lucide-react";
import AppShell from "@/components/AppShell";

const SUGGESTIONS = [
  "0歳児クラスの保育室で、家具の転倒防止対策（突っ張り棒・滑り止めマット）をしている様子",
  "避難訓練で先生が園児を誘導し、防災頭巾をかぶって列に並んでいる様子",
  "保育室に備えている防災備蓄品（水・食料・おむつ等）の棚の様子",
  "地震を想定し、机の下に隠れる園児たちの様子",
];

export default function IllustrationPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  async function generate(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    setQuotaExceeded(false);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "QUOTA_EXCEEDED") {
          setQuotaExceeded(true);
          return;
        }
        throw new Error(data.error || "エラーが発生しました");
      }
      setImage(data.image);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-center gap-2">
          <ImagePlus className="text-coral" size={22} />
          <h1 className="text-xl font-bold text-ink">防災イラスト作成</h1>
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          保育室の防災対策や訓練の様子など、現場で使えるイラストをAIが生成します。おたよりや掲示物にご活用ください。
        </p>

        <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4">
          <label className="block text-xs font-medium text-ink-soft">描きたい内容</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="例：0〜1歳児クラスで防災頭巾をかぶって避難する様子"
            className="mt-1 w-full resize-none rounded-xl border border-black/10 p-3 text-sm outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setPrompt(s)}
                className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-ink hover:bg-black/5"
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={() => generate(prompt)}
            disabled={loading || !prompt.trim()}
            className="mt-4 flex items-center justify-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-bold text-white hover:bg-coral-dark disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? "生成中…" : "イラストを生成"}
          </button>

          {quotaExceeded && (
            <div className="mt-3 rounded-xl bg-coral/10 px-3 py-2">
              <p className="text-xs font-medium text-coral">今月の使用上限に達しました。</p>
              <p className="mt-0.5 text-[11px] text-ink-soft">※追加のお支払いで上限をリセットできます。</p>
            </div>
          )}
          {error && <p className="mt-3 text-xs font-medium text-coral">{error}</p>}
        </div>

        {image && (
          <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4">
            <img src={image} alt="生成されたイラスト" className="w-full rounded-xl" />
            <a
              href={image}
              download="bousai-illustration.png"
              className="mt-3 flex w-fit items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm text-ink hover:bg-black/5"
            >
              <Download size={16} />
              ダウンロード
            </a>
          </div>
        )}
      </div>
    </AppShell>
  );
}
