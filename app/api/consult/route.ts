import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "@/lib/knowledge.generated.js";
import { respond } from "@/lib/respond.js";
import { isQuotaError, QUOTA_ERROR_CODE } from "@/lib/openai-errors";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_MESSAGES = 20;
const MAX_CHARS = 2000;

// 認証は middleware.ts（ログイン必須）で行う。/api/chat と同じ扱い。
export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "現在ご利用いただけません。" }, { status: 500 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "入力が正しくありません。" }, { status: 400 });
  }
  const raw: any[] = Array.isArray(body?.messages) ? body.messages : [];
  const messages = raw
    .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role as "user" | "assistant", content: (m.content as string).slice(0, MAX_CHARS) }))
    .slice(-MAX_MESSAGES);
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "質問を入力してください。" }, { status: 400 });
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  try {
    const { text, flags } = await respond({
      messages,
      system: SYSTEM_PROMPT,
      complete: async (msgs: any[], { temperature }: { temperature: number }) => {
        const r = await client.chat.completions.create({ model, messages: msgs, temperature });
        return r.choices[0]?.message?.content ?? "";
      },
    });
    console.log("[consult]", JSON.stringify(flags)); // 質問本文は記録しない
    return NextResponse.json({ reply: text });
  } catch (err: any) {
    console.error("[consult] error", err?.status ?? "", err?.code ?? "");
    if (isQuotaError(err)) {
      return NextResponse.json({ error: QUOTA_ERROR_CODE }, { status: 429 });
    }
    return NextResponse.json({ error: "現在ご利用いただけません。しばらくしてからお試しください。" }, { status: 502 });
  }
}
