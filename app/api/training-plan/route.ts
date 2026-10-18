import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { generateFullTrainingPlan, FacilityInput } from "@/lib/training-plan";
import { isQuotaError, QUOTA_ERROR_CODE } from "@/lib/openai-errors";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY が設定されていません。" }, { status: 500 });
    }
    const client = new OpenAI({ apiKey });

    const body = (await req.json()) as Partial<FacilityInput>;
    if (!body.facilityName || !body.facilityName.trim()) {
      return NextResponse.json({ error: "施設名は必須です。" }, { status: 400 });
    }

    const input: FacilityInput = {
      facilityName: body.facilityName.trim(),
      location: body.location?.trim(),
      classInfo: body.classInfo?.trim(),
      disasterTypes: Array.isArray(body.disasterTypes) ? body.disasterTypes : [],
      notes: body.notes?.trim(),
    };

    const result = await generateFullTrainingPlan(client, input);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error(err);
    if (isQuotaError(err)) {
      return NextResponse.json({ error: QUOTA_ERROR_CODE }, { status: 429 });
    }
    return NextResponse.json({ error: "計画の生成に失敗しました。" }, { status: 500 });
  }
}
