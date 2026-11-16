// 使い方: npx tsx scripts/test-drive-log.mts   （Google には接続しない。fetch を差し替えて検証）
import assert from "node:assert/strict";
import { logChatToDrive, logImageToDrive, createAccountFolderOnSignup, __setAccountProvider } from "../lib/drive-log.ts";

type Call = { url: string; method: string; body: string };
let calls: Call[] = [];
let respond: (c: Call) => { status?: number; json?: unknown } = () => ({ json: {} });
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: any, init: any = {}) => {
  const body = init.body ? (Buffer.isBuffer(init.body) ? init.body.toString("utf8") : String(init.body)) : "";
  const c = { url: String(input), method: init.method ?? "GET", body };
  calls.push(c);
  const r = respond(c);
  return new Response(JSON.stringify(r.json ?? {}), { status: r.status ?? 200 });
}) as any;
const settle = () => new Promise((r) => setTimeout(r, 60));
const ENV = ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REFRESH_TOKEN", "GOOGLE_DRIVE_CHAT_FOLDER_ID"];
const clearEnv = () => ENV.forEach((k) => delete process.env[k]);
const setEnv = () => {
  process.env.GOOGLE_OAUTH_CLIENT_ID = "id";
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = "secret";
  process.env.GOOGLE_OAUTH_REFRESH_TOKEN = "refresh";
};
__setAccountProvider(async () => ({ id: "user-uuid-1", email: "enatsu@gensai.or.jp" }));
const msgs = [{ role: "user" as const, content: "減災教育って何？" }];

// 1. 認証情報なし → 何もしない
clearEnv(); calls = [];
logChatToDrive("consult", msgs, "回答"); await settle();
assert.equal(calls.length, 0);
console.log("ok 1 認証情報なし：何もしない");

// 2. 新規アカウント・新規会話 → フォルダ作成 → ファイル作成
setEnv(); calls = [];
let listN = 0;
respond = (c) => {
  if (c.url.includes("oauth2.googleapis.com")) return { json: { access_token: "tok", expires_in: 3600 } };
  if (c.method === "GET") { listN++; return { json: { files: [] } }; }
  return { json: { id: "newid" + calls.length } };
};
logChatToDrive("consult", msgs, "回答です"); await settle();
const urls = calls.map((c) => `${c.method} ${decodeURIComponent(c.url).slice(0, 90)}`);
assert.ok(calls[0].url.includes("oauth2"), "最初にトークン取得");
const folderQ = decodeURIComponent(calls[1].url);
assert.match(folderQ, /138UXW_XqyMr2BOo8LRIJz6XeD5vKScPf' in parents/, "既定の保存先フォルダ(chat_db)の下を探す");
assert.match(folderQ, /key='accountId' and value='user-uuid-1'/, "アカウントIDで探す");
const mk = calls.find((c) => c.method === "POST" && c.body.includes("application/vnd.google-apps.folder"))!;
assert.ok(mk.body.includes('"accountId":"user-uuid-1"') && mk.body.includes('"name":"enatsu"'), "アカウントIDを持つフォルダを作る");
const up = calls.find((c) => c.method === "POST" && c.url.includes("uploadType=multipart"))!;
assert.ok(up.body.includes("## ユーザー") && up.body.includes("減災教育って何？") && up.body.includes("回答です"), "会話本文を保存");
assert.ok(up.body.includes("user-uuid-1"), "ログにアカウントIDを記載");
console.log("ok 2 新規：フォルダ作成→ファイル作成");

// 3. 同じ会話の2往復目 → 更新(PATCH)。フォルダはキャッシュ
calls = [];
respond = (c) => {
  if (c.url.includes("oauth2")) return { json: { access_token: "tok", expires_in: 3600 } };
  if (c.method === "GET") return { json: { files: [{ id: "file1", name: "x" }] } };
  return { json: { id: "file1" } };
};
const msgs2 = [...msgs, { role: "assistant" as const, content: "回答です" }, { role: "user" as const, content: "もっと詳しく" }];
logChatToDrive("consult", msgs2, "詳しい回答"); await settle();
const patch = calls.find((c) => c.method === "PATCH")!;
assert.ok(patch && patch.url.includes("/files/file1") && patch.body.includes("詳しい回答") && patch.body.includes("回答です"), "同じ会話は上書き更新");
assert.ok(!calls.some((c) => c.method === "POST" && c.url.includes("uploadType=multipart")), "新規作成しない");
console.log("ok 3 2往復目：同じファイルを更新");

// 4. Drive エラー → 例外を出さない
calls = [];
respond = (c) => (c.url.includes("oauth2") ? { json: { access_token: "tok", expires_in: 3600 } } : { status: 500 });
const msgs3 = [{ role: "user" as const, content: "別の質問" }];
logChatToDrive("chat", msgs3, "x"); await settle();
console.log("ok 4 Driveエラー：例外なし");

// 5. 画像 → images フォルダを作って PNG を保存
calls = [];
respond = (c) => {
  if (c.url.includes("oauth2")) return { json: { access_token: "tok", expires_in: 3600 } };
  if (c.method === "GET") return { json: { files: [] } };
  return { json: { id: "imgid" } };
};
logImageToDrive("保育室の防災イラスト", Buffer.from("PNGDATA").toString("base64")); await settle();
const imgFolder = calls.find((c) => c.method === "POST" && c.body.includes('"name":"images"'));
const imgUp = calls.find((c) => c.method === "POST" && c.url.includes("uploadType=multipart"));
assert.ok(imgFolder, "images フォルダを作る");
assert.ok(imgUp && imgUp.body.includes("image/png") && imgUp.body.includes("PNGDATA") && imgUp.body.includes("保育室の防災イラスト"), "PNGとプロンプトを保存");
console.log("ok 5 画像：imagesフォルダに保存");

// 6. ログイン前（アカウントなし）→ 保存しない
calls = [];
__setAccountProvider(async () => null);
respond = (c) => (c.url.includes("oauth2") ? { json: { access_token: "tok", expires_in: 3600 } } : { json: { files: [] } });
logChatToDrive("consult", [{ role: "user", content: "q2" }], "a"); await settle();
assert.ok(!calls.some((c) => c.method === "POST" && c.url.includes("upload")), "未ログインは保存しない");
console.log("ok 6 未ログイン：保存しない");

// 7. 会員登録と同時 → 園名入りのアカウントフォルダだけを作る（ファイルは作らない）
__setAccountProvider(async () => null);
calls = [];
respond = (c) => (c.url.includes("oauth2") ? { json: { access_token: "tok", expires_in: 3600 } } : c.method === "GET" ? { json: { files: [] } } : { json: { id: "folderX" } });
createAccountFolderOnSignup({ id: "new-user-uuid-9", email: "sakura@example.jp", user_metadata: { organization_name: "さくら保育園", contact_name: "園長" } }); await settle();
const su = calls.find((c) => c.method === "POST" && c.body.includes("application/vnd.google-apps.folder"))!;
assert.ok(su, "登録と同時にフォルダを作る");
assert.ok(su.body.includes('"accountId":"new-user-uuid-9"') && su.body.includes("さくら保育園_new-user"), "園名＋IDのフォルダ名・アカウントIDを記録");
assert.ok(!calls.some((c) => c.url.includes("uploadType")), "ファイルは作らない");
console.log("ok 7 会員登録と同時：アカウントフォルダを作成");

// 8. 2回呼んでも二重に作らない（キャッシュ）／Drive側に既にある場合も作らない
calls = [];
createAccountFolderOnSignup({ id: "new-user-uuid-9", email: "sakura@example.jp", user_metadata: { organization_name: "さくら保育園" } }); await settle();
assert.ok(!calls.some((c) => c.method === "POST" && c.body.includes("folder")), "2回目は作らない");
calls = [];
respond = (c) => (c.url.includes("oauth2") ? { json: { access_token: "tok", expires_in: 3600 } } : c.method === "GET" ? { json: { files: [{ id: "exists", name: "既存" }] } } : { json: { id: "x" } });
createAccountFolderOnSignup({ id: "other-user-uuid-3", email: "b@example.jp", user_metadata: {} }); await settle();
assert.ok(!calls.some((c) => c.method === "POST"), "Driveに既にあれば作らない");
console.log("ok 8 二重作成しない");

// 9. 認証情報なし → 何もしない
clearEnv(); calls = [];
createAccountFolderOnSignup({ id: "u", email: "u@example.jp" }); await settle();
assert.equal(calls.length, 0);
console.log("ok 9 認証情報なし：何もしない");

globalThis.fetch = realFetch;
console.log("\n全9件 合格");
