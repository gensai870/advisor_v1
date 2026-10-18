import { NextRequest, NextResponse } from "next/server";
import type { FullTrainingPlanResult } from "@/lib/training-plan";
import { buildPlanDocument } from "@/lib/plan-document";
import { buildPlanHtml } from "@/lib/export-html";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const result = (await req.json()) as FullTrainingPlanResult;
    if (!result?.facility?.facilityName) {
      return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
    }
    const sections = buildPlanDocument(result);
    const html = buildPlanHtml(sections, `${result.facility.facilityName} 避難訓練2.0 帳票一式`);

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="hinan_kunren_2_0_choho.html"`,
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "HTMLファイルの生成に失敗しました。" }, { status: 500 });
  }
}
