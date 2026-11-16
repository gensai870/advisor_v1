import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { createAccountFolderOnSignup } from "@/lib/drive-log";

// メール確認リンク・マジックリンクのコールバック
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    // 会員登録（メール確認）の完了と同時に、Driveにアカウントのフォルダを作る
    if (data?.user) createAccountFolderOnSignup(data.user);
  }

  return NextResponse.redirect(`${origin}/home`);
}
