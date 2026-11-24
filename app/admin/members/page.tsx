import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase-server";
import { fetchMembers, isAdminEmail, NO_SERVICE_KEY, type MemberSummary } from "@/lib/members";

export const dynamic = "force-dynamic";

function fmt(iso: string) {
  const d = new Date(iso);
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000); // 日本時間
  return `${j.getUTCFullYear()}.${String(j.getUTCMonth() + 1).padStart(2, "0")}.${String(j.getUTCDate()).padStart(2, "0")}`;
}

export default async function AdminMembersPage() {
  // ログインは middleware.ts で必須。ここでは管理者かどうかを確認する。
  const { data } = await createClient().auth.getUser();
  if (!isAdminEmail(data.user?.email)) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl p-6">
          <p className="rounded-2xl bg-white p-6 text-sm text-ink shadow-sm">このページを表示する権限がありません。</p>
        </div>
      </AppShell>
    );
  }

  let summary: MemberSummary | null = null;
  let error: string | null = null;
  try {
    summary = await fetchMembers();
  } catch (e: any) {
    console.error("[admin/members]", e?.message ?? "error");
    error =
      e?.message === NO_SERVICE_KEY
        ? "会員数を数えるための設定（SUPABASE_SERVICE_ROLE_KEY）が、まだ入っていません。"
        : "会員数を取得できませんでした。しばらくしてからもう一度お試しください。";
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <h1 className="text-xl font-bold text-ink">会員数（管理者用）</h1>
        {error && <p className="rounded-2xl bg-white p-6 text-sm text-ink shadow-sm">{error}</p>}
        {summary && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-mint p-6">
                <p className="text-xs font-semibold text-ink-soft">登録数</p>
                <p className="mt-1 text-3xl font-bold text-ink">{summary.total}</p>
              </div>
              <div className="rounded-2xl bg-skyish p-6">
                <p className="text-xs font-semibold text-ink-soft">メール確認済み</p>
                <p className="mt-1 text-3xl font-bold text-ink">{summary.confirmed}</p>
              </div>
            </div>
            <div className="overflow-x-auto rounded-2xl bg-white p-4 shadow-sm">
              <table className="w-full text-left text-sm text-ink">
                <thead>
                  <tr className="text-xs text-ink-soft">
                    <th className="p-2">園名</th>
                    <th className="p-2">メールアドレス</th>
                    <th className="p-2">担当者</th>
                    <th className="p-2">登録日</th>
                    <th className="p-2">メール確認</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.members.map((m, i) => (
                    <tr key={i} className="border-t border-black/5">
                      <td className="p-2">{m.orgName}</td>
                      <td className="p-2 break-all">{m.email ?? "—"}</td>
                      <td className="p-2">{m.contactName ?? "—"}</td>
                      <td className="p-2 whitespace-nowrap">{fmt(m.createdAt)}</td>
                      <td className="p-2">{m.confirmed ? "済" : "未"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-ink-soft">メールアドレス・担当者名を含む個人情報です。管理者以外には見せないでください。</p>
          </>
        )}
      </div>
    </AppShell>
  );
}
