import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { retrieve } from "@/lib/embeddings";
import { isQuotaError, QUOTA_ERROR_CODE } from "@/lib/openai-errors";

export const runtime = "nodejs";

const CHAT_MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `あなたは「NPO法人日本減災教育普及協会」の会員施設（保育・幼児教育施設）向けAIアシスタントです。
「避難訓練2.0」の考え方・帳票・訓練設計について、会員施設の職員からの質問に答えます。

必ず守ること:
- まず、続けて渡される「参考情報」に質問に関係する内容があるか確認する。関係する内容があれば、それを最優先の根拠として回答する。
- 参考情報に該当がない、または不十分な場合は、回答を拒否せず、保育・幼児教育・防災に関するあなた自身の一般的な知識で誠実に回答してよい。ただし、断定的すぎる医療・法律・行政の公式見解は避け、必要に応じて「詳細は専門機関・自治体にご確認ください」と添える。
- 保育・幼児教育施設向けの実務的な言葉づかいで、簡潔に答える。
- 回答が「参考情報」の内容を実際に根拠として使った場合のみ、回答の最後に一言「（減災教育普及協会推奨）」と付け加える。参考情報を使わず一般知識のみで回答した場合は、この一言は付けない。
- 参考情報に source_doc が「追加候補・要すり合わせ」と注記されている内容を使う場合は、「※この項目は理事長確認中のドラフト内容です」と必ず一言添える。
- 「中規模/大規模の地震動」（建築基準法上の耐震設計用語）と、避難訓練2.0の「想定地震名・マグニチュード・想定震度・想定被害」は別概念なので混同しない。
- 学校施設向けの法令・点検基準（消防法・建築基準法等）は、保育・幼児教育施設に同じ法的義務があるとは限らない点に注意して説明する。
- 医療的な助言（体調不良時の対応の医学的妥当性など）は行わず、YURETA運営者の安全運用基準として案内するにとどめる。`;

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

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMessage) {
      return NextResponse.json({ error: "user メッセージが見つかりません。" }, { status: 400 });
    }

    const contextRecords = await retrieve(client, lastUserMessage.content, 4);
    const contextText = contextRecords
      .map(
        (r) =>
          `【id: ${r.id}】【${r.chapter_no ?? r.part} ${r.title}】(source_doc: ${r.source_doc})\n${r.content}`
      )
      .join("\n\n---\n\n");

    const completion = await client.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: `参考情報:\n\n${contextText}` },
        ...messages,
      ],
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({
      reply,
      sources: contextRecords.map((r) => ({ id: r.id, chapter_no: r.chapter_no, title: r.title })),
    });
  } catch (err: any) {
    console.error(err);
    if (isQuotaError(err)) {
      return NextResponse.json({ error: QUOTA_ERROR_CODE }, { status: 429 });
    }
    return NextResponse.json({ error: "サーバーエラーが発生しました。" }, { status: 500 });
  }
}
