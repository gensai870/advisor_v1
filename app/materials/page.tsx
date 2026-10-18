"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Plus, Paperclip, ArrowUp, MessagesSquare } from "lucide-react";
import AppShell from "@/components/AppShell";

type Message = {
  role: "user" | "assistant";
  content: string;
  quotaExceeded?: boolean;
};

const RECENT = [
  { title: "①被害想定の整理", time: "2026/10/10 14:23" },
  { title: "年間計画の組み立て", time: "2026/10/08 10:15" },
];

const SUGGESTIONS = [
  "①被害想定シートの書き方を教えて",
  "年間計画は何から考えればいい？",
  "③実施計画書の「何を見る？」の書き方は？",
  "④の観察した事実はどう書く？",
  "子どもの4つの力を教えて",
  "標準フォーマットはどうすれば手に入る？",
];

const GREETING: Message = {
  role: "assistant",
  content:
    "こんにちは！\n指導案・教材チャットです。\n避難訓練2.0 標準資料セットをもとに、被害想定・年間計画・実施計画・記録・改善の考え方を一緒に整理します。\nどの帳票・どの場所について考えていますか？",
};

const MAX_LEN = 2000;

export default function MaterialsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastEnterAtRef = useRef<number>(0);

  function handleTextareaKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter") {
      lastEnterAtRef.current = 0;
      return;
    }
    if (e.shiftKey) {
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
      const res = await fetch("/api/materials-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "QUOTA_EXCEEDED") {
          setMessages((cur) => [
            ...cur,
            { role: "assistant", content: "今月の使用上限に達しました。", quotaExceeded: true },
          ]);
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

  const displayMessages = messages.length === 0 ? [GREETING] : messages;

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-64px)]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-black/5 bg-white p-4 lg:flex">
          <button
            onClick={() => setMessages([])}
            className="flex items-center justify-center gap-2 rounded-full border border-mint-dark bg-mint py-2.5 text-sm font-semibold text-ink hover:brightness-95"
          >
            <Plus size={16} /> 新しい相談を始める
          </button>
          <p className="mt-5 text-xs font-semibold text-ink-soft">最近の相談</p>
          <ul className="mt-2 space-y-1 overflow-y-auto">
            {RECENT.map((r) => (
              <li key={r.title} className="cursor-pointer rounded-xl px-2 py-2 hover:bg-black/5">
                <p className="truncate text-sm text-ink">{r.title}</p>
                <p className="text-[11px] text-ink-soft">{r.time}</p>
              </li>
            ))}
          </ul>
          <a href="#" className="mt-2 text-xs text-coral">すべて見る →</a>
        </aside>

        <div className="flex flex-1 flex-col">
          <div className="border-b border-black/5 bg-white px-6 py-3">
            <p className="text-sm font-bold text-ink">指導案・教材チャット</p>
            <p className="text-[11px] text-ink-soft">
              避難訓練2.0 標準資料セット（Ver.1.0）に基づくチャットです。研修受講園向け
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="mx-auto max-w-2xl space-y-4">
              {displayMessages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  {m.role === "assistant" && (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint-dark text-white">
                      <MessagesSquare size={14} />
                    </span>
                  )}
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                      m.role === "user" ? "bg-coral text-white" : "bg-white text-ink shadow-sm"
                    }`}
                  >
                    {m.content}
                    {m.role === "assistant" && m.quotaExceeded && (
                      <p className="mt-1 text-[11px] text-ink-soft">
                        ※追加のお支払いで上限をリセットできます。
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {messages.length === 0 && (
                <div className="ml-11">
                  <p className="mb-2 text-xs font-semibold text-ink-soft">よくある相談例</p>
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
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint-dark text-white">
                    <MessagesSquare size={14} />
                  </span>
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-ink-soft shadow-sm">考え中…</div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="border-t border-black/5 bg-white p-4">
            <div className="mx-auto flex max-w-2xl items-end gap-2 rounded-2xl border border-black/10 p-2">
              <button className="p-2 text-ink-soft">
                <Paperclip size={18} />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_LEN))}
                onKeyDown={handleTextareaKeyDown}
                rows={1}
                placeholder="相談してください…（Shift+Enterで改行、Enterを2回で送信）"
                className="max-h-32 flex-1 resize-none bg-transparent py-2 text-sm outline-none"
              />
              <span className="pb-2 text-[11px] text-ink-soft">{input.length}/{MAX_LEN}</span>
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral text-white disabled:opacity-40"
              >
                <ArrowUp size={16} />
              </button>
            </div>
            <p className="mx-auto mt-2 max-w-2xl text-center text-[11px] text-ink-soft">
              ※AIの提案は、現場の観察と根拠で確かめてから使ってください。子どもの氏名や防犯上重要な情報は入力しないでください。
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
