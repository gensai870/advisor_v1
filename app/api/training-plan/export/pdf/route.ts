import { NextRequest, NextResponse } from "next/server";
import type { FullTrainingPlanResult } from "@/lib/training-plan";
import { buildPlanDocument } from "@/lib/plan-document";
import { buildPlanPdfBuffer } from "@/lib/export-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

let cachedFont: Buffer | null = null;

async function loadFont(origin: string): Promise<Buffer> {
  if (cachedFont) return cachedFont;
  const res = await fetch(`${origin}/fonts/NotoSansJP-Regular.ttf`);
  if (!res.ok) {
    throw new Error("フォントの読み込みに失敗しました。");
  }
  const arrayBuffer = await res.arrayBuffer();
  cachedFont = Buffer.from(arrayBuffer);
  return cachedFont;
}

export async function POST(req: NextRequest) {
  try {
    const result = (await req.json()) as FullTrainingPlanResult;
    if (!result?.facility?.facilityName) {
      return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
    }
    const sections = buildPlanDocument(result);
    const fontBuffer = await loadFont(req.nextUrl.origin);
    const buffer = await buildPlanPdfBuffer(sections, fontBuffer);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="hinan_kunren_2_0_choho.pdf"`,
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "PDFファイルの生成に失敗しました。" }, { status: 500 });
  }
}
