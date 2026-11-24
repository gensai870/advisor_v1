import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  await supabase.auth.signOut();
  // 303：転送先は GET で開かせる（既定の 307 だと POST のまま /login に送られ、405 になる）
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
