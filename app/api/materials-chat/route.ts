import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { isQuotaError, QUOTA_ERROR_CODE } from "@/lib/openai-errors";

export const runtime = "nodejs";

const CHAT_MODEL = "gpt-4o-mini";

const dir = path.join(process.cwd(), "data", "materials");
const RULES_MD = fs.readFileSync(path.join(dir, "rules.md"), "utf-8");
const REFERENCE_MD = fs.readFileSync(path.join(dir, "reference.md"), "utf-8");

const SYSTEM_PROMPT = `${RULES_MD}

---

# 参照資料（避難訓練2.0 標準資料セット）

${REFERENCE_MD}`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY が設定されていません。" },
        { status: 500 }
      );
    }
    const client = new OpenAI({ apiKey });

    const { messages } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
    };
    if (!messages?.length) {
      return NextResponse.json({ error: "messages は必須です。" }, { status: 400 });
    }

    const completion = await client.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error(err);
    if (isQuotaError(err)) {
      return NextResponse.json({ error: QUOTA_ERROR_CODE }, { status: 429 });
    }
    return NextResponse.json({ error: "サーバーエラーが発生しました。" }, { status: 500 });
  }
}
