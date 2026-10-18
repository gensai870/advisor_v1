import { NextRequest, NextResponse } from "next/server";
import type { FullTrainingPlanResult } from "@/lib/training-plan";
import { buildPlanDocument } from "@/lib/plan-document";
import { buildPlanDocxBuffer } from "@/lib/export-docx";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const result = (await req.json()) as FullTrainingPlanResult;
    if (!result?.facility?.facilityName) {
      return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
    }
    const sections = buildPlanDocument(result);
    const buffer = await buildPlanDocxBuffer(sections);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="hinan_kunren_2_0_choho.docx"`,
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Wordファイルの生成に失敗しました。" }, { status: 500 });
  }
}
