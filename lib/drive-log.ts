import { createHash } from "node:crypto";
import { waitUntil } from "@vercel/functions";
import { createClient } from "@/lib/supabase-server";

/**
 * チャット履歴・生成画像を Google ドライブに保存する。
 * 保存先：<GOOGLE_DRIVE_CHAT_FOLDER_ID>/<アカウントのフォルダ>/（画像は /images/）
 * アカウントの特定は Supabase の user.id。フォルダの appProperties.accountId に user.id を持たせて紐付ける。
 * 認証情報が未設定なら何もしない。保存に失敗しても、チャットの応答には影響させない。
 */

const DEFAULT_ROOT_FOLDER_ID = "138UXW_XqyMr2BOo8LRIJz6XeD5vKScPf"; // Rita/chat_db
const FOLDER_MIME = "application/vnd.google-apps.folder";

type Msg = { role: "user" | "assistant"; content: string };
type Account = { id: string; email: string | null; orgName?: string | null };

function config() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  return {
    clientId,
    clientSecret,
    refreshToken,
    rootFolderId: process.env.GOOGLE_DRIVE_CHAT_FOLDER_ID || DEFAULT_ROOT_FOLDER_ID,
  };
}

let tokenCache: { token: string; expiresAt: number } | null = null;

async function accessToken(c: NonNullable<ReturnType<typeof config>>): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: c.clientId,
      client_secret: c.clientSecret,
      refresh_token: c.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`token ${res.status}`);
  const j = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: j.access_token, expiresAt: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

async function drive(c: NonNullable<ReturnType<typeof config>>, url: string, init: RequestInit = {}) {
  const token = await accessToken(c);
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers as Record<string, string> | undefined) },
  });
  if (!res.ok) throw new Error(`drive ${res.status}`);
  return res;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

async function list(c: NonNullable<ReturnType<typeof config>>, q: string): Promise<{ id: string; name: string }[]> {
  const url =
    "https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&includeItemsFromAllDrives=true" +
    `&fields=${encodeURIComponent("files(id,name)")}&pageSize=5&q=${encodeURIComponent(q)}`;
  const res = await drive(c, url);
  return ((await res.json()) as { files?: { id: string; name: string }[] }).files ?? [];
}

async function createFolder(
  c: NonNullable<ReturnType<typeof config>>,
  parentId: string,
  name: string,
  appProperties: Record<string, string>
): Promise<string> {
  const res = await drive(c, "https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId], appProperties }),
  });
  return ((await res.json()) as { id: string }).id;
}

const folderCache = new Map<string, string>();

async function accountFolder(c: NonNullable<ReturnType<typeof config>>, a: Account): Promise<string> {
  const hit = folderCache.get(a.id);
  if (hit) return hit;
  const found = await list(
    c,
    `'${esc(c.rootFolderId)}' in parents and mimeType='${FOLDER_MIME}' and trashed=false and appProperties has { key='accountId' and value='${esc(a.id)}' }`
  );
  let id = found[0]?.id;
  if (!id) {
    // フォルダ名：園名（登録時の入力）＋ID先頭8文字。園名がなければメールの@前
    const base = a.orgName?.trim() ? `${a.orgName.trim()}_${a.id.slice(0, 8)}` : a.email?.split("@")[0] || a.id;
    const label = base.replace(/[\\/:*?"<>|]/g, "_").slice(0, 80);
    id = await createFolder(c, c.rootFolderId, label, { accountId: a.id });
  }
  folderCache.set(a.id, id);
  return id;
}

async function subFolder(c: NonNullable<ReturnType<typeof config>>, parentId: string, name: string): Promise<string> {
  const key = `${parentId}/${name}`;
  const hit = folderCache.get(key);
  if (hit) return hit;
  const found = await list(
    c,
    `'${esc(parentId)}' in parents and mimeType='${FOLDER_MIME}' and trashed=false and name='${esc(name)}'`
  );
  const id = found[0]?.id ?? (await createFolder(c, parentId, name, {}));
  folderCache.set(key, id);
  return id;
}

function multipart(metadata: object, mime: string, body: string | Buffer) {
  const boundary = "gensai" + Math.random().toString(36).slice(2);
  const head = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`;
  const payload = Buffer.concat([Buffer.from(head), Buffer.isBuffer(body) ? body : Buffer.from(body, "utf8"), Buffer.from(`\r\n--${boundary}--`)]);
  return { payload, contentType: `multipart/related; boundary=${boundary}` };
}

function conversationMarkdown(a: Account, source: string, messages: Msg[]): string {
  const lines = [
    `# 会話ログ`,
    ``,
    `- アカウントID: ${a.id}`,
    `- メール: ${a.email ?? "（なし）"}`,
    `- 種別: ${source}`,
    `- 更新: ${new Date().toISOString()}`,
    ``,
  ];
  for (const m of messages) {
    lines.push(m.role === "user" ? "## ユーザー" : "## AI", "", m.content, "");
  }
  return lines.join("\n");
}

async function supabaseAccount(): Promise<Account | null> {
  const { data } = await createClient().auth.getUser();
  return data.user ? toAccount(data.user) : null;
}

function toAccount(u: { id: string; email?: string | null; user_metadata?: Record<string, any> | null }): Account {
  const org = u.user_metadata?.organization_name;
  return { id: u.id, email: u.email ?? null, orgName: typeof org === "string" ? org : null };
}

let currentAccount: () => Promise<Account | null> = supabaseAccount;
/** テスト用：アカウント取得を差し替える */
export function __setAccountProvider(fn: () => Promise<Account | null>) {
  currentAccount = fn;
}

async function saveConversation(source: string, messages: Msg[], reply: string) {
  const c = config();
  if (!c) return;
  const account = await currentAccount();
  if (!account) return;
  const full: Msg[] = [...messages, { role: "assistant", content: reply }];
  const first = messages.find((m) => m.role === "user")?.content ?? "";
  const cid = createHash("sha1").update(`${account.id}|${source}|${first}`).digest("hex").slice(0, 16);

  const folder = await accountFolder(c, account);
  const existing = await list(
    c,
    `'${esc(folder)}' in parents and trashed=false and appProperties has { key='cid' and value='${cid}' }`
  );
  const text = conversationMarkdown(account, source, full);
  if (existing[0]) {
    await drive(c, `https://www.googleapis.com/upload/drive/v3/files/${existing[0].id}?uploadType=media&supportsAllDrives=true`, {
      method: "PATCH",
      headers: { "Content-Type": "text/plain; charset=UTF-8" },
      body: text,
    });
  } else {
    const name = `${new Date().toISOString().slice(0, 10)}_${source}_${cid.slice(0, 8)}.md`;
    const { payload, contentType } = multipart(
      { name, parents: [folder], mimeType: "text/plain", appProperties: { cid, accountId: account.id, source } },
      "text/plain; charset=UTF-8",
      text
    );
    await drive(c, "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id", {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: payload,
    });
  }
}

async function saveImage(prompt: string, b64: string) {
  const c = config();
  if (!c) return;
  const account = await currentAccount();
  if (!account) return;
  const folder = await subFolder(c, await accountFolder(c, account), "images");
  const name = `${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
  const { payload, contentType } = multipart(
    { name, parents: [folder], mimeType: "image/png", description: prompt.slice(0, 500), appProperties: { accountId: account.id } },
    "image/png",
    Buffer.from(b64, "base64")
  );
  await drive(c, "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: payload,
  });
}

function background(task: Promise<void>, label: string) {
  const safe = task.catch((e) => console.error(`[drive-log] ${label} failed:`, e?.message ?? "error"));
  try {
    waitUntil(safe);
  } catch {
    /* Vercel 以外では、そのまま非同期に走らせる */
  }
}

/** チャット1往復分を保存（応答は待たせない・失敗しても無視） */
export function logChatToDrive(source: string, messages: Msg[], reply: string): void {
  if (!config()) return;
  background(saveConversation(source, messages, reply), "chat");
}

/** 生成画像を保存（応答は待たせない・失敗しても無視） */
export function logImageToDrive(prompt: string, b64: string): void {
  if (!config()) return;
  background(saveImage(prompt, b64), "image");
}

/**
 * 会員登録と同時に、アカウントのフォルダを作る（すでにあれば何もしない）。
 * user を渡さない場合は、ログイン中のユーザーを使う。応答は待たせない・失敗しても無視。
 */
export function createAccountFolderOnSignup(
  user?: { id: string; email?: string | null; user_metadata?: Record<string, any> | null } | null
): void {
  const c = config();
  if (!c) return;
  background(
    (async () => {
      const account = user ? toAccount(user) : await currentAccount();
      if (!account) return;
      await accountFolder(c, account);
    })(),
    "signup-folder"
  );
}
