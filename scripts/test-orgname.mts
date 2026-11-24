// 使い方: npx tsx scripts/test-orgname.mts
import assert from "node:assert/strict";
import React, { createElement } from "react";
(globalThis as any).React = React; // tsx は classic JSX のため、React をグローバルに置く（Next 本体は自動ランタイム）
import { renderToString } from "react-dom/server";
import * as mod from "../components/OrgNameSlot.tsx";

// tsx（CommonJS）では、default が二重になる場合があるため吸収する
const m: any = (mod as any).default && typeof (mod as any).default === "object" ? (mod as any).default : mod;
const OrgNameSlot: any = typeof m.default === "function" ? m.default : (mod as any).default;
const validateOrgName: any = m.validateOrgName ?? (mod as any).validateOrgName;
const saveOrgName: any = m.saveOrgName ?? (mod as any).saveOrgName;

const noop = () => {};
const html = (v: string | null | undefined) => renderToString(createElement(OrgNameSlot, { orgName: v, onSaved: noop }));

// 表示：取得中／園名あり／未登録
assert.ok(!html(undefined).includes("園名を登録"), "取得中は、ボタンを出さない");
assert.ok(html("さくら保育園").includes("さくら保育園") && !html("さくら保育園").includes("園名を登録"), "園名があれば、園名を表示（ボタンなし）");
assert.ok(html(null).includes("園名を登録") && !html(null).includes("幼稚園・保育園"), "未登録なら、「園名を登録」を表示");
assert.ok(!html(null).includes("保存"), "初期状態では、入力欄を閉じている");
console.log("ok 表示（取得中／園名あり／未登録）");

// 入力チェック
assert.deepEqual(validateOrgName("  さくら保育園  "), { ok: true, value: "さくら保育園" });
assert.equal(validateOrgName("   ").ok, false);
assert.equal(validateOrgName("あ".repeat(61)).ok, false);
assert.equal(validateOrgName("あ".repeat(60)).ok, true);
console.log("ok 入力チェック");

// 保存：organization_name だけを送る／エラーは文言に変換／入力不正は送信しない
let sent: any = null;
const okClient = { auth: { updateUser: async (a: any) => ((sent = a), { error: null }) } };
const r1 = await saveOrgName(okClient, " ひまわり園 ");
assert.deepEqual(r1, { ok: true, value: "ひまわり園" });
assert.deepEqual(sent, { data: { organization_name: "ひまわり園" } }, "送るのは organization_name のみ");
sent = null;
const r2 = await saveOrgName(okClient, "");
assert.equal(r2.ok, false); assert.equal(sent, null, "入力不正は送信しない");
const ngClient = { auth: { updateUser: async () => ({ error: { message: "secret detail" } }) } };
const r3 = await saveOrgName(ngClient, "ひまわり園");
assert.equal(r3.ok, false);
assert.ok(!JSON.stringify(r3).includes("secret"), "内部のエラー文言は、画面に出さない");
console.log("ok 保存（送信内容・入力不正・エラー）");
console.log("\n全3件 合格");
