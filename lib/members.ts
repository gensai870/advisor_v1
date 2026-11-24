import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase-config";

/**
 * 会員数の集計（管理者向け）。
 * 会員＝Supabase の登録ユーザー。件数は auth.users から数える（service role キーが必要）。
 * 画面には「園名・メールアドレス・担当者名・登録日・メール確認済みか」を出す（管理者のみ。個人情報を含む）。
 */

export type Member = {
  orgName: string;
  email: string | null;
  contactName: string | null;
  createdAt: string;
  confirmed: boolean;
};
export type MemberSummary = { total: number; confirmed: number; members: Member[] };

export const NO_SERVICE_KEY = "NO_SERVICE_KEY";

/** ADMIN_EMAILS（カンマ区切り）に含まれるメールだけを管理者とする。未設定なら全員が管理者ではない。 */
export function isAdminEmail(email: string | null | undefined, list: string | undefined = process.env.ADMIN_EMAILS): boolean {
  if (!email || !list) return false;
  const admins = list
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.trim().toLowerCase());
}

type RawUser = {
  email?: string | null;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  created_at: string;
  user_metadata?: Record<string, any> | null;
};

export function summarizeUsers(users: RawUser[]): MemberSummary {
  const members: Member[] = users
    .map((u) => {
      const org = u.user_metadata?.organization_name;
      const contact = u.user_metadata?.contact_name;
      return {
        orgName: typeof org === "string" && org.trim() ? org.trim() : "（園名なし）",
        email: u.email ?? null,
        contactName: typeof contact === "string" && contact.trim() ? contact.trim() : null,
        createdAt: u.created_at,
        confirmed: Boolean(u.email_confirmed_at ?? u.confirmed_at),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { total: members.length, confirmed: members.filter((m) => m.confirmed).length, members };
}

export async function fetchMembers(): Promise<MemberSummary> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error(NO_SERVICE_KEY);
  const admin = createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const users: RawUser[] = [];
  const perPage = 1000;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers: ${error.message}`);
    users.push(...(data.users as RawUser[]));
    if (data.users.length < perPage) break;
  }
  return summarizeUsers(users);
}
