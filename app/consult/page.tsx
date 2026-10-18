"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { ArrowUp, Heart, Plus } from "lucide-react";
import AppShell from "@/components/AppShell";

type Message = { role: "user" | "assistant"; content: string; quotaExceeded?: boolean };

const GREETING: Message = {
  role: "assistant",
  content:
    "こんにちは！\n減災教育AIボットです。\n減災教育・避難訓練2.0・研修の進め方について、どうぞ気軽にご相談ください。",
};

const SUGGESTIONS = [
  "減災教育って何？",
  "避難訓練2.0って何が違うの？",
  "研修はどんな流れで進めますか？",
];

const MAX_LEN = 2000;

export default function ConsultPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastEnterAtRef = useRef<number>(0);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey) {
      lastEnterAtRef.current = 0;
      return;
    }
    const now = Date.now();
    if (now - lastEnterAtRef.current < 600) {
      e.preventDefault();
      lastEnterAtRef.current = 0;
      send(input);
    } else {
      lastEnterAtRef.current = now;
    }
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "QUOTA_EXCEEDED") {
          setMessages((cur) => [...cur, { role: "assistant", content: "今月の使用上限に達しました。", quotaExceeded: true }]);
          return;
        }
        throw new Error(data.error || "エラーが発生しました");
      }
      setMessages((cur) => [...cur, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      setMessages((cur) => [
        ...cur,
        { role: "assistant", content: `申し訳ございません。エラーが発生しました：${err.message}` },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  const display = messages.length === 0 ? [GREETING] : messages;

  return (
    <AppShell>
      <div className="flex h-[calc(100dvh-64px)] flex-col">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-black/5 bg-white px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">なんでも相談チャット</p>
            <p className="text-[11px] leading-snug text-ink-soft">減災教育・避難訓練2.0・研修運営について相談できます</p>
          </div>
          <button
            onClick={() => setMessages([])}
            className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-mint-dark bg-mint px-3 py-1.5 text-xs font-semibold text-ink hover:brightness-95"
          >
            <Plus size={14} /> 新しい相談
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="mx-auto max-w-2xl space-y-4">
            {display.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {m.role === "assistant" && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral text-white">
                    <Heart size={14} fill="white" strokeWidth={0} />
                  </span>
                )}
                <div
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[80%] ${
                    m.role === "user" ? "bg-coral text-white" : "bg-white text-ink shadow-sm"
                  }`}
                >
                  {m.content}
                  {m.quotaExceeded && (
                    <p className="mt-1 text-[11px] text-ink-soft">※追加のお支払いで上限をリセットできます。</p>
                  )}
                </div>
              </div>
            ))}

            {messages.length === 0 && (
              <div className="sm:ml-11">
                <p className="mb-2 text-xs font-semibold text-ink-soft">相談例</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-ink hover:bg-black/5"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral text-white">
                  <Heart size={14} fill="white" strokeWidth={0} />
                </span>
                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-ink-soft shadow-sm">考え中…</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="shrink-0 border-t border-black/5 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
          <div className="mx-auto flex max-w-2xl items-end gap-2 rounded-2xl border border-black/10 p-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_LEN))}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="相談したいことを入力…"
              className="max-h-32 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-base outline-none sm:text-sm"
            />
            <span className="hidden pb-2 text-[11px] text-ink-soft sm:inline">{input.length}/{MAX_LEN}</span>
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral text-white disabled:opacity-40"
            >
              <ArrowUp size={16} />
            </button>
          </div>
          <p className="mx-auto mt-2 max-w-2xl text-center text-[10px] leading-tight text-ink-soft sm:text-[11px]">
            ※このAIは教育・保育の現場支援を目的としており、医療・法律・行政の公式見解ではありません。
            <span className="hidden sm:inline">（Shift+Enterで改行、Enterを2回で送信）</span>
          </p>
        </div>
      </div>
    </AppShell>
  );
}
