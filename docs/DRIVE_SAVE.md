# Drive保存（チャット履歴・生成画像）

## CLAUDE.md（概要）
- 保存先：`Rita/chat_db`（フォルダID `138UXW_XqyMr2BOo8LRIJz6XeD5vKScPf`）の下に、アカウントごとのフォルダ。画像は `<アカウント>/images/`
- アカウントの紐付け：Supabase の `user.id` を、フォルダの `appProperties.accountId` に持たせる。フォルダ名は「園名_ID先頭8文字」（園名は登録時の `organization_name`。なければメールの@前）
- フォルダは会員登録と同時に作る：①確認メールのリンク経由は `/auth/callback`、②確認メールなしで登録直後にログインした場合は、ログイン画面から `/api/account/init` を呼ぶ。すでにあれば作らない。登録前に作られたアカウントは、最初のチャット保存時に作られる
- 会話は1会話＝1ファイル（`日付_種別_ID.md`）。往復のたびに同じファイルを上書き
- 対象：`/api/chat`、`/api/chat-general`、`/api/materials-chat`、`/api/consult`、`/api/generate-image`
- コード：`lib/drive-log.ts`、`app/api/account/init/route.ts`、`app/auth/callback/route.ts`、`app/login/page.tsx`。テスト：`npx tsx scripts/test-drive-log.mts`

## Rules（非自明な制約）
- Vercel の環境変数 `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` / `GOOGLE_OAUTH_REFRESH_TOKEN` が揃っていないと、何もしない（チャットは通常どおり動く）
- 保存先がマイドライブのため、サービスアカウントは使えない（容量ゼロで保存に失敗する）。フォルダの所有者のアカウントで取得した refresh token を使う
- 手元のフォルダを読み書きするため、スコープは `https://www.googleapis.com/auth/drive`（全体）。`drive.file` では既存フォルダに書けない
- OAuth 同意画面の「ユーザーの種類」は **内部**。外部（テスト中）だと refresh token が7日で失効する
- 既存の手作りフォルダ（`enatsu`、`gensai870`）には `accountId` が付いていないため、紐付かず、別名のフォルダが新規作成される。必要なら、そのフォルダに `accountId` を付ける
- 会話のIDは、アカウント＋種別＋最初の質問から作る。`/api/consult` は直近20件のみ送るため、20件を超えると別ファイルになる

## Hooks（失敗時の動作）
- 保存の失敗は、ログに `[drive-log] … failed: <状態>` と出すだけ。チャットの応答には影響しない
- 未ログインのリクエストは保存しない

## 完了条件（証拠）
- 新規に会員登録すると、`chat_db` の下に「園名_ID」のフォルダができる（確認メールあり／なしの両方）
- 本番で1往復したあと、Drive の該当アカウントのフォルダに `.md` が1つできて、2往復目で同じファイルが更新される
- 画像生成後、`images/` に PNG ができる
- Vercel のログに `[drive-log]` の失敗が出ていない
