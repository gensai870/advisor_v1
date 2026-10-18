"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Eye, EyeOff, Mail, Lock, Loader2, KeyRound, Building2, User } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

const CHECKLIST = ["現場に役立つ情報", "すぐに使える指導案・教材", "AIによるなんでも相談"];

const INVITE_CODE = "gensai_infants";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    if (searchParams.get("mode") === "signup") {
      setMode("signup");
    }
  }, [searchParams]);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [orgName, setOrgName] = useState("");
  const [contactName, setContactName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(
          error.message === "Invalid login credentials"
            ? "メールアドレスまたはパスワードが正しくありません。"
            : error.message
        );
        return;
      }
      router.push("/home");
      router.refresh();
    } else {
      if (inviteCode.trim() !== INVITE_CODE) {
        setLoading(false);
        setError("招待コードが正しくありません。");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            organization_name: orgName.trim(),
            contact_name: contactName.trim(),
          },
        },
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      if (data.session) {
        router.push("/home");
        router.refresh();
      } else {
        setMessage("確認メールを送信しました。メール内のリンクからログインを完了してください。");
      }
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="relative flex flex-col justify-between bg-gradient-to-b from-skyish to-mint p-10">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="乳幼児防災AIアドバイザー"
            width={1000}
            height={268}
            className="h-auto w-64 max-w-full sm:w-72"
          />
          <h2 className="mt-8 text-2xl font-bold leading-snug text-ink">
            学ぶ。つながる。
            <br />
            子どもたちの、
            <br />
            より安心な未来のために。
          </h2>
          <ul className="mt-8 space-y-3">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-ink">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-coral">
                  <Check size={12} strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-ink">{mode === "login" ? "ログイン" : "新規登録"}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {mode === "login"
              ? "アカウントにログインしてサービスをご利用ください。"
              : "メールアドレスとパスワードでアカウントを作成します。"}
          </p>

          {mode === "signup" && (
            <>
              <label className="mt-6 block text-xs font-medium text-ink-soft">招待コード</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2.5">
                <KeyRound size={16} className="text-ink-soft" />
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="事務局から案内された招待コード"
                  className="w-full text-sm outline-none"
                />
              </div>

              <label className="mt-4 block text-xs font-medium text-ink-soft">組織名（施設名）</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2.5">
                <Building2 size={16} className="text-ink-soft" />
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="〇〇保育園"
                  className="w-full text-sm outline-none"
                />
              </div>

              <label className="mt-4 block text-xs font-medium text-ink-soft">担当者名</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2.5">
                <User size={16} className="text-ink-soft" />
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="山田 太郎"
                  className="w-full text-sm outline-none"
                />
              </div>
            </>
          )}

          <label className="mt-6 block text-xs font-medium text-ink-soft">メールアドレス</label>
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2.5">
            <Mail size={16} className="text-ink-soft" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full text-sm outline-none"
            />
          </div>

          <label className="mt-4 block text-xs font-medium text-ink-soft">パスワード</label>
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2.5">
            <Lock size={16} className="text-ink-soft" />
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-sm outline-none"
            />
            <button type="button" onClick={() => setShowPassword((s) => !s)}>
              {showPassword ? (
                <EyeOff size={16} className="text-ink-soft" />
              ) : (
                <Eye size={16} className="text-ink-soft" />
              )}
            </button>
          </div>

          {error && <p className="mt-3 text-xs font-medium text-coral">{error}</p>}
          {message && <p className="mt-3 text-xs font-medium text-emerald-600">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-coral py-3 text-sm font-bold text-white hover:bg-coral-dark disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === "login" ? "ログイン" : "アカウントを作成"}
          </button>

          <p className="mt-6 text-center text-xs text-ink-soft">
            {mode === "login" ? (
              <>
                アカウントをお持ちでない方{" "}
                <button
                  type="button"
                  className="text-coral"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setMessage(null);
                  }}
                >
                  新規登録はこちら
                </button>
              </>
            ) : (
              <>
                すでにアカウントをお持ちの方{" "}
                <button
                  type="button"
                  className="text-coral"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setMessage(null);
                  }}
                >
                  ログインはこちら
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
