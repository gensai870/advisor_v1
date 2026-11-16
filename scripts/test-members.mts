// 使い方: npx tsx scripts/test-members.mts
import assert from "node:assert/strict";
import { isAdminEmail, summarizeUsers } from "../lib/members.ts";

// 管理者の判定
assert.equal(isAdminEmail("a@x.jp", "a@x.jp,b@x.jp"), true);
assert.equal(isAdminEmail("B@X.JP", " a@x.jp , b@x.jp "), true, "大文字小文字・空白を無視");
assert.equal(isAdminEmail("c@x.jp", "a@x.jp,b@x.jp"), false);
assert.equal(isAdminEmail("a@x.jp", undefined), false, "未設定なら誰も管理者ではない");
assert.equal(isAdminEmail("a@x.jp", ""), false);
assert.equal(isAdminEmail(null, "a@x.jp"), false);
assert.equal(isAdminEmail("a@x.jp", "a@x.jp.evil.com"), false, "部分一致しない");
console.log("ok 管理者の判定");

// 集計
const s = summarizeUsers([
  { created_at: "2026-10-01T00:00:00Z", email_confirmed_at: "2026-10-01T01:00:00Z", user_metadata: { organization_name: " さくら保育園 ", contact_name: "非表示" } },
  { created_at: "2026-11-05T00:00:00Z", email_confirmed_at: null, user_metadata: {} },
  { created_at: "2026-10-20T00:00:00Z", confirmed_at: "2026-10-20T01:00:00Z", user_metadata: { organization_name: "ひまわり園" } },
]);
assert.equal(s.total, 3);
assert.equal(s.confirmed, 2);
assert.deepEqual(s.members.map((m) => m.orgName), ["（園名なし）", "ひまわり園", "さくら保育園"], "新しい順・空白除去・園名なしの補完");
assert.ok(!JSON.stringify(s).includes("非表示"), "担当者名を出さない");
assert.ok(!JSON.stringify(s).includes("@"), "メールを出さない");
assert.equal(summarizeUsers([]).total, 0);
console.log("ok 集計（件数・確認済み・並び順・個人情報を出さない）");
console.log("\n全2件 合格");
