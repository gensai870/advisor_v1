import { NextResponse } from "next/server";
import { createAccountFolderOnSignup } from "@/lib/drive-log";

export const runtime = "nodejs";

// 登録直後（確認メールなしでログイン済み）に呼ぶ。認証は middleware.ts（ログイン必須）で行う。
// Driveにアカウントのフォルダを作る。すでにあれば何もしない。
export async function POST() {
  createAccountFolderOnSignup();
  return NextResponse.json({ ok: true });
}
