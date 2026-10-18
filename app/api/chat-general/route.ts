import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { isQuotaError, QUOTA_ERROR_CODE } from "@/lib/openai-errors";

export const runtime = "nodejs";

const CHAT_MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `あなたは保育・幼児教育施設の職員向けの、汎用的な相談AIアシスタントです。
特定のナレッジベースや資料には限定されず、あなた自身の一般的な知識をもとに、保育・幼児教育の現場で役立つ相談（おたより文例、行事の進行、連絡帳の書き方、製作あそびのアイデア、職員研修のヒントなど）に幅広く答えます。

必ず守ること:
- 保育・幼児教育施設向けの実務的な言葉づかいで、簡潔に答える。
- 医療・法律・行政の公式見解が必要な内容は、断定を避け「詳細は専門機関・自治体にご確認ください」と添える。
- 医療的な助言（体調不良時の対応の医学的妥当性など）は行わない。
- このチャットは特定の資料・ナレッジベースを参照しているわけではないことを前提に、一般知識の範囲で誠実に回答する。`;

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
      temperature: 0.4,
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
