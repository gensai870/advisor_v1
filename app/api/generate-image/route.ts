import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { isQuotaError, QUOTA_ERROR_CODE } from "@/lib/openai-errors";

export const runtime = "nodejs";

const IMAGE_MODEL = "gpt-image-1";

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

    const { prompt } = (await req.json()) as { prompt?: string };
    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "prompt は必須です。" }, { status: 400 });
    }

    const fullPrompt = `保育・幼児教育施設向けの防災イラスト。やさしく親しみやすいフラットデザインのイラストで、写実的すぎない・恐怖を煽らないタッチにしてください。内容: ${prompt.trim()}`;

    const result = await client.images.generate({
      model: IMAGE_MODEL,
      prompt: fullPrompt,
      size: "1024x1024",
      n: 1,
    });

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({ error: "画像の生成に失敗しました。" }, { status: 500 });
    }

    return NextResponse.json({ image: `data:image/png;base64,${b64}` });
  } catch (err: any) {
    console.error(err);
    if (isQuotaError(err)) {
      return NextResponse.json({ error: QUOTA_ERROR_CODE }, { status: 429 });
    }
    return NextResponse.json(
      { error: err?.message ?? "サーバーエラーが発生しました。" },
      { status: 500 }
    );
  }
}
