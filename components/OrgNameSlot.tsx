"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

/** 園名の入力チェック（前後の空白を除き、1〜60文字） */
export function validateOrgName(raw: string): { ok: true; value: string } | { ok: false; message: string } {
  const value = raw.trim();
  if (!value) return { ok: false, message: "園名を入力してください。" };
  if (value.length > 60) return { ok: false, message: "園名は60文字以内で入力してください。" };
  return { ok: true, value };
}

type Updater = {
  auth: {
    updateUser: (a: { data: Record<string, unknown> }) => Promise<{ error: { message: string } | null }>;
  };
};

/** 園名を、ログイン中のユーザー自身の登録情報（user_metadata）に保存する */
export async function saveOrgName(
  client: Updater,
  raw: string
): Promise<{ ok: true; value: string } | { ok: false; message: string }> {
  const v = validateOrgName(raw);
  if (!v.ok) return v;
  const { error } = await client.auth.updateUser({ data: { organization_name: v.value } });
  if (error) return { ok: false, message: "保存できませんでした。しばらくしてからお試しください。" };
  return { ok: true, value: v.value };
}

/**
 * ヘッダーの園名の表示。
 * undefined=取得中（空欄）／文字列=園名を表示／null=未登録（「園名を登録」から入力できる）
 */
export default function OrgNameSlot({
  orgName,
  onSaved,
}: {
  orgName: string | null | undefined;
  onSaved: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (orgName === undefined) {
    return <div className="max-w-[12rem] truncate text-ink-soft">{"\u00a0"}</div>;
  }
  if (orgName) {
    return (
      <div className="max-w-[12rem] truncate text-ink-soft" title={orgName}>
        {orgName}
      </div>
    );
  }

  async function submit() {
    setSaving(true);
    setError(null);
    const r = await saveOrgName(createClient(), draft);
    setSaving(false);
    if (r.ok) {
      setOpen(false);
      onSaved(r.value);
    } else {
      setError(r.message);
    }
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="text-left text-coral underline">
        園名を登録
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-black/10 bg-white p-3 shadow-lg">
          <label className="block text-xs font-medium text-ink-soft">園名（施設名）</label>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="〇〇保育園"
            maxLength={60}
            className="mt-1 w-full rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none"
          />
          {error && <p className="mt-1 text-xs text-coral">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-1.5 text-xs text-ink-soft hover:bg-black/5">
              キャンセル
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="rounded-lg bg-coral px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {saving ? "保存中…" : "保存"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
