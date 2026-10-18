import { NextResponse } from "next/server";
import { fetchMonthlyCostUSD } from "@/lib/openai-usage";

export const runtime = "nodejs";

const DEFAULT_BUDGET_USD = 5;

export async function GET() {
  const adminKey = process.env.OPENAI_ADMIN_API_KEY;
  const budget = Number(process.env.MONTHLY_BUDGET_USD ?? DEFAULT_BUDGET_USD);

  if (!adminKey) {
    // Admin キー未設定でもアプリ全体は落とさず、非表示状態として返す。
    return NextResponse.json({ available: false });
  }

  try {
    const usedUSD = await fetchMonthlyCostUSD(adminKey);
    const percentage = budget > 0 ? Math.min(100, Math.round((usedUSD / budget) * 100)) : 0;
    return NextResponse.json({ available: true, usedUSD, budgetUSD: budget, percentage });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ available: false, error: err?.message ?? "unknown error" }, { status: 200 });
  }
}
