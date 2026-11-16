# 会員数ページ（管理者用）

## CLAUDE.md（概要）
- 場所：`/admin/members`（ログイン必須。管理者のメールだけが見られる）
- 表示：登録数、メール確認済みの数、園名・登録日・メール確認の一覧（新しい順）
- 会員＝Supabase の登録ユーザー。件数は `auth.users` から数える
- コード：`lib/members.ts`、`app/admin/members/page.tsx`。テスト：`npx tsx scripts/test-members.mts`

## Rules（非自明な制約）
- Vercel の環境変数が2つ必要：`SUPABASE_SERVICE_ROLE_KEY`（Supabase → Project Settings → API の service_role）、`ADMIN_EMAILS`（管理者のログインメール。カンマ区切り）
- `ADMIN_EMAILS` が未設定なら、誰も見られない（全員に「権限がありません」と出る）
- service_role キーは全権限のキー。サーバー側（このページ）だけで使い、`NEXT_PUBLIC_` を付けない。GitHub・チャットに貼らない
- メールアドレスと担当者名は画面に出さない。ページ内のリンクもない（URLを直接開く）
- `ADMIN_EMAILS` は、アプリにログインするメールで書く（Drive のアカウントとは限らない）

## Hooks（失敗時の動作）
- キー未設定、または Supabase に接続できない場合は、ページ上に理由を表示する。他のページには影響しない

## 完了条件（証拠）
- 管理者のメールでログインして `/admin/members` を開くと、件数が表示される
- 管理者でないメールでは「権限がありません」と出る
- 件数が、Supabase の Authentication → Users の件数と一致する
